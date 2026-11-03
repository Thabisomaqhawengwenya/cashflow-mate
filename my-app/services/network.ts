import * as Network from 'expo-network';
import { Platform } from 'react-native';

export type ConnectionMode = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';

export interface NetworkConnectionState {
  isConnected: boolean;
  isWifi: boolean;
  isCellular: boolean;
  connectionType: ConnectionMode;
  details: string;
}

let simulatedWifiOverride: boolean | null = null;

export class MobileNetworkService {
  /**
   * Set simulated Wi-Fi state for testing/demoing (null resets to real device state)
   */
  static setSimulatedWifiOverride(override: boolean | null) {
    simulatedWifiOverride = override;
  }

  /**
   * Get current simulated override if any
   */
  static getSimulatedWifiOverride(): boolean | null {
    return simulatedWifiOverride;
  }

  /**
   * Check whether current device has an active Wi-Fi connection
   */
  static async checkConnection(): Promise<NetworkConnectionState> {
    // If simulation override is active, return simulated state
    if (simulatedWifiOverride !== null) {
      if (simulatedWifiOverride) {
        return {
          isConnected: true,
          isWifi: true,
          isCellular: false,
          connectionType: 'wifi',
          details: 'Connected to Wi-Fi Network',
        };
      } else {
        return {
          isConnected: false,
          isWifi: false,
          isCellular: false,
          connectionType: 'none',
          details: 'Not connected to Wi-Fi (Offline / No Wi-Fi)',
        };
      }
    }

    try {
      if (Platform.OS === 'web') {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        if (!isOnline) {
          return {
            isConnected: false,
            isWifi: false,
            isCellular: false,
            connectionType: 'none',
            details: 'Device is offline (No network connection detected)',
          };
        }

        // Web NetworkInformation API if available in Chromium
        const conn = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
        if (conn) {
          const type = (conn.type || '').toLowerCase();
          const effectiveType = (conn.effectiveType || '').toLowerCase();

          if (type === 'cellular' || effectiveType === '2g' || effectiveType === 'slow-2g') {
            return {
              isConnected: true,
              isWifi: false,
              isCellular: true,
              connectionType: 'cellular',
              details: `Connected via Cellular Mobile Data (${effectiveType.toUpperCase() || 'Mobile'})`,
            };
          }

          if (type === 'wifi' || type === 'ethernet' || type === '') {
            return {
              isConnected: true,
              isWifi: true,
              isCellular: false,
              connectionType: type === 'ethernet' ? 'ethernet' : 'wifi',
              details: 'Connected to High-Speed Wi-Fi / Broadband Network',
            };
          }
        }

        // Standard web browser online
        return {
          isConnected: true,
          isWifi: true,
          isCellular: false,
          connectionType: 'wifi',
          details: 'Connected to Internet (Browser Network Active)',
        };
      }

      // Native iOS & Android via expo-network
      const state = await Network.getNetworkStateAsync();
      const isConnected = !!(state.isConnected && state.isInternetReachable !== false);
      const isWifi = isConnected && state.type === Network.NetworkStateType.WIFI;
      const isCellular = isConnected && state.type === Network.NetworkStateType.CELLULAR;

      let connType: ConnectionMode = 'unknown';
      if (!isConnected || state.type === Network.NetworkStateType.NONE) {
        connType = 'none';
      } else if (isWifi) {
        connType = 'wifi';
      } else if (isCellular) {
        connType = 'cellular';
      } else if (state.type === Network.NetworkStateType.ETHERNET) {
        connType = 'ethernet';
      }

      const details = !isConnected
        ? 'No active internet connection detected'
        : isWifi
        ? 'Connected to Wi-Fi Network'
        : isCellular
        ? 'Connected via Cellular Mobile Data (No Wi-Fi)'
        : 'Network connected';

      return {
        isConnected,
        isWifi,
        isCellular,
        connectionType: connType,
        details,
      };
    } catch {
      // Safe fallback
      return {
        isConnected: true,
        isWifi: true,
        isCellular: false,
        connectionType: 'wifi',
        details: 'Default Wi-Fi connection',
      };
    }
  }
}
