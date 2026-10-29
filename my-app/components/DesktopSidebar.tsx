import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';

interface NavItem {
  id: string;
  name: string;
  label: string;
  sublabel: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'index',
    name: 'Home',
    label: 'Home Dashboard',
    sublabel: 'Till & Cashbox Float',
    iconActive: 'grid',
    iconInactive: 'grid-outline',
    route: '/(tabs)',
  },
  {
    id: 'transactions',
    name: 'Records',
    label: 'Ledger Records',
    sublabel: 'Cash Inflows & Outflows',
    iconActive: 'receipt',
    iconInactive: 'receipt-outline',
    route: '/(tabs)/transactions',
  },
  {
    id: 'import',
    name: 'Import',
    label: 'CSV Data Ingest',
    sublabel: 'Bank & Mobile CSVs',
    iconActive: 'cloud-upload',
    iconInactive: 'cloud-upload-outline',
    route: '/(tabs)/import',
  },
  {
    id: 'debts',
    name: 'Debts',
    label: 'Debts & Credit',
    sublabel: 'Customer & Supplier Book',
    iconActive: 'people',
    iconInactive: 'people-outline',
    route: '/(tabs)/debts',
  },
  {
    id: 'insights',
    name: 'Assistant',
    label: 'Financial Assistant',
    sublabel: 'Grounded Gemini AI',
    iconActive: 'sparkles',
    iconInactive: 'sparkles-outline',
    route: '/(tabs)/insights',
  },
];

export const DesktopSidebar: React.FC = () => {
  const pathname = usePathname();

  const isItemActive = (item: NavItem) => {
    if (item.id === 'index') {
      return (
        pathname === '/' ||
        pathname === '/(tabs)' ||
        pathname === '' ||
        pathname === '/index' ||
        pathname === '/(tabs)/index'
      );
    }
    return pathname.includes(item.id);
  };

  const handleNav = (item: NavItem) => {
    router.push(item.route as any);
  };

  return (
    <View style={styles.sidebar}>
      {/* 1. Brand Logo Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="wallet" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.logoTextWrapper}>
            <Text style={styles.brandTitle}>CashFlow Mate</Text>
            <Text style={styles.brandSubtitle}>ZIM MARKET TILL OS</Text>
          </View>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>OFFLINE ENGINE READY</Text>
        </View>
      </View>

      {/* 2. Navigation Items List */}
      <View style={styles.navSection}>
        <Text style={styles.sectionLabel}>NAVIGATION</Text>
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item);
          return (
            <Pressable
              key={item.id}
              onPress={() => handleNav(item)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
              ]}
            >
              {active && <View style={styles.activeBar} />}
              <View
                style={[
                  styles.iconSquircle,
                  active ? styles.iconSquircleActive : styles.iconSquircleInactive,
                ]}
              >
                <Ionicons
                  name={active ? item.iconActive : item.iconInactive}
                  size={19}
                  color={active ? BlueTokens.accent : '#94A3B8'}
                />
              </View>

              <View style={styles.navTextCol}>
                <Text
                  style={[
                    styles.navLabel,
                    active && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.navSublabel,
                    active && styles.navSublabelActive,
                  ]}
                >
                  {item.sublabel}
                </Text>
              </View>

              {active && (
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={BlueTokens.accent}
                  style={styles.activeChevron}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* 3. Multi-Currency Quick Indicator Box */}
      <View style={styles.currencyBox}>
        <View style={styles.currencyBoxHeader}>
          <Ionicons name="cash-outline" size={14} color={BlueTokens.accent} />
          <Text style={styles.currencyBoxTitle}>3-Drawer Till Float</Text>
        </View>
        <Text style={styles.currencyBoxDesc}>
          USD • ZiG • ZAR cash floats segregated with automated End-of-Day Z-Report reconciliation.
        </Text>
      </View>

      {/* 4. Footer: Till Security & PIN Modal Action */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push('/modal')}
          accessibilityRole="button"
          accessibilityLabel="Till Security and PIN settings"
          style={({ pressed }) => [
            styles.profileButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={styles.profileAvatar}>
            <Ionicons name="lock-closed" size={17} color={BlueTokens.accent} />
          </View>
          <View style={styles.profileTextWrapper}>
            <Text style={styles.profileTitle} numberOfLines={1}>
              Till Security & PIN
            </Text>
            <Text style={styles.profileSubtitle} numberOfLines={1}>
              Privacy Shield & License
            </Text>
          </View>
          <Ionicons name="settings-outline" size={16} color="rgba(255, 255, 255, 0.45)" />
        </Pressable>

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>CashFlow Mate v1.2.0 • ECC Division</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 270,
    backgroundColor: BlueTokens.darkNavy, // #06152E Deep Navy luxury canvas
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    ...Platform.select({
      web: {
        userSelect: 'none',
      },
    }),
  },
  header: {
    marginBottom: 26,
    paddingHorizontal: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: BlueTokens.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: BlueTokens.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  logoTextWrapper: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: BlueTokens.accent,
    letterSpacing: 1.1,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 101, 216, 0.18)',
    borderRadius: DesignTokens.shapes.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(85, 215, 255, 0.28)',
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BlueTokens.success, // Semantic Green for system active/healthy
    marginRight: 7,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: BlueTokens.accent,
    letterSpacing: 0.6,
  },
  navSection: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.36)',
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: 'rgba(21, 101, 216, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(85, 215, 255, 0.32)',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3.5,
    borderRadius: 2,
    backgroundColor: BlueTokens.accent,
  },
  iconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconSquircleActive: {
    backgroundColor: 'rgba(21, 101, 216, 0.35)',
  },
  iconSquircleInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  navTextCol: {
    flex: 1,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    letterSpacing: 0.1,
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  navSublabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 1,
  },
  navSublabelActive: {
    color: BlueTokens.accent,
  },
  activeChevron: {
    marginLeft: 6,
  },
  currencyBox: {
    backgroundColor: 'rgba(21, 101, 216, 0.16)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(85, 215, 255, 0.15)',
    marginBottom: 16,
  },
  currencyBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  currencyBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: BlueTokens.accent,
    marginLeft: 6,
  },
  currencyBoxDesc: {
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  footer: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(21, 101, 216, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  profileTextWrapper: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 1,
  },
  versionRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  versionText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 0.2,
  },
});
