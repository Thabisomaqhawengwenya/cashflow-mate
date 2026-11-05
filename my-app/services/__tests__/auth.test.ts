import { describe, it, expect, beforeEach, vi } from 'vitest';

const { memoryStore } = vi.hoisted(() => ({
  memoryStore: new Map<string, string>(),
}));

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
    expect(session.name).toBe('Farai Moyo');
    expect(session.username).toBe('farai_moyo');

    const stored = await MobileAuthService.getSession();
    expect(stored?.email).toContain('cashflowmate.co.zw');
    expect(stored?.username).toBe('farai_moyo');
  });

  it('updates session username and details', async () => {
    await MobileAuthService.demoLogin();
    const updated = await MobileAuthService.updateSession({ username: 'Mai Simba' });
    expect(updated?.username).toBe('Mai Simba');
    const loaded = await MobileAuthService.getSession();
    expect(loaded?.username).toBe('Mai Simba');
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

  it('logs out and clears session while preserving registered account flag and profile on re-login', async () => {
    expect(await MobileAuthService.hasRegisteredAccount()).toBe(false);

    await MobileAuthService.register({
      name: 'Farai Moyo',
      email: 'farai@cashflowmate.co.zw',
      password: 'password123',
      businessName: 'Farai Market Hub',
      currency: 'USD',
    });
    expect(await MobileAuthService.hasRegisteredAccount()).toBe(true);
    expect(await MobileAuthService.getSession()).not.toBeNull();

    await MobileAuthService.logout();
    expect(await MobileAuthService.getSession()).toBeNull();
    expect(await MobileAuthService.hasRegisteredAccount()).toBe(true);

    const relogged = await MobileAuthService.login('farai@cashflowmate.co.zw', 'password123');
    expect(relogged.username).toBe('Farai Moyo');
    expect(relogged.businessName).toBe('Farai Market Hub');
  });

  it('authenticates Admin HQ demo account with direct credentials', async () => {
    const adminSess = await MobileAuthService.login('admin', 'admin');
    expect(adminSess.isLoggedIn).toBe(true);
    expect(adminSess.role).toBe('admin');
    expect(adminSess.email).toBe('admin@cashflow.co.zw');
    expect(adminSess.username).toBe('admin');
  });

  it('authenticates client demo accounts (trader, tuckshop, retail)', async () => {
    // 1. Produce Trader Demo
    const traderSess = await MobileAuthService.login('trader', 'trader123');
    expect(traderSess.isLoggedIn).toBe(true);
    expect(traderSess.role).toBe('trader');
    expect(traderSess.name).toBe('Farai Moyo');
    expect(traderSess.businessName).toContain('Fresh Produce');
    expect(traderSess.currency).toBe('USD');

    // 2. Tuckshop Demo
    const tuckshopSess = await MobileAuthService.login('tuckshop', 'trader123');
    expect(tuckshopSess.isLoggedIn).toBe(true);
    expect(tuckshopSess.name).toBe('Tendai Mutasa');
    expect(tuckshopSess.businessName).toContain('Tuckshop');

    // 3. Retail Demo
    const retailSess = await MobileAuthService.login('retail', 'trader123');
    expect(retailSess.isLoggedIn).toBe(true);
    expect(retailSess.name).toBe('Chipo Ndlovu');
    expect(retailSess.currency).toBe('ZAR');
  });

  it('filters out legacy personal accounts and guarantees client demo accounts in getAllAccounts', async () => {
    const accounts = await MobileAuthService.getAllAccounts();
    expect(accounts.length).toBeGreaterThanOrEqual(3);

    // Verify no personal accounts exist
    const hasPersonal = accounts.some(
      (a) =>
        a.email.toLowerCase().includes('mrq') ||
        a.name.toLowerCase().includes('mrq') ||
        a.email.toLowerCase().includes('maqhawe')
    );
    expect(hasPersonal).toBe(false);

    // Verify demo traders exist
    expect(accounts.some((a) => a.username === 'trader')).toBe(true);
    expect(accounts.some((a) => a.username === 'tuckshop')).toBe(true);
    expect(accounts.some((a) => a.username === 'retail')).toBe(true);
  });
});
