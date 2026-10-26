import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Transaction, formatMoney, STANDARD_CATEGORIES, CategoryKey, TransactionType } from '@cashflow-mate/shared';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { business } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [reviewFilter, setReviewFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Selected Transaction for Edit
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editCategory, setEditCategory] = useState<CategoryKey>('sales_goods');
  const [editType, setEditType] = useState<TransactionType>('business_income');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Add Modal
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [newDesc, setNewDesc] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newType, setNewType] = useState<string>('business_income');
  const [newCategory, setNewCategory] = useState<string>('sales_goods');

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTransactions({
        search,
        category: categoryFilter,
        type: typeFilter,
        reviewStatus: reviewFilter,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });
      setTransactions(res.transactions);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [search, categoryFilter, typeFilter, reviewFilter, page]);

  const handleOpenEdit = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditCategory(tx.category);
    setEditType(tx.type);
    setEditNotes(tx.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!selectedTx) return;
    setIsUpdating(true);
    try {
      const direction =
        editType === 'business_income' || editType === 'loan_received' || editType === 'owner_contribution'
          ? 'inflow'
          : editType === 'transfer'
          ? 'neutral'
          : 'outflow';

      await api.updateTransaction(selectedTx.id, {
        category: editCategory,
        type: editType,
        direction,
        notes: editNotes,
        reviewStatus: 'confirmed'
      });

      setSelectedTx(null);
      await loadTransactions();
    } catch (err: any) {
      alert(err.message || 'Failed to update transaction');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this transaction record?')) return;
    try {
      await api.deleteTransaction(id);
      setSelectedTx(null);
      await loadTransactions();
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction');
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('cashflow_token');
    const query = new URLSearchParams();
    if (categoryFilter) query.append('category', categoryFilter);
    if (reviewFilter) query.append('reviewStatus', reviewFilter);

    window.open(`/api/transactions/export/csv?${query.toString()}&token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-md-outline-variant/30">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-md-on-surface">Transactions</h1>
          <p className="text-xs text-md-on-surface-variant mt-0.5">
            Audit, categorize, and search through your business cash records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="tonal"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download size={14} />}
          >
            Export CSV
          </Button>
          <Button
            variant="filled"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            icon={<Plus size={14} />}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card variant="elevated" shape="lg" padding="sm" className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search description, reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            icon={<Search size={15} />}
          />

          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Categories' },
              ...Object.values(STANDARD_CATEGORIES).map((c) => ({
                value: c.key,
                label: c.label
              }))
            ]}
          />

          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Transaction Types' },
              { value: 'business_income', label: 'Business Income' },
              { value: 'business_expense', label: 'Business Expense' },
              { value: 'transfer', label: 'Internal Transfer' },
              { value: 'loan_received', label: 'Loan Received' },
              { value: 'loan_repayment', label: 'Loan Repayment' },
              { value: 'owner_withdrawal', label: 'Personal Drawings' }
            ]}
          />

          <Select
            value={reviewFilter}
            onChange={(e) => {
              setReviewFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Review Statuses' },
              { value: 'pending_review', label: 'Pending Review (Needs Attention)' },
              { value: 'confirmed', label: 'Confirmed Records' }
            ]}
          />
        </div>
      </Card>

      {/* Transactions List / Table */}
      <Card variant="elevated" shape="lg" padding="none" className="overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-md-on-surface">
            <thead className="bg-md-surface-container-high text-md-on-surface-variant font-semibold uppercase tracking-wider text-[11px] border-b border-md-outline-variant/30">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-md-outline-variant/20">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => handleOpenEdit(tx)}
                    className="hover:bg-md-surface-container transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-md-on-surface-variant font-mono">
                      {tx.transactionDate}
                    </td>
                    <td className="py-3 px-4 font-medium max-w-xs truncate">
                      <div className="font-semibold text-md-on-surface truncate">{tx.description}</div>
                      {tx.originalReference && (
                        <span className="text-[10px] text-md-on-surface-variant block font-mono">
                          Ref: {tx.originalReference}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-md-surface-container-high text-md-on-surface text-[11px]">
                        {STANDARD_CATEGORIES[tx.category]?.label || tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-md-on-surface-variant capitalize">
                      {tx.type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold tabular-nums">
                      <span
                        className={
                          tx.direction === 'inflow'
                            ? 'text-finance-inflow'
                            : tx.direction === 'outflow'
                            ? 'text-finance-outflow'
                            : 'text-finance-neutral'
                        }
                      >
                        {tx.direction === 'inflow' ? '+' : tx.direction === 'outflow' ? '-' : ''}
                        {formatMoney(tx.amount, tx.currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {tx.reviewStatus === 'pending_review' ? (
                        <Badge variant="review" size="sm">Pending</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Confirmed</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(tx);
                        }}
                        className="p-1.5 rounded-md text-md-on-surface-variant hover:text-md-primary hover:bg-md-surface-container-highest"
                      >
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-md-on-surface-variant">
                    No transactions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Tactile Card View */}
        <div className="md:hidden divide-y divide-md-outline-variant/20">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => handleOpenEdit(tx)}
                className="p-3.5 flex items-center justify-between gap-3 active:bg-md-surface-container"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      tx.direction === 'inflow'
                        ? 'bg-finance-inflow-container text-finance-inflow'
                        : tx.direction === 'outflow'
                        ? 'bg-finance-outflow-container text-finance-outflow'
                        : 'bg-finance-neutral-container text-finance-neutral'
                    }`}
                  >
                    {tx.direction === 'inflow' ? (
                      <ArrowDownLeft size={16} />
                    ) : tx.direction === 'outflow' ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowLeftRight size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-sm text-md-on-surface block truncate max-w-[200px]">
                      {tx.description}
                    </span>
                    <span className="text-[11px] text-md-on-surface-variant">
                      {tx.transactionDate} &bull; {STANDARD_CATEGORIES[tx.category]?.label || tx.category}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-bold tabular-nums block text-sm ${
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
            <div className="p-8 text-center text-xs text-md-on-surface-variant">
              No transactions found.
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-md-outline-variant/30 flex items-center justify-between text-xs text-md-on-surface-variant">
          <span>
            Showing {transactions.length > 0 ? (page - 1) * pageSize + 1 : 0} -{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount} records
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outlined"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              icon={<ChevronLeft size={14} />}
            >
              Prev
            </Button>
            <Button
              variant="outlined"
              size="sm"
              disabled={page * pageSize >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              icon={<ChevronRight size={14} />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit / Review Transaction Modal */}
      <Modal
        isOpen={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
        title="Transaction Details & Categorization"
        subtitle="Review, correct category, or add notes to this record"
      >
        {selectedTx && (
          <div className="space-y-4">
            <div className="p-3 bg-md-surface-container rounded-lg border border-md-outline-variant/30 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-md-on-surface-variant">Original Description:</span>
                <strong className="text-md-on-surface">{selectedTx.description}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-md-on-surface-variant">Amount:</span>
                <strong className="text-md-on-surface">{formatMoney(selectedTx.amount, selectedTx.currency)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-md-on-surface-variant">Date:</span>
                <span className="font-mono text-md-on-surface">{selectedTx.transactionDate}</span>
              </div>
              {selectedTx.originalReference && (
                <div className="flex justify-between">
                  <span className="text-md-on-surface-variant">Reference:</span>
                  <span className="font-mono text-md-on-surface">{selectedTx.originalReference}</span>
                </div>
              )}
              {selectedTx.aiReasoning && (
                <div className="pt-2 border-t border-md-outline-variant/20 text-[11px] text-md-primary">
                  AI Suggestion: {selectedTx.aiReasoning} (confidence: {Math.round((selectedTx.aiConfidence || 0.8) * 100)}%)
                </div>
              )}
            </div>

            <Select
              label="Assigned Category"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as CategoryKey)}
              options={Object.values(STANDARD_CATEGORIES).map((cat) => ({
                value: cat.key,
                label: cat.label
              }))}
            />

            <Select
              label="Transaction Classification"
              value={editType}
              onChange={(e) => setEditType(e.target.value as TransactionType)}
              options={[
                { value: 'business_income', label: 'Business Income (Trading Sales / Fees)' },
                { value: 'business_expense', label: 'Business Expense (Stock, Rent, Transport)' },
                { value: 'transfer', label: 'Internal Transfer (Between My Accounts)' },
                { value: 'loan_received', label: 'Loan Received (Mukando Pool / Borrowed)' },
                { value: 'loan_repayment', label: 'Loan Repayment (Principal)' },
                { value: 'owner_withdrawal', label: 'Personal Drawings (Family / School)' }
              ]}
            />

            <Input
              label="Notes / Comments"
              type="text"
              placeholder="e.g. Paid to Mai Panashe for crates"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />

            <div className="pt-3 border-t border-md-outline-variant/30 flex items-center justify-between">
              <Button
                variant="text"
                size="sm"
                onClick={() => handleDelete(selectedTx.id)}
                className="text-md-error hover:bg-md-error/10"
                icon={<Trash2 size={14} />}
              >
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="text" size="md" onClick={() => setSelectedTx(null)}>
                  Cancel
                </Button>
                <Button variant="filled" size="md" onClick={handleSaveEdit} isLoading={isUpdating}>
                  Confirm & Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
