import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { EmeraldTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { MobileAuthService } from '@/services/auth';
import { M3Input } from '@/components/M3/M3Input';
import { M3Button } from '@/components/M3/M3Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await MobileAuthService.login(email, password);
      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await MobileAuthService.demoLogin();
      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      setIsLoading(false);
      setError('Could not initialize demo session.');
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
        {/* 1. Header Hero Canvas */}
        <View style={styles.header}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel="Skip to Till Dashboard"
            >
              <Text style={styles.skipText}>Skip to Till</Text>
              <Ionicons name="arrow-forward" size={15} color="#A7F3D0" />
            </Pressable>
          </View>

          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="wallet" size={26} color={EmeraldTokens.mintDarkText} />
            </View>
            <View>
              <Text style={styles.brandTitle}>CashFlow Mate</Text>
              <Text style={styles.brandSubtitle}>ZIM MARKET TILL OS</Text>
            </View>
          </View>

          <Text style={styles.heroGreeting}>Welcome Back</Text>
          <Text style={styles.heroSub}>
            Sign in to access your multi-drawer cashbox and records.
          </Text>

          <View style={styles.statusPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusPillText}>OFFLINE FIRST • ZERO DATA READY</Text>
          </View>
        </View>

        {/* 2. Curved White Body Card */}
        <View style={styles.sheetCard}>
          <Text style={styles.formTitle}>Trader Sign In</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#E11D48" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <M3Input
            label="Trader Email Address"
            placeholder="e.g. tinashe@mbaretuckshop.co.zw"
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
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={EmeraldTokens.textMuted}
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

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR EXPLORE</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Demo Login Quick Action */}
          <M3Button
            label="Continue with Mbare Demo Till"
            onPress={handleDemoLogin}
            variant="tonal"
            size="lg"
            icon={<Ionicons name="storefront-outline" size={18} color={EmeraldTokens.deepPine} />}
          />

          {/* Sign Up Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerPrompt}>New to CashFlow Mate?</Text>
            <Pressable
              onPress={() => router.push('/signup')}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.signUpLink}>Create Account</Text>
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
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    color: '#A7F3D0',
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
    shadowColor: EmeraldTokens.mintCta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DesignTokens.shapes.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: EmeraldTokens.mintCta,
    marginRight: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6EE7B7',
    letterSpacing: 0.6,
  },
  sheetCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    shadowColor: '#0C3E35',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
    marginBottom: 18,
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
    backgroundColor: 'rgba(12, 62, 53, 0.08)',
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
    marginTop: 26,
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
