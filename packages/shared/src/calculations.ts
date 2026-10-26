import { Transaction, FinancialSummary, CurrencyCode, CategoryKey } from './types';
import { roundCurrency } from './currency';
import { STANDARD_CATEGORIES } from './constants';

export interface CalculationOptions {
  currency: CurrencyCode;
  startDate?: string;
  endDate?: string;
  periodLabel?: string;
  priorPeriodTransactions?: Transaction[];
  priorPeriodLabel?: string;
}

/**
 * Calculates deterministic financial metrics from a set of normalized transactions.
 * Strict financial rules applied:
 * 1. Internal transfers (type === 'transfer') are neutral cash movements; excluded from both income and expenses.
 * 2. Loan proceeds (type === 'loan_received') and owner capital (type === 'owner_contribution') are cash inflows,
 *    but segregated from operating revenue.
 * 3. Owner drawings (type === 'owner_withdrawal') and loan repayments (type === 'loan_repayment') are cash outflows,
 *    but segregated from operating expenses.
 * 4. Net cash flow = Recorded Inflows - Recorded Outflows (Cash flow != Profit).
 * 5. Estimated Operating Profit = Operating Revenue - Operating Expenses (with clear disclosure).
 * 6. Zero-division guard on period comparisons.
 */
export function calculateFinancialSummary(
  transactions: Transaction[],
  options: CalculationOptions
): FinancialSummary {
  const {
    currency,
    startDate = '',
    endDate = '',
    periodLabel = 'Current Period',
    priorPeriodTransactions,
    priorPeriodLabel = 'Prior Period'
  } = options;

  // Filter transactions to matching currency (strict isolation)
  const filtered = transactions.filter((t) => t.currency === currency);

  let recordedInflows = 0;
  let recordedOutflows = 0;
  let operatingRevenue = 0;
  let operatingExpenses = 0;
  let unreviewedCount = 0;
  let inflowTransactionCount = 0;
  let outflowTransactionCount = 0;
  let neutralTransactionCount = 0;

  const categoryMap = new Map<CategoryKey, { amount: number; count: number; direction: 'inflow' | 'outflow' | 'neutral' }>();
  const dailyCashFlowMap = new Map<string, { inflow: number; outflow: number }>();

  for (const t of filtered) {
    const amount = roundCurrency(t.amount);

    if (t.reviewStatus === 'pending_review' || t.category === 'uncategorized') {
      unreviewedCount++;
    }

    // Accumulate daily trend data
    const dateKey = t.transactionDate.substring(0, 10);
    const dayEntry = dailyCashFlowMap.get(dateKey) || { inflow: 0, outflow: 0 };

    if (t.type === 'transfer' || t.direction === 'neutral') {
      neutralTransactionCount++;
    } else if (t.direction === 'inflow') {
      recordedInflows = roundCurrency(recordedInflows + amount);
      inflowTransactionCount++;
      dayEntry.inflow = roundCurrency(dayEntry.inflow + amount);

      if (t.type === 'business_income') {
        operatingRevenue = roundCurrency(operatingRevenue + amount);
      }
    } else if (t.direction === 'outflow') {
      recordedOutflows = roundCurrency(recordedOutflows + amount);
      outflowTransactionCount++;
      dayEntry.outflow = roundCurrency(dayEntry.outflow + amount);

      if (t.type === 'business_expense') {
        operatingExpenses = roundCurrency(operatingExpenses + amount);
      }
    }

    dailyCashFlowMap.set(dateKey, dayEntry);

    // Group by category (excluding internal transfers from expense/income pie charts)
    if (t.type !== 'transfer') {
      const existing = categoryMap.get(t.category) || { amount: 0, count: 0, direction: t.direction };
      existing.amount = roundCurrency(existing.amount + amount);
      existing.count += 1;
      categoryMap.set(t.category, existing);
    }
  }

  const netCashFlow = roundCurrency(recordedInflows - recordedOutflows);
  const operatingProfitAmount = roundCurrency(operatingRevenue - operatingExpenses);

  // Category breakdown calculation
  const totalOutflowsForPct = recordedOutflows > 0 ? recordedOutflows : 1;
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([categoryKey, val]) => {
      const def = STANDARD_CATEGORIES[categoryKey];
      const percentage = roundCurrency((val.amount / totalOutflowsForPct) * 100);
      return {
        category: categoryKey,
        label: def ? def.label : categoryKey,
        amount: val.amount,
        percentageOfTotal: percentage,
        direction: val.direction,
        count: val.count
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Chronological cash flow points
  const cashFlowOverTime = Array.from(dailyCashFlowMap.entries())
    .map(([date, val]) => ({
      date,
      inflow: val.inflow,
      outflow: val.outflow,
      net: roundCurrency(val.inflow - val.outflow)
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Prior period comparison
  let comparison: FinancialSummary['comparison'] = undefined;
  if (priorPeriodTransactions) {
    const priorFiltered = priorPeriodTransactions.filter((t) => t.currency === currency);
    let priorInflows = 0;
    let priorOutflows = 0;

    for (const pt of priorFiltered) {
      if (pt.type === 'transfer' || pt.direction === 'neutral') continue;
      if (pt.direction === 'inflow') {
        priorInflows = roundCurrency(priorInflows + pt.amount);
      } else if (pt.direction === 'outflow') {
        priorOutflows = roundCurrency(priorOutflows + pt.amount);
      }
    }

    const priorNetCashFlow = roundCurrency(priorInflows - priorOutflows);
    const inflowDelta = roundCurrency(recordedInflows - priorInflows);
    const outflowDelta = roundCurrency(recordedOutflows - priorOutflows);

    const inflowPercentageChange =
      priorInflows > 0 ? roundCurrency(((recordedInflows - priorInflows) / priorInflows) * 100) : null;
    const outflowPercentageChange =
      priorOutflows > 0 ? roundCurrency(((recordedOutflows - priorOutflows) / priorOutflows) * 100) : null;

    comparison = {
      priorLabel: priorPeriodLabel,
      priorInflows,
      priorOutflows,
      priorNetCashFlow,
      inflowDelta,
      inflowPercentageChange,
      outflowDelta,
      outflowPercentageChange
    };
  }

  return {
    period: {
      startDate,
      endDate,
      label: periodLabel
    },
    currency,
    recordedInflows,
    recordedOutflows,
    netCashFlow,
    estimatedOperatingProfit: {
      amount: operatingProfitAmount,
      operatingRevenue,
      operatingExpenses,
      isEstimateIncomplete: true,
      disclosure:
        'Operating profit estimate accounts for recorded sales and operating expenses. Does not account for unpaid stock credit or closing inventory variations.'
    },
    unreviewedCount,
    totalTransactionsCount: filtered.length,
    inflowTransactionCount,
    outflowTransactionCount,
    neutralTransactionCount,
    categoryBreakdown,
    cashFlowOverTime,
    comparison
  };
}
