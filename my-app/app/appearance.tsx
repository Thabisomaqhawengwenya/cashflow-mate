import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
    icon: ' albums-outline' as any,
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

const HEADER_SWATCHES = [
  '#06152E', // Deep Royal Navy
  '#0C382E', // Heritage Emerald Pine
  '#090D16', // Obsidian Carbon
  '#1E1035', // Imperial Plum
  '#27150E', // Espresso Clay
  '#1E1B4B', // Midnight Indigo
  '#31102F', // Burgundy Wine
  '#0F2942', // Atlantic Slate
  '#111827', // Graphite Dark
  '#042F2E', // Deep Ocean Teal
];

const PRIMARY_SWATCHES = [
  '#1565D8', // Electric Blue
  '#059669', // Emerald Green
  '#7C3AED', // Royal Violet
  '#E11D48', // Crimson Rose
  '#D97706', // Amber Gold
  '#EA580C', // Terracotta Orange
  '#0284C7', // Sky Cobalt
  '#DB2777', // Vivid Magenta
  '#4F46E5', // Indigo Volt
  '#0D9488', // Tropical Teal
];

const ACCENT_SWATCHES = [
  '#55D7FF', // Cyan Glow
  '#34D399', // Mint Neon
  '#FBBF24', // Champagne Gold
  '#C4B5FD', // Soft Orchid
  '#FB7185', // Coral Rose
  '#FDBA74', // Warm Peach
  '#38BDF8', // Ice Sky
  '#A3E635', // Chartreuse Lime
  '#F472B6', // Pink Quartz
  '#E2E8F0', // Platinum Silver
];

function isValidHex(val: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(val.trim());
}

export default function AppearanceScreen() {
  const {
    navBarStyle,
    themeId,
    cornerGeometry,
    isDarkMode,
    customColors,
    palette,
    surfaces,
    cardRadius,
    chipRadius,
    setNavBarStyle,
    setThemeId,
    setCornerGeometry,
    setIsDarkMode,
    setCustomColors,
    resetAppearance,
  } = useAppearance();

  const [hexHeader, setHexHeader] = useState(customColors.headerBg);
  const [hexPrimary, setHexPrimary] = useState(customColors.primary);
  const [hexAccent, setHexAccent] = useState(customColors.accent);

  useEffect(() => {
    setHexHeader(customColors.headerBg);
    setHexPrimary(customColors.primary);
    setHexAccent(customColors.accent);
  }, [customColors.headerBg, customColors.primary, customColors.accent]);

  const handleHexInput = (
    channel: 'headerBg' | 'primary' | 'accent',
    raw: string,
    setter: (v: string) => void
  ) => {
    const formatted = raw.startsWith('#') ? raw : `#${raw}`;
    setter(formatted);
    if (isValidHex(formatted)) {
      setCustomColors({ [channel]: formatted.toUpperCase() });
    }
  };

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
              DARK THEME • CUSTOM COLORS • NAV BAR • GEOMETRY
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
            <Text style={styles.previewLabel}>
              LIVE PREVIEW ({isDarkMode ? 'DARK THEME' : 'LIGHT MODE'})
            </Text>
            <Text style={[styles.previewModeTag, { color: palette.accent }]}>
              {navBarStyle.replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          <View
            style={[
              styles.mockNavBar,
              {
                backgroundColor:
                  navBarStyle === 'compact_pill' ? palette.headerBg : surfaces.navBarBg,
              },
              navBarStyle === 'floating_pill' && styles.mockFloatingPill,
              navBarStyle === 'compact_pill' && styles.mockCompactPill,
              navBarStyle === 'curved_sheet' && styles.mockCurvedSheet,
              navBarStyle === 'classic_dock' && [
                styles.mockClassicDock,
                { borderTopColor: surfaces.border },
              ],
            ]}
          >
            {[
              { label: 'Home', icon: 'grid', active: true },
              { label: 'Records', icon: 'receipt-outline', active: false },
              { label: 'Import', icon: 'cloud-upload-outline', active: false },
              { label: 'Debts', icon: 'people-outline', active: false },
              { label: 'AI', icon: 'sparkles-outline', active: false },
            ].map((tab, i) => {
              const isDarkDock = navBarStyle === 'compact_pill' || isDarkMode;
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
        style={[styles.sheetContainer, { backgroundColor: surfaces.sheetBg }]}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContent}>
          {/* SECTION 1: Light Mode vs. Dark Theme */}
          <Text style={[styles.sectionTitle, { color: surfaces.textPrimary }]}>
            1. Surface Theme (Light vs. Dark Mode)
          </Text>
          <Text style={[styles.sectionSub, { color: surfaces.textMuted }]}>
            Switch between crisp Daylight Alabaster and high-contrast Obsidian Dark Theme.
          </Text>

          <View style={styles.modeToggleRow}>
            <Pressable
              onPress={() => setIsDarkMode(false)}
              style={[
                styles.modeCard,
                {
                  backgroundColor: surfaces.cardBg,
                  borderRadius: cardRadius,
                  borderColor: !isDarkMode ? palette.primary : surfaces.border,
                  borderWidth: !isDarkMode ? 2 : 1,
                },
              ]}
            >
              <View style={styles.modeIconHeader}>
                <View style={[styles.modePreviewCircle, { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]}>
                  <Ionicons name="sunny" size={18} color="#F59E0B" />
                </View>
                {!isDarkMode && <M3Badge label="ACTIVE" variant="mint" />}
              </View>
              <Text style={[styles.modeTitle, { color: surfaces.textPrimary }]}>
                Daylight Alabaster
              </Text>
              <Text style={[styles.modeSub, { color: surfaces.textMuted }]}>
                Crisp white cards & high-legibility outdoor market contrast
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setIsDarkMode(true)}
              style={[
                styles.modeCard,
                {
                  backgroundColor: surfaces.cardBg,
                  borderRadius: cardRadius,
                  borderColor: isDarkMode ? palette.accent : surfaces.border,
                  borderWidth: isDarkMode ? 2 : 1,
                },
              ]}
            >
              <View style={styles.modeIconHeader}>
                <View style={[styles.modePreviewCircle, { backgroundColor: '#0F172A', borderColor: '#334155' }]}>
                  <Ionicons name="moon" size={18} color="#38BDF8" />
                </View>
                {isDarkMode && <M3Badge label="ACTIVE" variant="mint" />}
              </View>
              <Text style={[styles.modeTitle, { color: surfaces.textPrimary }]}>
                Obsidian Dark Theme
              </Text>
              <Text style={[styles.modeSub, { color: surfaces.textMuted }]}>
                Deep midnight slate surfaces (`#0B111E`) for night & low-glare use
              </Text>
            </Pressable>
          </View>

          {/* SECTION 2: Preset Palettes & Custom Color Studio */}
          <Text style={[styles.sectionTitle, { color: surfaces.textPrimary, marginTop: 22 }]}>
            2. Brand Atmosphere & Custom Color Picker
          </Text>
          <Text style={[styles.sectionSub, { color: surfaces.textMuted }]}>
            Pick a curated preset palette or craft your own custom colors below.
          </Text>

          <View style={styles.paletteGrid}>
            {(Object.keys(THEME_PALETTES) as Array<Exclude<ThemePaletteId, 'custom'>>).map(
              (key) => {
                const item = THEME_PALETTES[key];
                const selected = themeId === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setThemeId(key)}
                    style={[
                      styles.paletteCard,
                      {
                        backgroundColor: surfaces.cardBg,
                        borderRadius: cardRadius,
                        borderColor: selected ? item.primary : surfaces.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={styles.swatchRow}>
                      <View style={[styles.swatchCircle, { backgroundColor: item.headerBg }]} />
                      <View style={[styles.swatchCircle, { backgroundColor: item.primary }]} />
                      <View style={[styles.swatchCircle, { backgroundColor: item.accent }]} />
                      {selected && (
                        <View style={{ marginLeft: 'auto' }}>
                          <M3Badge label="ACTIVE" variant="mint" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.paletteName, { color: surfaces.textPrimary }]}>
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.paletteSub, { color: surfaces.textMuted }]}
                      numberOfLines={2}
                    >
                      {item.subtitle}
                    </Text>
                  </Pressable>
                );
              }
            )}

            {/* Custom Palette Card */}
            <Pressable
              onPress={() => setThemeId('custom')}
              style={[
                styles.paletteCard,
                {
                  backgroundColor: surfaces.cardBg,
                  borderRadius: cardRadius,
                  borderColor: themeId === 'custom' ? customColors.primary : surfaces.border,
                  borderWidth: themeId === 'custom' ? 2 : 1,
                },
              ]}
            >
              <View style={styles.swatchRow}>
                <View
                  style={[styles.swatchCircle, { backgroundColor: customColors.headerBg }]}
                />
                <View
                  style={[styles.swatchCircle, { backgroundColor: customColors.primary }]}
                />
                <View
                  style={[styles.swatchCircle, { backgroundColor: customColors.accent }]}
                />
                {themeId === 'custom' && (
                  <View style={{ marginLeft: 'auto' }}>
                    <M3Badge label="CUSTOM" variant="mint" />
                  </View>
                )}
              </View>
              <Text style={[styles.paletteName, { color: surfaces.textPrimary }]}>
                Custom Trader Colors
              </Text>
              <Text style={[styles.paletteSub, { color: surfaces.textMuted }]} numberOfLines={2}>
                Your own custom Header, Primary Button, and Highlight colors
              </Text>
            </Pressable>
          </View>

          {/* Interactive Custom Color Builder Card */}
          <View
            style={[
              styles.customBuilderCard,
              {
                backgroundColor: surfaces.cardBg,
                borderRadius: cardRadius,
                borderColor: themeId === 'custom' ? palette.primary : surfaces.border,
              },
            ]}
          >
            <View style={styles.customHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.customBuilderTitle, { color: surfaces.textPrimary }]}>
                  Custom Color Studio — Choose Your Own Colors
                </Text>
                <Text style={[styles.customBuilderSub, { color: surfaces.textMuted }]}>
                  Tap any color swatch, type a `#HEX` code, or click the color wheel box to pick any shade.
                </Text>
              </View>
              <M3Badge
                label={themeId === 'custom' ? 'CUSTOM ACTIVE' : 'TAP TO CUSTOMIZE'}
                variant={themeId === 'custom' ? 'mint' : 'primary'}
              />
            </View>

            {/* Channel A: Header & Sidebar Canvas */}
            <View style={styles.colorChannelBlock}>
              <View style={styles.channelLabelRow}>
                <Text style={[styles.channelTitle, { color: surfaces.textPrimary }]}>
                  A. Header & Sidebar Canvas Color
                </Text>
                <View style={styles.hexInputGroup}>
                  {Platform.OS === 'web' ? (
                    <input
                      type="color"
                      value={isValidHex(hexHeader) ? hexHeader : '#06152E'}
                      onChange={(e: any) =>
                        handleHexInput('headerBg', e.target.value, setHexHeader)
                      }
                      style={{
                        width: 30,
                        height: 30,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                      }}
                      title="Pick any Header color"
                    />
                  ) : (
                    <View
                      style={[
                        styles.colorPreviewBox,
                        { backgroundColor: customColors.headerBg },
                      ]}
                    />
                  )}
                  <TextInput
                    style={[
                      styles.hexInput,
                      {
                        color: surfaces.textPrimary,
                        backgroundColor: surfaces.inputBg,
                        borderColor: surfaces.border,
                      },
                    ]}
                    value={hexHeader}
                    onChangeText={(txt) => handleHexInput('headerBg', txt, setHexHeader)}
                    maxLength={7}
                    autoCapitalize="characters"
                    placeholder="#06152E"
                  />
                </View>
              </View>
              <View style={styles.swatchStrip}>
                {HEADER_SWATCHES.map((hex) => {
                  const active =
                    customColors.headerBg.toUpperCase() === hex.toUpperCase() &&
                    themeId === 'custom';
                  return (
                    <Pressable
                      key={hex}
                      onPress={() => handleHexInput('headerBg', hex, setHexHeader)}
                      style={[
                        styles.pickSwatch,
                        { backgroundColor: hex },
                        active && styles.pickSwatchActive,
                      ]}
                    >
                      {active && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Channel B: Primary Button & Active Tab Color */}
            <View style={styles.colorChannelBlock}>
              <View style={styles.channelLabelRow}>
                <Text style={[styles.channelTitle, { color: surfaces.textPrimary }]}>
                  B. Primary Buttons & Active Tab Color
                </Text>
                <View style={styles.hexInputGroup}>
                  {Platform.OS === 'web' ? (
                    <input
                      type="color"
                      value={isValidHex(hexPrimary) ? hexPrimary : '#1565D8'}
                      onChange={(e: any) =>
                        handleHexInput('primary', e.target.value, setHexPrimary)
                      }
                      style={{
                        width: 30,
                        height: 30,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                      }}
                      title="Pick any Primary button color"
                    />
                  ) : (
                    <View
                      style={[
                        styles.colorPreviewBox,
                        { backgroundColor: customColors.primary },
                      ]}
                    />
                  )}
                  <TextInput
                    style={[
                      styles.hexInput,
                      {
                        color: surfaces.textPrimary,
                        backgroundColor: surfaces.inputBg,
                        borderColor: surfaces.border,
                      },
                    ]}
                    value={hexPrimary}
                    onChangeText={(txt) => handleHexInput('primary', txt, setHexPrimary)}
                    maxLength={7}
                    autoCapitalize="characters"
                    placeholder="#1565D8"
                  />
                </View>
              </View>
              <View style={styles.swatchStrip}>
                {PRIMARY_SWATCHES.map((hex) => {
                  const active =
                    customColors.primary.toUpperCase() === hex.toUpperCase() &&
                    themeId === 'custom';
                  return (
                    <Pressable
                      key={hex}
                      onPress={() => handleHexInput('primary', hex, setHexPrimary)}
                      style={[
                        styles.pickSwatch,
                        { backgroundColor: hex },
                        active && styles.pickSwatchActive,
                      ]}
                    >
                      {active && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Channel C: Highlight & Glow Accent Color */}
            <View style={[styles.colorChannelBlock, { marginBottom: 0 }]}>
              <View style={styles.channelLabelRow}>
                <Text style={[styles.channelTitle, { color: surfaces.textPrimary }]}>
                  C. Highlight & Glow Accent Color
                </Text>
                <View style={styles.hexInputGroup}>
                  {Platform.OS === 'web' ? (
                    <input
                      type="color"
                      value={isValidHex(hexAccent) ? hexAccent : '#55D7FF'}
                      onChange={(e: any) =>
                        handleHexInput('accent', e.target.value, setHexAccent)
                      }
                      style={{
                        width: 30,
                        height: 30,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                      }}
                      title="Pick any Accent highlight color"
                    />
                  ) : (
                    <View
                      style={[
                        styles.colorPreviewBox,
                        { backgroundColor: customColors.accent },
                      ]}
                    />
                  )}
                  <TextInput
                    style={[
                      styles.hexInput,
                      {
                        color: surfaces.textPrimary,
                        backgroundColor: surfaces.inputBg,
                        borderColor: surfaces.border,
                      },
                    ]}
                    value={hexAccent}
                    onChangeText={(txt) => handleHexInput('accent', txt, setHexAccent)}
                    maxLength={7}
                    autoCapitalize="characters"
                    placeholder="#55D7FF"
                  />
                </View>
              </View>
              <View style={styles.swatchStrip}>
                {ACCENT_SWATCHES.map((hex) => {
                  const active =
                    customColors.accent.toUpperCase() === hex.toUpperCase() &&
                    themeId === 'custom';
                  return (
                    <Pressable
                      key={hex}
                      onPress={() => handleHexInput('accent', hex, setHexAccent)}
                      style={[
                        styles.pickSwatch,
                        { backgroundColor: hex },
                        active && styles.pickSwatchActive,
                      ]}
                    >
                      {active && <Ionicons name="checkmark" size={14} color="#0F172A" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* SECTION 3: Navigation Bar Architecture */}
          <Text style={[styles.sectionTitle, { color: surfaces.textPrimary, marginTop: 22 }]}>
            3. Navigation Bar Style
          </Text>
          <Text style={[styles.sectionSub, { color: surfaces.textMuted }]}>
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
                  {
                    backgroundColor: surfaces.cardBg,
                    borderRadius: cardRadius,
                    borderColor: selected ? palette.primary : surfaces.border,
                    borderWidth: selected ? 2 : 1,
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
                      <Text style={[styles.optionTitle, { color: surfaces.textPrimary }]}>
                        {option.title}
                      </Text>
                      <M3Badge
                        label={selected ? 'ACTIVE' : option.badge}
                        variant={selected ? 'mint' : 'primary'}
                      />
                    </View>
                    <Text style={[styles.optionSub, { color: surfaces.textMuted }]}>
                      {option.subtitle}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {/* SECTION 4: Element & Button Geometry */}
          <Text style={[styles.sectionTitle, { color: surfaces.textPrimary, marginTop: 22 }]}>
            4. Button & Card Geometry
          </Text>
          <Text style={[styles.sectionSub, { color: surfaces.textMuted }]}>
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
                    {
                      backgroundColor: surfaces.cardBg,
                      borderRadius: cardRadius,
                      borderColor: selected ? palette.primary : surfaces.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.geoRadiusBadge,
                      {
                        backgroundColor: selected
                          ? palette.primary
                          : surfaces.cardElevatedBg,
                        borderRadius:
                          geo.id === 'pill' ? 9999 : geo.id === 'squircle' ? 10 : 4,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.geoRadiusText,
                        { color: selected ? '#FFFFFF' : surfaces.textPrimary },
                      ]}
                    >
                      {geo.radiusLabel}
                    </Text>
                  </View>
                  <Text style={[styles.geoTitle, { color: surfaces.textPrimary }]}>
                    {geo.title}
                  </Text>
                  <Text style={[styles.geoSub, { color: surfaces.textMuted }]}>
                    {geo.subtitle}
                  </Text>
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
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    marginBottom: 14,
  },
  modeToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    minWidth: 220,
    padding: 16,
  },
  modeIconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modePreviewCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  modeSub: {
    fontSize: 11,
    lineHeight: 16,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paletteCard: {
    width: '48%',
    minWidth: 200,
    flexGrow: 1,
    padding: 14,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  swatchCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.25)',
  },
  paletteName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  paletteSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  customBuilderCard: {
    marginTop: 14,
    padding: 18,
    borderWidth: 1.5,
  },
  customHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  customBuilderTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  customBuilderSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  colorChannelBlock: {
    marginBottom: 16,
  },
  channelLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  hexInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorPreviewBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  hexInput: {
    width: 92,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  swatchStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  pickSwatchActive: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
  },
  optionCard: {
    padding: 16,
    marginBottom: 10,
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
    borderColor: '#94A3B8',
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
  },
  optionSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  geometryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  geoCard: {
    flex: 1,
    minWidth: 150,
    padding: 14,
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
    marginBottom: 3,
  },
  geoSub: {
    fontSize: 11,
    lineHeight: 15,
  },
});
