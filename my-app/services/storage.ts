import AsyncStorage from '@react-native-async-storage/async-storage';

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
  businessType: string;
  currency: CurrencyCode;
  country: string;
  preferredLanguage: 'en' | 'sn' | 'nd';
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

const INITIAL_BUSINESS: BusinessProfile = {
  name: 'Mbare Fresh Produce & Tuckshop',
  businessType: 'Tuckshop & Market Stall',
  currency: 'USD',
  country: 'Zimbabwe',
  preferredLanguage: 'en',
};

const INITIAL_TRANSACTIONS: MobileTransaction[] = [
  {
    id: 'tx_01',
    transactionDate: '2026-10-02',
    description: 'EcoCash Merchant: Customer Payment - Bread & Milk',
    amount: 14.50,
    currency: 'USD',
    direction: 'inflow',
    type: 'business_income',
    category: 'sales_goods',
    originalReference: 'MP261002.1022.B49120',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_02',
    transactionDate: '2026-10-02',
    description: 'Cash Sales: Daily Counter Groceries',
    amount: 85.00,
    currency: 'USD',
    direction: 'inflow',
    type: 'business_income',
    category: 'sales_goods',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_03',
    transactionDate: '2026-10-03',
    description: 'Bakers Inn Logistics - 50 Crates Sliced Bread',
    amount: 55.00,
    currency: 'USD',
    direction: 'outflow',
    type: 'business_expense',
    category: 'stock_purchase',
    originalReference: 'BP261003.0745.C18239',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_04',
    transactionDate: '2026-10-04',
    description: 'InnBucks Payment: Chicken cuts & eggs retail',
    amount: 32.00,
    currency: 'USD',
    direction: 'inflow',
    type: 'business_income',
    category: 'sales_goods',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_05',
    transactionDate: '2026-10-05',
    description: 'Kombi Transport - Mbare Musika to Stall',
    amount: 12.00,
    currency: 'USD',
    direction: 'outflow',
    type: 'business_expense',
    category: 'transport_fuel',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_06',
    transactionDate: '2026-10-06',
    description: 'ZETDC Prepaid Token Purchase - Stall Meter #41920',
    amount: 20.00,
    currency: 'USD',
    direction: 'outflow',
    type: 'business_expense',
    category: 'utilities_electricity',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_07',
    transactionDate: '2026-10-07',
    description: 'EcoCash Merchant: Customer Groceries Payment',
    amount: 48.50,
    currency: 'USD',
    direction: 'inflow',
    type: 'business_income',
    category: 'sales_goods',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_08',
    transactionDate: '2026-10-08',
    description: 'Stall Rental - Harare City Council Markets October',
    amount: 70.00,
    currency: 'USD',
    direction: 'outflow',
    type: 'business_expense',
    category: 'rent',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_09',
    transactionDate: '2026-10-09',
    description: 'Internal Shift: Cash Drawer Deposit to EcoCash',
    amount: 100.00,
    currency: 'USD',
    direction: 'neutral',
    type: 'transfer',
    category: 'transfer_internal',
    reviewStatus: 'confirmed',
    notes: 'Rebalancing till float into EcoCash float',
  },
  {
    id: 'tx_10',
    transactionDate: '2026-10-10',
    description: 'EcoCash IMTT & Merchant Fee Deduction',
    amount: 3.80,
    currency: 'USD',
    direction: 'outflow',
    type: 'business_expense',
    category: 'mobile_money_fees',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_11',
    transactionDate: '2026-10-12',
    description: 'Cash Sales: Saturday Peak Market Session',
    amount: 140.00,
    currency: 'USD',
    direction: 'inflow',
    type: 'business_income',
    category: 'sales_goods',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_12',
    transactionDate: '2026-10-13',
    description: 'Probrands Zimbabwe - 20x Cooking Oil 2L Boxes',
    amount: 88.00,
    currency: 'USD',
    direction: 'outflow',
    type: 'business_expense',
    category: 'stock_purchase',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_13',
    transactionDate: '2026-10-15',
    description: 'Owner Drawings: Family Groceries & School Bus',
    amount: 30.00,
    currency: 'USD',
    direction: 'outflow',
    type: 'owner_withdrawal',
    category: 'owner_drawings',
    reviewStatus: 'confirmed',
    notes: 'Excluded from business operating expenses',
  },
  {
    id: 'tx_14',
    transactionDate: '2026-10-16',
    description: 'Mukando Savings Club Round Pool Received',
    amount: 150.00,
    currency: 'USD',
    direction: 'inflow',
    type: 'loan_received',
    category: 'loan_in',
    reviewStatus: 'confirmed',
    notes: 'Mukando capital pool (not sales revenue)',
  },
  {
    id: 'tx_15',
    transactionDate: '2026-10-18',
    description: 'EcoCash Payment: Sugar, Rice & Drinks',
    amount: 64.00,
    currency: 'USD',
    direction: 'inflow',
    type: 'business_income',
    category: 'sales_goods',
    reviewStatus: 'confirmed',
  },
  {
    id: 'tx_16',
    transactionDate: '2026-10-22',
    description: 'Transfer from Farai Haulage (Unidentified)',
    amount: 25.00,
    currency: 'USD',
    direction: 'inflow',
    type: 'unknown',
    category: 'uncategorized',
    reviewStatus: 'pending_review',
    notes: 'Needs Mr Q verification',
  },
  {
    id: 'tx_17',
    transactionDate: '2026-10-24',
    description: 'Cash Sales: Friday Afternoon Weekend Rush',
    amount: 112.00,
    currency: 'USD',
    direction: 'inflow',
    type: 'business_income',
    category: 'sales_goods',
    reviewStatus: 'confirmed',
  },
];

const INITIAL_DEBTS: MobileDebt[] = [
  {
    id: 'debt_01',
    personName: 'Mai Panashe (Corner Stall)',
    direction: 'owed_to_business',
    totalAmount: 35.00,
    paidAmount: 15.00,
    currency: 'USD',
    recordedDate: '2026-10-14',
    dueDate: '2026-10-30',
    status: 'partially_paid',
    notes: 'Credit for 2x cooking oil and sugar',
  },
  {
    id: 'debt_02',
    personName: 'Baba Kevin',
    direction: 'owed_to_business',
    totalAmount: 22.50,
    paidAmount: 0.00,
    currency: 'USD',
    recordedDate: '2026-10-18',
    dueDate: '2026-10-28',
    status: 'outstanding',
    notes: 'Mealie meal 10kg bag',
  },
  {
    id: 'debt_03',
    personName: 'Farai Haulage Services',
    direction: 'owed_by_business',
    totalAmount: 40.00,
    paidAmount: 40.00,
    currency: 'USD',
    recordedDate: '2026-10-10',
    status: 'settled',
    notes: 'Vegetable crate delivery from Musika',
  },
];

export class MobileStorageService {
  static async getBusiness(): Promise<BusinessProfile> {
    const data = await AsyncStorage.getItem(STORAGE_KEY_BIZ);
    if (!data) {
      await AsyncStorage.setItem(STORAGE_KEY_BIZ, JSON.stringify(INITIAL_BUSINESS));
      return cloneSeed(INITIAL_BUSINESS);
    }
    return parseStored<BusinessProfile>(data, cloneSeed(INITIAL_BUSINESS));
  }

  static async updateBusiness(profile: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const current = await this.getBusiness();
    const updated = { ...current, ...profile };
    await AsyncStorage.setItem(STORAGE_KEY_BIZ, JSON.stringify(updated));
    return updated;
  }

  static async getTransactions(): Promise<MobileTransaction[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEY_TX);
    if (!data) {
      await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(INITIAL_TRANSACTIONS));
      return cloneSeed(INITIAL_TRANSACTIONS);
    }
    return parseStored<MobileTransaction[]>(data, cloneSeed(INITIAL_TRANSACTIONS));
  }

  static async saveTransaction(tx: Omit<MobileTransaction, 'id'>): Promise<MobileTransaction> {
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
    const all = await this.getTransactions();
    const idx = all.findIndex((t) => t.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(all));
    }
  }

  static async deleteTransaction(id: string): Promise<void> {
    const all = await this.getTransactions();
    const filtered = all.filter((t) => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(filtered));
  }

  static async getDebts(): Promise<MobileDebt[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEY_DEBTS);
    if (!data) {
      await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(INITIAL_DEBTS));
      return cloneSeed(INITIAL_DEBTS);
    }
    return parseStored<MobileDebt[]>(data, cloneSeed(INITIAL_DEBTS));
  }

  static async saveDebt(debt: Omit<MobileDebt, 'id' | 'paidAmount' | 'status'>): Promise<MobileDebt> {
    const all = await this.getDebts();
    const newDebt: MobileDebt = {
      ...debt,
      id: `debt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      paidAmount: 0,
      status: 'outstanding',
    };
    all.unshift(newDebt);
    await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(all));
    return newDebt;
  }

  static async recordDebtPayment(id: string, paymentAmount: number): Promise<number> {
    const all = await this.getDebts();
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) return 0;

    const debt = all[idx];
    const remaining = roundMoney(Math.max(0, debt.totalAmount - debt.paidAmount));
    const applied = Math.min(roundMoney(Math.max(0, paymentAmount)), remaining);
    if (applied <= 0) return 0;

    const newPaid = roundMoney(debt.paidAmount + applied);
    debt.paidAmount = newPaid;
    debt.status = newPaid >= debt.totalAmount ? 'settled' : 'partially_paid';
    await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(all));
    return applied;
  }

  static async deleteDebt(id: string): Promise<void> {
    const all = await this.getDebts();
    const filtered = all.filter((d) => d.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(filtered));
  }

  static async resetDemoData(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY_BIZ, JSON.stringify(INITIAL_BUSINESS));
    await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(INITIAL_TRANSACTIONS));
    await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(INITIAL_DEBTS));
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
}
