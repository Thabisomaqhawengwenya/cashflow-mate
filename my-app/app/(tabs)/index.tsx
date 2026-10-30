import React, { useState, useCallback, useEffect } from 'react';
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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import Colors, { EmeraldTokens, BlueTokens } from '@/constants/Colors';
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
  CurrencyCode,
  MultiCurrencyCashbox,
} from '@/services/storage';
import { parseZimbabweSms, ParsedSmsResult } from '@/services/smsParser';
import { MobileSecurityService } from '@/services/security';
import { MobileExchangeService, PortfolioValuation } from '@/services/exchangeRates';
import { MobileReconciliationService, ZReport } from '@/services/reconciliation';
import { MobileAuthService, UserSession } from '@/services/auth';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Input } from '@/components/M3/M3Input';
import { useLanguage } from '@/context/LanguageContext';
import {
  EcoCashLogo,
  InnBucksLogo,
  BakersInnLogo,
  CompanyBrandLogo,
} from '@/components/BrandLogos';

const SAMPLE_SMS_CHIPS = [
  {
    type: 'ecocash',
    label: 'EcoCash $15 In',
    sms: 'Transfer Confirmation: USD 15.00 received from TAFADZWA CHIDZERO (0772123456) on 26/10/2026 at 14:22:10. TxId: MP261026.002. New balance: USD 84.50',
  },
  {
    type: 'bakers_inn',
    label: 'Bakers Inn $35 Out',
    sms: 'Transfer Confirmation: USD 35.00 paid to BAKERS INN (Merchant Code: 19821) on 26/10/2026. TxId: MP261026.044. Fee: USD 0.70',
  },
  {
    type: 'ecocash',
    label: 'EcoCash ZiG 250 In',
    sms: 'Transfer Confirmation: ZiG 250.00 received from MAI RUVIMBO (0781234567) on 26/10/2026. TxId: MP261026.115',
  },
  {
    type: 'innbucks',
    label: 'InnBucks $25 In',
    sms: 'InnBucks: You have received US$25.00 from Simba Moyo (0712345678). Ref: IB-883921 on 26-10-2026. Dial *569# to view balance.',
  },
];

export default function OverviewScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { t, getCategoryLabel } = useLanguage();

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [transactions, setTransactions] = useState<MobileTransaction[]>([]);
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>('USD');
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'all'>('this_month');
  const [refreshing, setRefreshing] = useState(false);
  const [showProfitDisclosure, setShowProfitDisclosure] = useState(false);
  const [isMasked, setIsMasked] = useState(false);
  const [isPinSet, setIsPinSet] = useState(false);

  // Till PIN Unlock Modal State
  const [isPinUnlockOpen, setIsPinUnlockOpen] = useState(false);
  const [pinAttempt, setPinAttempt] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // New Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'inflow' | 'outflow'>('inflow');
  const [category, setCategory] = useState('sales_goods');

  // SMS Quick-Paste Modal State
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [rawSmsInput, setRawSmsInput] = useState('');
  const [parsedSms, setParsedSms] = useState<ParsedSmsResult | null>(null);

  // Unified Portfolio & Exchange Rates State
  const [portfolioValuation, setPortfolioValuation] = useState<PortfolioValuation | null>(null);
  const [showPortfolioTotal, setShowPortfolioTotal] = useState(false);

  // Day-End Shift Balancing (Z-Report) State
  const [isZReportModalOpen, setIsZReportModalOpen] = useState(false);
  const [physicalUsd, setPhysicalUsd] = useState('');
  const [physicalZwg, setPhysicalZwg] = useState('');
  const [physicalZar, setPhysicalZar] = useState('');
  const [zReportNotes, setZReportNotes] = useState('');
  const [isSavingZReport, setIsSavingZReport] = useState(false);

  const loadData = useCallback(async () => {
    const biz = await MobileStorageService.getBusiness();
    const txs = await MobileStorageService.getTransactions();
    const sec = await MobileSecurityService.getSecuritySettings();
    const sess = await MobileAuthService.getSession();
    setBusiness(biz);
    setTransactions(txs);
    setIsMasked(sec.isPrivacyMaskActive);
    setIsPinSet(sec.isPinSet);
    setSession(sess);
    if (biz?.currency) {
      setActiveCurrency(biz.currency);
    }

    // Compute unified portfolio valuation
    try {
      const cashbox = MobileStorageService.calculateMultiCurrencyCashbox(txs);
      const rates = await MobileExchangeService.getRates();
      const val = MobileExchangeService.calculatePortfolioValuation(cashbox, rates);
      setPortfolioValuation(val);
    } catch {}
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

  const handleOpenZReport = async () => {
    const expected = await MobileReconciliationService.getExpectedBalances();
    setPhysicalUsd(String(expected.USD));
    setPhysicalZwg(String(expected.ZWG));
    setPhysicalZar(String(expected.ZAR));
    setZReportNotes('');
    setIsZReportModalOpen(true);
  };

  const handleSaveZReport = async () => {
    setIsSavingZReport(true);
    try {
      const report = await MobileReconciliationService.closeShiftAndGenerateZReport(
        {
          USD: parseFloat(physicalUsd) || 0,
          ZWG: parseFloat(physicalZwg) || 0,
          ZAR: parseFloat(physicalZar) || 0,
        },
        business?.name || 'Master Cashier',
        zReportNotes
      );
      setIsSavingZReport(false);
      setIsZReportModalOpen(false);
      Alert.alert(
        report.status === 'balanced' ? 'Shift Balanced' : 'Z-Report Recorded',
        report.status === 'balanced'
          ? 'Physical cash in all 3 drawers matches expected till float perfectly.'
          : `Shift closed with variance. USD Variance: ${report.variances.USD >= 0 ? '+' : ''}$${report.variances.USD}. Record saved.`
      );
    } catch (e: any) {
      setIsSavingZReport(false);
      Alert.alert('Error', e.message || 'Could not save Z-Report.');
    }
  };

  const handleToggleMask = async () => {
    if (isMasked && isPinSet) {
      setPinAttempt('');
      setPinError(null);
      setIsPinUnlockOpen(true);
      return;
    }
    const next = await MobileSecurityService.togglePrivacyMask();
    setIsMasked(next);
  };

  const handleVerifyPinAndUnmask = async () => {
    const isValid = await MobileSecurityService.verifyPin(pinAttempt);
    if (isValid) {
      const next = await MobileSecurityService.togglePrivacyMask();
      setIsMasked(next);
      setIsPinUnlockOpen(false);
      setPinAttempt('');
      setPinError(null);
    } else {
      setPinError('Incorrect 4-digit PIN. Try again.');
    }
  };

  const currency = activeCurrency;
  const summary = MobileStorageService.calculateSummary(transactions, { period, currency });
  const multiDrawer: MultiCurrencyCashbox = MobileStorageService.calculateMultiCurrencyCashbox(transactions);
  const recentTransactions = sortTransactionsByDateDesc(
    transactions.filter((t) => t.currency === currency)
  ).slice(0, 4);

  // Manual Transaction creation
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

  // SMS Live Parser handler
  const handleSmsChange = (text: string) => {
    setRawSmsInput(text);
    if (text.trim().length > 10) {
      const parsed = parseZimbabweSms(text);
      setParsedSms(parsed);
    } else {
      setParsedSms(null);
    }
  };

  const handleApplySampleSms = (sample: string) => {
    setRawSmsInput(sample);
    const parsed = parseZimbabweSms(sample);
    setParsedSms(parsed);
  };

  const handleSaveParsedSms = async () => {
    if (!parsedSms || !parsedSms.isValid) {
      Alert.alert('Cannot Save', 'Please ensure a valid SMS transaction is parsed.');
      return;
    }

    await MobileStorageService.saveTransaction({
      transactionDate: parsedSms.date,
      description: `${parsedSms.provider.toUpperCase()}: ${parsedSms.counterparty}`,
      amount: parsedSms.amount,
      currency: parsedSms.currency,
      direction: parsedSms.direction,
      type: parsedSms.suggestedType,
      category: parsedSms.suggestedCategory,
      originalReference: parsedSms.reference,
      reviewStatus: 'confirmed',
      notes: `Imported via SMS Parser: ${parsedSms.rawText.slice(0, 80)}...`,
    });

    setIsSmsModalOpen(false);
    setRawSmsInput('');
    setParsedSms(null);
    await loadData();
    Alert.alert('Transaction Recorded', `${parsedSms.direction === 'inflow' ? 'Sale' : 'Payment'} saved to till.`);
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const pendingCount = transactions.filter((t) => t.reviewStatus === 'pending_review').length;
  const filteredTxs = transactions.filter((t) => t.currency === currency);
  const inflowCount = filteredTxs.filter((t) => t.direction === 'inflow').length;
  const outflowCount = filteredTxs.filter((t) => t.direction === 'outflow').length;

  const displayMoney = (val: number, cur: CurrencyCode) => {
    if (isMasked) return '••••';
    return formatMoney(val, cur);
  };

  const userDisplayName = session?.username || session?.name || business?.ownerName || 'Mr Q';

  return (
    <View style={styles.screenWrapper}>
      {/* 1. Sticky Top App Bar */}
      <View style={styles.stickyTopBar}>
        {/* Top App Bar Row */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greetingTitle}>
              {t('greeting_prefix')}, {userDisplayName}
            </Text>
            <Text style={styles.headerSubtitle}>
              {todayFormatted} &bull; {t('city_country')}
            </Text>
          </View>
          <View style={styles.topRightActions}>
            {/* Privacy Mask Toggle Button */}
            <Pressable
              onPress={handleToggleMask}
              accessibilityRole="button"
              accessibilityLabel="Toggle privacy mask for sensitive numbers"
              style={[
                styles.iconButton,
                isMasked && { backgroundColor: 'rgba(21, 101, 216, 0.35)' },
              ]}
            >
              <Ionicons
                name={isMasked ? 'eye-off-outline' : 'eye-outline'}
                size={19}
                color={isMasked ? BlueTokens.accent : '#FFFFFF'}
              />
            </Pressable>

            {/* Profile & Notifications Bell */}
            <Pressable
              onPress={() => router.push('/modal')}
              accessibilityRole="button"
              accessibilityLabel="Open settings and profile"
              style={styles.iconButton}
            >
              <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
              {pendingCount > 0 && <View style={styles.bellBadge} />}
            </Pressable>
          </View>
        </View>
      </View>

      {/* 2. Main Scrollable Container */}
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={EmeraldTokens.deepPine}
          />
        }
      >
        {/* Collapsible Hero Stat Block (Hides as user scrolls) */}
        <View style={styles.collapsibleHeroBlock}>
          {/* Multi-Currency Cashbox Drawer Switcher Chips */}
          <View style={styles.currencyDrawerRow}>
            {[
              { id: 'USD', label: t('usd_cash') },
              { id: 'ZWG', label: t('zig_ecocash') },
              { id: 'ZAR', label: t('zar_rand') },
            ].map((item) => {
              const isCurActive = activeCurrency === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setActiveCurrency(item.id as CurrencyCode)}
                  style={[
                    styles.currencyDrawerChip,
                    isCurActive && styles.currencyDrawerChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyDrawerChipText,
                      isCurActive && styles.currencyDrawerChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 3-Column Stat Bar (Directly from Reference Screen 1) */}
          <View style={styles.statBar}>
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>
                {String(inflowCount).padStart(2, '0')}
              </Text>
              <Text style={styles.statLabel}>{currency} {t('filter_inflows')}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statNumber}>
                {String(outflowCount).padStart(2, '0')}
              </Text>
              <Text style={styles.statLabel}>{currency} {t('filter_outflows')}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={[styles.statNumber, { color: BlueTokens.accent }]}>
                {isMasked
                  ? '••••'
                  : `${summary.netCashFlow >= 0 ? '+' : ''}${formatMoney(summary.netCashFlow, currency)}`}
              </Text>
              <Text style={styles.statLabel}>{t('net_till_flow')}</Text>
            </View>
          </View>

          {/* Unified Multi-Currency Portfolio Valuation Pill */}
          <Pressable
            onPress={() => setShowPortfolioTotal(!showPortfolioTotal)}
            style={styles.portfolioValuationPill}
            accessibilityRole="button"
            accessibilityLabel="Toggle unified portfolio valuation"
          >
            <Ionicons name="sparkles" size={13} color={EmeraldTokens.mintCta} />
            <Text style={styles.portfolioValuationText}>
              {t('unified_worth')}:{' '}
              <Text style={styles.portfolioValuationAmount}>
                {isMasked ? '••••' : `$${portfolioValuation?.totalUsdEquivalent?.toFixed(2) || '0.00'} ${t('usd_eq')}`}
              </Text>
            </Text>
            <Ionicons name="swap-horizontal" size={13} color={BlueTokens.accent} />
          </Pressable>
        </View>

        {/* 3. White Curved Body Sheet */}
        <View style={styles.sheetContainer}>
          {/* 3-Drawer Cashbox Breakdown Card */}
          <View style={styles.multiDrawerCard}>
          <View style={styles.multiDrawerHeader}>
            <Ionicons name="wallet-outline" size={17} color={EmeraldTokens.deepPine} />
            <Text style={styles.multiDrawerTitle}>{t('drawer_breakdown')}</Text>
          </View>

          <View style={styles.multiDrawerCols}>
            {/* Drawer 1: USD */}
            <Pressable
              onPress={() => setActiveCurrency('USD')}
              style={[
                styles.drawerItem,
                activeCurrency === 'USD' && styles.drawerItemActive,
              ]}
            >
              <Text style={styles.drawerCurCode}>{t('drawer_usd')}</Text>
              <Text style={[styles.drawerBalance, { color: EmeraldTokens.deepPine }]}>
                {displayMoney(multiDrawer.USD.netCashFlow, 'USD')}
              </Text>
              <Text style={styles.drawerCount}>{t('records_count', { count: multiDrawer.USD.count })}</Text>
            </Pressable>

            {/* Drawer 2: ZiG */}
            <Pressable
              onPress={() => setActiveCurrency('ZWG')}
              style={[
                styles.drawerItem,
                activeCurrency === 'ZWG' && styles.drawerItemActive,
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <EcoCashLogo size={15} />
                <Text style={styles.drawerCurCode}>{t('drawer_zig')}</Text>
              </View>
              <Text style={[styles.drawerBalance, { color: BlueTokens.success }]}>
                {displayMoney(multiDrawer.ZWG.netCashFlow, 'ZWG')}
              </Text>
              <Text style={styles.drawerCount}>{t('records_count', { count: multiDrawer.ZWG.count })}</Text>
            </Pressable>

            {/* Drawer 3: ZAR */}
            <Pressable
              onPress={() => setActiveCurrency('ZAR')}
              style={[
                styles.drawerItem,
                activeCurrency === 'ZAR' && styles.drawerItemActive,
              ]}
            >
              <Text style={styles.drawerCurCode}>{t('drawer_zar')}</Text>
              <Text style={[styles.drawerBalance, { color: EmeraldTokens.pastelAmberText }]}>
                {displayMoney(multiDrawer.ZAR.netCashFlow, 'ZAR')}
              </Text>
              <Text style={styles.drawerCount}>{t('records_count', { count: multiDrawer.ZAR.count })}</Text>
            </Pressable>
          </View>
        </View>

        {/* Period Selector Tabs */}
        <View style={styles.periodRow}>
          {[
            { id: 'this_month', label: t('filter_this_month') },
            { id: 'last_month', label: t('filter_last_month') },
            { id: 'all', label: t('filter_all_records') },
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
            <Text style={styles.actionTitle}>{t('action_record_sale')}</Text>
            <Text style={styles.actionSubtitle}>
              {t('action_sale_sub', { amount: displayMoney(summary.recordedInflows, currency) })}
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
            <Text style={styles.actionTitle}>{t('action_record_expense')}</Text>
            <Text style={styles.actionSubtitle}>
              {t('action_expense_sub', { amount: displayMoney(summary.recordedOutflows, currency) })}
            </Text>
          </Pressable>

          {/* Action 3: Instant SMS Quick-Paste Parser */}
          <Pressable
            onPress={() => setIsSmsModalOpen(true)}
            style={({ pressed }) => [
              styles.actionCard,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelRose }]}>
              <Ionicons name="chatbox-ellipses-outline" size={20} color={EmeraldTokens.pastelRoseText} />
            </View>
            <Text style={styles.actionTitle}>{t('action_paste_sms')}</Text>
            <Text style={styles.actionSubtitle}>{t('action_sms_sub')}</Text>
          </Pressable>

          {/* Action 4: Customer Debts & Mukando */}
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
            <Text style={styles.actionTitle}>{t('action_customer_credit')}</Text>
            <Text style={styles.actionSubtitle}>{t('action_credit_sub')}</Text>
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
              {displayMoney(summary.estimatedOperatingProfit, currency)}
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

        {/* Day-End Shift Balancing & Z-Report Banner */}
        <Pressable
          onPress={handleOpenZReport}
          style={styles.zReportCard}
          accessibilityRole="button"
          accessibilityLabel="Open Day-End Shift Balancing Z-Report"
        >
          <View style={styles.zReportLeft}>
            <View style={[styles.miniIcon, { backgroundColor: EmeraldTokens.pastelIndigo }]}>
              <Ionicons name="clipboard-outline" size={16} color={EmeraldTokens.pastelIndigoText} />
            </View>
            <View>
              <Text style={styles.zReportCardTitle}>Day-End Shift Balancing (Z-Report)</Text>
              <Text style={styles.zReportCardSub}>Count cash, verify variance & close day</Text>
            </View>
          </View>
          <View style={styles.zReportRight}>
            <Text style={styles.zReportActionText}>Count Float</Text>
            <Ionicons name="chevron-forward" size={16} color={EmeraldTokens.deepPine} />
          </View>
        </Pressable>

        {/* 4. Recent Transactions Section (Screen 3) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recent_transactions')} ({currency})</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/transactions')}
            accessibilityRole="button"
            accessibilityLabel="View all transactions"
          >
            <Text style={styles.seeAllText}>{t('view_all')} ({filteredTxs.length})</Text>
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={40} color={EmeraldTokens.textSubtle} />
            <Text style={styles.emptyTitle}>{t('no_recent_transactions')}</Text>
            <Text style={styles.emptySub}>
              {t('no_transactions_recorded')}
            </Text>
          </View>
        ) : (
          recentTransactions.map((tx) => {
            const isInflow = tx.direction === 'inflow';
            const catMeta = CATEGORIES[tx.category];
            return (
              <View key={tx.id} style={styles.transactionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <CompanyBrandLogo identifier={tx.description} size={36} style={{ marginRight: 12, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.txTopRow}>
                      <View style={styles.txRefRow}>
                        <Text style={styles.txRefText}>
                          REF: {tx.originalReference || tx.id.substring(0, 8).toUpperCase()}
                        </Text>
                        <Text style={styles.txDateText}>
                          &bull; {tx.transactionDate}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.amountBadge,
                          {
                            backgroundColor: isInflow
                              ? BlueTokens.pastelMint
                              : BlueTokens.pastelRose,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.amountBadgeText,
                            {
                              color: isInflow
                                ? BlueTokens.success
                                : BlueTokens.error,
                            },
                          ]}
                        >
                          {isInflow ? '+' : '-'}
                          {displayMoney(tx.amount, tx.currency)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.txDescription} numberOfLines={2}>
                      {tx.description}
                    </Text>

                    <View style={styles.txBottomRow}>
                      <View style={styles.txCategoryChip}>
                        <Ionicons
                          name={isInflow ? 'arrow-down-circle' : 'arrow-up-circle'}
                          size={13}
                          color={isInflow ? BlueTokens.success : BlueTokens.error}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.txCategoryText}>
                          {getCategoryLabel(tx.category)}
                        </Text>
                      </View>

                      <M3Badge
                        label={tx.reviewStatus === 'confirmed' ? t('status_completed') : t('status_review')}
                        variant={tx.reviewStatus === 'confirmed' ? 'mint' : 'amber'}
                      />
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* 5. Bottom Mint CTA Button */}
        <View style={styles.bottomCtaContainer}>
          <M3Button
            label="CREATE TRANSACTION"
            variant="mint"
            size="lg"
            icon={<Ionicons name="add" size={20} color={EmeraldTokens.mintDarkText} />}
            onPress={() => openNewTransaction('inflow')}
          />
        </View>
      </View>
    </ScrollView>

      {/* Instant SMS Quick-Paste Modal */}
      <Modal
        visible={isSmsModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsSmsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.smsHeaderLeft}>
                <Ionicons name="chatbox-ellipses" size={20} color={EmeraldTokens.deepPine} />
                <Text style={styles.modalTitle}>Paste Transaction SMS</Text>
              </View>
              <Pressable
                onPress={() => {
                  setIsSmsModalOpen(false);
                  setRawSmsInput('');
                  setParsedSms(null);
                }}
                hitSlop={10}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={EmeraldTokens.textSlate} />
              </Pressable>
            </View>

            <Text style={styles.smsInstruction}>
              Paste any EcoCash, InnBucks, or Bank SMS notification. Our regex engine will automatically extract the amount, sender, reference, and date.
            </Text>

            {/* Test Samples Carousel */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.smsChipRow}>
              {SAMPLE_SMS_CHIPS.map((chip, i) => {
                const renderChipLogo = () => {
                  if (chip.type === 'ecocash') return <EcoCashLogo size={15} style={{ marginRight: 6 }} />;
                  if (chip.type === 'bakers_inn') return <BakersInnLogo size={15} style={{ marginRight: 6 }} />;
                  return <InnBucksLogo size={15} style={{ marginRight: 6 }} />;
                };
                return (
                  <Pressable
                    key={i}
                    onPress={() => handleApplySampleSms(chip.sms)}
                    style={[styles.smsChip, { flexDirection: 'row', alignItems: 'center' }]}
                  >
                    {renderChipLogo()}
                    <Text style={styles.smsChipText}>{chip.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.smsInputWrapper}>
              <TextInput
                multiline
                numberOfLines={3}
                placeholder="Paste SMS here (e.g. Transfer Confirmation: USD 15.00 received from...)"
                placeholderTextColor={EmeraldTokens.textSubtle}
                value={rawSmsInput}
                onChangeText={handleSmsChange}
                style={styles.smsTextInput}
              />
            </View>

            {/* Live Parsing Preview Card */}
            {parsedSms && (
              <View
                style={[
                  styles.parsedCard,
                  {
                    borderColor: parsedSms.isValid ? BlueTokens.primary : '#FB7185',
                    backgroundColor: parsedSms.isValid ? '#F0FDF4' : '#FFF1F2',
                  },
                ]}
              >
                {parsedSms.isValid ? (
                  <>
                    <View style={styles.parsedTopRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CompanyBrandLogo
                          identifier={parsedSms.provider + ' ' + (parsedSms.counterparty || '')}
                          size={28}
                          style={{ marginRight: 8 }}
                        />
                        <M3Badge
                          label={parsedSms.provider.toUpperCase()}
                          variant={parsedSms.direction === 'inflow' ? 'mint' : 'outflow'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.parsedAmount,
                          {
                            color:
                              parsedSms.direction === 'inflow'
                                ? EmeraldTokens.pastelMintText
                                : EmeraldTokens.pastelRoseText,
                          },
                        ]}
                      >
                        {parsedSms.direction === 'inflow' ? '+' : '-'}
                        {formatMoney(parsedSms.amount, parsedSms.currency)}
                      </Text>
                    </View>
                    <Text style={styles.parsedDesc}>
                      Counterparty: <Text style={{ fontWeight: '700' }}>{parsedSms.counterparty}</Text>
                    </Text>
                    <Text style={styles.parsedSub}>
                      Ref: {parsedSms.reference} &bull; Date: {parsedSms.date} &bull; Category: {CATEGORIES[parsedSms.suggestedCategory]?.label || parsedSms.suggestedCategory}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.parseErrorText}>{parsedSms.error}</Text>
                )}
              </View>
            )}

            <M3Button
              label={parsedSms?.isValid ? 'CONFIRM & RECORD TO TILL' : 'PASTE A VALID SMS'}
              variant="mint"
              size="lg"
              disabled={!parsedSms?.isValid}
              onPress={handleSaveParsedSms}
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>

      {/* Manual New Transaction Bottom Sheet / Modal */}
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
                {direction === 'inflow' ? `Record Cash In (${currency})` : `Record Cash Out (${currency})`}
              </Text>
              <Pressable
                onPress={() => setIsModalOpen(false)}
                hitSlop={10}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={EmeraldTokens.textSlate} />
              </Pressable>
            </View>

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

      {/* Till Master PIN Unlock Modal */}
      <Modal
        visible={isPinUnlockOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsPinUnlockOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 360, alignSelf: 'center' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.smsHeaderLeft}>
                <Ionicons name="lock-closed" size={20} color={EmeraldTokens.deepPine} />
                <Text style={styles.modalTitle}>Enter Master PIN</Text>
              </View>
              <Pressable
                onPress={() => {
                  setIsPinUnlockOpen(false);
                  setPinAttempt('');
                  setPinError(null);
                }}
                hitSlop={10}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={EmeraldTokens.textSlate} />
              </Pressable>
            </View>

            <Text style={styles.smsInstruction}>
              Enter your 4-digit till master PIN to disable the privacy shield and reveal financial totals.
            </Text>

            <M3Input
              label="4-Digit PIN"
              value={pinAttempt}
              onChangeText={(t) => {
                setPinAttempt(t);
                if (pinError) setPinError(null);
              }}
              placeholder="••••"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              autoFocus
            />

            {pinError && (
              <Text style={{ color: '#E11D48', fontSize: 12, marginTop: 4, fontWeight: '600' }}>
                {pinError}
              </Text>
            )}

            <M3Button
              label="UNLOCK TILL COUNTER"
              variant="mint"
              size="lg"
              onPress={handleVerifyPinAndUnmask}
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>
      {/* Day-End Shift Balancing (Z-Report) Modal */}
      <Modal
        visible={isZReportModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsZReportModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.smsHeaderLeft}>
                <Ionicons name="clipboard" size={20} color={EmeraldTokens.deepPine} />
                <Text style={styles.modalTitle}>Day-End Shift Balancing</Text>
              </View>
              <Pressable
                onPress={() => setIsZReportModalOpen(false)}
                hitSlop={10}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={22} color={EmeraldTokens.textSlate} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.zReportInstruction}>
                Physically count cash notes and check your EcoCash & InnBucks balances. Enter them below to verify till reconciliation.
              </Text>

              <M3Input
                label="Physical USD Cash Count ($)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={physicalUsd}
                onChangeText={setPhysicalUsd}
              />

              <M3Input
                label="EcoCash / ZiG Balance (ZiG)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={physicalZwg}
                onChangeText={setPhysicalZwg}
              />

              <M3Input
                label="Physical ZAR Rand Count (R)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={physicalZar}
                onChangeText={setPhysicalZar}
              />

              <M3Input
                label="Shift Notes (Optional)"
                placeholder="e.g. End of Tuesday market shift, notes verified"
                value={zReportNotes}
                onChangeText={setZReportNotes}
              />

              <View style={{ marginTop: 18, marginBottom: 12 }}>
                <M3Button
                  label={isSavingZReport ? "CLOSING SHIFT..." : "VERIFY & CLOSE Z-REPORT"}
                  variant="mint"
                  size="lg"
                  isLoading={isSavingZReport}
                  onPress={handleSaveZReport}
                />
              </View>
            </ScrollView>
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
  stickyTopBar: {
    backgroundColor: EmeraldTokens.deepPine,
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingHorizontal: 22,
    paddingBottom: 10,
    zIndex: 10,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  collapsibleHeroBlock: {
    backgroundColor: EmeraldTokens.deepPine,
    paddingHorizontal: 22,
    paddingBottom: 16,
    paddingTop: 4,
  },
  mainScrollView: {
    flex: 1,
    backgroundColor: EmeraldTokens.deepPine,
  },
  mainScrollContent: {
    flexGrow: 1,
    backgroundColor: EmeraldTokens.deepPine,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EmeraldTokens.mintCta,
  },

  // Currency Drawer Switcher Chips
  currencyDrawerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  currencyDrawerChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: DesignTokens.shapes.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  currencyDrawerChipActive: {
    backgroundColor: EmeraldTokens.mintCta,
  },
  currencyDrawerChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currencyDrawerChipTextActive: {
    color: EmeraldTokens.mintDarkText,
    fontWeight: '700',
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
    fontSize: 19,
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

  portfolioValuationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(21, 101, 216, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: DesignTokens.shapes.pill,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(85, 215, 255, 0.35)',
  },
  portfolioValuationText: {
    fontSize: 11,
    color: BlueTokens.accent,
    fontWeight: '600',
  },
  portfolioValuationAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Z-Report Card Styles
  zReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(12, 62, 53, 0.08)',
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  zReportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  zReportRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zReportCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  zReportCardSub: {
    fontSize: 11,
    color: EmeraldTokens.textMuted,
    marginTop: 2,
  },
  zReportActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.deepPine,
  },
  zReportInstruction: {
    fontSize: 12,
    lineHeight: 18,
    color: EmeraldTokens.textMuted,
    marginBottom: 14,
  },

  // Curved Sheet Container
  sheetContainer: {
    flex: 1,
    backgroundColor: EmeraldTokens.canvasLight,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    minHeight: 600,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },

  // 3-Drawer Cashbox Card
  multiDrawerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(12, 62, 53, 0.06)',
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  multiDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  multiDrawerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  multiDrawerCols: {
    flexDirection: 'row',
    gap: 8,
  },
  drawerItem: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  drawerItemActive: {
    borderColor: BlueTokens.primary,
    backgroundColor: '#EBF3FF',
  },
  drawerCurCode: {
    fontSize: 10,
    fontWeight: '700',
    color: EmeraldTokens.textMuted,
    textTransform: 'uppercase',
  },
  drawerBalance: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 2,
  },
  drawerCount: {
    fontSize: 10,
    color: EmeraldTokens.textSubtle,
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

  // 2x2 Action Cards Grid
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
    shadowColor: BlueTokens.darkNavy,
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
    shadowColor: BlueTokens.darkNavy,
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

  // Transaction Cards
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(12, 62, 53, 0.06)',
    shadowColor: BlueTokens.darkNavy,
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
    marginBottom: 14,
  },
  smsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  // SMS Modal specific styles
  smsInstruction: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  smsChipRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  smsChip: {
    backgroundColor: '#F1F5F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DesignTokens.shapes.pill,
    marginRight: 8,
  },
  smsChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: EmeraldTokens.deepPine,
  },
  smsInputWrapper: {
    backgroundColor: '#F8FAF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(12, 62, 53, 0.1)',
    padding: 12,
    marginBottom: 14,
  },
  smsTextInput: {
    fontSize: 13,
    color: EmeraldTokens.textSlate,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  parsedCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  parsedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  parsedAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  parsedDesc: {
    fontSize: 13,
    color: EmeraldTokens.textSlate,
    marginBottom: 4,
  },
  parsedSub: {
    fontSize: 11,
    color: EmeraldTokens.textMuted,
  },
  parseErrorText: {
    fontSize: 12,
    color: '#E11D48',
  },
});
