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

export default function CookiesPolicyScreen() {
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
            <Text style={styles.headerTitle}>Cookies &amp; Storage Policy</Text>
            <Text style={[styles.headerSubtitle, { color: palette.accent }]}>
              TRANSPARENT CLIENT STORAGE
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
              ZERO TRACKING COOKIES &bull; ESSENTIAL STORAGE ONLY
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
            <M3Badge label="NO THIRD-PARTY COOKIES" variant="mint" />
            <M3Badge label="STRICT LOCAL PERSISTENCE" variant="neutral" />
          </View>

          <Text style={styles.sectionHeading}>Cookies &amp; Local Storage Policy</Text>
          <Text style={[styles.bodyParagraph, { fontWeight: '600', color: '#64748B', marginBottom: 14 }]}>
            Last updated: 4 November 2026 &bull; Effective date: 4 November 2026
          </Text>

          <Text style={styles.subHeading}>1. Strict Local Storage Architecture</Text>
          <Text style={styles.bodyParagraph}>
            CashFlow Mate uses modern HTML5 Web Storage (<Text style={styles.boldText}>localStorage</Text> and <Text style={styles.boldText}>AsyncStorage</Text>) exclusively for strictly necessary, functional operations. We do <Text style={styles.boldText}>NOT</Text> use invasive tracking cookies, third-party advertising pixels, or cross-site fingerprinting technologies.
          </Text>

          <Text style={styles.subHeading}>2. What We Store Locally on Your Device</Text>
          <Text style={styles.bodyParagraph}>
            All stored elements are confined to your own browser or mobile app sandboxed storage to provide a seamless offline-first experience:
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>Theme &amp; Appearance:</Text> Remembers your selected dark mode, light mode, OLED high-contrast palette, and corner radius tokens.
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>Active Currency &amp; Language:</Text> Remembers whether your active cash drawer is USD, ZiG, or ZAR, and your language preference (English, ChiShona, SiNdebele).
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>Local Till Ledger:</Text> Stores your transaction records, customer debts, and inventory counts locally so you can trade without an internet connection.
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>Encrypted Session Tokens:</Text> Stores secure, hashed local credentials to allow quick till return without typing your full password repeatedly.
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>Privacy Shield State:</Text> Preserves your till privacy mask preference (`••••`).
          </Text>

          <Text style={styles.subHeading}>3. What We Never Do</Text>
          <Text style={styles.bulletItem}>
            &bull; We do <Text style={styles.boldText}>NOT</Text> set cross-domain marketing or retargeting cookies (such as Facebook Pixel or Google Ads cookies).
          </Text>
          <Text style={styles.bulletItem}>
            &bull; We do <Text style={styles.boldText}>NOT</Text> sell, license, or monetize your browsing behavior or transaction history to data brokers.
          </Text>
          <Text style={styles.bulletItem}>
            &bull; We do <Text style={styles.boldText}>NOT</Text> share cookies with competitor merchant stalls or financial institutions.
          </Text>

          <Text style={styles.subHeading}>4. How to Clear or Reset Your Local Storage</Text>
          <Text style={styles.bodyParagraph}>
            You maintain 100% control over your client storage:
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>Browser Controls:</Text> In your browser settings, you can clear "Cookies and Site Data" for `cashflowmate.app` at any time.
          </Text>
          <Text style={styles.bulletItem}>
            &bull; <Text style={styles.boldText}>Permanent In-App Erase:</Text> Inside the mobile or web app, navigate to <Text style={styles.boldText}>Profile &rarr; Delete Account &amp; Erase All Data</Text> to permanently purge all local ledger keys and session tokens in one click.
          </Text>

          <Text style={styles.subHeading}>5. Regulatory Compliance</Text>
          <Text style={styles.bodyParagraph}>
            This policy adheres strictly to the principles of data minimization and purpose limitation set out in Zimbabwe’s <Text style={styles.boldText}>Cyber and Data Protection Act [Chapter 12:07]</Text> and POTRAZ digital consumer protection directives.
          </Text>

          <Text style={styles.subHeading}>6. Privacy Contact</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Data Controller:</Text>
            <Text style={styles.detailValue}>Maqhawe T Ngwenya</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Privacy Email:</Text>
            <Text style={styles.detailValue}>privacy@cashflowmate.app</Text>
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
