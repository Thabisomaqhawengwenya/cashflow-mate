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

import { MobileReconciliationService } from '../reconciliation';
import { MobileStorageService } from '../storage';

describe('MobileReconciliationService', () => {
  beforeEach(async () => {
    memoryStore.clear();
    await MobileStorageService.resetDemoData();
  });

  it('computes expected till balances across USD, ZiG, and ZAR', async () => {
    const expected = await MobileReconciliationService.getExpectedBalances();
    expect(typeof expected.USD).toBe('number');
    expect(typeof expected.ZWG).toBe('number');
    expect(typeof expected.ZAR).toBe('number');
  });

  it('detects balanced till when physical count matches expected exactly', async () => {
    const expected = await MobileReconciliationService.getExpectedBalances();
    const report = await MobileReconciliationService.closeShiftAndGenerateZReport(
      expected,
      'Tinashe Moyo',
      'Perfect market day close.'
    );

    expect(report.status).toBe('balanced');
    expect(report.variances.USD).toBe(0);
    expect(report.variances.ZWG).toBe(0);
    expect(report.variances.ZAR).toBe(0);

    const history = await MobileReconciliationService.getZReports();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe(report.id);
  });

  it('flags shortage or overage when variance exists', async () => {
    const expected = await MobileReconciliationService.getExpectedBalances();
    const physicalWithShortage = {
      ...expected,
      USD: expected.USD - 10.0, // $10 short
    };

    const report = await MobileReconciliationService.closeShiftAndGenerateZReport(
      physicalWithShortage,
      'Tinashe Moyo',
      'Missing $10 cash note.'
    );

    expect(report.status).toBe('variance_flagged');
    expect(report.variances.USD).toBe(-10.0);
  });
});
