import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppearance } from '@/context/AppearanceContext';
import { M3Badge } from '@/components/M3/M3Badge';
import { AppLogo } from '@/components/BrandLogos';

export default function RefundPolicyScreen() {
  const { palette, surfaces, cardRadius } = useAppearance();

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
            <Text style={styles.headerTitle}>Refund & Fees Policy</Text>
            <Text style={[styles.headerSubtitle, { color: palette.accent }]}>
              TRANSPARENT COMMERCIAL TERMS
            </Text>
          </View>

          <View style={styles.placeholderButton} />
        </View>

        {/* Brand Bar */}
        <View style={styles.brandRow}>
          <AppLogo size={36} />
          <View>
            <Text style={styles.brandName}>CashFlow Mate</Text>
            <Text style={[styles.brandBadge, { color: palette.accent }]}>
              100% FREE CORE &bull; 14-DAY REFUND GUARANTEE
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
        <View style={[styles.card, { borderRadius: cardRadius }]}>
          <View style={styles.badgeRow}>
            <M3Badge label="100% FREE CORE FOREVER" variant="mint" />
            <M3Badge label="14-DAY REFUND WINDOW" variant="neutral" />
          </View>

          <Text style={styles.sectionHeading}>Refund & Fee Transparency Policy</Text>
          <Text style={[styles.bodyParagraph, { fontWeight: '600', color: '#64748B', marginBottom: 14 }]}>
            Last updated: 4 November 2026 &bull; Effective date: 4 November 2026
          </Text>

          <Text style={styles.subHeading}>1. Free & Open-Source Core Guarantee</Text>
          <Text style={styles.bodyParagraph}>
            CashFlow Mate believes in empowering Zimbabwean informal traders without financial friction. The entire standalone till engine (including the 3-drawer multi-currency cashbox, EcoCash and InnBucks SMS parser, customer debt ledger, local CSV import/export, and market stall pass) is <Text style={styles.boldText}>100% free forever</Text> under the official MIT License. There are zero hidden monthly charges, zero transaction cut deductions, and zero mandatory subscription fees for core operations.
          </Text>

          <Text style={styles.subHeading}>2. Commercial Pro & Enterprise Licenses</Text>
          <Text style={styles.bodyParagraph}>
            For multi-till operations, wholesale depots, and commercial enterprises requiring hardware thermal printer drivers, centralized multi-device cloud synchronization, or custom branding, optional commercial software license keys are available.
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>Public Preview Status:</Text> During the public preview, commercial features are currently offered at zero charge or on an evaluation trial basis.
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>Paid Activations:</Text> Where a one-time commercial license key is purchased, fees are clearly stated upfront before payment confirmation.
          </Text>

          <Text style={styles.subHeading}>3. 14-Day Money-Back Guarantee</Text>
          <Text style={styles.bodyParagraph}>
            If you purchase a commercial Pro or Enterprise activation key and are dissatisfied for any reason, or if the cryptographic key fails to validate on your device hardware, you are entitled to a <Text style={styles.boldText}>full 100% refund within 14 calendar days</Text> of purchase. No questions asked.
          </Text>

          <Text style={styles.subHeading}>4. Payment Methods Accepted</Text>
          <Text style={styles.bodyParagraph}>
            When commercial license payments are collected, payments are accepted through reputable local and international channels:
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>EcoCash / OneMoney</Text> (USD & ZiG mobile money)
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>InnBucks</Text> (USD digital merchant vouchers)
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>Visa & MasterCard</Text> (Commercial card settlement)
          </Text>

          <Text style={styles.subHeading}>5. How to Request a Refund</Text>
          <Text style={styles.bodyParagraph}>
            To claim a refund within the 14-day window:
          </Text>
          <Text style={styles.bulletItem}>
            1. Email <Text style={styles.boldText}>support@cashflowmate.app</Text> with your purchase receipt or software license key.
          </Text>
          <Text style={styles.bulletItem}>
            2. Alternatively, submit a ticket inside the app under <Text style={styles.boldText}>Settings &rarr; Report a Problem to Admin HQ</Text>.
          </Text>
          <Text style={styles.bulletItem}>
            3. Refunds are processed back to the original funding account (e.g. EcoCash wallet or card) within 3 to 5 business days.
          </Text>

          <Text style={styles.subHeading}>6. Statutory Consumer Protection</Text>
          <Text style={styles.bodyParagraph}>
            Nothing in this policy limits or diminishes your statutory rights under the laws of Zimbabwe or consumer protection regulations in your jurisdiction.
          </Text>

          <Text style={styles.subHeading}>7. Publisher Contact Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Operator:</Text>
            <Text style={styles.detailValue}>Maqhawe T Ngwenya</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Support Email:</Text>
            <Text style={styles.detailValue}>support@cashflowmate.app</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Operating Hub:</Text>
            <Text style={styles.detailValue}>Harare, Zimbabwe</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06152E',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#06152E',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A7F3D0',
    marginTop: 2,
  },
  placeholderButton: {
    width: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A192F',
    marginTop: 16,
    marginBottom: 6,
  },
  bodyParagraph: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  bulletItem: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginTop: 4,
    paddingLeft: 4,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailKey: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
});
