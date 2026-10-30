import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  translate,
  getCategoryTranslation,
} from '@/services/i18n';
import { MobileStorageService } from '@/services/storage';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  getCategoryLabel: (categoryKey: string) => string;
  supportedLanguages: LanguageOption[];
  activeLanguageInfo: LanguageOption;
  isReady: boolean;
}

const STORAGE_KEY_LANG = '@cashflow_mate_lang_v1';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadLanguage() {
      try {
        // Fast path: direct language key
        const savedLang = await AsyncStorage.getItem(STORAGE_KEY_LANG);
        if (savedLang === 'en' || savedLang === 'sn' || savedLang === 'nd') {
          setLanguageState(savedLang);
          setIsReady(true);
          return;
        }

        // Secondary path: business profile preference
        const biz = await MobileStorageService.getBusiness();
        if (biz && (biz.preferredLanguage === 'en' || biz.preferredLanguage === 'sn' || biz.preferredLanguage === 'nd')) {
          setLanguageState(biz.preferredLanguage);
          await AsyncStorage.setItem(STORAGE_KEY_LANG, biz.preferredLanguage);
        }
      } catch (err) {
        // Fallback gracefully to English
        setLanguageState('en');
      } finally {
        setIsReady(true);
      }
    }

    loadLanguage();
  }, []);

  const setLanguage = async (newLang: SupportedLanguage) => {
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem(STORAGE_KEY_LANG, newLang);
      await MobileStorageService.updateBusiness({ preferredLanguage: newLang });
    } catch (err) {
      console.warn('Failed to persist language preference:', err);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(key, language, params);
  };

  const getCategoryLabel = (categoryKey: string): string => {
    return getCategoryTranslation(categoryKey, language);
  };

  const activeLanguageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.id === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        getCategoryLabel,
        supportedLanguages: SUPPORTED_LANGUAGES,
        activeLanguageInfo,
        isReady,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // If used outside provider in isolated tests or components, provide safe fallback
    return {
      language: 'en',
      setLanguage: async () => {},
      t: (key: string, params?: Record<string, string | number>) => translate(key, 'en', params),
      getCategoryLabel: (categoryKey: string) => getCategoryTranslation(categoryKey, 'en'),
      supportedLanguages: SUPPORTED_LANGUAGES,
      activeLanguageInfo: SUPPORTED_LANGUAGES[0],
      isReady: true,
    };
  }
  return context;
};
