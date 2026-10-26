import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Debt, formatMoney } from '@cashflow-mate/shared';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  Users,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Trash2,
  DollarSign
} from 'lucide-react';

export const DebtsPage: React.FC = () => {
  const { business } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Debt Modal
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [personName, setPersonName] = useState<string>('');
  const [direction, setDirection] = useState<'owed_to_business' | 'owed_by_business'>('owed_to_business');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Repayment Modal
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paying, setPaying] = useState<boolean>(false);

  const loadDebts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDebts({
        direction: directionFilter === 'all' ? undefined : directionFilter
      });
      setDebts(data);
    } catch (err) {
      console.error('Failed to load debts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, [directionFilter]);

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(totalAmount);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createDebt({
        personName,
        direction,
        totalAmount: val,
        currency: business?.currency || 'USD',
        dueDate: dueDate || undefined,
        notes: notes || undefined
      });
      setIsAddOpen(false);
      setPersonName('');
      setTotalAmount('');
      setDueDate('');
      setNotes('');
      await loadDebts();
    } catch (err: any) {
      alert(err.message || 'Failed to save debt record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;
    const payVal = parseFloat(paymentAmount);
    if (isNaN(payVal) || payVal <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }

    setPaying(true);
    try {
      await api.recordDebtPayment(selectedDebt.id, payVal);
      setSelectedDebt(null);
      setPaymentAmount('');
      await loadDebts();
    } catch (err: any) {
      alert(err.message || 'Failed to record repayment');
    } finally {
      setPaying(false);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('Are you sure you want to remove this debt record?')) return;
    try {
      await api.deleteDebt(id);
      await loadDebts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete debt');
    }
  };

  // Calculations for KPI cards
  const totalOwedToBusiness = debts
    .filter((d) => d.direction === 'owed_to_business' && d.status !== 'settled')
    .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

  const totalOwedByBusiness = debts
    .filter((d) => d.direction === 'owed_by_business' && d.status !== 'settled')
    .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-md-outline-variant/30">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-md-on-surface">Debts & Customer Credit</h1>
          <p className="text-xs text-md-on-surface-variant mt-0.5">
            Keep clear records of money customers owe you and what you owe suppliers or savings rounds.
          </p>
        </div>
        <Button
          variant="filled"
          size="sm"
          onClick={() => setIsAddOpen(true)}
          icon={<Plus size={14} />}
        >
          Record New Debt
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card variant="elevated" shape="lg" padding="md" className="flex items-center justify-between">
          <div>
            <span className="text-xs text-md-on-surface-variant block font-medium">
              Customers Owe You (Receivables)
            </span>
            <div className="text-2xl font-bold text-finance-inflow tabular-nums mt-1">
              {formatMoney(totalOwedToBusiness, business?.currency)}
            </div>
            <span className="text-[11px] text-md-on-surface-variant mt-0.5 block">
              Credit given to trusted market customers
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-finance-inflow-container text-finance-inflow flex items-center justify-center">
            <ArrowDownLeft size={20} />
          </div>
        </Card>

        <Card variant="elevated" shape="lg" padding="md" className="flex items-center justify-between">
          <div>
            <span className="text-xs text-md-on-surface-variant block font-medium">
              You Owe Others (Payables)
            </span>
            <div className="text-2xl font-bold text-finance-outflow tabular-nums mt-1">
              {formatMoney(totalOwedByBusiness, business?.currency)}
            </div>
            <span className="text-[11px] text-md-on-surface-variant mt-0.5 block">
              Supplier credit or borrowed Mukando rounds
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-finance-outflow-container text-finance-outflow flex items-center justify-center">
            <ArrowUpRight size={20} />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { id: 'all', label: 'All Records' },
          { id: 'owed_to_business', label: 'Owed to Me' },
          { id: 'owed_by_business', label: 'I Owe' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDirectionFilter(tab.id)}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors ${
              directionFilter === tab.id
                ? 'bg-md-primary text-md-on-primary font-semibold'
                : 'bg-md-surface-container text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Debt Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {debts.length > 0 ? (
          debts.map((debt) => {
            const outstanding = Math.max(0, debt.totalAmount - debt.paidAmount);
            const isOwedToMe = debt.direction === 'owed_to_business';

            return (
              <Card
                key={debt.id}
                variant="elevated"
                shape="lg"
                padding="md"
                className="flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-md-on-surface">{debt.personName}</h4>
                      <span className="text-[11px] text-md-on-surface-variant">
                        {isOwedToMe ? 'Owes your business' : 'You owe them'} &bull; {debt.recordedDate}
                      </span>
                    </div>
                    {debt.status === 'settled' ? (
                      <Badge variant="inflow" size="sm">Settled</Badge>
                    ) : debt.status === 'partially_paid' ? (
                      <Badge variant="neutral" size="sm">Partial</Badge>
                    ) : (
                      <Badge variant="review" size="sm">Outstanding</Badge>
                    )}
                  </div>

                  <div className="p-2.5 bg-md-surface-container-low rounded-lg text-xs space-y-1 mb-2">
                    <div className="flex justify-between">
                      <span className="text-md-on-surface-variant">Total Amount:</span>
                      <strong className="text-md-on-surface">{formatMoney(debt.totalAmount, debt.currency)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-md-on-surface-variant">Paid So Far:</span>
                      <span className="text-finance-inflow">{formatMoney(debt.paidAmount, debt.currency)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-md-outline-variant/30">
                      <span className="font-medium text-md-on-surface">Balance Remaining:</span>
                      <strong
                        className={`tabular-nums ${
                          outstanding > 0
                            ? isOwedToMe
                              ? 'text-finance-inflow'
                              : 'text-finance-outflow'
                            : 'text-md-on-surface-variant'
                        }`}
                      >
                        {formatMoney(outstanding, debt.currency)}
                      </strong>
                    </div>
                  </div>

                  {debt.dueDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-md-on-surface-variant mb-1">
                      <Clock size={12} />
                      <span>Due date: {debt.dueDate}</span>
                    </div>
                  )}

                  {debt.notes && (
                    <p className="text-[11px] text-md-on-surface-variant/90 italic truncate">
                      "{debt.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-md-outline-variant/20 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDeleteDebt(debt.id)}
                    className="p-1.5 text-md-on-surface-variant hover:text-md-error rounded-md"
                    title="Delete record"
                  >
                    <Trash2 size={15} />
                  </button>

                  {debt.status !== 'settled' && (
                    <Button
                      variant="tonal"
                      size="sm"
                      onClick={() => {
                        setSelectedDebt(debt);
                        setPaymentAmount(outstanding.toFixed(2));
                      }}
                      className="text-xs font-semibold"
                    >
                      Record Payment
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-xs text-md-on-surface-variant">
            No debt or credit records found for the selected filter.
          </div>
        )}
      </div>

      {/* Add Debt Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Record Debt or Credit"
        subtitle="Track customer credit or borrowed funds"
      >
        <form onSubmit={handleCreateDebt} className="space-y-4">
          <Input
            label="Person or Vendor Name"
            type="text"
            placeholder="e.g. Mai Panashe, Farai Haulage"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            required
          />

          <Select
            label="Credit Direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value as any)}
            options={[
              { value: 'owed_to_business', label: 'Customer owes my business (Credit given)' },
              { value: 'owed_by_business', label: 'I owe person / supplier (I borrowed money or stock)' }
            ]}
          />

          <Input
            label={`Total Amount (${business?.currency || 'USD'})`}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            required
          />

          <Input
            label="Due Date (Optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Input
            label="Notes / Reason"
            type="text"
            placeholder="e.g. 2x boxes cooking oil, bread stock"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2.5">
            <Button variant="text" size="md" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="filled" size="md" type="submit" isLoading={submitting}>
              Save Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={selectedDebt !== null}
        onClose={() => setSelectedDebt(null)}
        title="Record Repayment"
        subtitle={
          selectedDebt
            ? `Record payment from or to ${selectedDebt.personName}`
            : ''
        }
      >
        {selectedDebt && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 bg-md-surface-container rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span>Original Total:</span>
                <strong>{formatMoney(selectedDebt.totalAmount, selectedDebt.currency)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Remaining Balance:</span>
                <strong className="text-md-primary">
                  {formatMoney(selectedDebt.totalAmount - selectedDebt.paidAmount, selectedDebt.currency)}
                </strong>
              </div>
            </div>

            <Input
              label={`Payment Amount (${selectedDebt.currency})`}
              type="number"
              step="0.01"
              min="0.01"
              max={selectedDebt.totalAmount - selectedDebt.paidAmount}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
            />

            <div className="pt-2 flex justify-end gap-2.5">
              <Button variant="text" size="md" type="button" onClick={() => setSelectedDebt(null)}>
                Cancel
              </Button>
              <Button variant="filled" size="md" type="submit" isLoading={paying}>
                Confirm Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
