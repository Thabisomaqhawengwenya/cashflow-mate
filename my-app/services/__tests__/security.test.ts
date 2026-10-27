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

import { MobileSecurityService } from '../security';

describe('Mobile Security & PIN Protection Service', () => {
  beforeEach(async () => {
    memoryStore.clear();
  });

  it('sets a 4-digit PIN with HMAC-SHA256 and verifies it', async () => {
    await MobileSecurityService.setPin('1234');
    const settings = await MobileSecurityService.getSecuritySettings();
    expect(settings.isPinSet).toBe(true);

    const isMatch = await MobileSecurityService.verifyPin('1234');
    expect(isMatch).toBe(true);

    const isWrong = await MobileSecurityService.verifyPin('9999');
    expect(isWrong).toBe(false);
  });

  it('rejects non-4-digit PINs', async () => {
    await expect(MobileSecurityService.setPin('123')).rejects.toThrow('PIN must be exactly 4 digits');
    await expect(MobileSecurityService.setPin('12345')).rejects.toThrow('PIN must be exactly 4 digits');
    await expect(MobileSecurityService.setPin('abcd')).rejects.toThrow('PIN must be exactly 4 digits');
  });

  it('removes PIN only when current PIN is verified', async () => {
    await MobileSecurityService.setPin('4321');
    const wrongRemove = await MobileSecurityService.removePin('0000');
    expect(wrongRemove).toBe(false);

    const correctRemove = await MobileSecurityService.removePin('4321');
    expect(correctRemove).toBe(true);

    const settings = await MobileSecurityService.getSecuritySettings();
    expect(settings.isPinSet).toBe(false);
  });

  it('toggles privacy mask for counter protection', async () => {
    expect(await MobileSecurityService.togglePrivacyMask()).toBe(true);
    expect(MobileSecurityService.formatMasked('$1,240.00', true)).toBe('••••');

    expect(await MobileSecurityService.togglePrivacyMask()).toBe(false);
    expect(MobileSecurityService.formatMasked('$1,240.00', false)).toBe('$1,240.00');
  });

  it('triggers lockout after 5 consecutive failed attempts', async () => {
    await MobileSecurityService.setPin('1234');

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      expect(await MobileSecurityService.verifyPin('0000')).toBe(false);
    }

    // 5th failed attempt should trigger lockout error
    await expect(MobileSecurityService.verifyPin('0000')).rejects.toThrow('30 seconds');

    // Subsequent calls while locked out should be blocked
    await expect(MobileSecurityService.verifyPin('1234')).rejects.toThrow('locked');
  });
});
