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
import { MobileAuthService } from '@/services/auth';
import { M3Input } from '@/components/M3/M3Input';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';
import { AppLogo } from '@/components/BrandLogos';
import { useAppearance } from '@/context/AppearanceContext';

export default function LoginScreen() {
  const { palette, surfaces } = useAppearance();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password Reset Modal State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter both your username/email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const sess = await MobileAuthService.login(email, password);
      setIsLoading(false);
      if (sess.role === 'admin') {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.assign('/admin');
          return;
        }
        router.replace('/admin' as any);
        return;
      }
      if (sess.onboardingCompleted === false) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.assign('/onboarding');
          return;
        }
        router.replace('/onboarding' as any);
        return;
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.assign('/');
        return;
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleResetPassword = async () => {
    setResetError(null);
    setResetSuccess(null);
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await MobileAuthService.resetPassword(resetEmail);
      setIsResetting(false);
      setResetSuccess(res.message);
    } catch (err: any) {
      setIsResetting(false);
      setResetError(err.message || 'Could not send reset link.');
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
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => router.push('/signup' as any)}
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel="Create Account"
            >
              <Text style={styles.skipText}>Sign Up</Text>
              <Ionicons name="arrow-forward" size={15} color={palette.accent} />
            </Pressable>
          </View>

          <View style={styles.brandRow}>
            <AppLogo size={54} />
            <View>
              <Text style={styles.brandTitle}>Cashflow</Text>
              <Text style={[styles.brandSubtitle, { color: palette.accent }]}>
                PROFESSIONAL TRADER OS
              </Text>
            </View>
          </View>

          <Text style={styles.heroGreeting}>Welcome Back</Text>
          <Text style={styles.heroSub}>
            Sign in to access your multi-drawer cashbox and records.
          </Text>

          <View style={styles.statusPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusPillText}>
              OFFLINE FIRST • SECURE LOCAL TILL
            </Text>
          </View>
        </View>

        {/* 2. Curved Body Card */}
        <View style={[styles.sheetCard, { backgroundColor: surfaces.cardBg }]}>
          <View style={styles.formHeaderRow}>
            <Text style={[styles.formTitle, { color: surfaces.textPrimary }]}>
              Sign In to Till
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#E11D48" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <M3Input
            label="Email or Username"
            placeholder="e.g. mrq@mbaretuckshop.co.zw"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordContainer}>
            <M3Input
              label="Password"
              placeholder="Enter your account password"
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
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={surfaces.textMuted}
              />
            </Pressable>
          </View>

          <View style={styles.buttonSpacing}>
            <M3Button
              label={isLoading ? 'Signing In...' : 'Sign In to Till'}
              onPress={handleLogin}
              isLoading={isLoading}
              variant="mint"
              size="lg"
            />
          </View>

          {/* Forgot Password Action */}
          <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
            <Pressable
              onPress={() => {
                setIsResetOpen(!isResetOpen);
                setResetError(null);
                setResetSuccess(null);
                if (!resetEmail && email) setResetEmail(email);
              }}
              hitSlop={8}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: palette.primary }}>
                {isResetOpen ? 'Close Password Reset' : 'Forgot Password?'}
              </Text>
            </Pressable>
          </View>

          {/* Inline Password Reset Section */}
          {isResetOpen && (
            <View
              style={{
                backgroundColor: surfaces.cardElevatedBg,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: surfaces.border,
                marginTop: 8,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: surfaces.textPrimary, marginBottom: 6 }}>
                Reset Your Password
              </Text>
              <Text style={{ fontSize: 12, color: surfaces.textMuted, marginBottom: 12, lineHeight: 16 }}>
                Enter the email associated with your account and we will send a password reset link.
              </Text>

              {resetError ? (
                <View style={[styles.errorBanner, { marginBottom: 10 }]}>
                  <Ionicons name="alert-circle" size={16} color="#E11D48" />
                  <Text style={styles.errorText}>{resetError}</Text>
                </View>
              ) : null}

              {resetSuccess ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#ECFDF5',
                    borderWidth: 1,
                    borderColor: '#6EE7B7',
                    padding: 10,
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, color: '#065F46', fontWeight: '600', flex: 1 }}>
                    {resetSuccess}
                  </Text>
                </View>
              ) : null}

              <M3Input
                label="Registered Email"
                placeholder="name@example.com"
                value={resetEmail}
                onChangeText={(t) => {
                  setResetEmail(t);
                  setResetError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={{ marginTop: 12 }}>
                <M3Button
                  label={isResetting ? 'Sending Link...' : 'Send Password Reset Link'}
                  onPress={handleResetPassword}
                  isLoading={isResetting}
                  variant="filled"
                  size="md"
                />
              </View>
            </View>
          )}

          {/* Sign Up Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerPrompt, { color: surfaces.textMuted }]}>
              New to Cashflow?
            </Text>
            <Pressable
              onPress={() => router.push('/signup' as any)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.signUpLink, { color: palette.primary }]}>Create Account</Text>
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
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 28,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DesignTokens.shapes.pill,
    gap: 6,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    color: BlueTokens.accent,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: EmeraldTokens.mintCta,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: EmeraldTokens.mintCta,
    letterSpacing: 1.1,
    marginTop: 2,
  },
  heroGreeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 20,
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 101, 216, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DesignTokens.shapes.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(85, 215, 255, 0.35)',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: BlueTokens.success,
    marginRight: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: BlueTokens.accent,
    letterSpacing: 0.6,
  },
  sheetCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
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
  modeTabContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 18,
    gap: 6,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeTabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
  },
  quickFillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 5,
  },
  quickFillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
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
  passwordContainer: {
    position: 'relative',
  },
  eyeToggle: {
    position: 'absolute',
    right: 14,
    top: 36,
    padding: 4,
  },
  secretCodeSection: {
    marginTop: 4,
  },
  secretHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  secretHintText: {
    fontSize: 11,
    flex: 1,
  },
  buttonSpacing: {
    marginTop: 18,
    marginBottom: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BlueTokens.borders,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: EmeraldTokens.textSubtle,
    letterSpacing: 1,
    paddingHorizontal: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    gap: 6,
  },
  footerPrompt: {
    fontSize: 13,
    color: EmeraldTokens.textMuted,
  },
  signUpLink: {
    fontSize: 13,
    fontWeight: '800',
    color: EmeraldTokens.deepPine,
    textDecorationLine: 'underline',
  },
});
