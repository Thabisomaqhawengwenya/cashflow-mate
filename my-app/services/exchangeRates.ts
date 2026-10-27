import AsyncStorage from '@react-native-async-storage/async-storage';
import { MultiCurrencyCashbox, roundMoney } from './storage';

export const STORAGE_KEY_EXCHANGE_RATES = '@cashflow_exchange_rates_v1';

export interface ExchangeRateConfig {
  usdToZwg: number; // e.g. 28.0 ZiG per 1 USD
  usdToZar: number; // e.g. 18.0 ZAR per 1 USD
  lastUpdated: string;
}

export const DEFAULT_EXCHANGE_RATES: ExchangeRateConfig = {
  usdToZwg: 28.0,
  usdToZar: 18.0,
  lastUpdated: '2026-10-27',
};

export interface PortfolioValuation {
  totalUsdEquivalent: number;
  usdComponent: number;
  zwgComponentInUsd: number;
  zarComponentInUsd: number;
  rates: ExchangeRateConfig;
}

export class MobileExchangeService {
  /**
   * Retrieves active exchange rate configuration
   */
  static async getRates(): Promise<ExchangeRateConfig> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_EXCHANGE_RATES);
    if (!raw) return { ...DEFAULT_EXCHANGE_RATES };
    try {
      const parsed = JSON.parse(raw);
      return {
        usdToZwg: parsed.usdToZwg > 0 ? parsed.usdToZwg : DEFAULT_EXCHANGE_RATES.usdToZwg,
        usdToZar: parsed.usdToZar > 0 ? parsed.usdToZar : DEFAULT_EXCHANGE_RATES.usdToZar,
        lastUpdated: parsed.lastUpdated || DEFAULT_EXCHANGE_RATES.lastUpdated,
      };
    } catch {
      return { ...DEFAULT_EXCHANGE_RATES };
    }
  }

  /**
   * Updates trader-customized market exchange rates
   */
  static async updateRates(rates: Partial<ExchangeRateConfig>): Promise<ExchangeRateConfig> {
    const current = await this.getRates();
    const updated: ExchangeRateConfig = {
      usdToZwg: rates.usdToZwg && rates.usdToZwg > 0 ? rates.usdToZwg : current.usdToZwg,
      usdToZar: rates.usdToZar && rates.usdToZar > 0 ? rates.usdToZar : current.usdToZar,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    await AsyncStorage.setItem(STORAGE_KEY_EXCHANGE_RATES, JSON.stringify(updated));
    return updated;
  }

  /**
   * Calculates unified portfolio net worth in USD equivalent across all 3 currency drawers
   */
  static calculatePortfolioValuation(
    cashbox: MultiCurrencyCashbox,
    rates: ExchangeRateConfig
  ): PortfolioValuation {
    const usdComponent = roundMoney(cashbox.USD.netCashFlow);
    const zwgComponentInUsd = roundMoney(cashbox.ZWG.netCashFlow / rates.usdToZwg);
    const zarComponentInUsd = roundMoney(cashbox.ZAR.netCashFlow / rates.usdToZar);

    const totalUsdEquivalent = roundMoney(usdComponent + zwgComponentInUsd + zarComponentInUsd);

    return {
      totalUsdEquivalent,
      usdComponent,
      zwgComponentInUsd,
      zarComponentInUsd,
      rates,
    };
  }
}
