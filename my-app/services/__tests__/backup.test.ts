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

import { MobileBackupService } from '../backup';
import { MobileStorageService } from '../storage';

describe('MobileBackupService', () => {
  beforeEach(async () => {
    memoryStore.clear();
    await MobileStorageService.resetDemoData();
  });

  it('exports a valid JSON backup with checksum', async () => {
    const backupJson = await MobileBackupService.createBackup();
    expect(backupJson).toContain('CashFlow Mate Mobile OS');
    expect(backupJson).toContain('checksum');

    const parsed = JSON.parse(backupJson);
    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.transactions)).toBe(true);
    expect(parsed.transactions.length).toBeGreaterThan(0);
    expect(parsed.checksum.length).toBe(64); // SHA-256 hex
  });

  it('restores backup successfully into storage', async () => {
    const originalBackup = await MobileBackupService.createBackup();

    // Clear all storage to simulate empty/new phone
    memoryStore.clear();

    const result = await MobileBackupService.restoreBackup(originalBackup);
    expect(result.transactionsCount).toBeGreaterThan(0);
    expect(result.businessName).toBe('Mbare Fresh Produce & Tuckshop');

    const restoredTxs = await MobileStorageService.getTransactions();
    expect(restoredTxs.length).toBe(result.transactionsCount);
  });

  it('rejects tampered backups when checksum does not match', async () => {
    const backupJson = await MobileBackupService.createBackup();
    const parsed = JSON.parse(backupJson);

    // Tamper with transaction amount
    parsed.transactions[0].amount = 999999;
    const tamperedJson = JSON.stringify(parsed);

    await expect(MobileBackupService.restoreBackup(tamperedJson)).rejects.toThrow(
      'Integrity validation failed'
    );
  });
});
