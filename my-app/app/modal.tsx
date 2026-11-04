import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors, { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import { MobileStorageService, BusinessProfile } from '@/services/storage';
import {
  MobileLicenseService,
  LicenseInfo,
  SAMPLE_WORKING_LICENSES,
} from '@/services/licensing';
import {
  MobileSecurityService,
  SecuritySettings,
} from '@/services/security';
import { MobileAuthService, UserSession } from '@/services/auth';
import { MobileAdminService, FraudCategory, TicketCategory } from '@/services/admin';
import { MobileBackupService } from '@/services/backup';
import { MobileExchangeService, ExchangeRateConfig } from '@/services/exchangeRates';
import { MobileSyncService, SyncStatus } from '@/services/sync';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Button } from '@/components/M3/M3Button';
import { M3Input } from '@/components/M3/M3Input';
import { useLanguage } from '@/context/LanguageContext';
import { useAppearance } from '@/context/AppearanceContext';
import { AppLogo } from '@/components/BrandLogos';

export default function ModalScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { language, setLanguage, t, supportedLanguages, activeLanguageInfo } = useLanguage();
  const { navBarStyle, palette } = useAppearance();

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [showLicenseInput, setShowLicenseInput] = useState(false);
  const [showPinSection, setShowPinSection] = useState(false);

  // Rates State
  const [rates, setRates] = useState<ExchangeRateConfig | null>(null);
  const [editZwgRate, setEditZwgRate] = useState('28.0');
  const [editZarRate, setEditZarRate] = useState('18.0');
  const [showRatesSection, setShowRatesSection] = useState(false);

  // Backup & Sync State
  const [showBackupSection, setShowBackupSection] = useState(false);
  const [backupJson, setBackupJson] = useState('');
  const [restoreInput, setRestoreInput] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // PIN Form State
  const [newPin, setNewPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');

  // User Profile / Username State
  const [showProfileSection, setShowProfileSection] = useState(false);
  const [editUsername, setEditUsername] = useState('Mr Q');
  const [editStallName, setEditStallName] = useState('Mbare Fresh Produce & Tuckshop');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Report Problem to Admin Support State
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [problemSubject, setProblemSubject] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [problemCategory, setProblemCategory] = useState<TicketCategory>('bug_report');

  // Report Scammer / Defaulter to Admin Watchlist State
  const [showScammerForm, setShowScammerForm] = useState(false);
  const [scammerName, setScammerName] = useState('');
  const [scammerPhone, setScammerPhone] = useState('');
  const [scammerAmount, setScammerAmount] = useState('');
  const [scammerEvidence, setScammerEvidence] = useState('');
  const [scammerCategory, setScammerCategory] = useState<FraudCategory>('fake_ecocash_sms');

  const handleReportProblemToAdmin = async () => {
    if (!problemSubject.trim() || !problemDesc.trim()) {
      Alert.alert('Missing Details', 'Please enter a short subject and description of the problem.');
      return;
    }
    await MobileAdminService.submitSupportTicket({
      userId: session?.userId || 'usr_active',
      userName: session?.name || editUsername || 'Trader',
      userEmail: session?.email || 'trader@cashflowmate.co.zw',
      businessName: business?.name || editStallName || 'Market Stall',
      city: 'Harare',
      category: problemCategory,
      priority: 'high',
      subject: problemSubject.trim(),
      description: problemDesc.trim(),
    });
    setProblemSubject('');
    setProblemDesc('');
    setShowProblemForm(false);
    Alert.alert(
      'Ticket Sent to Admin HQ',
      'Your problem report has been logged in the Admin Support Helpdesk queue.'
    );
  };

  const handleFlagIndividualToAdmin = async () => {
    if (!scammerName.trim() || !scammerPhone.trim() || !scammerEvidence.trim()) {
      Alert.alert(
        'Missing Details',
        'Please enter the person name, phone number, and what happened.'
      );
      return;
    }
    await MobileAdminService.addReportedIndividual({
      reportedName: scammerName.trim(),
      phoneNumber: scammerPhone.trim(),
      cityMarket: 'Harare Market',
      category: scammerCategory,
      severity: 'high',
      reportedByTrader: `${session?.name || editUsername} (${business?.name || editStallName})`,
      reportedByEmail: session?.email || 'trader@cashflowmate.co.zw',
      amountInvolvedUsd: Number(scammerAmount) || 0,
      evidenceSummary: scammerEvidence.trim(),
    });
    setScammerName('');
    setScammerPhone('');
    setScammerAmount('');
    setScammerEvidence('');
    setShowScammerForm(false);
    Alert.alert(
      'Reported to Admin Watchlist',
      'This individual has been flagged for the Admin Trust & Safety team.'
    );
  };

  useEffect(() => {
    MobileStorageService.getBusiness().then((biz) => {
      setBusiness(biz);
      if (biz?.name) setEditStallName(biz.name);
    });
    MobileLicenseService.getActiveLicense().then((lic) => {
      setLicense(lic);
      setKeyInput(lic.key);
    });
    MobileSecurityService.getSecuritySettings().then(setSecurity);
    MobileAuthService.getSession().then((sess) => {
      setSession(sess);
      if (sess?.username || sess?.name) {
        setEditUsername(sess.username || sess.name);
      }
    });
    MobileExchangeService.getRates().then((r) => {
      setRates(r);
      setEditZwgRate(String(r.usdToZwg));
      setEditZarRate(String(r.usdToZar));
    });
    MobileSyncService.getSyncStatus().then(setSyncStatus);
  }, []);

  const handleSaveProfile = async () => {
    const cleanUser = editUsername.trim();
    const cleanStall = editStallName.trim();
    if (!cleanUser) {
      Alert.alert('Empty Username', 'Please enter a valid username.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const updatedSess = await MobileAuthService.updateSession({
        username: cleanUser,
        name: cleanUser,
        ...(cleanStall ? { businessName: cleanStall } : {}),
      });
      const updatedBiz = await MobileStorageService.updateBusiness({
        ownerName: cleanUser,
        ...(cleanStall ? { name: cleanStall } : {}),
      });
      setSession(updatedSess);
      setBusiness(updatedBiz);
      Alert.alert('Profile Saved', `Username set to "${cleanUser}".`);
      setShowProfileSection(false);
    } catch {
      Alert.alert('Error', 'Failed to save profile settings.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleActivate = async (keyToUse?: string) => {
    const targetKey = (keyToUse || keyInput).trim();
    if (!targetKey) {
      Alert.alert('Empty Key', 'Please enter a valid CashFlow Mate license key.');
      return;
    }

    setIsActivating(true);
    const result = await MobileLicenseService.activateLicense(targetKey);
    setIsActivating(false);

    if (result.isValid) {
      setLicense(result);
      setKeyInput(result.key);
      Alert.alert(
        'License Activated',
        `${result.tier.toUpperCase()} tier unlocked for ${result.traderName} until ${result.expiresAt}.`
      );
    } else {
      Alert.alert('Activation Failed', result.errorMessage || 'Invalid license key.');
    }
  };

  const handleTogglePrivacy = async () => {
    const updatedVal = await MobileSecurityService.togglePrivacyMask();
    setSecurity((prev) => prev ? { ...prev, isPrivacyMaskActive: updatedVal } : null);
  };

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(newPin.trim())) {
      Alert.alert('Invalid PIN', 'Please enter exactly 4 numbers (0-9).');
      return;
    }

    try {
      await MobileSecurityService.setPin(newPin.trim());
      const updated = await MobileSecurityService.getSecuritySettings();
      setSecurity(updated);
      setNewPin('');
      setShowPinSection(false);
      Alert.alert('PIN Locked', 'Your market till is now secured with a 4-digit master PIN.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not set PIN.');
    }
  };

  const handleRemovePin = async () => {
    if (!currentPin.trim()) {
      Alert.alert('Verification Required', 'Enter your current 4-digit PIN to remove protection.');
      return;
    }

    const removed = await MobileSecurityService.removePin(currentPin.trim());
    if (removed) {
      const updated = await MobileSecurityService.getSecuritySettings();
      setSecurity(updated);
      setCurrentPin('');
      setShowPinSection(false);
      Alert.alert('PIN Removed', 'Market till PIN protection has been disabled.');
    } else {
      Alert.alert('Incorrect PIN', 'The current PIN you entered is not correct.');
    }
  };

  const handleReset = () => {
    Alert.alert('Restore Demo Data', 'Restore the synthetic Harare tuckshop records?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: async () => {
          await MobileStorageService.resetDemoData();
          Alert.alert('Restored', 'Harare demo dataset restored successfully.');
        },
      },
    ]);
  };

  const handleSaveRates = async () => {
    const zwg = parseFloat(editZwgRate);
    const zar = parseFloat(editZarRate);
    if (!zwg || zwg <= 0 || !zar || zar <= 0) {
      Alert.alert('Invalid Rates', 'Exchange rates must be positive numbers.');
      return;
    }
    const updated = await MobileExchangeService.updateRates({ usdToZwg: zwg, usdToZar: zar });
    setRates(updated);
    setShowRatesSection(false);
    Alert.alert('Rates Saved', `Active market rates updated: 1 USD = ${updated.usdToZwg} ZiG | 1 USD = ${updated.usdToZar} ZAR.`);
  };

  const handleExportBackup = async () => {
    try {
      const json = await MobileBackupService.createBackup();
      setBackupJson(json);
      Alert.alert('Backup Created', `Full till database exported (${json.length} bytes). Validated with SHA-256 integrity checksum.`);
    } catch (e: any) {
      Alert.alert('Backup Error', e.message || 'Could not export backup.');
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreInput.trim()) {
      Alert.alert('Empty Input', 'Please paste a valid CashFlow Mate backup JSON string.');
      return;
    }
    try {
      const res = await MobileBackupService.restoreBackup(restoreInput);
      setRestoreInput('');
      setShowBackupSection(false);
      Alert.alert(
        'Database Restored',
        `Successfully restored ${res.transactionsCount} transactions and ${res.debtsCount} customer debts for ${res.businessName}.`
      );
    } catch (e: any) {
      Alert.alert('Restore Failed', e.message || 'Corrupted or incompatible backup format.');
    }
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    const status = await MobileSyncService.syncWithCloud();
    setSyncStatus(status);
    setIsSyncing(false);
    Alert.alert(
      status.status === 'synced' ? 'Cloud Synced' : 'Offline Notice',
      status.message
    );
  };

  const handleSignOut = async () => {
    await MobileAuthService.logout();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.assign('/login');
      return;
    }
    router.replace('/login' as any);
  };

  const userDisplayName = session?.username || session?.name || business?.ownerName || 'Mr Q';

  return (
    <View style={styles.screenWrapper}>
      {/* 1. Top Emerald Header (Directly from Screen 2) */}
      <View style={styles.emeraldHeader}>
        <View style={styles.topNavRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Profile & Security</Text>
          <Pressable
            onPress={() => router.push('/appearance' as any)}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Open Appearance and Theme Settings"
          >
            <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Overlapping Hero Profile Card (Directly from Screen 2) */}
        <View style={styles.heroProfileCard}>
          {/* Centered Circular Avatar with Camera Badge */}
          <Pressable
            onPress={() => router.push('/profile' as any)}
            accessibilityRole="button"
            accessibilityLabel="Edit profile and photo"
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarCircle}>
              {business?.avatarUri ? (
                <Image source={{ uri: business.avatarUri }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={32} color={EmeraldTokens.deepPine} />
              )}
            </View>
            <View style={styles.avatarCameraBadge}>
              <Ionicons name="camera" size={13} color="#FFFFFF" />
            </View>
          </Pressable>

          <Text style={styles.profileName} numberOfLines={2}>
            {userDisplayName}
          </Text>
          <Text style={styles.profileContact}>
            {business?.name || 'Mbare Fresh Produce & Tuckshop'} &bull; {business?.city || 'Harare'}, Zimbabwe
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.mintChip}>
              <Text style={styles.mintChipText}>
                {license?.isValid
                  ? `${license.tier.toUpperCase()} TIER \u2022 ${(business?.city || 'Harare').toUpperCase()}`
                  : 'STARTER TIER'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/profile' as any)}
              style={styles.editProfileBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit profile details and photo"
            >
              <Ionicons name="create-outline" size={13} color={EmeraldTokens.deepPine} />
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. "General" Settings Section (Directly from Screen 2) */}
        <Text style={styles.sectionHeading}>General & Security</Text>

        <View style={styles.settingsGroup}>
          {/* Item 00: Appearance & Nav Bar Studio */}
          <Pressable
            onPress={() => router.push('/appearance' as any)}
            style={styles.settingItem}
            accessibilityRole="button"
            accessibilityLabel="Customize App Appearance and Navigation Bar"
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="color-palette-outline" size={18} color="#7E22CE" />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Appearance & Nav Bar Studio</Text>
                <Text style={styles.settingSub} numberOfLines={1}>
                  {navBarStyle.replace('_', ' ')} • {palette.name}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={EmeraldTokens.textSubtle} />
          </Pressable>

          {/* Item 0: Trader Profile & Photo */}
          <Pressable
            onPress={() => router.push('/profile' as any)}
            style={styles.settingItem}
            accessibilityRole="button"
            accessibilityLabel="Manage Trader Profile, Photo and Details"
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelIndigo }]}>
                <Ionicons name="person-outline" size={18} color={EmeraldTokens.pastelIndigoText} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Trader Profile & Photo</Text>
                <Text style={styles.settingSub} numberOfLines={1}>
                  {userDisplayName} • Photo, bio & tuckshop presets
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={EmeraldTokens.textSubtle}
            />
          </Pressable>

          {/* Expandable Trader Profile & Username Box */}
          {showProfileSection && (
            <View style={styles.expandedSectionBox}>
              <Text style={styles.pinExplanation}>
                Customize your display username. This appears on your Home dashboard greeting.
              </Text>

              <M3Input
                label="Username / Trader Display Name"
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="e.g. Mr Q"
                autoCapitalize="words"
              />

              <M3Input
                label="Stall / Business Name"
                value={editStallName}
                onChangeText={setEditStallName}
                placeholder="e.g. Mbare Fresh Produce & Tuckshop"
                autoCapitalize="words"
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <M3Button
                    label={isSavingProfile ? 'SAVING...' : 'SAVE USERNAME'}
                    variant="mint"
                    size="md"
                    onPress={handleSaveProfile}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <M3Button
                    label="SWITCH ACCOUNT"
                    variant="outlined"
                    size="md"
                    onPress={handleSignOut}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Item 1: Language Setup */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelMint }]}>
                <Ionicons name="language-outline" size={18} color={EmeraldTokens.pastelMintText} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>{t('language_setup')}</Text>
                <Text style={styles.settingSub}>
                  {t('language_active')} {activeLanguageInfo.nativeName}
                </Text>
              </View>
            </View>
            <View style={styles.langToggle}>
              {supportedLanguages.map((item) => {
                const isActive = language === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setLanguage(item.id)}
                    style={[styles.langChip, isActive && styles.langChipActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Switch language to ${item.name}`}
                  >
                    <Text style={[styles.langText, isActive && styles.langTextActive]}>
                      {item.code}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Item 2: Till Master PIN Protection */}
          <Pressable
            onPress={() => setShowPinSection(!showPinSection)}
            style={styles.settingItem}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: security?.isPinSet ? EmeraldTokens.pastelMint : EmeraldTokens.pastelRose }]}>
                <Ionicons
                  name={security?.isPinSet ? "lock-closed" : "lock-open-outline"}
                  size={18}
                  color={security?.isPinSet ? EmeraldTokens.pastelMintText : EmeraldTokens.pastelRoseText}
                />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Market Till Master PIN</Text>
                <Text style={styles.settingSub}>
                  {security?.isPinSet ? '4-Digit PIN Lock Engaged' : 'Not protected • Tap to lock'}
                </Text>
              </View>
            </View>
            <Ionicons
              name={showPinSection ? 'chevron-up' : 'chevron-forward'}
              size={18}
              color={EmeraldTokens.textSubtle}
            />
          </Pressable>

          {/* Expandable PIN Setup Box */}
          {showPinSection && (
            <View style={styles.expandedSectionBox}>
              <Text style={styles.pinExplanation}>
                Protect your cash records from market bystanders and unapproved counter staff.
              </Text>
              
              <M3Input
                label={security?.isPinSet ? 'Set New 4-Digit PIN' : 'Enter 4-Digit PIN'}
                value={newPin}
                onChangeText={setNewPin}
                placeholder="e.g. 1984"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />

              <M3Button
                label={security?.isPinSet ? "UPDATE MASTER PIN" : "LOCK TILL WITH PIN"}
                variant="mint"
                size="md"
                onPress={handleSavePin}
                style={{ marginTop: 8 }}
              />

              {security?.isPinSet && (
                <View style={styles.removePinBox}>
                  <Text style={styles.removePinHeader}>Disable PIN Protection:</Text>
                  <M3Input
                    label="Current PIN"
                    value={currentPin}
                    onChangeText={setCurrentPin}
                    placeholder="Enter current PIN"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                  <M3Button
                    label="REMOVE PIN"
                    variant="outlined"
                    size="sm"
                    onPress={handleRemovePin}
                    style={{ marginTop: 6 }}
                  />
                </View>
              )}
            </View>
          )}

          {/* Item 3: Counter Privacy Shield */}
          <Pressable onPress={handleTogglePrivacy} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelAmber }]}>
                <Ionicons
                  name={security?.isPrivacyMaskActive ? "eye-off" : "eye-outline"}
                  size={18}
                  color={EmeraldTokens.pastelAmberText}
                />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Counter Privacy Shield</Text>
                <Text style={styles.settingSub}>
                  {security?.isPrivacyMaskActive ? 'Hiding figures (••••)' : 'Displaying real amounts'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusToggleBadge, security?.isPrivacyMaskActive && styles.statusToggleBadgeActive]}>
              <Text style={[styles.statusToggleText, security?.isPrivacyMaskActive && styles.statusToggleTextActive]}>
                {security?.isPrivacyMaskActive ? 'ON' : 'OFF'}
              </Text>
            </View>
          </Pressable>

          {/* Item 4: License Activation */}
          <Pressable
            onPress={() => setShowLicenseInput(!showLicenseInput)}
            style={styles.settingItem}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelRose }]}>
                <Ionicons name="key-outline" size={18} color={EmeraldTokens.pastelRoseText} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>License & Activation</Text>
                <Text style={styles.settingSub}>
                  {license?.isValid ? `${license.tier.toUpperCase()} Valid` : 'Starter'}
                </Text>
              </View>
            </View>
            <Ionicons
              name={showLicenseInput ? 'chevron-up' : 'chevron-forward'}
              size={18}
              color={EmeraldTokens.textSubtle}
            />
          </Pressable>

          {/* Expandable License Activation Section */}
          {showLicenseInput && (
            <View style={styles.expandedSectionBox}>
              <M3Input
                label="Software Activation Key"
                value={keyInput}
                onChangeText={setKeyInput}
                placeholder="CFM-PRO-XXXX-XXXX"
              />
              <M3Button
                label={isActivating ? 'Verifying...' : 'ACTIVATE KEY'}
                variant="mint"
                size="md"
                onPress={() => handleActivate()}
                style={{ marginTop: 8 }}
              />

              <Text style={styles.sampleHeader}>One-Tap Test Working Licenses:</Text>
              <View style={styles.sampleGrid}>
                {SAMPLE_WORKING_LICENSES.slice(0, 3).map((lic, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setKeyInput(lic.key);
                      handleActivate(lic.key);
                    }}
                    style={styles.sampleBadge}
                  >
                    <Text style={styles.sampleBadgeText}>{lic.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Item 4b: Market Exchange Rates Setup */}
          <Pressable
            onPress={() => setShowRatesSection(!showRatesSection)}
            style={styles.settingItem}
            accessibilityRole="button"
            accessibilityLabel="Configure Market Exchange Rates"
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelAmber }]}>
                <Ionicons name="swap-horizontal" size={18} color={EmeraldTokens.pastelAmberText} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Market Exchange Rates</Text>
                <Text style={styles.settingSub}>
                  1 USD = {rates?.usdToZwg || 28} ZiG &bull; 1 USD = {rates?.usdToZar || 18} ZAR
                </Text>
              </View>
            </View>
            <Ionicons
              name={showRatesSection ? 'chevron-up' : 'chevron-forward'}
              size={18}
              color={EmeraldTokens.textSubtle}
            />
          </Pressable>

          {showRatesSection && (
            <View style={styles.expandedSectionBox}>
              <Text style={styles.pinExplanation}>
                Customize street / interbank exchange rates to calculate your unified USD portfolio net worth.
              </Text>
              <M3Input
                label="ZiG per 1 USD (EcoCash Rate)"
                value={editZwgRate}
                onChangeText={setEditZwgRate}
                keyboardType="decimal-pad"
              />
              <M3Input
                label="ZAR Rand per 1 USD"
                value={editZarRate}
                onChangeText={setEditZarRate}
                keyboardType="decimal-pad"
              />
              <M3Button
                label="SAVE EXCHANGE RATES"
                variant="mint"
                size="md"
                onPress={handleSaveRates}
                style={{ marginTop: 8 }}
              />
            </View>
          )}

          {/* Item 4c: Encrypted Backup & Restore */}
          <Pressable
            onPress={() => setShowBackupSection(!showBackupSection)}
            style={styles.settingItem}
            accessibilityRole="button"
            accessibilityLabel="Backup and Restore Database"
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelMint }]}>
                <Ionicons name="cloud-download-outline" size={18} color={EmeraldTokens.pastelMintText} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Backup & Restore Ledger</Text>
                <Text style={styles.settingSub}>Export/import portable JSON archive</Text>
              </View>
            </View>
            <Ionicons
              name={showBackupSection ? 'chevron-up' : 'chevron-forward'}
              size={18}
              color={EmeraldTokens.textSubtle}
            />
          </Pressable>

          {showBackupSection && (
            <View style={styles.expandedSectionBox}>
              <Text style={styles.pinExplanation}>
                Create an encrypted, tamper-evident JSON backup of all transactions, debts, and settings.
              </Text>
              <M3Button
                label="EXPORT FULL JSON BACKUP"
                variant="mint"
                size="md"
                onPress={handleExportBackup}
                style={{ marginBottom: 12 }}
              />

              {backupJson ? (
                <View style={styles.backupOutputBox}>
                  <Text style={styles.backupOutputTitle}>Backup Payload Ready ({backupJson.length} bytes):</Text>
                  <Text style={styles.backupOutputText} numberOfLines={4}>
                    {backupJson}
                  </Text>
                </View>
              ) : null}

              <Text style={[styles.settingLabel, { marginTop: 12, marginBottom: 8 }]}>Restore from JSON Backup</Text>
              <M3Input
                label="Paste Backup JSON Content"
                placeholder='Paste {"version": 1, ...}'
                value={restoreInput}
                onChangeText={setRestoreInput}
                multiline
                numberOfLines={3}
              />
              <M3Button
                label="VERIFY & RESTORE DATABASE"
                variant="tonal"
                size="md"
                onPress={handleRestoreBackup}
                style={{ marginTop: 8 }}
              />
            </View>
          )}

          {/* Item 4d: Cloud Sync Bridge */}
          <Pressable
            onPress={handleSyncCloud}
            style={styles.settingItem}
            accessibilityRole="button"
            accessibilityLabel="Sync with cloud server"
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelSky }]}>
                <Ionicons name="sync-outline" size={18} color={EmeraldTokens.pastelSkyText} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Cloud Ledger Synchronization</Text>
                <Text style={styles.settingSub} numberOfLines={2}>
                  {isSyncing ? 'Syncing...' : syncStatus?.message || 'Tap to sync records'}
                </Text>
              </View>
            </View>
            <Ionicons name="cloud-upload-outline" size={18} color={EmeraldTokens.deepPine} />
          </Pressable>

          {/* Item 5: Multi-Currency Till Drawers */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelSky }]}>
                <Ionicons name="wallet-outline" size={18} color={EmeraldTokens.pastelSkyText} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Active Till Drawers</Text>
                <Text style={styles.settingSub}>USD Cash &bull; EcoCash ZiG &bull; ZAR Rand</Text>
              </View>
            </View>
            <M3Badge label="3 CURRENCIES" variant="mint" />
          </View>

          {/* Item 6: Privacy & MIT Licensing */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelMint }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={EmeraldTokens.pastelMintText} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Privacy & Copyright</Text>
                <Text style={styles.settingSub}>MIT License &bull; Mr Q</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={EmeraldTokens.textSubtle} />
          </View>

          {/* Item 6b: Report a Problem to Admin Support */}
          <Pressable
            onPress={() => setShowProblemForm(!showProblemForm)}
            style={styles.settingItem}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelAmber }]}>
                <Ionicons name="construct-outline" size={18} color={EmeraldTokens.pastelAmberText} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Report a Problem to Admin HQ</Text>
                <Text style={styles.settingSub}>Submit app bug, CSV error, or support ticket</Text>
              </View>
            </View>
            <Ionicons
              name={showProblemForm ? 'chevron-up' : 'chevron-forward'}
              size={18}
              color={EmeraldTokens.textSubtle}
            />
          </Pressable>

          {showProblemForm && (
            <View style={styles.expandedSectionBox}>
              <Text style={styles.pinExplanation}>
                Describe the problem you are experiencing. It will appear immediately in the Admin
                Support Helpdesk queue.
              </Text>
              <M3Input
                label="Problem Subject"
                value={problemSubject}
                onChangeText={setProblemSubject}
                placeholder="e.g., EcoCash SMS amount not parsing"
              />
              <M3Input
                label="Detailed Description"
                value={problemDesc}
                onChangeText={setProblemDesc}
                placeholder="Explain what happened..."
                multiline
                numberOfLines={3}
              />
              <M3Button
                label="SEND TICKET TO ADMIN SUPPORT"
                variant="mint"
                size="md"
                onPress={handleReportProblemToAdmin}
                style={{ marginTop: 8 }}
              />
            </View>
          )}

          {/* Item 6c: Report Fraudulent Individual / Defaulter to Watchlist */}
          <Pressable
            onPress={() => setShowScammerForm(!showScammerForm)}
            style={styles.settingItem}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelRose }]}>
                <Ionicons name="warning-outline" size={18} color={EmeraldTokens.pastelRoseText} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Flag Scammer or Credit Defaulter</Text>
                <Text style={styles.settingSub}>Alert Admin & network watchlist of fraud</Text>
              </View>
            </View>
            <Ionicons
              name={showScammerForm ? 'chevron-up' : 'chevron-forward'}
              size={18}
              color={EmeraldTokens.textSubtle}
            />
          </Pressable>

          {showScammerForm && (
            <View style={styles.expandedSectionBox}>
              <Text style={styles.pinExplanation}>
                Report a fake EcoCash SMS sender, counterfeit note suspect, or runaway credit
                defaulter to the Admin Trust & Safety team.
              </Text>
              <M3Input
                label="Individual Name or Alias"
                value={scammerName}
                onChangeText={setScammerName}
                placeholder="e.g., Blessing Chikwanda"
              />
              <M3Input
                label="Phone Number"
                value={scammerPhone}
                onChangeText={setScammerPhone}
                placeholder="e.g., +263 77..."
              />
              <M3Input
                label="USD Amount Involved ($)"
                value={scammerAmount}
                onChangeText={setScammerAmount}
                placeholder="e.g., 120"
                keyboardType="decimal-pad"
              />
              <M3Input
                label="Incident Evidence Summary"
                value={scammerEvidence}
                onChangeText={setScammerEvidence}
                placeholder="Describe fake SMS, defaulted invoice, or scam..."
                multiline
                numberOfLines={3}
              />
              <M3Button
                label="SUBMIT TO ADMIN FRAUD WATCHLIST"
                variant="filled"
                size="md"
                onPress={handleFlagIndividualToAdmin}
                style={{ marginTop: 8 }}
              />
            </View>
          )}

          {/* Item 7: Restore Demo Data */}
          <Pressable onPress={handleReset} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelIndigo }]}>
                <Ionicons name="refresh-outline" size={18} color={EmeraldTokens.pastelIndigoText} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Reset Harare Demo Data</Text>
                <Text style={styles.settingSub}>Restore synthetic sample records</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={EmeraldTokens.textSubtle} />
          </Pressable>
        </View>

        {/* App Branding & Version Card */}
        <View style={{ alignItems: 'center', marginBottom: 20, marginTop: 8 }}>
          <AppLogo size={48} />
          <Text style={{ fontSize: 14, fontWeight: '800', color: EmeraldTokens.textMain, marginTop: 8 }}>
            CashFlow Mate
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: EmeraldTokens.textSubtle, marginTop: 2 }}>
            ZIM MARKET TILL OS • v1.2.0
          </Text>
        </View>

        {/* 4. Bottom Full Pill Mint Action Button (Directly from Screen 2) */}
        <View style={styles.bottomCtaContainer}>
          <M3Button
            label="DONE & RETURN"
            variant="mint"
            size="lg"
            onPress={() => router.back()}
          />
          <View style={{ marginTop: 12 }}>
            <M3Button
              label="SIGN OUT OF TILL"
              variant="outlined"
              size="md"
              onPress={handleSignOut}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: EmeraldTokens.deepPine,
  },
  emeraldHeader: {
    backgroundColor: EmeraldTokens.deepPine,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  sheetContainer: {
    flex: 1,
    backgroundColor: EmeraldTokens.canvasLight,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Hero Profile Card (Screen 2)
  heroProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  avatarWrapper: {
    marginTop: 0,
    marginBottom: 14,
    position: 'relative',
    alignSelf: 'center',
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    borderWidth: 3,
    borderColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: EmeraldTokens.deepPine,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginBottom: 3,
    textAlign: 'center',
  },
  profileContact: {
    fontSize: 13,
    color: EmeraldTokens.textMuted,
    marginBottom: 12,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mintChip: {
    backgroundColor: EmeraldTokens.pastelMint,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: DesignTokens.shapes.pill,
  },
  mintChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: EmeraldTokens.pastelMintText,
    letterSpacing: 0.4,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5EF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: DesignTokens.shapes.pill,
    borderWidth: 1,
    borderColor: '#CDE9DE',
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: EmeraldTokens.deepPine,
  },

  // General Settings Section
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginBottom: 12,
    paddingLeft: 4,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
    minWidth: 0,
  },
  settingTextCol: {
    flex: 1,
    minWidth: 0,
  },
  iconSquircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: EmeraldTokens.textSlate,
  },
  settingSub: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    marginTop: 2,
  },

  // Language Toggle
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F3',
    borderRadius: DesignTokens.shapes.pill,
    padding: 2,
    gap: 2,
  },
  langChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: DesignTokens.shapes.pill,
  },
  langChipActive: {
    backgroundColor: EmeraldTokens.deepPine,
  },
  langText: {
    fontSize: 11,
    fontWeight: '600',
    color: EmeraldTokens.textMuted,
  },
  langTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Status Toggle Badge (e.g. for Privacy Mask)
  statusToggleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DesignTokens.shapes.pill,
    backgroundColor: '#F1F5F3',
  },
  statusToggleBadgeActive: {
    backgroundColor: EmeraldTokens.mintCta,
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: EmeraldTokens.textMuted,
  },
  statusToggleTextActive: {
    color: EmeraldTokens.deepPine,
  },

  // Expanded Section Box
  expandedSectionBox: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
  },
  pinExplanation: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  removePinBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.05)',
  },
  removePinHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: EmeraldTokens.textMuted,
    marginBottom: 6,
  },

  sampleHeader: {
    fontSize: 11,
    color: EmeraldTokens.textMuted,
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '600',
  },
  sampleGrid: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  sampleBadge: {
    backgroundColor: '#F1F5F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: DesignTokens.shapes.pill,
  },
  sampleBadgeText: {
    fontSize: 11,
    color: EmeraldTokens.deepPine,
    fontWeight: '600',
  },

  backupOutputBox: {
    backgroundColor: '#F7F9FC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
  },
  backupOutputTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: EmeraldTokens.deepPine,
    marginBottom: 4,
  },
  backupOutputText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: EmeraldTokens.textMuted,
  },

  bottomCtaContainer: {
    marginTop: 24,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
});
