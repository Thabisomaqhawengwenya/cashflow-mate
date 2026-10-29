import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { FinancialSummary, formatMoney, STANDARD_CATEGORIES } from '@cashflow-mate/shared';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Download, Calendar, Printer, CheckCircle, Info } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { business } = useAuth();
  const [periodType, setPeriodType] = useState<string>('this_month');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const data = await api.getTransactionSummary({
          periodType,
          currency: business?.currency || 'USD'
        });
        setSummary(data);
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [periodType, business?.currency]);

  const handleExportCsv = () => {
    const token = localStorage.getItem('cashflow_token');
    window.open(`/api/transactions/export/csv?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-md-outline-variant/30">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-md-on-surface">Financial Reports</h1>
          <p className="text-xs text-md-on-surface-variant mt-0.5">
            Verified cash-flow statements and category breakdowns ready for review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="tonal"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download size={14} />}
          >
            Export All CSV
          </Button>
          <Button
            variant="outlined"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer size={14} />}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { id: 'this_month', label: 'This Month' },
          { id: 'last_month', label: 'Last Month' },
          { id: 'this_week', label: 'This Week' },
          { id: 'all', label: 'All Records' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setPeriodType(t.id)}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-colors ${
              periodType === t.id
                ? 'bg-md-primary text-md-on-primary font-semibold shadow-xs'
                : 'bg-md-surface-container text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Report Canvas */}
      <Card variant="elevated" shape="lg" padding="lg" className="space-y-6">
        {/* Document Header */}
        <div className="flex justify-between items-start pb-4 border-b border-md-outline-variant/30">
          <div>
            <h2 className="text-lg font-bold text-md-on-surface">{business?.name}</h2>
            <span className="text-xs text-md-on-surface-variant block mt-0.5">
              Operating Statement &bull; Period: {summary?.period.label} ({summary?.period.startDate} to {summary?.period.endDate})
            </span>
          </div>
          <Badge variant="primary" size="md">
            Currency: {business?.currency || 'USD'}
          </Badge>
        </div>

        {/* Core Financial Summary Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-md-surface-container rounded-lg">
            <span className="text-xs text-md-on-surface-variant font-medium block">Total Recorded Inflows</span>
            <div className="text-xl font-bold text-finance-inflow tabular-nums mt-1">
              {formatMoney(summary?.recordedInflows || 0, business?.currency)}
            </div>
            <span className="text-[10px] text-md-on-surface-variant mt-0.5 block">
              {summary?.inflowTransactionCount || 0} receipt transactions
            </span>
          </div>

          <div className="p-4 bg-md-surface-container rounded-lg">
            <span className="text-xs text-md-on-surface-variant font-medium block">Total Recorded Outflows</span>
            <div className="text-xl font-bold text-finance-outflow tabular-nums mt-1">
              {formatMoney(summary?.recordedOutflows || 0, business?.currency)}
            </div>
            <span className="text-[10px] text-md-on-surface-variant mt-0.5 block">
              {summary?.outflowTransactionCount || 0} expense & payment rows
            </span>
          </div>

          <div className="p-4 bg-md-surface-container rounded-lg">
            <span className="text-xs text-md-on-surface-variant font-medium block">Net Recorded Cash Flow</span>
            <div
              className={`text-xl font-bold tabular-nums mt-1 ${
                (summary?.netCashFlow || 0) >= 0 ? 'text-md-primary' : 'text-finance-outflow'
              }`}
            >
              {(summary?.netCashFlow || 0) >= 0 ? '+' : ''}
              {formatMoney(summary?.netCashFlow || 0, business?.currency)}
            </div>
            <span className="text-[10px] text-md-on-surface-variant mt-0.5 block">
              Inflows minus recorded outflows
            </span>
          </div>
        </div>

        {/* Operating Profit Estimation Box */}
        <div className="p-4 bg-md-surface-container-low rounded-xl border border-md-outline-variant/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-md-on-surface">Operating Profit Analysis:</span>
            <strong className="text-base text-md-tertiary tabular-nums">
              {formatMoney(summary?.estimatedOperatingProfit.amount || 0, business?.currency)}
            </strong>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-md-on-surface-variant pt-1 border-t border-md-outline-variant/20">
            <div>Operating Revenue (Sales): {formatMoney(summary?.estimatedOperatingProfit.operatingRevenue || 0, business?.currency)}</div>
            <div>Operating Expenses: {formatMoney(summary?.estimatedOperatingProfit.operatingExpenses || 0, business?.currency)}</div>
          </div>
          <p className="text-[11px] text-md-on-surface-variant/80 italic pt-1">
            * Note: Internal account rebalancing (${summary?.neutralTransactionCount || 0} transfers) and loan principal movements are strictly segregated from trading profits.
          </p>
        </div>

        {/* Category Breakdown Table */}
        <div>
          <h3 className="text-sm font-bold text-md-on-surface mb-3">Category Breakdown</h3>
          <div className="border border-md-outline-variant/30 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs text-md-on-surface">
              <thead className="bg-md-surface-container-high text-md-on-surface-variant text-[11px] font-semibold border-b border-md-outline-variant/30">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3 text-right">Transactions</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-right">% of Outflows</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-md-outline-variant/20">
                {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
                  summary.categoryBreakdown.map((c) => (
                    <tr key={c.category} className="hover:bg-md-surface-container/50">
                      <td className="py-2.5 px-3 font-medium">{c.label}</td>
                      <td className="py-2.5 px-3 capitalize">
                        <span
                          className={
                            c.direction === 'inflow'
                              ? 'text-finance-inflow'
                              : c.direction === 'outflow'
                              ? 'text-finance-outflow'
                              : 'text-finance-neutral'
                          }
                        >
                          {c.direction}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-md-on-surface-variant">{c.count}</td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                        {formatMoney(c.amount, business?.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {c.direction === 'outflow' ? `${c.percentageOfTotal}%` : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-md-on-surface-variant">
                      No category data available for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};
