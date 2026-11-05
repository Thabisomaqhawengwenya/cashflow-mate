import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { EmeraldTokens } from '@/constants/Colors';

const COOKIE_CONSENT_KEY = '@cashflow_cookie_storage_consent_v1';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        setVisible(true);
      }
    } catch {
      // ignore in environments without localStorage
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible || Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.bannerCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={18} color="#047857" />
        </View>

        <View style={styles.textCol}>
          <Text style={styles.title}>Essential Storage & Privacy Safeguards</Text>
          <Text style={styles.subtitle}>
            CashFlow Mate uses local device storage solely for offline till operations, theme preferences,
            and encrypted authentication tokens. Zero cross-site tracking cookies.
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => router.push('/legal' as any)}
            style={styles.detailsBtn}
            accessibilityRole="button"
            accessibilityLabel="Read Legal and Privacy Policy"
          >
            <Text style={styles.detailsBtnText}>Policy</Text>
          </Pressable>

          <Pressable
            onPress={handleAccept}
            style={styles.acceptBtn}
            accessibilityRole="button"
            accessibilityLabel="Accept essential storage"
          >
            <Text style={styles.acceptBtnText}>Accept</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  bannerCard: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  acceptBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: '#34D399',
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#064E3B',
  },
});
