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

import { MobileAuthService, STORAGE_KEY_AUTH_SESSION } from '../auth';

describe('MobileAuthService', () => {
  beforeEach(async () => {
    memoryStore.clear();
  });

  it('handles demoLogin and saves active session', async () => {
    const session = await MobileAuthService.demoLogin();
    expect(session.isLoggedIn).toBe(true);
    expect(session.isDemo).toBe(true);
    expect(session.name).toBe('Tinashe Moyo');

    const stored = await MobileAuthService.getSession();
    expect(stored?.email).toBe('demo@cashflowmate.co.zw');
  });

  it('validates registration input requirements', async () => {
    await expect(
      MobileAuthService.register({
        name: '',
        email: 'bad',
        password: '123',
        businessName: '',
        currency: 'USD',
      })
    ).rejects.toThrow('Please enter your full name');

    await expect(
      MobileAuthService.register({
        name: 'Simba',
        email: 'invalid-email',
        password: '123',
        businessName: 'My Stall',
        currency: 'USD',
      })
    ).rejects.toThrow('valid email');

    await expect(
      MobileAuthService.register({
        name: 'Simba',
        email: 'simba@test.co.zw',
        password: '123',
        businessName: 'My Stall',
        currency: 'USD',
      })
    ).rejects.toThrow('at least 6 characters');
  });

  it('registers new trader successfully', async () => {
    const session = await MobileAuthService.register({
      name: 'Farai Chidzero',
      email: 'farai@chidzero.co.zw',
      password: 'securepassword123',
      businessName: 'Farai Fresh Produce',
      currency: 'USD',
    });

    expect(session.isLoggedIn).toBe(true);
    expect(session.name).toBe('Farai Chidzero');
    expect(session.businessName).toBe('Farai Fresh Produce');

    const loaded = await MobileAuthService.getSession();
    expect(loaded?.email).toBe('farai@chidzero.co.zw');
  });

  it('logs out and clears session', async () => {
    await MobileAuthService.demoLogin();
    expect(await MobileAuthService.getSession()).not.toBeNull();

    await MobileAuthService.logout();
    expect(await MobileAuthService.getSession()).toBeNull();
  });
});
