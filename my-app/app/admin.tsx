import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import {
  MobileAuthService,
  StoredTraderAccount,
  UserSession,
} from '@/services/auth';
import {
  MobileStorageService,
  MobileTransaction,
  MobileDebt,
  CurrencyCode,
  formatMoney,
  MultiCurrencyCashbox,
} from '@/services/storage';
import {
  MobileOperationsService,
  InventoryItem,
  InvoiceQuote,
  TraderContact,
} from '@/services/operations';
import {
  MobileExchangeService,
  ExchangeRateConfig,
} from '@/services/exchangeRates';
import {
  generateLicenseKey,
  MobileLicenseService,
  LicenseTier,
  LicenseInfo,
} from '@/services/licensing';
import { useAppearance } from '@/context/AppearanceContext';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Input } from '@/components/M3/M3Input';

type AdminTab = 'overview' | 'users' | 'ledger' | 'licenses' | 'security';

const ADMIN_NAV_ITEMS: Array<{
  id: AdminTab;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    id: 'overview',
    title: 'Executive Telemetry',
    subtitle: 'KPIs, Float & RBZ Rates',
    icon: 'analytics-outline',
  },
  {
    id: 'users',
    title: 'Trader Tills & Users',
    subtitle: 'Manage Accounts & Tiers',
    icon: 'people-circle-outline',
  },
  {
    id: 'ledger',
    title: 'Global Master Ledger',
    subtitle: 'Audit, Approve & Export',
    icon: 'Server-outline' as any,
  },
  {
    id: 'licenses',
    title: 'License Key Studio',
    subtitle: 'HMAC-SHA256 Generator',
    icon: 'key-outline',
  },
  {
    id: 'security',
    title: 'Security & Secret Code',
    subtitle: 'Vault, Codes & Snapshots',
    icon: 'shield-checkmark-outline',
  },
];

export default function AdminCommandCenterScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 820;
  const { palette, surfaces, isDarkMode, toggleDarkMode } = useAppearance();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [session, setSession] = useState<UserSession | null>(null);
  const [accounts, setAccounts] = useState<StoredTraderAccount[]>([]);
  const [transactions, setTransactions] = useState<MobileTransaction[]>([]);
  const [cashbox, setCashbox] = useState<MultiCurrencyCashbox | null>(null);
  const [debts, setDebts] = useState<MobileDebt[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceQuote[]>([]);
  const [contacts, setContacts] = useState<TraderContact[]>([]);
  const [rates, setRates] = useState<ExchangeRateConfig>({
    usdToZwg: 28,
    usdToZar: 18,
    lastUpdated: '2026-11-02',
  });
  const [activeLicense, setActiveLicense] = useState<LicenseInfo | null>(null);
  const [currentSecretCode, setCurrentSecretCode] = useState('CFM-HQ-2026');

  // Exchange Rate Editor State
  const [rateZwgInput, setRateZwgInput] = useState('28');
  const [rateZarInput, setRateZarInput] = useState('18');
  const [rateSavedToast, setRateSavedToast] = useState(false);

  // User Provisioning Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserBiz, setNewUserBiz] = useState('');
  const [newUserCurrency, setNewUserCurrency] = useState<CurrencyCode>('USD');
  const [newUserTier, setNewUserTier] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [newUserPassword, setNewUserPassword] = useState('trader2026');

  // Ledger Audit Filter State
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerCurrency, setLedgerCurrency] = useState<'ALL' | CurrencyCode>('ALL');
  const [ledgerStatus, setLedgerStatus] = useState<'ALL' | 'confirmed' | 'pending_review'>('ALL');

  // License Studio State
  const [licTraderName, setLicTraderName] = useState('MRQ-MBARE');
  const [licTier, setLicTier] = useState<LicenseTier>('enterprise');
  const [licYear, setLicYear] = useState('2028');
  const [generatedKey, setGeneratedKey] = useState('CFM-ENT-MRQMBARE-B48F1A9C');
  const [keyStatusMsg, setKeyStatusMsg] = useState<string | null>(null);

  // Security & Secret Code State
  const [newSecretInput, setNewSecretInput] = useState('');
  const [secretUpdateMsg, setSecretUpdateMsg] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    const [
      sess,
      accList,
      txList,
      debtList,
      invList,
      quoteList,
      contactList,
      fxRates,
      licInfo,
      secretCode,
    ] = await Promise.all([
      MobileAuthService.getSession(),
      MobileAuthService.getAllAccounts(),
      MobileStorageService.getTransactions(),
      MobileStorageService.getDebts(),
      MobileOperationsService.getInventory(),
      MobileOperationsService.getInvoices(),
      MobileOperationsService.getContacts(),
      MobileExchangeService.getRates(),
      MobileLicenseService.getActiveLicense(),
      MobileAuthService.getAdminSecretCode(),
    ]);

    const cBox = MobileStorageService.calculateMultiCurrencyCashbox(txList);

    setSession(sess);
    setAccounts(accList);
    setTransactions(txList);
    setCashbox(cBox);
    setDebts(debtList);
    setInventory(invList);
    setInvoices(quoteList);
    setContacts(contactList);
    setRates(fxRates);
    setRateZwgInput(String(fxRates.usdToZwg));
    setRateZarInput(String(fxRates.usdToZar));
    setActiveLicense(licInfo);
    setCurrentSecretCode(secretCode);

    // Pre-generate initial key preview
    const previewKey = generateLicenseKey({
      traderName: 'MRQMBARE',
      tier: 'enterprise',
      expiresYear: 2028,
    });
    setGeneratedKey(previewKey);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAdminData();
    }, [loadAdminData])
  );

  // Handlers
  const handleSaveRates = async () => {
    const zwg = parseFloat(rateZwgInput);
    const zar = parseFloat(rateZarInput);
    if (Number.isNaN(zwg) || zwg <= 0 || Number.isNaN(zar) || zar <= 0) {
      return;
    }
    const updated = await MobileExchangeService.updateRates({
      usdToZwg: zwg,
      usdToZar: zar,
    });
    setRates(updated);
    setRateSavedToast(true);
    setTimeout(() => setRateSavedToast(false), 3000);
  };

  const handleProvisionUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const updated = await MobileAuthService.adminSaveAccount({
      name: newUserName,
      email: newUserEmail,
      businessName: newUserBiz || `${newUserName}'s Enterprise`,
      currency: newUserCurrency,
      tier: newUserTier,
      password: newUserPassword,
    });
    setAccounts(updated);
    setIsUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserBiz('');
  };

  const handleToggleUserStatus = async (userId: string) => {
    const updated = await MobileAuthService.adminToggleAccountStatus(userId);
    setAccounts(updated);
  };

  const handleCycleUserTier = async (acc: StoredTraderAccount) => {
    const nextTier =
      acc.tier === 'starter'
        ? 'pro'
        : acc.tier === 'pro'
        ? 'enterprise'
        : 'starter';
    const updated = await MobileAuthService.adminUpdateAccountTier(acc.userId, nextTier);
    setAccounts(updated);
  };

  const handleDeleteUser = async (userId: string) => {
    const updated = await MobileAuthService.adminDeleteAccount(userId);
    setAccounts(updated);
  };

  const handleApproveTx = async (tx: MobileTransaction) => {
    await MobileStorageService.updateTransaction(tx.id, {
      reviewStatus: 'confirmed',
    });
    await loadAdminData();
  };

  const handleDeleteTx = async (id: string) => {
    await MobileStorageService.deleteTransaction(id);
    await loadAdminData();
  };

  const handleGenerateKey = () => {
    const yearNum = parseInt(licYear, 10) || 2028;
    const key = generateLicenseKey({
      traderName: licTraderName || 'TRADER',
      tier: licTier,
      expiresYear: yearNum,
    });
    setGeneratedKey(key);
    setKeyStatusMsg(`Generated authentic ${licTier.toUpperCase()} key for ${licTraderName.toUpperCase()}`);
  };

  const handleCopyOrApplyKey = async (applyToDevice: boolean) => {
    if (applyToDevice) {
      const info = await MobileLicenseService.activateLicense(generatedKey);
      setActiveLicense(info);
      setKeyStatusMsg(`Activated ${info.tier.toUpperCase()} license on this machine!`);
    } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(generatedKey);
      setKeyStatusMsg('License key copied to clipboard!');
    }
  };

  const handleUpdateSecretCode = async () => {
    if (!newSecretInput.trim() || newSecretInput.trim().length < 4) {
      setSecretUpdateMsg('Error: Secret code must be at least 4 characters.');
      return;
    }
    await MobileAuthService.setAdminSecretCode(newSecretInput.trim().toUpperCase());
    const fresh = await MobileAuthService.getAdminSecretCode();
    setCurrentSecretCode(fresh);
    setNewSecretInput('');
    setSecretUpdateMsg(`Admin Secret Code updated to "${fresh}"`);
  };

  const handleExportMasterSnapshot = async () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      exportedBy: session?.name || 'Admin HQ',
      accounts,
      transactions,
      debts,
      inventory,
      invoices,
      contacts,
      rates,
    };
    const jsonStr = JSON.stringify(snapshot, null, 2);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cashflow-mate-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Backup Ready', `Prepared ${transactions.length} records for export.`);
    }
  };

  const handleLogoutAdmin = async () => {
    await MobileAuthService.logout();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.assign('/login');
      return;
    }
    router.replace('/login' as any);
  };

  // Computed Telemetry
  const invValuation = {
    totalRetailValue: inventory.reduce(
      (sum, item) => sum + item.quantity * item.sellingPrice,
      0
    ),
    lowStockCount: inventory.filter((item) => item.quantity <= item.minStockLevel).length,
  };
  const pendingReviewCount = transactions.filter((t) => t.reviewStatus === 'pending_review').length;
  const openCreditTotal = debts
    .filter((d) => d.status !== 'settled' && d.direction === 'owed_to_business')
    .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

  const filteredLedger = transactions.filter((tx) => {
    if (ledgerCurrency !== 'ALL' && tx.currency !== ledgerCurrency) return false;
    if (ledgerStatus !== 'ALL' && tx.reviewStatus !== ledgerStatus) return false;
    if (ledgerSearch.trim()) {
      const q = ledgerSearch.toLowerCase();
      return (
        tx.description.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.originalReference || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={[styles.desktopRoot, { backgroundColor: surfaces.sheetBg }]}>
      {/* LEFT DESKTOP COMMAND SIDEBAR */}
      <View style={[styles.commandSidebar, { backgroundColor: palette.headerBg }]}>
        <View>
          {/* Brand Header */}
          <View style={styles.sidebarBrandRow}>
            <View style={[styles.adminShieldBadge, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="shield-half" size={22} color="#090D16" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sidebarBrandTitle}>ADMIN HQ</Text>
              <Text style={[styles.sidebarBrandSub, { color: palette.accent }]}>
                DESKTOP COMMAND OS
              </Text>
            </View>
            <Pressable
              onPress={toggleDarkMode}
              style={styles.sidebarThemeBtn}
              accessibilityLabel="Toggle Dark Mode"
            >
              <Ionicons
                name={isDarkMode ? 'sunny' : 'moon'}
                size={16}
                color={isDarkMode ? '#FBBF24' : '#FFFFFF'}
              />
            </Pressable>
          </View>

          <View style={styles.secretStatusPill}>
            <Ionicons name="key" size={12} color="#FBBF24" />
            <Text style={styles.secretStatusText}>
              CODE: {currentSecretCode}
            </Text>
          </View>

          <Text style={styles.navGroupLabel}>COMMAND MODULES</Text>
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setActiveTab(item.id)}
                style={[
                  styles.adminNavItem,
                  active && {
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    borderColor: palette.accent,
                    borderWidth: 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.adminNavIconBox,
                    {
                      backgroundColor: active
                        ? palette.primary
                        : 'rgba(255, 255, 255, 0.06)',
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon === ('Server-outline' as any) ? 'albums-outline' : item.icon}
                    size={18}
                    color={active ? '#FFFFFF' : '#94A3B8'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.adminNavTitle,
                      active && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.adminNavSub}>{item.subtitle}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Bottom Switch to Trader Till & Logout */}
        <View style={styles.sidebarFooter}>
          <Pressable
            onPress={() => router.push('/(tabs)' as any)}
            style={[styles.switchTillBtn, { borderColor: palette.accent }]}
          >
            <Ionicons name="storefront-outline" size={16} color={palette.accent} />
            <Text style={[styles.switchTillText, { color: palette.accent }]}>
              Open Live Trader Till
            </Text>
          </Pressable>

          <Pressable onPress={handleLogoutAdmin} style={styles.logoutAdminBtn}>
            <Ionicons name="log-out-outline" size={16} color="#FDA4AF" />
            <Text style={styles.logoutAdminText}>Sign Out of Admin HQ</Text>
          </Pressable>
        </View>
      </View>

      {/* RIGHT MAIN DESKTOP WORKSPACE */}
      <View style={styles.workspaceArea}>
        {/* Top Desktop Telemetry Bar */}
        <View
          style={[
            styles.topTelemetryBar,
            {
              backgroundColor: surfaces.cardBg,
              borderBottomColor: surfaces.border,
            },
          ]}
        >
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[styles.workspaceTitle, { color: surfaces.textPrimary }]}>
                {ADMIN_NAV_ITEMS.find((i) => i.id === activeTab)?.title}
              </Text>
              <M3Badge label="DESKTOP ADMIN CONSOLE" variant="amber" />
            </View>
            <Text style={[styles.workspaceSubtitle, { color: surfaces.textMuted }]}>
              Signed in as {session?.name || 'Supreme Commander Mr Q'} &bull; Full System Privileges
            </Text>
          </View>

          <View style={styles.topTelemetryRight}>
            <View
              style={[
                styles.telemetryChip,
                { backgroundColor: surfaces.cardElevatedBg, borderColor: surfaces.border },
              ]}
            >
              <Text style={[styles.telemetryChipLabel, { color: surfaces.textMuted }]}>
                1 USD =
              </Text>
              <Text style={[styles.telemetryChipVal, { color: surfaces.textPrimary }]}>
                {rates.usdToZwg} ZiG / R{rates.usdToZar}
              </Text>
            </View>

            <Pressable
              onPress={handleExportMasterSnapshot}
              style={[styles.exportTopBtn, { backgroundColor: palette.primary }]}
            >
              <Ionicons name="download-outline" size={15} color="#FFFFFF" />
              <Text style={styles.exportTopBtnText}>Backup JSON</Text>
            </Pressable>
          </View>
        </View>

        {!isDesktop && (
          <View style={styles.mobileNoticeBanner}>
            <Ionicons name="desktop-outline" size={16} color="#B45309" />
            <Text style={styles.mobileNoticeText}>
              Admin HQ is optimized for Desktop screens. Expand your browser window for full multi-column tables.
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.workspaceScroll}
          contentContainerStyle={styles.workspaceScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ============================================================
              SCREEN 1: EXECUTIVE OVERVIEW & TELEMETRY
             ============================================================ */}
          {activeTab === 'overview' && (
            <View>
              {/* 6-Card Desktop Executive KPI Grid */}
              <View style={styles.kpiGrid}>
                <View
                  style={[
                    styles.kpiCard,
                    { backgroundColor: surfaces.cardBg, borderColor: surfaces.border },
                  ]}
                >
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: surfaces.textMuted }]}>
                      REGISTERED TRADER TILLS
                    </Text>
                    <Ionicons name="people" size={18} color={palette.primary} />
                  </View>
                  <Text style={[styles.kpiBigValue, { color: surfaces.textPrimary }]}>
                    {accounts.length} Tills
                  </Text>
                  <Text style={[styles.kpiFoot, { color: '#10B981' }]}>
                    {accounts.filter((a) => a.status !== 'suspended').length} Active &bull;{' '}
                    {accounts.filter((a) => a.tier === 'enterprise').length} Enterprise
                  </Text>
                </View>

                <View
                  style={[
                    styles.kpiCard,
                    { backgroundColor: surfaces.cardBg, borderColor: surfaces.border },
                  ]}
                >
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: surfaces.textMuted }]}>
                      USD CASHBOX NET FLOW
                    </Text>
                    <Ionicons name="cash-outline" size={18} color="#10B981" />
                  </View>
                  <Text style={[styles.kpiBigValue, { color: '#10B981' }]}>
                    {formatMoney(cashbox?.USD.netCashFlow || 0, 'USD')}
                  </Text>
                  <Text style={[styles.kpiFoot, { color: surfaces.textMuted }]}>
                    In: {formatMoney(cashbox?.USD.inflows || 0, 'USD')} &bull; Out:{' '}
                    {formatMoney(cashbox?.USD.outflows || 0, 'USD')}
                  </Text>
                </View>

                <View
                  style={[
                    styles.kpiCard,
                    { backgroundColor: surfaces.cardBg, borderColor: surfaces.border },
                  ]}
                >
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: surfaces.textMuted }]}>
                      ZiG (ECOCASH) DRAWER
                    </Text>
                    <Ionicons name="phone-portrait-outline" size={18} color="#3B82F6" />
                  </View>
                  <Text style={[styles.kpiBigValue, { color: surfaces.textPrimary }]}>
                    {formatMoney(cashbox?.ZWG.netCashFlow || 0, 'ZWG')}
                  </Text>
                  <Text style={[styles.kpiFoot, { color: surfaces.textMuted }]}>
                    USD Eq: $
                    {(
                      (cashbox?.ZWG.netCashFlow || 0) / (rates.usdToZwg || 28)
                    ).toFixed(2)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.kpiCard,
                    { backgroundColor: surfaces.cardBg, borderColor: surfaces.border },
                  ]}
                >
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: surfaces.textMuted }]}>
                      SHELF INVENTORY VALUE
                    </Text>
                    <Ionicons name="cube-outline" size={18} color="#8B5CF6" />
                  </View>
                  <Text style={[styles.kpiBigValue, { color: surfaces.textPrimary }]}>
                    ${invValuation.totalRetailValue.toFixed(2)}
                  </Text>
                  <Text style={[styles.kpiFoot, { color: '#D97706' }]}>
                    {inventory.length} SKUs &bull; {invValuation.lowStockCount} Low Stock
                  </Text>
                </View>

                <View
                  style={[
                    styles.kpiCard,
                    { backgroundColor: surfaces.cardBg, borderColor: surfaces.border },
                  ]}
                >
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: surfaces.textMuted }]}>
                      PENDING LEDGER AUDITS
                    </Text>
                    <Ionicons name="alert-circle-outline" size={18} color="#F59E0B" />
                  </View>
                  <Text style={[styles.kpiBigValue, { color: '#F59E0B' }]}>
                    {pendingReviewCount} Records
                  </Text>
                  <Text style={[styles.kpiFoot, { color: surfaces.textMuted }]}>
                    Out of {transactions.length} total ledger entries
                  </Text>
                </View>

                <View
                  style={[
                    styles.kpiCard,
                    { backgroundColor: surfaces.cardBg, borderColor: surfaces.border },
                  ]}
                >
                  <View style={styles.kpiHeader}>
                    <Text style={[styles.kpiLabel, { color: surfaces.textMuted }]}>
                      UNSETTLED MARKET CREDIT
                    </Text>
                    <Ionicons name="receipt-outline" size={18} color="#E11D48" />
                  </View>
                  <Text style={[styles.kpiBigValue, { color: '#E11D48' }]}>
                    ${openCreditTotal.toFixed(2)}
                  </Text>
                  <Text style={[styles.kpiFoot, { color: surfaces.textMuted }]}>
                    {invoices.length} Pro-Forma Quotes &bull; {contacts.length} CRM Contacts
                  </Text>
                </View>
              </View>

              {/* Two-Column Desktop Row: Exchange Rate Desk + Quick Admin Shortcuts */}
              <View style={styles.twoColDesktopRow}>
                {/* Left: Central Exchange Rate Broadcast Desk */}
                <View
                  style={[
                    styles.panelCard,
                    {
                      flex: 1.2,
                      backgroundColor: surfaces.cardBg,
                      borderColor: surfaces.border,
                    },
                  ]}
                >
                  <View style={styles.panelHeaderRow}>
                    <View>
                      <Text style={[styles.panelTitle, { color: surfaces.textPrimary }]}>
                        Global Exchange Rate Broadcast Desk
                      </Text>
                      <Text style={[styles.panelSub, { color: surfaces.textMuted }]}>
                        Set the official/market conversion rates used across all multi-currency cashboxes.
                      </Text>
                    </View>
                    <M3Badge label={`UPDATED ${rates.lastUpdated}`} variant="primary" />
                  </View>

                  <View style={styles.fxInputRow}>
                    <View style={{ flex: 1 }}>
                      <M3Input
                        label="1 USD to ZiG (ZWG) Rate"
                        value={rateZwgInput}
                        onChangeText={setRateZwgInput}
                        keyboardType="decimal-pad"
                        prefix="ZiG"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <M3Input
                        label="1 USD to South African Rand (ZAR)"
                        value={rateZarInput}
                        onChangeText={setRateZarInput}
                        keyboardType="decimal-pad"
                        prefix="R"
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <M3Button
                      label="Broadcast & Save Exchange Rates"
                      variant="mint"
                      size="md"
                      onPress={handleSaveRates}
                    />
                    {rateSavedToast && (
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>
                        ✓ Rates broadcasted to all tills!
                      </Text>
                    )}
                  </View>
                </View>

                {/* Right: Active Device License & System Health */}
                <View
                  style={[
                    styles.panelCard,
                    {
                      flex: 1,
                      backgroundColor: surfaces.cardBg,
                      borderColor: surfaces.border,
                    },
                  ]}
                >
                  <View style={styles.panelHeaderRow}>
                    <Text style={[styles.panelTitle, { color: surfaces.textPrimary }]}>
                      System Integrity & License Status
                    </Text>
                    <M3Badge
                      label={(activeLicense?.tier || 'starter').toUpperCase()}
                      variant="mint"
                    />
                  </View>
                  <View style={styles.healthList}>
                    <View style={styles.healthRow}>
                      <Text style={[styles.healthKey, { color: surfaces.textMuted }]}>
                        Admin Secret Access Code
                      </Text>
                      <Text style={[styles.healthVal, { color: '#D97706' }]}>
                        {currentSecretCode} (or PIN 7788)
                      </Text>
                    </View>
                    <View style={styles.healthRow}>
                      <Text style={[styles.healthKey, { color: surfaces.textMuted }]}>
                        Cryptographic Signing Engine
                      </Text>
                      <Text style={[styles.healthVal, { color: '#10B981' }]}>
                        HMAC-SHA256 Verified
                      </Text>
                    </View>
                    <View style={styles.healthRow}>
                      <Text style={[styles.healthKey, { color: surfaces.textMuted }]}>
                        Offline Storage Engine
                      </Text>
                      <Text style={[styles.healthVal, { color: surfaces.textPrimary }]}>
                        AsyncStorage v2 + SQLite Ready
                      </Text>
                    </View>
                    <View style={styles.healthRow}>
                      <Text style={[styles.healthKey, { color: surfaces.textMuted }]}>
                        Active Device License Key
                      </Text>
                      <Text style={[styles.healthVal, { color: surfaces.textPrimary }]}>
                        {activeLicense?.key || 'Starter Community Tier'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ============================================================
              SCREEN 2: TRADER ACCOUNTS & TILLS DIRECTORY
             ============================================================ */}
          {activeTab === 'users' && (
            <View
              style={[
                styles.panelCard,
                { backgroundColor: surfaces.cardBg, borderColor: surfaces.border },
              ]}
            >
              <View style={styles.panelHeaderRow}>
                <View>
                  <Text style={[styles.panelTitle, { color: surfaces.textPrimary }]}>
                    Registered Trader Accounts & Market Tills ({accounts.length})
                  </Text>
                  <Text style={[styles.panelSub, { color: surfaces.textMuted }]}>
                    Provision new trader accounts, upgrade license tiers, or suspend access.
                  </Text>
                </View>
                <M3Button
                  label="+ Provision New Trader Till"
                  variant="mint"
                  size="sm"
                  onPress={() => setIsUserModalOpen(true)}
                />
              </View>

              {/* Desktop Table Header */}
              <View
                style={[
                  styles.tableHeaderRow,
                  { backgroundColor: surfaces.cardElevatedBg, borderColor: surfaces.border },
                ]}
              >
                <Text style={[styles.thCell, { flex: 1.4, color: surfaces.textMuted }]}>
                  TRADER / USERNAME
                </Text>
                <Text style={[styles.thCell, { flex: 1.8, color: surfaces.textMuted }]}>
                  ENTERPRISE / STALL
                </Text>
                <Text style={[styles.thCell, { flex: 1.5, color: surfaces.textMuted }]}>
                  EMAIL
                </Text>
                <Text style={[styles.thCell, { flex: 0.7, color: surfaces.textMuted }]}>
                  FLOAT
                </Text>
                <Text style={[styles.thCell, { flex: 0.9, color: surfaces.textMuted }]}>
                  TIER (CLICK)
                </Text>
                <Text style={[styles.thCell, { flex: 0.8, color: surfaces.textMuted }]}>
                  STATUS
                </Text>
                <Text
                  style={[
                    styles.thCell,
                    { flex: 1.2, textAlign: 'right', color: surfaces.textMuted },
                  ]}
                >
                  ACTIONS
                </Text>
              </View>

              {accounts.map((acc) => {
                const isSuspended = acc.status === 'suspended';
                return (
                  <View
                    key={acc.userId}
                    style={[
                      styles.tableDataRow,
                      { borderBottomColor: surfaces.border },
                    ]}
                  >
                    <View style={{ flex: 1.4 }}>
                      <Text style={[styles.tdPrimary, { color: surfaces.textPrimary }]}>
                        {acc.name}
                      </Text>
                      <Text style={[styles.tdSub, { color: surfaces.textMuted }]}>
                        @{acc.username}
                      </Text>
                    </View>
                    <View style={{ flex: 1.8 }}>
                      <Text style={[styles.tdPrimary, { color: surfaces.textPrimary }]}>
                        {acc.businessName}
                      </Text>
                      <Text style={[styles.tdSub, { color: surfaces.textMuted }]}>
                        Created {acc.createdAt || '2026-10-20'}
                      </Text>
                    </View>
                    <Text
                      style={[styles.tdText, { flex: 1.5, color: surfaces.textSecondary }]}
                      numberOfLines={1}
                    >
                      {acc.email}
                    </Text>
                    <View style={{ flex: 0.7 }}>
                      <M3Badge label={acc.currency} variant="primary" />
                    </View>
                    <Pressable
                      onPress={() => handleCycleUserTier(acc)}
                      style={{ flex: 0.9 }}
                      accessibilityLabel="Click to cycle license tier"
                    >
                      <M3Badge
                        label={(acc.tier || 'starter').toUpperCase()}
                        variant={
                          acc.tier === 'enterprise'
                            ? 'amber'
                            : acc.tier === 'pro'
                            ? 'mint'
                            : 'neutral'
                        }
                      />
                    </Pressable>
                    <View style={{ flex: 0.8 }}>
                      <M3Badge
                        label={isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                        variant={isSuspended ? 'outflow' : 'inflow'}
                      />
                    </View>
                    <View
                      style={{
                        flex: 1.2,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        gap: 6,
                      }}
                    >
                      <Pressable
                        onPress={() => handleToggleUserStatus(acc.userId)}
                        style={[
                          styles.rowActionBtn,
                          {
                            backgroundColor: isSuspended ? '#DCFCE7' : '#FEF3C7',
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '800',
                            color: isSuspended ? '#065F46' : '#92400E',
                          }}
                        >
                          {isSuspended ? 'Activate' : 'Suspend'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteUser(acc.userId)}
                        style={[styles.rowActionBtn, { backgroundColor: '#FFE4E6' }]}
                      >
                        <Ionicons name="trash-outline" size={14} color="#E11D48" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ============================================================
              SCREEN 3: GLOBAL MASTER LEDGER & AUDIT INSPECTOR
             ============================================================ */}
          {activeTab === 'ledger' && (
            <View
              style={[
                styles.panelCard,
                { backgroundColor: surfaces.cardBg, borderColor: surfaces.border },
              ]}
            >
              <View style={styles.panelHeaderRow}>
                <View>
                  <Text style={[styles.panelTitle, { color: surfaces.textPrimary }]}>
                    Global Master Ledger & Audit Inspector ({filteredLedger.length} rows)
                  </Text>
                  <Text style={[styles.panelSub, { color: surfaces.textMuted }]}>
                    Inspect, filter, approve pending reviews, or purge anomalous records.
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['ALL', 'USD', 'ZWG', 'ZAR'] as const).map((cur) => (
                    <Pressable
                      key={cur}
                      onPress={() => setLedgerCurrency(cur)}
                      style={[
                        styles.filterPill,
                        {
                          backgroundColor:
                            ledgerCurrency === cur
                              ? palette.primary
                              : surfaces.cardElevatedBg,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: ledgerCurrency === cur ? '#FFFFFF' : surfaces.textPrimary,
                        }}
                      >
                        {cur}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Search & Status Filter Bar */}
              <View style={styles.ledgerFilterBar}>
                <View
                  style={[
                    styles.searchBox,
                    {
                      backgroundColor: surfaces.inputBg,
                      borderColor: surfaces.border,
                    },
                  ]}
                >
                  <Ionicons name="search" size={16} color={surfaces.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: surfaces.textPrimary }]}
                    placeholder="Search description, category, or EcoCash reference..."
                    placeholderTextColor={surfaces.textMuted}
                    value={ledgerSearch}
                    onChangeText={setLedgerSearch}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(
                    [
                      { id: 'ALL', label: 'All Status' },
                      { id: 'pending_review', label: `Pending (${pendingReviewCount})` },
                      { id: 'confirmed', label: 'Confirmed' },
                    ] as const
                  ).map((st) => (
                    <Pressable
                      key={st.id}
                      onPress={() => setLedgerStatus(st.id)}
                      style={[
                        styles.filterPill,
                        {
                          backgroundColor:
                            ledgerStatus === st.id
                              ? palette.primary
                              : surfaces.cardElevatedBg,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: ledgerStatus === st.id ? '#FFFFFF' : surfaces.textPrimary,
                        }}
                      >
                        {st.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Desktop Ledger Table Header */}
              <View
                style={[
                  styles.tableHeaderRow,
                  { backgroundColor: surfaces.cardElevatedBg, borderColor: surfaces.border },
                ]}
              >
                <Text style={[styles.thCell, { flex: 0.9, color: surfaces.textMuted }]}>
                  DATE
                </Text>
                <Text style={[styles.thCell, { flex: 2.2, color: surfaces.textMuted }]}>
                  DESCRIPTION & REF
                </Text>
                <Text style={[styles.thCell, { flex: 1.1, color: surfaces.textMuted }]}>
                  CATEGORY
                </Text>
                <Text style={[styles.thCell, { flex: 0.7, color: surfaces.textMuted }]}>
                  DRAWER
                </Text>
                <Text style={[styles.thCell, { flex: 1.0, color: surfaces.textMuted }]}>
                  AMOUNT
                </Text>
                <Text style={[styles.thCell, { flex: 0.9, color: surfaces.textMuted }]}>
                  AUDIT STATUS
                </Text>
                <Text
                  style={[
                    styles.thCell,
                    { flex: 1.0, textAlign: 'right', color: surfaces.textMuted },
                  ]}
                >
                  ACTIONS
                </Text>
              </View>

              {filteredLedger.map((tx) => {
                const isPending = tx.reviewStatus === 'pending_review';
                const isInflow = tx.direction === 'inflow';
                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.tableDataRow,
                      { borderBottomColor: surfaces.border },
                    ]}
                  >
                    <Text style={[styles.tdText, { flex: 0.9, color: surfaces.textMuted }]}>
                      {tx.transactionDate}
                    </Text>
                    <View style={{ flex: 2.2 }}>
                      <Text
                        style={[styles.tdPrimary, { color: surfaces.textPrimary }]}
                        numberOfLines={1}
                      >
                        {tx.description}
                      </Text>
                      {tx.originalReference ? (
                        <Text style={[styles.tdSub, { color: surfaces.textMuted }]}>
                          Ref: {tx.originalReference}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      style={[styles.tdText, { flex: 1.1, color: surfaces.textSecondary }]}
                    >
                      {tx.category}
                    </Text>
                    <View style={{ flex: 0.7 }}>
                      <M3Badge label={tx.currency} variant="primary" />
                    </View>
                    <Text
                      style={[
                        styles.tdPrimary,
                        {
                          flex: 1.0,
                          color: isInflow ? '#10B981' : '#E11D48',
                        },
                      ]}
                    >
                      {isInflow ? '+' : '-'}
                      {formatMoney(tx.amount, tx.currency)}
                    </Text>
                    <View style={{ flex: 0.9 }}>
                      <M3Badge
                        label={isPending ? 'PENDING' : 'CONFIRMED'}
                        variant={isPending ? 'amber' : 'inflow'}
                      />
                    </View>
                    <View
                      style={{
                        flex: 1.0,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        gap: 6,
                      }}
                    >
                      {isPending && (
                        <Pressable
                          onPress={() => handleApproveTx(tx)}
                          style={[styles.rowActionBtn, { backgroundColor: '#DCFCE7' }]}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#065F46' }}>
                            Approve
                          </Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => handleDeleteTx(tx.id)}
                        style={[styles.rowActionBtn, { backgroundColor: '#FFE4E6' }]}
                      >
                        <Ionicons name="trash-outline" size={14} color="#E11D48" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ============================================================
              SCREEN 4: CRYPTOGRAPHIC LICENSE KEY STUDIO
             ============================================================ */}
          {activeTab === 'licenses' && (
            <View style={styles.twoColDesktopRow}>
              <View
                style={[
                  styles.panelCard,
                  {
                    flex: 1.2,
                    backgroundColor: surfaces.cardBg,
                    borderColor: surfaces.border,
                  },
                ]}
              >
                <View style={styles.panelHeaderRow}>
                  <View>
                    <Text style={[styles.panelTitle, { color: surfaces.textPrimary }]}>
                      HMAC-SHA256 Offline License Key Generator
                    </Text>
                    <Text style={[styles.panelSub, { color: surfaces.textMuted }]}>
                      Generate cryptographically signed activation keys for Pro and Enterprise traders.
                    </Text>
                  </View>
                  <M3Badge label="ADMIN KEYGEN" variant="amber" />
                </View>

                <M3Input
                  label="Trader / Enterprise Identifier"
                  placeholder="e.g. MRQ-MBARE or BULAWAYO-01"
                  value={licTraderName}
                  onChangeText={setLicTraderName}
                  autoCapitalize="characters"
                />

                <Text style={[styles.fieldLabel, { color: surfaces.textPrimary, marginTop: 10 }]}>
                  Select Target License Tier
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  {(
                    [
                      { id: 'pro', title: 'PRO TRADER ($5/mo)', sub: 'Unlimited CSV + 3 Currencies' },
                      {
                        id: 'enterprise',
                        title: 'ENTERPRISE HUB ($15/mo)',
                        sub: 'Multi-Stall + Full AI Audit',
                      },
                    ] as const
                  ).map((tOpt) => {
                    const active = licTier === tOpt.id;
                    return (
                      <Pressable
                        key={tOpt.id}
                        onPress={() => setLicTier(tOpt.id)}
                        style={[
                          styles.tierSelectCard,
                          {
                            backgroundColor: surfaces.cardElevatedBg,
                            borderColor: active ? palette.primary : surfaces.border,
                            borderWidth: active ? 2 : 1,
                          },
                        ]}
                      >
                        <Text style={[styles.tdPrimary, { color: surfaces.textPrimary }]}>
                          {tOpt.title}
                        </Text>
                        <Text style={[styles.tdSub, { color: surfaces.textMuted }]}>
                          {tOpt.sub}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <M3Input
                  label="Expiration Year (2026 - 2035)"
                  placeholder="2028"
                  value={licYear}
                  onChangeText={setLicYear}
                  keyboardType="number-pad"
                />

                <View style={{ marginTop: 14 }}>
                  <M3Button
                    label="Generate Cryptographic License Key"
                    variant="mint"
                    size="lg"
                    onPress={handleGenerateKey}
                    icon={<Ionicons name="key-outline" size={18} color="#FFFFFF" />}
                  />
                </View>
              </View>

              {/* Generated Key Output Box */}
              <View
                style={[
                  styles.panelCard,
                  {
                    flex: 1,
                    backgroundColor: surfaces.cardBg,
                    borderColor: surfaces.border,
                  },
                ]}
              >
                <Text style={[styles.panelTitle, { color: surfaces.textPrimary }]}>
                  Generated Activation Certificate
                </Text>
                <Text style={[styles.panelSub, { color: surfaces.textMuted, marginBottom: 16 }]}>
                  Share this key with the trader or apply it directly to this workstation.
                </Text>

                <View
                  style={[
                    styles.keyDisplayVault,
                    { backgroundColor: palette.headerBg, borderColor: palette.accent },
                  ]}
                >
                  <Text style={styles.keyVaultCaption}>HMAC-SHA256 SIGNED LICENSE KEY</Text>
                  <Text style={[styles.keyVaultCode, { color: palette.accent }]}>
                    {generatedKey}
                  </Text>
                </View>

                {keyStatusMsg && (
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#10B981',
                      marginVertical: 10,
                    }}
                  >
                    ✓ {keyStatusMsg}
                  </Text>
                )}

                <View style={{ gap: 10, marginTop: 12 }}>
                  <M3Button
                    label="Copy Key to Clipboard"
                    variant="tonal"
                    size="md"
                    onPress={() => handleCopyOrApplyKey(false)}
                    icon={<Ionicons name="copy-outline" size={16} color={surfaces.textPrimary} />}
                  />
                  <M3Button
                    label="Activate Key on This Device"
                    variant="mint"
                    size="md"
                    onPress={() => handleCopyOrApplyKey(true)}
                    icon={<Ionicons name="checkmark-done-outline" size={16} color="#FFFFFF" />}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ============================================================
              SCREEN 5: SECURITY VAULT & SECRET CODE CONTROL
             ============================================================ */}
          {activeTab === 'security' && (
            <View style={styles.twoColDesktopRow}>
              <View
                style={[
                  styles.panelCard,
                  {
                    flex: 1,
                    backgroundColor: surfaces.cardBg,
                    borderColor: surfaces.border,
                  },
                ]}
              >
                <View style={styles.panelHeaderRow}>
                  <View>
                    <Text style={[styles.panelTitle, { color: surfaces.textPrimary }]}>
                      Admin Login Secret Code Configuration
                    </Text>
                    <Text style={[styles.panelSub, { color: surfaces.textMuted }]}>
                      This secret code is required alongside username &ldquo;admin&rdquo; when signing into Admin HQ.
                    </Text>
                  </View>
                  <M3Badge label="SECRET VAULT" variant="amber" />
                </View>

                <View
                  style={[
                    styles.currentSecretBanner,
                    { backgroundColor: surfaces.cardElevatedBg, borderColor: surfaces.border },
                  ]}
                >
                  <Text style={[styles.tdSub, { color: surfaces.textMuted }]}>
                    ACTIVE ADMIN SECRET CODE
                  </Text>
                  <Text style={[styles.secretBigCode, { color: surfaces.textPrimary }]}>
                    {currentSecretCode}
                  </Text>
                  <Text style={[styles.tdSub, { color: surfaces.textMuted }]}>
                    (Default master codes CFM-HQ-2026 and 7788 are also always accepted)
                  </Text>
                </View>

                <M3Input
                  label="Set New Custom Admin Secret Code"
                  placeholder="e.g. MRQ-COMMAND-2026"
                  value={newSecretInput}
                  onChangeText={setNewSecretInput}
                  autoCapitalize="characters"
                />

                {secretUpdateMsg && (
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#10B981',
                      marginVertical: 8,
                    }}
                  >
                    {secretUpdateMsg}
                  </Text>
                )}

                <View style={{ marginTop: 10 }}>
                  <M3Button
                    label="Update Admin Secret Code"
                    variant="mint"
                    size="md"
                    onPress={handleUpdateSecretCode}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.panelCard,
                  {
                    flex: 1,
                    backgroundColor: surfaces.cardBg,
                    borderColor: surfaces.border,
                  },
                ]}
              >
                <Text style={[styles.panelTitle, { color: surfaces.textPrimary }]}>
                  Database Backup & Emergency Controls
                </Text>
                <Text style={[styles.panelSub, { color: surfaces.textMuted, marginBottom: 16 }]}>
                  Export a full JSON snapshot of all accounts, transactions, inventory, quotes, and contacts.
                </Text>

                <View style={{ gap: 12 }}>
                  <M3Button
                    label="Export Full JSON Database Backup"
                    variant="mint"
                    size="md"
                    onPress={handleExportMasterSnapshot}
                    icon={<Ionicons name="cloud-download-outline" size={17} color="#FFFFFF" />}
                  />

                  <M3Button
                    label="Open Appearance & Theme Studio"
                    variant="tonal"
                    size="md"
                    onPress={() => router.push('/appearance' as any)}
                    icon={
                      <Ionicons
                        name="color-palette-outline"
                        size={17}
                        color={surfaces.textPrimary}
                      />
                    }
                  />

                  <M3Button
                    label="Return to Live Trader Till"
                    variant="tonal"
                    size="md"
                    onPress={() => router.push('/(tabs)' as any)}
                    icon={
                      <Ionicons
                        name="storefront-outline"
                        size={17}
                        color={surfaces.textPrimary}
                      />
                    }
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* MODAL: PROVISION NEW TRADER ACCOUNT */}
      <Modal visible={isUserModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: surfaces.cardBg, borderColor: surfaces.border },
            ]}
          >
            <View style={styles.panelHeaderRow}>
              <Text style={[styles.panelTitle, { color: surfaces.textPrimary }]}>
                Provision New Trader Till Account
              </Text>
              <Pressable onPress={() => setIsUserModalOpen(false)}>
                <Ionicons name="close" size={22} color={surfaces.textPrimary} />
              </Pressable>
            </View>

            <M3Input
              label="Trader Full Name / Username"
              placeholder="e.g. Tendai Moyo"
              value={newUserName}
              onChangeText={setNewUserName}
            />
            <M3Input
              label="Trader Email Address"
              placeholder="e.g. tendai@market.co.zw"
              value={newUserEmail}
              onChangeText={setNewUserEmail}
              autoCapitalize="none"
            />
            <M3Input
              label="Enterprise / Market Stall Name"
              placeholder="e.g. Tendai Wholesale Hardware"
              value={newUserBiz}
              onChangeText={setNewUserBiz}
            />
            <M3Input
              label="Initial Account Password"
              placeholder="trader2026"
              value={newUserPassword}
              onChangeText={setNewUserPassword}
              autoCapitalize="none"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 10 }}>
              {(['USD', 'ZWG', 'ZAR'] as CurrencyCode[]).map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewUserCurrency(c)}
                  style={[
                    styles.filterPill,
                    {
                      flex: 1,
                      alignItems: 'center',
                      backgroundColor:
                        newUserCurrency === c ? palette.primary : surfaces.cardElevatedBg,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: newUserCurrency === c ? '#FFFFFF' : surfaces.textPrimary,
                    }}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {(['starter', 'pro', 'enterprise'] as const).map((tr) => (
                <Pressable
                  key={tr}
                  onPress={() => setNewUserTier(tr)}
                  style={[
                    styles.filterPill,
                    {
                      flex: 1,
                      alignItems: 'center',
                      backgroundColor:
                        newUserTier === tr ? palette.primary : surfaces.cardElevatedBg,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: newUserTier === tr ? '#FFFFFF' : surfaces.textPrimary,
                    }}
                  >
                    {tr.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <M3Button
              label="Create & Provision Trader Account"
              variant="mint"
              size="lg"
              onPress={handleProvisionUser}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  commandSidebar: {
    width: 280,
    paddingVertical: 22,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  adminShieldBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarBrandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  sidebarBrandSub: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  sidebarThemeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secretStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 22,
  },
  secretStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  navGroupLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  adminNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    gap: 12,
  },
  adminNavIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminNavTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  adminNavSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 1,
  },
  sidebarFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  switchTillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  switchTillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  logoutAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(225, 29, 72, 0.16)',
    gap: 8,
  },
  logoutAdminText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FDA4AF',
  },
  workspaceArea: {
    flex: 1,
    flexDirection: 'column',
  },
  topTelemetryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  workspaceTitle: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  workspaceSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  topTelemetryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  telemetryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  telemetryChipLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  telemetryChipVal: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  exportTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  exportTopBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mobileNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  mobileNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  workspaceScroll: {
    flex: 1,
  },
  workspaceScrollContent: {
    padding: 28,
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  kpiCard: {
    width: '31.5%',
    minWidth: 240,
    flexGrow: 1,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  kpiBigValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  kpiFoot: {
    fontSize: 11,
    fontWeight: '600',
  },
  twoColDesktopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  panelCard: {
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 320,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  panelSub: {
    fontSize: 12,
    marginTop: 2,
  },
  fxInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  healthList: {
    marginTop: 8,
    gap: 12,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  healthKey: {
    fontSize: 12,
    fontWeight: '600',
  },
  healthVal: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  thCell: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  tdPrimary: {
    fontSize: 13,
    fontWeight: '800',
  },
  tdSub: {
    fontSize: 11,
    marginTop: 2,
  },
  tdText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rowActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
  },
  ledgerFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  tierSelectCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  keyDisplayVault: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyVaultCaption: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  keyVaultCode: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  currentSecretBanner: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    alignItems: 'center',
  },
  secretBigCode: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginVertical: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 21, 46, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
});
