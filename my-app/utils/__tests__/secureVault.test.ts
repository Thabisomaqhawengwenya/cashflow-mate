/* eslint-disable import/first */
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

import { SecureVault } from '../secureVault';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('SecureVault', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('encrypts secrets before writing to storage so raw key is never plaintext', async () => {
    const rawKey = 'AIzaSyA_REAL_GEMINI_KEY_998877665544';
    await SecureVault.setSecret('@test_key', rawKey);

    const inStorage = await AsyncStorage.getItem('@test_key');
    expect(inStorage).toBeDefined();
    expect(inStorage).toContain('CFM_SECURE_VAULT_V1:');
    // Crucial: Raw key MUST NOT appear anywhere in the stored string
    expect(inStorage).not.toContain('AIzaSy');
    expect(inStorage).not.toContain('REAL_GEMINI_KEY');

    // Decrypts cleanly back to original
    const decrypted = await SecureVault.getSecret('@test_key');
    expect(decrypted).toBe(rawKey);
  });

  it('produces different ciphertexts for the same key due to dynamic salting', async () => {
    const rawKey = 'AIzaSySameKeyEveryTime12345';
    await SecureVault.setSecret('@key1', rawKey);
    await SecureVault.setSecret('@key2', rawKey);

    const val1 = await AsyncStorage.getItem('@key1');
    const val2 = await AsyncStorage.getItem('@key2');

    expect(val1).not.toBe(val2);

    expect(await SecureVault.getSecret('@key1')).toBe(rawKey);
    expect(await SecureVault.getSecret('@key2')).toBe(rawKey);
  });

  it('migrates legacy plaintext entries into encrypted vault format on first read', async () => {
    const legacyKey = 'AIzaSyLegacyKeyStoredInOldVersion';
    await AsyncStorage.setItem('@legacy_key', legacyKey);

    const retrieved = await SecureVault.getSecret('@legacy_key');
    expect(retrieved).toBe(legacyKey);

    // Stored value should now be encrypted
    const nowInStorage = await AsyncStorage.getItem('@legacy_key');
    expect(nowInStorage).toContain('CFM_SECURE_VAULT_V1:');
    expect(nowInStorage).not.toContain(legacyKey);
  });

  it('masks API keys safely for UI display without exposing secret payload', () => {
    expect(SecureVault.maskApiKey('AIzaSyBcDeFgHiJkLmNoPqRsTuVwXyZ1234')).toBe(
      'AIzaSy••••••••••••1234'
    );
    expect(SecureVault.maskApiKey('short')).toBe('••••••••');
    expect(SecureVault.maskApiKey('')).toBe('');
  });
});
