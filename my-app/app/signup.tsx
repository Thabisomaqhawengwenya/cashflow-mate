import React, { useState } from 'react';
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
import { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { CurrencyCode } from '@/services/storage';
import { MobileAuthService } from '@/services/auth';
import { M3Input } from '@/components/M3/M3Input';
import { M3Button } from '@/components/M3/M3Button';
import { AppLogo } from '@/components/BrandLogos';
import { useAppearance } from '@/context/AppearanceContext';

export default function SignupScreen() {
  const { palette, surfaces } = useAppearance();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter your full name or trader nickname.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please confirm your password.');
      return;
    }
    if (!agreedToTerms) {
      setError(
        'Please affirm that you are 18+ and agree to the Terms of Service & Privacy Policy.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const sess = await MobileAuthService.register({
        name,
        businessName: businessName || `${name}'s Stall`,
        currency,
        email,
        password,
      });
      setIsLoading(false);
      if (sess.onboardingCompleted === false) {
        router.replace('/onboarding' as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Registration failed. Please check your details.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardContainer, { backgroundColor: palette.headerBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: palette.headerBg }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header Hero Canvas */}
        <View style={styles.header}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.replace('/login' as any)}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go to Sign In"
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={() => router.replace('/login' as any)}
              style={styles.topLink}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text style={styles.topLinkText}>Sign In</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <AppLogo size={48} />
            <View>
              <Text style={{ fontSize: 19, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 }}>
                Cashflow
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: palette.accent, letterSpacing: 0.6 }}>
                PROFESSIONAL TRADER OS
              </Text>
            </View>
          </View>

          <Text style={styles.heroGreeting}>Create Till Account</Text>
          <Text style={styles.heroSub}>
            Set up your multi-currency market cashbox in 30 seconds.
          </Text>
        </View>

        {/* 2. Curved White Body Sheet */}
        <View style={[styles.sheetCard, { backgroundColor: surfaces.cardBg }]}>
          <Text style={[styles.formTitle, { color: surfaces.textPrimary }]}>Trader & Enterprise Profile</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#E11D48" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <M3Input
            label="Your Name / Username (shown in greeting)"
            placeholder="e.g. Farai Moyo"
            value={name}
            onChangeText={(txt) => {
              setName(txt);
              setError(null);
            }}
            autoCapitalize="words"
          />

          <M3Input
            label="Stall or Enterprise Name"
            placeholder="e.g. Mbare Musika Fresh Produce Stall #4"
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
          />

          {/* Primary Float Currency Selector */}
          <View style={styles.currencySection}>
            <Text style={styles.currencyLabel}>Primary Float Currency</Text>
            <View style={styles.currencyRow}>
              {[
                { code: 'USD', label: 'USD ($)' },
                { code: 'ZWG', label: 'ZiG (EcoCash)' },
                { code: 'ZAR', label: 'ZAR Rand (R)' },
              ].map((item) => {
                const isSelected = currency === item.code;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => setCurrency(item.code as CurrencyCode)}
                    style={[
                      styles.currencyChip,
                      isSelected && styles.currencyChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyChipText,
                        isSelected && styles.currencyChipTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <M3Input
            label="Email Address"
            placeholder="e.g. simba@market.co.zw"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <M3Input
              label="Password (min 6 characters)"
              placeholder="Create a strong account password"
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                setError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeToggle}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={EmeraldTokens.textMuted}
              />
            </Pressable>
          </View>

          <View style={styles.passwordContainer}>
            <M3Input
              label="Confirm Password"
              placeholder="Re-enter your account password"
              value={confirmPassword}
              onChangeText={(txt) => {
                setConfirmPassword(txt);
                setError(null);
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              error={
                confirmPassword.length > 0 && password !== confirmPassword
                  ? 'Passwords do not match yet'
                  : undefined
              }
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeToggle}
              accessibilityLabel={
                showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
              }
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={EmeraldTokens.textMuted}
              />
            </Pressable>
          </View>

          {/* Explicit Legal & Age Consent Checkbox (20-Point Compliance) */}
          <Pressable
            onPress={() => {
              setAgreedToTerms(!agreedToTerms);
              setError(null);
            }}
            style={styles.consentRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreedToTerms }}
            accessibilityLabel="Confirm 18+ and agree to Terms of Service and Privacy Policy"
          >
            <View
              style={[
                styles.checkboxBox,
                agreedToTerms && { backgroundColor: palette.primary, borderColor: palette.primary },
              ]}
            >
              {agreedToTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={[styles.consentText, { color: surfaces.textSecondary }]}>
              I confirm I am <Text style={[styles.consentBold, { color: surfaces.textPrimary }]}>18+ years of age</Text> and accept the{' '}
              <Text
                onPress={() => router.push('/legal' as any)}
                style={[styles.consentLink, { color: palette.primary }]}
              >
                Terms of Service
              </Text>{' '}
              &amp;{' '}
              <Text
                onPress={() => router.push('/legal' as any)}
                style={[styles.consentLink, { color: palette.primary }]}
              >
                Privacy Policy
              </Text>.
            </Text>
          </Pressable>

          <View style={styles.buttonSpacing}>
            <M3Button
              label={isLoading ? 'Creating Till...' : 'Create My Till & Start'}
              onPress={handleRegister}
              isLoading={isLoading}
              variant="mint"
              size="lg"
            />
          </View>

          {/* Switch to Login */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerPrompt, { color: surfaces.textMuted }]}>Already have an account?</Text>
            <Pressable
              onPress={() => router.replace('/login' as any)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.loginLink, { color: palette.primary }]}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: EmeraldTokens.deepPine,
  },
  container: {
    flex: 1,
    backgroundColor: EmeraldTokens.deepPine,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLink: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  topLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 18,
    marginBottom: 16,
  },
  sheetCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 40,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#E11D48',
    fontWeight: '600',
  },
  currencySection: {
    marginVertical: 10,
  },
  currencyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginBottom: 8,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  currencyChipSelected: {
    backgroundColor: 'rgba(21, 101, 216, 0.12)',
    borderColor: BlueTokens.primary,
  },
  currencyChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: EmeraldTokens.textMuted,
  },
  currencyChipTextSelected: {
    color: EmeraldTokens.deepPine,
    fontWeight: '800',
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeToggle: {
    position: 'absolute',
    right: 14,
    top: 36,
    padding: 4,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#1565D8',
    borderColor: '#1565D8',
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  consentBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  consentLink: {
    fontWeight: '800',
    color: '#1565D8',
    textDecorationLine: 'underline',
  },
  buttonSpacing: {
    marginTop: 20,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 6,
  },
  footerPrompt: {
    fontSize: 13,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1565D8',
    textDecorationLine: 'underline',
  },
});
