import { describe, it, expect } from 'vitest';
import { calculateFinancialSummary } from './calculations';
import { Transaction } from './types';
import { roundCurrency, safeParseDecimal, formatMoney } from './currency';

describe('Financial Calculation Engine', () => {
  const baseTransaction: Omit<Transaction, 'id' | 'amount' | 'direction' | 'type' | 'category'> = {
    businessId: 'biz_1',
    transactionDate: '2026-10-20',
    description: 'Test transaction',
    currency: 'USD',
    reviewStatus: 'confirmed',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z'
  };

  it('accurately sums recorded inflows and excludes internal transfers', () => {
    const transactions: Transaction[] = [
      {
        ...baseTransaction,
        id: '1',
        amount: 150.0,
        direction: 'inflow',
        type: 'business_income',
        category: 'sales_goods'
      },
      {
        ...baseTransaction,
        id: '2',
        amount: 50.0,
        direction: 'inflow',
        type: 'business_income',
        category: 'service_fee'
      },
      {
        ...baseTransaction,
        id: '3',
        amount: 200.0,
        direction: 'neutral',
        type: 'transfer',
        category: 'transfer_internal'
      }
    ];

    const result = calculateFinancialSummary(transactions, { currency: 'USD' });
    expect(result.recordedInflows).toBe(200.0);
    expect(result.inflowTransactionCount).toBe(2);
    expect(result.neutralTransactionCount).toBe(1);
  });

  it('segregates loan proceeds and owner contributions from operating revenue', () => {
    const transactions: Transaction[] = [
      {
        ...baseTransaction,
        id: '1',
        amount: 300.0,
        direction: 'inflow',
        type: 'business_income',
        category: 'sales_goods'
      },
      {
        ...baseTransaction,
        id: '2',
        amount: 500.0,
        direction: 'inflow',
        type: 'loan_received',
        category: 'loan_in'
      },
      {
        ...baseTransaction,
        id: '3',
        amount: 200.0,
        direction: 'inflow',
        type: 'owner_contribution',
        category: 'other_income'
      }
    ];

    const result = calculateFinancialSummary(transactions, { currency: 'USD' });
    // Total cash in = 300 + 500 + 200 = 1000
    expect(result.recordedInflows).toBe(1000.0);
    // Operating sales revenue = only 300
    expect(result.estimatedOperatingProfit.operatingRevenue).toBe(300.0);
  });

  it('segregates owner drawings and loan repayments from operating expenses', () => {
    const transactions: Transaction[] = [
      {
        ...baseTransaction,
        id: '1',
        amount: 120.0,
        direction: 'outflow',
        type: 'business_expense',
        category: 'stock_purchase'
      },
      {
        ...baseTransaction,
        id: '2',
        amount: 40.0,
        direction: 'outflow',
        type: 'owner_withdrawal',
        category: 'owner_drawings'
      },
      {
        ...baseTransaction,
        id: '3',
        amount: 60.0,
        direction: 'outflow',
        type: 'loan_repayment',
        category: 'loan_out'
      }
    ];

    const result = calculateFinancialSummary(transactions, { currency: 'USD' });
    // Total cash out = 120 + 40 + 60 = 220
    expect(result.recordedOutflows).toBe(220.0);
    // Operating expenses = only 120
    expect(result.estimatedOperatingProfit.operatingExpenses).toBe(120.0);
  });

  it('correctly calculates net cash flow = recorded inflows - recorded outflows', () => {
    const transactions: Transaction[] = [
      {
        ...baseTransaction,
        id: '1',
        amount: 500.0,
        direction: 'inflow',
        type: 'business_income',
        category: 'sales_goods'
      },
      {
        ...baseTransaction,
        id: '2',
        amount: 320.0,
        direction: 'outflow',
        type: 'business_expense',
        category: 'stock_purchase'
      }
    ];

    const result = calculateFinancialSummary(transactions, { currency: 'USD' });
    expect(result.netCashFlow).toBe(180.0);
    expect(result.estimatedOperatingProfit.amount).toBe(180.0);
  });

  it('strictly isolates currencies and ignores transactions in another currency', () => {
    const transactions: Transaction[] = [
      {
        ...baseTransaction,
        id: '1',
        amount: 100.0,
        currency: 'USD',
        direction: 'inflow',
        type: 'business_income',
        category: 'sales_goods'
      },
      {
        ...baseTransaction,
        id: '2',
        amount: 5000.0,
        currency: 'ZWG',
        direction: 'inflow',
        type: 'business_income',
        category: 'sales_goods'
      }
    ];

    const usdResult = calculateFinancialSummary(transactions, { currency: 'USD' });
    expect(usdResult.recordedInflows).toBe(100.0);
    expect(usdResult.totalTransactionsCount).toBe(1);

    const zwgResult = calculateFinancialSummary(transactions, { currency: 'ZWG' });
    expect(zwgResult.recordedInflows).toBe(5000.0);
    expect(zwgResult.totalTransactionsCount).toBe(1);
  });

  it('safely handles zero prior period values in comparisons without division by zero', () => {
    const current: Transaction[] = [
      {
        ...baseTransaction,
        id: '1',
        amount: 250.0,
        direction: 'inflow',
        type: 'business_income',
        category: 'sales_goods'
      }
    ];

    const prior: Transaction[] = []; // Zero prior transactions

    const result = calculateFinancialSummary(current, {
      currency: 'USD',
      priorPeriodTransactions: prior,
      priorPeriodLabel: 'Last Month'
    });

    expect(result.comparison).toBeDefined();
    expect(result.comparison?.priorInflows).toBe(0);
    expect(result.comparison?.inflowDelta).toBe(250.0);
    expect(result.comparison?.inflowPercentageChange).toBeNull(); // No Infinity
  });

  it('prevents floating-point drift with epsilon rounding (0.1 + 0.2 = 0.3)', () => {
    const sum = roundCurrency(0.1 + 0.2);
    expect(sum).toBe(0.3);

    const formatted = formatMoney(0.1 + 0.2, 'USD');
    expect(formatted).toBe('$0.30');
  });

  it('safely parses dirty string amounts into decimal numbers', () => {
    expect(safeParseDecimal('$1,250.50')).toBe(1250.5);
    expect(safeParseDecimal('(45.00)')).toBe(-45.0);
    expect(safeParseDecimal('ZiG 3,400.25')).toBe(3400.25);
    expect(safeParseDecimal('invalid')).toBeNull();
    expect(safeParseDecimal('')).toBeNull();
  });
});
