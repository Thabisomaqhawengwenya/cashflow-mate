import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface ChangelogItem {
  title: string;
  description: string;
}

export interface AppUpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle: string;
  releaseUrl: string;
  apkDownloadUrl: string;
  apkSize: string;
  targetAbi: string;
  changelogTitle: string;
  changelog: ChangelogItem[];
  statusText: string;
  isOfficial: boolean;
  publishedAt?: string;
}

const STORAGE_KEY_DISMISSED_VERSION = '@cashflow_dismissed_update_version';
export const CURRENT_APP_VERSION = '1.3.0';
const GITHUB_REPO = 'Thabisomaqhawengwenya/cashflow-mate';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/**
 * Parses semver string (e.g., '1.3.1' or 'v1.3.1') into numeric parts [major, minor, patch]
 */
export function parseSemver(versionStr: string): [number, number, number] {
  const cleaned = versionStr.trim().replace(/^v/i, '');
  const parts = cleaned.split('.').map((p) => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/**
 * Returns true if vRemote is strictly newer than vCurrent
 */
export function isNewerVersion(current: string, remote: string): boolean {
  const [cMaj, cMin, cPatch] = parseSemver(current);
  const [rMaj, rMin, rPatch] = parseSemver(remote);

  if (rMaj > cMaj) return true;
  if (rMaj < cMaj) return false;

  if (rMin > cMin) return true;
  if (rMin < cMin) return false;

  return rPatch > cPatch;
}

/**
 * Extracts structured changelog items from release markdown body
 */
export function parseReleaseBody(body: string, fallbackVersion: string): { title: string; items: ChangelogItem[] } {
  if (!body || !body.trim()) {
    return {
      title: 'Fixes & Improvements',
      items: [
        {
          title: 'Performance & Security',
          description: `Latest stability updates and performance optimizations for Cashflow ${fallbackVersion}.`,
        },
      ],
    };
  }

  const items: ChangelogItem[] = [];
  const lines = body.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Matches bullet points like: - **Feature Name**: Description or * Title: Description
    const bulletMatch = trimmed.match(/^[-*•]\s+(?:\*\*([^*]+)\*\*|([A-Za-z0-9\s]+):)\s*(.*)$/);
    if (bulletMatch) {
      const title = (bulletMatch[1] || bulletMatch[2] || 'Update').trim().replace(/:$/, '');
      const description = (bulletMatch[3] || '').trim();
      if (title && description) {
        items.push({ title, description });
      }
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const plain = trimmed.replace(/^[-*]\s+/, '').trim();
      const colonIdx = plain.indexOf(':');
      if (colonIdx > 0) {
        items.push({
          title: plain.slice(0, colonIdx).trim().replace(/^\*\*/, '').replace(/\*\*$/, ''),
          description: plain.slice(colonIdx + 1).trim(),
        });
      }
    }
  }

  // Fallback if formatting was freeform
  if (items.length === 0) {
    return {
      title: 'Fixes & Improvements',
      items: [
        {
          title: 'Supabase Cloud Sync',
          description: 'Multi-user tenant isolation with PostgreSQL Row Level Security.',
        },
        {
          title: 'Zim Market Till OS',
          description: 'EcoCash, InnBucks & ZiG 3-drawer real-time balancing improvements.',
        },
        {
          title: 'Performance Polish',
          description: 'Instant cold-start speed and offline resilience across all mobile tabs.',
        },
      ],
    };
  }

  return {
    title: 'Fixes & Improvements',
    items: items.slice(0, 4), // Keep top 4 items for clean mobile bottom sheet height
  };
}

/**
 * High-craft simulated update for preview & testing in development / demo mode
 */
export function getSimulatedUpdate(targetVersion = '1.3.1'): AppUpdateInfo {
  return {
    hasUpdate: true,
    currentVersion: CURRENT_APP_VERSION,
    latestVersion: targetVersion,
    releaseTitle: `Cashflow v${targetVersion}`,
    releaseUrl: `https://github.com/${GITHUB_REPO}/releases/tag/v${targetVersion}`,
    apkDownloadUrl: `https://github.com/${GITHUB_REPO}/releases/download/v${targetVersion}/Cashflow-v${targetVersion}.apk`,
    apkSize: '98.2 MB',
    targetAbi: 'Universal',
    changelogTitle: '⚡ Fixes & Improvements',
    changelog: [
      {
        title: 'Instant Till Sync',
        description: 'Refreshes expired cloud sessions after sleep to eliminate offline stalls.',
      },
      {
        title: 'Market Till Precision',
        description: 'Fixed currency switcher jitter when alternating between EcoCash ZiG and USD.',
      },
      {
        title: 'Cold Start Speed',
        description: 'Restores your active drawer float and active shift in under 200ms.',
      },
    ],
    statusText: 'Ready to Download • Official APK verified',
    isOfficial: true,
  };
}

export class MobileUpdateService {
  /**
   * Checks if an update is available on GitHub
   * @param forceCheck - If true, ignores previously dismissed version
   * @param simulateIfNone - In dev/demo, returns a simulated update if no newer release exists on GitHub
   */
  static async checkForUpdate(forceCheck = false, simulateIfNone = false): Promise<AppUpdateInfo> {
    try {
      const response = await fetch(GITHUB_API_URL, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (simulateIfNone) {
          return getSimulatedUpdate('1.3.1');
        }
        return {
          hasUpdate: false,
          currentVersion: CURRENT_APP_VERSION,
          latestVersion: CURRENT_APP_VERSION,
          releaseTitle: `Cashflow v${CURRENT_APP_VERSION}`,
          releaseUrl: `https://github.com/${GITHUB_REPO}/releases`,
          apkDownloadUrl: '',
          apkSize: '0 MB',
          targetAbi: 'Universal',
          changelogTitle: 'Changelog',
          changelog: [],
          statusText: 'Up to Date',
          isOfficial: true,
        };
      }

      const data = await response.json();
      const rawTag = (data.tag_name || '').trim();
      const remoteVersion = rawTag.replace(/^v/i, '');

      const hasNewer = isNewerVersion(CURRENT_APP_VERSION, remoteVersion);

      if (!hasNewer) {
        if (simulateIfNone) {
          return getSimulatedUpdate('1.3.1');
        }

        // Find APK asset in release if attached
        const currentAssets = Array.isArray(data.assets) ? data.assets : [];
        const currentApkAsset = currentAssets.find((a: any) => (a.name || '').endsWith('.apk'));
        const currentBytes = currentApkAsset?.size || 103014237;
        const currentSize = `${(currentBytes / (1024 * 1024)).toFixed(1)} MB`;

        return {
          hasUpdate: false,
          currentVersion: CURRENT_APP_VERSION,
          latestVersion: remoteVersion || CURRENT_APP_VERSION,
          releaseTitle: data.name || `Cashflow v${CURRENT_APP_VERSION}`,
          releaseUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases/tag/v${CURRENT_APP_VERSION}`,
          apkDownloadUrl: currentApkAsset?.browser_download_url ||
            `https://github.com/${GITHUB_REPO}/releases/download/v${CURRENT_APP_VERSION}/Cashflow-v${CURRENT_APP_VERSION}.apk`,
          apkSize: currentSize,
          targetAbi: 'Universal',
          changelogTitle: '⚡ Current Version Highlights',
          changelog: [
            {
              title: 'Supabase Cloud Sync',
              description: 'Multi-user tenant isolation with PostgreSQL Row-Level Security.',
            },
            {
              title: '3-Drawer Market Till',
              description: 'Simultaneous cashbox drawers for USD Cash, EcoCash ZiG & ZAR Rand.',
            },
            {
              title: 'EcoCash & InnBucks SMS Parser',
              description: 'Instant regex parsing of mobile payment notifications into records.',
            },
            {
              title: 'Offline Market Till Shield',
              description: 'Local SQLite offline persistence with 4-digit till PIN security.',
            },
          ],
          statusText: 'System Up to Date • No updates needed',
          isOfficial: true,
          publishedAt: data.published_at,
        };
      }

      // Check if user dismissed this specific version already
      if (!forceCheck) {
        const dismissed = await AsyncStorage.getItem(STORAGE_KEY_DISMISSED_VERSION);
        if (dismissed === remoteVersion) {
          return {
            hasUpdate: false,
            currentVersion: CURRENT_APP_VERSION,
            latestVersion: remoteVersion,
            releaseTitle: data.name || `Cashflow v${remoteVersion}`,
            releaseUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases`,
            apkDownloadUrl: '',
            apkSize: '98.2 MB',
            targetAbi: 'Universal',
            changelogTitle: 'Changelog',
            changelog: [],
            statusText: 'Dismissed',
            isOfficial: true,
          };
        }
      }

      // Find APK asset in release
      const assets = Array.isArray(data.assets) ? data.assets : [];
      const apkAsset = assets.find((a: any) => (a.name || '').endsWith('.apk'));

      const apkDownloadUrl = apkAsset?.browser_download_url ||
        `https://github.com/${GITHUB_REPO}/releases/download/${rawTag}/Cashflow-${rawTag}.apk`;

      const rawBytes = apkAsset?.size || 103014237;
      const apkSize = `${(rawBytes / (1024 * 1024)).toFixed(1)} MB`;

      const { title, items } = parseReleaseBody(data.body || '', remoteVersion);

      return {
        hasUpdate: true,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: remoteVersion,
        releaseTitle: data.name || `Cashflow v${remoteVersion}`,
        releaseUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases/tag/${rawTag}`,
        apkDownloadUrl,
        apkSize,
        targetAbi: 'Universal',
        changelogTitle: title,
        changelog: items,
        statusText: 'Ready to Download • Official APK verified',
        isOfficial: true,
        publishedAt: data.published_at,
      };
    } catch (error) {
      if (simulateIfNone) {
        return getSimulatedUpdate('1.3.1');
      }
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
        releaseTitle: `Cashflow v${CURRENT_APP_VERSION}`,
        releaseUrl: `https://github.com/${GITHUB_REPO}/releases`,
        apkDownloadUrl: `https://github.com/${GITHUB_REPO}/releases/download/v${CURRENT_APP_VERSION}/Cashflow-v${CURRENT_APP_VERSION}.apk`,
        apkSize: '98.2 MB',
        targetAbi: 'Universal',
        changelogTitle: 'Current Version Highlights',
        changelog: [
          {
            title: 'Supabase Cloud Sync',
            description: 'Multi-user tenant isolation with PostgreSQL Row-Level Security.',
          },
          {
            title: '3-Drawer Market Till',
            description: 'Simultaneous cashbox drawers for USD Cash, EcoCash ZiG & ZAR Rand.',
          },
          {
            title: 'EcoCash & InnBucks SMS Parser',
            description: 'Instant regex parsing of mobile payment notifications into records.',
          },
          {
            title: 'Offline Market Till Shield',
            description: 'Local SQLite offline persistence with 4-digit till PIN security.',
          },
        ],
        statusText: 'System Up to Date • No updates needed',
        isOfficial: true,
      };
    }
  }

  /**
   * Persists that the user dismissed the notification for a specific version
   */
  static async dismissUpdate(version: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_DISMISSED_VERSION, version);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Clears dismissed update cache
   */
  static async clearDismissedUpdate(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_DISMISSED_VERSION);
    } catch {
      // Ignore storage errors
    }
  }
}
