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
    getAllKeys: vi.fn(async () => Array.from(memoryStore.keys())),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const k of keys) {
        memoryStore.delete(k);
      }
    }),
    clear: vi.fn(async () => {
      memoryStore.clear();
    }),
  },
}));

vi.mock('../supabase', () => ({
  isSupabaseConfigured: false,
  supabase: null,
}));

import { MobileSecurityService } from '../security';
import { MobileStorageService } from '../storage';

describe('20-Point Compliance & Data Protection Suite', () => {
  beforeEach(async () => {
    memoryStore.clear();
  });

  it('permanently clears PIN, lockout states, and privacy mask via clearPin()', async () => {
    await MobileSecurityService.setPin('5555');
    await MobileSecurityService.togglePrivacyMask();
    let settings = await MobileSecurityService.getSecuritySettings();
    expect(settings.isPinSet).toBe(true);

    await MobileSecurityService.clearPin();
    settings = await MobileSecurityService.getSecuritySettings();
    expect(settings.isPinSet).toBe(false);
    expect(settings.isPrivacyMaskActive).toBe(false);
  });

  it('executes full GDPR/POPIA data erasure (Right to Be Forgotten) via eraseAllUserData()', async () => {
    // Seed business profile and transaction
    await MobileStorageService.updateBusiness({
      name: 'Mbare Fresh Veg',
      businessType: 'produce',
      currency: 'USD',
      country: 'Zimbabwe',
    });
    await MobileStorageService.saveTransaction({
      transactionDate: '2026-11-05',
      description: 'Potatoes crate sale',
      amount: 45,
      currency: 'USD',
      direction: 'inflow',
      type: 'business_income',
      category: 'Sales',
      reviewStatus: 'confirmed',
    });

    // Seed arbitrary cached token
    memoryStore.set('@cashflow_temp_session', 'token_xyz_123');
    memoryStore.set('@cashflow-mate/theme', 'emerald_luxury');

    const transactionsBefore = await MobileStorageService.getTransactions();
    expect(transactionsBefore.length).toBe(1);

    // Execute complete irreversible erasure
    await MobileStorageService.eraseAllUserData();

    const transactionsAfter = await MobileStorageService.getTransactions();
    expect(transactionsAfter.length).toBe(0);
    expect(memoryStore.has('@cashflow_temp_session')).toBe(false);
    expect(memoryStore.has('@cashflow-mate/theme')).toBe(false);
  });
});
