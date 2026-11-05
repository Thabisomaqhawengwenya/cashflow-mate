import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useLanguage } from '@/context/LanguageContext';
import { useAppearance } from '@/context/AppearanceContext';
import { AppLogo } from '@/components/BrandLogos';
import { TraderAvatar } from '@/components/TraderAvatar';
import { MobileStorageService, BusinessProfile } from '@/services/storage';
import { MobileAuthService, UserSession } from '@/services/auth';
import { MobileUpdateService, AppUpdateInfo } from '@/services/updates';
import { UpdateNotificationModal } from '@/components/UpdateNotificationModal';

interface NavItem {
  id: string;
  labelKey: string;
  sublabelKey: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'index',
    labelKey: 'nav_home_label',
    sublabelKey: 'nav_home_sub',
    iconActive: 'grid',
    iconInactive: 'grid-outline',
    route: '/(tabs)',
  },
  {
    id: 'transactions',
    labelKey: 'nav_records_label',
    sublabelKey: 'nav_records_sub',
    iconActive: 'receipt',
    iconInactive: 'receipt-outline',
    route: '/(tabs)/transactions',
  },
  {
    id: 'import',
    labelKey: 'nav_import_label',
    sublabelKey: 'nav_import_sub',
    iconActive: 'cloud-upload',
    iconInactive: 'cloud-upload-outline',
    route: '/(tabs)/import',
  },
  {
    id: 'debts',
    labelKey: 'nav_debts_label',
    sublabelKey: 'nav_debts_sub',
    iconActive: 'people',
    iconInactive: 'people-outline',
    route: '/(tabs)/debts',
  },
  {
    id: 'insights',
    labelKey: 'nav_assistant_label',
    sublabelKey: 'nav_assistant_sub',
    iconActive: 'sparkles',
    iconInactive: 'sparkles-outline',
    route: '/(tabs)/insights',
  },
];

export const DesktopSidebar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { palette, isDarkMode, toggleDarkMode } = useAppearance();

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);

  const loadProfile = async () => {
    const [biz, sess] = await Promise.all([
      MobileStorageService.getBusiness(),
      MobileAuthService.getSession(),
    ]);
    setBusiness(biz);
    setSession(sess);
  };

  useEffect(() => {
    loadProfile();
    MobileUpdateService.checkForUpdate(false, false)
      .then((info) => {
        if (info && info.hasUpdate) {
          setUpdateInfo(info);
        }
      })
      .catch(() => {});

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleSync = () => loadProfile();
      window.addEventListener('cashflow_profile_sync', handleSync);
      return () => window.removeEventListener('cashflow_profile_sync', handleSync);
    }
  }, []);

  const userDisplayName = session?.username || session?.name || business?.ownerName || 'Trader';

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
    <View style={[styles.sidebar, { backgroundColor: palette.headerBg }]}>
      {/* 1. Brand Logo Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <AppLogo size={42} />
          <View style={styles.logoTextWrapper}>
            <Text style={styles.brandTitle}>CashFlow Mate</Text>
            <Text style={[styles.brandSubtitle, { color: palette.accent }]}>
              ZIM MARKET TILL OS
            </Text>
          </View>
          <Pressable
            onPress={toggleDarkMode}
            style={styles.themeToggleBtn}
            accessibilityRole="button"
            accessibilityLabel={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Theme'}
          >
            <Ionicons
              name={isDarkMode ? 'sunny' : 'moon'}
              size={16}
              color={isDarkMode ? '#FBBF24' : palette.accent}
            />
          </Pressable>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>{t('offline_engine_ready')}</Text>
        </View>
      </View>

      {/* 2. Scrollable Middle Area (Navigation + Business Suite & Studio) */}
      <ScrollView
        style={styles.middleScroll}
        contentContainerStyle={styles.middleScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navSection}>
          <Text style={styles.sectionLabel}>NAVIGATION</Text>
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            return (
              <Pressable
                key={item.id}
                onPress={() => handleNav(item)}
                accessibilityRole="button"
                accessibilityLabel={t(item.labelKey)}
                style={({ pressed }) => [
                  styles.navItem,
                  active && styles.navItemActive,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
                ]}
              >
                {active && <View style={[styles.activeBar, { backgroundColor: palette.accent }]} />}
                <View
                  style={[
                    styles.iconSquircle,
                    active ? styles.iconSquircleActive : styles.iconSquircleInactive,
                  ]}
                >
                  <Ionicons
                    name={active ? item.iconActive : item.iconInactive}
                    size={18}
                    color={active ? palette.accent : '#94A3B8'}
                  />
                </View>

                <View style={styles.navTextCol}>
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {t(item.labelKey)}
                  </Text>
                  <Text
                    style={[
                      styles.navSublabel,
                      active && [styles.navSublabelActive, { color: palette.accent }],
                    ]}
                  >
                    {t(item.sublabelKey)}
                  </Text>
                </View>

                {active && (
                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color={palette.accent}
                    style={styles.activeChevron}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* 3. Business Suite & UI Studio Links */}
        <View style={styles.suiteBox}>
          <Text style={styles.sectionLabel}>BUSINESS SUITE & STUDIO</Text>
          <View style={styles.suiteQuickGrid}>
            {[
              { label: 'Profile', icon: 'person-circle-outline', route: '/profile' },
              { label: 'Inventory', icon: 'cube-outline', route: '/inventory' },
              { label: 'Quotes', icon: 'document-text-outline', route: '/invoices' },
              { label: 'Contacts', icon: 'briefcase-outline', route: '/contacts' },
              { label: 'UI Studio', icon: 'color-palette-outline', route: '/appearance' },
            ].map((tool) => (
              <Pressable
                key={tool.route}
                onPress={() => router.push(tool.route as any)}
                style={styles.suiteQuickPill}
              >
                <Ionicons name={tool.icon as any} size={14} color={palette.accent} />
                <Text style={styles.suiteQuickText}>{tool.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 4. Footer: Trader Profile & Settings Action */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push('/profile' as any)}
          accessibilityRole="button"
          accessibilityLabel="Open Trader Profile and Market Pass"
          style={({ pressed }) => [
            styles.profileButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <TraderAvatar
            size={36}
            avatarUri={business?.avatarUri || session?.avatarUri}
            avatarPreset={business?.avatarPreset || session?.avatarPreset}
            name={userDisplayName}
            borderWidth={1.5}
            borderColor={palette.accent}
          />
          <View style={styles.profileTextWrapper}>
            <Text style={styles.profileTitle} numberOfLines={1}>
              {userDisplayName}
            </Text>
            <Text style={styles.profileSubtitle} numberOfLines={1}>
              {business?.name || 'Mbare Tuckshop'}
            </Text>
          </View>
          <Ionicons name="settings-outline" size={16} color="rgba(255, 255, 255, 0.45)" />
        </Pressable>

        {updateInfo?.hasUpdate && (
          <Pressable
            onPress={() => setIsUpdateModalVisible(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#0284C7',
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: 9999,
              marginBottom: 8,
              alignSelf: 'center',
            }}
          >
            <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>
              Update Available (v{updateInfo.latestVersion})
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={async () => {
            const info = await MobileUpdateService.checkForUpdate(true, true);
            setUpdateInfo(info);
            setIsUpdateModalVisible(true);
          }}
          style={styles.versionRow}
        >
          <Text style={styles.versionText}>Cashflow v1.3.0 • Production Release</Text>
        </Pressable>
      </View>

      <UpdateNotificationModal
        visible={isUpdateModalVisible}
        updateInfo={updateInfo}
        onClose={() => setIsUpdateModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 270,
    backgroundColor: BlueTokens.darkNavy,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 20,
    paddingBottom: 16,
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
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: BlueTokens.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoTextWrapper: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: BlueTokens.accent,
    letterSpacing: 1.1,
    marginTop: 1,
  },
  themeToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 101, 216, 0.18)',
    borderRadius: DesignTokens.shapes.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(85, 215, 255, 0.28)',
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BlueTokens.success,
    marginRight: 7,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: BlueTokens.accent,
    letterSpacing: 0.6,
  },
  middleScroll: {
    flex: 1,
  },
  middleScrollContent: {
    paddingBottom: 10,
  },
  navSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.36)',
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
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
    top: 7,
    bottom: 7,
    width: 3.5,
    borderRadius: 2,
    backgroundColor: BlueTokens.accent,
  },
  iconSquircle: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
  suiteBox: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  suiteQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suiteQuickPill: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  suiteQuickText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  profileAvatar: {
    width: 30,
    height: 30,
    borderRadius: 9,
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
    marginTop: 8,
  },
  versionText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 0.2,
  },
});
