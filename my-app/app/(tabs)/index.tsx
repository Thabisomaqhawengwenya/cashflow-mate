import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import {
  MobileStorageService,
  MobileTransaction,
  BusinessProfile,
  formatMoney,
  getLocalDateString,
  sortTransactionsByDateDesc,
  CATEGORIES,
} from '@/services/storage';
import { M3Card } from '@/components/M3/M3Card';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Input } from '@/components/M3/M3Input';

export default function OverviewScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [transactions, setTransactions] = useState<MobileTransaction[]>([]);
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'all'>('this_month');
  const [refreshing, setRefreshing] = useState(false);
  const [showProfitDisclosure, setShowProfitDisclosure] = useState(false);

  // New Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'inflow' | 'outflow'>('inflow');
  const [category, setCategory] = useState('sales_goods');

  const loadData = useCallback(async () => {
    const biz = await MobileStorageService.getBusiness();
    const txs = await MobileStorageService.getTransactions();
    setBusiness(biz);
    setTransactions(txs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const currency = business?.currency || 'USD';
  const summary = MobileStorageService.calculateSummary(transactions, { period, currency });
  const recentTransactions = sortTransactionsByDateDesc(transactions).slice(0, 5);
  const topExpense = summary.categoryBreakdown[0];

  const handleCreateTransaction = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || !desc.trim()) {
      Alert.alert('Invalid Input', 'Please enter a valid description and positive amount.');
      return;
    }

    const type =
      direction === 'inflow'
        ? category === 'loan_in'
          ? 'loan_received'
          : 'business_income'
        : category === 'owner_drawings'
        ? 'owner_withdrawal'
        : category === 'loan_out'
        ? 'loan_repayment'
        : 'business_expense';

    await MobileStorageService.saveTransaction({
      transactionDate: getLocalDateString(),
      description: desc.trim(),
      amount: amt,
      currency,
      direction,
      type,
      category,
      reviewStatus: 'confirmed',
    });

    setIsModalOpen(false);
    setDesc('');
    setAmount('');
    await loadData();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
    >
      {/* Header Context Bar */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.businessName, { color: theme.text }]}>
            {business?.name || 'Mbare Fresh Produce'}
          </Text>
          <Text style={[styles.subhead, { color: theme.tabIconDefault }]}>
            Cash-Flow Intelligence &bull; Harare, Zimbabwe
          </Text>
        </View>
        <M3Badge label={business?.currency || 'USD'} variant="primary" />
      </View>

      {/* Period Selector Chips (Pinterest Continuous Pill Style) */}
      <View style={styles.periodRow}>
        {[
          { id: 'this_month', label: 'This Month' },
          { id: 'last_month', label: 'Last Month' },
          { id: 'all', label: 'All Records' },
        ].map((item) => {
          const isActive = period === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setPeriod(item.id as any)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${item.label}`}
              accessibilityState={{ selected: isActive }}
              style={[
                styles.periodChip,
                {
                  backgroundColor: isActive ? theme.primary : theme.surfaceContainer,
                  borderColor: isActive ? theme.primary : theme.outlineVariant,
                },
              ]}
            >
              <Text style={[styles.periodText, { color: isActive ? '#FFFFFF' : theme.text }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 4 Financial KPI Cards */}
      <View style={styles.kpiGrid}>
        {/* Inflows */}
        <M3Card variant="kpi" style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={[styles.kpiLabel, { color: theme.tabIconDefault }]}>Recorded Inflows</Text>
            <View style={[styles.kpiIcon, { backgroundColor: theme.inflowContainer }]}>
              <Ionicons name="arrow-down" size={15} color={theme.inflow} />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: theme.inflow }]}>
            {formatMoney(summary.recordedInflows, business?.currency)}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.tabIconDefault }]}>Trading sales & receipts</Text>
        </M3Card>

        {/* Outflows */}
        <M3Card variant="kpi" style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={[styles.kpiLabel, { color: theme.tabIconDefault }]}>Recorded Outflows</Text>
            <View style={[styles.kpiIcon, { backgroundColor: theme.outflowContainer }]}>
              <Ionicons name="arrow-up" size={15} color={theme.outflow} />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: theme.outflow }]}>
            {formatMoney(summary.recordedOutflows, business?.currency)}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.tabIconDefault }]}>Stock purchases & rent</Text>
        </M3Card>

        {/* Net Cash Flow */}
        <M3Card variant="kpi" style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={[styles.kpiLabel, { color: theme.tabIconDefault }]}>Net Cash Flow</Text>
            <View style={[styles.kpiIcon, { backgroundColor: theme.primaryContainer }]}>
              <Ionicons name="swap-vertical" size={15} color={theme.primary} />
            </View>
          </View>
          <Text
            style={[
              styles.kpiValue,
              { color: summary.netCashFlow >= 0 ? theme.primary : theme.outflow },
            ]}
          >
            {summary.netCashFlow >= 0 ? '+' : ''}
            {formatMoney(summary.netCashFlow, business?.currency)}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.tabIconDefault }]}>Total in minus total out</Text>
        </M3Card>

        {/* Estimated Operating Profit */}
        <M3Card variant="kpi" style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Pressable
              onPress={() => setShowProfitDisclosure(!showProfitDisclosure)}
              style={styles.profitHeader}
            >
              <Text style={[styles.kpiLabel, { color: theme.tabIconDefault }]}>Estimated Profit</Text>
              <Ionicons name="information-circle-outline" size={13} color={theme.tabIconDefault} />
            </Pressable>
            <View style={[styles.kpiIcon, { backgroundColor: theme.tertiaryContainer }]}>
              <Ionicons name="checkmark-done" size={15} color={theme.tertiary} />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: theme.tertiary }]}>
            {formatMoney(summary.estimatedOperatingProfit, business?.currency)}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.tabIconDefault }]}>Excludes loans & drawings</Text>
        </M3Card>
      </View>

      {/* Profit Disclosure Modal Banner */}
      {showProfitDisclosure && (
        <View style={[styles.disclosureBox, { backgroundColor: theme.surfaceContainer, borderColor: theme.outline }]}>
          <Text style={[styles.disclosureText, { color: theme.text }]}>
            <Text style={{ fontWeight: '700', color: theme.primary }}>Accounting Assumption: </Text>
            Operating profit estimate calculates trading sales minus day-to-day operating overhead. Mukando loans, owner drawings, and internal till float shifts are strictly excluded.
          </Text>
        </View>
      )}

      {/* Actionable AI Grounded Banner */}
      <M3Card variant="elevated" style={styles.aiBanner}>
        <View style={styles.aiHeader}>
          <View style={[styles.aiBadgeIcon, { backgroundColor: theme.primaryContainer }]}>
            <Ionicons name="sparkles" size={16} color={theme.primary} />
          </View>
          <Text style={[styles.aiTitle, { color: theme.text }]}>Cash-Flow Intelligence</Text>
        </View>
        <Text style={[styles.aiBody, { color: theme.text }]}>
          {topExpense
            ? `Your trading sales generated ${formatMoney(summary.operatingRevenue, currency)}. Your largest recorded expense category was ${topExpense.label} at ${formatMoney(topExpense.amount, currency)} (${topExpense.percentage}% of outflows).`
            : `Your trading sales generated ${formatMoney(summary.operatingRevenue, currency)}. No operating expenses were recorded for ${summary.periodLabel.toLowerCase()}.`}
        </Text>
      </M3Card>

      {/* Expense Category Breakdown */}
      <M3Card variant="elevated">
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Expense Categories</Text>
        <View style={styles.categoryList}>
          {summary.categoryBreakdown.slice(0, 4).map((item) => (
            <View key={item.category} style={styles.categoryItem}>
              <View style={styles.categoryRow}>
                <Text style={[styles.categoryName, { color: theme.text }]}>{item.label}</Text>
                <Text style={[styles.categoryAmount, { color: theme.text }]}>
                  {formatMoney(item.amount, business?.currency)} ({item.percentage}%)
                </Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: theme.surfaceContainer }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: theme.primary, width: `${Math.min(item.percentage, 100)}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </M3Card>

      {/* Recent Transactions List */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
          <M3Button
            label="Add"
            size="sm"
            variant="tonal"
            icon={<Ionicons name="add" size={14} color={theme.text} />}
            onPress={() => setIsModalOpen(true)}
          />
        </View>

        {recentTransactions.map((tx) => {
          const isIncome = tx.direction === 'inflow';
          const isOutflow = tx.direction === 'outflow';

          return (
            <M3Card key={tx.id} variant="elevated" style={styles.txCard}>
              <View style={styles.txRow}>
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.txIconCircle,
                      {
                        backgroundColor: isIncome
                          ? theme.inflowContainer
                          : isOutflow
                          ? theme.outflowContainer
                          : theme.neutralContainer,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isIncome ? 'arrow-down' : isOutflow ? 'arrow-up' : 'swap-horizontal'}
                      size={16}
                      color={isIncome ? theme.inflow : isOutflow ? theme.outflow : theme.neutral}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txDesc, { color: theme.text }]} numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <Text style={[styles.txMeta, { color: theme.tabIconDefault }]}>
                      {tx.transactionDate} &bull; {CATEGORIES[tx.category]?.label || tx.category}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    {
                      color: isIncome ? theme.inflow : isOutflow ? theme.outflow : theme.neutral,
                    },
                  ]}
                >
                  {isIncome ? '+' : isOutflow ? '-' : ''}
                  {formatMoney(tx.amount, tx.currency)}
                </Text>
              </View>
            </M3Card>
          );
        })}
      </View>

      {/* Add Transaction Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Record Transaction</Text>
              <Pressable
                onPress={() => setIsModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close transaction modal"
                hitSlop={12}
              >
                <Ionicons name="close" size={22} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            {/* Inflow vs Outflow toggle buttons */}
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setDirection('inflow')}
                accessibilityRole="button"
                accessibilityLabel="Income Inflow"
                accessibilityState={{ selected: direction === 'inflow' }}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: direction === 'inflow' ? theme.inflowContainer : theme.surfaceContainer,
                    borderColor: direction === 'inflow' ? theme.inflow : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: direction === 'inflow' ? theme.inflow : theme.text, fontWeight: '700' }}>
                  + Income Inflow
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setDirection('outflow')}
                accessibilityRole="button"
                accessibilityLabel="Expense Outflow"
                accessibilityState={{ selected: direction === 'outflow' }}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: direction === 'outflow' ? theme.outflowContainer : theme.surfaceContainer,
                    borderColor: direction === 'outflow' ? theme.outflow : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: direction === 'outflow' ? theme.outflow : theme.text, fontWeight: '700' }}>
                  - Expense Outflow
                </Text>
              </Pressable>
            </View>

            <M3Input
              label="Description / Trader Purpose"
              placeholder="e.g. Bakers Inn bread stock, Counter cash sale"
              value={desc}
              onChangeText={setDesc}
            />

            <M3Input
              label={`Amount (${business?.currency || 'USD'})`}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.modalActions}>
              <M3Button
                label="Cancel"
                variant="text"
                onPress={() => setIsModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <M3Button
                label="Save Record"
                variant="filled"
                onPress={handleCreateTransaction}
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
  businessName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subhead: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodChip: {
    paddingHorizontal: 16,
    height: DesignTokens.buttonHeights.chip,
    borderRadius: DesignTokens.shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    marginBottom: 0,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  profitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  kpiSub: {
    fontSize: 10,
    marginTop: 4,
  },
  disclosureBox: {
    padding: 12,
    borderRadius: DesignTokens.shapes.medium,
    borderWidth: 1,
    marginVertical: 10,
  },
  disclosureText: {
    fontSize: 11,
    lineHeight: 16,
  },
  aiBanner: {
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#155A8A',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  aiBadgeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  aiBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    gap: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  recentSection: {
    marginTop: 18,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txCard: {
    marginVertical: 4,
    padding: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  txIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: 13,
    fontWeight: '600',
  },
  txMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginLeft: 8,
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: DesignTokens.shapes.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 18,
  },
});
