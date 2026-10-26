/* eslint-disable import/first */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// In-memory mock for AsyncStorage before importing storage
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

import {
  formatMoney,
  roundMoney,
  getLocalDateString,
  getReportPeriodRange,
  categoryClassification,
  sortTransactionsByDateDesc,
  MobileStorageService,
  MobileTransaction,
} from '../storage';

import {
  generateTransactionFingerprint,
  parseCsvText,
  categorizeDescription,
  processCsvData,
  convertCsvRowsToTransactions,
  normalizeDate,
  normalizeCurrency,
  parseAmountCell,
} from '../csvImporter';

describe('Mobile Currency and Formatting', () => {
  it('formats positive and negative amounts correctly with correct sign placement', () => {
    expect(formatMoney(25.5, 'USD')).toBe('$25.50');
    expect(formatMoney(-5, 'USD')).toBe('-$5.00');
    expect(formatMoney(-0.01, 'USD')).toBe('-$0.01');
    expect(formatMoney(0, 'USD')).toBe('$0.00');
  });

  it('formats ZiG (ZWG) with the official currency label', () => {
    expect(formatMoney(100, 'ZWG')).toBe('ZiG 100.00');
    expect(formatMoney(-15.75, 'ZWG')).toBe('-ZiG 15.75');
  });

  it('formats South African Rand (ZAR) correctly', () => {
    expect(formatMoney(50, 'ZAR')).toBe('R 50.00');
    expect(formatMoney(-20, 'ZAR')).toBe('-R 20.00');
  });

  it('handles floating point precision safely via roundMoney', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(14.999)).toBe(15);
  });
});

describe('Date and Period Boundaries', () => {
  it('generates local date string YYYY-MM-DD without UTC day shift', () => {
    const fixedDate = new Date(2026, 9, 26, 1, 30); // October 26, 2026 01:30 local
    expect(getLocalDateString(fixedDate)).toBe('2026-10-26');
  });

  it('calculates exact local boundaries for report periods', () => {
    const now = new Date(2026, 9, 15); // October 15, 2026
    const thisMonth = getReportPeriodRange('this_month', now);
    expect(thisMonth.startDate).toBe('2026-10-01');
    expect(thisMonth.endDate).toBe('2026-10-31');

    const lastMonth = getReportPeriodRange('last_month', now);
    expect(lastMonth.startDate).toBe('2026-09-01');
    expect(lastMonth.endDate).toBe('2026-09-30');

    const all = getReportPeriodRange('all', now);
    expect(all.startDate).toBe('0000-01-01');
    expect(all.endDate).toBe('9999-12-31');
  });
});

describe('Category to Classification Mapping', () => {
  it('synchronizes owner drawings to withdrawal outflow so it never corrupts operating profit', () => {
    const res = categoryClassification('owner_drawings');
    expect(res.type).toBe('owner_withdrawal');
    expect(res.direction).toBe('outflow');
  });

  it('synchronizes internal shift to neutral transfer', () => {
    const res = categoryClassification('transfer_internal');
    expect(res.type).toBe('transfer');
    expect(res.direction).toBe('neutral');
  });

  it('synchronizes stock purchase to business expense outflow', () => {
    const res = categoryClassification('stock_purchase');
    expect(res.type).toBe('business_expense');
    expect(res.direction).toBe('outflow');
  });

  it('synchronizes sales of goods to business income inflow', () => {
    const res = categoryClassification('sales_goods');
    expect(res.type).toBe('business_income');
    expect(res.direction).toBe('inflow');
  });
});

describe('Deterministic Financial Summary & Currency Segregation', () => {
  const sampleTransactions: MobileTransaction[] = [
    {
      id: 'tx_1',
      transactionDate: '2026-10-05',
      description: 'Customer Bread & Sugar Sale',
      amount: 100,
      currency: 'USD',
      direction: 'inflow',
      type: 'business_income',
      category: 'sales_goods',
      reviewStatus: 'confirmed',
    },
    {
      id: 'tx_2',
      transactionDate: '2026-10-06',
      description: 'Bakery Stock Purchase',
      amount: 40,
      currency: 'USD',
      direction: 'outflow',
      type: 'business_expense',
      category: 'stock_purchase',
      reviewStatus: 'confirmed',
    },
    {
      id: 'tx_3',
      transactionDate: '2026-10-07',
      description: 'Personal Home Drawing',
      amount: 20,
      currency: 'USD',
      direction: 'outflow',
      type: 'owner_withdrawal',
      category: 'owner_drawings',
      reviewStatus: 'confirmed',
    },
    {
      id: 'tx_4',
      transactionDate: '2026-10-08',
      description: 'Account Shift to Safe Box',
      amount: 15,
      currency: 'USD',
      direction: 'neutral',
      type: 'transfer',
      category: 'transfer_internal',
      reviewStatus: 'confirmed',
    },
    // Transaction in September (different month)
    {
      id: 'tx_prev_month',
      transactionDate: '2026-09-20',
      description: 'September Sales',
      amount: 80,
      currency: 'USD',
      direction: 'inflow',
      type: 'business_income',
      category: 'sales_goods',
      reviewStatus: 'confirmed',
    },
    // Transaction in ZiG (must not contaminate USD)
    {
      id: 'tx_zig',
      transactionDate: '2026-10-10',
      description: 'ZiG Customer Cash',
      amount: 500,
      currency: 'ZWG',
      direction: 'inflow',
      type: 'business_income',
      category: 'sales_goods',
      reviewStatus: 'confirmed',
    },
  ];

  const now = new Date(2026, 9, 15); // October 2026

  it('calculates USD summary strictly excluding other currencies and other months', () => {
    const summary = MobileStorageService.calculateSummary(sampleTransactions, {
      period: 'this_month',
      currency: 'USD',
      now,
    });

    expect(summary.currency).toBe('USD');
    expect(summary.transactionCount).toBe(4); // tx_1, tx_2, tx_3, tx_4
    expect(summary.recordedInflows).toBe(100); // tx_1
    expect(summary.recordedOutflows).toBe(60); // tx_2 ($40) + tx_3 ($20)
    expect(summary.netCashFlow).toBe(40); // 100 - 60
    expect(summary.operatingRevenue).toBe(100);
    expect(summary.operatingExpenses).toBe(40); // Only stock purchase; personal drawing ($20) excluded!
    expect(summary.estimatedOperatingProfit).toBe(60); // 100 - 40
  });

  it('filters by last_month correctly', () => {
    const summary = MobileStorageService.calculateSummary(sampleTransactions, {
      period: 'last_month',
      currency: 'USD',
      now,
    });

    expect(summary.transactionCount).toBe(1);
    expect(summary.recordedInflows).toBe(80);
    expect(summary.netCashFlow).toBe(80);
  });

  it('segregates ZiG currency without contaminating USD balances', () => {
    const summaryZig = MobileStorageService.calculateSummary(sampleTransactions, {
      period: 'this_month',
      currency: 'ZWG',
      now,
    });

    expect(summaryZig.transactionCount).toBe(1);
    expect(summaryZig.recordedInflows).toBe(500);
    expect(summaryZig.netCashFlow).toBe(500);
  });
});

describe('Debts and Clamped Payments', () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  it('clamps debt payment to the outstanding balance and updates status to settled', async () => {
    const debt = await MobileStorageService.saveDebt({
      personName: 'Mai Panashe',
      direction: 'owed_to_business',
      totalAmount: 50,
      currency: 'USD',
      recordedDate: '2026-10-15',
    });

    // Pay partial
    const applied1 = await MobileStorageService.recordDebtPayment(debt.id, 20);
    expect(applied1).toBe(20);

    const debtsAfter1 = await MobileStorageService.getDebts();
    expect(debtsAfter1[0].paidAmount).toBe(20);
    expect(debtsAfter1[0].status).toBe('partially_paid');

    // Attempt to overpay ($50 more when only $30 remains)
    const applied2 = await MobileStorageService.recordDebtPayment(debt.id, 50);
    expect(applied2).toBe(30); // Clamped!

    const debtsAfter2 = await MobileStorageService.getDebts();
    expect(debtsAfter2[0].paidAmount).toBe(50);
    expect(debtsAfter2[0].status).toBe('settled');
  });
});

describe('Date Sorting Helper', () => {
  it('sorts transactions in stable newest-first order', () => {
    const items: MobileTransaction[] = [
      {
        id: 'tx_100',
        transactionDate: '2026-10-01',
        description: 'Oldest',
        amount: 10,
        currency: 'USD',
        direction: 'inflow',
        type: 'business_income',
        category: 'sales_goods',
        reviewStatus: 'confirmed',
      },
      {
        id: 'tx_300',
        transactionDate: '2026-10-25',
        description: 'Newest',
        amount: 30,
        currency: 'USD',
        direction: 'inflow',
        type: 'business_income',
        category: 'sales_goods',
        reviewStatus: 'confirmed',
      },
      {
        id: 'tx_200',
        transactionDate: '2026-10-15',
        description: 'Middle',
        amount: 20,
        currency: 'USD',
        direction: 'inflow',
        type: 'business_income',
        category: 'sales_goods',
        reviewStatus: 'confirmed',
      },
    ];

    const sorted = sortTransactionsByDateDesc(items);
    expect(sorted[0].id).toBe('tx_300');
    expect(sorted[1].id).toBe('tx_200');
    expect(sorted[2].id).toBe('tx_100');
  });
});

describe('CSV Importer and Fingerprinting', () => {
  it('generates consistent transaction fingerprints matching the web pipeline', () => {
    const fp1 = generateTransactionFingerprint('2026-10-25', 22.00, 'EcoCash Merchant: Bread Sale', 'USD');
    const fp2 = generateTransactionFingerprint('2026-10-25', 22, 'ecocash merchant bread sale', 'USD');
    expect(fp1).toBe(fp2);
  });

  it('parses CSV text handling quotes, commas, and delimiters', () => {
    const csv = `Date,Description,Amount,Reference
2026-10-25,"Bakers Inn, 50 Crates",55.00,REF1001
2026-10-26,EcoCash Fee,1.50,REF1002`;

    const { headers, rows } = parseCsvText(csv);
    expect(headers).toEqual(['date', 'description', 'amount', 'reference']);
    expect(rows.length).toBe(2);
    expect(rows[0].description).toBe('Bakers Inn, 50 Crates');
    expect(rows[0].amount).toBe('55.00');
  });

  it('categorizes Zimbabwean descriptions with domain heuristics', () => {
    expect(categorizeDescription('EcoCash Merchant fee')).toBe('mobile_money_fees');
    expect(categorizeDescription('ZETDC 50kWh Token')).toBe('utilities_electricity');
    expect(categorizeDescription('Bakers Inn Sliced Bread Restock')).toBe('stock_purchase');
    expect(categorizeDescription('Kombi fuel haulage from Mbare')).toBe('transport_fuel');
    expect(categorizeDescription('Mbare Council Stall Monthly Rent')).toBe('rent');
    expect(categorizeDescription('Personal drawings for groceries')).toBe('owner_drawings');
  });

  it('detects duplicate transactions against existing records', () => {
    const existing: MobileTransaction[] = [
      {
        id: 'tx_exist',
        transactionDate: '2026-10-25',
        description: 'EcoCash Merchant Payment',
        amount: 22.00,
        currency: 'USD',
        direction: 'inflow',
        type: 'business_income',
        category: 'sales_goods',
        reviewStatus: 'confirmed',
      },
    ];

    const csv = `Date,Description,Amount,Reference
2026-10-25,"EcoCash Merchant Payment",22.00,REF1
2026-10-26,"New Wholesale Restock",45.00,REF2`;

    const result = processCsvData(csv, existing, 'USD');
    expect(result.totalRows).toBe(2);
    expect(result.validRows).toBe(2);
    expect(result.duplicateCount).toBe(1);
    expect(result.newRows).toBe(1);
    expect(result.rows[0].isDuplicate).toBe(true);
    expect(result.rows[1].isDuplicate).toBe(false);

    const converted = convertCsvRowsToTransactions(result.rows, true);
    expect(converted.length).toBe(1);
    expect(converted[0].description).toBe('New Wholesale Restock');
  });
});

describe('CSV Importer Edge Cases', () => {
  it('normalizes DD/MM and unambiguous MM/DD dates and rejects invalid dates', () => {
    expect(normalizeDate('2026-10-25')).toBe('2026-10-25');
    expect(normalizeDate('25/10/2026')).toBe('2026-10-25');
    expect(normalizeDate('10/25/2026')).toBe('2026-10-25');
    expect(normalizeDate('31/02/2026')).toBeNull();
    expect(normalizeDate('not-a-date')).toBeNull();
  });

  it('normalizes currency symbols and codes to app currency codes', () => {
    expect(normalizeCurrency('usd', 'ZWG')).toBe('USD');
    expect(normalizeCurrency('ZiG', 'USD')).toBe('ZWG');
    expect(normalizeCurrency('ZWL', 'USD')).toBe('ZWG');
    expect(normalizeCurrency('R', 'USD')).toBe('ZAR');
    expect(normalizeCurrency('', 'ZWG')).toBe('ZWG');
  });

  it('parses dirty amount cells including parentheses as negative', () => {
    expect(parseAmountCell('$1,234.50')).toBe(1234.5);
    expect(parseAmountCell('(45.00)')).toBe(-45);
    expect(parseAmountCell('-12.00')).toBe(-12);
    expect(parseAmountCell('')).toBeNull();
  });

  it('flags duplicate rows inside the same file and skips invalid rows', () => {
    const csv = `Date,Description,Amount,Currency
2026-10-25,Bakers Inn Stock,-30.00,USD
2026-10-25,Bakers Inn Stock,-30.00,USD
31/02/2026,Invalid date row,-5.00,USD
2026-10-26,Customer sale,25.00,USD`;
    const result = processCsvData(csv, [], 'USD');
    expect(result.totalRows).toBe(4);
    expect(result.validRows).toBe(3);
    expect(result.invalidRows).toBe(1);
    expect(result.duplicateCount).toBe(1);
    expect(result.newRows).toBe(2);
  });

  it('honours an explicit currency column instead of the default currency', () => {
    const csv = `Date,Description,Amount,Currency
2026-10-25,Customer payment,25.00,USD`;
    const result = processCsvData(csv, [], 'ZWG');
    expect(result.rows[0].currency).toBe('USD');
  });

  it('forces category-consistent direction for positive expense rows', () => {
    const csv = `Date,Description,Amount
2026-10-25,Bakers Inn Wholesale Bread Restock,33.00`;
    const result = processCsvData(csv, [], 'USD');
    expect(result.rows[0].direction).toBe('outflow');
    const converted = convertCsvRowsToTransactions(result.rows, true);
    expect(converted[0].direction).toBe('outflow');
    expect(converted[0].type).toBe('business_expense');
  });

  it('parses debit/credit bank columns into directions', () => {
    const csv = `Posting Date,Details,Debit,Credit,Currency
2026-10-25,POS Settlement,,145.00,USD
2026-10-25,National Foods Restock,95.00,,USD`;
    const result = processCsvData(csv, [], 'USD');
    expect(result.rows[0].direction).toBe('inflow');
    expect(result.rows[1].direction).toBe('outflow');
  });
});
