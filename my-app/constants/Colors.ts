/**
 * CashFlow Mate - High-Craft Blue & Dark Navy Design System
 * Primary: #1565D8 (Brand Blue), Hover: #0D47A1, Container: #DCEBFF, Secondary: #168CFF, Accent: #55D7FF.
 * Canvas / Background: #F7F9FC, Dark Navy: #06152E, Surface: #FFFFFF.
 * Semantic: Success #16803C (Inflow/Sales), Error #BA1A1A (Outflow), Warning #946200.
 */

export const BlueTokens = {
  // Brand Core Blue & Dark Navy Palette
  primary: '#1565D8',
  primaryHover: '#0D47A1',
  primaryContainer: '#DCEBFF',
  onPrimaryContainer: '#002D6C',

  secondary: '#168CFF',
  secondaryHover: '#0070E0',
  secondaryContainer: '#E5F1FF',
  onSecondaryContainer: '#003366',

  accent: '#55D7FF',
  accentHover: '#33CCFF',
  accentDarkText: '#06152E',

  darkNavy: '#06152E',
  navyDark: '#040E20',
  navyCard: '#0A1E40',
  navyHeader: '#06152E',
  navyBorder: '#0F2752',

  // Semantic Financial Colors (green exclusively for success/positive inflow)
  success: '#16803C',
  successSoft: '#D1F2DF',
  successDarkText: '#0E5226',
  error: '#BA1A1A',
  errorSoft: '#FEE2E2',
  errorDarkText: '#5C0808',
  warning: '#946200',
  warningSoft: '#FEF3C7',
  warningDarkText: '#4A3000',

  // Soft Pastels for Card Badges & Categories
  pastelBlue: '#DCEBFF',
  pastelBlueText: '#1565D8',
  pastelSky: '#E0F2FE',
  pastelSkyText: '#0284C7',
  pastelIndigo: '#EDE9FE',
  pastelIndigoText: '#4F46E5',
  pastelAmber: '#FEF3C7',
  pastelAmberText: '#946200',
  pastelRose: '#FEE2E2',
  pastelRoseText: '#BA1A1A',
  pastelMint: '#D1F2DF',
  pastelMintText: '#16803C',

  // Neutrals & Surfaces
  canvasLight: '#F7F9FC',
  cardWhite: '#FFFFFF',
  textMain: '#172033',
  textSecondary: '#64748B',
  textSubtle: '#94A3B8',
  border: '#E2E8F0',
  borders: '#E2E8F0',
  hairlineLight: '#E2E8F0',
  hairlineDark: 'rgba(255, 255, 255, 0.16)',

  // Brand Migration Compatibility Aliases (maps legacy keys directly to the Blue Brand Theme)
  deepPine: '#06152E', // Brand dark navy header & hero
  obsidianPine: '#040E20', // Deepest navy
  richPine: '#0A1E40', // Navy container
  mintCta: '#1565D8', // Primary brand action button
  mintHover: '#0D47A1', // Primary hover
  mintDarkText: '#FFFFFF', // Crisp white on primary blue
  mintSoft: '#DCEBFF', // Primary container
  mintBorder: '#B8D9FF', // Soft primary blue border
  textSlate: '#172033', // Main text
  textMuted: '#64748B', // Secondary text
};

export const EmeraldTokens = BlueTokens; // Canonical backward compatibility alias

export default {
  light: {
    text: BlueTokens.textMain,
    textMuted: BlueTokens.textSecondary,
    textInverted: '#FFFFFF',
    textInvertedMuted: 'rgba(255, 255, 255, 0.72)',
    background: BlueTokens.canvasLight,
    headerBackground: BlueTokens.navyHeader,
    tint: BlueTokens.primary,
    tabIconDefault: '#94A3B8',
    tabIconSelected: BlueTokens.primary,
    surface: BlueTokens.cardWhite,
    surfaceVariant: '#EEF2F6',
    surfaceContainer: '#F1F5F9',
    primary: BlueTokens.primary,
    primaryDark: BlueTokens.primaryHover,
    primaryContainer: BlueTokens.primaryContainer,
    onPrimaryContainer: BlueTokens.onPrimaryContainer,
    accent: BlueTokens.secondary,
    accentHighlight: BlueTokens.accent,
    accentText: '#FFFFFF',
    secondary: BlueTokens.secondary,
    secondaryContainer: BlueTokens.secondaryContainer,
    tertiary: BlueTokens.accent,
    tertiaryContainer: BlueTokens.primaryContainer,
    outline: BlueTokens.border,
    outlineVariant: '#E2E8F0',
    inflow: BlueTokens.success,
    inflowContainer: BlueTokens.successSoft,
    outflow: BlueTokens.error,
    outflowContainer: BlueTokens.errorSoft,
    neutral: BlueTokens.textSecondary,
    neutralContainer: '#F1F5F9',
    review: BlueTokens.warning,
    reviewContainer: BlueTokens.warningSoft,
  },
  dark: {
    text: '#F7F9FC',
    textMuted: '#94A3B8',
    textInverted: '#FFFFFF',
    textInvertedMuted: 'rgba(255, 255, 255, 0.72)',
    background: BlueTokens.navyDark,
    headerBackground: BlueTokens.darkNavy,
    tint: BlueTokens.secondary,
    tabIconDefault: '#64748B',
    tabIconSelected: BlueTokens.secondary,
    surface: BlueTokens.navyCard,
    surfaceVariant: '#0F2752',
    surfaceContainer: '#06152E',
    primary: BlueTokens.secondary,
    primaryDark: BlueTokens.primary,
    primaryContainer: '#0D3B82',
    onPrimaryContainer: BlueTokens.primaryContainer,
    accent: BlueTokens.accent,
    accentHighlight: BlueTokens.accent,
    accentText: BlueTokens.darkNavy,
    secondary: '#82C2FF',
    secondaryContainer: '#003366',
    tertiary: BlueTokens.accent,
    tertiaryContainer: '#003A60',
    outline: '#1E2E4A',
    outlineVariant: '#0F2752',
    inflow: '#22C55E',
    inflowContainer: '#064E3B',
    outflow: '#EF4444',
    outflowContainer: '#450A0A',
    neutral: '#94A3B8',
    neutralContainer: '#1E293B',
    review: '#F59E0B',
    reviewContainer: '#451A03',
  },
};
