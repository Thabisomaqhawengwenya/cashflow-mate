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
    icon: 'albums' as any,
  },
  {
    id: 'compact_pill',
    title: 'Compact Floating Capsule',
    subtitle: 'Centered narrow floating pill dock with dark glass surface and glowing active tab',
    badge: 'SLEEK',
    icon: 'sparkles',
  },
  {
    id: 'curved_sheet',
    title: 'Curved Top-Edge Dock',
    subtitle: 'Full-width bar with 26px sculpted top corners hugging the bottom edge',
    badge: 'MODERN',
    icon: 'layers',
  },
  {
    id: 'classic_dock',
    title: 'Classic Full-Width Bar',
    subtitle: 'Traditional edge-to-edge bottom navigation bar with crisp top divider',
    badge: 'CLASSIC',
    icon: 'grid',
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

interface NamedColorOption {
  name: string;
  hex: string;
}

const HEADER_COLOR_OPTIONS: NamedColorOption[] = [
  { name: 'Royal Navy', hex: '#06152E' },
  { name: 'Heritage Emerald Pine', hex: '#0C382E' },
  { name: 'Obsidian Carbon', hex: '#090D16' },
  { name: 'Imperial Plum', hex: '#1E1035' },
  { name: 'Espresso Terracotta', hex: '#27150E' },
  { name: 'Midnight Indigo', hex: '#1E1B4B' },
  { name: 'Crimson Burgundy', hex: '#2A0A18' },
  { name: 'Sahara Bronze', hex: '#261C0A' },
  { name: 'Zambezi Deep Teal', hex: '#06282A' },
  { name: 'Cosmic Indigo', hex: '#111336' },
  { name: 'Savanna Olive', hex: '#1A2614' },
  { name: 'Dark Mulberry', hex: '#240B28' },
  { name: 'Graphite Zinc', hex: '#18181B' },
  { name: 'Atlantic Deep Slate', hex: '#0F2942' },
  { name: 'Charcoal Obsidian', hex: '#111827' },
  { name: 'Deep Ocean Abyss', hex: '#042F2E' },
  { name: 'Royal Cobalt Night', hex: '#0A1E46' },
  { name: 'Hunter Forest', hex: '#0B2B1E' },
  { name: 'Roasted Mocha', hex: '#231712' },
  { name: 'Aubergine Night', hex: '#210F26' },
  { name: 'Dark Prussian Blue', hex: '#082032' },
  { name: 'Onyx Pitch Black', hex: '#050507' },
  { name: 'Copper Canyon', hex: '#2D140C' },
  { name: 'Nordic Slate', hex: '#1E293B' },
];

const PRIMARY_COLOR_OPTIONS: NamedColorOption[] = [
  { name: 'Electric Royal Blue', hex: '#1565D8' },
  { name: 'Emerald Mint Green', hex: '#059669' },
  { name: 'Royal Amethyst Violet', hex: '#7C3AED' },
  { name: 'Crimson Ruby Rose', hex: '#E11D48' },
  { name: 'Sahara Amber Gold', hex: '#D97706' },
  { name: 'Market Terracotta', hex: '#EA580C' },
  { name: 'Cobalt Sky Blue', hex: '#0284C7' },
  { name: 'Vivid Mulberry Pink', hex: '#DB2777' },
  { name: 'Indigo Volt', hex: '#4F46E5' },
  { name: 'Zambezi Teal', hex: '#0D9488' },
  { name: 'Savanna Moss Green', hex: '#4D7C0F' },
  { name: 'Sapphire Ocean', hex: '#2563EB' },
  { name: 'Jade Forest', hex: '#16A34A' },
  { name: 'Scarlet Vermilion', hex: '#DC2626' },
  { name: 'Tangerine Flame', hex: '#F97316' },
  { name: 'Cyan Electric', hex: '#0891B2' },
  { name: 'Orchid Fuchsia', hex: '#C026D3' },
  { name: 'Purple Majesty', hex: '#9333EA' },
  { name: 'Warm Bronze', hex: '#B45309' },
  { name: 'Graphite Steel', hex: '#3F3F46' },
  { name: 'Slate Titanium', hex: '#475569' },
  { name: 'Coral Sunset', hex: '#F43F5E' },
  { name: 'Turquoise Reef', hex: '#14B8A6' },
  { name: 'Deep Ultramarine', hex: '#1D4ED8' },
];

const ACCENT_COLOR_OPTIONS: NamedColorOption[] = [
  { name: 'Electric Sky Cyan', hex: '#55D7FF' },
  { name: 'Luminous Mint', hex: '#34D399' },
  { name: 'Champagne Gold', hex: '#FBBF24' },
  { name: 'Soft Lavender Orchid', hex: '#C4B5FD' },
  { name: 'Coral Rose Quartz', hex: '#FB7185' },
  { name: 'Warm Sunset Peach', hex: '#FDBA74' },
  { name: 'Arctic Ice Blue', hex: '#38BDF8' },
  { name: 'Chartreuse Lime', hex: '#A3E635' },
  { name: 'Pink Blossom', hex: '#F472B6' },
  { name: 'Aqua Marine', hex: '#5EEAD4' },
  { name: 'Periwinkle Glow', hex: '#A5B4FC' },
  { name: 'Sunburst Lemon', hex: '#FDE047' },
  { name: 'Spring Emerald', hex: '#6EE7B7' },
  { name: 'Neon Magenta', hex: '#F0ABFC' },
  { name: 'Amber Honey', hex: '#FCD34D' },
  { name: 'Platinum Silver', hex: '#E2E8F0' },
  { name: 'Neon Cyan', hex: '#22D3EE' },
  { name: 'Electric Lime', hex: '#BEF264' },
  { name: 'Rose Petal', hex: '#FDA4AF' },
  { name: 'Golden Apricot', hex: '#F59E0B' },
  { name: 'Sky Periwinkle', hex: '#93C5FD' },
  { name: 'Turquoise Mist', hex: '#99F6E4' },
  { name: ' Lilac Frost', hex: '#DDD6FE' },
  { name: 'Pure Alabaster White', hex: '#FFFFFF' },
];

function isValidHex(val: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(val.trim());
}

function getColorName(options: NamedColorOption[], hex: string): string {
  const found = options.find((o) => o.hex.toUpperCase() === hex.toUpperCase());
  return found ? `${found.name} (${found.hex.toUpperCase()})` : `Custom (${hex.toUpperCase()})`;
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

  // Dropdown open states
  const [isPaletteDropdownOpen, setIsPaletteDropdownOpen] = useState(false);
  const [openChannelDropdown, setOpenChannelDropdown] = useState<
    'headerBg' | 'primary' | 'accent' | null
  >(null);

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

  const toggleChannelDropdown = (channel: 'headerBg' | 'primary' | 'accent') => {
    setOpenChannelDropdown((prev) => (prev === channel ? null : channel));
  };

  const presetKeys = Object.keys(THEME_PALETTES) as Array<Exclude<ThemePaletteId, 'custom'>>;

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
              DARK THEME • COLOR DROPDOWNS • NAV BAR • GEOMETRY
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
                <View
                  style={[
                    styles.modePreviewCircle,
                    { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
                  ]}
                >
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
                <View
                  style={[
                    styles.modePreviewCircle,
                    { backgroundColor: '#0F172A', borderColor: '#334155' },
                  ]}
                >
                  <Ionicons name="moon" size={18} color="#38BDF8" />
                </View>
                {isDarkMode && <M3Badge label="ACTIVE" variant="mint" />}
              </View>
              <Text style={[styles.modeTitle, { color: surfaces.textPrimary }]}>
                Obsidian Dark Theme
              </Text>
              <Text style={[styles.modeSub, { color: surfaces.textMuted }]}>
                Deep midnight slate surfaces (#0B111E) for night & low-glare use
              </Text>
            </Pressable>
          </View>

          {/* SECTION 2: Preset Theme Dropdown & Custom Color Dropdowns */}
          <Text style={[styles.sectionTitle, { color: surfaces.textPrimary, marginTop: 22 }]}>
            2. Brand Theme & Color Dropdowns
          </Text>
          <Text style={[styles.sectionSub, { color: surfaces.textMuted }]}>
            Open the dropdown to choose from 13 preset palettes or select your own custom colors from 72+ shades.
          </Text>

          {/* Master Theme Palette Dropdown Trigger */}
          <Text style={[styles.fieldLabel, { color: surfaces.textPrimary }]}>
            Preset Theme Palette ({presetKeys.length + 1} Themes Available)
          </Text>
          <Pressable
            onPress={() => setIsPaletteDropdownOpen(!isPaletteDropdownOpen)}
            style={[
              styles.dropdownTrigger,
              {
                backgroundColor: surfaces.cardBg,
                borderRadius: cardRadius,
                borderColor: isPaletteDropdownOpen ? palette.primary : surfaces.border,
                borderWidth: isPaletteDropdownOpen ? 2 : 1,
              },
            ]}
          >
            <View style={styles.dropdownTriggerLeft}>
              <View style={styles.swatchRowCompact}>
                <View style={[styles.swatchCircle, { backgroundColor: palette.headerBg }]} />
                <View style={[styles.swatchCircle, { backgroundColor: palette.primary }]} />
                <View style={[styles.swatchCircle, { backgroundColor: palette.accent }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dropdownValueTitle, { color: surfaces.textPrimary }]}>
                  {palette.name}
                </Text>
                <Text
                  style={[styles.dropdownValueSub, { color: surfaces.textMuted }]}
                  numberOfLines={1}
                >
                  {palette.subtitle}
                </Text>
              </View>
            </View>
            <View style={styles.dropdownRightRow}>
              <M3Badge
                label={themeId === 'custom' ? 'CUSTOM' : 'PRESET'}
                variant={themeId === 'custom' ? 'mint' : 'primary'}
              />
              <Ionicons
                name={isPaletteDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={surfaces.textPrimary}
              />
            </View>
          </Pressable>

          {/* Expanded Preset Theme Dropdown Menu */}
          {isPaletteDropdownOpen && (
            <View
              style={[
                styles.dropdownMenuCard,
                {
                  backgroundColor: surfaces.cardBg,
                  borderRadius: cardRadius,
                  borderColor: surfaces.border,
                },
              ]}
            >
              {presetKeys.map((key) => {
                const item = THEME_PALETTES[key];
                const selected = themeId === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      setThemeId(key);
                      setIsPaletteDropdownOpen(false);
                    }}
                    style={[
                      styles.dropdownOptionRow,
                      { borderBottomColor: surfaces.border },
                      selected && { backgroundColor: surfaces.cardElevatedBg },
                    ]}
                  >
                    <View style={styles.swatchRowCompact}>
                      <View style={[styles.swatchCircle, { backgroundColor: item.headerBg }]} />
                      <View style={[styles.swatchCircle, { backgroundColor: item.primary }]} />
                      <View style={[styles.swatchCircle, { backgroundColor: item.accent }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropdownOptionTitle, { color: surfaces.textPrimary }]}>
                        {item.name}
                      </Text>
                      <Text
                        style={[styles.dropdownOptionSub, { color: surfaces.textMuted }]}
                        numberOfLines={1}
                      >
                        {item.subtitle}
                      </Text>
                    </View>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={20} color={item.primary} />
                    )}
                  </Pressable>
                );
              })}

              {/* Custom Option inside Dropdown */}
              <Pressable
                onPress={() => {
                  setThemeId('custom');
                  setIsPaletteDropdownOpen(false);
                }}
                style={[
                  styles.dropdownOptionRow,
                  { borderBottomWidth: 0 },
                  themeId === 'custom' && { backgroundColor: surfaces.cardElevatedBg },
                ]}
              >
                <View style={styles.swatchRowCompact}>
                  <View
                    style={[styles.swatchCircle, { backgroundColor: customColors.headerBg }]}
                  />
                  <View
                    style={[styles.swatchCircle, { backgroundColor: customColors.primary }]}
                  />
                  <View
                    style={[styles.swatchCircle, { backgroundColor: customColors.accent }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dropdownOptionTitle, { color: surfaces.textPrimary }]}>
                    Custom Trader Palette (User Colors)
                  </Text>
                  <Text style={[styles.dropdownOptionSub, { color: surfaces.textMuted }]}>
                    Use your own custom colors selected below
                  </Text>
                </View>
                {themeId === 'custom' && (
                  <Ionicons name="checkmark-circle" size={20} color={customColors.primary} />
                )}
              </Pressable>
            </View>
          )}

          {/* Custom Color Studio with 3 Expandable Color Dropdowns */}
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
                  Custom Color Dropdowns: Choose Your Own Colors
                </Text>
                <Text style={[styles.customBuilderSub, { color: surfaces.textMuted }]}>
                  Open each color dropdown below to pick from 24 shades per channel, or enter any #HEX code.
                </Text>
              </View>
              <M3Badge
                label={themeId === 'custom' ? 'CUSTOM ACTIVE' : 'TAP ANY COLOR'}
                variant={themeId === 'custom' ? 'mint' : 'primary'}
              />
            </View>

            {/* DROPDOWN A: Header & Sidebar Canvas Color */}
            <View style={styles.colorChannelBlock}>
              <View style={styles.channelLabelRow}>
                <Text style={[styles.channelTitle, { color: surfaces.textPrimary }]}>
                  A. Header & Sidebar Canvas Color (24 Shades)
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
                        width: 28,
                        height: 28,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                      }}
                      title="Open color wheel"
                    />
                  ) : null}
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

              <Pressable
                onPress={() => toggleChannelDropdown('headerBg')}
                style={[
                  styles.colorDropdownBtn,
                  {
                    backgroundColor: surfaces.cardElevatedBg,
                    borderColor:
                      openChannelDropdown === 'headerBg' ? palette.primary : surfaces.border,
                  },
                ]}
              >
                <View style={styles.colorDropdownBtnLeft}>
                  <View
                    style={[
                      styles.colorDropdownSwatch,
                      { backgroundColor: customColors.headerBg },
                    ]}
                  />
                  <Text style={[styles.colorDropdownText, { color: surfaces.textPrimary }]}>
                    {getColorName(HEADER_COLOR_OPTIONS, customColors.headerBg)}
                  </Text>
                </View>
                <Ionicons
                  name={openChannelDropdown === 'headerBg' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={surfaces.textPrimary}
                />
              </Pressable>

              {openChannelDropdown === 'headerBg' && (
                <View
                  style={[
                    styles.colorDropdownList,
                    {
                      backgroundColor: surfaces.inputBg,
                      borderColor: surfaces.border,
                    },
                  ]}
                >
                  {HEADER_COLOR_OPTIONS.map((opt) => {
                    const isSelected =
                      customColors.headerBg.toUpperCase() === opt.hex.toUpperCase();
                    return (
                      <Pressable
                        key={opt.hex}
                        onPress={() => {
                          handleHexInput('headerBg', opt.hex, setHexHeader);
                          setOpenChannelDropdown(null);
                        }}
                        style={[
                          styles.colorDropdownItem,
                          isSelected && {
                            backgroundColor: surfaces.cardElevatedBg,
                            borderColor: palette.primary,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <View
                          style={[styles.colorItemDot, { backgroundColor: opt.hex }]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.colorItemName, { color: surfaces.textPrimary }]}
                            numberOfLines={1}
                          >
                            {opt.name}
                          </Text>
                          <Text style={[styles.colorItemHex, { color: surfaces.textMuted }]}>
                            {opt.hex}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color={palette.primary} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* DROPDOWN B: Primary Buttons & Active Tab Color */}
            <View style={styles.colorChannelBlock}>
              <View style={styles.channelLabelRow}>
                <Text style={[styles.channelTitle, { color: surfaces.textPrimary }]}>
                  B. Primary Buttons & Active Tab Color (24 Shades)
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
                        width: 28,
                        height: 28,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                      }}
                      title="Open color wheel"
                    />
                  ) : null}
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

              <Pressable
                onPress={() => toggleChannelDropdown('primary')}
                style={[
                  styles.colorDropdownBtn,
                  {
                    backgroundColor: surfaces.cardElevatedBg,
                    borderColor:
                      openChannelDropdown === 'primary' ? palette.primary : surfaces.border,
                  },
                ]}
              >
                <View style={styles.colorDropdownBtnLeft}>
                  <View
                    style={[
                      styles.colorDropdownSwatch,
                      { backgroundColor: customColors.primary },
                    ]}
                  />
                  <Text style={[styles.colorDropdownText, { color: surfaces.textPrimary }]}>
                    {getColorName(PRIMARY_COLOR_OPTIONS, customColors.primary)}
                  </Text>
                </View>
                <Ionicons
                  name={openChannelDropdown === 'primary' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={surfaces.textPrimary}
                />
              </Pressable>

              {openChannelDropdown === 'primary' && (
                <View
                  style={[
                    styles.colorDropdownList,
                    {
                      backgroundColor: surfaces.inputBg,
                      borderColor: surfaces.border,
                    },
                  ]}
                >
                  {PRIMARY_COLOR_OPTIONS.map((opt) => {
                    const isSelected =
                      customColors.primary.toUpperCase() === opt.hex.toUpperCase();
                    return (
                      <Pressable
                        key={opt.hex}
                        onPress={() => {
                          handleHexInput('primary', opt.hex, setHexPrimary);
                          setOpenChannelDropdown(null);
                        }}
                        style={[
                          styles.colorDropdownItem,
                          isSelected && {
                            backgroundColor: surfaces.cardElevatedBg,
                            borderColor: palette.primary,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <View
                          style={[styles.colorItemDot, { backgroundColor: opt.hex }]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.colorItemName, { color: surfaces.textPrimary }]}
                            numberOfLines={1}
                          >
                            {opt.name}
                          </Text>
                          <Text style={[styles.colorItemHex, { color: surfaces.textMuted }]}>
                            {opt.hex}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color={opt.hex} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* DROPDOWN C: Highlight & Glow Accent Color */}
            <View style={[styles.colorChannelBlock, { marginBottom: 0 }]}>
              <View style={styles.channelLabelRow}>
                <Text style={[styles.channelTitle, { color: surfaces.textPrimary }]}>
                  C. Highlight & Glow Accent Color (24 Shades)
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
                        width: 28,
                        height: 28,
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                      }}
                      title="Open color wheel"
                    />
                  ) : null}
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

              <Pressable
                onPress={() => toggleChannelDropdown('accent')}
                style={[
                  styles.colorDropdownBtn,
                  {
                    backgroundColor: surfaces.cardElevatedBg,
                    borderColor:
                      openChannelDropdown === 'accent' ? palette.primary : surfaces.border,
                  },
                ]}
              >
                <View style={styles.colorDropdownBtnLeft}>
                  <View
                    style={[
                      styles.colorDropdownSwatch,
                      { backgroundColor: customColors.accent },
                    ]}
                  />
                  <Text style={[styles.colorDropdownText, { color: surfaces.textPrimary }]}>
                    {getColorName(ACCENT_COLOR_OPTIONS, customColors.accent)}
                  </Text>
                </View>
                <Ionicons
                  name={openChannelDropdown === 'accent' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={surfaces.textPrimary}
                />
              </Pressable>

              {openChannelDropdown === 'accent' && (
                <View
                  style={[
                    styles.colorDropdownList,
                    {
                      backgroundColor: surfaces.inputBg,
                      borderColor: surfaces.border,
                    },
                  ]}
                >
                  {ACCENT_COLOR_OPTIONS.map((opt) => {
                    const isSelected =
                      customColors.accent.toUpperCase() === opt.hex.toUpperCase();
                    return (
                      <Pressable
                        key={opt.hex}
                        onPress={() => {
                          handleHexInput('accent', opt.hex, setHexAccent);
                          setOpenChannelDropdown(null);
                        }}
                        style={[
                          styles.colorDropdownItem,
                          isSelected && {
                            backgroundColor: surfaces.cardElevatedBg,
                            borderColor: palette.primary,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <View
                          style={[styles.colorItemDot, { backgroundColor: opt.hex }]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.colorItemName, { color: surfaces.textPrimary }]}
                            numberOfLines={1}
                          >
                            {opt.name}
                          </Text>
                          <Text style={[styles.colorItemHex, { color: surfaces.textMuted }]}>
                            {opt.hex}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color={palette.primary} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.2,
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  swatchRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swatchCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.28)',
  },
  dropdownValueTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  dropdownValueSub: {
    fontSize: 11,
    marginTop: 2,
  },
  dropdownRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownMenuCard: {
    marginTop: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  dropdownOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  dropdownOptionSub: {
    fontSize: 11,
    marginTop: 1,
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
    marginBottom: 8,
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
  hexInput: {
    width: 88,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  colorDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  colorDropdownBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDropdownSwatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.35)',
  },
  colorDropdownText: {
    fontSize: 13,
    fontWeight: '700',
  },
  colorDropdownList: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  colorDropdownItem: {
    width: '48%',
    minWidth: 180,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 8,
  },
  colorItemDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  colorItemName: {
    fontSize: 12,
    fontWeight: '700',
  },
  colorItemHex: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
