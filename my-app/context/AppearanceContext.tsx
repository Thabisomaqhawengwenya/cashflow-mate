import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_APPEARANCE = '@cashflow_appearance_settings_v2';

export type NavBarStyle = 'floating_pill' | 'compact_pill' | 'curved_sheet' | 'classic_dock';
export type ThemePaletteId =
  | 'royal_navy'
  | 'emerald_pine'
  | 'obsidian_night'
  | 'terracotta_ledger'
  | 'royal_plum'
  | 'crimson_velvet'
  | 'sahara_gold'
  | 'ocean_teal'
  | 'indigo_volt'
  | 'forest_olive'
  | 'cyber_magenta'
  | 'graphite_steel'
  | 'custom';
export type CornerGeometry = 'pill' | 'squircle' | 'sharp';

export interface CustomColorConfig {
  headerBg: string;
  primary: string;
  accent: string;
}

export interface ThemePalette {
  id: ThemePaletteId;
  name: string;
  subtitle: string;
  headerBg: string;
  primary: string;
  accent: string;
  surfaceTint: string;
  badgeText: string;
}

export interface SurfaceTokens {
  sheetBg: string;
  cardBg: string;
  cardElevatedBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  navBarBg: string;
  inputBg: string;
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleaned = (hex || '#1565D8').replace('#', '').trim();
  if (cleaned.length !== 6) return `rgba(21, 101, 216, ${alpha})`;
  const num = parseInt(cleaned, 16);
  if (Number.isNaN(num)) return `rgba(21, 101, 216, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const THEME_PALETTES: Record<Exclude<ThemePaletteId, 'custom'>, ThemePalette> = {
  royal_navy: {
    id: 'royal_navy',
    name: 'Royal Navy & Cyan',
    subtitle: 'Deep Navy canvas with electric blue & cyan accents',
    headerBg: '#06152E',
    primary: '#1565D8',
    accent: '#55D7FF',
    surfaceTint: '#EAF2FF',
    badgeText: '#0F4DA8',
  },
  emerald_pine: {
    id: 'emerald_pine',
    name: 'Heritage Emerald Pine',
    subtitle: 'Atmospheric forest pine with mint luxury highlights',
    headerBg: '#0C382E',
    primary: '#059669',
    accent: '#34D399',
    surfaceTint: '#DCFCE7',
    badgeText: '#065F46',
  },
  obsidian_night: {
    id: 'obsidian_night',
    name: 'Obsidian Midnight',
    subtitle: 'High-contrast OLED carbon slate with sky neon',
    headerBg: '#090D16',
    primary: '#2563EB',
    accent: '#38BDF8',
    surfaceTint: '#E0F2FE',
    badgeText: '#0369A1',
  },
  terracotta_ledger: {
    id: 'terracotta_ledger',
    name: 'Market Terracotta',
    subtitle: 'Warm espresso clay header with amber copper accents',
    headerBg: '#27150E',
    primary: '#C2410C',
    accent: '#FDBA74',
    surfaceTint: '#FFEDD5',
    badgeText: '#9A3412',
  },
  royal_plum: {
    id: 'royal_plum',
    name: 'Imperial Plum & Violet',
    subtitle: 'Deep velvet plum canvas with vivid violet & orchid accents',
    headerBg: '#1E1035',
    primary: '#7C3AED',
    accent: '#C4B5FD',
    surfaceTint: '#F3E8FF',
    badgeText: '#5B21B6',
  },
  crimson_velvet: {
    id: 'crimson_velvet',
    name: 'Crimson Velvet & Rose',
    subtitle: 'Rich burgundy wine canvas with ruby red & rose quartz highlights',
    headerBg: '#2A0A18',
    primary: '#E11D48',
    accent: '#FDA4AF',
    surfaceTint: '#FFE4E6',
    badgeText: '#9F1239',
  },
  sahara_gold: {
    id: 'sahara_gold',
    name: 'Sahara Bronze & Gold',
    subtitle: 'Warm espresso bronze canvas with bullion gold & champagne accents',
    headerBg: '#261C0A',
    primary: '#D97706',
    accent: '#FDE68A',
    surfaceTint: '#FEF3C7',
    badgeText: '#92400E',
  },
  ocean_teal: {
    id: 'ocean_teal',
    name: 'Zambezi Deep Teal',
    subtitle: 'Deep river teal canvas with turquoise & aqua marine highlights',
    headerBg: '#06282A',
    primary: '#0D9488',
    accent: '#5EEAD4',
    surfaceTint: '#CCFBF1',
    badgeText: '#115E59',
  },
  indigo_volt: {
    id: 'indigo_volt',
    name: 'Midnight Indigo Volt',
    subtitle: 'Cosmic indigo canvas with electric iris & periwinkle glow',
    headerBg: '#111336',
    primary: '#4F46E5',
    accent: '#A5B4FC',
    surfaceTint: '#E0E7FF',
    badgeText: '#3730A3',
  },
  forest_olive: {
    id: 'forest_olive',
    name: 'Savanna Olive & Lime',
    subtitle: 'Deep botanical olive canvas with vibrant moss & chartreuse accents',
    headerBg: '#1A2614',
    primary: '#4D7C0F',
    accent: '#BEF264',
    surfaceTint: '#ECFCCB',
    badgeText: '#3F6212',
  },
  cyber_magenta: {
    id: 'cyber_magenta',
    name: 'Mulberry & Magenta',
    subtitle: 'Dark mulberry canvas with hot pink & orchid blossom highlights',
    headerBg: '#240B28',
    primary: '#DB2777',
    accent: '#F9A8D4',
    surfaceTint: '#FCE7F3',
    badgeText: '#9D174D',
  },
  graphite_steel: {
    id: 'graphite_steel',
    name: 'Monochrome Graphite Steel',
    subtitle: 'Minimalist architectural zinc canvas with titanium silver accents',
    headerBg: '#18181B',
    primary: '#3F3F46',
    accent: '#E4E4E7',
    surfaceTint: '#F4F4F5',
    badgeText: '#27272A',
  },
};

export interface AppearanceSettings {
  navBarStyle: NavBarStyle;
  themeId: ThemePaletteId;
  cornerGeometry: CornerGeometry;
  isDarkMode: boolean;
  customColors: CustomColorConfig;
}

const DEFAULT_CUSTOM_COLORS: CustomColorConfig = {
  headerBg: '#1E1B4B',
  primary: '#6366F1',
  accent: '#A5B4FC',
};

const DEFAULT_APPEARANCE: AppearanceSettings = {
  navBarStyle: 'floating_pill',
  themeId: 'royal_navy',
  cornerGeometry: 'pill',
  isDarkMode: false,
  customColors: DEFAULT_CUSTOM_COLORS,
};

const LIGHT_SURFACES: SurfaceTokens = {
  sheetBg: '#F6F9FC',
  cardBg: '#FFFFFF',
  cardElevatedBg: '#F1F5F9',
  textPrimary: '#0A192F',
  textSecondary: '#334155',
  textMuted: '#64748B',
  border: '#DCE6F5',
  navBarBg: '#FFFFFF',
  inputBg: '#F7F9FC',
};

const DARK_SURFACES: SurfaceTokens = {
  sheetBg: '#0B111E',
  cardBg: '#131C2E',
  cardElevatedBg: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.10)',
  navBarBg: '#111827',
  inputBg: '#0F172A',
};

interface AppearanceContextValue extends AppearanceSettings {
  palette: ThemePalette;
  surfaces: SurfaceTokens;
  cardRadius: number;
  buttonRadius: number;
  chipRadius: number;
  setNavBarStyle: (style: NavBarStyle) => Promise<void>;
  setThemeId: (themeId: ThemePaletteId) => Promise<void>;
  setCornerGeometry: (corner: CornerGeometry) => Promise<void>;
  setIsDarkMode: (dark: boolean) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  setCustomColors: (colors: Partial<CustomColorConfig>) => Promise<void>;
  resetAppearance: () => Promise<void>;
}

const AppearanceContext = createContext<AppearanceContextValue>({
  ...DEFAULT_APPEARANCE,
  palette: THEME_PALETTES.royal_navy,
  surfaces: LIGHT_SURFACES,
  cardRadius: 24,
  buttonRadius: 9999,
  chipRadius: 9999,
  setNavBarStyle: async () => {},
  setThemeId: async () => {},
  setCornerGeometry: async () => {},
  setIsDarkMode: async () => {},
  toggleDarkMode: async () => {},
  setCustomColors: async () => {},
  resetAppearance: async () => {},
});

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_APPEARANCE);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_APPEARANCE);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppearanceSettings>;
          setSettings({
            navBarStyle: parsed.navBarStyle || DEFAULT_APPEARANCE.navBarStyle,
            themeId: parsed.themeId || DEFAULT_APPEARANCE.themeId,
            cornerGeometry: parsed.cornerGeometry || DEFAULT_APPEARANCE.cornerGeometry,
            isDarkMode: Boolean(parsed.isDarkMode),
            customColors: {
              ...DEFAULT_CUSTOM_COLORS,
              ...(parsed.customColors || {}),
            },
          });
        }
      } catch {
        // fallback to default
      }
    })();
  }, []);

  const persist = async (next: AppearanceSettings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_APPEARANCE, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const setNavBarStyle = async (navBarStyle: NavBarStyle) => {
    await persist({ ...settings, navBarStyle });
  };

  const setThemeId = async (themeId: ThemePaletteId) => {
    await persist({ ...settings, themeId });
  };

  const setCornerGeometry = async (cornerGeometry: CornerGeometry) => {
    await persist({ ...settings, cornerGeometry });
  };

  const setIsDarkMode = async (isDarkMode: boolean) => {
    await persist({ ...settings, isDarkMode });
  };

  const toggleDarkMode = async () => {
    await persist({ ...settings, isDarkMode: !settings.isDarkMode });
  };

  const setCustomColors = async (partial: Partial<CustomColorConfig>) => {
    const nextCustom: CustomColorConfig = {
      ...settings.customColors,
      ...partial,
    };
    await persist({
      ...settings,
      themeId: 'custom',
      customColors: nextCustom,
    });
  };

  const resetAppearance = async () => {
    await persist(DEFAULT_APPEARANCE);
  };

  const basePalette: ThemePalette =
    settings.themeId === 'custom'
      ? {
          id: 'custom',
          name: 'Custom Trader Palette',
          subtitle: `${settings.customColors.headerBg.toUpperCase()} • ${settings.customColors.primary.toUpperCase()}`,
          headerBg: settings.customColors.headerBg,
          primary: settings.customColors.primary,
          accent: settings.customColors.accent,
          surfaceTint: hexToRgba(settings.customColors.primary, settings.isDarkMode ? 0.24 : 0.14),
          badgeText: settings.customColors.primary,
        }
      : THEME_PALETTES[settings.themeId] || THEME_PALETTES.royal_navy;

  const palette: ThemePalette = settings.isDarkMode
    ? {
        ...basePalette,
        surfaceTint: hexToRgba(basePalette.primary, 0.24),
      }
    : basePalette;

  const surfaces = settings.isDarkMode ? DARK_SURFACES : LIGHT_SURFACES;

  const cardRadius =
    settings.cornerGeometry === 'pill' ? 24 : settings.cornerGeometry === 'squircle' ? 18 : 8;
  const buttonRadius =
    settings.cornerGeometry === 'pill' ? 9999 : settings.cornerGeometry === 'squircle' ? 14 : 6;
  const chipRadius =
    settings.cornerGeometry === 'pill' ? 9999 : settings.cornerGeometry === 'squircle' ? 10 : 4;

  // Dynamic Web CSS theme synchronization across all screens
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const styleId = 'cashflow-dynamic-theme-engine';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const headerRgb = hexToRgba(palette.headerBg, 1).replace(', 1)', ')').replace('rgba', 'rgb');
    const primaryRgb = hexToRgba(palette.primary, 1).replace(', 1)', ')').replace('rgba', 'rgb');

    const darkCss = settings.isDarkMode
      ? `
      /* Dark Mode Sheet & Card Surface Overrides */
      div[style*="background-color: rgb(246, 249, 252)"] {
        background-color: ${DARK_SURFACES.sheetBg} !important;
      }
      div[style*="background-color: rgb(255, 255, 255)"] {
        background-color: ${DARK_SURFACES.cardBg} !important;
        border-color: ${DARK_SURFACES.border} !important;
      }
      div[style*="background-color: rgb(248, 250, 252)"],
      div[style*="background-color: rgb(247, 249, 252)"],
      div[style*="background-color: rgb(241, 245, 249)"],
      div[style*="background-color: rgb(241, 245, 243)"] {
        background-color: ${DARK_SURFACES.cardElevatedBg} !important;
        border-color: ${DARK_SURFACES.border} !important;
      }
      /* Dark Mode Borders */
      div[style*="border-color: rgb(220, 230, 245)"],
      div[style*="border-top-color: rgb(220, 230, 245)"] {
        border-color: ${DARK_SURFACES.border} !important;
      }
      /* Dark Mode Typography */
      div[style*="color: rgb(10, 25, 47)"],
      span[style*="color: rgb(10, 25, 47)"],
      input[style*="color: rgb(10, 25, 47)"],
      textarea[style*="color: rgb(10, 25, 47)"] {
        color: ${DARK_SURFACES.textPrimary} !important;
      }
      div[style*="color: rgb(71, 85, 105)"],
      span[style*="color: rgb(71, 85, 105)"] {
        color: ${DARK_SURFACES.textSecondary} !important;
      }
      div[style*="color: rgb(100, 116, 139)"],
      span[style*="color: rgb(100, 116, 139)"] {
        color: ${DARK_SURFACES.textMuted} !important;
      }
    `
      : '';

    const brandCss = `
      /* Sync Header Canvas & Primary Brand Color across all screens */
      div[style*="background-color: rgb(6, 21, 46)"] {
        background-color: ${headerRgb} !important;
      }
      div[style*="background-color: rgb(21, 101, 216)"] {
        background-color: ${primaryRgb} !important;
      }
      div[style*="border-color: rgb(21, 101, 216)"] {
        border-color: ${primaryRgb} !important;
      }
      div[style*="color: rgb(21, 101, 216)"] {
        color: ${primaryRgb} !important;
      }
    `;

    styleEl.textContent = `${brandCss}\n${darkCss}`;
  }, [settings.isDarkMode, palette.headerBg, palette.primary, palette.accent]);

  return (
    <AppearanceContext.Provider
      value={{
        ...settings,
        palette,
        surfaces,
        cardRadius,
        buttonRadius,
        chipRadius,
        setNavBarStyle,
        setThemeId,
        setCornerGeometry,
        setIsDarkMode,
        toggleDarkMode,
        setCustomColors,
        resetAppearance,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => useContext(AppearanceContext);
