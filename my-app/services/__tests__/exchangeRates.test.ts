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

import { MobileExchangeService, DEFAULT_EXCHANGE_RATES } from '../exchangeRates';
import { MultiCurrencyCashbox } from '../storage';

describe('MobileExchangeService', () => {
  beforeEach(async () => {
    memoryStore.clear();
  });

  const mockCashbox: MultiCurrencyCashbox = {
    USD: { currency: 'USD', recordedInflows: 500, recordedOutflows: 100, netCashFlow: 400, count: 5 },
    ZWG: { currency: 'ZWG', recordedInflows: 560, recordedOutflows: 0, netCashFlow: 560, count: 2 }, // 560 / 28 = $20 USD
    ZAR: { currency: 'ZAR', recordedInflows: 360, recordedOutflows: 0, netCashFlow: 360, count: 2 }, // 360 / 18 = $20 USD
  };

  it('calculates portfolio net worth in USD equivalent accurately', () => {
    const valuation = MobileExchangeService.calculatePortfolioValuation(
      mockCashbox,
      DEFAULT_EXCHANGE_RATES // 28 ZiG = $1, 18 ZAR = $1
    );

    expect(valuation.usdComponent).toBe(400);
    expect(valuation.zwgComponentInUsd).toBe(20);
    expect(valuation.zarComponentInUsd).toBe(20);
    expect(valuation.totalUsdEquivalent).toBe(440);
  });

  it('updates custom trader street rates', async () => {
    await MobileExchangeService.updateRates({ usdToZwg: 30.0 });
    const rates = await MobileExchangeService.getRates();

    expect(rates.usdToZwg).toBe(30.0);
    expect(rates.usdToZar).toBe(DEFAULT_EXCHANGE_RATES.usdToZar);
  });
});
