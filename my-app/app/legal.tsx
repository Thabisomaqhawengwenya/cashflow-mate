import React, { useState } from 'react';
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
import { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { AppLogo } from '@/components/BrandLogos';
import { M3Badge } from '@/components/M3/M3Badge';
import { useAppearance } from '@/context/AppearanceContext';

type LegalTab = 'privacy' | 'terms' | 'refund' | 'cookies' | 'disclaimer' | 'publisher';

export default function LegalScreen() {
  const { palette, surfaces } = useAppearance();
  const [activeTab, setActiveTab] = useState<LegalTab>('privacy');

  return (
    <View style={[styles.container, { backgroundColor: palette.headerBg }]}>
      {/* Header Canvas */}
      <View style={[styles.header, { backgroundColor: palette.headerBg }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Legal & Trust Center</Text>
            <Text style={[styles.headerSubtitle, { color: palette.accent }]}>20-Point Compliance & Data Safeguards</Text>
          </View>

          <View style={styles.placeholderButton} />
        </View>

        {/* Brand Bar */}
        <View style={styles.brandRow}>
          <AppLogo size={36} />
          <View>
            <Text style={styles.brandName}>CashFlow Mate</Text>
            <Text style={[styles.brandBadge, { color: palette.accent }]}>VERIFIED COMPLIANCE • MIT LICENSED</Text>
          </View>
        </View>

        {/* Scrollable Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          <Pressable
            onPress={() => setActiveTab('privacy')}
            style={[styles.tabChip, activeTab === 'privacy' && { backgroundColor: palette.primary }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'privacy' }}
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={activeTab === 'privacy' ? '#FFFFFF' : '#E2E8F0'}
            />
            <Text style={[styles.tabChipText, activeTab === 'privacy' && styles.tabChipTextActive]}>
              Privacy Policy
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('terms')}
            style={[styles.tabChip, activeTab === 'terms' && { backgroundColor: palette.primary }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'terms' }}
          >
            <Ionicons
              name="document-text"
              size={14}
              color={activeTab === 'terms' ? '#FFFFFF' : '#E2E8F0'}
            />
            <Text style={[styles.tabChipText, activeTab === 'terms' && styles.tabChipTextActive]}>
              Terms of Service
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('refund')}
            style={[styles.tabChip, activeTab === 'refund' && { backgroundColor: palette.primary }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'refund' }}
          >
            <Ionicons
              name="card"
              size={14}
              color={activeTab === 'refund' ? '#FFFFFF' : '#E2E8F0'}
            />
            <Text style={[styles.tabChipText, activeTab === 'refund' && styles.tabChipTextActive]}>
              Refund & Fees
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('cookies')}
            style={[styles.tabChip, activeTab === 'cookies' && { backgroundColor: palette.primary }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'cookies' }}
          >
            <Ionicons
              name="server"
              size={14}
              color={activeTab === 'cookies' ? '#FFFFFF' : '#E2E8F0'}
            />
            <Text style={[styles.tabChipText, activeTab === 'cookies' && styles.tabChipTextActive]}>
              Cookies & Storage
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('disclaimer')}
            style={[styles.tabChip, activeTab === 'disclaimer' && { backgroundColor: palette.primary }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'disclaimer' }}
          >
            <Ionicons
              name="alert-circle"
              size={14}
              color={activeTab === 'disclaimer' ? '#FFFFFF' : '#E2E8F0'}
            />
            <Text style={[styles.tabChipText, activeTab === 'disclaimer' && styles.tabChipTextActive]}>
              AI Disclaimer
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('publisher')}
            style={[styles.tabChip, activeTab === 'publisher' && { backgroundColor: palette.primary }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'publisher' }}
          >
            <Ionicons
              name="business"
              size={14}
              color={activeTab === 'publisher' ? '#FFFFFF' : '#E2E8F0'}
            />
            <Text style={[styles.tabChipText, activeTab === 'publisher' && styles.tabChipTextActive]}>
              Business Details
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Sheet Content Canvas */}
      <ScrollView
        style={[styles.sheet, { backgroundColor: surfaces.sheetBg }]}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'privacy' && (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <M3Badge label="GDPR & POPIA COMPLIANT" variant="mint" />
              <M3Badge label="LOCAL-FIRST OFFLINE" variant="neutral" />
            </View>

            <Text style={styles.sectionHeading}>1. Privacy Policy & Data Minimization</Text>
            <Text style={styles.bodyParagraph}>
              CashFlow Mate is engineered with a strict <Text style={styles.boldText}>privacy-first, local-offline architecture</Text>. Your financial ledger, cashbox receipts, customer debts, and market till transactions are stored directly on your personal device inside encrypted local storage.
            </Text>

            <Text style={styles.subHeading}>What We Collect & Why (Strict Data Minimization)</Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Account Credentials:</Text> An email and encrypted password for session persistence and multi-device access.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Trader Nickname & Stall Info:</Text> Used solely to label your till pass and receipts.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Ledger Records:</Text> Stored locally on device. Optional cloud synchronization is encrypted via Supabase TLS.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Zero Advertising Telemetry:</Text> We do not collect GPS location, contacts, device identifiers, or biometric face/fingerprint data. We never sell or monetize your financial information.
            </Text>

            <Text style={styles.subHeading}>Your Rights & Right to Be Forgotten</Text>
            <Text style={styles.bodyParagraph}>
              Under international privacy regulations (GDPR, POPIA, CCPA), you retain complete control over your data. You may export a complete portable JSON archive at any time, or execute a permanent, irreversible deletion of all records and credentials via the <Text style={styles.boldText}>Delete Account & Erase All Data</Text> function in Profile & Security.
            </Text>
          </View>
        )}

        {activeTab === 'terms' && (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <M3Badge label="MIT OPEN SOURCE" variant="mint" />
              <M3Badge label="BINDING AGREEMENT" variant="neutral" />
            </View>

            <Text style={styles.sectionHeading}>2. Terms of Service</Text>
            <Text style={styles.bodyParagraph}>
              By using CashFlow Mate, you agree to these Terms of Service. If you do not agree, please do not use the application.
            </Text>

            <Text style={styles.subHeading}>Acceptable Use</Text>
            <Text style={styles.bodyParagraph}>
              CashFlow Mate is designed for informal traders, shopkeepers, stallholders, and small businesses to record sales, track multiple currencies (USD, EcoCash ZiG, ZAR Rand), and manage store credit. Users agree to utilize the application solely for lawful commercial and bookkeeping purposes.
            </Text>

            <Text style={styles.subHeading}>Operator Responsibility</Text>
            <Text style={styles.bodyParagraph}>
              The accuracy of transaction inputs, exchange rate ratios, and receipt values remains the sole responsibility of the merchant. Users are encouraged to maintain regular JSON backups via the Backup & Restore screen.
            </Text>

            <Text style={styles.subHeading}>Limitation of Liability</Text>
            <Text style={styles.bodyParagraph}>
              The software is provided "AS IS", without warranty of any kind, express or implied. Under no circumstances shall the developer or contributors be held liable for commercial loss, currency fluctuations, or hardware damage arising from use of the software.
            </Text>
          </View>
        )}

        {activeTab === 'refund' && (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <M3Badge label="100% FREE CORE" variant="mint" />
              <M3Badge label="14-DAY REFUND GUARANTEE" variant="neutral" />
            </View>

            <Text style={styles.sectionHeading}>3. Refund Policy & Zero Hidden Fees</Text>
            <Text style={styles.bodyParagraph}>
              CashFlow Mate believes in complete financial transparency. We enforce a strict <Text style={styles.boldText}>No Hidden Fees</Text> guarantee.
            </Text>

            <Text style={styles.subHeading}>Free & Open Source Core</Text>
            <Text style={styles.bodyParagraph}>
              All offline bookkeeping features (including the 3-drawer cashbox, EcoCash/InnBucks SMS parser, CSV export/import, multi-currency till, and market stall pass) are 100% free and open source forever under the MIT License.
            </Text>

            <Text style={styles.subHeading}>Commercial License Refunds</Text>
            <Text style={styles.bodyParagraph}>
              For commercial enterprise activations and offline HMAC-SHA256 licenses, we offer a <Text style={styles.boldText}>14-day money-back guarantee</Text>. If an activation key fails to validate on your device or does not meet your operational requirements, contact support@cashflowmate.app within 14 days of purchase for a complete refund.
            </Text>
          </View>
        )}

        {activeTab === 'cookies' && (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <M3Badge label="NO TRACKING COOKIES" variant="mint" />
              <M3Badge label="ESSENTIAL STORAGE ONLY" variant="neutral" />
            </View>

            <Text style={styles.sectionHeading}>4. Cookie & Local Storage Policy</Text>
            <Text style={styles.bodyParagraph}>
              CashFlow Mate uses local browser storage exclusively for strictly necessary application operations when accessed on the web.
            </Text>

            <Text style={styles.subHeading}>What We Store Locally</Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Theme & Appearance:</Text> Selected dark mode, light mode, or OLED high-contrast setting.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Active Currency & Language:</Text> English, ChiShona, or SiNdebele preference.
            </Text>
            <Text style={styles.bulletItem}>
              &bull; <Text style={styles.boldText}>Session Tokens:</Text> Encrypted offline access tokens for secure return without relogging.
            </Text>
            <Text style={[styles.bodyParagraph, { marginTop: 12 }]}>
              We do <Text style={styles.boldText}>NOT</Text> use tracking cookies, retargeting pixels, Google Analytics tracking scripts, or cross-domain marketing beacons.
            </Text>
          </View>
        )}

        {activeTab === 'disclaimer' && (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <M3Badge label="AI NOTICE" variant="amber" />
              <M3Badge label="NOT FINANCIAL ADVICE" variant="neutral" />
            </View>

            <Text style={styles.sectionHeading}>5. AI Assistant & Financial Disclaimer</Text>
            <Text style={styles.bodyParagraph}>
              CashFlow Mate incorporates AI-powered business analytics (powered by Google Gemini) to assist informal traders in summarizing sales trends, forecasting reorders, and flagging overdue customer accounts.
            </Text>

            <View style={styles.noticeBox}>
              <Ionicons name="information-circle" size={20} color="#047857" />
              <Text style={styles.noticeText}>
                CashFlow Mate AI is an assistive algorithmic calculation tool. It does NOT provide certified legal, taxation, statutory accounting, or investment advice.
              </Text>
            </View>

            <Text style={styles.subHeading}>Verification Requirement</Text>
            <Text style={styles.bodyParagraph}>
              Merchants must independently verify cash totals, bank reconciliation amounts, and tax filings before submitting statutory returns to revenue authorities.
            </Text>
          </View>
        )}

        {activeTab === 'publisher' && (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <M3Badge label="OFFICIAL PUBLISHER" variant="mint" />
              <M3Badge label="REGISTERED IDENTITY" variant="neutral" />
            </View>

            <Text style={styles.sectionHeading}>6. Publisher & Business Details</Text>
            <Text style={styles.bodyParagraph}>
              In compliance with international transparency directives, our verified publisher information is published below:
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Software Title:</Text>
              <Text style={styles.detailValue}>CashFlow Mate (Professional Trader OS)</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Developer / Architect:</Text>
              <Text style={styles.detailValue}>Mr Q (Maqhawe T Ngwenya)</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Headquarters / Hub:</Text>
              <Text style={styles.detailValue}>Harare, Zimbabwe</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>License:</Text>
              <Text style={styles.detailValue}>MIT Open Source License</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Support Email:</Text>
              <Text style={styles.detailValue}>support@cashflowmate.app</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>In-App Helpdesk:</Text>
              <Text style={styles.detailValue}>Profile & Security &rarr; Report a Problem</Text>
            </View>

            <Text style={styles.subHeading}>Asset & Icon Licensing</Text>
            <Text style={styles.bodyParagraph}>
              All icons utilized are provided by Ionicons / Lucide under the MIT and SIL Open Font Licenses. All trademarks, market stall badges, and vector assets are proprietary designs by Mr Q.
            </Text>
          </View>
        )}

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
    marginBottom: 16,
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
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  tabChipActive: {
    backgroundColor: '#34D399',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  tabChipTextActive: {
    color: '#064E3B',
    fontWeight: '800',
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
    borderRadius: 24,
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
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A192F',
    marginTop: 16,
    marginBottom: 8,
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
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    marginBottom: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    lineHeight: 18,
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
