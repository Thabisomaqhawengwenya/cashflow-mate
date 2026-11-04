import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { CurrencyCode } from '@/services/storage';
import { MobileAuthService, UserSession } from '@/services/auth';
import { M3Input } from '@/components/M3/M3Input';
import { M3Button } from '@/components/M3/M3Button';
import { AppLogo } from '@/components/BrandLogos';

export default function OnboardingScreen() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [businessName, setBusinessName] = useState('');
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
      setBusinessName(sess.businessName || `${sess.name}'s Business`);
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
          <Text style={styles.heroTitle}>Welcome to Cashflow</Text>
          <Text style={styles.heroSub}>
            Welcome aboard, {session?.name || 'Trader'}! Customize your daily till in 30 seconds.
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
            placeholder="e.g. Mbare Musika Wholesale #12"
            value={businessName}
            onChangeText={(txt) => {
              setBusinessName(txt);
              if (error) setError(null);
            }}
          />

          {/* 2. Primary Operating Currency */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PRIMARY OPERATING CURRENCY</Text>
          <Text style={styles.inputHelper}>
            Select your main trading drawer. You can switch or accept multi-currency payments at any time.
          </Text>
          <View style={styles.currencyRow}>
            {(['USD', 'ZWG', 'ZAR'] as CurrencyCode[]).map((c) => {
              const active = currency === c;
              const label = c === 'USD' ? 'US Dollar ($)' : c === 'ZWG' ? 'Zimbabwe Gold (ZiG)' : 'SA Rand (R)';
              const symbol = c === 'USD' ? '$' : c === 'ZWG' ? 'ZiG' : 'R';

              return (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={[styles.currencyCard, active && styles.currencyCardActive]}
                >
                  <View style={[styles.currencyIconBox, active && styles.currencyIconBoxActive]}>
                    <Text style={[styles.currencyIconText, active && styles.currencyIconTextActive]}>
                      {symbol}
                    </Text>
                  </View>
                  <Text style={[styles.currencyTitle, active && styles.currencyTitleActive]}>{c}</Text>
                  <Text style={styles.currencySub}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* 3. Starting Float */}
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
    paddingBottom: 32,
    alignItems: 'center',
  },
  logoRow: {
    marginBottom: 16,
  },
  appLogo: {
    borderRadius: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    ...DesignTokens.shadows.softCard,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: EmeraldTokens.textSubtle,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  inputHelper: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    lineHeight: 17,
    marginBottom: 14,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  currencyCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  currencyCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#1565D8',
  },
  currencyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currencyIconBoxActive: {
    backgroundColor: '#1565D8',
  },
  currencyIconText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
  },
  currencyIconTextActive: {
    color: '#FFFFFF',
  },
  currencyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  currencyTitleActive: {
    color: '#1565D8',
  },
  currencySub: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
    fontWeight: '500',
  },
});
