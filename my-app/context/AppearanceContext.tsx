import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_APPEARANCE = '@cashflow_appearance_settings_v1';

export type NavBarStyle = 'floating_pill' | 'compact_pill' | 'curved_sheet' | 'classic_dock';
export type ThemePaletteId = 'royal_navy' | 'emerald_pine' | 'obsidian_night' | 'terracotta_ledger';
export type CornerGeometry = 'pill' | 'squircle' | 'sharp';

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

export const THEME_PALETTES: Record<ThemePaletteId, ThemePalette> = {
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
};

export interface AppearanceSettings {
  navBarStyle: NavBarStyle;
  themeId: ThemePaletteId;
  cornerGeometry: CornerGeometry;
}

const DEFAULT_APPEARANCE: AppearanceSettings = {
  navBarStyle: 'floating_pill',
  themeId: 'royal_navy',
  cornerGeometry: 'pill',
};

interface AppearanceContextValue extends AppearanceSettings {
  palette: ThemePalette;
  cardRadius: number;
  buttonRadius: number;
  chipRadius: number;
  setNavBarStyle: (style: NavBarStyle) => Promise<void>;
  setThemeId: (themeId: ThemePaletteId) => Promise<void>;
  setCornerGeometry: (corner: CornerGeometry) => Promise<void>;
  resetAppearance: () => Promise<void>;
}

const AppearanceContext = createContext<AppearanceContextValue>({
  ...DEFAULT_APPEARANCE,
  palette: THEME_PALETTES.royal_navy,
  cardRadius: 22,
  buttonRadius: 9999,
  chipRadius: 9999,
  setNavBarStyle: async () => {},
  setThemeId: async () => {},
  setCornerGeometry: async () => {},
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
            themeId: parsed.themeId && THEME_PALETTES[parsed.themeId] ? parsed.themeId : DEFAULT_APPEARANCE.themeId,
            cornerGeometry: parsed.cornerGeometry || DEFAULT_APPEARANCE.cornerGeometry,
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

  const resetAppearance = async () => {
    await persist(DEFAULT_APPEARANCE);
  };

  const palette = THEME_PALETTES[settings.themeId] || THEME_PALETTES.royal_navy;
  const cardRadius =
    settings.cornerGeometry === 'pill' ? 24 : settings.cornerGeometry === 'squircle' ? 18 : 8;
  const buttonRadius =
    settings.cornerGeometry === 'pill' ? 9999 : settings.cornerGeometry === 'squircle' ? 14 : 6;
  const chipRadius =
    settings.cornerGeometry === 'pill' ? 9999 : settings.cornerGeometry === 'squircle' ? 10 : 4;

  return (
    <AppearanceContext.Provider
      value={{
        ...settings,
        palette,
        cardRadius,
        buttonRadius,
        chipRadius,
        setNavBarStyle,
        setThemeId,
        setCornerGeometry,
        resetAppearance,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => useContext(AppearanceContext);
