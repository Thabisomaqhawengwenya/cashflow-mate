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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import Colors, { EmeraldTokens } from '@/constants/Colors';
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
  const recentTransactions = sortTransactionsByDateDesc(transactions).slice(0, 4);

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

  const openNewTransaction = (dir: 'inflow' | 'outflow') => {
    setDirection(dir);
    setCategory(dir === 'inflow' ? 'sales_goods' : 'stock_purchase');
    setIsModalOpen(true);
  };

  // Format today's date nicely for the top header
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const pendingCount = transactions.filter((t) => t.reviewStatus === 'pending_review').length;
  const inflowCount = transactions.filter((t) => t.direction === 'inflow').length;
  const outflowCount = transactions.filter((t) => t.direction === 'outflow').length;

  return (
    <View style={styles.screenWrapper}>
      {/* 1. Top Emerald Hero Header (Inspired by Screen 1) */}
      <View style={styles.emeraldHeader}>
        {/* Top App Bar Row */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greetingTitle}>
              Hello, {business?.name ? business.name.split(' ')[0] : 'Mr Q'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {todayFormatted} &bull; Harare, Zimbabwe
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/modal')}
            accessibilityRole="button"
            accessibilityLabel="Open settings and profile"
            style={styles.bellButton}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            {pendingCount > 0 && <View style={styles.bellBadge} />}
          </Pressable>
        </View>

        {/* 3-Column Stat Bar (Directly from Reference Screen 1) */}
        <View style={styles.statBar}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>
              {String(inflowCount).padStart(2, '0')}
            </Text>
            <Text style={styles.statLabel}>Inflows Recorded</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statNumber}>
              {String(outflowCount).padStart(2, '0')}
            </Text>
            <Text style={styles.statLabel}>Outflows Recorded</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: EmeraldTokens.mintCta }]}>
              {summary.netCashFlow >= 0 ? '+' : ''}
              {formatMoney(summary.netCashFlow, currency)}
            </Text>
            <Text style={styles.statLabel}>Net Cash Flow</Text>
          </View>
        </View>
      </View>

      {/* 2. White Curved Body Sheet */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={EmeraldTokens.deepPine}
          />
        }
      >
        {/* Period Selector Tabs */}
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
                style={[
                  styles.periodChip,
                  {
                    backgroundColor: isActive ? EmeraldTokens.deepPine : '#F1F5F3',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: isActive ? '#FFFFFF' : EmeraldTokens.textMuted },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 3. 2x2 Quick Action Cards (Directly from Screen 1) */}
        <View style={styles.actionGrid}>
          {/* Action 1: Record Sale (Inflow) */}
          <Pressable
            onPress={() => openNewTransaction('inflow')}
            style={({ pressed }) => [
              styles.actionCard,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelIndigo }]}>
              <Ionicons name="arrow-down" size={20} color={EmeraldTokens.pastelIndigoText} />
            </View>
            <Text style={styles.actionTitle}>Record Sale</Text>
            <Text style={styles.actionSubtitle}>
              {formatMoney(summary.recordedInflows, currency)} in
            </Text>
          </Pressable>

          {/* Action 2: Record Expense (Outflow) */}
          <Pressable
            onPress={() => openNewTransaction('outflow')}
            style={({ pressed }) => [
              styles.actionCard,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelMint }]}>
              <Ionicons name="cart-outline" size={20} color={EmeraldTokens.pastelMintText} />
            </View>
            <Text style={styles.actionTitle}>Record Expense</Text>
            <Text style={styles.actionSubtitle}>
              {formatMoney(summary.recordedOutflows, currency)} out
            </Text>
          </Pressable>

          {/* Action 3: Debts & Credit */}
          <Pressable
            onPress={() => router.push('/(tabs)/debts')}
            style={({ pressed }) => [
              styles.actionCard,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelAmber }]}>
              <Ionicons name="people-outline" size={20} color={EmeraldTokens.pastelAmberText} />
            </View>
            <Text style={styles.actionTitle}>Customer Credit</Text>
            <Text style={styles.actionSubtitle}>Track who owes you</Text>
          </Pressable>

          {/* Action 4: Profile & License */}
          <Pressable
            onPress={() => router.push('/modal')}
            style={({ pressed }) => [
              styles.actionCard,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelSky }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={EmeraldTokens.pastelSkyText} />
            </View>
            <Text style={styles.actionTitle}>Trader Profile</Text>
            <Text style={styles.actionSubtitle}>Active Pro license</Text>
          </Pressable>
        </View>

        {/* Operating Profit Quick Banner */}
        <Pressable
          onPress={() => setShowProfitDisclosure(!showProfitDisclosure)}
          style={styles.profitBanner}
        >
          <View style={styles.profitLeft}>
            <View style={[styles.miniIcon, { backgroundColor: EmeraldTokens.pastelMint }]}>
              <Ionicons name="trending-up" size={16} color={EmeraldTokens.pastelMintText} />
            </View>
            <View>
              <Text style={styles.profitLabel}>Estimated Operating Profit</Text>
              <Text style={styles.profitSub}>Excludes mukando loans & drawings</Text>
            </View>
          </View>
          <View style={styles.profitRight}>
            <Text style={styles.profitAmount}>
              {formatMoney(summary.estimatedOperatingProfit, currency)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={EmeraldTokens.textSubtle} />
          </View>
        </Pressable>

        {showProfitDisclosure && (
          <View style={styles.disclosureCard}>
            <Text style={styles.disclosureText}>
              <Text style={{ fontWeight: '700', color: EmeraldTokens.deepPine }}>Accounting Guardrail: </Text>
              Operating profit estimate calculates trading sales minus day-to-day operating overhead. Mukando loans, owner drawings, and internal till float shifts are strictly excluded.
            </Text>
          </View>
        )}

        {/* 4. Recent Transactions Section (Directly from Screen 3) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/transactions')}
            accessibilityRole="button"
            accessibilityLabel="View all transactions"
          >
            <Text style={styles.seeAllText}>See all ({transactions.length})</Text>
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={40} color={EmeraldTokens.textSubtle} />
            <Text style={styles.emptyTitle}>No transactions recorded</Text>
            <Text style={styles.emptySub}>
              Tap the button below or import a statement to populate your cash book.
            </Text>
          </View>
        ) : (
          recentTransactions.map((tx) => {
            const isInflow = tx.direction === 'inflow';
            const catMeta = CATEGORIES[tx.category];
            return (
              <View key={tx.id} style={styles.transactionCard}>
                {/* Top Row: Ref & Date + Amount Chip */}
                <View style={styles.txTopRow}>
                  <View style={styles.txRefRow}>
                    <Text style={styles.txRefText}>
                      REF: {tx.id.substring(0, 8).toUpperCase()}
                    </Text>
                    <Text style={styles.txDateText}>
                      &bull; {tx.transactionDate}
                    </Text>
                  </View>

                  {/* Amount Circle / Chip */}
                  <View
                    style={[
                      styles.amountBadge,
                      {
                        backgroundColor: isInflow
                          ? EmeraldTokens.pastelMint
                          : EmeraldTokens.pastelRose,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.amountBadgeText,
                        {
                          color: isInflow
                            ? EmeraldTokens.pastelMintText
                            : EmeraldTokens.pastelRoseText,
                        },
                      ]}
                    >
                      {isInflow ? '+' : '-'}
                      {formatMoney(tx.amount, tx.currency)}
                    </Text>
                  </View>
                </View>

                {/* Middle Row: Description */}
                <Text style={styles.txDescription} numberOfLines={2}>
                  {tx.description}
                </Text>

                {/* Bottom Row: Category & Status */}
                <View style={styles.txBottomRow}>
                  <View style={styles.txCategoryChip}>
                    <Ionicons
                      name={isInflow ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={13}
                      color={isInflow ? EmeraldTokens.pastelMintText : EmeraldTokens.pastelRoseText}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.txCategoryText}>
                      {catMeta ? catMeta.label : tx.category}
                    </Text>
                  </View>

                  <M3Badge
                    label={tx.reviewStatus === 'confirmed' ? 'COMPLETED' : 'PENDING'}
                    variant={tx.reviewStatus === 'confirmed' ? 'mint' : 'amber'}
                  />
                </View>
              </View>
            );
          })
        )}

        {/* 5. Bottom Mint CTA Button (Directly from Screen 1) */}
        <View style={styles.bottomCtaContainer}>
          <M3Button
            label="CREATE TRANSACTION"
            variant="mint"
            size="lg"
            icon={<Ionicons name="add" size={20} color={EmeraldTokens.mintDarkText} />}
            onPress={() => openNewTransaction('inflow')}
          />
        </View>
      </ScrollView>

      {/* New Transaction Bottom Sheet / Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {direction === 'inflow' ? 'Record Cash In' : 'Record Cash Out'}
              </Text>
              <Pressable
                onPress={() => setIsModalOpen(false)}
                hitSlop={10}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={EmeraldTokens.textSlate} />
              </Pressable>
            </View>

            {/* Inflow / Outflow Direction Switcher */}
            <View style={styles.directionToggle}>
              <Pressable
                onPress={() => {
                  setDirection('inflow');
                  setCategory('sales_goods');
                }}
                style={[
                  styles.toggleBtn,
                  direction === 'inflow' && { backgroundColor: EmeraldTokens.deepPine },
                ]}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    direction === 'inflow' && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  Cash In (Income)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDirection('outflow');
                  setCategory('stock_purchase');
                }}
                style={[
                  styles.toggleBtn,
                  direction === 'outflow' && { backgroundColor: EmeraldTokens.deepPine },
                ]}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    direction === 'outflow' && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  Cash Out (Expense)
                </Text>
              </Pressable>
            </View>

            <M3Input
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              prefix={`${currency} `}
            />

            <M3Input
              label="Description"
              value={desc}
              onChangeText={setDesc}
              placeholder="e.g. Tomato boxes, Tuck shop bread, Transport"
            />

            <M3Button
              label={direction === 'inflow' ? 'CONFIRM INFLOW' : 'CONFIRM OUTFLOW'}
              variant="mint"
              size="lg"
              onPress={handleCreateTransaction}
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: EmeraldTokens.deepPine,
  },
  // Top Emerald Hero Header
  emeraldHeader: {
    backgroundColor: EmeraldTokens.deepPine,
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 2,
    fontWeight: '500',
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EmeraldTokens.mintCta,
  },

  // 3-Column Stat Bar (Directly from Screen 1)
  statBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 3,
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },

  // Curved Sheet Container
  sheetContainer: {
    flex: 1,
    backgroundColor: EmeraldTokens.canvasLight,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Period Selector Chips
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: DesignTokens.shapes.pill,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // 2x2 Action Cards Grid (Directly from Screen 1)
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(12, 62, 53, 0.06)',
    shadowColor: '#0C3E35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    fontWeight: '500',
  },

  // Operating Profit Banner
  profitBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(12, 62, 53, 0.06)',
    shadowColor: '#0C3E35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  profitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  miniIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profitLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  profitSub: {
    fontSize: 11,
    color: EmeraldTokens.textMuted,
  },
  profitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profitAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: EmeraldTokens.pastelMintText,
  },
  disclosureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(12, 62, 53, 0.1)',
  },
  disclosureText: {
    fontSize: 12,
    lineHeight: 18,
    color: EmeraldTokens.textSlate,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: EmeraldTokens.deepPine,
  },

  // Transaction Cards (Inspired by Screen 3)
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(12, 62, 53, 0.06)',
    shadowColor: '#0C3E35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txRefText: {
    fontSize: 11,
    fontWeight: '700',
    color: EmeraldTokens.textSubtle,
    letterSpacing: 0.4,
  },
  txDateText: {
    fontSize: 11,
    color: EmeraldTokens.textSubtle,
    marginLeft: 4,
  },
  amountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DesignTokens.shapes.pill,
  },
  amountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  txDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: EmeraldTokens.textSlate,
    lineHeight: 20,
    marginBottom: 10,
  },
  txBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  txCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: EmeraldTokens.textMuted,
  },

  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  // Bottom CTA
  bottomCtaContainer: {
    marginTop: 14,
    marginBottom: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
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
    color: EmeraldTokens.textSlate,
  },
  closeBtn: {
    padding: 4,
  },
  directionToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F3',
    borderRadius: DesignTokens.shapes.pill,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: DesignTokens.shapes.pill,
    alignItems: 'center',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: EmeraldTokens.textMuted,
  },
});
