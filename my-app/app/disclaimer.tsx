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

export default function AiDisclaimerScreen() {
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
            <Text style={styles.headerTitle}>AI &amp; Financial Disclaimer</Text>
            <Text style={[styles.headerSubtitle, { color: palette.accent }]}>
              OPERATIONAL LIMITS &amp; RESPONSIBILITY
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
              ASSISTIVE AI &bull; NOT PROFESSIONAL FINANCIAL ADVICE
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
            <M3Badge label="ASSISTIVE TOOL ONLY" variant="amber" />
            <M3Badge label="DETERMINISTIC ARITHMETIC" variant="neutral" />
          </View>

          <Text style={styles.sectionHeading}>AI Assistant &amp; Financial Calculation Disclaimer</Text>
          <Text style={[styles.bodyParagraph, { fontWeight: '600', color: '#64748B', marginBottom: 14 }]}>
            Last updated: 4 November 2026 &bull; Effective date: 4 November 2026
          </Text>

          {/* Prominent Warning Callout */}
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={22} color="#D97706" />
            <Text style={styles.warningText}>
              <Text style={{ fontWeight: '800' }}>IMPORTANT LEGAL NOTICE:</Text> CashFlow Mate is an algorithmic bookkeeping notebook and decision-support tool. It does <Text style={{ fontWeight: '800' }}>NOT</Text> provide certified legal, statutory accounting, chartered tax audit, or investment advisory services.
            </Text>
          </View>

          <Text style={styles.subHeading}>1. Purpose of the AI Assistant</Text>
          <Text style={styles.bodyParagraph}>
            CashFlow Mate integrates Google Gemini 1.5 Flash to help small stallholders, tuckshop operators, and informal vendors understand their daily transactions, spot overdue customer debts, and forecast restock needs in plain language (English, ChiShona, and SiNdebele).
          </Text>

          <Text style={styles.subHeading}>2. Arithmetic Determinism (Zero AI Hallucination)</Text>
          <Text style={styles.bodyParagraph}>
            To eliminate mathematical errors and prevent AI hallucinations:
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>The AI Never Computes Math:</Text> All additions, subtractions, multi-currency drawer valuations, and operating profit totals are computed deterministically in standard TypeScript on your device.
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>Pre-Computed Fact Injection:</Text> The AI only receives pre-calculated numerical facts and is strictly instructed to explain them in accessible local language.
          </Text>

          <Text style={styles.subHeading}>3. Merchant Verification Responsibility</Text>
          <Text style={styles.bodyParagraph}>
            Because software calculations rely strictly on the inputs and imported files provided:
          </Text>
          <Text style={styles.bulletItem}>
            &bull; You are solely responsible for checking the accuracy of entered prices, physical cash counts, and exchange rates.
          </Text>
          <Text style={styles.bulletItem}>
            &bull; You must independently verify physical cash in drawer against the Z-Report closing shift total before leaving your stall.
          </Text>
          <Text style={styles.bulletItem}>
            &bull; "Operating profit" is an estimate and does not account for unpaid inventory credit, spoiled stock, or statutory taxes not recorded in the app.
          </Text>

          <Text style={styles.subHeading}>4. Not Professional or Tax Advice</Text>
          <Text style={styles.bodyParagraph}>
            Nothing generated by the app or its AI assistant should be relied upon as formal statutory tax advice, bank loan underwriting, or legal counsel. For official company tax returns or regulatory filings, always consult a certified public accountant or licensed tax professional.
          </Text>

          <Text style={styles.subHeading}>5. Privacy &amp; PII Scrubbing</Text>
          <Text style={styles.bodyParagraph}>
            Customer phone numbers, national IDs, and personal notes are automatically scrubbed before any analytical query is dispatched to Google Gemini. You can also disable AI features entirely and use the app in 100% offline rule-based mode.
          </Text>

          <Text style={styles.subHeading}>6. Publisher Contact Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Operator:</Text>
            <Text style={styles.detailValue}>Maqhawe T Ngwenya</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Support Email:</Text>
            <Text style={styles.detailValue}>support@cashflowmate.app</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Location:</Text>
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  warningText: {
    flex: 1,
    fontSize: 12.5,
    color: '#92400E',
    lineHeight: 18,
    fontWeight: '500',
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
