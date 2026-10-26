import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import {
  MobileStorageService,
  MobileDebt,
  formatMoney,
} from '@/services/storage';
import { M3Card } from '@/components/M3/M3Card';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Input } from '@/components/M3/M3Input';

export default function DebtsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const [debts, setDebts] = useState<MobileDebt[]>([]);
  const [filter, setFilter] = useState<'all' | 'owed_to_business' | 'owed_by_business'>('all');

  // Repayment Modal
  const [selectedDebt, setSelectedDebt] = useState<MobileDebt | null>(null);
  const [payAmount, setPayAmount] = useState('');

  // Add Debt Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [direction, setDirection] = useState<'owed_to_business' | 'owed_by_business'>('owed_to_business');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');

  const loadDebts = useCallback(async () => {
    const all = await MobileStorageService.getDebts();
    setDebts(all);
  }, []);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const filteredDebts = debts.filter((d) => filter === 'all' || d.direction === filter);

  const totalOwedToBusiness = debts
    .filter((d) => d.direction === 'owed_to_business' && d.status !== 'settled')
    .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

  const totalOwedByBusiness = debts
    .filter((d) => d.direction === 'owed_by_business' && d.status !== 'settled')
    .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

  const handleRecordPayment = async () => {
    if (!selectedDebt) return;
    const p = parseFloat(payAmount);
    if (isNaN(p) || p <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    await MobileStorageService.recordDebtPayment(selectedDebt.id, p);
    setSelectedDebt(null);
    setPayAmount('');
    await loadDebts();
  };

  const handleCreateDebt = async () => {
    const t = parseFloat(totalAmount);
    if (isNaN(t) || t <= 0 || !personName.trim()) {
      Alert.alert('Invalid Input', 'Please enter the person name and valid total amount.');
      return;
    }

    await MobileStorageService.saveDebt({
      personName: personName.trim(),
      direction,
      totalAmount: t,
      currency: 'USD',
      recordedDate: new Date().toISOString().substring(0, 10),
      notes: notes.trim() || undefined,
    });

    setIsAddOpen(false);
    setPersonName('');
    setTotalAmount('');
    setNotes('');
    await loadDebts();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Debts & Credit</Text>
          <Text style={[styles.subhead, { color: theme.tabIconDefault }]}>
            Customer store credit and supplier payables
          </Text>
        </View>
        <M3Button
          label="Add"
          size="sm"
          variant="filled"
          icon={<Ionicons name="add" size={14} color="#FFFFFF" />}
          onPress={() => setIsAddOpen(true)}
        />
      </View>

      {/* KPI Cards: Receivables vs Payables */}
      <View style={styles.kpiRow}>
        <M3Card variant="kpi" style={styles.kpiCard}>
          <Text style={[styles.kpiLabel, { color: theme.tabIconDefault }]}>Customers Owe You</Text>
          <Text style={[styles.kpiValue, { color: theme.inflow }]}>
            {formatMoney(totalOwedToBusiness, 'USD')}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.tabIconDefault }]}>Market customer credit</Text>
        </M3Card>

        <M3Card variant="kpi" style={styles.kpiCard}>
          <Text style={[styles.kpiLabel, { color: theme.tabIconDefault }]}>You Owe Others</Text>
          <Text style={[styles.kpiValue, { color: theme.outflow }]}>
            {formatMoney(totalOwedByBusiness, 'USD')}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.tabIconDefault }]}>Stock / Mukando loans</Text>
        </M3Card>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'All Records' },
          { id: 'owed_to_business', label: 'Owed to Me' },
          { id: 'owed_by_business', label: 'I Owe' },
        ].map((item) => {
          const isActive = filter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setFilter(item.id as any)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? theme.primary : theme.surfaceContainer,
                  borderColor: isActive ? theme.primary : theme.outlineVariant,
                },
              ]}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: isActive ? '#FFFFFF' : theme.text }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Debts List */}
      <View style={styles.list}>
        {filteredDebts.map((debt) => {
          const isOwedToMe = debt.direction === 'owed_to_business';
          const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);

          return (
            <M3Card key={debt.id} variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.personName, { color: theme.text }]}>{debt.personName}</Text>
                  <Text style={[styles.debtSub, { color: theme.tabIconDefault }]}>
                    {isOwedToMe ? 'Owes your business' : 'You owe them'} &bull; {debt.recordedDate}
                  </Text>
                </View>
                {debt.status === 'settled' ? (
                  <M3Badge label="Settled" variant="inflow" />
                ) : debt.status === 'partially_paid' ? (
                  <M3Badge label="Partial" variant="neutral" />
                ) : (
                  <M3Badge label="Outstanding" variant="review" />
                )}
              </View>

              <View style={[styles.summaryBox, { backgroundColor: theme.surfaceContainer }]}>
                <View style={styles.summaryLine}>
                  <Text style={[styles.summaryLabel, { color: theme.tabIconDefault }]}>Total Amount:</Text>
                  <Text style={[styles.summaryVal, { color: theme.text }]}>{formatMoney(debt.totalAmount, debt.currency)}</Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text style={[styles.summaryLabel, { color: theme.tabIconDefault }]}>Paid So Far:</Text>
                  <Text style={[styles.summaryVal, { color: theme.inflow }]}>{formatMoney(debt.paidAmount, debt.currency)}</Text>
                </View>
                <View style={[styles.summaryLine, { borderTopWidth: 1, borderTopColor: theme.outlineVariant, paddingTop: 4 }]}>
                  <Text style={[styles.summaryLabel, { fontWeight: '700', color: theme.text }]}>Remaining Balance:</Text>
                  <Text style={[styles.summaryVal, { fontWeight: '800', color: isOwedToMe ? theme.inflow : theme.outflow }]}>
                    {formatMoney(remaining, debt.currency)}
                  </Text>
                </View>
              </View>

              {debt.notes && (
                <Text style={[styles.notesText, { color: theme.tabIconDefault }]}>"{debt.notes}"</Text>
              )}

              {debt.status !== 'settled' && (
                <View style={styles.actionRow}>
                  <M3Button
                    label="Record Payment"
                    variant="tonal"
                    size="sm"
                    onPress={() => {
                      setSelectedDebt(debt);
                      setPayAmount(remaining.toFixed(2));
                    }}
                    style={{ width: '100%' }}
                  />
                </View>
              )}
            </M3Card>
          );
        })}
      </View>

      {/* Record Payment Modal */}
      <Modal visible={selectedDebt !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Record Payment</Text>
              <Pressable onPress={() => setSelectedDebt(null)}>
                <Ionicons name="close" size={22} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            {selectedDebt && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 13, color: theme.tabIconDefault }}>
                  Payment for <Text style={{ fontWeight: '700', color: theme.text }}>{selectedDebt.personName}</Text>
                </Text>

                <M3Input
                  label="Payment Amount ($)"
                  keyboardType="decimal-pad"
                  value={payAmount}
                  onChangeText={setPayAmount}
                />

                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                  <M3Button
                    label="Cancel"
                    variant="text"
                    onPress={() => setSelectedDebt(null)}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <M3Button
                    label="Confirm Payment"
                    variant="filled"
                    onPress={handleRecordPayment}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Debt Modal */}
      <Modal visible={isAddOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>New Debt / Credit</Text>
              <Pressable onPress={() => setIsAddOpen(false)}>
                <Ionicons name="close" size={22} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setDirection('owed_to_business')}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: direction === 'owed_to_business' ? theme.inflowContainer : theme.surfaceContainer,
                    borderColor: direction === 'owed_to_business' ? theme.inflow : 'transparent',
                  },
                ]}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: direction === 'owed_to_business' ? theme.inflow : theme.text }}>
                  Customer Owes Me
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setDirection('owed_by_business')}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: direction === 'owed_by_business' ? theme.outflowContainer : theme.surfaceContainer,
                    borderColor: direction === 'owed_by_business' ? theme.outflow : 'transparent',
                  },
                ]}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: direction === 'owed_by_business' ? theme.outflow : theme.text }}>
                  I Owe Supplier
                </Text>
              </Pressable>
            </View>

            <M3Input
              label="Person / Vendor Name"
              placeholder="e.g. Mai Panashe, Baba Kevin"
              value={personName}
              onChangeText={setPersonName}
            />

            <M3Input
              label="Total Debt Amount ($)"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={totalAmount}
              onChangeText={setTotalAmount}
            />

            <M3Input
              label="Notes / Items"
              placeholder="e.g. 2x boxes cooking oil, sugar"
              value={notes}
              onChangeText={setNotes}
            />

            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <M3Button
                label="Cancel"
                variant="text"
                onPress={() => setIsAddOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <M3Button
                label="Save Record"
                variant="filled"
                onPress={handleCreateDebt}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: DesignTokens.spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subhead: {
    fontSize: 12,
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    marginBottom: 0,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  kpiSub: {
    fontSize: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: DesignTokens.shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  list: {
    gap: 10,
  },
  card: {
    padding: 14,
    marginVertical: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
  },
  debtSub: {
    fontSize: 10,
    marginTop: 2,
  },
  summaryBox: {
    padding: 10,
    borderRadius: DesignTokens.shapes.medium,
    gap: 4,
    marginBottom: 8,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 11,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  actionRow: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: DesignTokens.shapes.sheet,
    borderTopRightRadius: DesignTokens.shapes.sheet,
    padding: DesignTokens.spacing.gutter,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    height: 42,
    borderRadius: DesignTokens.shapes.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
