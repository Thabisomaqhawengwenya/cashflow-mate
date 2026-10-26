import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import { MobileStorageService, BusinessProfile } from '@/services/storage';
import { M3Card } from '@/components/M3/M3Card';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';
import { Ionicons } from '@expo/vector-icons';

export default function ModalScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const [business, setBusiness] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    MobileStorageService.getBusiness().then(setBusiness);
  }, []);

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

      <M3Card variant="elevated" style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Design & Architecture</Text>
        <Text style={[styles.bodyText, { color: theme.tabIconDefault }]}>
          Built strictly following Google Material 3 Expressive guidelines and Mr Q's Pinterest 'app' board geometry: continuous full pill actions, 22px squircle KPI containers, and deterministic zero-drift accounting rules.
        </Text>
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
    marginVertical: 18,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
  },
  appSub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 260,
  },
  card: {
    width: '100%',
    padding: DesignTokens.spacing.cardPadding,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 14,
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
    fontSize: 12,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionSection: {
    width: '100%',
    marginTop: 16,
  },
});
