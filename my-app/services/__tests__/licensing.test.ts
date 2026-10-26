/* eslint-disable import/first */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const memoryStore = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => memoryStore.get(key) || null),
    setItem: vi.fn(async (key: string, val: string) => {
      memoryStore.set(key, val);
    }),
    removeItem: vi.fn(async (key: string) => {
      memoryStore.delete(key);
    }),
    clear: vi.fn(async () => {
      memoryStore.clear();
    }),
  },
}));

import {
  generateLicenseKey,
  verifyLicenseKey,
  SAMPLE_WORKING_LICENSES,
  MobileLicenseService,
} from '../licensing';

describe('Mobile License Activation', () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  it('generates a Pro key that verifies', () => {
    const key = generateLicenseKey({ traderName: 'Rudo', tier: 'pro', expiresYear: 2028 });
    const license = verifyLicenseKey(key);
    expect(license.isValid).toBe(true);
    expect(license.tier).toBe('pro');
    expect(license.expiresAt).toBe('2028-12-31');
  });

  it('rejects forged keys and expired keys', () => {
    expect(verifyLicenseKey('CFM-PRO-RUDO-DEADBEEF').isValid).toBe(false);

    const expiredKey = generateLicenseKey({ traderName: 'Old', tier: 'pro', expiresYear: 2026 });
    const expired = verifyLicenseKey(expiredKey, new Date(2027, 0, 1));
    expect(expired.isValid).toBe(false);
    expect(expired.errorMessage?.toLowerCase()).toContain('expired');
  });

  it('defaults to Starter when no license is stored (no silent Pro)', async () => {
    const license = await MobileLicenseService.getActiveLicense();
    expect(license.tier).toBe('starter');
    expect(license.isValid).toBe(false);
    expect(license.key).toBe('');
  });

  it('activates and persists a valid key', async () => {
    const key = SAMPLE_WORKING_LICENSES[0].key;
    const activated = await MobileLicenseService.activateLicense(key);
    expect(activated.isValid).toBe(true);

    const reloaded = await MobileLicenseService.getActiveLicense();
    expect(reloaded.isValid).toBe(true);
    expect(reloaded.key).toBe(key);
  });

  it('ships only working sample keys', () => {
    for (const sample of SAMPLE_WORKING_LICENSES) {
      expect(verifyLicenseKey(sample.key).isValid).toBe(true);
    }
  });
});
