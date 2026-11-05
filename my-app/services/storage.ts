import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured } from './supabase';
import { SecureVault } from '../utils/secureVault';
import { sanitizeBusinessForLocalhost } from '../utils/localhostSanitizer';

export type CurrencyCode = 'USD' | 'ZWG' | 'ZAR';

export interface MobileTransaction {
  id: string;
  transactionDate: string; // YYYY-MM-DD
  description: string;
  amount: number;
  currency: CurrencyCode;
  direction: 'inflow' | 'outflow' | 'neutral';
  type: 'business_income' | 'business_expense' | 'transfer' | 'loan_received' | 'loan_repayment' | 'owner_withdrawal' | 'unknown';
  category: string;
  originalReference?: string;
  notes?: string;
  reviewStatus: 'confirmed' | 'pending_review';
}

export interface MobileDebt {
  id: string;
  personName: string;
  direction: 'owed_to_business' | 'owed_by_business';
  totalAmount: number;
  paidAmount: number;
  currency: CurrencyCode;
  recordedDate: string;
  dueDate?: string;
  status: 'outstanding' | 'partially_paid' | 'settled';
  notes?: string;
}

export interface BusinessProfile {
  name: string;
  ownerName?: string;
  username?: string;
  avatarUri?: string;
  avatarPreset?: string;
  phone?: string;
  email?: string;
  city?: string;
  tagline?: string;
  stallNumber?: string;
  merchantTillNumber?: string;
  operatingHours?: string;
  businessType: string;
  currency: CurrencyCode;
  country: string;
  preferredLanguage: 'en' | 'sn' | 'nd';
  updatedAt?: string;
}

export const CATEGORIES: Record<string, { label: string; icon: string; defaultType: string }> = {
  sales_goods: { label: 'Sales of Goods', icon: 'cart-outline', defaultType: 'business_income' },
  service_fee: { label: 'Service Income', icon: 'construct-outline', defaultType: 'business_income' },
  stock_purchase: { label: 'Stock / Inventory', icon: 'cube-outline', defaultType: 'business_expense' },
  rent: { label: 'Stall / Shop Rent', icon: 'business-outline', defaultType: 'business_expense' },
  transport_fuel: { label: 'Transport & Kombi', icon: 'car-outline', defaultType: 'business_expense' },
  utilities_electricity: { label: 'ZETDC Electricity Tokens', icon: 'flash-outline', defaultType: 'business_expense' },
  mobile_money_fees: { label: 'EcoCash & Bank Fees', icon: 'card-outline', defaultType: 'business_expense' },
  owner_drawings: { label: 'Personal / Home Drawings', icon: 'wallet-outline', defaultType: 'owner_withdrawal' },
  transfer_internal: { label: 'Internal Account Shift', icon: 'swap-horizontal-outline', defaultType: 'transfer' },
  loan_in: { label: 'Mukando Loan Received', icon: 'arrow-down-circle-outline', defaultType: 'loan_received' },
  loan_out: { label: 'Loan Repayment', icon: 'arrow-up-circle-outline', defaultType: 'loan_repayment' },
  uncategorized: { label: 'Uncategorized', icon: 'help-circle-outline', defaultType: 'unknown' },
};

const STORAGE_KEY_TX = '@cashflow_mate_tx_v1';
const STORAGE_KEY_DEBTS = '@cashflow_mate_debts_v1';
const STORAGE_KEY_BIZ = '@cashflow_mate_biz_v1';
const STORAGE_KEY_GEMINI_KEY = '@cashflow_mate_gemini_key_v1';

export interface FinancialSummary {
  period: ReportPeriod;
  periodLabel: string;
  periodStartDate: string;
  periodEndDate: string;
  currency: CurrencyCode;
  transactionCount: number;
  recordedInflows: number;
  recordedOutflows: number;
  netCashFlow: number;
  estimatedOperatingProfit: number;
  operatingRevenue: number;
  operatingExpenses: number;
  unreviewedCount: number;
  categoryBreakdown: {
    category: string;
    label: string;
    amount: number;
    percentage: number;
  }[];
}

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatMoney(amount: number, currency: CurrencyCode = 'USD'): string {
  const rounded = roundMoney(amount);
  const formatted = Math.abs(rounded).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = rounded < 0 ? '-' : '';
  const symbol = currency === 'USD' ? '$' : currency === 'ZWG' ? 'ZiG ' : currency === 'ZAR' ? 'R ' : `${currency} `;
  return `${sign}${symbol}${formatted}`;
}

/** Local calendar date (Africa/Harare etc.), never UTC-shifted. */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type ReportPeriod = 'this_month' | 'last_month' | 'all';

export interface ReportPeriodRange {
  period: ReportPeriod;
  label: string;
  startDate: string;
  endDate: string;
}

/** Local-time month boundaries for the report period selector. */
export function getReportPeriodRange(
  period: ReportPeriod = 'this_month',
  now: Date = new Date()
): ReportPeriodRange {
  if (period === 'all') {
    return { period, label: 'All Records', startDate: '0000-01-01', endDate: '9999-12-31' };
  }
  const offset = period === 'last_month' ? -1 : 0;
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return {
    period,
    label: period === 'last_month' ? 'Last Month' : 'This Month',
    startDate: getLocalDateString(start),
    endDate: getLocalDateString(end),
  };
}

/**
 * Map a category to the canonical transaction classification and direction.
 * Used when a user re-categorizes a record so type/direction cannot drift out
 * of sync with the category (e.g. drawings must never stay `business_expense`).
 */
export function categoryClassification(category: string): {
  type: MobileTransaction['type'];
  direction: MobileTransaction['direction'];
} {
  const defaultType = CATEGORIES[category]?.defaultType;
  switch (defaultType) {
    case 'business_income':
      return { type: 'business_income', direction: 'inflow' };
    case 'transfer':
      return { type: 'transfer', direction: 'neutral' };
    case 'loan_received':
      return { type: 'loan_received', direction: 'inflow' };
    case 'loan_repayment':
      return { type: 'loan_repayment', direction: 'outflow' };
    case 'owner_withdrawal':
      return { type: 'owner_withdrawal', direction: 'outflow' };
    case 'business_expense':
      return { type: 'business_expense', direction: 'outflow' };
    default:
      return { type: 'unknown', direction: 'outflow' };
  }
}

/** Stable newest-first ordering (date, then record id timestamp). */
export function sortTransactionsByDateDesc(transactions: MobileTransaction[]): MobileTransaction[] {
  const idTimestamp = (id: string) => {
    const stamp = Number(String(id).split('_')[1]);
    return Number.isFinite(stamp) ? stamp : 0;
  };
  return [...transactions].sort((a, b) => {
    const byDate = b.transactionDate.localeCompare(a.transactionDate);
    return byDate !== 0 ? byDate : idTimestamp(b.id) - idTimestamp(a.id);
  });
}

function parseStored<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function cloneSeed<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const DEFAULT_EMPTY_BUSINESS: BusinessProfile = {
  name: 'My Stall',
  ownerName: '',
  businessType: 'Retail & Tuckshop',
  currency: 'USD',
  country: 'Zimbabwe',
  preferredLanguage: 'en',
};

export class MobileStorageService {
  static async getBusiness(): Promise<BusinessProfile> {
    try {
      const { SupabaseDataService } = await import('./supabaseData');
      const profile = await SupabaseDataService.getProfile();
      if (profile) {
        return sanitizeBusinessForLocalhost({
          name: profile.stallName || 'My Stall',
          ownerName: profile.fullName || '',
          businessType: 'Retail & Tuckshop',
          currency: profile.currency || 'USD',
          country: 'Zimbabwe',
          preferredLanguage: 'en',
          phone: profile.phone || '',
          city: profile.city || 'Harare (CBD)',
          avatarUri: profile.avatarUri,
        }) as BusinessProfile;
      }
    } catch {}

    const data = await AsyncStorage.getItem(STORAGE_KEY_BIZ);
    if (!data) {
      return sanitizeBusinessForLocalhost({ ...DEFAULT_EMPTY_BUSINESS }) as BusinessProfile;
    }
    const parsed = parseStored<BusinessProfile>(data, { ...DEFAULT_EMPTY_BUSINESS });
    return sanitizeBusinessForLocalhost(parsed) as BusinessProfile;
  }

  static async updateBusiness(profile: Partial<BusinessProfile>): Promise<BusinessProfile> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        await SupabaseDataService.updateProfile({
          stallName: profile.name,
          fullName: profile.ownerName,
          phone: profile.phone,
          city: profile.city,
          currency: profile.currency,
          avatarUri: profile.avatarUri,
        });
      } catch {}
    }

    const current = await this.getBusiness();
    const updated = { ...current, ...profile };
    await AsyncStorage.setItem(STORAGE_KEY_BIZ, JSON.stringify(updated));
    return updated;
  }

  static async getTransactions(): Promise<MobileTransaction[]> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        const onlineTxs = await SupabaseDataService.getTransactions();
        if (onlineTxs) {
          return onlineTxs;
        }
      } catch {}
    }

    const data = await AsyncStorage.getItem(STORAGE_KEY_TX);
    return parseStored<MobileTransaction[]>(data, []);
  }

  static async saveTransaction(tx: Omit<MobileTransaction, 'id'>): Promise<MobileTransaction> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        const created = await SupabaseDataService.createTransaction(tx);
        // Update local storage
        const all = await this.getTransactions();
        const exists = all.some(t => t.id === created.id);
        if (!exists) all.unshift(created);
        await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(all));
        return created;
      } catch {}
    }

    const all = await this.getTransactions();
    const newTx: MobileTransaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    all.unshift(newTx);
    await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(all));
    return newTx;
  }

  static async updateTransaction(id: string, updates: Partial<MobileTransaction>): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        await SupabaseDataService.updateTransaction(id, updates);
      } catch {}
    }

    const all = await this.getTransactions();
    const idx = all.findIndex((t) => t.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(all));
    }
  }

  static async deleteTransaction(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        await SupabaseDataService.deleteTransaction(id);
      } catch {}
    }

    const all = await this.getTransactions();
    const filtered = all.filter((t) => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(filtered));
  }

  static async getDebts(): Promise<MobileDebt[]> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        const onlineDebts = await SupabaseDataService.getDebts();
        if (onlineDebts) {
          return onlineDebts;
        }
      } catch {}
    }

    const data = await AsyncStorage.getItem(STORAGE_KEY_DEBTS);
    return parseStored<MobileDebt[]>(data, []);
  }

  static async saveDebt(
    debt: Omit<MobileDebt, 'id' | 'paidAmount' | 'status'> &
      Partial<Pick<MobileDebt, 'paidAmount' | 'status'>>
  ): Promise<MobileDebt> {
    const fullDebt: Omit<MobileDebt, 'id'> = {
      ...debt,
      paidAmount: debt.paidAmount ?? 0,
      status: debt.status ?? 'outstanding',
    };

    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        const created = await SupabaseDataService.createDebt(fullDebt);
        const all = await this.getDebts();
        all.unshift(created);
        await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(all));
        return created;
      } catch {}
    }

    const all = await this.getDebts();
    const newDebt: MobileDebt = {
      ...fullDebt,
      id: `debt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    all.unshift(newDebt);
    await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(all));
    return newDebt;
  }

  static async recordDebtPayment(debtId: string, paymentAmount: number): Promise<number> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        return await SupabaseDataService.recordDebtPayment(debtId, paymentAmount);
      } catch {}
    }

    const all = await this.getDebts();
    const idx = all.findIndex((d) => d.id === debtId);
    if (idx !== -1) {
      const debt = all[idx];
      const outstanding = Math.max(0, debt.totalAmount - debt.paidAmount);
      const actualApplied = Math.min(paymentAmount, outstanding);
      const newPaid = roundMoney(debt.paidAmount + actualApplied);
      const remaining = debt.totalAmount - newPaid;
      all[idx] = {
        ...debt,
        paidAmount: newPaid,
        status: remaining <= 0.005 ? 'settled' : 'partially_paid',
      };
      await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(all));
      return actualApplied;
    }
    return paymentAmount;
  }

  static async deleteDebt(id: string): Promise<void> {
    try {
      const { SupabaseDataService } = await import('./supabaseData');
      await SupabaseDataService.deleteDebt(id);
    } catch {}

    const all = await this.getDebts();
    const filtered = all.filter((d) => d.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(filtered));
  }

  static async clearAllLocalData(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY_BIZ);
    await AsyncStorage.removeItem(STORAGE_KEY_TX);
    await AsyncStorage.removeItem(STORAGE_KEY_DEBTS);
  }

  /**
   * Complete GDPR & CCPA "Right to Be Forgotten" data deletion.
   * Irreversibly purges all local ledger records, debts, business profiles,
   * saved credentials, and cached tokens from this device.
   */
  static async eraseAllUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_BIZ);
      await AsyncStorage.removeItem(STORAGE_KEY_TX);
      await AsyncStorage.removeItem(STORAGE_KEY_DEBTS);
      await AsyncStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
      await SecureVault.removeSecret(STORAGE_KEY_GEMINI_KEY);

      const allKeys = await AsyncStorage.getAllKeys();
      const cashflowKeys = allKeys.filter(
        (k) =>
          k.startsWith('@cashflow_') ||
          k.startsWith('CFM_') ||
          k.startsWith('@cashflow-mate/')
      );
      if (cashflowKeys.length > 0) {
        await AsyncStorage.multiRemove(cashflowKeys);
      }
    } catch {
      // ignore
    }
  }

  static async resetDemoData(): Promise<void> {
    await this.clearAllLocalData();
  }

  /**
   * Deterministic financial summary calculation adhering strictly to Zimbabwe small trader accounting.
   *
   * - `period` filters by LOCAL calendar month (the period chips are not decorative).
   * - `currency` segregates currencies; USD and ZiG are never summed together.
   * - Internal transfers are neutral; loans/drawings are cash movements but not operating profit.
   */
  static calculateSummary(
    transactions: MobileTransaction[],
    options: { period?: ReportPeriod; currency?: CurrencyCode; now?: Date } = {}
  ) {
    const period = options.period ?? 'this_month';
    const currency = options.currency ?? 'USD';
    const range = getReportPeriodRange(period, options.now ?? new Date());

    let recordedInflows = 0;
    let recordedOutflows = 0;
    let operatingRevenue = 0;
    let operatingExpenses = 0;
    let unreviewedCount = 0;
    let transactionCount = 0;

    const categoryMap: Record<string, number> = {};

    for (const t of transactions) {
      if (t.currency !== currency) continue;
      if (t.transactionDate < range.startDate || t.transactionDate > range.endDate) continue;
      transactionCount++;

      const amt = roundMoney(t.amount);

      if (t.reviewStatus === 'pending_review' || t.category === 'uncategorized') {
        unreviewedCount++;
      }

      // Neutral internal shifts are excluded from income and expenses
      if (t.type === 'transfer' || t.direction === 'neutral') {
        continue;
      }

      if (t.direction === 'inflow') {
        recordedInflows = roundMoney(recordedInflows + amt);
        if (t.type === 'business_income') {
          operatingRevenue = roundMoney(operatingRevenue + amt);
        }
      } else if (t.direction === 'outflow') {
        recordedOutflows = roundMoney(recordedOutflows + amt);
        if (t.type === 'business_expense') {
          operatingExpenses = roundMoney(operatingExpenses + amt);
        }
        categoryMap[t.category] = roundMoney((categoryMap[t.category] || 0) + amt);
      }
    }

    const netCashFlow = roundMoney(recordedInflows - recordedOutflows);
    const estimatedOperatingProfit = roundMoney(operatingRevenue - operatingExpenses);

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([cat, amount]) => ({
        category: cat,
        label: CATEGORIES[cat]?.label || cat,
        amount,
        percentage: recordedOutflows > 0 ? Math.round((amount / recordedOutflows) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      period: range.period,
      periodLabel: range.label,
      periodStartDate: range.startDate,
      periodEndDate: range.endDate,
      currency,
      transactionCount,
      recordedInflows,
      recordedOutflows,
      netCashFlow,
      estimatedOperatingProfit,
      operatingRevenue,
      operatingExpenses,
      unreviewedCount,
      categoryBreakdown,
    };
  }

  static calculateMultiCurrencyCashbox(transactions: MobileTransaction[]): MultiCurrencyCashbox {
    const result: MultiCurrencyCashbox = {
      USD: { currency: 'USD', label: 'USD Cash Drawer', inflows: 0, outflows: 0, netCashFlow: 0, count: 0 },
      ZWG: { currency: 'ZWG', label: 'EcoCash ZiG Wallet', inflows: 0, outflows: 0, netCashFlow: 0, count: 0 },
      ZAR: { currency: 'ZAR', label: 'Rand Float', inflows: 0, outflows: 0, netCashFlow: 0, count: 0 },
    };

    for (const t of transactions) {
      const cur = (t.currency || 'USD') as CurrencyCode;
      if (!result[cur]) continue;
      const amt = roundMoney(t.amount);
      result[cur].count++;
      if (t.direction === 'inflow') {
        result[cur].inflows = roundMoney(result[cur].inflows + amt);
      } else if (t.direction === 'outflow') {
        result[cur].outflows = roundMoney(result[cur].outflows + amt);
      }
    }

    result.USD.netCashFlow = roundMoney(result.USD.inflows - result.USD.outflows);
    result.ZWG.netCashFlow = roundMoney(result.ZWG.inflows - result.ZWG.outflows);
    result.ZAR.netCashFlow = roundMoney(result.ZAR.inflows - result.ZAR.outflows);

    return result;
  }

  static async getGeminiApiKey(): Promise<string> {
    try {
      const key = await SecureVault.getSecret(STORAGE_KEY_GEMINI_KEY);
      return (key || (process.env as any).EXPO_PUBLIC_GEMINI_API_KEY || '').trim();
    } catch {
      return '';
    }
  }

  static async setGeminiApiKey(key: string): Promise<void> {
    await SecureVault.setSecret(STORAGE_KEY_GEMINI_KEY, key.trim());
  }

  static async clearGeminiApiKey(): Promise<void> {
    await SecureVault.removeSecret(STORAGE_KEY_GEMINI_KEY);
  }
}

export interface CurrencyTillSummary {
  currency: CurrencyCode;
  label: string;
  inflows: number;
  outflows: number;
  netCashFlow: number;
  count: number;
}

export interface MultiCurrencyCashbox {
  USD: CurrencyTillSummary;
  ZWG: CurrencyTillSummary;
  ZAR: CurrencyTillSummary;
}

