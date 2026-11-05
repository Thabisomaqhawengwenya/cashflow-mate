import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { EmeraldTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { CurrencyCode } from '@/services/storage';
import { MobileAuthService, UserSession } from '@/services/auth';
import { M3Input } from '@/components/M3/M3Input';
import { M3Button } from '@/components/M3/M3Button';
import { AppLogo } from '@/components/BrandLogos';

const TRADING_SECTORS = [
  'Tuckshop & Grocery',
  'Fresh Farm Produce',
  'Clothing & Bales',
  'Electronics & Phones',
  'Wholesale & Distribution',
  'EcoCash & Money Agency',
  'Hardware & Spares',
  'Salon & Cosmetics',
];

const MARKET_LOCATIONS = [
  'Harare (Mbare Musika)',
  'Harare (CBD)',
  'Bulawayo (CBD)',
  'Bulawayo (Renkini)',
  'Gweru (Kwekwe Road)',
  'Mutare (Sakubva)',
  'Masvingo (Mucheke)',
  'Beitbridge Border',
  'Chitungwiza (Makoni)',
];

const OPERATING_HOURS_OPTIONS = [
  '6:00 AM - 6:00 PM (Mon - Sat)',
  '7:00 AM - 8:00 PM (Daily)',
  '6:00 AM - 1:00 PM (Market Morning)',
  '8:00 AM - 5:00 PM (Weekdays)',
  '24/7 Continuous Booth',
];

const CURRENCY_OPTIONS: Array<{ code: CurrencyCode; label: string }> = [
  { code: 'USD', label: 'USD ($ Cash Drawer)' },
  { code: 'ZWG', label: 'ZiG (EcoCash / ZWG)' },
  { code: 'ZAR', label: 'ZAR (Rand Float)' },
];

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'sn', name: 'ChiShona' },
  { code: 'nd', name: 'SiNdebele' },
];

export default function OnboardingScreen() {
  const [session, setSession] = useState<UserSession | null>(null);

  // User Customizable Profile Fields
  const [businessName, setBusinessName] = useState('');
  const [tradingSector, setTradingSector] = useState('Tuckshop & Grocery');
  const [marketLocation, setMarketLocation] = useState('Harare (Mbare Musika)');
  const [tagline, setTagline] = useState('Fresh quality produce and cold drinks daily.');
  const [operatingHours, setOperatingHours] = useState('6:00 AM - 6:00 PM (Mon - Sat)');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [preferredLang, setPreferredLang] = useState('en');
  const [startingFloat, setStartingFloat] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sess = await MobileAuthService.getSession();
      if (!sess) {
        router.replace('/login' as any);
        return;
      }
      setSession(sess);
      setCurrency(sess.currency || 'USD');
      setBusinessName(sess.businessName || `${sess.name}'s Stall`);
      if (sess.city) setMarketLocation(sess.city);
      if (sess.tagline) setTagline(sess.tagline);
      if (sess.operatingHours) setOperatingHours(sess.operatingHours);
    })();
  }, []);

  const handleFinishOnboarding = async () => {
    setError(null);
    if (!businessName.trim()) {
      setError('Please provide a name for your stall or business.');
      return;
    }

    const floatNum = parseFloat(startingFloat) || 0;
    if (floatNum < 0) {
      setError('Starting float cannot be negative.');
      return;
    }

    setIsLoading(true);
    try {
      await MobileAuthService.completeOnboarding({
        currency,
        businessName: businessName.trim(),
        city: marketLocation,
        businessType: tradingSector,
        tagline: tagline.trim(),
        operatingHours,
        preferredLanguage: preferredLang,
        startingFloat: floatNum,
      });
      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Could not complete onboarding setup.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Canvas */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <AppLogo size={56} style={styles.appLogo} />
          </View>
          <Text style={styles.heroTitle}>Customize Your Till</Text>
          <Text style={styles.heroSub}>
            Welcome aboard, {session?.name || 'Trader'}! Choose your stall and market preferences.
          </Text>
        </View>

        {/* Setup Card */}
        <View style={styles.sheetContainer}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* 1. Business / Stall Name */}
          <Text style={styles.sectionLabel}>BUSINESS OR STALL NAME</Text>
          <M3Input
            label="Trading Name"
            placeholder="e.g. Mbare Fresh Produce & Tuckshop"
            value={businessName}
            onChangeText={(txt) => {
              setBusinessName(txt);
              if (error) setError(null);
            }}
          />

          {/* 2. Trading Sector (Screenshot 1) */}
          <Text style={[styles.sectionLabel, { marginTop: 22 }]}>Trading Sector</Text>
          <View style={styles.chipsContainer}>
            {TRADING_SECTORS.map((sector) => {
              const active = tradingSector === sector;
              return (
                <Pressable
                  key={sector}
                  onPress={() => setTradingSector(sector)}
                  style={[styles.pillChip, active && styles.pillChipActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select sector ${sector}`}
                >
                  <Text style={[styles.pillChipText, active && styles.pillChipTextActive]}>
                    {sector}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 3. Market Location / Town (Screenshot 1) */}
          <Text style={[styles.sectionLabel, { marginTop: 22 }]}>Market Location / Town</Text>
          <View style={styles.chipsContainer}>
            {MARKET_LOCATIONS.map((loc) => {
              const active = marketLocation === loc;
              return (
                <Pressable
                  key={loc}
                  onPress={() => setMarketLocation(loc)}
                  style={[styles.pillChip, active && styles.pillChipActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select location ${loc}`}
                >
                  <Text style={[styles.pillChipText, active && styles.pillChipTextActive]}>
                    {loc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 4. Store Motto / Tagline (Screenshot 1) */}
          <Text style={[styles.sectionLabel, { marginTop: 22 }]}>Store Motto / Tagline</Text>
          <M3Input
            label="Tagline"
            placeholder="Fresh quality produce and cold drinks daily."
            value={tagline}
            onChangeText={(txt) => setTagline(txt)}
          />

          {/* 5. Operating Hours & Defaults (Screenshot 2) */}
          <View style={styles.subSectionHeader}>
            <View style={styles.subSectionBadge}>
              <Text style={styles.subSectionBadgeText}>03</Text>
            </View>
            <Text style={styles.subSectionTitle}>Operating Hours & Defaults</Text>
          </View>

          <View style={styles.nestedCard}>
            {/* Operating Hours Chips */}
            <Text style={styles.chipFieldLabel}>Operating Hours</Text>
            <View style={styles.chipsContainer}>
              {OPERATING_HOURS_OPTIONS.map((hours) => {
                const active = operatingHours === hours;
                return (
                  <Pressable
                    key={hours}
                    onPress={() => setOperatingHours(hours)}
                    style={[styles.pillChip, active && styles.pillChipActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select hours ${hours}`}
                  >
                    <Text style={[styles.pillChipText, active && styles.pillChipTextActive]}>
                      {hours}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Primary Till Currency Chips */}
            <Text style={[styles.chipFieldLabel, { marginTop: 18 }]}>Primary Till Currency</Text>
            <View style={styles.chipsContainer}>
              {CURRENCY_OPTIONS.map((item) => {
                const active = currency === item.code;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => setCurrency(item.code)}
                    style={[styles.pillChip, active && styles.pillChipActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select currency ${item.label}`}
                  >
                    <Text style={[styles.pillChipText, active && styles.pillChipTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Preferred Language Chips */}
            <Text style={[styles.chipFieldLabel, { marginTop: 18 }]}>Preferred Language</Text>
            <View style={styles.chipsContainer}>
              {LANGUAGE_OPTIONS.map((item) => {
                const active = preferredLang === item.code;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => setPreferredLang(item.code)}
                    style={[styles.pillChip, active && styles.pillChipActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select language ${item.name}`}
                  >
                    <Text style={[styles.pillChipText, active && styles.pillChipTextActive]}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 6. Starting Cashbox Float (Optional) */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>OPENING CASH FLOAT (OPTIONAL)</Text>
          <Text style={styles.inputHelper}>
            Have cash physically in your till drawer right now? Enter the amount to begin with an accurate balance.
          </Text>
          <M3Input
            label={`Starting Cashbox (${currency})`}
            placeholder="0.00"
            value={startingFloat}
            onChangeText={(val) => {
              setStartingFloat(val.replace(/[^0-9.]/g, ''));
              if (error) setError(null);
            }}
            keyboardType="decimal-pad"
            prefix={currency === 'USD' ? '$' : currency === 'ZWG' ? 'ZiG ' : 'R '}
          />

          {/* Submit Button */}
          <View style={{ marginTop: 32 }}>
            <M3Button
              label={isLoading ? 'Configuring Your Cashbox...' : 'Open My Cashbox'}
              onPress={handleFinishOnboarding}
              disabled={isLoading}
              isLoading={isLoading}
              variant="mint"
              size="lg"
              icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#06152E',
  },
  container: {
    flex: 1,
    backgroundColor: '#06152E',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  logoRow: {
    marginBottom: 14,
  },
  appLogo: {
    borderRadius: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
    ...DesignTokens.shadows.softCard,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  inputHelper: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    lineHeight: 17,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  pillChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  pillChipActive: {
    backgroundColor: '#0A192F',
    borderColor: '#0A192F',
  },
  pillChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  pillChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  subSectionBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  subSectionBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800',
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  nestedCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  chipFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
  },
});
