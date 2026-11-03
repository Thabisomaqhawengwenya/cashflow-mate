import { describe, it, expect, beforeEach, vi } from 'vitest';

(globalThis as any).__DEV__ = true;

vi.mock('expo-network', () => ({
  NetworkStateType: {
    UNKNOWN: 0,
    NONE: 1,
    CELLULAR: 2,
    WIFI: 3,
    ETHERNET: 5,
  },
  getNetworkStateAsync: vi.fn(async () => ({
    type: 3,
    isConnected: true,
    isInternetReachable: true,
  })),
}));

import { MobileNetworkService } from '../network';

describe('MobileNetworkService', () => {
  beforeEach(() => {
    MobileNetworkService.setSimulatedWifiOverride(null);
  });

  it('reports connected when simulated Wi-Fi is true', async () => {
    MobileNetworkService.setSimulatedWifiOverride(true);
    const status = await MobileNetworkService.checkConnection();
    expect(status.isConnected).toBe(true);
    expect(status.isWifi).toBe(true);
    expect(status.connectionType).toBe('wifi');
  });

  it('reports not connected to Wi-Fi when simulated Wi-Fi is false', async () => {
    MobileNetworkService.setSimulatedWifiOverride(false);
    const status = await MobileNetworkService.checkConnection();
    expect(status.isWifi).toBe(false);
    expect(status.connectionType).toBe('none');
  });

  it('resets simulated override cleanly', async () => {
    MobileNetworkService.setSimulatedWifiOverride(false);
    expect(MobileNetworkService.getSimulatedWifiOverride()).toBe(false);

    MobileNetworkService.setSimulatedWifiOverride(null);
    expect(MobileNetworkService.getSimulatedWifiOverride()).toBeNull();
  });
});
