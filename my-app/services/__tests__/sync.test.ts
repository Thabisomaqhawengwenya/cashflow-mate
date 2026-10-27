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

import { MobileSyncService } from '../sync';
import { MobileStorageService } from '../storage';

describe('MobileSyncService', () => {
  beforeEach(async () => {
    memoryStore.clear();
    await MobileStorageService.resetDemoData();
  });

  it('reports initial sync status', async () => {
    const status = await MobileSyncService.getSyncStatus();
    expect(status.status).toBe('offline');
    expect(status.pendingCount).toBeGreaterThan(0);
    expect(status.lastSyncedAt).toBeNull();
  });

  it('handles offline state gracefully without crashing', async () => {
    // Attempting to sync to unreachable port should not throw
    const status = await MobileSyncService.syncWithCloud('http://127.0.0.1:59999');
    expect(status.status).toBe('offline');
    expect(status.message).toContain('offline');
  });
});
