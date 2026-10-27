import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileStorageService, CurrencyCode, roundMoney } from './storage';

export const STORAGE_KEY_Z_REPORTS = '@cashflow_z_reports_v1';

export interface CurrencyCounts {
  USD: number;
  ZWG: number;
  ZAR: number;
}

export interface ZReport {
  id: string;
  reportDate: string; // YYYY-MM-DD
  closedAt: string; // ISO
  cashierName: string;
  expectedBalances: CurrencyCounts;
  physicalCounts: CurrencyCounts;
  variances: CurrencyCounts;
  status: 'balanced' | 'variance_flagged';
  notes?: string;
}

export class MobileReconciliationService {
  /**
   * Retrieves all historical Z-Reports (newest first)
   */
  static async getZReports(): Promise<ZReport[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_Z_REPORTS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Calculates expected cash in till for all 3 drawers from transactions
   */
  static async getExpectedBalances(): Promise<CurrencyCounts> {
    const txs = await MobileStorageService.getTransactions();
    const cashbox = MobileStorageService.calculateMultiCurrencyCashbox(txs);

    return {
      USD: roundMoney(cashbox.USD.netCashFlow),
      ZWG: roundMoney(cashbox.ZWG.netCashFlow),
      ZAR: roundMoney(cashbox.ZAR.netCashFlow),
    };
  }

  /**
   * Closes the day's till shift, calculates variances, and saves a signed Z-Report
   */
  static async closeShiftAndGenerateZReport(
    physicalCounts: CurrencyCounts,
    cashierName: string = 'Master Cashier',
    notes?: string
  ): Promise<ZReport> {
    const expected = await this.getExpectedBalances();

    const variances: CurrencyCounts = {
      USD: roundMoney(physicalCounts.USD - expected.USD),
      ZWG: roundMoney(physicalCounts.ZWG - expected.ZWG),
      ZAR: roundMoney(physicalCounts.ZAR - expected.ZAR),
    };

    const hasVariance =
      Math.abs(variances.USD) > 0.009 ||
      Math.abs(variances.ZWG) > 0.009 ||
      Math.abs(variances.ZAR) > 0.009;

    const todayStr = new Date().toISOString().split('T')[0];

    const report: ZReport = {
      id: `z_${Date.now()}`,
      reportDate: todayStr,
      closedAt: new Date().toISOString(),
      cashierName,
      expectedBalances: expected,
      physicalCounts,
      variances,
      status: hasVariance ? 'variance_flagged' : 'balanced',
      notes,
    };

    const existing = await this.getZReports();
    const updated = [report, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY_Z_REPORTS, JSON.stringify(updated));

    return report;
  }
}
