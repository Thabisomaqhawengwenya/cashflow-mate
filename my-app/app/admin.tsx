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

import { DesignTokens } from '@/constants/DesignTokens';
import { M3Badge } from '@/components/M3/M3Badge';
import { CurrencyCode } from '@/services/storage';
import {
  MobileExchangeService,
  ExchangeRateConfig,
} from '@/services/exchangeRates';
import {
  MobileAuthService,
  StoredTraderAccount,
  UserSession,
} from '@/services/auth';
import {
  MobileAdminService,
  ReportedIndividual,
  UserProblemTicket,
  SystemBroadcast,
  FraudCategory,
  FRAUD_CATEGORY_LABELS,
  TICKET_CATEGORY_LABELS,
} from '@/services/admin';
import { generateLicenseKey, LicenseTier } from '@/services/licensing';
import { useAppearance } from '@/context/AppearanceContext';

type AdminTab =
  | 'overview'
  | 'users'
  | 'reported_individuals'
  | 'support_tickets'
  | 'licenses'
  | 'security';

export default function AdminCommandCenterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { palette } = useAppearance();
  const activeBrandColor = palette.primary;

  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Multi-User Platform State
  const [accounts, setAccounts] = useState<StoredTraderAccount[]>([]);
  const [reportedList, setReportedList] = useState<ReportedIndividual[]>([]);
  const [tickets, setTickets] = useState<UserProblemTicket[]>([]);
  const [broadcast, setBroadcast] = useState<SystemBroadcast | null>(null);
  const [rates, setRates] = useState<ExchangeRateConfig | null>(null);
  const [adminSecret, setAdminSecret] = useState('CFM-HQ-2026');

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'flagged' | 'suspended'>('all');
  const [reportedSearch, setReportedSearch] = useState('');
  const [reportedFilter, setReportedFilter] = useState<'all' | 'investigating' | 'blacklisted' | 'cleared'>('all');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  // Inspect User Modal
  const [inspectedUser, setInspectedUser] = useState<StoredTraderAccount | null>(null);

  // Provision New Trader Modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserCity, setNewUserCity] = useState('Harare (Mbare Musika)');
  const [newUserBiz, setNewUserBiz] = useState('');
  const [newUserTier, setNewUserTier] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [newUserCurrency, setNewUserCurrency] = useState<CurrencyCode>('USD');

  // Log Reported Individual Modal
  const [showAddReportedModal, setShowAddReportedModal] = useState(false);
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repNatId, setRepNatId] = useState('');
  const [repCity, setRepCity] = useState('Mbare Musika, Harare');
  const [repCategory, setRepCategory] = useState<FraudCategory>('fake_ecocash_sms');
  const [repSeverity, setRepSeverity] = useState<'critical' | 'high' | 'medium'>('high');
  const [repAmount, setRepAmount] = useState('120');
  const [repEvidence, setRepEvidence] = useState('');

  // Admin Notes / Replies Drafts
  const [ticketReplyDrafts, setTicketReplyDrafts] = useState<Record<string, string>>({});
  const [reportNoteDrafts, setReportNoteDrafts] = useState<Record<string, string>>({});

  // Broadcast Editor State
  const [bcastTitle, setBcastTitle] = useState('');
  const [bcastMessage, setBcastMessage] = useState('');
  const [bcastLevel, setBcastLevel] = useState<'info' | 'warning' | 'critical'>('warning');
  const [bcastActive, setBcastActive] = useState(true);

  // License Key Generator State
  const [genUserId, setGenUserId] = useState('mrq@mbaretuckshop.co.zw');
  const [genTier, setGenTier] = useState<Exclude<LicenseTier, 'starter'>>('enterprise');
  const [generatedKey, setGeneratedKey] = useState('');

  // Security & Rates State
  const [newSecretInput, setNewSecretInput] = useState('');
  const [zigRateInput, setZigRateInput] = useState('26.5');
  const [zarRateInput, setZarRateInput] = useState('18.2');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const loadAllAdminData = useCallback(async () => {
    const [sess, accs, repList, tktList, bcast, fx, secCode] = await Promise.all([
      MobileAuthService.getSession(),
      MobileAuthService.getAllAccounts(),
      MobileAdminService.getReportedIndividuals(),
      MobileAdminService.getSupportTickets(),
      MobileAdminService.getSystemBroadcast(),
      MobileExchangeService.getRates(),
      MobileAuthService.getAdminSecretCode(),
    ]);

    setSession(sess);
    setAccounts(accs);
    setReportedList(repList);
    setTickets(tktList);
    setBroadcast(bcast);
    setBcastTitle(bcast.title);
    setBcastMessage(bcast.message);
    setBcastLevel(bcast.level);
    setBcastActive(bcast.active);
    setRates(fx);
    setZigRateInput(String(fx.usdToZwg));
    setZarRateInput(String(fx.usdToZar));
    setAdminSecret(secCode);
    setNewSecretInput(secCode);

    const initGenKey = generateLicenseKey({
      traderName: 'mrq@mbaretuckshop.co.zw',
      tier: 'enterprise',
      expiresYear: 2029,
    });
    setGeneratedKey(initGenKey);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllAdminData();
    }, [loadAllAdminData])
  );

  // Computed Multi-User Platform Telemetry
  const totalUsers = accounts.length;
  const activeUsersCount = accounts.filter((a) => a.status !== 'suspended').length;
  const flaggedUsersCount = accounts.filter((a) => a.status === 'flagged' || (a.flagsCount ?? 0) > 0).length;
  const totalMonthlyVolumeUsd = accounts.reduce((sum, a) => sum + (a.monthlyVolumeUsd || 0), 0);
  const totalPlatformTxCount = accounts.reduce((sum, a) => sum + (a.txCount || 0), 0);

  const openTicketsCount = tickets.filter((t) => t.status !== 'resolved').length;
  const urgentTicketsCount = tickets.filter((t) => t.status !== 'resolved' && t.priority === 'urgent').length;

  const blacklistedCount = reportedList.filter((r) => r.status === 'blacklisted').length;
  const investigatingCount = reportedList.filter((r) => r.status === 'investigating').length;
  const totalFraudExposureUsd = reportedList.reduce((sum, r) => sum + r.amountInvolvedUsd, 0);

  // Regional hub aggregation
  const citySummary = React.useMemo(() => {
    const map: Record<string, { city: string; traders: number; volume: number; txCount: number; flagged: number }> = {};
    accounts.forEach((acc) => {
      const cityKey = acc.city || 'Harare';
      if (!map[cityKey]) {
        map[cityKey] = { city: cityKey, traders: 0, volume: 0, txCount: 0, flagged: 0 };
      }
      map[cityKey].traders += 1;
      map[cityKey].volume += acc.monthlyVolumeUsd || 0;
      map[cityKey].txCount += acc.txCount || 0;
      if (acc.status === 'flagged' || (acc.flagsCount ?? 0) > 0) {
        map[cityKey].flagged += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.volume - a.volume);
  }, [accounts]);

  // Handlers: Users
  const handleCreateTrader = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Please enter both Trader Name and Email address.');
      return;
    }
    const updated = await MobileAuthService.adminSaveAccount({
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      city: newUserCity,
      businessName: newUserBiz || `${newUserName}'s Market Stall`,
      currency: newUserCurrency,
      tier: newUserTier,
    });
    setAccounts(updated);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserBiz('');
    setShowAddUserModal(false);
    showToast(`Provisioned trader account for ${newUserName}.`);
  };

  const handleToggleUserStatus = async (userId: string) => {
    const updated = await MobileAuthService.adminToggleAccountStatus(userId);
    setAccounts(updated);
    if (inspectedUser?.userId === userId) {
      setInspectedUser(updated.find((u) => u.userId === userId) || null);
    }
    showToast('Updated trader account status.');
  };

  const handleToggleUserKyc = async (userId: string) => {
    const updated = await MobileAuthService.adminToggleKyc(userId);
    setAccounts(updated);
    if (inspectedUser?.userId === userId) {
      setInspectedUser(updated.find((u) => u.userId === userId) || null);
    }
    showToast('Updated trader KYC verification badge.');
  };

  const handleCycleUserTier = async (acc: StoredTraderAccount) => {
    const order: ('starter' | 'pro' | 'enterprise')[] = ['starter', 'pro', 'enterprise'];
    const currentIdx = order.indexOf(acc.tier || 'starter');
    const nextTier = order[(currentIdx + 1) % order.length];
    const updated = await MobileAuthService.adminUpdateAccountTier(acc.userId, nextTier);
    setAccounts(updated);
    if (inspectedUser?.userId === acc.userId) {
      setInspectedUser(updated.find((u) => u.userId === acc.userId) || null);
    }
    showToast(`Upgraded ${acc.name} to ${nextTier.toUpperCase()} tier.`);
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    const updated = await MobileAuthService.adminDeleteAccount(userId);
    setAccounts(updated);
    if (inspectedUser?.userId === userId) setInspectedUser(null);
    showToast(`Removed ${name} from platform directory.`);
  };

  // Handlers: Reported Individuals
  const handleAddReportedIndividual = async () => {
    if (!repName.trim() || !repPhone.trim() || !repEvidence.trim()) {
      showToast('Please enter the reported name, phone number, and evidence summary.');
      return;
    }
    const updated = await MobileAdminService.addReportedIndividual({
      reportedName: repName.trim(),
      phoneNumber: repPhone.trim(),
      nationalIdOrRef: repNatId.trim() || undefined,
      cityMarket: repCity.trim() || 'Harare',
      category: repCategory,
      severity: repSeverity,
      reportedByTrader: 'Admin HQ Security Desk',
      reportedByEmail: 'admin@cashflowmate.co.zw',
      amountInvolvedUsd: Number(repAmount) || 0,
      evidenceSummary: repEvidence.trim(),
      adminNotes: 'Logged directly by Admin Command Center.',
    });
    setReportedList(updated);
    setRepName('');
    setRepPhone('');
    setRepNatId('');
    setRepEvidence('');
    setShowAddReportedModal(false);
    showToast(`Added ${repName.trim()} to National Fraud & Defaulter Watchlist.`);
  };

  const handleUpdateReportedStatus = async (
    id: string,
    status: 'investigating' | 'blacklisted' | 'cleared'
  ) => {
    const note = reportNoteDrafts[id];
    const updated = await MobileAdminService.updateReportedStatus(id, status, note);
    setReportedList(updated);
    showToast(`Watchlist record updated to ${status.toUpperCase()}.`);
  };

  const handleDeleteReported = async (id: string) => {
    const updated = await MobileAdminService.deleteReportedIndividual(id);
    setReportedList(updated);
    showToast('Removed entry from watchlist.');
  };

  // Handlers: Support Tickets
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
    showToast(`Ticket ${ticket.ticketNumber} marked as ${nextStatus.replace('_', ' ').toUpperCase()}.`);
  };

  // Handlers: Broadcast, Licenses, Security
  const handleSaveBroadcast = async () => {
    const next = await MobileAdminService.saveSystemBroadcast({
      title: bcastTitle.trim() || 'Platform Notice',
      message: bcastMessage.trim(),
      level: bcastLevel,
      active: bcastActive,
    });
    setBroadcast(next);
    showToast(bcastActive ? 'Published live broadcast alert to all user tills.' : 'Broadcast banner hidden.');
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
    showToast(`Generated ${tierToUse.toUpperCase()} HMAC-SHA256 key for ${uid}.`);
  };

  const handleCopyKey = async () => {
    if (!generatedKey) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(generatedKey);
      showToast('Copied activation key to clipboard.');
    } else {
      showToast(`Key ready: ${generatedKey}`);
    }
  };

  const handleSaveSecretCode = async () => {
    if (newSecretInput.trim().length < 4) {
      showToast('Admin secret code must be at least 4 characters.');
      return;
    }
    await MobileAuthService.setAdminSecretCode(newSecretInput.trim());
    setAdminSecret(newSecretInput.trim());
    showToast(`Updated Admin Login Secret Code to "${newSecretInput.trim()}".`);
  };

  const handleSaveRates = async () => {
    const zig = Number(zigRateInput);
    const zar = Number(zarRateInput);
    if (!zig || zig <= 0 || !zar || zar <= 0) {
      showToast('Please enter valid positive exchange rates.');
      return;
    }
    const nextRates = await MobileExchangeService.updateRates({
      usdToZwg: zig,
      usdToZar: zar,
    });
    setRates(nextRates);
    showToast(`Updated global reference exchange rates (1 USD = ${zig} ZiG | ${zar} ZAR).`);
  };

  const handleExportGovernanceSnapshot = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      platformSummary: {
        totalRegisteredTraders: totalUsers,
        activeTraders: activeUsersCount,
        monthlyPlatformVolumeUsd: totalMonthlyVolumeUsd,
        openSupportTickets: openTicketsCount,
        blacklistedIndividuals: blacklistedCount,
      },
      registeredTraders: accounts,
      reportedIndividualsWatchlist: reportedList,
      userSupportTickets: tickets,
      systemBroadcast: broadcast,
      exchangeRates: rates,
    };
    const jsonString = JSON.stringify(payload, null, 2);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashflow-mate-multiuser-governance-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded full multi-user platform governance JSON snapshot.');
    } else {
      showToast('Prepared multi-user governance snapshot.');
    }
  };

  const handleAdminSignOut = async () => {
    await MobileAuthService.logout();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.assign('/login');
      return;
    }
    router.replace('/login' as any);
  };

  // Filtered Lists
  const filteredAccounts = accounts.filter((acc) => {
    if (userStatusFilter !== 'all' && (acc.status || 'active') !== userStatusFilter) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      acc.name.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      acc.businessName.toLowerCase().includes(q) ||
      (acc.city || '').toLowerCase().includes(q) ||
      (acc.phone || '').toLowerCase().includes(q)
    );
  });

  const filteredReported = reportedList.filter((rep) => {
    if (reportedFilter !== 'all' && rep.status !== reportedFilter) return false;
    if (!reportedSearch.trim()) return true;
    const q = reportedSearch.toLowerCase();
    return (
      rep.reportedName.toLowerCase().includes(q) ||
      rep.phoneNumber.toLowerCase().includes(q) ||
      rep.cityMarket.toLowerCase().includes(q) ||
      rep.reportedByTrader.toLowerCase().includes(q) ||
      (rep.nationalIdOrRef || '').toLowerCase().includes(q)
    );
  });

  const filteredTickets = tickets.filter((tkt) => {
    if (ticketFilter !== 'all' && tkt.status !== ticketFilter) return false;
    return true;
  });

  const navItems: {
    id: AdminTab;
    label: string;
    sub: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Platform Overview',
      sub: 'Multi-User & City Telemetry',
      icon: 'grid-outline',
    },
    {
      id: 'users',
      label: 'Trader Directory',
      sub: `${totalUsers} Registered Accounts`,
      icon: 'people-outline',
      badge: totalUsers,
    },
    {
      id: 'reported_individuals',
      label: 'Reported Individuals',
      sub: 'Scammers & Defaulters Watchlist',
      icon: 'warning-outline',
      badge: reportedList.length,
      badgeColor: '#EF4444',
    },
    {
      id: 'support_tickets',
      label: 'User Problems & Helpdesk',
      sub: 'Bug Reports & Trader Issues',
      icon: 'Build-outline' as any,
      badge: openTicketsCount,
      badgeColor: '#F59E0B',
    },
    {
      id: 'licenses',
      label: 'License Key Studio',
      sub: 'Pro & Enterprise Provisioning',
      icon: 'key-outline',
    },
    {
      id: 'security',
      label: 'Security & Broadcasts',
      sub: 'Secret Code, FX & Audit Export',
      icon: 'shield-checkmark-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Desktop Command Header */}
      <View style={[styles.topHeader, { backgroundColor: '#071714' }]}>
        <View style={styles.topHeaderLeft}>
          <View style={[styles.adminShieldBadge, { backgroundColor: activeBrandColor }]}>
            <Ionicons name="shield-half" size={22} color="#34D399" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.topHeaderTitle}>CASHFLOW MATE</Text>
              <View style={styles.hqPill}>
                <Text style={styles.hqPillText}>MULTI-USER ADMIN CONSOLE</Text>
              </View>
            </View>
            <Text style={styles.topHeaderSub}>
              National Trader Governance, Fraud Watchlist & Support Helpdesk • Logged in as{' '}
              {session?.name || 'System Administrator'}
            </Text>
          </View>
        </View>

        <View style={styles.topHeaderRight}>
          <View style={styles.secretIndicator}>
            <Ionicons name="finger-print-outline" size={14} color="#34D399" />
            <Text style={styles.secretIndicatorText}>CODE: {adminSecret}</Text>
          </View>

          <Pressable style={styles.signOutBtn} onPress={handleAdminSignOut}>
            <Ionicons name="log-out-outline" size={16} color="#FCA5A5" />
            <Text style={styles.signOutBtnText}>Sign Out Admin</Text>
          </Pressable>
        </View>
      </View>

      {/* Live Status Toast */}
      {statusBanner && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#34D399" />
          <Text style={styles.toastBannerText}>{statusBanner}</Text>
          <Pressable onPress={() => setStatusBanner(null)}>
            <Ionicons name="close" size={18} color="#A7F3D0" />
          </Pressable>
        </View>
      )}

      {/* Main Split Workspace */}
      <View style={[styles.workspace, !isDesktop && { flexDirection: 'column' }]}>
        {/* Left Command Rail */}
        <View style={[styles.sideRail, !isDesktop && styles.sideRailMobile]}>
          <Text style={styles.railSectionTitle}>GOVERNANCE MODULES</Text>
          <ScrollView
            horizontal={!isDesktop}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={!isDesktop ? { gap: 8 } : { gap: 6 }}
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              const iconName =
                item.id === 'support_tickets' ? 'construct-outline' : item.icon;
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.railItem,
                    active && {
                      backgroundColor: 'rgba(52, 211, 153, 0.14)',
                      borderColor: 'rgba(52, 211, 153, 0.35)',
                    },
                    !isDesktop && styles.railItemMobile,
                  ]}
                  onPress={() => setActiveTab(item.id)}
                >
                  <View
                    style={[
                      styles.railIconBox,
                      active && { backgroundColor: '#34D399' },
                    ]}
                  >
                    <Ionicons
                      name={iconName}
                      size={18}
                      color={active ? '#071714' : '#94A3B8'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.railLabel,
                        active && { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isDesktop && <Text style={styles.railSub}>{item.sub}</Text>}
                  </View>
                  {item.badge !== undefined && item.badge > 0 && (
                    <View
                      style={[
                        styles.railCounterBadge,
                        item.badgeColor ? { backgroundColor: item.badgeColor } : {},
                      ]}
                    >
                      <Text style={styles.railCounterText}>{item.badge}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {isDesktop && (
            <View style={styles.railFooterCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.onlineDot} />
                <Text style={styles.railFooterTitle}>NATIONAL NETWORK LIVE</Text>
              </View>
              <Text style={styles.railFooterSub}>
                Monitoring {totalUsers} registered trader tills across {citySummary.length} cities.
                Admin view is strictly separated from individual user cashboxes.
              </Text>
            </View>
          )}
        </View>

        {/* Right Content Canvas */}
        <ScrollView
          style={styles.canvasScroll}
          contentContainerStyle={styles.canvasContent}
          showsVerticalScrollIndicator={false}
        >
          {/* =========================================================
              TAB 1: MULTI-USER PLATFORM OVERVIEW & REGIONAL ANALYTICS
             ========================================================= */}
          {activeTab === 'overview' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    Multi-User Platform Overview & Trust Telemetry
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    High-level supervision across all registered traders, regional market hubs,
                    reported scammers/defaulters, and user support queues
                  </Text>
                </View>
                <Pressable
                  style={[styles.primaryCtaBtn, { backgroundColor: activeBrandColor }]}
                  onPress={handleExportGovernanceSnapshot}
                >
                  <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryCtaBtnText}>Export Platform Audit JSON</Text>
                </Pressable>
              </View>

              {/* 4 Multi-User Platform KPI Cards */}
              <View style={[styles.kpiGrid, !isDesktop && { flexDirection: 'column' }]}>
                <Pressable
                  style={[styles.kpiCard, { borderTopColor: '#0C3E35', borderTopWidth: 4 }]}
                  onPress={() => setActiveTab('users')}
                >
                  <View style={styles.kpiTopRow}>
                    <Text style={styles.kpiLabel}>REGISTERED TRADERS</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: '#E8F5EF' }]}>
                      <Ionicons name="people" size={18} color="#0C3E35" />
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>{totalUsers} Tills</Text>
                  <Text style={styles.kpiMeta}>
                    {activeUsersCount} Active • {flaggedUsersCount} Flagged • {citySummary.length}{' '}
                    Cities
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.kpiCard, { borderTopColor: '#2563EB', borderTopWidth: 4 }]}
                  onPress={() => setActiveTab('users')}
                >
                  <View style={styles.kpiTopRow}>
                    <Text style={styles.kpiLabel}>NETWORK MONTHLY VOLUME</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="stats-chart" size={18} color="#2563EB" />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, { color: '#1D4ED8' }]}>
                    ${totalMonthlyVolumeUsd.toLocaleString()}
                  </Text>
                  <Text style={styles.kpiMeta}>
                    {totalPlatformTxCount} total transactions across all users
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.kpiCard, { borderTopColor: '#DC2626', borderTopWidth: 4 }]}
                  onPress={() => setActiveTab('reported_individuals')}
                >
                  <View style={styles.kpiTopRow}>
                    <Text style={styles.kpiLabel}>REPORTED INDIVIDUALS</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="alert-circle" size={18} color="#DC2626" />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, { color: '#DC2626' }]}>
                    {reportedList.length} Watchlist
                  </Text>
                  <Text style={styles.kpiMeta}>
                    {blacklistedCount} Blacklisted • {investigatingCount} Investigating ($
                    {totalFraudExposureUsd} exposure)
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.kpiCard, { borderTopColor: '#D97706', borderTopWidth: 4 }]}
                  onPress={() => setActiveTab('support_tickets')}
                >
                  <View style={styles.kpiTopRow}>
                    <Text style={styles.kpiLabel}>USER PROBLEM REPORTS</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="construct" size={18} color="#D97706" />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, { color: '#B45309' }]}>
                    {openTicketsCount} Open Issues
                  </Text>
                  <Text style={styles.kpiMeta}>
                    {urgentTicketsCount} Urgent priority • {tickets.length} Total tickets logged
                  </Text>
                </Pressable>
              </View>

              {/* Two-Column Split: Regional Breakdown + Urgent Action Queues */}
              <View style={[styles.twoColRow, !isDesktop && { flexDirection: 'column' }]}>
                {/* Left: Regional City Market Breakdown */}
                <View style={[styles.panelCard, { flex: 1.25 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>
                      Regional Trader Distribution (Zimbabwe Hubs)
                    </Text>
                    <M3Badge label={`${citySummary.length} MARKETS`} variant="primary" />
                  </View>

                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 1.6 }]}>CITY / MARKET HUB</Text>
                    <Text style={[styles.th, { flex: 0.7 }]}>TRADERS</Text>
                    <Text style={[styles.th, { flex: 0.8 }]}>TX COUNT</Text>
                    <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>MONTHLY VOL</Text>
                  </View>

                  {citySummary.map((row) => (
                    <View key={row.city} style={styles.tableRow}>
                      <View style={{ flex: 1.6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="location" size={15} color="#0C3E35" />
                        <Text style={styles.rowTitle}>{row.city}</Text>
                      </View>
                      <Text style={[styles.cellMono, { flex: 0.7 }]}>{row.traders} stalls</Text>
                      <Text style={[styles.cellMono, { flex: 0.8 }]}>{row.txCount} tx</Text>
                      <Text
                        style={[
                          styles.cellMono,
                          { flex: 1, textAlign: 'right', fontWeight: '800', color: '#0C3E35' },
                        ]}
                      >
                        ${row.volume.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Right: System-Wide Broadcast Banner Control */}
                <View style={[styles.panelCard, { flex: 1 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>Network-Wide Trader Broadcast</Text>
                    <M3Badge
                      label={bcastActive ? 'LIVE ON TILLS' : 'HIDDEN'}
                      variant={bcastActive ? 'inflow' : 'neutral'}
                    />
                  </View>
                  <Text style={styles.panelHelper}>
                    Push an instant security alert or system notice to the top of all traders&apos;
                    screens nationwide.
                  </Text>

                  <Text style={styles.inputLabel}>Alert Title</Text>
                  <TextInput
                    style={styles.input}
                    value={bcastTitle}
                    onChangeText={setBcastTitle}
                    placeholder="e.g., Security Alert: Fake EcoCash SMS Scammers"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Broadcast Message</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 66, textAlignVertical: 'top' }]}
                    value={bcastMessage}
                    onChangeText={setBcastMessage}
                    multiline
                    placeholder="Enter announcement for all traders..."
                    placeholderTextColor="#94A3B8"
                  />

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 12,
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {(['info', 'warning', 'critical'] as const).map((lvl) => (
                        <Pressable
                          key={lvl}
                          style={[
                            styles.miniChoicePill,
                            bcastLevel === lvl && {
                              backgroundColor: '#0C3E35',
                              borderColor: '#0C3E35',
                            },
                          ]}
                          onPress={() => setBcastLevel(lvl)}
                        >
                          <Text
                            style={[
                              styles.miniChoiceText,
                              bcastLevel === lvl && { color: '#FFFFFF' },
                            ]}
                          >
                            {lvl.toUpperCase()}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Pressable
                      style={[
                        styles.miniChoicePill,
                        bcastActive
                          ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }
                          : { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
                      ]}
                      onPress={() => setBcastActive(!bcastActive)}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: bcastActive ? '#166534' : '#475569',
                        }}
                      >
                        {bcastActive ? 'ACTIVE' : 'MUTED'}
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={[
                      styles.primaryCtaBtn,
                      { backgroundColor: activeBrandColor, marginTop: 14, justifyContent: 'center' },
                    ]}
                    onPress={handleSaveBroadcast}
                  >
                    <Ionicons name="megaphone-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryCtaBtnText}>Update Broadcast Banner</Text>
                  </Pressable>
                </View>
              </View>

              {/* Quick Triage Preview: Latest Reported Scammers & Latest User Problem Reports */}
              <View style={[styles.twoColRow, !isDesktop && { flexDirection: 'column' }]}>
                {/* Latest Reported Individuals */}
                <View style={[styles.panelCard, { flex: 1 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>Recent Reported Individuals</Text>
                    <Pressable onPress={() => setActiveTab('reported_individuals')}>
                      <Text style={styles.linkText}>Open Full Watchlist →</Text>
                    </Pressable>
                  </View>
                  {reportedList.slice(0, 3).map((rep) => (
                    <View key={rep.id} style={styles.triageItem}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.rowTitle}>{rep.reportedName}</Text>
                          <M3Badge
                            label={rep.status.toUpperCase()}
                            variant={rep.status === 'blacklisted' ? 'outflow' : 'amber'}
                          />
                        </View>
                        <Text style={styles.rowSub}>
                          {rep.phoneNumber} • {rep.cityMarket} •{' '}
                          {FRAUD_CATEGORY_LABELS[rep.category]}
                        </Text>
                        <Text style={styles.triageSnippet} numberOfLines={2}>
                          Reported by {rep.reportedByTrader}: &ldquo;{rep.evidenceSummary}&rdquo;
                        </Text>
                      </View>
                      <Text style={styles.exposureAmount}>${rep.amountInvolvedUsd}</Text>
                    </View>
                  ))}
                </View>

                {/* Latest User Problem Tickets */}
                <View style={[styles.panelCard, { flex: 1 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>Recent User Problem Tickets</Text>
                    <Pressable onPress={() => setActiveTab('support_tickets')}>
                      <Text style={styles.linkText}>Open Support Desk →</Text>
                    </Pressable>
                  </View>
                  {tickets.slice(0, 3).map((tkt) => (
                    <View key={tkt.id} style={styles.triageItem}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.ticketCode}>{tkt.ticketNumber}</Text>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {tkt.subject}
                          </Text>
                        </View>
                        <Text style={styles.rowSub}>
                          {tkt.userName} ({tkt.businessName} • {tkt.city})
                        </Text>
                        <Text style={styles.triageSnippet} numberOfLines={2}>
                          {tkt.description}
                        </Text>
                      </View>
                      <M3Badge
                        label={tkt.priority.toUpperCase()}
                        variant={
                          tkt.priority === 'urgent'
                            ? 'outflow'
                            : tkt.priority === 'high'
                            ? 'amber'
                            : 'neutral'
                        }
                      />
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* =========================================================
              TAB 2: MULTI-USER TRADER DIRECTORY & ACCOUNT INSPECTOR
             ========================================================= */}
          {activeTab === 'users' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    Multi-User Trader Directory ({accounts.length} Accounts)
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Supervise all registered traders across Zimbabwe, verify KYC status, manage
                    subscription tiers, or suspend flagged accounts
                  </Text>
                </View>
                <Pressable
                  style={[styles.primaryCtaBtn, { backgroundColor: activeBrandColor }]}
                  onPress={() => setShowAddUserModal(true)}
                >
                  <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryCtaBtnText}>+ Provision Trader Account</Text>
                </Pressable>
              </View>

              {/* Filter & Search Bar */}
              <View style={styles.filterToolbar}>
                <View style={styles.searchBox}>
                  <Ionicons name="search-outline" size={18} color="#64748B" />
                  <TextInput
                    style={styles.searchInput}
                    value={userSearch}
                    onChangeText={setUserSearch}
                    placeholder="Search trader name, business, city, phone, or email..."
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {(['all', 'active', 'flagged', 'suspended'] as const).map((st) => (
                    <Pressable
                      key={st}
                      style={[
                        styles.filterChip,
                        userStatusFilter === st && {
                          backgroundColor: '#0C3E35',
                          borderColor: '#0C3E35',
                        },
                      ]}
                      onPress={() => setUserStatusFilter(st)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          userStatusFilter === st && { color: '#FFFFFF' },
                        ]}
                      >
                        {st.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Multi-User Table */}
              <View style={styles.panelCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 1.5 }]}>TRADER & EMAIL</Text>
                  <Text style={[styles.th, { flex: 1.6 }]}>BUSINESS & CITY HUB</Text>
                  <Text style={[styles.th, { flex: 0.9 }]}>KYC / TIER</Text>
                  <Text style={[styles.th, { flex: 0.9 }]}>ACTIVITY & VOL</Text>
                  <Text style={[styles.th, { flex: 0.8 }]}>STATUS</Text>
                  <Text style={[styles.th, { flex: 1.6, textAlign: 'right' }]}>
                    GOVERNANCE ACTIONS
                  </Text>
                </View>

                {filteredAccounts.map((acc) => {
                  const isSuspended = acc.status === 'suspended';
                  const isFlagged = acc.status === 'flagged' || (acc.flagsCount ?? 0) > 0;
                  return (
                    <View key={acc.userId} style={styles.tableRow}>
                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.rowTitle}>{acc.name}</Text>
                        <Text style={styles.rowSub}>{acc.email}</Text>
                        <Text style={styles.rowMicro}>{acc.phone || '+263 77 000 0000'}</Text>
                      </View>

                      <View style={{ flex: 1.6 }}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {acc.businessName}
                        </Text>
                        <Text style={styles.rowSub}>{acc.city || 'Harare'}</Text>
                        <Text style={styles.rowMicro}>Active: {acc.lastActive || 'Today'}</Text>
                      </View>

                      <View style={{ flex: 0.9, gap: 4, alignItems: 'flex-start' }}>
                        <Pressable onPress={() => handleCycleUserTier(acc)}>
                          <M3Badge
                            label={(acc.tier || 'starter').toUpperCase()}
                            variant={
                              acc.tier === 'enterprise'
                                ? 'mint'
                                : acc.tier === 'pro'
                                ? 'primary'
                                : 'neutral'
                            }
                          />
                        </Pressable>
                        <Pressable onPress={() => handleToggleUserKyc(acc.userId)}>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '800',
                              color: acc.kycVerified ? '#059669' : '#D97706',
                            }}
                          >
                            {acc.kycVerified ? '✓ KYC VERIFIED' : '• KYC PENDING'}
                          </Text>
                        </Pressable>
                      </View>

                      <View style={{ flex: 0.9 }}>
                        <Text style={[styles.cellMono, { fontWeight: '800', color: '#0F172A' }]}>
                          ${(acc.monthlyVolumeUsd || 0).toLocaleString()}
                        </Text>
                        <Text style={styles.rowSub}>
                          {acc.txCount || 0} tx • {acc.currency}
                        </Text>
                      </View>

                      <View style={{ flex: 0.8 }}>
                        <M3Badge
                          label={
                            isSuspended ? 'SUSPENDED' : isFlagged ? 'FLAGGED' : 'ACTIVE'
                          }
                          variant={
                            isSuspended ? 'outflow' : isFlagged ? 'amber' : 'inflow'
                          }
                        />
                      </View>

                      <View
                        style={{
                          flex: 1.6,
                          flexDirection: 'row',
                          justifyContent: 'flex-end',
                          gap: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Pressable
                          style={styles.smallActionBtn}
                          onPress={() => setInspectedUser(acc)}
                        >
                          <Ionicons name="eye-outline" size={14} color="#0F172A" />
                          <Text style={styles.smallActionText}>Inspect</Text>
                        </Pressable>

                        <Pressable
                          style={styles.smallActionBtn}
                          onPress={() => handleCycleUserTier(acc)}
                        >
                          <Ionicons name="ribbon-outline" size={14} color="#2563EB" />
                          <Text style={[styles.smallActionText, { color: '#2563EB' }]}>
                            Tier
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.smallActionBtn,
                            isSuspended && {
                              backgroundColor: '#DCFCE7',
                              borderColor: '#86EFAC',
                            },
                          ]}
                          onPress={() => handleToggleUserStatus(acc.userId)}
                        >
                          <Text
                            style={[
                              styles.smallActionText,
                              { color: isSuspended ? '#166534' : '#D97706' },
                            ]}
                          >
                            {isSuspended ? 'Activate' : 'Suspend'}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[styles.smallActionBtn, { borderColor: '#FECACA' }]}
                          onPress={() => handleDeleteUser(acc.userId, acc.name)}
                        >
                          <Ionicons name="trash-outline" size={14} color="#DC2626" />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* =========================================================
              TAB 3: REPORTED INDIVIDUALS & FRAUD WATCHLIST
             ========================================================= */}
          {activeTab === 'reported_individuals' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    Reported Individuals & Fraud Watchlist ({reportedList.length} Cases)
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Investigate scammers, fake EcoCash/InnBucks SMS senders, counterfeit note
                    suspects, and runaway credit defaulters reported by traders
                  </Text>
                </View>
                <Pressable
                  style={[styles.primaryCtaBtn, { backgroundColor: '#DC2626' }]}
                  onPress={() => setShowAddReportedModal(true)}
                >
                  <Ionicons name="warning-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryCtaBtnText}>+ Log Reported Individual</Text>
                </Pressable>
              </View>

              {/* Filter & Search Toolbar */}
              <View style={styles.filterToolbar}>
                <View style={styles.searchBox}>
                  <Ionicons name="search-outline" size={18} color="#64748B" />
                  <TextInput
                    style={styles.searchInput}
                    value={reportedSearch}
                    onChangeText={setReportedSearch}
                    placeholder="Search reported name, +263 phone number, National ID, or market..."
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {(['all', 'investigating', 'blacklisted', 'cleared'] as const).map((st) => (
                    <Pressable
                      key={st}
                      style={[
                        styles.filterChip,
                        reportedFilter === st && {
                          backgroundColor: '#0C3E35',
                          borderColor: '#0C3E35',
                        },
                      ]}
                      onPress={() => setReportedFilter(st)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          reportedFilter === st && { color: '#FFFFFF' },
                        ]}
                      >
                        {st.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Watchlist Cards */}
              <View style={{ gap: 14 }}>
                {filteredReported.map((rep) => (
                  <View
                    key={rep.id}
                    style={[
                      styles.panelCard,
                      {
                        borderLeftWidth: 5,
                        borderLeftColor:
                          rep.status === 'blacklisted'
                            ? '#DC2626'
                            : rep.status === 'investigating'
                            ? '#D97706'
                            : '#10B981',
                      },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: isDesktop ? 'row' : 'column',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Text style={[styles.panelTitle, { fontSize: 17 }]}>
                            {rep.reportedName}
                          </Text>
                          <M3Badge
                            label={rep.status.toUpperCase()}
                            variant={
                              rep.status === 'blacklisted'
                                ? 'outflow'
                                : rep.status === 'investigating'
                                ? 'amber'
                                : 'inflow'
                            }
                          />
                          <M3Badge
                            label={FRAUD_CATEGORY_LABELS[rep.category]}
                            variant="purple"
                          />
                          <View style={styles.reportCountPill}>
                            <Text style={styles.reportCountPillText}>
                              {rep.reportsCount} TRADER REPORT{rep.reportsCount > 1 ? 'S' : ''}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 16,
                            marginTop: 8,
                          }}
                        >
                          <Text style={styles.metaField}>
                            <Text style={styles.metaFieldStrong}>Phone: </Text>
                            {rep.phoneNumber}
                          </Text>
                          {rep.nationalIdOrRef && (
                            <Text style={styles.metaField}>
                              <Text style={styles.metaFieldStrong}>ID / Ref: </Text>
                              {rep.nationalIdOrRef}
                            </Text>
                          )}
                          <Text style={styles.metaField}>
                            <Text style={styles.metaFieldStrong}>Market Hub: </Text>
                            {rep.cityMarket}
                          </Text>
                          <Text style={styles.metaField}>
                            <Text style={styles.metaFieldStrong}>Reported By: </Text>
                            {rep.reportedByTrader} ({rep.reportedByEmail})
                          </Text>
                        </View>

                        <View style={styles.evidenceBox}>
                          <Text style={styles.evidenceLabel}>TRADER EVIDENCE & INCIDENT LOG:</Text>
                          <Text style={styles.evidenceText}>{rep.evidenceSummary}</Text>
                          {rep.adminNotes && (
                            <Text style={styles.adminNoteDisplay}>
                              Admin Resolution Note: {rep.adminNotes}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View
                        style={{
                          alignItems: isDesktop ? 'flex-end' : 'flex-start',
                          justifyContent: 'space-between',
                          minWidth: 155,
                        }}
                      >
                        <View style={{ alignItems: isDesktop ? 'flex-end' : 'flex-start' }}>
                          <Text style={styles.kpiLabel}>AMOUNT EXPOSED</Text>
                          <Text style={[styles.kpiValue, { color: '#DC2626', fontSize: 22 }]}>
                            ${rep.amountInvolvedUsd.toFixed(2)}
                          </Text>
                          <Text style={styles.rowMicro}>Logged {rep.createdAt}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Admin Investigation Note + Action Bar */}
                    <View
                      style={{
                        flexDirection: isDesktop ? 'row' : 'column',
                        alignItems: isDesktop ? 'center' : 'stretch',
                        gap: 10,
                        marginTop: 12,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: '#E2E8F0',
                      }}
                    >
                      <TextInput
                        style={[styles.input, { flex: 1, paddingVertical: 8 }]}
                        value={reportNoteDrafts[rep.id] ?? rep.adminNotes ?? ''}
                        onChangeText={(txt) =>
                          setReportNoteDrafts((prev) => ({ ...prev, [rep.id]: txt }))
                        }
                        placeholder="Add Admin verification note or warning details..."
                        placeholderTextColor="#94A3B8"
                      />

                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        <Pressable
                          style={[
                            styles.smallActionBtn,
                            { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
                          ]}
                          onPress={() => handleUpdateReportedStatus(rep.id, 'blacklisted')}
                        >
                          <Ionicons name="ban-outline" size={14} color="#B91C1C" />
                          <Text style={[styles.smallActionText, { color: '#B91C1C' }]}>
                            Blacklist Network-Wide
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.smallActionBtn,
                            { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                          ]}
                          onPress={() => handleUpdateReportedStatus(rep.id, 'investigating')}
                        >
                          <Ionicons name="search-outline" size={14} color="#B45309" />
                          <Text style={[styles.smallActionText, { color: '#B45309' }]}>
                            Mark Investigating
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.smallActionBtn,
                            { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
                          ]}
                          onPress={() => handleUpdateReportedStatus(rep.id, 'cleared')}
                        >
                          <Ionicons name="checkmark-done-outline" size={14} color="#166534" />
                          <Text style={[styles.smallActionText, { color: '#166534' }]}>
                            Clear / Resolved
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[styles.smallActionBtn, { borderColor: '#FECACA' }]}
                          onPress={() => handleDeleteReported(rep.id)}
                        >
                          <Ionicons name="trash-outline" size={14} color="#DC2626" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* =========================================================
              TAB 4: USER PROBLEMS & SUPPORT HELPDESK
             ========================================================= */}
          {activeTab === 'support_tickets' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    User Problems & Support Helpdesk ({tickets.length} Tickets)
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Review technical issues, CSV bank import bugs, SMS parser requests, and billing
                    inquiries submitted by traders across the platform
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => (
                    <Pressable
                      key={st}
                      style={[
                        styles.filterChip,
                        ticketFilter === st && {
                          backgroundColor: '#0C3E35',
                          borderColor: '#0C3E35',
                        },
                      ]}
                      onPress={() => setTicketFilter(st)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          ticketFilter === st && { color: '#FFFFFF' },
                        ]}
                      >
                        {st.replace('_', ' ').toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ gap: 14 }}>
                {filteredTickets.map((tkt) => (
                  <View key={tkt.id} style={styles.panelCard}>
                    <View
                      style={{
                        flexDirection: isDesktop ? 'row' : 'column',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Text style={styles.ticketCode}>{tkt.ticketNumber}</Text>
                        <Text style={[styles.panelTitle, { fontSize: 16 }]}>{tkt.subject}</Text>
                        <M3Badge
                          label={TICKET_CATEGORY_LABELS[tkt.category]}
                          variant="primary"
                        />
                        <M3Badge
                          label={tkt.priority.toUpperCase()}
                          variant={
                            tkt.priority === 'urgent'
                              ? 'outflow'
                              : tkt.priority === 'high'
                              ? 'amber'
                              : 'neutral'
                          }
                        />
                      </View>

                      <M3Badge
                        label={tkt.status.replace('_', ' ').toUpperCase()}
                        variant={
                          tkt.status === 'resolved'
                            ? 'inflow'
                            : tkt.status === 'in_progress'
                            ? 'amber'
                            : 'outflow'
                        }
                      />
                    </View>

                    <Text style={[styles.rowSub, { marginTop: 6 }]}>
                      Submitted by <Text style={{ fontWeight: '800', color: '#0F172A' }}>{tkt.userName}</Text> ({tkt.userEmail}) •{' '}
                      {tkt.businessName} • {tkt.city} • {tkt.createdAt}
                    </Text>

                    <View style={styles.evidenceBox}>
                      <Text style={styles.evidenceLabel}>USER PROBLEM DESCRIPTION:</Text>
                      <Text style={styles.evidenceText}>{tkt.description}</Text>
                      {tkt.adminReply && (
                        <Text style={styles.adminNoteDisplay}>
                          Official Admin Reply: {tkt.adminReply}
                        </Text>
                      )}
                    </View>

                    {/* Admin Reply & Status Controls */}
                    <View
                      style={{
                        flexDirection: isDesktop ? 'row' : 'column',
                        alignItems: isDesktop ? 'center' : 'stretch',
                        gap: 10,
                        marginTop: 12,
                      }}
                    >
                      <TextInput
                        style={[styles.input, { flex: 1, paddingVertical: 8 }]}
                        value={ticketReplyDrafts[tkt.id] ?? tkt.adminReply ?? ''}
                        onChangeText={(txt) =>
                          setTicketReplyDrafts((prev) => ({ ...prev, [tkt.id]: txt }))
                        }
                        placeholder="Write official Admin response or troubleshooting solution for this trader..."
                        placeholderTextColor="#94A3B8"
                      />

                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        <Pressable
                          style={[
                            styles.smallActionBtn,
                            { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                          ]}
                          onPress={() => handleUpdateTicket(tkt, 'in_progress')}
                        >
                          <Ionicons name="time-outline" size={14} color="#B45309" />
                          <Text style={[styles.smallActionText, { color: '#B45309' }]}>
                            Reply & In Progress
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.smallActionBtn,
                            { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
                          ]}
                          onPress={() => handleUpdateTicket(tkt, 'resolved')}
                        >
                          <Ionicons name="checkmark-circle-outline" size={14} color="#166534" />
                          <Text style={[styles.smallActionText, { color: '#166534' }]}>
                            Resolve Issue
                          </Text>
                        </Pressable>

                        {tkt.status === 'resolved' && (
                          <Pressable
                            style={styles.smallActionBtn}
                            onPress={() => handleUpdateTicket(tkt, 'open')}
                          >
                            <Text style={styles.smallActionText}>Reopen</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* =========================================================
              TAB 5: LICENSE KEY STUDIO & SUBSCRIPTIONS
             ========================================================= */}
          {activeTab === 'licenses' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    HMAC-SHA256 License Key Studio & Multi-User Provisioning
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Select any registered trader below or enter an email/ID to mint offline
                    cryptographic activation keys (`CFM-PRO-...` / `CFM-ENT-...`)
                  </Text>
                </View>
              </View>

              <View style={[styles.twoColRow, !isDesktop && { flexDirection: 'column' }]}>
                <View style={[styles.panelCard, { flex: 1 }]}>
                  <Text style={styles.panelTitle}>Generate Signed Activation Key</Text>
                  <Text style={styles.panelHelper}>
                    Click any trader in the quick-select list or enter a custom User ID / Email.
                  </Text>

                  <Text style={styles.inputLabel}>Quick-Select Registered Trader</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {accounts.map((acc) => (
                      <Pressable
                        key={acc.userId}
                        style={[
                          styles.miniChoicePill,
                          genUserId === acc.email && {
                            backgroundColor: '#0C3E35',
                            borderColor: '#0C3E35',
                          },
                        ]}
                        onPress={() => {
                          setGenUserId(acc.email);
                          handleGenerateKey(acc.email, genTier);
                        }}
                      >
                        <Text
                          style={[
                            styles.miniChoiceText,
                            genUserId === acc.email && { color: '#FFFFFF' },
                          ]}
                        >
                          {acc.name} ({acc.city?.split(' ')[0] || 'ZW'})
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Target Trader Email or User ID</Text>
                  <TextInput
                    style={styles.input}
                    value={genUserId}
                    onChangeText={setGenUserId}
                    placeholder="e.g., chipo@bulawayotraders.co.zw"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Select Subscription Tier</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {(['pro', 'enterprise'] as const).map((t) => (
                      <Pressable
                        key={t}
                        style={[
                          styles.tierOptionBtn,
                          genTier === t && {
                            backgroundColor: '#0C3E35',
                            borderColor: '#0C3E35',
                          },
                        ]}
                        onPress={() => {
                          setGenTier(t);
                          handleGenerateKey(genUserId, t);
                        }}
                      >
                        <Ionicons
                          name={t === 'enterprise' ? 'diamond' : 'star'}
                          size={16}
                          color={genTier === t ? '#34D399' : '#64748B'}
                        />
                        <Text
                          style={[
                            styles.tierOptionText,
                            genTier === t && { color: '#FFFFFF' },
                          ]}
                        >
                          {t === 'pro' ? 'Pro Trader ($5/mo)' : 'Enterprise Syndicate ($15/mo)'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    style={[
                      styles.primaryCtaBtn,
                      { backgroundColor: activeBrandColor, marginTop: 18, justifyContent: 'center' },
                    ]}
                    onPress={() => handleGenerateKey()}
                  >
                    <Ionicons name="sparkles" size={16} color="#34D399" />
                    <Text style={styles.primaryCtaBtnText}>Generate Signed License Key</Text>
                  </Pressable>
                </View>

                <View style={[styles.panelCard, { flex: 1, backgroundColor: '#071714' }]}>
                  <M3Badge label="OFFLINE CRYPTOGRAPHIC SIGNATURE" variant="mint" />
                  <Text style={[styles.panelTitle, { color: '#FFFFFF', marginTop: 12 }]}>
                    Issued Activation Key
                  </Text>
                  <Text style={[styles.panelHelper, { color: '#94A3B8' }]}>
                    Bound to <Text style={{ color: '#34D399', fontWeight: '700' }}>{genUserId}</Text>{' '}
                    for tier <Text style={{ color: '#34D399', fontWeight: '700' }}>{genTier.toUpperCase()}</Text>.
                  </Text>

                  <View style={styles.generatedKeyBox}>
                    <Text selectable style={styles.generatedKeyText}>
                      {generatedKey || 'CFM-ENT-XXXX-XXXXXXXX'}
                    </Text>
                  </View>

                  <Pressable style={styles.copyKeyBtn} onPress={handleCopyKey}>
                    <Ionicons name="copy-outline" size={18} color="#071714" />
                    <Text style={styles.copyKeyBtnText}>Copy Key for Trader</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {/* =========================================================
              TAB 6: PLATFORM SECURITY, SECRET CODE & EXCHANGE RATES
             ========================================================= */}
          {activeTab === 'security' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    Platform Security Vault, Secret Code & Global FX Rates
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Rotate the desktop Admin Login Secret Code, set national reference exchange
                    rates, or export a full multi-user compliance archive
                  </Text>
                </View>
              </View>

              <View style={[styles.twoColRow, !isDesktop && { flexDirection: 'column' }]}>
                {/* Admin Secret Access Code Card */}
                <View style={[styles.panelCard, { flex: 1 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>Admin Login Secret Access Code</Text>
                    <M3Badge label="2-FACTOR GATE" variant="mint" />
                  </View>
                  <Text style={styles.panelHelper}>
                    Required alongside username <Text style={{ fontWeight: '800' }}>admin</Text> and
                    password <Text style={{ fontWeight: '800' }}>admin</Text> when signing in to the
                    Admin HQ console.
                  </Text>

                  <Text style={styles.inputLabel}>Active Secret Code</Text>
                  <TextInput
                    style={styles.input}
                    value={newSecretInput}
                    onChangeText={setNewSecretInput}
                    placeholder="CFM-HQ-2026"
                    autoCapitalize="characters"
                  />

                  <Pressable
                    style={[
                      styles.primaryCtaBtn,
                      { backgroundColor: activeBrandColor, marginTop: 14, justifyContent: 'center' },
                    ]}
                    onPress={handleSaveSecretCode}
                  >
                    <Ionicons name="key-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryCtaBtnText}>Save New Admin Secret Code</Text>
                  </Pressable>
                </View>

                {/* National Reference Exchange Rates */}
                <View style={[styles.panelCard, { flex: 1 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>National Multi-Currency Reference Rates</Text>
                    <M3Badge label="USD BASE" variant="primary" />
                  </View>
                  <Text style={styles.panelHelper}>
                    Default conversion rates distributed to trader tills for USD, ZiG, and ZAR
                    multi-drawer calculations.
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>1 USD to ZiG Rate</Text>
                      <TextInput
                        style={styles.input}
                        value={zigRateInput}
                        onChangeText={setZigRateInput}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>1 USD to ZAR Rate</Text>
                      <TextInput
                        style={styles.input}
                        value={zarRateInput}
                        onChangeText={setZarRateInput}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <Pressable
                    style={[
                      styles.primaryCtaBtn,
                      { backgroundColor: activeBrandColor, marginTop: 14, justifyContent: 'center' },
                    ]}
                    onPress={handleSaveRates}
                  >
                    <Ionicons name="sync-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryCtaBtnText}>Update Platform Exchange Rates</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* =========================================================
          MODAL 1: INSPECT TRADER ACCOUNT
         ========================================================= */}
      <Modal
        visible={!!inspectedUser}
        transparent
        animationType="fade"
        onRequestClose={() => setInspectedUser(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {inspectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{inspectedUser.name}</Text>
                    <Text style={styles.rowSub}>
                      {inspectedUser.businessName} • {inspectedUser.city || 'Harare'}
                    </Text>
                  </View>
                  <Pressable onPress={() => setInspectedUser(null)}>
                    <Ionicons name="close-circle" size={26} color="#64748B" />
                  </Pressable>
                </View>

                <View style={styles.inspectGrid}>
                  <View style={styles.inspectStatBox}>
                    <Text style={styles.kpiLabel}>MONTHLY VOLUME</Text>
                    <Text style={styles.inspectStatVal}>
                      ${(inspectedUser.monthlyVolumeUsd || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.inspectStatBox}>
                    <Text style={styles.kpiLabel}>RECORDED TX</Text>
                    <Text style={styles.inspectStatVal}>{inspectedUser.txCount || 0}</Text>
                  </View>
                  <View style={styles.inspectStatBox}>
                    <Text style={styles.kpiLabel}>ACCOUNT TIER</Text>
                    <Text style={styles.inspectStatVal}>
                      {(inspectedUser.tier || 'starter').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.inspectStatBox}>
                    <Text style={styles.kpiLabel}>KYC STATUS</Text>
                    <Text
                      style={[
                        styles.inspectStatVal,
                        { color: inspectedUser.kycVerified ? '#059669' : '#D97706' },
                      ]}
                    >
                      {inspectedUser.kycVerified ? 'VERIFIED' : 'PENDING'}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 6, marginVertical: 12 }}>
                  <Text style={styles.metaField}>
                    <Text style={styles.metaFieldStrong}>Email: </Text>
                    {inspectedUser.email}
                  </Text>
                  <Text style={styles.metaField}>
                    <Text style={styles.metaFieldStrong}>Phone: </Text>
                    {inspectedUser.phone || '+263 77 000 0000'}
                  </Text>
                  <Text style={styles.metaField}>
                    <Text style={styles.metaFieldStrong}>Primary Till Currency: </Text>
                    {inspectedUser.currency}
                  </Text>
                  <Text style={styles.metaField}>
                    <Text style={styles.metaFieldStrong}>Joined Platform: </Text>
                    {inspectedUser.createdAt || '2026-10-20'} (Last active:{' '}
                    {inspectedUser.lastActive || 'Today'})
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  <Pressable
                    style={styles.smallActionBtn}
                    onPress={() => handleToggleUserKyc(inspectedUser.userId)}
                  >
                    <Ionicons name="shield-checkmark-outline" size={15} color="#059669" />
                    <Text style={[styles.smallActionText, { color: '#059669' }]}>
                      {inspectedUser.kycVerified ? 'Revoke KYC' : 'Approve KYC'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.smallActionBtn}
                    onPress={() => handleCycleUserTier(inspectedUser)}
                  >
                    <Ionicons name="ribbon-outline" size={15} color="#2563EB" />
                    <Text style={[styles.smallActionText, { color: '#2563EB' }]}>
                      Cycle Subscription Tier
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.smallActionBtn}
                    onPress={() => {
                      setGenUserId(inspectedUser.email);
                      setInspectedUser(null);
                      setActiveTab('licenses');
                      handleGenerateKey(inspectedUser.email, 'enterprise');
                    }}
                  >
                    <Ionicons name="key-outline" size={15} color="#0F172A" />
                    <Text style={styles.smallActionText}>Issue License Key</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.smallActionBtn, { borderColor: '#FCA5A5' }]}
                    onPress={() => handleToggleUserStatus(inspectedUser.userId)}
                  >
                    <Text style={[styles.smallActionText, { color: '#DC2626' }]}>
                      {inspectedUser.status === 'suspended'
                        ? 'Reactivate Account'
                        : 'Suspend Account'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* =========================================================
          MODAL 2: PROVISION NEW TRADER ACCOUNT
         ========================================================= */}
      <Modal
        visible={showAddUserModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddUserModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Provision New Trader Account</Text>
              <Pressable onPress={() => setShowAddUserModal(false)}>
                <Ionicons name="close-circle" size={26} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Trader Full Name</Text>
            <TextInput
              style={styles.input}
              value={newUserName}
              onChangeText={setNewUserName}
              placeholder="e.g., Rudo Chikowore"
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={newUserEmail}
              onChangeText={setNewUserEmail}
              placeholder="e.g., rudo@hararemarket.co.zw"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={newUserPhone}
                  onChangeText={setNewUserPhone}
                  placeholder="+263 77..."
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>City / Market Hub</Text>
                <TextInput
                  style={styles.input}
                  value={newUserCity}
                  onChangeText={setNewUserCity}
                  placeholder="Harare (Mbare)"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Business / Stall Name</Text>
            <TextInput
              style={styles.input}
              value={newUserBiz}
              onChangeText={setNewUserBiz}
              placeholder="e.g., Chikowore Agro & Grain"
              placeholderTextColor="#94A3B8"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {(['starter', 'pro', 'enterprise'] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[
                    styles.miniChoicePill,
                    newUserTier === t && {
                      backgroundColor: '#0C3E35',
                      borderColor: '#0C3E35',
                    },
                  ]}
                  onPress={() => setNewUserTier(t)}
                >
                  <Text
                    style={[
                      styles.miniChoiceText,
                      newUserTier === t && { color: '#FFFFFF' },
                    ]}
                  >
                    {t.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[
                styles.primaryCtaBtn,
                { backgroundColor: activeBrandColor, marginTop: 18, justifyContent: 'center' },
              ]}
              onPress={handleCreateTrader}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryCtaBtnText}>Create Trader Account</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* =========================================================
          MODAL 3: LOG REPORTED INDIVIDUAL TO WATCHLIST
         ========================================================= */}
      <Modal
        visible={showAddReportedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddReportedModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Reported Individual to Watchlist</Text>
              <Pressable onPress={() => setShowAddReportedModal(false)}>
                <Ionicons name="close-circle" size={26} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Reported Person / Alias</Text>
            <TextInput
              style={styles.input}
              value={repName}
              onChangeText={setRepName}
              placeholder="e.g., Knowledge Moyo ('Boss K')"
              placeholderTextColor="#94A3B8"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={repPhone}
                  onChangeText={setRepPhone}
                  placeholder="+263 77..."
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>National ID / Reference</Text>
                <TextInput
                  style={styles.input}
                  value={repNatId}
                  onChangeText={setRepNatId}
                  placeholder="Optional ID"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>City / Market Location</Text>
                <TextInput
                  style={styles.input}
                  value={repCity}
                  onChangeText={setRepCity}
                  placeholder="e.g., Mbare Musika, Harare"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 0.7 }}>
                <Text style={styles.inputLabel}>USD Exposure ($)</Text>
                <TextInput
                  style={styles.input}
                  value={repAmount}
                  onChangeText={setRepAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Fraud / Default Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(Object.keys(FRAUD_CATEGORY_LABELS) as FraudCategory[]).map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.miniChoicePill,
                    repCategory === cat && {
                      backgroundColor: '#DC2626',
                      borderColor: '#DC2626',
                    },
                  ]}
                  onPress={() => setRepCategory(cat)}
                >
                  <Text
                    style={[
                      styles.miniChoiceText,
                      repCategory === cat && { color: '#FFFFFF' },
                    ]}
                  >
                    {FRAUD_CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Evidence & Incident Summary</Text>
            <TextInput
              style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
              value={repEvidence}
              onChangeText={setRepEvidence}
              multiline
              placeholder="Describe what happened, invoice/SMS references, and trader reports..."
              placeholderTextColor="#94A3B8"
            />

            <Pressable
              style={[
                styles.primaryCtaBtn,
                { backgroundColor: '#DC2626', marginTop: 16, justifyContent: 'center' },
              ]}
              onPress={handleAddReportedIndividual}
            >
              <Ionicons name="shield-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryCtaBtnText}>Publish to Fraud Watchlist</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    flexWrap: 'wrap',
    gap: 12,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminShieldBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: 'SpaceMono',
  },
  hqPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  hqPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.7,
    fontFamily: 'SpaceMono',
  },
  topHeaderSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secretIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secretIndicatorText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    fontFamily: 'SpaceMono',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  signOutBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FCA5A5',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0C3E35',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toastBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#ECFDF5',
  },
  workspace: {
    flex: 1,
    flexDirection: 'row',
  },
  sideRail: {
    width: 270,
    backgroundColor: '#0B1F1B',
    padding: 16,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.07)',
  },
  sideRailMobile: {
    width: '100%',
    paddingVertical: 10,
  },
  railSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingHorizontal: 6,
    fontFamily: 'SpaceMono',
  },
  railItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  railItemMobile: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  railIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  railSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  railCounterBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  railCounterText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'SpaceMono',
  },
  railFooterCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  railFooterTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
    fontFamily: 'SpaceMono',
  },
  railFooterSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 16,
  },
  canvasScroll: {
    flex: 1,
  },
  canvasContent: {
    padding: 24,
    paddingBottom: 60,
    maxWidth: 1360,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
  },
  primaryCtaBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...DesignTokens.shadows.softCard,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    fontFamily: 'SpaceMono',
  },
  kpiIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    fontFamily: 'SpaceMono',
  },
  kpiMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...DesignTokens.shadows.softCard,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  panelHelper: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0C3E35',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 6,
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.7,
    fontFamily: 'SpaceMono',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  rowSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  rowMicro: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  cellMono: {
    fontSize: 12,
    color: '#334155',
    fontFamily: 'SpaceMono',
  },
  triageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  triageSnippet: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 17,
  },
  exposureAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#DC2626',
    fontFamily: 'SpaceMono',
  },
  ticketCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0C3E35',
    backgroundColor: '#E8F5EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontFamily: 'SpaceMono',
  },
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    fontFamily: 'SpaceMono',
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  smallActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  reportCountPill: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  reportCountPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
    fontFamily: 'SpaceMono',
  },
  metaField: {
    fontSize: 12,
    color: '#475569',
  },
  metaFieldStrong: {
    fontWeight: '800',
    color: '#0F172A',
  },
  evidenceBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  evidenceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    fontFamily: 'SpaceMono',
  },
  evidenceText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 19,
  },
  adminNoteDisplay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0C3E35',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  miniChoicePill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  miniChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  tierOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  tierOptionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  generatedKeyBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: 14,
    padding: 18,
    marginVertical: 16,
    alignItems: 'center',
  },
  generatedKeyText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: 1.4,
    fontFamily: 'SpaceMono',
  },
  copyKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34D399',
    paddingVertical: 12,
    borderRadius: 999,
  },
  copyKeyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071714',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    ...DesignTokens.shadows.softCard,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  inspectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inspectStatBox: {
    flex: 1,
    minWidth: 110,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inspectStatVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
    fontFamily: 'SpaceMono',
  },
});
