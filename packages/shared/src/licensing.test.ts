import { describe, it, expect } from 'vitest';
import { generateLicenseKey, verifyLicenseKey, WORKING_TEST_LICENSES } from './licensing';

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
});
