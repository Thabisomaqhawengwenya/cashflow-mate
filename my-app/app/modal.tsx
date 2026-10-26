import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert, ScrollView, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import { MobileStorageService, BusinessProfile } from '@/services/storage';
import {
  MobileLicenseService,
  LicenseInfo,
  SAMPLE_WORKING_LICENSES,
} from '@/services/licensing';
import { M3Card } from '@/components/M3/M3Card';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Input } from '@/components/M3/M3Input';
import { Ionicons } from '@expo/vector-icons';

export default function ModalScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    MobileStorageService.getBusiness().then(setBusiness);
    MobileLicenseService.getActiveLicense().then((lic) => {
      setLicense(lic);
      setKeyInput(lic.key);
    });
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
      Alert.alert('License Activated! 🎉', `${result.tier.toUpperCase()} tier unlocked for ${result.traderName} until ${result.expiresAt}.`);
    } else {
      Alert.alert('Activation Failed', result.errorMessage || 'Invalid license key.');
    }
  };

  const handleReset = () => {
    Alert.alert('Reset Demo Data', 'Restore the synthetic Harare tuckshop dataset?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await MobileStorageService.resetDemoData();
          Alert.alert('Restored', 'Demo data restored successfully.');
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
          <Text style={styles.logoText}>CM</Text>
        </View>
        <Text style={[styles.appName, { color: theme.text }]}>CashFlow Mate 🇿🇼</Text>
        <Text style={[styles.appSub, { color: theme.tabIconDefault }]}>
          Mobile Money & Cash-Flow Assistant for Small Traders
        </Text>
      </View>

      {/* Business Profile */}
      <M3Card variant="elevated" style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Active Business Profile</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Business Name:</Text>
          <Text style={[styles.infoVal, { color: theme.text }]}>{business?.name || 'Mbare Fresh Produce'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Business Type:</Text>
          <Text style={[styles.infoVal, { color: theme.text }]}>{business?.businessType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Currency:</Text>
          <M3Badge label={business?.currency || 'USD'} variant="primary" />
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Country:</Text>
          <Text style={[styles.infoVal, { color: theme.text }]}>Zimbabwe</Text>
        </View>
      </M3Card>

      {/* Software Licensing & Activation Card */}
      <M3Card variant="elevated" style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>App License & Activation</Text>
          {license?.isValid ? (
            <M3Badge
              label={`${license.tier.toUpperCase()} ACTIVE`}
              variant={license.tier === 'enterprise' ? 'inflow' : 'primary'}
            />
          ) : (
            <M3Badge label="STARTER TIER" variant="neutral" />
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Licensed To:</Text>
          <Text style={[styles.infoVal, { color: theme.text }]}>{license?.traderName || 'Unregistered'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Expires:</Text>
          <Text style={[styles.infoVal, { color: theme.text }]}>{license?.expiresAt || 'Never'}</Text>
        </View>

        <Text style={[styles.featureHeading, { color: theme.text }]}>Active Tier Features:</Text>
        {license?.features.map((feat, i) => (
          <View key={i} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.inflow} />
            <Text style={[styles.featureText, { color: theme.text }]}>{feat}</Text>
          </View>
        ))}

        {/* License Key Input & Activation */}
        <View style={styles.activateBox}>
          <M3Input
            label="Software License Key"
            placeholder="CFM-PRO-XXXX-XXXX"
            value={keyInput}
            onChangeText={setKeyInput}
          />
          <View style={{ marginTop: 8 }}>
            <M3Button
              label={isActivating ? 'Verifying...' : 'Activate License'}
              icon={<Ionicons name="key-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />}
              variant="filled"
              size="md"
              onPress={() => handleActivate()}
            />
          </View>
        </View>

        {/* Sample Working License Keys to Test */}
        <Text style={[styles.sampleTitle, { color: theme.tabIconDefault }]}>
          Try a Working Test License:
        </Text>
        <View style={styles.sampleRow}>
          {SAMPLE_WORKING_LICENSES.map((lic, idx) => (
            <Pressable
              key={idx}
              onPress={() => {
                setKeyInput(lic.key);
                handleActivate(lic.key);
              }}
              style={[
                styles.sampleChip,
                { backgroundColor: theme.surfaceContainer, borderColor: theme.outlineVariant },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Activate ${lic.label}`}
            >
              <Ionicons name="ribbon-outline" size={14} color={theme.primary} />
              <Text style={[styles.sampleText, { color: theme.primary }]}>{lic.label}</Text>
            </Pressable>
          ))}
        </View>
      </M3Card>

      {/* Design & Architecture */}
      <M3Card variant="elevated" style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Design & Architecture</Text>
        <Text style={[styles.bodyText, { color: theme.tabIconDefault }]}>
          Built strictly following Google Material 3 Expressive guidelines and Mr Q's Pinterest 'app' board geometry: continuous full pill actions, 22px squircle KPI containers, and deterministic zero-drift accounting rules.
        </Text>
        <View style={[styles.legalRow, { borderTopColor: theme.outlineVariant }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={theme.inflow} />
          <Text style={[styles.legalText, { color: theme.tabIconDefault }]}>
            Licensed under the MIT License • Copyright &copy; 2026 Maqhawe T Ngwenya
          </Text>
        </View>
      </M3Card>

      <View style={styles.actionSection}>
        <M3Button
          label="Reset Harare Tuckshop Demo Data"
          variant="outlined"
          onPress={handleReset}
          icon={<Ionicons name="refresh-outline" size={16} color={theme.primary} />}
          style={{ width: '100%' }}
        />
      </View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: DesignTokens.spacing.gutter,
    alignItems: 'center',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: DesignTokens.spacing.gapLg,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: DesignTokens.shapes.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
  },
  appSub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    padding: DesignTokens.spacing.cardPadding,
    marginBottom: DesignTokens.spacing.gapMd,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  featureHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activateBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E022',
  },
  sampleTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  sampleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: DesignTokens.shapes.pill,
    borderWidth: 1,
  },
  sampleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  legalText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  actionSection: {
    width: '100%',
    marginTop: DesignTokens.spacing.gapSm,
  },
});
