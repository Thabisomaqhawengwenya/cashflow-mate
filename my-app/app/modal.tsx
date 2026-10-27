import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors, { EmeraldTokens } from '@/constants/Colors';
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
import { MobileBackupService } from '@/services/backup';
import { MobileExchangeService, ExchangeRateConfig } from '@/services/exchangeRates';
import { MobileSyncService, SyncStatus } from '@/services/sync';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Button } from '@/components/M3/M3Button';
import { M3Input } from '@/components/M3/M3Input';

export default function ModalScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [showLicenseInput, setShowLicenseInput] = useState(false);
  const [showPinSection, setShowPinSection] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'SN'>('EN');

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

  useEffect(() => {
    MobileStorageService.getBusiness().then(setBusiness);
    MobileLicenseService.getActiveLicense().then((lic) => {
      setLicense(lic);
      setKeyInput(lic.key);
    });
    MobileSecurityService.getSecuritySettings().then(setSecurity);
    MobileAuthService.getSession().then(setSession);
    MobileExchangeService.getRates().then((r) => {
      setRates(r);
      setEditZwgRate(String(r.usdToZwg));
      setEditZarRate(String(r.usdToZar));
    });
    MobileSyncService.getSyncStatus().then(setSyncStatus);
  }, []);

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
        'License Activated! 🎉',
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
      Alert.alert('PIN Locked! 🔒', 'Your market till is now secured with a 4-digit master PIN.');
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
    Alert.alert('Rates Saved ✅', `Active market rates updated: 1 USD = ${updated.usdToZwg} ZiG | 1 USD = ${updated.usdToZar} ZAR.`);
  };

  const handleExportBackup = async () => {
    try {
      const json = await MobileBackupService.createBackup();
      setBackupJson(json);
      Alert.alert('Backup Created! 📦', `Full till database exported (${json.length} bytes). Validated with SHA-256 integrity checksum.`);
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
        'Database Restored! 🎉',
        `Successfully restored ${res.transactionsCount} transactions and ${res.debtsCount} customer debts for ${res.businessName}.`
      );
    } catch (e: any) {
      Alert.alert('Restore Failed ⚠️', e.message || 'Corrupted or incompatible backup format.');
    }
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    const status = await MobileSyncService.syncWithCloud();
    setSyncStatus(status);
    setIsSyncing(false);
    Alert.alert(
      status.status === 'synced' ? 'Cloud Synced! ☁️' : 'Offline Notice 📱',
      status.message
    );
  };

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
          <View style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Overlapping Hero Profile Card (Directly from Screen 2) */}
        <View style={styles.heroProfileCard}>
          {/* Centered Circular Avatar */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={32} color={EmeraldTokens.deepPine} />
            </View>
          </View>

          <Text style={styles.profileName}>
            Hello, {business?.name || 'Mr Q'}
          </Text>
          <Text style={styles.profileContact}>
            +263 77 123 4567 &bull; Harare, Zimbabwe
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.mintChip}>
              <Text style={styles.mintChipText}>
                {license?.isValid
                  ? `${license.tier.toUpperCase()} TIER &bull; HARARE`
                  : 'STARTER TIER'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. "General" Settings Section (Directly from Screen 2) */}
        <Text style={styles.sectionHeading}>General & Security</Text>

        <View style={styles.settingsGroup}>
          {/* Item 0: Trader Account & Sign In */}
          <Pressable
            onPress={() => router.push('/login')}
            style={styles.settingItem}
            accessibilityRole="button"
            accessibilityLabel="Manage Trader Account"
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelIndigo }]}>
                <Ionicons name="person-outline" size={18} color={EmeraldTokens.pastelIndigoText} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Trader Account</Text>
                <Text style={styles.settingSub}>
                  {session ? `${session.name} • ${session.isDemo ? 'Demo Mode' : session.email}` : 'Tap to sign in or switch account'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={EmeraldTokens.textSubtle} />
          </Pressable>

          {/* Item 1: Language Setup */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelMint }]}>
                <Ionicons name="language-outline" size={18} color={EmeraldTokens.pastelMintText} />
              </View>
              <Text style={styles.settingLabel}>Language Setup</Text>
            </View>
            <View style={styles.langToggle}>
              <Pressable
                onPress={() => setLanguage('SN')}
                style={[styles.langChip, language === 'SN' && styles.langChipActive]}
              >
                <Text style={[styles.langText, language === 'SN' && styles.langTextActive]}>
                  SN
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLanguage('EN')}
                style={[styles.langChip, language === 'EN' && styles.langChipActive]}
              >
                <Text style={[styles.langText, language === 'EN' && styles.langTextActive]}>
                  EN
                </Text>
              </Pressable>
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
              <View>
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
              <View>
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
              <View>
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
              <View>
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
              <View>
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

              <Text style={[styles.inputHeading, { marginTop: 12 }]}>Restore from JSON Backup</Text>
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
              <View>
                <Text style={styles.settingLabel}>Cloud Ledger Synchronization</Text>
                <Text style={styles.settingSub}>
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
              <View>
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
              <View>
                <Text style={styles.settingLabel}>Privacy & Copyright</Text>
                <Text style={styles.settingSub}>MIT License &bull; Mr Q</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={EmeraldTokens.textSubtle} />
          </View>

          {/* Item 7: Restore Demo Data */}
          <Pressable onPress={handleReset} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelIndigo }]}>
                <Ionicons name="refresh-outline" size={18} color={EmeraldTokens.pastelIndigoText} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Reset Harare Demo Data</Text>
                <Text style={styles.settingSub}>Restore synthetic sample records</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={EmeraldTokens.textSubtle} />
          </Pressable>
        </View>

        {/* 4. Bottom Full Pill Mint Action Button (Directly from Screen 2) */}
        <View style={styles.bottomCtaContainer}>
          <M3Button
            label="DONE & RETURN"
            variant="mint"
            size="lg"
            onPress={() => router.back()}
          />
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
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingHorizontal: 20,
    paddingBottom: 48, // generous space for overlapping card
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Overlapping Hero Profile Card (Screen 2)
  heroProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginTop: -32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(12, 62, 53, 0.06)',
    shadowColor: '#0C3E35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrapper: {
    marginTop: -38,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginBottom: 3,
  },
  profileContact: {
    fontSize: 13,
    color: EmeraldTokens.textMuted,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
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

  // General Settings Section
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(12, 62, 53, 0.06)',
    shadowColor: '#0C3E35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    backgroundColor: '#F1F5F3',
    borderRadius: DesignTokens.shapes.pill,
    padding: 3,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    backgroundColor: '#F8FAF9',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(12, 62, 53, 0.08)',
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
  },
});
