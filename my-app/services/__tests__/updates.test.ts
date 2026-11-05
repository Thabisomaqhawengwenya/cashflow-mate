import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseSemver,
  isNewerVersion,
  parseReleaseBody,
  getSimulatedUpdate,
  MobileUpdateService,
  CURRENT_APP_VERSION,
} from '../updates';

describe('MobileUpdateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseSemver', () => {
    it('parses standard semver strings', () => {
      expect(parseSemver('1.3.0')).toEqual([1, 3, 0]);
      expect(parseSemver('v1.8.11')).toEqual([1, 8, 11]);
      expect(parseSemver('2.0.0')).toEqual([2, 0, 0]);
    });

    it('handles malformed or partial semver gracefully', () => {
      expect(parseSemver('1.2')).toEqual([1, 2, 0]);
      expect(parseSemver('3')).toEqual([3, 0, 0]);
      expect(parseSemver('invalid')).toEqual([0, 0, 0]);
    });
  });

  describe('isNewerVersion', () => {
    it('returns true when patch version is higher', () => {
      expect(isNewerVersion('1.3.0', '1.3.1')).toBe(true);
      expect(isNewerVersion('v1.3.0', 'v1.3.5')).toBe(true);
    });

    it('returns true when minor version is higher', () => {
      expect(isNewerVersion('1.3.0', '1.4.0')).toBe(true);
      expect(isNewerVersion('1.3.9', '1.4.0')).toBe(true);
    });

    it('returns true when major version is higher', () => {
      expect(isNewerVersion('1.3.0', '2.0.0')).toBe(true);
    });

    it('returns false when version is equal or lower', () => {
      expect(isNewerVersion('1.3.0', '1.3.0')).toBe(false);
      expect(isNewerVersion('1.3.1', '1.3.0')).toBe(false);
      expect(isNewerVersion('2.0.0', '1.9.9')).toBe(false);
    });
  });

  describe('parseReleaseBody', () => {
    it('parses markdown bold bullets correctly', () => {
      const markdown = `
### What's New
- **Instant Resume**: Refreshes expired audio links after pauses to eliminate playback stalls.
- **Call Recovery**: Fixed audio glitches after phone calls.
- **Cold Start**: Restores your state smoothly.
      `;
      const result = parseReleaseBody(markdown, '1.3.1');
      expect(result.items.length).toBe(3);
      expect(result.items[0]?.title).toBe('Instant Resume');
      expect(result.items[0]?.description).toContain('Refreshes expired audio links');
      expect(result.items[1]?.title).toBe('Call Recovery');
    });

    it('provides high quality fallbacks when release body is empty', () => {
      const result = parseReleaseBody('', '1.3.1');
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]?.title).toBe('Performance & Security');
    });
  });

  describe('getSimulatedUpdate', () => {
    it('returns a complete, verified update model for preview', () => {
      const update = getSimulatedUpdate('1.3.1');
      expect(update.hasUpdate).toBe(true);
      expect(update.currentVersion).toBe(CURRENT_APP_VERSION);
      expect(update.latestVersion).toBe('1.3.1');
      expect(update.apkSize).toBe('42.9 MB');
      expect(update.statusText).toContain('verified');
      expect(update.changelog.length).toBe(3);
    });
  });

  describe('checkForUpdate with mocked fetch', () => {
    it('detects a newer GitHub release', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.4.0',
          name: 'Cashflow v1.4.0 Production',
          html_url: 'https://github.com/Thabisomaqhawengwenya/cashflow-mate/releases/tag/v1.4.0',
          body: '- **Cloud DB**: Direct PostgreSQL sync.\n- **Z-Report**: Daily summary reports.',
          assets: [
            {
              name: 'Cashflow-v1.4.0.apk',
              size: 45000000,
              browser_download_url: 'https://example.com/Cashflow-v1.4.0.apk',
            },
          ],
        }),
      });

      const update = await MobileUpdateService.checkForUpdate(true);
      expect(update.hasUpdate).toBe(true);
      expect(update.latestVersion).toBe('1.4.0');
      expect(update.apkDownloadUrl).toBe('https://example.com/Cashflow-v1.4.0.apk');
      expect(update.changelog.length).toBe(2);
      expect(update.changelog[0]?.title).toBe('Cloud DB');
    });

    it('returns hasUpdate=false when remote release is identical to current', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: `v${CURRENT_APP_VERSION}`,
          name: `Cashflow v${CURRENT_APP_VERSION}`,
        }),
      });

      const update = await MobileUpdateService.checkForUpdate(true, false);
      expect(update.hasUpdate).toBe(false);
    });
  });
});
