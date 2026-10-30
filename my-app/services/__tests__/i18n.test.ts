import { describe, it, expect } from 'vitest';
import {
  translate,
  getCategoryTranslation,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  SupportedLanguage,
} from '../i18n';

describe('i18n Translation Engine', () => {
  it('has all 3 Zimbabwean national languages configured', () => {
    const langIds = SUPPORTED_LANGUAGES.map((l) => l.id);
    expect(langIds).toContain('en');
    expect(langIds).toContain('sn');
    expect(langIds).toContain('nd');
  });

  it('translates navigation tab keys across all 3 languages', () => {
    expect(translate('tab_home', 'en')).toBe('Home');
    expect(translate('tab_home', 'sn')).toBe('Pamba');
    expect(translate('tab_home', 'nd')).toBe('Ekhaya');

    expect(translate('tab_records', 'en')).toBe('Records');
    expect(translate('tab_records', 'sn')).toBe('Zvinyorwa');
    expect(translate('tab_records', 'nd')).toBe('Amarekhodi');

    expect(translate('tab_debts', 'en')).toBe('Debts');
    expect(translate('tab_debts', 'sn')).toBe('Zvikwereti');
    expect(translate('tab_debts', 'nd')).toBe('Izikwelede');
  });

  it('interpolates parameters into translated strings', () => {
    const enText = translate('records_count', 'en', { count: 15 });
    expect(enText).toBe('15 records');

    const snText = translate('records_count', 'sn', { count: 8 });
    expect(snText).toBe('zvinyorwa 8');

    const ndText = translate('records_count', 'nd', { count: 12 });
    expect(ndText).toBe('amarekhodi 12');
  });

  it('translates transaction categories in all 3 languages', () => {
    const categories = [
      'sales_goods',
      'stock_purchase',
      'rent',
      'transport_fuel',
      'utilities_electricity',
      'owner_drawings',
      'loan_in',
      'loan_out',
    ];

    categories.forEach((cat) => {
      const enLabel = getCategoryTranslation(cat, 'en');
      const snLabel = getCategoryTranslation(cat, 'sn');
      const ndLabel = getCategoryTranslation(cat, 'nd');

      expect(enLabel).toBeTruthy();
      expect(snLabel).toBeTruthy();
      expect(ndLabel).toBeTruthy();
      expect(snLabel).not.toBe(enLabel);
      expect(ndLabel).not.toBe(enLabel);
    });
  });

  it('falls back to English when an unknown language is passed', () => {
    const fallbackText = translate('tab_home', 'fr' as any);
    expect(fallbackText).toBe('Home');
  });

  it('returns key if key does not exist in any translation dictionary', () => {
    const missingKey = translate('non_existent_key_xyz', 'en');
    expect(missingKey).toBe('non_existent_key_xyz');
  });

  it('ensures parity of critical keys across en, sn, and nd', () => {
    const requiredKeys = [
      'tab_home',
      'tab_records',
      'tab_import',
      'tab_debts',
      'tab_assistant',
      'greeting_prefix',
      'drawer_usd',
      'drawer_zig',
      'drawer_zar',
      'action_record_sale',
      'action_record_expense',
      'action_paste_sms',
      'action_customer_credit',
      'my_transactions',
      'filter_all',
      'filter_inflows',
      'filter_outflows',
      'filter_review',
      'settings_title',
      'language_setup',
      'till_master_pin',
      'counter_privacy',
    ];

    const languages: SupportedLanguage[] = ['en', 'sn', 'nd'];

    languages.forEach((lang) => {
      requiredKeys.forEach((key) => {
        expect(TRANSLATIONS[lang][key]).toBeDefined();
        expect(TRANSLATIONS[lang][key].length).toBeGreaterThan(0);
      });
    });
  });
});
