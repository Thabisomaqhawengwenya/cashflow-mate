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
import { EmeraldTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { CurrencyCode } from '@/services/storage';
import { MobileAuthService } from '@/services/auth';
import { M3Input } from '@/components/M3/M3Input';
import { M3Button } from '@/components/M3/M3Button';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    setIsLoading(true);
    try {
      await MobileAuthService.register({
        name,
        businessName: businessName || `${name}'s Stall`,
        currency,
        email,
        password,
      });
      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Registration failed. Please check your details.');
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
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back to Login"
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={() => router.replace('/(tabs)')}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <Text style={styles.heroGreeting}>Create Till Account</Text>
          <Text style={styles.heroSub}>
            Set up your multi-currency market cashbox in 30 seconds.
          </Text>

          <View style={styles.featurePillRow}>
            <View style={styles.featurePill}>
              <Ionicons name="shield-checkmark" size={13} color={EmeraldTokens.mintCta} />
              <Text style={styles.featurePillText}>Offline Encrypted</Text>
            </View>
            <View style={styles.featurePill}>
              <Ionicons name="wallet-outline" size={13} color={EmeraldTokens.mintCta} />
              <Text style={styles.featurePillText}>3-Drawer Float</Text>
            </View>
          </View>
        </View>

        {/* 2. Curved White Body Sheet */}
        <View style={styles.sheetCard}>
          <Text style={styles.formTitle}>Trader & Enterprise Profile</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#E11D48" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <M3Input
            label="Trader Full Name"
            placeholder="e.g. Simba Moyo"
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
            <Text style={styles.footerPrompt}>Already have an account?</Text>
            <Pressable
              onPress={() => router.push('/login')}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.loginLink}>Sign In</Text>
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
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DesignTokens.shapes.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7F3D0',
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
    marginBottom: 14,
  },
  featurePillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DesignTokens.shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.22)',
    gap: 6,
  },
  featurePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  sheetCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 26,
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
    backgroundColor: 'rgba(12, 62, 53, 0.08)',
    borderColor: EmeraldTokens.deepPine,
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
    color: EmeraldTokens.textMuted,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    color: EmeraldTokens.deepPine,
    textDecorationLine: 'underline',
  },
});
