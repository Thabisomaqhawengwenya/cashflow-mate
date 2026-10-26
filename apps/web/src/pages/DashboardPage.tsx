import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { FinancialSummary, Transaction, formatMoney, STANDARD_CATEGORIES, CategoryKey } from '@cashflow-mate/shared';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  HelpCircle,
  Plus,
  UploadCloud,
  Sparkles,
  ChevronRight,
  Calendar,
  CheckCircle,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { business, setCurrentTab } = useAuth();
  const [periodType, setPeriodType] = useState<string>('this_month');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [showProfitDisclosure, setShowProfitDisclosure] = useState<boolean>(false);

  // New Transaction Form State
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [newDesc, setNewDesc] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newType, setNewType] = useState<string>('business_income');
  const [newCategory, setNewCategory] = useState<string>('sales_goods');
  const [newNotes, setNewNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const summaryData = await api.getTransactionSummary({
        periodType,
        currency: business?.currency || 'USD'
      });
      setSummary(summaryData);

      const txData = await api.getTransactions({ limit: 6 });
      setRecentTransactions(txData.transactions);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodType, business?.currency]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    setSubmitting(true);
    try {
      const direction =
        newType === 'business_income' || newType === 'loan_received' || newType === 'owner_contribution'
          ? 'inflow'
          : newType === 'transfer'
          ? 'neutral'
          : 'outflow';

      await api.createTransaction({
        transactionDate: newDate,
        description: newDesc,
        amount: amountVal,
        currency: business?.currency || 'USD',
        direction,
        type: newType,
        category: newCategory,
        notes: newNotes,
        reviewStatus: 'confirmed'
      });

      setIsAddModalOpen(false);
      setNewDesc('');
      setNewAmount('');
      setNewNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting and Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-md-outline-variant/30">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-md-on-surface">
            Financial Overview
          </h1>
          <p className="text-xs text-md-on-surface-variant mt-0.5">
            Real-time cash flow intelligence for{' '}
            <strong className="text-md-on-surface">{business?.name}</strong>.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex items-center p-1 bg-md-surface-container rounded-lg border border-md-outline-variant/30 text-xs font-medium self-start sm:self-auto">
          {[
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'this_week', label: 'This Week' },
            { id: 'all', label: 'All Records' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriodType(item.id)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                periodType === item.id
                  ? 'bg-md-surface-container-lowest text-md-primary font-semibold shadow-xs'
                  : 'text-md-on-surface-variant hover:text-md-on-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recorded Inflows */}
        <Card variant="elevated" shape="lg" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-md-on-surface-variant mb-2">
            <span>Recorded Inflows</span>
            <div className="w-7 h-7 rounded-full bg-finance-inflow-container text-finance-inflow flex items-center justify-center">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-finance-inflow tabular-nums">
              {formatMoney(summary?.recordedInflows || 0, business?.currency)}
            </div>
            {summary?.comparison && (
              <span className="text-[11px] text-md-on-surface-variant mt-1 block">
                {summary.comparison.inflowDelta >= 0 ? '+' : ''}
                {formatMoney(summary.comparison.inflowDelta, business?.currency)} vs {summary.comparison.priorLabel}
              </span>
            )}
          </div>
        </Card>

        {/* Recorded Outflows */}
        <Card variant="elevated" shape="lg" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-md-on-surface-variant mb-2">
            <span>Recorded Outflows</span>
            <div className="w-7 h-7 rounded-full bg-finance-outflow-container text-finance-outflow flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-finance-outflow tabular-nums">
              {formatMoney(summary?.recordedOutflows || 0, business?.currency)}
            </div>
            {summary?.comparison && (
              <span className="text-[11px] text-md-on-surface-variant mt-1 block">
                {summary.comparison.outflowDelta >= 0 ? '+' : ''}
                {formatMoney(summary.comparison.outflowDelta, business?.currency)} vs {summary.comparison.priorLabel}
              </span>
            )}
          </div>
        </Card>

        {/* Net Recorded Cash Flow */}
        <Card variant="elevated" shape="lg" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-medium text-md-on-surface-variant mb-2">
            <span>Net Cash Flow</span>
            <div className="w-7 h-7 rounded-full bg-md-primary-container text-md-primary flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold tabular-nums ${
                (summary?.netCashFlow || 0) >= 0 ? 'text-md-primary' : 'text-finance-outflow'
              }`}
            >
              {(summary?.netCashFlow || 0) >= 0 ? '+' : ''}
              {formatMoney(summary?.netCashFlow || 0, business?.currency)}
            </div>
            <span className="text-[11px] text-md-on-surface-variant mt-1 block">
              Inflows minus recorded outflows
            </span>
          </div>
        </Card>

        {/* Estimated Operating Profit */}
        <Card variant="elevated" shape="lg" padding="md" className="flex flex-col justify-between relative">
          <div className="flex items-center justify-between text-xs font-medium text-md-on-surface-variant mb-2">
            <div className="flex items-center gap-1.5">
              <span>Estimated Profit</span>
              <button
                onClick={() => setShowProfitDisclosure(!showProfitDisclosure)}
                className="text-md-on-surface-variant hover:text-md-primary"
                title="View accounting assumptions"
              >
                <Info size={13} />
              </button>
            </div>
            <div className="w-7 h-7 rounded-full bg-md-tertiary-container text-md-tertiary flex items-center justify-center">
              <CheckCircle size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-md-tertiary tabular-nums">
              {formatMoney(summary?.estimatedOperatingProfit.amount || 0, business?.currency)}
            </div>
            <span className="text-[11px] text-md-on-surface-variant mt-1 block">
              Operating sales minus overhead
            </span>
          </div>

          {/* Profit Disclosure Overlay */}
          {showProfitDisclosure && (
            <div className="absolute inset-x-2 bottom-2 p-3 bg-md-surface-container-highest text-[11px] text-md-on-surface rounded-lg shadow-lg border border-md-outline-variant z-10 animate-fade-in">
              <div className="flex items-start justify-between gap-1 mb-1">
                <strong className="font-semibold text-md-primary">Calculation Assumptions:</strong>
                <button
                  onClick={() => setShowProfitDisclosure(false)}
                  className="text-md-on-surface-variant hover:text-md-on-surface text-xs font-bold"
                >
                  &times;
                </button>
              </div>
              <p className="leading-snug text-md-on-surface-variant">
                Estimated from trading sales minus stock and operational expenses. Excludes loan principal, owner personal drawings, and internal float transfers. Closing stock changes are not yet accounted for.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Unreviewed Transactions Notice Banner (If Any) */}
      {(summary?.unreviewedCount || 0) > 0 && (
        <div className="p-3.5 bg-finance-review-container text-finance-review rounded-lg border border-finance-review/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <span>
              You have <strong>{summary?.unreviewedCount} unreviewed transaction(s)</strong> that need categorization.
            </span>
          </div>
          <Button
            variant="tonal"
            size="sm"
            onClick={() => setCurrentTab('transactions')}
            className="shrink-0 text-xs font-semibold"
          >
            Review Now
          </Button>
        </div>
      )}

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Timeline Chart */}
        <Card variant="elevated" shape="lg" padding="md" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-md-on-surface">Cash Flow Over Time</h2>
              <span className="text-xs text-md-on-surface-variant">
                Daily cash movements in {business?.currency || 'USD'}
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {summary?.cashFlowOverTime && summary.cashFlowOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.cashFlowOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => val.substring(5)}
                    stroke="currentColor"
                    className="text-[10px] text-md-on-surface-variant"
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-[10px] text-md-on-surface-variant"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      borderColor: 'var(--md-sys-color-outline-variant)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(val: number) => [`$${val.toFixed(2)}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="inflow" name="Inflow" fill="#0F7E4A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflow" name="Outflow" fill="#B82828" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-md-on-surface-variant">
                <Calendar size={24} className="mb-2 opacity-50" />
                <span>No cash flow records in this period.</span>
              </div>
            )}
          </div>
        </Card>

        {/* Expense Breakdown List */}
        <Card variant="elevated" shape="lg" padding="md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-md-on-surface">Expense Categories</h2>
              <span className="text-xs text-md-on-surface-variant">Distribution of outflows</span>
            </div>
          </div>

          <div className="space-y-3.5">
            {summary?.categoryBreakdown && summary.categoryBreakdown.filter((c) => c.direction === 'outflow').length > 0 ? (
              summary.categoryBreakdown
                .filter((c) => c.direction === 'outflow')
                .slice(0, 5)
                .map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-md-on-surface">{item.label}</span>
                      <span className="font-semibold text-md-on-surface tabular-nums">
                        {formatMoney(item.amount, business?.currency)} ({item.percentageOfTotal}%)
                      </span>
                    </div>
                    <div className="w-full bg-md-surface-container-high h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-md-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(item.percentageOfTotal, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-8 text-center text-xs text-md-on-surface-variant">
                No recorded expense categories in this period.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Actionable Insights & Recent Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Actionable Insights Card */}
        <Card variant="elevated" shape="lg" padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-md bg-md-primary-container text-md-primary">
                <Sparkles size={16} />
              </div>
              <h3 className="text-sm font-bold text-md-on-surface">Business Intelligence</h3>
            </div>
            <p className="text-xs text-md-on-surface-variant leading-relaxed mb-4">
              {summary?.recordedInflows && summary.recordedInflows > 0 ? (
                `Your business has recorded $${summary.recordedInflows.toFixed(2)} in total cash inflows against $${summary.recordedOutflows.toFixed(2)} in outflows this period.`
              ) : (
                'Import your transaction records to see AI-driven trends and expense warnings.'
              )}
            </p>
          </div>
          <Button
            variant="tonal"
            size="sm"
            onClick={() => setCurrentTab('insights')}
            icon={<Sparkles size={14} />}
            className="w-full text-xs font-semibold justify-between"
          >
            <span>Ask Business Questions</span>
            <ChevronRight size={14} />
          </Button>
        </Card>

        {/* Recent Transactions Table Preview */}
        <Card variant="elevated" shape="lg" padding="md" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-md-on-surface">Recent Transactions</h3>
              <span className="text-xs text-md-on-surface-variant">Latest recorded movements</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus size={14} />}
              >
                Add Manual
              </Button>
              <Button
                variant="filled"
                size="sm"
                onClick={() => setCurrentTab('transactions')}
              >
                View All
              </Button>
            </div>
          </div>

          <div className="divide-y divide-md-outline-variant/20 overflow-x-auto">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        tx.direction === 'inflow'
                          ? 'bg-finance-inflow-container text-finance-inflow'
                          : tx.direction === 'outflow'
                          ? 'bg-finance-outflow-container text-finance-outflow'
                          : 'bg-finance-neutral-container text-finance-neutral'
                      }`}
                    >
                      {tx.direction === 'inflow' ? (
                        <ArrowDownLeft size={14} />
                      ) : tx.direction === 'outflow' ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <TrendingUp size={14} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-md-on-surface block truncate max-w-[220px]">
                        {tx.description}
                      </span>
                      <span className="text-[10px] text-md-on-surface-variant">
                        {tx.transactionDate} &bull; {STANDARD_CATEGORIES[tx.category]?.label || tx.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-bold tabular-nums block ${
                        tx.direction === 'inflow'
                          ? 'text-finance-inflow'
                          : tx.direction === 'outflow'
                          ? 'text-finance-outflow'
                          : 'text-finance-neutral'
                      }`}
                    >
                      {tx.direction === 'inflow' ? '+' : tx.direction === 'outflow' ? '-' : ''}
                      {formatMoney(tx.amount, tx.currency)}
                    </span>
                    {tx.reviewStatus === 'pending_review' && (
                      <Badge variant="review" size="sm">Review</Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-md-on-surface-variant">
                No recent transactions found. Click "Add Manual" or "Import" to record transactions.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record New Transaction"
        subtitle="Manually add a cash sale, stock purchase, or expense"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <Input
            label="Transaction Date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />

          <Input
            label="Description / Purpose"
            type="text"
            placeholder="e.g. Bakers Inn bread stock, EcoCash customer sale"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            required
          />

          <Input
            label={`Amount (${business?.currency || 'USD'})`}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            required
          />

          <Select
            label="Transaction Type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            options={[
              { value: 'business_income', label: 'Business Income (Sales / Services)' },
              { value: 'business_expense', label: 'Business Expense (Stock, Rent, Transport)' },
              { value: 'transfer', label: 'Internal Transfer (Between My Own Accounts)' },
              { value: 'loan_received', label: 'Loan Received (Mukando / Borrowed Funds)' },
              { value: 'loan_repayment', label: 'Loan Repayment (Principal Paid Back)' },
              { value: 'owner_withdrawal', label: 'Personal Drawings (Cash Taken for Family)' }
            ]}
          />

          <Select
            label="Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            options={Object.values(STANDARD_CATEGORIES).map((cat) => ({
              value: cat.key,
              label: cat.label
            }))}
          />

          <Input
            label="Notes (Optional)"
            type="text"
            placeholder="Optional reference notes"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2.5">
            <Button variant="text" size="md" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="filled" size="md" type="submit" isLoading={submitting}>
              Save Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
