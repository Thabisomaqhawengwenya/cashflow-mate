import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppearance } from '@/context/AppearanceContext';
import { MobileStorageService } from '@/services/storage';
import { MobileSecurityService } from '@/services/security';
import { MobileAuthService } from '@/services/auth';
import { AppLogo } from '@/components/BrandLogos';

export default function DangerZoneScreen() {
  const { palette, surfaces, cardRadius } = useAppearance();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEraseEverything = async () => {
    const executeErasure = async () => {
      try {
        setIsDeleting(true);
        await MobileStorageService.eraseAllUserData();
        await MobileSecurityService.clearPin();
        await MobileAuthService.logout();
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert(
            'Your account and all device records have been permanently erased in compliance with privacy regulations.'
          );
          window.location.assign('/login');
          return;
        }
        Alert.alert(
          'Account & Records Erased',
          'Your account and all local records have been permanently erased (Right to Be Forgotten).'
        );
        router.replace('/login' as any);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to erase data.');
      } finally {
        setIsDeleting(false);
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'PERMANENT DATA ERASURE (Right to Be Forgotten):\n\nAre you sure you want to permanently delete your account and erase all records?\n\nAll local transactions, till drawers, customer credits, and credentials will be permanently erased. This action cannot be undone.'
      );
      if (confirmed) {
        await executeErasure();
      }
    } else {
      Alert.alert(
        'Delete Account & Erase All Data?',
        'This will permanently destroy all local ledger transactions, customer credit balances, till drawers, and credentials from this device.\n\nThis action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Permanently Erase Everything',
            style: 'destructive',
            onPress: executeErasure,
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.headerBg }]}>
      {/* Header Canvas */}
      <View style={[styles.header, { backgroundColor: palette.headerBg }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back to Settings"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Account & Data Erasure</Text>
            <Text style={[styles.headerSubtitle, { color: '#FCA5A5' }]}>
              DANGER ZONE &bull; STATUTORY PURGE
            </Text>
          </View>

          <View style={styles.placeholderButton} />
        </View>

        <View style={styles.brandRow}>
          <AppLogo size={36} />
          <View>
            <Text style={styles.brandName}>CashFlow Mate</Text>
            <Text style={[styles.brandBadge, { color: '#FCA5A5' }]}>
              RIGHT TO BE FORGOTTEN &bull; ZERO RESIDUAL TRACE
            </Text>
          </View>
        </View>
      </View>

      {/* Sheet Content Canvas */}
      <ScrollView
        style={[styles.sheet, { backgroundColor: surfaces.sheetBg }]}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: surfaces.cardBg, borderRadius: cardRadius }]}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={22} color="#DC2626" />
            <Text style={styles.warningTitle}>Irreversible Action Notice</Text>
          </View>

          <Text style={[styles.bodyText, { color: surfaces.textMuted }]}>
            Pursuant to the Cyber & Data Protection Act [Chapter 12:07] and the right to erasure, you have absolute sovereign ownership over your financial records. Triggering this purge immediately and irrecoverably destroys all data held in this application.
          </Text>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Ionicons name="close-circle" size={16} color="#DC2626" />
              <Text style={[styles.bulletText, { color: surfaces.textPrimary }]}>
                Permanently deletes all 3 cashbox drawer balances (USD, ZiG, ZAR).
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="close-circle" size={16} color="#DC2626" />
              <Text style={[styles.bulletText, { color: surfaces.textPrimary }]}>
                Purges all customer credit and supplier payable debt ledger entries.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="close-circle" size={16} color="#DC2626" />
              <Text style={[styles.bulletText, { color: surfaces.textPrimary }]}>
                Removes your encrypted local till PIN, business stall pass, and saved profiles.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="close-circle" size={16} color="#DC2626" />
              <Text style={[styles.bulletText, { color: surfaces.textPrimary }]}>
                Revokes stored session tokens and resets the app to its factory initial state.
              </Text>
            </View>
          </View>

          <View style={styles.actionBlock}>
            <Pressable
              onPress={handleEraseEverything}
              disabled={isDeleting}
              style={[styles.eraseButton, isDeleting && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="Permanently Delete Account and Erase All Data"
            >
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
              <Text style={styles.eraseButtonText}>
                {isDeleting ? 'Erasing Ledger...' : 'Delete Account & Erase All Data'}
              </Text>
            </Pressable>
            <Text style={[styles.actionNote, { color: surfaces.textMuted }]}>
              Make sure you have exported an encrypted backup from Settings before proceeding if you wish to preserve historical records.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 20,
    paddingHorizontal: 20,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderButton: {
    width: 36,
    height: 36,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  brandBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 1,
  },
  sheet: {
    flex: 1,
  },
  sheetContent: {
    padding: 16,
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: -0.2,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  bulletList: {
    gap: 10,
    marginBottom: 24,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  actionBlock: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    paddingTop: 18,
    gap: 10,
  },
  eraseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  eraseButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  actionNote: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
