import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { generateLicenseKey, verifyLicenseKey, WORKING_TEST_LICENSES } from './licensing';
import { hmacSha256 } from './crypto';

describe('Pure HMAC-SHA256', () => {
  it('matches Node crypto reference vectors', () => {
    const vectors = [
      { key: 'key', message: 'The quick brown fox jumps over the lazy dog' },
      { key: 'CFM_ZIMBABWE_2026_HMAC_SHA256_OFFLINE_SECRET_KEY', message: 'PRO-MRQ-2028' },
      { key: 'x'.repeat(80), message: 'longer-than-block-size key' },
      { key: '', message: '' },
      { key: 'unicode-🔑', message: 'ZiG 2026' },
    ];

    for (const vector of vectors) {
      const expected = createHmac('sha256', vector.key).update(vector.message).digest('hex');
      expect(hmacSha256(vector.key, vector.message)).toBe(expected);
    }
  });
});

describe('Software Licensing Engine (HMAC-SHA256)', () => {
  it('generates valid Pro and Enterprise license keys with HMAC-SHA256 signature', () => {
    const key = generateLicenseKey({ traderName: 'MrQ', tier: 'pro', expiresYear: 2028 });
    expect(key).toMatch(/^CFM-PRO-MRQ-[0-9A-F]{8}$/);

    const verification = verifyLicenseKey(key);
    expect(verification.isValid).toBe(true);
    expect(verification.tier).toBe('pro');
    expect(verification.traderName).toBe('MRQ');
    expect(verification.expiresAt).toBe('2028-12-31');
    expect(verification.features.length).toBeGreaterThan(3);
  });

  it('rejects tampered or forged license keys', () => {
    const forged = 'CFM-PRO-MRQ-DEADBEEF';
    const result = verifyLicenseKey(forged);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Invalid license signature');
  });

  it('rejects malformed license formats', () => {
    const malformed = 'INVALID-FORMAT-KEY';
    const result = verifyLicenseKey(malformed);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Invalid license format');
  });

  it('verifies all pre-configured working test licenses', () => {
    for (const testLic of WORKING_TEST_LICENSES) {
      const result = verifyLicenseKey(testLic.key);
      expect(result.isValid).toBe(true);
      expect(result.tier).toBe(testLic.tier);
    }
  });

  it('rejects an expired license instead of honouring it forever', () => {
    const key = generateLicenseKey({ traderName: 'ExpiredTrader', tier: 'pro', expiresYear: 2026 });
    const result = verifyLicenseKey(key, new Date(2027, 0, 1));
    expect(result.isValid).toBe(false);
    expect(result.errorMessage?.toLowerCase()).toContain('expired');
  });

  it('accepts a license through the end of its expiry year', () => {
    const key = generateLicenseKey({ traderName: 'ValidTrader', tier: 'pro', expiresYear: 2026 });
    expect(verifyLicenseKey(key, new Date(2026, 11, 31)).isValid).toBe(true);
  });
});
