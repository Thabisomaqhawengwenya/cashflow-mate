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
import { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import {
  useAppearance,
  THEME_PALETTES,
  NavBarStyle,
  ThemePaletteId,
  CornerGeometry,
} from '@/context/AppearanceContext';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';

const NAV_STYLES: Array<{
  id: NavBarStyle;
  title: string;
  subtitle: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    id: 'floating_pill',
    title: 'Floating Pill Dock',
    subtitle: 'Detached stadium capsule floating above the bottom edge with active pill tags',
    badge: 'POPULAR',
    icon: 'Resize-outline' as any,
  },
  {
    id: 'compact_pill',
    title: 'Compact Floating Capsule',
    subtitle: 'Centered narrow floating pill dock with dark glass surface and glowing active tab',
    badge: 'SLEEK',
    icon: 'sparkles-outline',
  },
  {
    id: 'curved_sheet',
    title: 'Curved Top-Edge Dock',
    subtitle: 'Full-width bar with 26px sculpted top corners hugging the bottom edge',
    badge: 'MODERN',
    icon: 'layers-outline',
  },
  {
    id: 'classic_dock',
    title: 'Classic Full-Width Bar',
    subtitle: 'Traditional edge-to-edge bottom navigation bar with crisp top divider',
    badge: 'CLASSIC',
    icon: 'grid-outline',
  },
];

const GEOMETRY_OPTIONS: Array<{
  id: CornerGeometry;
  title: string;
  subtitle: string;
  radiusLabel: string;
}> = [
  {
    id: 'pill',
    title: 'Full Pill Capsules',
    subtitle: '9999px stadium pills on buttons/chips and 24px soft cards',
    radiusLabel: '9999px',
  },
  {
    id: 'squircle',
    title: 'Tactile Squircle',
    subtitle: '14px squircle buttons and 18px balanced cards',
    radiusLabel: '14px',
  },
  {
    id: 'sharp',
    title: 'Crisp Architectural',
    subtitle: '6px structured corners and 8px high-contrast cards',
    radiusLabel: '6px',
  },
];

export default function AppearanceScreen() {
  const {
    navBarStyle,
    themeId,
    cornerGeometry,
    palette,
    cardRadius,
    chipRadius,
    setNavBarStyle,
    setThemeId,
    setCornerGeometry,
    resetAppearance,
  } = useAppearance();

  return (
    <View style={[styles.screenWrapper, { backgroundColor: palette.headerBg }]}>
      {/* 1. Header + Live Interactive Preview Stage */}
      <View style={[styles.header, { backgroundColor: palette.headerBg }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.titleCol}>
            <Text style={styles.headerTitle}>Appearance & UI Studio</Text>
            <Text style={[styles.headerSub, { color: palette.accent }]}>
              CUSTOMIZE NAV BAR • PALETTE • GEOMETRY
            </Text>
          </View>
          <Pressable
            onPress={resetAppearance}
            style={[styles.resetChip, { borderRadius: chipRadius }]}
          >
            <Text style={styles.resetChipText}>Reset</Text>
          </Pressable>
        </View>

        {/* Live Interactive Nav Bar Preview Box */}
        <View style={styles.previewStage}>
          <View style={styles.previewHeaderRow}>
            <Text style={styles.previewLabel}>LIVE NAVIGATION BAR PREVIEW</Text>
            <Text style={[styles.previewModeTag, { color: palette.accent }]}>
              {navBarStyle.replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          <View
            style={[
              styles.mockNavBar,
              navBarStyle === 'floating_pill' && styles.mockFloatingPill,
              navBarStyle === 'compact_pill' && [
                styles.mockCompactPill,
                { backgroundColor: palette.headerBg },
              ],
              navBarStyle === 'curved_sheet' && styles.mockCurvedSheet,
              navBarStyle === 'classic_dock' && styles.mockClassicDock,
            ]}
          >
            {[
              { label: 'Home', icon: 'grid', active: true },
              { label: 'Records', icon: 'receipt-outline', active: false },
              { label: 'Import', icon: 'cloud-upload-outline', active: false },
              { label: 'Debts', icon: 'people-outline', active: false },
              { label: 'AI', icon: 'sparkles-outline', active: false },
            ].map((tab, i) => {
              const isDarkDock = navBarStyle === 'compact_pill';
              const activeColor = isDarkDock ? palette.accent : palette.primary;
              const inactiveColor = isDarkDock ? 'rgba(255,255,255,0.55)' : '#94A3B8';

              return (
                <View
                  key={i}
                  style={[
                    styles.mockTabItem,
                    tab.active &&
                      (navBarStyle === 'floating_pill' || navBarStyle === 'compact_pill') && {
                        backgroundColor: isDarkDock
                          ? 'rgba(255,255,255,0.12)'
                          : palette.surfaceTint,
                        borderRadius: 9999,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                      },
                  ]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={tab.active ? activeColor : inactiveColor}
                  />
                  <Text
                    style={[
                      styles.mockTabLabel,
                      { color: tab.active ? activeColor : inactiveColor },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* 2. Customization Sheet */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContent}>
          {/* SECTION 1: Navigation Bar Architecture */}
          <Text style={styles.sectionTitle}>1. Navigation Bar Style</Text>
          <Text style={styles.sectionSub}>
            Choose how the bottom navigation bar looks and floats across mobile screens.
          </Text>

          {NAV_STYLES.map((option) => {
            const selected = navBarStyle === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setNavBarStyle(option.id)}
                style={[
                  styles.optionCard,
                  { borderRadius: cardRadius },
                  selected && {
                    borderColor: palette.primary,
                    borderWidth: 2,
                    backgroundColor: '#F8FAFC',
                  },
                ]}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.radioOuter,
                      selected && { borderColor: palette.primary },
                    ]}
                  >
                    {selected && (
                      <View
                        style={[styles.radioInner, { backgroundColor: palette.primary }]}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.optionTitleRow}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <M3Badge
                        label={selected ? 'ACTIVE' : option.badge}
                        variant={selected ? 'mint' : 'primary'}
                      />
                    </View>
                    <Text style={styles.optionSub}>{option.subtitle}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {/* SECTION 2: Brand Color & Atmosphere */}
          <Text style={[styles.sectionTitle, { marginTop: 22 }]}>
            2. Brand Atmosphere & Palette
          </Text>
          <Text style={styles.sectionSub}>
            Personalize your till header canvas, primary buttons, and active highlights.
          </Text>

          <View style={styles.paletteGrid}>
            {(Object.keys(THEME_PALETTES) as ThemePaletteId[]).map((key) => {
              const item = THEME_PALETTES[key];
              const selected = themeId === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setThemeId(key)}
                  style={[
                    styles.paletteCard,
                    { borderRadius: cardRadius },
                    selected && { borderColor: item.primary, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.swatchRow}>
                    <View style={[styles.swatchCircle, { backgroundColor: item.headerBg }]} />
                    <View style={[styles.swatchCircle, { backgroundColor: item.primary }]} />
                    <View style={[styles.swatchCircle, { backgroundColor: item.accent }]} />
                  </View>
                  <Text style={styles.paletteName}>{item.name}</Text>
                  <Text style={styles.paletteSub} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* SECTION 3: Element & Button Geometry */}
          <Text style={[styles.sectionTitle, { marginTop: 22 }]}>
            3. Button & Card Geometry
          </Text>
          <Text style={styles.sectionSub}>
            Switch between continuous stadium pills, tactile squircles, or sharp corners.
          </Text>

          <View style={styles.geometryRow}>
            {GEOMETRY_OPTIONS.map((geo) => {
              const selected = cornerGeometry === geo.id;
              return (
                <Pressable
                  key={geo.id}
                  onPress={() => setCornerGeometry(geo.id)}
                  style={[
                    styles.geoCard,
                    { borderRadius: cardRadius },
                    selected && { borderColor: palette.primary, borderWidth: 2 },
                  ]}
                >
                  <View
                    style={[
                      styles.geoRadiusBadge,
                      {
                        backgroundColor: selected ? palette.primary : '#E2E8F0',
                        borderRadius:
                          geo.id === 'pill' ? 9999 : geo.id === 'squircle' ? 10 : 4,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.geoRadiusText,
                        { color: selected ? '#FFFFFF' : EmeraldTokens.textSlate },
                      ]}
                    >
                      {geo.radiusLabel}
                    </Text>
                  </View>
                  <Text style={styles.geoTitle}>{geo.title}</Text>
                  <Text style={styles.geoSub}>{geo.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 24 }}>
            <M3Button
              label="APPLY & RETURN TO TILL"
              variant="mint"
              size="lg"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: EmeraldTokens.deepPine,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : 34,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  resetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  resetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewStage: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.8,
  },
  previewModeTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  mockNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  mockFloatingPill: {
    borderRadius: 9999,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  mockCompactPill: {
    borderRadius: 9999,
    marginHorizontal: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mockCurvedSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  mockClassicDock: {
    borderRadius: 4,
    borderTopWidth: 2,
    borderTopColor: '#CBD5E1',
  },
  mockTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  mockTabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: EmeraldTokens.canvasLight,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 48,
  },
  innerContent: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    marginBottom: 14,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
  },
  optionSub: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    lineHeight: 17,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paletteCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  swatchCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  paletteName: {
    fontSize: 14,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
    marginBottom: 3,
  },
  paletteSub: {
    fontSize: 11,
    color: EmeraldTokens.textMuted,
    lineHeight: 15,
  },
  geometryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  geoCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
  },
  geoRadiusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  geoRadiusText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  geoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
    marginBottom: 3,
  },
  geoSub: {
    fontSize: 11,
    color: EmeraldTokens.textMuted,
    lineHeight: 15,
  },
});
