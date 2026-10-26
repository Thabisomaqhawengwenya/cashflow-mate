/**
 * CashFlow Mate Shared Domain Types
 */

export type CurrencyCode = 'USD' | 'ZWG' | 'ZAR';

export type TransactionType =
  | 'business_income'
  | 'business_expense'
  | 'transfer'
  | 'loan_received'
  | 'loan_repayment'
  | 'owner_contribution'
  | 'owner_withdrawal'
  | 'refund'
  | 'reversal'
  | 'unknown';

export type TransactionDirection = 'inflow' | 'outflow' | 'neutral';

export type ReviewStatus = 'confirmed' | 'pending_review' | 'flagged';

export type CategoryKey =
  | 'sales_goods'
  | 'service_fee'
  | 'stock_purchase'
  | 'rent'
  | 'transport_fuel'
  | 'utilities_electricity'
  | 'mobile_money_fees'
  | 'wages_labor'
  | 'packaging'
  | 'equipment_repair'
  | 'owner_drawings'
  | 'transfer_internal'
  | 'loan_in'
  | 'loan_out'
  | 'other_expense'
  | 'other_income'
  | 'uncategorized';

export interface CategoryDefinition {
  key: CategoryKey;
  label: string;
  defaultType: TransactionType;
  direction: TransactionDirection;
  iconName: string;
  description: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  businessType: string;
  currency: CurrencyCode;
  country: string;
  preferredLanguage: string;
  createdAt: string;
}

export interface Account {
  id: string;
  businessId: string;
  name: string;
  type: 'mobile_money' | 'cash' | 'bank';
  currency: CurrencyCode;
  balance?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  businessId: string;
  accountId?: string;
  accountName?: string;
  importJobId?: string;
  transactionDate: string; // YYYY-MM-DD
  description: string;
  originalReference?: string;
  amount: number; // Stored as positive decimal
  currency: CurrencyCode;
  direction: TransactionDirection;
  type: TransactionType;
  category: CategoryKey;
  reviewStatus: ReviewStatus;
  aiConfidence?: number;
  aiReasoning?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  businessId: string;
  personName: string;
  direction: 'owed_to_business' | 'owed_by_business';
  totalAmount: number;
  paidAmount: number;
  currency: CurrencyCode;
  recordedDate: string;
  dueDate?: string;
  status: 'outstanding' | 'partially_paid' | 'settled' | 'written_off';
  notes?: string;
  createdAt: string;
}

export interface ImportJob {
  id: string;
  businessId: string;
  filename: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  duplicateRows: number;
  status: 'pending' | 'completed' | 'failed';
  errorSummary?: string;
  createdAt: string;
}

export interface ParsedCsvRow {
  rowNumber: number;
  rawDate: string;
  rawDescription: string;
  rawAmount: string;
  rawType?: string;
  rawReference?: string;
  rawCurrency?: string;
  parsedDate?: string;
  parsedAmount?: number;
  normalizedDirection?: TransactionDirection;
  normalizedType?: TransactionType;
  suggestedCategory?: CategoryKey;
  isDuplicate?: boolean;
  isValid: boolean;
  error?: string;
}

export interface FinancialSummary {
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  currency: CurrencyCode;
  recordedInflows: number;
  recordedOutflows: number;
  netCashFlow: number;
  estimatedOperatingProfit: {
    amount: number;
    operatingRevenue: number;
    operatingExpenses: number;
    isEstimateIncomplete: boolean;
    disclosure: string;
  };
  unreviewedCount: number;
  totalTransactionsCount: number;
  inflowTransactionCount: number;
  outflowTransactionCount: number;
  neutralTransactionCount: number;
  categoryBreakdown: {
    category: CategoryKey;
    label: string;
    amount: number;
    percentageOfTotal: number;
    direction: TransactionDirection;
    count: number;
  }[];
  cashFlowOverTime: {
    date: string;
    inflow: number;
    outflow: number;
    net: number;
  }[];
  comparison?: {
    priorLabel: string;
    priorInflows: number;
    priorOutflows: number;
    priorNetCashFlow: number;
    inflowDelta: number;
    inflowPercentageChange: number | null;
    outflowDelta: number;
    outflowPercentageChange: number | null;
  };
}

export interface AIInsight {
  id: string;
  type: 'info' | 'warning' | 'positive' | 'action';
  title: string;
  description: string;
  metricComparison?: string;
  suggestedAction?: string;
}
