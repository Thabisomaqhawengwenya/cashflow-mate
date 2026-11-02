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
import { useAppearance } from '@/context/AppearanceContext';

export default function LoginScreen() {
  const { palette, surfaces } = useAppearance();
  const [loginMode, setLoginMode] = useState<'trader' | 'admin'>('trader');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTypingAdmin =
    email.trim().toLowerCase() === 'admin' ||
    email.trim().toLowerCase() === 'admin@cashflow.co.zw';

  const showAdminFields = loginMode === 'admin' || isTypingAdmin;

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter both your username/email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (showAdminFields) {
        await MobileAuthService.adminLogin(email, password, secretCode);
        setIsLoading(false);
        router.replace('/admin' as any);
      } else {
        await MobileAuthService.login(email, password);
        setIsLoading(false);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickFillAdmin = () => {
    setLoginMode('admin');
    setEmail('admin');
    setPassword('admin');
    setSecretCode('CFM-HQ-2026');
    setError(null);
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await MobileAuthService.demoLogin();
      setIsLoading(false);
      router.replace('/(tabs)');
    } catch {
      setIsLoading(false);
      setError('Could not initialize demo session.');
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
              onPress={() => {
                setLoginMode(loginMode === 'admin' ? 'trader' : 'admin');
                setError(null);
              }}
              style={[
                styles.adminSwitchPill,
                loginMode === 'admin' && {
                  backgroundColor: 'rgba(245, 158, 11, 0.22)',
                  borderColor: '#F59E0B',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Toggle Admin HQ Login"
            >
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={loginMode === 'admin' ? '#FBBF24' : palette.accent}
              />
              <Text
                style={[
                  styles.adminSwitchText,
                  { color: loginMode === 'admin' ? '#FBBF24' : palette.accent },
                ]}
              >
                {loginMode === 'admin' ? 'Admin HQ Mode Active' : 'Admin HQ Portal'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDemoLogin}
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel="Continue with Mbare Demo Till"
            >
              <Text style={styles.skipText}>Use Demo Till</Text>
              <Ionicons name="arrow-forward" size={15} color={BlueTokens.accent} />
            </Pressable>
          </View>

          <View style={styles.brandRow}>
            <View style={[styles.logoBadge, { backgroundColor: palette.primary }]}>
              <Ionicons
                name={showAdminFields ? 'shield-half' : 'wallet'}
                size={26}
                color="#FFFFFF"
              />
            </View>
            <View>
              <Text style={styles.brandTitle}>CashFlow Mate</Text>
              <Text style={[styles.brandSubtitle, { color: palette.accent }]}>
                {showAdminFields ? 'DESKTOP ADMIN COMMAND CENTER' : 'ZIM MARKET TILL OS'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroGreeting}>
            {showAdminFields ? 'Admin Command Sign In' : 'Welcome Back'}
          </Text>
          <Text style={styles.heroSub}>
            {showAdminFields
              ? 'Enter your Admin credentials and Secret Access Code to launch the Desktop Command Center.'
              : 'Sign in to access your multi-drawer cashbox and records.'}
          </Text>

          <View style={styles.statusPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusPillText}>
              {showAdminFields
                ? 'SECRET CODE REQUIRED • DESKTOP CONSOLE READY'
                : 'OFFLINE FIRST • ZERO DATA READY'}
            </Text>
          </View>
        </View>

        {/* 2. Curved Body Card */}
        <View style={[styles.sheetCard, { backgroundColor: surfaces.cardBg }]}>
          {/* Mode Switcher Tabs */}
          <View style={[styles.modeTabContainer, { backgroundColor: surfaces.cardElevatedBg }]}>
            <Pressable
              onPress={() => {
                setLoginMode('trader');
                setError(null);
              }}
              style={[
                styles.modeTabBtn,
                !showAdminFields && [
                  styles.modeTabBtnActive,
                  { backgroundColor: surfaces.cardBg },
                ],
              ]}
            >
              <Ionicons
                name="storefront-outline"
                size={15}
                color={!showAdminFields ? palette.primary : surfaces.textMuted}
              />
              <Text
                style={[
                  styles.modeTabText,
                  { color: !showAdminFields ? surfaces.textPrimary : surfaces.textMuted },
                ]}
              >
                Trader Till Sign In
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setLoginMode('admin');
                setError(null);
              }}
              style={[
                styles.modeTabBtn,
                showAdminFields && [
                  styles.modeTabBtnActive,
                  { backgroundColor: surfaces.cardBg },
                ],
              ]}
            >
              <Ionicons
                name="desktop-outline"
                size={15}
                color={showAdminFields ? '#D97706' : surfaces.textMuted}
              />
              <Text
                style={[
                  styles.modeTabText,
                  { color: showAdminFields ? surfaces.textPrimary : surfaces.textMuted },
                ]}
              >
                Admin HQ (Desktop)
              </Text>
            </Pressable>
          </View>

          <View style={styles.formHeaderRow}>
            <Text style={[styles.formTitle, { color: surfaces.textPrimary }]}>
              {showAdminFields ? 'Administrator Verification' : 'Trader Sign In'}
            </Text>
            {showAdminFields && (
              <Pressable onPress={handleQuickFillAdmin} style={styles.quickFillBadge}>
                <Ionicons name="key-outline" size={13} color="#B45309" />
                <Text style={styles.quickFillText}>Auto-Fill Admin</Text>
              </Pressable>
            )}
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#E11D48" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <M3Input
            label={showAdminFields ? 'Admin Username or Email' : 'Trader Email or Username'}
            placeholder={
              showAdminFields ? 'admin (or admin@cashflow.co.zw)' : 'e.g. mrq@mbaretuckshop.co.zw'
            }
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
              placeholder={showAdminFields ? 'Enter admin password (admin)' : 'Enter your account password'}
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
                color={surfaces.textMuted}
              />
            </Pressable>
          </View>

          {/* Secret Code Field when in Admin Mode */}
          {showAdminFields && (
            <View style={styles.secretCodeSection}>
              <View style={styles.passwordContainer}>
                <M3Input
                  label="Admin Secret Access Code"
                  placeholder="Enter secret code (CFM-HQ-2026 or 7788)"
                  value={secretCode}
                  onChangeText={(txt) => {
                    setSecretCode(txt);
                    setError(null);
                  }}
                  secureTextEntry={!showSecretCode}
                  autoCapitalize="characters"
                />
                <Pressable
                  onPress={() => setShowSecretCode(!showSecretCode)}
                  style={styles.eyeToggle}
                  accessibilityLabel={showSecretCode ? 'Hide secret code' : 'Show secret code'}
                >
                  <Ionicons
                    name={showSecretCode ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={surfaces.textMuted}
                  />
                </Pressable>
              </View>
              <View style={styles.secretHintRow}>
                <M3Badge label="SECRET CODE" variant="amber" />
                <Text style={[styles.secretHintText, { color: surfaces.textMuted }]}>
                  Default HQ Code: <Text style={{ fontWeight: '800', color: surfaces.textPrimary }}>CFM-HQ-2026</Text> (or PIN <Text style={{ fontWeight: '800', color: surfaces.textPrimary }}>7788</Text>)
                </Text>
              </View>
            </View>
          )}

          <View style={styles.buttonSpacing}>
            <M3Button
              label={
                isLoading
                  ? 'Verifying...'
                  : showAdminFields
                  ? 'Launch Desktop Admin Console'
                  : 'Sign In to Till'
              }
              onPress={handleLogin}
              isLoading={isLoading}
              variant="mint"
              size="lg"
              icon={
                showAdminFields ? (
                  <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
                ) : undefined
              }
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: surfaces.border }]} />
            <Text style={[styles.dividerText, { color: surfaces.textMuted }]}>OR EXPLORE</Text>
            <View style={[styles.dividerLine, { backgroundColor: surfaces.border }]} />
          </View>

          {/* Demo Login Quick Action */}
          <M3Button
            label="Continue with Mbare Demo Till"
            onPress={handleDemoLogin}
            variant="tonal"
            size="lg"
            icon={<Ionicons name="storefront-outline" size={18} color={surfaces.textPrimary} />}
          />

          {/* Sign Up Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerPrompt, { color: surfaces.textMuted }]}>
              New to CashFlow Mate?
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
  adminSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DesignTokens.shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    gap: 6,
  },
  adminSwitchText: {
    fontSize: 12,
    fontWeight: '700',
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
