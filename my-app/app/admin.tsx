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
  SubscriptionPaymentRecord,
  AdminAuditLogEntry,
  ParserRuleConfig,
  PushCampaignRecord,
  AdminStaffMember,
  PlatformFeatureFlag,
  FraudCategory,
  FRAUD_CATEGORY_LABELS,
  TICKET_CATEGORY_LABELS,
} from '@/services/admin';
import { generateLicenseKey, LicenseTier } from '@/services/licensing';
import { useAppearance } from '@/context/AppearanceContext';

type AdminPageId =
  | 'revenue_billing'
  | 'merchant_crm'
  | 'fraud_watchlist'
  | 'support_helpdesk'
  | 'ai_parser_ops'
  | 'campaigns_broadcasts'
  | 'rbac_feature_flags'
  | 'audit_security';

export default function AdminBackOfficePortalScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 920;
  const { palette } = useAppearance();
  const activeBrandColor = palette.primary;

  const [session, setSession] = useState<UserSession | null>(null);
  const [activePage, setActivePage] = useState<AdminPageId>('revenue_billing');

  // Back-Office Data State
  const [accounts, setAccounts] = useState<StoredTraderAccount[]>([]);
  const [reportedList, setReportedList] = useState<ReportedIndividual[]>([]);
  const [tickets, setTickets] = useState<UserProblemTicket[]>([]);
  const [broadcast, setBroadcast] = useState<SystemBroadcast | null>(null);
  const [payments, setPayments] = useState<SubscriptionPaymentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [parserRules, setParserRules] = useState<ParserRuleConfig[]>([]);
  const [campaigns, setCampaigns] = useState<PushCampaignRecord[]>([]);
  const [adminTeam, setAdminTeam] = useState<AdminStaffMember[]>([]);
  const [featureFlags, setFeatureFlags] = useState<PlatformFeatureFlag[]>([]);
  const [rates, setRates] = useState<ExchangeRateConfig | null>(null);
  const [adminSecret, setAdminSecret] = useState('CFM-HQ-2026');

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'flagged' | 'suspended'>('all');
  const [reportedSearch, setReportedSearch] = useState('');
  const [reportedFilter, setReportedFilter] = useState<'all' | 'investigating' | 'blacklisted' | 'cleared'>('all');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [auditFilter, setAuditFilter] = useState<'ALL' | AdminAuditLogEntry['eventType']>('ALL');

  // Modals & Forms
  const [inspectedUser, setInspectedUser] = useState<StoredTraderAccount | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserCity, setNewUserCity] = useState('Harare (Mbare Musika)');
  const [newUserBiz, setNewUserBiz] = useState('');
  const [newUserTier, setNewUserTier] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [newUserCurrency] = useState<CurrencyCode>('USD');

  // Watchlist Modal
  const [showAddReportedModal, setShowAddReportedModal] = useState(false);
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repNatId, setRepNatId] = useState('');
  const [repCity, setRepCity] = useState('Mbare Musika, Harare');
  const [repCategory, setRepCategory] = useState<FraudCategory>('fake_ecocash_sms');
  const [repSeverity] = useState<'critical' | 'high' | 'medium'>('high');
  const [repAmount, setRepAmount] = useState('120');
  const [repEvidence, setRepEvidence] = useState('');

  // Parser Rule Form
  const [showAddParserModal, setShowAddParserModal] = useState(false);
  const [newParserProvider, setNewParserProvider] = useState('');
  const [newParserChannel, setNewParserChannel] = useState<ParserRuleConfig['channelType']>('Mobile Money SMS');
  const [newParserPattern, setNewParserPattern] = useState('');

  // Admin Team Member Modal
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<AdminStaffMember['role']>('Support Engineer');
  const [newStaffPerms, setNewStaffPerms] = useState('User Support Tickets, SMS/CSV Parser Rules, Trader PIN Reset');

  // Campaign Composer State
  const [campTitle, setCampTitle] = useState('');
  const [campBody, setCampBody] = useState('');
  const [campTarget, setCampTarget] = useState<PushCampaignRecord['targetAudience']>('All Registered Traders');
  const [campUrgency, setCampUrgency] = useState<PushCampaignRecord['urgency']>('warning');

  // License Key Studio State
  const [genUserId, setGenUserId] = useState('mrq@mbaretuckshop.co.zw');
  const [genTier, setGenTier] = useState<Exclude<LicenseTier, 'starter'>>('enterprise');
  const [generatedKey, setGeneratedKey] = useState('');

  // Drafts for Replies & Notes
  const [ticketReplyDrafts, setTicketReplyDrafts] = useState<Record<string, string>>({});
  const [reportNoteDrafts, setReportNoteDrafts] = useState<Record<string, string>>({});

  // Security & Rates Inputs
  const [newSecretInput, setNewSecretInput] = useState('');
  const [zigRateInput, setZigRateInput] = useState('26.5');
  const [zarRateInput, setZarRateInput] = useState('18.2');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 4200);
  };

  const loadAllBackOfficeData = useCallback(async () => {
    const [
      sess,
      accs,
      repList,
      tktList,
      bcast,
      payList,
      audList,
      prsList,
      cmpList,
      teamList,
      flagList,
      fx,
      secCode,
    ] = await Promise.all([
      MobileAuthService.getSession(),
      MobileAuthService.getAllAccounts(),
      MobileAdminService.getReportedIndividuals(),
      MobileAdminService.getSupportTickets(),
      MobileAdminService.getSystemBroadcast(),
      MobileAdminService.getSubscriptionPayments(),
      MobileAdminService.getAuditLogs(),
      MobileAdminService.getParserRules(),
      MobileAdminService.getPushCampaigns(),
      MobileAdminService.getAdminTeam(),
      MobileAdminService.getFeatureFlags(),
      MobileExchangeService.getRates(),
      MobileAuthService.getAdminSecretCode(),
    ]);

    setSession(sess);
    setAccounts(accs);
    setReportedList(repList);
    setTickets(tktList);
    setBroadcast(bcast);
    setPayments(payList);
    setAuditLogs(audList);
    setParserRules(prsList);
    setCampaigns(cmpList);
    setAdminTeam(teamList);
    setFeatureFlags(flagList);
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
      loadAllBackOfficeData();
    }, [loadAllBackOfficeData])
  );

  // Computed SaaS Revenue & Platform Telemetry
  const proSubscribers = accounts.filter((a) => a.tier === 'pro').length;
  const entSubscribers = accounts.filter((a) => a.tier === 'enterprise').length;
  const starterUsers = accounts.filter((a) => !a.tier || a.tier === 'starter').length;
  const mrrUsd = proSubscribers * 5 + entSubscribers * 15;
  const arrUsd = mrrUsd * 12;
  const pendingPaymentsCount = payments.filter((p) => p.status === 'pending_verification').length;
  const openTicketsCount = tickets.filter((t) => t.status !== 'resolved').length;
  const blacklistedCount = reportedList.filter((r) => r.status === 'blacklisted').length;
  const degradedParsersCount = parserRules.filter((r) => r.status !== 'active').length;

  // Handlers: Revenue & Licensing
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
      const updatedAccs = await MobileAuthService.adminUpdateAccountTier(
        matchingUser.userId,
        payment.planTier
      );
      setAccounts(updatedAccs);
    }
    const updatedLogs = await MobileAdminService.getAuditLogs();
    setAuditLogs(updatedLogs);
    showToast(`Verified ${payment.invoiceRef} and issued ${signedKey} to ${payment.traderName}.`);
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
    showToast(`Minted ${tierToUse.toUpperCase()} HMAC-SHA256 key for ${uid}.`);
  };

  const handleCopyKey = async () => {
    if (!generatedKey) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(generatedKey);
      showToast('Copied signed activation key to clipboard.');
    } else {
      showToast(`Key ready: ${generatedKey}`);
    }
  };

  // Handlers: Merchant CRM & KYC
  const handleCreateTrader = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Please enter both Merchant Name and Email address.');
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
    await MobileAdminService.appendAuditLog({
      actor: 'System Administrator',
      actorRole: 'Super Admin',
      eventType: 'USER_MODERATION',
      severity: 'info',
      target: `${newUserName} (${newUserEmail})`,
      summary: `Provisioned new ${newUserTier.toUpperCase()} merchant account in ${newUserCity}.`,
    });
    setAuditLogs(await MobileAdminService.getAuditLogs());
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserBiz('');
    setShowAddUserModal(false);
    showToast(`Provisioned merchant account for ${newUserName}.`);
  };

  const handleToggleUserStatus = async (userId: string) => {
    const updated = await MobileAuthService.adminToggleAccountStatus(userId);
    setAccounts(updated);
    const target = updated.find((u) => u.userId === userId);
    if (inspectedUser?.userId === userId) {
      setInspectedUser(target || null);
    }
    if (target) {
      await MobileAdminService.appendAuditLog({
        actor: 'System Administrator',
        actorRole: 'Super Admin',
        eventType: 'USER_MODERATION',
        severity: target.status === 'suspended' ? 'warning' : 'info',
        target: `${target.name} (${target.email})`,
        summary: `Changed merchant account status to ${(target.status || 'active').toUpperCase()}.`,
      });
      setAuditLogs(await MobileAdminService.getAuditLogs());
    }
    showToast('Updated merchant account status.');
  };

  const handleToggleUserKyc = async (userId: string) => {
    const updated = await MobileAuthService.adminToggleKyc(userId);
    setAccounts(updated);
    const target = updated.find((u) => u.userId === userId);
    if (inspectedUser?.userId === userId) {
      setInspectedUser(target || null);
    }
    if (target) {
      await MobileAdminService.appendAuditLog({
        actor: 'System Administrator',
        actorRole: 'Billing & KYC Auditor',
        eventType: 'USER_MODERATION',
        severity: 'info',
        target: `${target.name} (${target.businessName})`,
        summary: `${target.kycVerified ? 'Approved' : 'Revoked'} merchant KYC verification badge.`,
      });
      setAuditLogs(await MobileAdminService.getAuditLogs());
    }
    showToast('Updated merchant KYC verification status.');
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
    showToast(`Updated ${acc.name} subscription tier to ${nextTier.toUpperCase()}.`);
  };

  const handleResetUserPin = async (acc: StoredTraderAccount) => {
    await MobileAdminService.appendAuditLog({
      actor: 'System Administrator',
      actorRole: 'Support Desk',
      eventType: 'SECURITY_ALERT',
      severity: 'info',
      target: `${acc.name} (${acc.email})`,
      summary: 'Dispatched temporary 4-digit Till Master PIN reset override token to merchant.',
    });
    setAuditLogs(await MobileAdminService.getAuditLogs());
    showToast(`Sent 4-Digit Till PIN reset override to ${acc.name} (${acc.phone || acc.email}).`);
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    const updated = await MobileAuthService.adminDeleteAccount(userId);
    setAccounts(updated);
    if (inspectedUser?.userId === userId) setInspectedUser(null);
    showToast(`Removed ${name} from platform merchant directory.`);
  };

  // Handlers: Watchlist
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
      reportedByTrader: 'Admin Trust & Safety Desk',
      reportedByEmail: 'safety@cashflowmate.co.zw',
      amountInvolvedUsd: Number(repAmount) || 0,
      evidenceSummary: repEvidence.trim(),
      adminNotes: 'Logged directly by Admin Trust & Safety Desk.',
    });
    setReportedList(updated);
    setAuditLogs(await MobileAdminService.getAuditLogs());
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
    setAuditLogs(await MobileAdminService.getAuditLogs());
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
    setAuditLogs(await MobileAdminService.getAuditLogs());
    showToast(`Ticket ${ticket.ticketNumber} marked as ${nextStatus.replace('_', ' ').toUpperCase()}.`);
  };

  // Handlers: AI & Parser Rules
  const handleToggleParserRule = async (id: string) => {
    const updated = await MobileAdminService.toggleParserRuleStatus(id);
    setParserRules(updated);
    showToast('Cycled SMS/CSV parser rule operational state.');
  };

  const handleAddParserRule = async () => {
    if (!newParserProvider.trim() || !newParserPattern.trim()) {
      showToast('Enter provider name and sample regex/header pattern.');
      return;
    }
    const updated = await MobileAdminService.addParserRule({
      providerName: newParserProvider.trim(),
      channelType: newParserChannel,
      patternSample: newParserPattern.trim(),
    });
    setParserRules(updated);
    setNewParserProvider('');
    setNewParserPattern('');
    setShowAddParserModal(false);
    showToast(`Deployed new parsing template for ${newParserProvider.trim()}.`);
  };

  // Handlers: Campaigns & Broadcasts
  const handleSendCampaign = async () => {
    if (!campTitle.trim() || !campBody.trim()) {
      showToast('Please enter both Campaign Headline and Message Body.');
      return;
    }
    const targetCount =
      campTarget === 'All Registered Traders'
        ? accounts.length
        : campTarget === 'Starter Tier Upsell'
        ? starterUsers || 1
        : campTarget === 'Pro & Enterprise'
        ? proSubscribers + entSubscribers
        : 2;

    const updated = await MobileAdminService.sendPushCampaign({
      title: campTitle.trim(),
      body: campBody.trim(),
      targetAudience: campTarget,
      urgency: campUrgency,
      deliveredCount: targetCount,
    });
    setCampaigns(updated);
    setBroadcast(await MobileAdminService.getSystemBroadcast());
    setAuditLogs(await MobileAdminService.getAuditLogs());
    setCampTitle('');
    setCampBody('');
    showToast(`Broadcast dispatched to ${targetCount} merchant tills (${campTarget}).`);
  };

  // Handlers: RBAC & Feature Flags
  const handleToggleFeatureFlag = async (key: string) => {
    const updated = await MobileAdminService.toggleFeatureFlag(key);
    setFeatureFlags(updated);
    setAuditLogs(await MobileAdminService.getAuditLogs());
    const flag = updated.find((f) => f.key === key);
    showToast(`${flag?.name}: ${flag?.enabled ? 'ENABLED' : 'DISABLED'}.`);
  };

  const handleAddAdminStaff = async () => {
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      showToast('Enter staff member full name and email.');
      return;
    }
    const updated = await MobileAdminService.addAdminStaffMember({
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      role: newStaffRole,
      permissionsSummary: newStaffPerms.trim(),
    });
    setAdminTeam(updated);
    setAuditLogs(await MobileAdminService.getAuditLogs());
    setNewStaffName('');
    setNewStaffEmail('');
    setShowAddAdminModal(false);
    showToast(`Added ${newStaffName.trim()} to Admin Team (${newStaffRole}).`);
  };

  const handleToggleStaffStatus = async (id: string) => {
    const updated = await MobileAdminService.toggleAdminStaffStatus(id);
    setAdminTeam(updated);
    showToast('Updated Admin team member status.');
  };

  // Handlers: Security Vault & Export
  const handleSaveSecretCode = async () => {
    if (newSecretInput.trim().length < 4) {
      showToast('Admin secret code must be at least 4 characters.');
      return;
    }
    await MobileAuthService.setAdminSecretCode(newSecretInput.trim());
    setAdminSecret(newSecretInput.trim());
    await MobileAdminService.appendAuditLog({
      actor: 'System Administrator',
      actorRole: 'Super Admin',
      eventType: 'ADMIN_AUTH',
      severity: 'critical',
      target: 'Admin 2FA Secret Access Code',
      summary: `Rotated Desktop Admin Login Secret Code to "${newSecretInput.trim()}".`,
    });
    setAuditLogs(await MobileAdminService.getAuditLogs());
    showToast(`Rotated Admin Login Secret Code to "${newSecretInput.trim()}".`);
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
    showToast(`Updated platform exchange rates (1 USD = ${zig} ZiG | ${zar} ZAR).`);
  };

  const handleExportGovernanceSnapshot = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      saasMetrics: {
        mrrUsd,
        arrUsd,
        proSubscribers,
        entSubscribers,
        totalMerchants: accounts.length,
      },
      merchants: accounts,
      subscriptionPayments: payments,
      reportedIndividualsWatchlist: reportedList,
      supportTickets: tickets,
      parserRules,
      pushCampaigns: campaigns,
      adminTeamRbac: adminTeam,
      featureFlags,
      immutableAuditLogs: auditLogs,
    };
    const jsonString = JSON.stringify(payload, null, 2);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashflow-mate-admin-backoffice-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded full Admin Back-Office JSON compliance archive.');
    } else {
      showToast('Prepared Admin Back-Office archive.');
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

  // Filtered Collections
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

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditFilter !== 'ALL' && log.eventType !== auditFilter) return false;
    return true;
  });

  // Dedicated Admin-Only Back-Office Pages
  const adminPages: {
    id: AdminPageId;
    label: string;
    sub: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'revenue_billing',
      label: 'SaaS Revenue & Billing',
      sub: `$${mrrUsd}/mo MRR & License Keys`,
      icon: 'card-outline',
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
      badgeColor: '#10B981',
    },
    {
      id: 'merchant_crm',
      label: 'Merchant CRM & KYC',
      sub: `${accounts.length} Registered Businesses`,
      icon: 'business-outline',
      badge: accounts.length,
    },
    {
      id: 'fraud_watchlist',
      label: 'Fraud & Scammer Watchlist',
      sub: 'Reported Individuals & Defaulters',
      icon: 'skull-outline',
      badge: reportedList.length,
      badgeColor: '#EF4444',
    },
    {
      id: 'support_helpdesk',
      label: 'Support & Bug Helpdesk',
      sub: 'User Problem Tickets & Replies',
      icon: 'construct-outline',
      badge: openTicketsCount,
      badgeColor: '#F59E0B',
    },
    {
      id: 'ai_parser_ops',
      label: 'AI & Parser Engine Ops',
      sub: 'Gemini Cost & SMS/CSV Templates',
      icon: 'hardware-chip-outline',
      badge: degradedParsersCount > 0 ? degradedParsersCount : undefined,
      badgeColor: '#F59E0B',
    },
    {
      id: 'campaigns_broadcasts',
      label: 'Push Campaigns & Alerts',
      sub: 'Regional & Tier Announcements',
      icon: 'megaphone-outline',
    },
    {
      id: 'rbac_feature_flags',
      label: 'Admin Team & Feature Flags',
      sub: 'Staff RBAC & Module Switches',
      icon: 'options-outline',
    },
    {
      id: 'audit_security',
      label: 'Audit Log & Security Vault',
      sub: `${auditLogs.length} Immutable Events & 2FA`,
      icon: 'shield-checkmark-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Admin Back-Office Bar */}
      <View style={[styles.topHeader, { backgroundColor: '#071714' }]}>
        <View style={styles.topHeaderLeft}>
          <View style={[styles.adminShieldBadge, { backgroundColor: activeBrandColor }]}>
            <Ionicons name="shield-half" size={22} color="#34D399" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.topHeaderTitle}>CASHFLOW MATE</Text>
              <View style={styles.hqPill}>
                <Text style={styles.hqPillText}>SAAS ADMIN BACK-OFFICE</Text>
              </View>
            </View>
            <Text style={styles.topHeaderSub}>
              Platform Operations, SaaS Revenue, Fraud Watchlist & RBAC Governance • Operator:{' '}
              {session?.name || 'System Administrator'}
            </Text>
          </View>
        </View>

        <View style={styles.topHeaderRight}>
          <View style={styles.secretIndicator}>
            <Ionicons name="finger-print-outline" size={14} color="#34D399" />
            <Text style={styles.secretIndicatorText}>2FA CODE: {adminSecret}</Text>
          </View>

          <Pressable style={styles.signOutBtn} onPress={handleAdminSignOut}>
            <Ionicons name="log-out-outline" size={16} color="#FCA5A5" />
            <Text style={styles.signOutBtnText}>Sign Out Admin</Text>
          </Pressable>
        </View>
      </View>

      {/* Live Feedback Banner */}
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
        {/* Left Dedicated Admin Navigation Rail */}
        <View style={[styles.sideRail, !isDesktop && styles.sideRailMobile]}>
          <Text style={styles.railSectionTitle}>ADMIN BACK-OFFICE PAGES</Text>
          <ScrollView
            horizontal={!isDesktop}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={!isDesktop ? { gap: 8 } : { gap: 5 }}
          >
            {adminPages.map((item) => {
              const active = activePage === item.id;
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
                  onPress={() => setActivePage(item.id)}
                >
                  <View
                    style={[
                      styles.railIconBox,
                      active && { backgroundColor: '#34D399' },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
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
                <Text style={styles.railFooterTitle}>ADMIN PORTAL ISOLATED</Text>
              </View>
              <Text style={styles.railFooterSub}>
                User cashbox screens are disabled for Admin roles. Managing {accounts.length}{' '}
                merchants & ${arrUsd}/yr ARR.
              </Text>
            </View>
          )}
        </View>

        {/* Right Admin Page Canvas */}
        <ScrollView
          style={styles.canvasScroll}
          contentContainerStyle={styles.canvasContent}
          showsVerticalScrollIndicator={false}
        >
          {/* =========================================================
              PAGE 1: PLATFORM SAAS REVENUE, BILLING & SUBSCRIPTIONS
             ========================================================= */}
          {activePage === 'revenue_billing' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    Platform SaaS Revenue, Billing & License Provisioning
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Track CashFlow Mate company subscription revenue (MRR/ARR), approve merchant
                    EcoCash/InnBucks upgrade payments, and mint cryptographic activation keys
                  </Text>
                </View>
                <Pressable
                  style={[styles.primaryCtaBtn, { backgroundColor: activeBrandColor }]}
                  onPress={handleExportGovernanceSnapshot}
                >
                  <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryCtaBtnText}>Export SaaS Revenue Report</Text>
                </Pressable>
              </View>

              {/* 4 SaaS Company Revenue KPIs */}
              <View style={[styles.kpiGrid, !isDesktop && { flexDirection: 'column' }]}>
                <View style={[styles.kpiCard, { borderTopColor: '#10B981', borderTopWidth: 4 }]}>
                  <View style={styles.kpiTopRow}>
                    <Text style={styles.kpiLabel}>MONTHLY RECURRING REV (MRR)</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: '#DCFCE7' }]}>
                      <Ionicons name="cash-outline" size={18} color="#15803D" />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, { color: '#065F46' }]}>${mrrUsd}.00 / mo</Text>
                  <Text style={styles.kpiMeta}>
                    Projected ARR: ${arrUsd.toLocaleString()}.00 / yr
                  </Text>
                </View>

                <View style={[styles.kpiCard, { borderTopColor: '#2563EB', borderTopWidth: 4 }]}>
                  <View style={styles.kpiTopRow}>
                    <Text style={styles.kpiLabel}>ENTERPRISE SYNDICATES ($15)</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: '#DBEAFE' }]}>
                      <Ionicons name="diamond-outline" size={18} color="#1D4ED8" />
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>{entSubscribers} Merchants</Text>
                  <Text style={styles.kpiMeta}>
                    ${entSubscribers * 15}/mo • Multi-stall & priority support
                  </Text>
                </View>

                <View style={[styles.kpiCard, { borderTopColor: '#7C3AED', borderTopWidth: 4 }]}>
                  <View style={styles.kpiTopRow}>
                    <Text style={styles.kpiLabel}>PRO TRADERS ($5/MO)</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: '#EDE9FE' }]}>
                      <Ionicons name="star-outline" size={18} color="#6D28D9" />
                    </View>
                  </View>
                  <Text style={styles.kpiValue}>{proSubscribers} Merchants</Text>
                  <Text style={styles.kpiMeta}>
                    ${proSubscribers * 5}/mo • {starterUsers} Starter free tier users
                  </Text>
                </View>

                <View style={[styles.kpiCard, { borderTopColor: '#D97706', borderTopWidth: 4 }]}>
                  <View style={styles.kpiTopRow}>
                    <Text style={styles.kpiLabel}>PENDING VERIFICATION</Text>
                    <View style={[styles.kpiIconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="time-outline" size={18} color="#B45309" />
                    </View>
                  </View>
                  <Text style={[styles.kpiValue, { color: '#B45309' }]}>
                    {pendingPaymentsCount} Payments
                  </Text>
                  <Text style={styles.kpiMeta}>
                    Awaiting EcoCash/InnBucks ref approval
                  </Text>
                </View>
              </View>

              {/* Subscription Payment Ledger Table */}
              <View style={[styles.panelCard, { marginBottom: 18 }]}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelTitle}>
                    Merchant Subscription Payments & License Issuance Ledger
                  </Text>
                  <M3Badge label={`${payments.length} INVOICES`} variant="primary" />
                </View>

                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 1 }]}>INVOICE REF</Text>
                  <Text style={[styles.th, { flex: 1.5 }]}>MERCHANT & CITY</Text>
                  <Text style={[styles.th, { flex: 1 }]}>PLAN & METHOD</Text>
                  <Text style={[styles.th, { flex: 0.7 }]}>AMOUNT</Text>
                  <Text style={[styles.th, { flex: 1.5 }]}>ISSUED LICENSE KEY</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>STATUS / ACTION</Text>
                </View>

                {payments.map((pay) => (
                  <View key={pay.id} style={styles.tableRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketCode}>{pay.invoiceRef}</Text>
                      <Text style={styles.rowMicro}>{pay.paidAt}</Text>
                    </View>
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.rowTitle}>{pay.traderName}</Text>
                      <Text style={styles.rowSub}>
                        {pay.businessName} • {pay.city}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <M3Badge
                        label={pay.planTier.toUpperCase()}
                        variant={pay.planTier === 'enterprise' ? 'mint' : 'primary'}
                      />
                      <Text style={[styles.rowMicro, { marginTop: 3 }]}>{pay.paymentMethod}</Text>
                    </View>
                    <Text
                      style={[
                        styles.cellMono,
                        { flex: 0.7, fontWeight: '900', color: '#065F46' },
                      ]}
                    >
                      ${pay.amountUsd.toFixed(2)}
                    </Text>
                    <View style={{ flex: 1.5 }}>
                      <Text
                        selectable
                        style={[
                          styles.cellMono,
                          {
                            fontSize: 11,
                            color:
                              pay.status === 'pending_verification' ? '#D97706' : '#0F172A',
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {pay.licenseKeyIssued}
                      </Text>
                      <Text style={styles.rowMicro}>Expires {pay.expiresAt}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      {pay.status === 'pending_verification' ? (
                        <Pressable
                          style={[
                            styles.smallActionBtn,
                            { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
                          ]}
                          onPress={() => handleApprovePayment(pay)}
                        >
                          <Ionicons name="checkmark-circle" size={14} color="#166534" />
                          <Text style={[styles.smallActionText, { color: '#166534' }]}>
                            Approve & Mint Key
                          </Text>
                        </Pressable>
                      ) : (
                        <M3Badge label="PAID & ACTIVE" variant="inflow" />
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Embedded HMAC-SHA256 License Key Studio */}
              <View style={[styles.twoColRow, !isDesktop && { flexDirection: 'column' }]}>
                <View style={[styles.panelCard, { flex: 1 }]}>
                  <Text style={styles.panelTitle}>
                    HMAC-SHA256 Cryptographic License Key Generator
                  </Text>
                  <Text style={styles.panelHelper}>
                    Select any registered merchant or enter an email to mint an offline activation
                    key (`CFM-PRO-...` / `CFM-ENT-...`).
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
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
                          {acc.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Target Merchant Email / Identifier</Text>
                  <TextInput
                    style={styles.input}
                    value={genUserId}
                    onChangeText={setGenUserId}
                    autoCapitalize="none"
                  />

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
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
                          {t === 'pro' ? 'Pro Plan ($5/mo)' : 'Enterprise Plan ($15/mo)'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={[styles.panelCard, { flex: 1, backgroundColor: '#071714' }]}>
                  <M3Badge label="SIGNED ACTIVATION TOKEN" variant="mint" />
                  <Text style={[styles.panelTitle, { color: '#FFFFFF', marginTop: 10 }]}>
                    Ready for Merchant Activation
                  </Text>
                  <Text style={[styles.panelHelper, { color: '#94A3B8' }]}>
                    Bound to <Text style={{ color: '#34D399', fontWeight: '700' }}>{genUserId}</Text>{' '}
                    ({genTier.toUpperCase()})
                  </Text>
                  <View style={styles.generatedKeyBox}>
                    <Text selectable style={styles.generatedKeyText}>
                      {generatedKey}
                    </Text>
                  </View>
                  <Pressable style={styles.copyKeyBtn} onPress={handleCopyKey}>
                    <Ionicons name="copy-outline" size={18} color="#071714" />
                    <Text style={styles.copyKeyBtnText}>Copy Activation Key</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {/* =========================================================
              PAGE 2: MERCHANT CRM & KYC VERIFICATION
             ========================================================= */}
          {activePage === 'merchant_crm' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    Merchant CRM, KYC Verification & Account Moderation ({accounts.length})
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Verify merchant KYC documents, reset locked 4-digit counter PINs, upgrade
                    subscription plans, or suspend abusive accounts
                  </Text>
                </View>
                <Pressable
                  style={[styles.primaryCtaBtn, { backgroundColor: activeBrandColor }]}
                  onPress={() => setShowAddUserModal(true)}
                >
                  <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryCtaBtnText}>+ Provision Merchant Account</Text>
                </Pressable>
              </View>

              <View style={styles.filterToolbar}>
                <View style={styles.searchBox}>
                  <Ionicons name="search-outline" size={18} color="#64748B" />
                  <TextInput
                    style={styles.searchInput}
                    value={userSearch}
                    onChangeText={setUserSearch}
                    placeholder="Search merchant name, stall, city hub, phone, or email..."
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

              <View style={styles.panelCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 1.5 }]}>MERCHANT & CONTACT</Text>
                  <Text style={[styles.th, { flex: 1.6 }]}>BUSINESS & CITY HUB</Text>
                  <Text style={[styles.th, { flex: 0.9 }]}>PLAN & KYC</Text>
                  <Text style={[styles.th, { flex: 0.8 }]}>STATUS</Text>
                  <Text style={[styles.th, { flex: 1.8, textAlign: 'right' }]}>
                    CRM & MODERATION ACTIONS
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
                        <Text style={styles.rowMicro}>Last active: {acc.lastActive || 'Today'}</Text>
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
                          flex: 1.8,
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
                          onPress={() => handleResetUserPin(acc)}
                        >
                          <Ionicons name="keypad-outline" size={14} color="#2563EB" />
                          <Text style={[styles.smallActionText, { color: '#2563EB' }]}>
                            Reset PIN
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
              PAGE 3: TRUST, SAFETY & FRAUD WATCHLIST (REPORTED INDIVIDUALS)
             ========================================================= */}
          {activePage === 'fraud_watchlist' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    Trust, Safety & Fraud Watchlist ({reportedList.length} Reported Cases)
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Investigate individuals reported by merchants for forged EcoCash/InnBucks SMS,
                    counterfeit USD notes, or runaway credit default
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
                              {rep.reportsCount} MERCHANT REPORT{rep.reportsCount > 1 ? 'S' : ''}
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
                            {rep.reportedByTrader}
                          </Text>
                        </View>

                        <View style={styles.evidenceBox}>
                          <Text style={styles.evidenceLabel}>MERCHANT INCIDENT EVIDENCE:</Text>
                          <Text style={styles.evidenceText}>{rep.evidenceSummary}</Text>
                          {rep.adminNotes && (
                            <Text style={styles.adminNoteDisplay}>
                              Trust & Safety Note: {rep.adminNotes}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={{ alignItems: isDesktop ? 'flex-end' : 'flex-start' }}>
                        <Text style={styles.kpiLabel}>EXPOSURE AMOUNT</Text>
                        <Text style={[styles.kpiValue, { color: '#DC2626', fontSize: 22 }]}>
                          ${rep.amountInvolvedUsd.toFixed(2)}
                        </Text>
                        <Text style={styles.rowMicro}>Reported {rep.createdAt}</Text>
                      </View>
                    </View>

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
                        placeholder="Add Trust & Safety verification note..."
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
                            Investigating
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
                            Clear
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
              PAGE 4: USER PROBLEMS & SUPPORT HELPDESK
             ========================================================= */}
          {activePage === 'support_helpdesk' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    Support Helpdesk & User Problem Tickets ({tickets.length})
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Triage technical bugs, bank CSV import issues, SMS parser requests, and PIN
                    recovery tickets submitted by users
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
                      Merchant:{' '}
                      <Text style={{ fontWeight: '800', color: '#0F172A' }}>{tkt.userName}</Text> (
                      {tkt.userEmail}) • {tkt.businessName} • {tkt.city} • {tkt.createdAt}
                    </Text>

                    <View style={styles.evidenceBox}>
                      <Text style={styles.evidenceLabel}>USER PROBLEM REPORT:</Text>
                      <Text style={styles.evidenceText}>{tkt.description}</Text>
                      {tkt.adminReply && (
                        <Text style={styles.adminNoteDisplay}>
                          Official Support Reply: {tkt.adminReply}
                        </Text>
                      )}
                    </View>

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
                        placeholder="Type official support response or resolution instructions..."
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
                            Resolve Ticket
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* =========================================================
              PAGE 5: AI & PARSER ENGINE OPERATIONS MONITOR
             ========================================================= */}
          {activePage === 'ai_parser_ops' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    AI & Parser Engine Operations (Gemini AI + SMS/CSV Rules)
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Monitor Gemini AI API token consumption across merchants and maintain live
                    EcoCash, InnBucks, and Zimbabwean Bank CSV parsing templates
                  </Text>
                </View>
                <Pressable
                  style={[styles.primaryCtaBtn, { backgroundColor: activeBrandColor }]}
                  onPress={() => setShowAddParserModal(true)}
                >
                  <Ionicons name="code-slash-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryCtaBtnText}>+ Add Bank / SMS Parser Rule</Text>
                </Pressable>
              </View>

              {/* AI & Parser Telemetry Cards */}
              <View style={[styles.kpiGrid, !isDesktop && { flexDirection: 'column' }]}>
                <View style={[styles.kpiCard, { borderTopColor: '#0C3E35', borderTopWidth: 4 }]}>
                  <Text style={styles.kpiLabel}>GEMINI 2.5 FLASH API CALLS (30D)</Text>
                  <Text style={[styles.kpiValue, { marginTop: 6 }]}>14,280 reqs</Text>
                  <Text style={styles.kpiMeta}>Avg Latency: 640ms • 99.92% Uptime</Text>
                </View>

                <View style={[styles.kpiCard, { borderTopColor: '#2563EB', borderTopWidth: 4 }]}>
                  <Text style={styles.kpiLabel}>MONTHLY AI TOKEN COST</Text>
                  <Text style={[styles.kpiValue, { color: '#1D4ED8', marginTop: 6 }]}>$4.18 USD</Text>
                  <Text style={styles.kpiMeta}>Grounded deterministic prompts active</Text>
                </View>

                <View style={[styles.kpiCard, { borderTopColor: '#10B981', borderTopWidth: 4 }]}>
                  <Text style={styles.kpiLabel}>SMS & CSV PARSED (30D)</Text>
                  <Text style={[styles.kpiValue, { color: '#065F46', marginTop: 6 }]}>9,685 docs</Text>
                  <Text style={styles.kpiMeta}>EcoCash, InnBucks, CBZ, Steward, Mukuru</Text>
                </View>

                <View style={[styles.kpiCard, { borderTopColor: '#D97706', borderTopWidth: 4 }]}>
                  <Text style={styles.kpiLabel}>UNRECOGNIZED SMS FORMATS</Text>
                  <Text style={[styles.kpiValue, { color: '#B45309', marginTop: 6 }]}>
                    {degradedParsersCount} Degraded
                  </Text>
                  <Text style={styles.kpiMeta}>InnBucks ZAR remittance regex flagged</Text>
                </View>
              </View>

              {/* Parser Rules Engine Table */}
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelTitle}>
                    Zimbabwe Mobile Money & Bank CSV Parser Templates
                  </Text>
                  <M3Badge label={`${parserRules.length} ACTIVE PROVIDERS`} variant="mint" />
                </View>

                {parserRules.map((rule) => (
                  <View key={rule.id} style={styles.tableRow}>
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.rowTitle}>{rule.providerName}</Text>
                      <Text style={styles.rowSub}>{rule.channelType}</Text>
                      <Text style={[styles.cellMono, { fontSize: 11, color: '#64748B', marginTop: 4 }]}>
                        Pattern: {rule.patternSample}
                      </Text>
                    </View>

                    <View style={{ flex: 0.9 }}>
                      <Text style={[styles.cellMono, { fontWeight: '900', color: '#0F172A' }]}>
                        {rule.successRatePct}% accuracy
                      </Text>
                      <Text style={styles.rowMicro}>
                        {rule.parsedCount30d} ok • {rule.failedCount30d} failed
                      </Text>
                    </View>

                    <View style={{ flex: 0.7 }}>
                      <M3Badge
                        label={rule.status.toUpperCase()}
                        variant={
                          rule.status === 'active'
                            ? 'inflow'
                            : rule.status === 'degraded'
                            ? 'amber'
                            : 'neutral'
                        }
                      />
                    </View>

                    <View style={{ flex: 0.8, alignItems: 'flex-end' }}>
                      <Pressable
                        style={styles.smallActionBtn}
                        onPress={() => handleToggleParserRule(rule.id)}
                      >
                        <Ionicons name="sync-outline" size={14} color="#0F172A" />
                        <Text style={styles.smallActionText}>Cycle State</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* =========================================================
              PAGE 6: ANNOUNCEMENTS, PUSH CAMPAIGNS & RELEASE NOTES
             ========================================================= */}
          {activePage === 'campaigns_broadcasts' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    Targeted Push Campaigns, System Alerts & Release Notes
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Broadcast RBZ/ZIMRA notices, scam warnings, or new app version release notes to
                    all merchants, specific cities, or subscription tiers
                  </Text>
                </View>
              </View>

              <View style={[styles.twoColRow, !isDesktop && { flexDirection: 'column' }]}>
                {/* Left: Campaign Composer */}
                <View style={[styles.panelCard, { flex: 1 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>Dispatch New Push Campaign</Text>
                    <M3Badge label="INSTANT DELIVERY" variant="mint" />
                  </View>

                  <Text style={styles.inputLabel}>Target Merchant Segment</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {(
                      [
                        'All Registered Traders',
                        'Harare Hub Only',
                        'Bulawayo Hub Only',
                        'Starter Tier Upsell',
                        'Pro & Enterprise',
                      ] as const
                    ).map((seg) => (
                      <Pressable
                        key={seg}
                        style={[
                          styles.miniChoicePill,
                          campTarget === seg && {
                            backgroundColor: '#0C3E35',
                            borderColor: '#0C3E35',
                          },
                        ]}
                        onPress={() => setCampTarget(seg)}
                      >
                        <Text
                          style={[
                            styles.miniChoiceText,
                            campTarget === seg && { color: '#FFFFFF' },
                          ]}
                        >
                          {seg}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Campaign Headline / Alert Title</Text>
                  <TextInput
                    style={styles.input}
                    value={campTitle}
                    onChangeText={setCampTitle}
                    placeholder="e.g., Release v1.3: Automated Steward Bank CSV Support"
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>
                    Message Body / Release Notes
                  </Text>
                  <TextInput
                    style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                    value={campBody}
                    onChangeText={setCampBody}
                    multiline
                    placeholder="Write announcement message to display on merchant tills..."
                    placeholderTextColor="#94A3B8"
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Urgency Level</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['info', 'warning', 'critical'] as const).map((u) => (
                      <Pressable
                        key={u}
                        style={[
                          styles.miniChoicePill,
                          campUrgency === u && {
                            backgroundColor: '#0C3E35',
                            borderColor: '#0C3E35',
                          },
                        ]}
                        onPress={() => setCampUrgency(u)}
                      >
                        <Text
                          style={[
                            styles.miniChoiceText,
                            campUrgency === u && { color: '#FFFFFF' },
                          ]}
                        >
                          {u.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    style={[
                      styles.primaryCtaBtn,
                      { backgroundColor: activeBrandColor, marginTop: 16, justifyContent: 'center' },
                    ]}
                    onPress={handleSendCampaign}
                  >
                    <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryCtaBtnText}>
                      Send Broadcast to {campTarget}
                    </Text>
                  </Pressable>
                </View>

                {/* Right: Sent Campaigns History */}
                <View style={[styles.panelCard, { flex: 1.15 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>Dispatched Campaign History</Text>
                    <M3Badge label={`${campaigns.length} SENT`} variant="primary" />
                  </View>

                  {campaigns.map((cmp) => (
                    <View key={cmp.id} style={styles.triageItem}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text style={styles.rowTitle}>{cmp.title}</Text>
                          <M3Badge
                            label={cmp.urgency.toUpperCase()}
                            variant={
                              cmp.urgency === 'critical'
                                ? 'outflow'
                                : cmp.urgency === 'warning'
                                ? 'amber'
                                : 'inflow'
                            }
                          />
                        </View>
                        <Text style={styles.rowSub}>
                          Audience: {cmp.targetAudience} • Delivered to {cmp.deliveredCount} tills •{' '}
                          {cmp.sentAt}
                        </Text>
                        <Text style={styles.triageSnippet}>{cmp.body}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* =========================================================
              PAGE 7: ADMIN TEAM ROLES (RBAC) & FEATURE FLAGS
             ========================================================= */}
          {activePage === 'rbac_feature_flags' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    Admin Team Roles (RBAC) & Global Platform Feature Flags
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Manage back-office staff permissions (Super Admin, Trust & Safety, Support,
                    Billing) and toggle live platform feature switches
                  </Text>
                </View>
                <Pressable
                  style={[styles.primaryCtaBtn, { backgroundColor: activeBrandColor }]}
                  onPress={() => setShowAddAdminModal(true)}
                >
                  <Ionicons name="shield-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryCtaBtnText}>+ Invite Admin Staff Member</Text>
                </Pressable>
              </View>

              <View style={[styles.twoColRow, !isDesktop && { flexDirection: 'column' }]}>
                {/* Left: Global Feature Flags */}
                <View style={[styles.panelCard, { flex: 1 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>Global Platform Feature Flags</Text>
                    <M3Badge label="RUNTIME SWITCHES" variant="mint" />
                  </View>

                  {featureFlags.map((flag) => (
                    <View key={flag.key} style={styles.tableRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.rowTitle}>{flag.name}</Text>
                          <M3Badge label={flag.scope} variant="neutral" />
                        </View>
                        <Text style={styles.rowSub}>{flag.description}</Text>
                      </View>
                      <Pressable
                        style={[
                          styles.smallActionBtn,
                          flag.enabled
                            ? { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }
                            : { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
                        ]}
                        onPress={() => handleToggleFeatureFlag(flag.key)}
                      >
                        <Text
                          style={[
                            styles.smallActionText,
                            { color: flag.enabled ? '#166534' : '#475569' },
                          ]}
                        >
                          {flag.enabled ? 'ENABLED' : 'DISABLED'}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>

                {/* Right: Admin Staff RBAC Roster */}
                <View style={[styles.panelCard, { flex: 1 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>Admin Team Staff & RBAC Roles</Text>
                    <M3Badge label={`${adminTeam.length} OPERATORS`} variant="primary" />
                  </View>

                  {adminTeam.map((member) => (
                    <View key={member.id} style={styles.tableRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.rowTitle}>{member.name}</Text>
                          <M3Badge
                            label={member.role.toUpperCase()}
                            variant={member.role === 'Super Admin' ? 'mint' : 'primary'}
                          />
                        </View>
                        <Text style={styles.rowSub}>
                          {member.email} • Last login: {member.lastLogin}
                        </Text>
                        <Text style={styles.rowMicro}>{member.permissionsSummary}</Text>
                      </View>

                      {member.role !== 'Super Admin' && (
                        <Pressable
                          style={styles.smallActionBtn}
                          onPress={() => handleToggleStaffStatus(member.id)}
                        >
                          <Text style={styles.smallActionText}>
                            {member.status === 'active' ? 'Suspend' : 'Activate'}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* =========================================================
              PAGE 8: IMMUTABLE ADMIN AUDIT LOG & SECURITY VAULT
             ========================================================= */}
          {activePage === 'audit_security' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.pageTitle}>
                    Immutable Admin Audit Log & Platform Security Vault
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    Inspect every administrative action, secret code rotation, KYC verification,
                    and blacklist event across the platform
                  </Text>
                </View>
                <Pressable
                  style={[styles.primaryCtaBtn, { backgroundColor: activeBrandColor }]}
                  onPress={handleExportGovernanceSnapshot}
                >
                  <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryCtaBtnText}>Export Full Compliance JSON</Text>
                </Pressable>
              </View>

              {/* Security & FX Controls Row */}
              <View style={[styles.twoColRow, !isDesktop && { flexDirection: 'column' }]}>
                <View style={[styles.panelCard, { flex: 1 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>Admin 2-Factor Login Secret Code</Text>
                    <M3Badge label="ROOT ACCESS GATE" variant="mint" />
                  </View>
                  <Text style={styles.panelHelper}>
                    Required alongside username <Text style={{ fontWeight: '800' }}>admin</Text> and
                    password <Text style={{ fontWeight: '800' }}>admin</Text> to enter this portal.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={newSecretInput}
                      onChangeText={setNewSecretInput}
                      autoCapitalize="characters"
                    />
                    <Pressable
                      style={[styles.primaryCtaBtn, { backgroundColor: activeBrandColor }]}
                      onPress={handleSaveSecretCode}
                    >
                      <Text style={styles.primaryCtaBtnText}>Rotate Code</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.panelCard, { flex: 1 }]}>
                  <View style={styles.panelHeaderRow}>
                    <Text style={styles.panelTitle}>National Reference Exchange Rates</Text>
                    <M3Badge label="USD BASE" variant="primary" />
                  </View>
                  <Text style={styles.panelHelper}>
                    Default multi-currency conversion rates distributed to all merchant tills.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        style={styles.input}
                        value={zigRateInput}
                        onChangeText={setZigRateInput}
                        placeholder="ZiG"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        style={styles.input}
                        value={zarRateInput}
                        onChangeText={setZarRateInput}
                        placeholder="ZAR"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <Pressable
                      style={[styles.primaryCtaBtn, { backgroundColor: activeBrandColor }]}
                      onPress={handleSaveRates}
                    >
                      <Text style={styles.primaryCtaBtnText}>Save FX</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Immutable Audit Log Stream */}
              <View style={styles.panelCard}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelTitle}>
                    Chronological Governance & Security Event Log ({filteredAuditLogs.length})
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {(
                      [
                        'ALL',
                        'ADMIN_AUTH',
                        'WATCHLIST_BLACKLIST',
                        'USER_MODERATION',
                        'LICENSE_MINT',
                        'FEATURE_FLAG',
                      ] as const
                    ).map((ev) => (
                      <Pressable
                        key={ev}
                        style={[
                          styles.miniChoicePill,
                          auditFilter === ev && {
                            backgroundColor: '#0C3E35',
                            borderColor: '#0C3E35',
                          },
                        ]}
                        onPress={() => setAuditFilter(ev)}
                      >
                        <Text
                          style={[
                            styles.miniChoiceText,
                            auditFilter === ev && { color: '#FFFFFF' },
                          ]}
                        >
                          {ev.replace('_', ' ')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {filteredAuditLogs.map((log) => (
                  <View key={log.id} style={styles.tableRow}>
                    <View style={{ flex: 0.9 }}>
                      <Text style={styles.cellMono}>{log.timestamp}</Text>
                      <Text style={styles.rowMicro}>{log.ipOrDevice}</Text>
                    </View>

                    <View style={{ flex: 0.9 }}>
                      <Text style={styles.rowTitle}>{log.actor}</Text>
                      <Text style={styles.rowSub}>{log.actorRole}</Text>
                    </View>

                    <View style={{ flex: 0.8 }}>
                      <M3Badge
                        label={log.eventType.replace('_', ' ')}
                        variant={
                          log.severity === 'critical'
                            ? 'outflow'
                            : log.severity === 'warning'
                            ? 'amber'
                            : 'primary'
                        }
                      />
                    </View>

                    <View style={{ flex: 2 }}>
                      <Text style={styles.rowTitle}>Target: {log.target}</Text>
                      <Text style={styles.rowSub}>{log.summary}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* =========================================================
          MODAL 1: INSPECT MERCHANT ACCOUNT
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
                    <Text style={styles.kpiLabel}>SUBSCRIPTION TIER</Text>
                    <Text style={styles.inspectStatVal}>
                      {(inspectedUser.tier || 'starter').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.inspectStatBox}>
                    <Text style={styles.kpiLabel}>KYC VERIFICATION</Text>
                    <Text
                      style={[
                        styles.inspectStatVal,
                        { color: inspectedUser.kycVerified ? '#059669' : '#D97706' },
                      ]}
                    >
                      {inspectedUser.kycVerified ? 'VERIFIED' : 'PENDING'}
                    </Text>
                  </View>
                  <View style={styles.inspectStatBox}>
                    <Text style={styles.kpiLabel}>ACCOUNT STATUS</Text>
                    <Text style={styles.inspectStatVal}>
                      {(inspectedUser.status || 'active').toUpperCase()}
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
                    onPress={() => handleResetUserPin(inspectedUser)}
                  >
                    <Ionicons name="keypad-outline" size={15} color="#2563EB" />
                    <Text style={[styles.smallActionText, { color: '#2563EB' }]}>
                      Send PIN Reset Override
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.smallActionBtn}
                    onPress={() => {
                      setGenUserId(inspectedUser.email);
                      setInspectedUser(null);
                      setActivePage('revenue_billing');
                      handleGenerateKey(inspectedUser.email, 'enterprise');
                    }}
                  >
                    <Ionicons name="key-outline" size={15} color="#0F172A" />
                    <Text style={styles.smallActionText}>Mint License Key</Text>
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
          MODAL 2: PROVISION NEW MERCHANT ACCOUNT
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
              <Text style={styles.modalTitle}>Provision New Merchant Account</Text>
              <Pressable onPress={() => setShowAddUserModal(false)}>
                <Ionicons name="close-circle" size={26} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Merchant Full Name</Text>
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
              <Text style={styles.primaryCtaBtnText}>Create Merchant Account</Text>
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
              placeholder="Describe what happened, invoice/SMS references, and merchant reports..."
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

      {/* =========================================================
          MODAL 4: ADD BANK / SMS PARSER RULE
         ========================================================= */}
      <Modal
        visible={showAddParserModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddParserModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deploy New SMS / Bank CSV Parser Rule</Text>
              <Pressable onPress={() => setShowAddParserModal(false)}>
                <Ionicons name="close-circle" size={26} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Financial Provider / Bank Name</Text>
            <TextInput
              style={styles.input}
              value={newParserProvider}
              onChangeText={setNewParserProvider}
              placeholder="e.g., Stanbic Bank Zimbabwe USD CSV"
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Channel Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(['Mobile Money SMS', 'Bank CSV Statement', 'Remittance Receipt'] as const).map(
                (ch) => (
                  <Pressable
                    key={ch}
                    style={[
                      styles.miniChoicePill,
                      newParserChannel === ch && {
                        backgroundColor: '#0C3E35',
                        borderColor: '#0C3E35',
                      },
                    ]}
                    onPress={() => setNewParserChannel(ch)}
                  >
                    <Text
                      style={[
                        styles.miniChoiceText,
                        newParserChannel === ch && { color: '#FFFFFF' },
                      ]}
                    >
                      {ch}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>
              Regex Pattern or CSV Column Signature
            </Text>
            <TextInput
              style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
              value={newParserPattern}
              onChangeText={setNewParserPattern}
              multiline
              placeholder="e.g., TranDate,ValueDate,Reference,DebitAmount,CreditAmount"
              placeholderTextColor="#94A3B8"
            />

            <Pressable
              style={[
                styles.primaryCtaBtn,
                { backgroundColor: activeBrandColor, marginTop: 16, justifyContent: 'center' },
              ]}
              onPress={handleAddParserRule}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryCtaBtnText}>Deploy Parser Template</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* =========================================================
          MODAL 5: INVITE ADMIN STAFF MEMBER (RBAC)
         ========================================================= */}
      <Modal
        visible={showAddAdminModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddAdminModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Admin Back-Office Staff Member</Text>
              <Pressable onPress={() => setShowAddAdminModal(false)}>
                <Ionicons name="close-circle" size={26} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Staff Full Name</Text>
            <TextInput
              style={styles.input}
              value={newStaffName}
              onChangeText={setNewStaffName}
              placeholder="e.g., Nyasha Moyo"
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Corporate Email</Text>
            <TextInput
              style={styles.input}
              value={newStaffEmail}
              onChangeText={setNewStaffEmail}
              placeholder="e.g., nyasha@cashflowmate.co.zw"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Assigned RBAC Role</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(
                [
                  'Support Engineer',
                  'Trust & Safety Officer',
                  'Billing & KYC Auditor',
                  'Super Admin',
                ] as const
              ).map((r) => (
                <Pressable
                  key={r}
                  style={[
                    styles.miniChoicePill,
                    newStaffRole === r && {
                      backgroundColor: '#0C3E35',
                      borderColor: '#0C3E35',
                    },
                  ]}
                  onPress={() => setNewStaffRole(r)}
                >
                  <Text
                    style={[
                      styles.miniChoiceText,
                      newStaffRole === r && { color: '#FFFFFF' },
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Role Scope & Permissions</Text>
            <TextInput
              style={styles.input}
              value={newStaffPerms}
              onChangeText={setNewStaffPerms}
            />

            <Pressable
              style={[
                styles.primaryCtaBtn,
                { backgroundColor: activeBrandColor, marginTop: 16, justifyContent: 'center' },
              ]}
              onPress={handleAddAdminStaff}
            >
              <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryCtaBtnText}>Grant Admin Back-Office Role</Text>
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
    width: 280,
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
    paddingVertical: 10,
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
    flexWrap: 'wrap',
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
