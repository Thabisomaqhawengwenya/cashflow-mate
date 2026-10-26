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
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === 'USD' ? `$${formatted}` : `${currency} ${formatted}`;
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
      return INITIAL_BUSINESS;
    }
    return JSON.parse(data);
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
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(data);
  }

  static async saveTransaction(tx: Omit<MobileTransaction, 'id'>): Promise<MobileTransaction> {
    const all = await this.getTransactions();
    const newTx: MobileTransaction = {
      ...tx,
      id: `tx_${Date.now()}`,
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
      return INITIAL_DEBTS;
    }
    return JSON.parse(data);
  }

  static async saveDebt(debt: Omit<MobileDebt, 'id' | 'paidAmount' | 'status'>): Promise<MobileDebt> {
    const all = await this.getDebts();
    const newDebt: MobileDebt = {
      ...debt,
      id: `debt_${Date.now()}`,
      paidAmount: 0,
      status: 'outstanding',
    };
    all.unshift(newDebt);
    await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(all));
    return newDebt;
  }

  static async recordDebtPayment(id: string, paymentAmount: number): Promise<void> {
    const all = await this.getDebts();
    const idx = all.findIndex((d) => d.id === id);
    if (idx !== -1) {
      const debt = all[idx];
      const newPaid = roundMoney(debt.paidAmount + paymentAmount);
      debt.paidAmount = newPaid;
      debt.status = newPaid >= debt.totalAmount ? 'settled' : 'partially_paid';
      await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(all));
    }
  }

  static async resetDemoData(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY_BIZ, JSON.stringify(INITIAL_BUSINESS));
    await AsyncStorage.setItem(STORAGE_KEY_TX, JSON.stringify(INITIAL_TRANSACTIONS));
    await AsyncStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(INITIAL_DEBTS));
  }

  /**
   * Deterministic financial summary calculation adhering strictly to Zimbabwe small trader accounting.
   */
  static calculateSummary(transactions: MobileTransaction[], period: 'this_month' | 'last_month' | 'all' = 'this_month') {
    let recordedInflows = 0;
    let recordedOutflows = 0;
    let operatingRevenue = 0;
    let operatingExpenses = 0;
    let unreviewedCount = 0;

    const categoryMap: Record<string, number> = {};

    for (const t of transactions) {
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
