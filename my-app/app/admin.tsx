import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  useWindowDimensions,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import { CurrencyCode } from '@/services/storage';
import { MobileExchangeService } from '@/services/exchangeRates';
import {
  MobileAuthService,
  StoredTraderAccount,
  UserSession,
} from '@/services/auth';
import {
  MobileAdminService,
  ReportedIndividual,
  UserProblemTicket,
  SubscriptionPaymentRecord,
  AdminAuditLogEntry,
  ParserRuleConfig,
  PushCampaignRecord,
  PlatformFeatureFlag,
  FraudCategory,
  FRAUD_CATEGORY_LABELS,
  TICKET_CATEGORY_LABELS,
} from '@/services/admin';
import { generateLicenseKey, LicenseTier } from '@/services/licensing';
import { AppLogo } from '@/components/BrandLogos';

type AdminSection =
  | 'overview'
  | 'merchants'
  | 'watchlist'
  | 'support'
  | 'system'
  | 'broadcasts';

export default function AdminBackOfficePortalScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [session, setSession] = useState<UserSession | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  // Data State
  const [accounts, setAccounts] = useState<StoredTraderAccount[]>([]);
  const [reportedList, setReportedList] = useState<ReportedIndividual[]>([]);
  const [tickets, setTickets] = useState<UserProblemTicket[]>([]);
  const [payments, setPayments] = useState<SubscriptionPaymentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [parserRules, setParserRules] = useState<ParserRuleConfig[]>([]);
  const [campaigns, setCampaigns] = useState<PushCampaignRecord[]>([]);
  const [featureFlags, setFeatureFlags] = useState<PlatformFeatureFlag[]>([]);
  const [adminSecret, setAdminSecret] = useState('CFM-HQ-2026');

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [reportedFilter, setReportedFilter] = useState<'all' | 'investigating' | 'blacklisted' | 'cleared'>('all');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  // Modals
  const [inspectedUser, setInspectedUser] = useState<StoredTraderAccount | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserCity, setNewUserCity] = useState('Harare');
  const [newUserBiz, setNewUserBiz] = useState('');
  const [newUserTier, setNewUserTier] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [newUserCurrency] = useState<CurrencyCode>('USD');

  const [showAddReportedModal, setShowAddReportedModal] = useState(false);
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repCity, setRepCity] = useState('Mbare Musika, Harare');
  const [repCategory, setRepCategory] = useState<FraudCategory>('fake_ecocash_sms');
  const [repAmount, setRepAmount] = useState('120');
  const [repEvidence, setRepEvidence] = useState('');

  // Inline Inputs
  const [genUserId, setGenUserId] = useState('trader@cashflow.co.zw');
  const [genTier, setGenTier] = useState<Exclude<LicenseTier, 'starter'>>('enterprise');
  const [generatedKey, setGeneratedKey] = useState('');
  const [ticketReplyDrafts, setTicketReplyDrafts] = useState<Record<string, string>>({});
  const [campTitle, setCampTitle] = useState('');
  const [campBody, setCampBody] = useState('');
  const [campTarget, setCampTarget] = useState<PushCampaignRecord['targetAudience']>('All Registered Traders');
  const [newSecretInput, setNewSecretInput] = useState('');
  const [zigRateInput, setZigRateInput] = useState('26.5');
  const [zarRateInput, setZarRateInput] = useState('18.2');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const loadData = useCallback(async () => {
    const [
      sess,
      accs,
      repList,
      tktList,
      payList,
      audList,
      prsList,
      cmpList,
      flagList,
      fx,
      secCode,
    ] = await Promise.all([
      MobileAuthService.getSession(),
      MobileAuthService.getAllAccounts(),
      MobileAdminService.getReportedIndividuals(),
      MobileAdminService.getSupportTickets(),
      MobileAdminService.getSubscriptionPayments(),
      MobileAdminService.getAuditLogs(),
      MobileAdminService.getParserRules(),
      MobileAdminService.getPushCampaigns(),
      MobileAdminService.getFeatureFlags(),
      MobileExchangeService.getRates(),
      MobileAuthService.getAdminSecretCode(),
    ]);

    setSession(sess);
    setAccounts(accs);
    setReportedList(repList);
    setTickets(tktList);
    setPayments(payList);
    setAuditLogs(audList);
    setParserRules(prsList);
    setCampaigns(cmpList);
    setFeatureFlags(flagList);
    setZigRateInput(String(fx.usdToZwg));
    setZarRateInput(String(fx.usdToZar));
    setAdminSecret(secCode);
    setNewSecretInput(secCode);

    setGeneratedKey(
      generateLicenseKey({
        traderName: 'trader@cashflow.co.zw',
        tier: 'enterprise',
        expiresYear: 2029,
      })
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Metrics
  const proCount = accounts.filter((a) => a.tier === 'pro').length;
  const entCount = accounts.filter((a) => a.tier === 'enterprise').length;
  const mrrUsd = proCount * 5 + entCount * 15;
  const openTickets = tickets.filter((t) => t.status !== 'resolved');
  const blacklistedCount = reportedList.filter((r) => r.status === 'blacklisted').length;
  const pendingPayments = payments.filter((p) => p.status === 'pending_verification');

  // Actions
  const handleApprovePayment = async (payment: SubscriptionPaymentRecord) => {
    const signedKey = generateLicenseKey({
      traderName: payment.traderEmail,
      tier: payment.planTier,
      expiresYear: 2029,
    });
    const updatedPayments = await MobileAdminService.approveSubscriptionPayment(
      payment.id,
      signedKey
    );
    setPayments(updatedPayments);
    const matchingUser = accounts.find(
      (a) => a.email.toLowerCase() === payment.traderEmail.toLowerCase()
    );
    if (matchingUser) {
      setAccounts(
        await MobileAuthService.adminUpdateAccountTier(matchingUser.userId, payment.planTier)
      );
    }
    notify(`Approved ${payment.traderName} and issued ${signedKey}`);
  };

  const handleGenerateKey = (targetUser?: string, targetTier?: Exclude<LicenseTier, 'starter'>) => {
    const uid = (targetUser ?? genUserId).trim() || 'trader@cashflowmate.co.zw';
    const tierToUse = targetTier ?? genTier;
    const key = generateLicenseKey({
      traderName: uid,
      tier: tierToUse,
      expiresYear: 2029,
    });
    setGeneratedKey(key);
    notify(`Generated ${tierToUse} key for ${uid}`);
  };

  const handleCopyKey = async () => {
    if (!generatedKey) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(generatedKey);
      notify('Key copied to clipboard');
    } else {
      notify(generatedKey);
    }
  };

  const handleCreateTrader = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      notify('Enter merchant name and email');
      return;
    }
    const updated = await MobileAuthService.adminSaveAccount({
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      city: newUserCity,
      businessName: newUserBiz || `${newUserName}'s Stall`,
      currency: newUserCurrency,
      tier: newUserTier,
    });
    setAccounts(updated);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserBiz('');
    setShowAddUserModal(false);
    notify(`Added ${newUserName}`);
  };

  const handleToggleUserStatus = async (userId: string) => {
    const updated = await MobileAuthService.adminToggleAccountStatus(userId);
    setAccounts(updated);
    if (inspectedUser?.userId === userId) {
      setInspectedUser(updated.find((u) => u.userId === userId) || null);
    }
    notify('Account status updated');
  };

  const handleToggleUserKyc = async (userId: string) => {
    const updated = await MobileAuthService.adminToggleKyc(userId);
    setAccounts(updated);
    if (inspectedUser?.userId === userId) {
      setInspectedUser(updated.find((u) => u.userId === userId) || null);
    }
    notify('KYC verification updated');
  };

  const handleCycleUserTier = async (acc: StoredTraderAccount) => {
    const order: ('starter' | 'pro' | 'enterprise')[] = ['starter', 'pro', 'enterprise'];
    const nextTier = order[(order.indexOf(acc.tier || 'starter') + 1) % order.length];
    const updated = await MobileAuthService.adminUpdateAccountTier(acc.userId, nextTier);
    setAccounts(updated);
    if (inspectedUser?.userId === acc.userId) {
      setInspectedUser(updated.find((u) => u.userId === acc.userId) || null);
    }
    notify(`${acc.name} moved to ${nextTier}`);
  };

  const handleAddReportedIndividual = async () => {
    if (!repName.trim() || !repPhone.trim() || !repEvidence.trim()) {
      notify('Complete name, phone, and summary');
      return;
    }
    const updated = await MobileAdminService.addReportedIndividual({
      reportedName: repName.trim(),
      phoneNumber: repPhone.trim(),
      cityMarket: repCity.trim() || 'Harare',
      category: repCategory,
      severity: 'high',
      reportedByTrader: 'Admin Desk',
      reportedByEmail: 'admin@cashflowmate.co.zw',
      amountInvolvedUsd: Number(repAmount) || 0,
      evidenceSummary: repEvidence.trim(),
    });
    setReportedList(updated);
    setRepName('');
    setRepPhone('');
    setRepEvidence('');
    setShowAddReportedModal(false);
    notify(`Added ${repName.trim()} to watchlist`);
  };

  const handleUpdateReportedStatus = async (
    id: string,
    status: 'investigating' | 'blacklisted' | 'cleared'
  ) => {
    const updated = await MobileAdminService.updateReportedStatus(id, status);
    setReportedList(updated);
    notify(`Marked as ${status}`);
  };

  const handleUpdateTicket = async (
    ticket: UserProblemTicket,
    nextStatus: 'open' | 'in_progress' | 'resolved'
  ) => {
    const draftReply = ticketReplyDrafts[ticket.id];
    const updated = await MobileAdminService.updateSupportTicket(ticket.id, {
      status: nextStatus,
      ...(draftReply !== undefined && draftReply.trim() !== ''
        ? { adminReply: draftReply.trim() }
        : {}),
    });
    setTickets(updated);
    notify(`Ticket ${ticket.ticketNumber} updated`);
  };

  const handleToggleFeatureFlag = async (key: string) => {
    const updated = await MobileAdminService.toggleFeatureFlag(key);
    setFeatureFlags(updated);
    notify('Feature switch updated');
  };

  const handleToggleParserRule = async (id: string) => {
    const updated = await MobileAdminService.toggleParserRuleStatus(id);
    setParserRules(updated);
    notify('Parser state updated');
  };

  const handleSendCampaign = async () => {
    if (!campTitle.trim() || !campBody.trim()) {
      notify('Enter a title and message');
      return;
    }
    const updated = await MobileAdminService.sendPushCampaign({
      title: campTitle.trim(),
      body: campBody.trim(),
      targetAudience: campTarget,
      urgency: 'info',
      deliveredCount: accounts.length,
    });
    setCampaigns(updated);
    setCampTitle('');
    setCampBody('');
    notify('Announcement sent');
  };

  const handleSaveSecretCode = async () => {
    if (newSecretInput.trim().length < 4) {
      notify('Secret code must be at least 4 characters');
      return;
    }
    await MobileAuthService.setAdminSecretCode(newSecretInput.trim());
    setAdminSecret(newSecretInput.trim());
    notify(`Secret code updated to ${newSecretInput.trim()}`);
  };

  const handleSaveRates = async () => {
    const zig = Number(zigRateInput);
    const zar = Number(zarRateInput);
    if (!zig || zig <= 0 || !zar || zar <= 0) return;
    await MobileExchangeService.updateRates({ usdToZwg: zig, usdToZar: zar });
    notify('Exchange rates saved');
  };

  const handleAdminSignOut = async () => {
    await MobileAuthService.logout();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.assign('/login');
      return;
    }
    router.replace('/login' as any);
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      acc.name.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      acc.businessName.toLowerCase().includes(q) ||
      (acc.city || '').toLowerCase().includes(q)
    );
  });

  const filteredReported = reportedList.filter((rep) =>
    reportedFilter === 'all' ? true : rep.status === reportedFilter
  );

  const filteredTickets = tickets.filter((tkt) =>
    ticketFilter === 'all' ? true : tkt.status === ticketFilter
  );

  const navItems: {
    id: AdminSection;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    count?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: 'grid-outline' },
    { id: 'merchants', label: 'Merchants', icon: 'people-outline', count: accounts.length },
    { id: 'watchlist', label: 'Watchlist', icon: 'shield-outline', count: reportedList.length },
    { id: 'support', label: 'Support', icon: 'chatbubble-ellipses-outline', count: openTickets.length },
    { id: 'system', label: 'System & AI', icon: 'options-outline' },
    { id: 'broadcasts', label: 'Broadcasts', icon: 'megaphone-outline' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={[styles.shell, !isDesktop && { flexDirection: 'column' }]}>
        {/* Minimal Left Navigation Rail */}
        <View style={[styles.sidebar, !isDesktop && styles.sidebarMobile]}>
          <View style={styles.brandHeader}>
            <AppLogo size={34} />
            <View>
              <Text style={styles.brandName}>CashFlow Mate</Text>
              <Text style={styles.brandMeta}>Admin</Text>
            </View>
          </View>

          <ScrollView
            horizontal={!isDesktop}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={isDesktop ? styles.navStack : styles.navRowMobile}
          >
            {navItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setActiveSection(item.id)}
                  style={[styles.navButton, active && styles.navButtonActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={17}
                    color={active ? '#FFFFFF' : '#71717A'}
                  />
                  <Text style={[styles.navText, active && styles.navTextActive]}>
                    {item.label}
                  </Text>
                  {item.count !== undefined && item.count > 0 && (
                    <Text style={[styles.navCount, active && styles.navCountActive]}>
                      {item.count}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {isDesktop && (
            <View style={styles.sidebarFooter}>
              <View style={styles.adminProfileRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{(session?.username || 'Admin').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminName} numberOfLines={1}>
                    {session?.username || 'System Admin'}
                  </Text>
                  <Text style={styles.adminCode}>Code: {adminSecret}</Text>
                </View>
              </View>
              <Pressable style={styles.signOutMinimalBtn} onPress={handleAdminSignOut}>
                <Text style={styles.signOutMinimalText}>Sign out</Text>
                <Ionicons name="arrow-forward" size={14} color="#18181B" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Main Minimalist Canvas */}
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Floating Minimal Toast */}
          {toastMessage && (
            <View style={styles.toastPill}>
              <View style={styles.statusDotGreen} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          {/* =========================================================
              1. OVERVIEW (Bento Grid + Billing + License Generator)
             ========================================================= */}
          {activeSection === 'overview' && (
            <View style={styles.sectionStack}>
              <View style={styles.pageHeader}>
                <View>
                  <Text style={styles.pageTitle}>Overview</Text>
                  <Text style={styles.pageDesc}>
                    Platform revenue, merchant activity, and trust summary
                  </Text>
                </View>
                {!isDesktop && (
                  <Pressable style={styles.outlinePillBtn} onPress={handleAdminSignOut}>
                    <Text style={styles.outlinePillText}>Sign out</Text>
                  </Pressable>
                )}
              </View>

              {/* 4 Minimal Bento Metric Cards (Pinterest Bento Style) */}
              <View style={[styles.bentoRow, !isDesktop && { flexDirection: 'column' }]}>
                <Pressable
                  style={[styles.bentoCard, styles.bentoCardDark]}
                  onPress={() => setActiveSection('merchants')}
                >
                  <Text style={styles.bentoLabelLight}>Monthly revenue</Text>
                  <Text style={styles.bentoHeroValLight}>${mrrUsd}</Text>
                  <Text style={styles.bentoFootLight}>
                    {entCount} Enterprise · {proCount} Pro
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.bentoCard}
                  onPress={() => setActiveSection('merchants')}
                >
                  <Text style={styles.bentoLabel}>Merchants</Text>
                  <Text style={styles.bentoHeroVal}>{accounts.length}</Text>
                  <Text style={styles.bentoFootGreen}>Active across 6 cities</Text>
                </Pressable>

                <Pressable
                  style={styles.bentoCard}
                  onPress={() => setActiveSection('watchlist')}
                >
                  <Text style={styles.bentoLabel}>Watchlist</Text>
                  <Text style={styles.bentoHeroVal}>{reportedList.length}</Text>
                  <Text style={styles.bentoFootMuted}>
                    {blacklistedCount} blacklisted numbers
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.bentoCard}
                  onPress={() => setActiveSection('support')}
                >
                  <Text style={styles.bentoLabel}>Open tickets</Text>
                  <Text style={styles.bentoHeroVal}>{openTickets.length}</Text>
                  <Text style={styles.bentoFootMuted}>
                    {tickets.length} total user reports
                  </Text>
                </Pressable>
              </View>

              {/* Two-Column Bento Split: License Key Studio + Recent Subscriptions */}
              <View style={[styles.splitRow, !isDesktop && { flexDirection: 'column' }]}>
                {/* Minimal License Studio */}
                <View style={[styles.card, { flex: 1 }]}>
                  <Text style={styles.cardTitle}>License generator</Text>
                  <Text style={styles.cardSub}>
                    Create an offline activation key for any merchant
                  </Text>

                  <View style={styles.chipWrap}>
                    {accounts.slice(0, 5).map((acc) => {
                      const selected = genUserId === acc.email;
                      return (
                        <Pressable
                          key={acc.userId}
                          style={[styles.chip, selected && styles.chipActive]}
                          onPress={() => {
                            setGenUserId(acc.email);
                            handleGenerateKey(acc.email, genTier);
                          }}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                            {acc.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    style={styles.minimalInput}
                    value={genUserId}
                    onChangeText={setGenUserId}
                    placeholder="Merchant email"
                    placeholderTextColor="#A1A1AA"
                    autoCapitalize="none"
                  />

                  <View style={styles.segmentRow}>
                    {(['pro', 'enterprise'] as const).map((tier) => {
                      const active = genTier === tier;
                      return (
                        <Pressable
                          key={tier}
                          style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                          onPress={() => {
                            setGenTier(tier);
                            handleGenerateKey(genUserId, tier);
                          }}
                        >
                          <Text
                            style={[styles.segmentText, active && styles.segmentTextActive]}
                          >
                            {tier === 'pro' ? 'Pro ($5)' : 'Enterprise ($15)'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.keyResultRow}>
                    <Text selectable style={styles.keyMonoText}>
                      {generatedKey}
                    </Text>
                    <Pressable style={styles.darkPillBtn} onPress={handleCopyKey}>
                      <Text style={styles.darkPillBtnText}>Copy key</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Subscription Payments List */}
                <View style={[styles.card, { flex: 1.15 }]}>
                  <View style={styles.cardHeaderInline}>
                    <View>
                      <Text style={styles.cardTitle}>Subscription payments</Text>
                      <Text style={styles.cardSub}>
                        Recent EcoCash, InnBucks, and bank upgrades
                      </Text>
                    </View>
                    {pendingPayments.length > 0 && (
                      <View style={styles.neutralTag}>
                        <View style={styles.statusDotAmber} />
                        <Text style={styles.neutralTagText}>
                          {pendingPayments.length} pending
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cleanList}>
                    {payments.map((pay, idx) => (
                      <View
                        key={pay.id}
                        style={[
                          styles.cleanRow,
                          idx === payments.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <Text style={styles.rowIndex}>
                          {String(idx + 1).padStart(2, '0')}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{pay.traderName}</Text>
                          <Text style={styles.itemSub}>
                            {pay.planTier === 'enterprise' ? 'Enterprise' : 'Pro'} ·{' '}
                            {pay.paymentMethod} · {pay.city}
                          </Text>
                        </View>
                        <Text style={styles.itemAmount}>${pay.amountUsd}</Text>
                        {pay.status === 'pending_verification' ? (
                          <Pressable
                            style={styles.darkPillBtn}
                            onPress={() => handleApprovePayment(pay)}
                          >
                            <Text style={styles.darkPillBtnText}>Approve</Text>
                          </Pressable>
                        ) : (
                          <View style={styles.subtleStatusPill}>
                            <View style={styles.statusDotGreen} />
                            <Text style={styles.subtleStatusText}>Paid</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* =========================================================
              2. MERCHANTS (Minimal Tracklist Directory + KYC + PIN)
             ========================================================= */}
          {activeSection === 'merchants' && (
            <View style={styles.sectionStack}>
              <View style={styles.pageHeader}>
                <View>
                  <Text style={styles.pageTitle}>Merchants</Text>
                  <Text style={styles.pageDesc}>
                    {accounts.length} registered businesses across Zimbabwe
                  </Text>
                </View>
                <Pressable
                  style={styles.darkPillBtn}
                  onPress={() => setShowAddUserModal(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.darkPillBtnText}>New merchant</Text>
                </Pressable>
              </View>

              <View style={styles.searchBarMinimal}>
                <Ionicons name="search-outline" size={17} color="#71717A" />
                <TextInput
                  style={styles.searchField}
                  value={userSearch}
                  onChangeText={setUserSearch}
                  placeholder="Search by name, stall, city, or email..."
                  placeholderTextColor="#A1A1AA"
                />
              </View>

              <View style={styles.card}>
                {filteredAccounts.map((acc, idx) => {
                  const isSuspended = acc.status === 'suspended';
                  return (
                    <View
                      key={acc.userId}
                      style={[
                        styles.cleanRow,
                        idx === filteredAccounts.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <Text style={styles.rowIndex}>
                        {String(idx + 1).padStart(2, '0')}
                      </Text>

                      <View style={{ flex: 1.4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.itemTitle}>{acc.name}</Text>
                          <View
                            style={
                              isSuspended
                                ? styles.statusDotRed
                                : acc.status === 'flagged'
                                ? styles.statusDotAmber
                                : styles.statusDotGreen
                            }
                          />
                        </View>
                        <Text style={styles.itemSub}>
                          {acc.businessName} · {acc.city || 'Harare'}
                        </Text>
                      </View>

                      <View style={{ flex: 0.9 }}>
                        <Text style={styles.itemMetaStrong}>
                          {(acc.tier || 'starter').charAt(0).toUpperCase() +
                            (acc.tier || 'starter').slice(1)}
                        </Text>
                        <Text style={styles.itemSub}>
                          {acc.kycVerified ? 'KYC verified' : 'KYC pending'}
                        </Text>
                      </View>

                      <View style={styles.rowActions}>
                        <Pressable
                          style={styles.outlinePillBtn}
                          onPress={() => setInspectedUser(acc)}
                        >
                          <Text style={styles.outlinePillText}>Details</Text>
                        </Pressable>

                        <Pressable
                          style={styles.outlinePillBtn}
                          onPress={() => handleToggleUserStatus(acc.userId)}
                        >
                          <Text style={styles.outlinePillText}>
                            {isSuspended ? 'Activate' : 'Suspend'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* =========================================================
              3. WATCHLIST (Reported Scammers & Defaulters)
             ========================================================= */}
          {activeSection === 'watchlist' && (
            <View style={styles.sectionStack}>
              <View style={styles.pageHeader}>
                <View>
                  <Text style={styles.pageTitle}>Watchlist</Text>
                  <Text style={styles.pageDesc}>
                    Individuals reported by merchants for fraud or credit default
                  </Text>
                </View>
                <Pressable
                  style={styles.darkPillBtn}
                  onPress={() => setShowAddReportedModal(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.darkPillBtnText}>Log report</Text>
                </Pressable>
              </View>

              <View style={styles.chipWrap}>
                {(['all', 'investigating', 'blacklisted', 'cleared'] as const).map((st) => {
                  const active = reportedFilter === st;
                  return (
                    <Pressable
                      key={st}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setReportedFilter(st)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ gap: 12 }}>
                {filteredReported.map((rep) => (
                  <View key={rep.id} style={styles.card}>
                    <View style={styles.cardHeaderInline}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View
                            style={
                              rep.status === 'blacklisted'
                                ? styles.statusDotRed
                                : rep.status === 'investigating'
                                ? styles.statusDotAmber
                                : styles.statusDotGreen
                            }
                          />
                          <Text style={styles.cardTitle}>{rep.reportedName}</Text>
                          <View style={styles.neutralTag}>
                            <Text style={styles.neutralTagText}>
                              {FRAUD_CATEGORY_LABELS[rep.category]}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.itemSub, { marginTop: 4 }]}>
                          {rep.phoneNumber} · {rep.cityMarket} · {rep.reportsCount} report
                          {rep.reportsCount > 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Text style={styles.itemAmount}>${rep.amountInvolvedUsd}</Text>
                    </View>

                    <Text style={styles.bodyParagraph}>{rep.evidenceSummary}</Text>

                    <View style={styles.cardFooterInline}>
                      <Text style={styles.itemSub}>Reported by {rep.reportedByTrader}</Text>
                      <View style={styles.rowActions}>
                        {rep.status !== 'blacklisted' && (
                          <Pressable
                            style={styles.darkPillBtn}
                            onPress={() => handleUpdateReportedStatus(rep.id, 'blacklisted')}
                          >
                            <Text style={styles.darkPillBtnText}>Blacklist</Text>
                          </Pressable>
                        )}
                        {rep.status !== 'cleared' && (
                          <Pressable
                            style={styles.outlinePillBtn}
                            onPress={() => handleUpdateReportedStatus(rep.id, 'cleared')}
                          >
                            <Text style={styles.outlinePillText}>Clear</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* =========================================================
              4. SUPPORT (User Problem Tickets & Helpdesk)
             ========================================================= */}
          {activeSection === 'support' && (
            <View style={styles.sectionStack}>
              <View style={styles.pageHeader}>
                <View>
                  <Text style={styles.pageTitle}>Support</Text>
                  <Text style={styles.pageDesc}>
                    Problems and technical requests submitted by users
                  </Text>
                </View>
              </View>

              <View style={styles.chipWrap}>
                {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => {
                  const active = ticketFilter === st;
                  const label = st === 'in_progress' ? 'In progress' : st.charAt(0).toUpperCase() + st.slice(1);
                  return (
                    <Pressable
                      key={st}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setTicketFilter(st)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ gap: 12 }}>
                {filteredTickets.map((tkt) => (
                  <View key={tkt.id} style={styles.card}>
                    <View style={styles.cardHeaderInline}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View
                            style={
                              tkt.status === 'resolved'
                                ? styles.statusDotGreen
                                : tkt.priority === 'urgent'
                                ? styles.statusDotRed
                                : styles.statusDotAmber
                            }
                          />
                          <Text style={styles.cardTitle}>{tkt.subject}</Text>
                        </View>
                        <Text style={[styles.itemSub, { marginTop: 4 }]}>
                          {tkt.userName} ({tkt.businessName} · {tkt.city}) ·{' '}
                          {TICKET_CATEGORY_LABELS[tkt.category]}
                        </Text>
                      </View>
                      <View style={styles.neutralTag}>
                        <Text style={styles.neutralTagText}>
                          {tkt.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.bodyParagraph}>{tkt.description}</Text>

                    {tkt.adminReply && (
                      <View style={styles.replyDisplayBox}>
                        <Text style={styles.replyDisplayText}>Reply: {tkt.adminReply}</Text>
                      </View>
                    )}

                    <View style={[styles.keyResultRow, { marginTop: 12 }]}>
                      <TextInput
                        style={[styles.minimalInput, { flex: 1, marginBottom: 0 }]}
                        value={ticketReplyDrafts[tkt.id] ?? ''}
                        onChangeText={(txt) =>
                          setTicketReplyDrafts((prev) => ({ ...prev, [tkt.id]: txt }))
                        }
                        placeholder="Write a reply to merchant..."
                        placeholderTextColor="#A1A1AA"
                      />
                      <Pressable
                        style={styles.darkPillBtn}
                        onPress={() => handleUpdateTicket(tkt, 'resolved')}
                      >
                        <Text style={styles.darkPillBtnText}>Resolve</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* =========================================================
              5. SYSTEM & AI (Feature Switches, Parsers, Security)
             ========================================================= */}
          {activeSection === 'system' && (
            <View style={styles.sectionStack}>
              <View style={styles.pageHeader}>
                <View>
                  <Text style={styles.pageTitle}>System & AI</Text>
                  <Text style={styles.pageDesc}>
                    Platform feature switches, SMS/CSV parsers, and security credentials
                  </Text>
                </View>
              </View>

              <View style={[styles.splitRow, !isDesktop && { flexDirection: 'column' }]}>
                {/* Feature Switches */}
                <View style={[styles.card, { flex: 1 }]}>
                  <Text style={styles.cardTitle}>Feature switches</Text>
                  <Text style={styles.cardSub}>Enable or disable platform modules</Text>

                  <View style={styles.cleanList}>
                    {featureFlags.map((flag, idx) => (
                      <View
                        key={flag.key}
                        style={[
                          styles.cleanRow,
                          idx === featureFlags.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{flag.name}</Text>
                          <Text style={styles.itemSub}>{flag.description}</Text>
                        </View>
                        <Pressable
                          style={[
                            styles.chip,
                            flag.enabled && styles.chipActive,
                          ]}
                          onPress={() => handleToggleFeatureFlag(flag.key)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              flag.enabled && styles.chipTextActive,
                            ]}
                          >
                            {flag.enabled ? 'On' : 'Off'}
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Right Column: Parsers + Security */}
                <View style={{ flex: 1, gap: 16 }}>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>SMS & bank CSV parsers</Text>
                    <Text style={styles.cardSub}>
                      Active extraction rules across Zimbabwean providers
                    </Text>

                    <View style={styles.cleanList}>
                      {parserRules.map((rule, idx) => (
                        <View
                          key={rule.id}
                          style={[
                            styles.cleanRow,
                            idx === parserRules.length - 1 && { borderBottomWidth: 0 },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>{rule.providerName}</Text>
                            <Text style={styles.itemSub}>
                              {rule.successRatePct}% accuracy · {rule.parsedCount30d} parsed
                            </Text>
                          </View>
                          <Pressable
                            style={styles.outlinePillBtn}
                            onPress={() => handleToggleParserRule(rule.id)}
                          >
                            <Text style={styles.outlinePillText}>{rule.status}</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Security & reference rates</Text>
                    <Text style={styles.cardSub}>
                      Admin 2FA access code and default USD exchange rates
                    </Text>

                    <View style={styles.keyResultRow}>
                      <TextInput
                        style={[styles.minimalInput, { flex: 1, marginBottom: 0 }]}
                        value={newSecretInput}
                        onChangeText={setNewSecretInput}
                        placeholder="Admin secret code"
                        autoCapitalize="characters"
                      />
                      <Pressable style={styles.darkPillBtn} onPress={handleSaveSecretCode}>
                        <Text style={styles.darkPillBtnText}>Save code</Text>
                      </Pressable>
                    </View>

                    <View style={[styles.keyResultRow, { marginTop: 10 }]}>
                      <TextInput
                        style={[styles.minimalInput, { flex: 1, marginBottom: 0 }]}
                        value={zigRateInput}
                        onChangeText={setZigRateInput}
                        placeholder="ZiG rate"
                        keyboardType="decimal-pad"
                      />
                      <TextInput
                        style={[styles.minimalInput, { flex: 1, marginBottom: 0 }]}
                        value={zarRateInput}
                        onChangeText={setZarRateInput}
                        placeholder="ZAR rate"
                        keyboardType="decimal-pad"
                      />
                      <Pressable style={styles.outlinePillBtn} onPress={handleSaveRates}>
                        <Text style={styles.outlinePillText}>Update FX</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* =========================================================
              6. BROADCASTS & ACTIVITY LOG
             ========================================================= */}
          {activeSection === 'broadcasts' && (
            <View style={styles.sectionStack}>
              <View style={styles.pageHeader}>
                <View>
                  <Text style={styles.pageTitle}>Broadcasts</Text>
                  <Text style={styles.pageDesc}>
                    Send announcements to merchant tills and review recent admin activity
                  </Text>
                </View>
              </View>

              <View style={[styles.splitRow, !isDesktop && { flexDirection: 'column' }]}>
                <View style={[styles.card, { flex: 1 }]}>
                  <Text style={styles.cardTitle}>New announcement</Text>
                  <Text style={styles.cardSub}>
                    Appears on merchant dashboards across selected hubs
                  </Text>

                  <View style={styles.chipWrap}>
                    {(
                      [
                        'All Registered Traders',
                        'Harare Hub Only',
                        'Bulawayo Hub Only',
                        'Pro & Enterprise',
                      ] as const
                    ).map((seg) => {
                      const active = campTarget === seg;
                      return (
                        <Pressable
                          key={seg}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => setCampTarget(seg)}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {seg}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    style={styles.minimalInput}
                    value={campTitle}
                    onChangeText={setCampTitle}
                    placeholder="Announcement title"
                    placeholderTextColor="#A1A1AA"
                  />

                  <TextInput
                    style={[styles.minimalInput, { minHeight: 84, textAlignVertical: 'top' }]}
                    value={campBody}
                    onChangeText={setCampBody}
                    multiline
                    placeholder="Write message..."
                    placeholderTextColor="#A1A1AA"
                  />

                  <Pressable
                    style={[styles.darkPillBtn, { alignSelf: 'flex-start', marginTop: 4 }]}
                    onPress={handleSendCampaign}
                  >
                    <Text style={styles.darkPillBtnText}>Send announcement</Text>
                  </Pressable>
                </View>

                <View style={[styles.card, { flex: 1.1 }]}>
                  <Text style={styles.cardTitle}>Recent activity</Text>
                  <Text style={styles.cardSub}>Sent broadcasts and admin audit events</Text>

                  <View style={styles.cleanList}>
                    {campaigns.map((cmp) => (
                      <View key={cmp.id} style={styles.cleanRow}>
                        <View style={styles.statusDotGreen} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{cmp.title}</Text>
                          <Text style={styles.itemSub}>
                            {cmp.targetAudience} · {cmp.sentAt}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {auditLogs.slice(0, 4).map((log, idx) => (
                      <View
                        key={log.id}
                        style={[
                          styles.cleanRow,
                          idx === 3 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <View style={styles.statusDotNeutral} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{log.target}</Text>
                          <Text style={styles.itemSub}>{log.summary}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* =========================================================
          MINIMAL MODAL 1: MERCHANT DETAILS
         ========================================================= */}
      <Modal
        visible={!!inspectedUser}
        transparent
        animationType="fade"
        onRequestClose={() => setInspectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {inspectedUser && (
              <>
                <View style={styles.cardHeaderInline}>
                  <View>
                    <Text style={styles.cardTitle}>{inspectedUser.name}</Text>
                    <Text style={styles.cardSub}>
                      {inspectedUser.businessName} · {inspectedUser.city || 'Harare'}
                    </Text>
                  </View>
                  <Pressable onPress={() => setInspectedUser(null)}>
                    <Ionicons name="close" size={22} color="#71717A" />
                  </Pressable>
                </View>

                <View style={{ gap: 6, marginVertical: 14 }}>
                  <Text style={styles.itemSub}>Email: {inspectedUser.email}</Text>
                  <Text style={styles.itemSub}>
                    Phone: {inspectedUser.phone || '+263 77 000 0000'}
                  </Text>
                  <Text style={styles.itemSub}>
                    Plan: {(inspectedUser.tier || 'starter').toUpperCase()} ·{' '}
                    {inspectedUser.kycVerified ? 'KYC verified' : 'KYC pending'}
                  </Text>
                </View>

                <View style={styles.rowActions}>
                  <Pressable
                    style={styles.darkPillBtn}
                    onPress={() => handleToggleUserKyc(inspectedUser.userId)}
                  >
                    <Text style={styles.darkPillBtnText}>
                      {inspectedUser.kycVerified ? 'Revoke KYC' : 'Approve KYC'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.outlinePillBtn}
                    onPress={() => handleCycleUserTier(inspectedUser)}
                  >
                    <Text style={styles.outlinePillText}>Change plan</Text>
                  </Pressable>

                  <Pressable
                    style={styles.outlinePillBtn}
                    onPress={() => {
                      notify(`Sent PIN reset link to ${inspectedUser.name}`);
                      setInspectedUser(null);
                    }}
                  >
                    <Text style={styles.outlinePillText}>Reset PIN</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* =========================================================
          MINIMAL MODAL 2: NEW MERCHANT
         ========================================================= */}
      <Modal
        visible={showAddUserModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.cardHeaderInline}>
              <Text style={styles.cardTitle}>New merchant</Text>
              <Pressable onPress={() => setShowAddUserModal(false)}>
                <Ionicons name="close" size={22} color="#71717A" />
              </Pressable>
            </View>

            <TextInput
              style={styles.minimalInput}
              value={newUserName}
              onChangeText={setNewUserName}
              placeholder="Full name"
              placeholderTextColor="#A1A1AA"
            />
            <TextInput
              style={styles.minimalInput}
              value={newUserEmail}
              onChangeText={setNewUserEmail}
              placeholder="Email address"
              placeholderTextColor="#A1A1AA"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.minimalInput}
              value={newUserPhone}
              onChangeText={setNewUserPhone}
              placeholder="Phone (+263...)"
              placeholderTextColor="#A1A1AA"
            />
            <TextInput
              style={styles.minimalInput}
              value={newUserBiz}
              onChangeText={setNewUserBiz}
              placeholder="Business name"
              placeholderTextColor="#A1A1AA"
            />
            <TextInput
              style={styles.minimalInput}
              value={newUserCity}
              onChangeText={setNewUserCity}
              placeholder="City"
              placeholderTextColor="#A1A1AA"
            />

            <View style={styles.chipWrap}>
              {(['starter', 'pro', 'enterprise'] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.chip, newUserTier === t && styles.chipActive]}
                  onPress={() => setNewUserTier(t)}
                >
                  <Text
                    style={[styles.chipText, newUserTier === t && styles.chipTextActive]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.darkPillBtn} onPress={handleCreateTrader}>
              <Text style={styles.darkPillBtnText}>Create merchant</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* =========================================================
          MINIMAL MODAL 3: LOG WATCHLIST REPORT
         ========================================================= */}
      <Modal
        visible={showAddReportedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddReportedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.cardHeaderInline}>
              <Text style={styles.cardTitle}>Log reported individual</Text>
              <Pressable onPress={() => setShowAddReportedModal(false)}>
                <Ionicons name="close" size={22} color="#71717A" />
              </Pressable>
            </View>

            <TextInput
              style={styles.minimalInput}
              value={repName}
              onChangeText={setRepName}
              placeholder="Full name or alias"
              placeholderTextColor="#A1A1AA"
            />
            <TextInput
              style={styles.minimalInput}
              value={repPhone}
              onChangeText={setRepPhone}
              placeholder="Phone number (+263...)"
              placeholderTextColor="#A1A1AA"
            />
            <TextInput
              style={styles.minimalInput}
              value={repCity}
              onChangeText={setRepCity}
              placeholder="Market location"
              placeholderTextColor="#A1A1AA"
            />
            <TextInput
              style={styles.minimalInput}
              value={repAmount}
              onChangeText={setRepAmount}
              placeholder="USD amount ($)"
              placeholderTextColor="#A1A1AA"
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.minimalInput, { minHeight: 72, textAlignVertical: 'top' }]}
              value={repEvidence}
              onChangeText={setRepEvidence}
              multiline
              placeholder="Summary of incident..."
              placeholderTextColor="#A1A1AA"
            />

            <Pressable style={styles.darkPillBtn} onPress={handleAddReportedIndividual}>
              <Text style={styles.darkPillBtnText}>Save to watchlist</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F6F4',
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  // Minimal Sidebar
  sidebar: {
    width: 232,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#EBEBE8',
    paddingVertical: 28,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  sidebarMobile: {
    width: '100%',
    paddingVertical: 14,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBE8',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 8,
    marginBottom: 28,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#141413',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141413',
    letterSpacing: -0.2,
  },
  brandMeta: {
    fontSize: 12,
    color: '#71717A',
  },
  navStack: {
    gap: 4,
  },
  navRowMobile: {
    gap: 6,
    paddingTop: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  navButtonActive: {
    backgroundColor: '#141413',
  },
  navText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#52525B',
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  navCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  navCountActive: {
    color: '#A1A1AA',
  },
  sidebarFooter: {
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0F0EE',
    gap: 12,
  },
  adminProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141413',
  },
  adminName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#141413',
  },
  adminCode: {
    fontSize: 11,
    color: '#71717A',
  },
  signOutMinimalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F4F4F2',
  },
  signOutMinimalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  // Main Canvas
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 36,
    paddingVertical: 32,
    paddingBottom: 64,
    maxWidth: 1180,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: '#141413',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    marginBottom: 20,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  sectionStack: {
    gap: 24,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#141413',
    letterSpacing: -0.5,
  },
  pageDesc: {
    fontSize: 14,
    color: '#71717A',
    marginTop: 3,
  },
  // Bento Grid Cards (Inspired by nue Bento pin)
  bentoRow: {
    flexDirection: 'row',
    gap: 14,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#EBEBE8',
    justifyContent: 'space-between',
    minHeight: 138,
  },
  bentoCardDark: {
    backgroundColor: '#141413',
    borderColor: '#141413',
  },
  bentoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717A',
  },
  bentoLabelLight: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  bentoHeroVal: {
    fontSize: 36,
    fontWeight: '700',
    color: '#141413',
    letterSpacing: -1,
    marginVertical: 6,
  },
  bentoHeroValLight: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginVertical: 6,
  },
  bentoFootGreen: {
    fontSize: 12,
    fontWeight: '500',
    color: '#16A34A',
  },
  bentoFootMuted: {
    fontSize: 12,
    color: '#71717A',
  },
  bentoFootLight: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  splitRow: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EBEBE8',
  },
  cardHeaderInline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  cardFooterInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F2',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#141413',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 2,
    marginBottom: 14,
  },
  // Clean Tracklist Rows (Inspired by Charcoal Music & Modern To-Dos pins)
  cleanList: {
    marginTop: 4,
  },
  cleanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F2',
  },
  rowIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
    width: 22,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#141413',
  },
  itemSub: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 2,
  },
  itemMetaStrong: {
    fontSize: 13,
    fontWeight: '600',
    color: '#141413',
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#141413',
  },
  bodyParagraph: {
    fontSize: 14,
    color: '#3F3F46',
    lineHeight: 21,
    marginTop: 6,
  },
  // Minimal Pills & Buttons
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F4F4F2',
  },
  chipActive: {
    backgroundColor: '#141413',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#52525B',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F4F4F2',
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#141413',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#52525B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  minimalInput: {
    backgroundColor: '#F4F4F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#141413',
    marginBottom: 12,
  },
  searchBarMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBE8',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 44,
  },
  searchField: {
    flex: 1,
    fontSize: 14,
    color: '#141413',
  },
  keyResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#F4F4F2',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 999,
  },
  keyMonoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#141413',
    fontFamily: 'SpaceMono',
  },
  darkPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#141413',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  darkPillBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outlinePillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F4F4F2',
  },
  outlinePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#141413',
  },
  neutralTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4F4F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  neutralTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#52525B',
  },
  subtleStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  subtleStatusText: {
    fontSize: 12,
    color: '#71717A',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  statusDotAmber: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  statusDotRed: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  statusDotNeutral: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#A1A1AA',
  },
  replyDisplayBox: {
    backgroundColor: '#F4F4F2',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  replyDisplayText: {
    fontSize: 13,
    color: '#141413',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
});
