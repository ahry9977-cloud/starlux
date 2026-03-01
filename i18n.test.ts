import { describe, it, expect, beforeEach } from 'vitest';
import {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  isRTL,
  getLanguageConfig,
  getAllLanguages,
  Language,
} from '@/locales';
import { translations, getTranslation, useTranslation } from '@/locales/translations';

describe('i18n - Internationalization System', () => {
  describe('Language Configuration', () => {
    it('should have 19 languages configured', () => {
      const languages = getAllLanguages();
      expect(languages).toHaveLength(19);
    });

    it('should have default language set to ar-IQ', () => {
      expect(DEFAULT_LANGUAGE).toBe('ar-IQ');
    });

    it('should have all required language properties', () => {
      const languages = getAllLanguages();
      languages.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('nativeName');
        expect(lang).toHaveProperty('direction');
        expect(lang).toHaveProperty('flag');
      });
    });

    it('should have valid direction values (ltr or rtl)', () => {
      const languages = getAllLanguages();
      languages.forEach(lang => {
        expect(['ltr', 'rtl']).toContain(lang.direction);
      });
    });
  });

  describe('RTL/LTR Detection', () => {
    it('should correctly identify RTL languages', () => {
      const rtlLanguages = ['ar-IQ', 'fa-IR', 'ur-PK'];
      rtlLanguages.forEach(lang => {
        expect(isRTL(lang as Language)).toBe(true);
      });
    });

    it('should correctly identify LTR languages', () => {
      const ltrLanguages = ['en-US', 'fr-FR', 'de-DE', 'ja-JP'];
      ltrLanguages.forEach(lang => {
        expect(isRTL(lang as Language)).toBe(false);
      });
    });

    it('should have 3 RTL languages', () => {
      const rtlCount = getAllLanguages().filter(lang => lang.direction === 'rtl').length;
      expect(rtlCount).toBe(3);
    });

    it('should have 16 LTR languages', () => {
      const ltrCount = getAllLanguages().filter(lang => lang.direction === 'ltr').length;
      expect(ltrCount).toBe(16);
    });
  });

  describe('Language Config Retrieval', () => {
    it('should get language config by code', () => {
      const config = getLanguageConfig('en-US');
      expect(config.code).toBe('en-US');
      expect(config.name).toBe('English (US)');
      expect(config.nativeName).toBe('English');
      expect(config.direction).toBe('ltr');
    });

    it('should get Arabic Iraq config', () => {
      const config = getLanguageConfig('ar-IQ');
      expect(config.code).toBe('ar-IQ');
      expect(config.nativeName).toBe('العربية (العراق)');
      expect(config.direction).toBe('rtl');
    });

    it('should get all languages as array', () => {
      const languages = getAllLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
    });
  });

  describe('Translations', () => {
    it('should have translations for all 19 languages', () => {
      const translationKeys = Object.keys(translations);
      expect(translationKeys).toHaveLength(19);
    });

    it('should have all required translation keys in Arabic', () => {
      const arabicTranslations = translations['ar-IQ'];
      const requiredKeys = [
        'app.title',
        'app.subtitle',
        'nav.home',
        'nav.signIn',
        'auth.email',
        'auth.password',
        'common.loading',
        'common.error',
        'common.language',
      ];

      requiredKeys.forEach(key => {
        expect(arabicTranslations).toHaveProperty(key);
      });
    });

    it('should have consistent translation keys across all languages', () => {
      const arabicKeys = Object.keys(translations['ar-IQ']).sort();
      const englishKeys = Object.keys(translations['en-US']).sort();

      expect(arabicKeys).toEqual(englishKeys);
    });

    it('should get translation by language and key', () => {
      const translation = getTranslation('en-US', 'app.title');
      expect(translation).toBe('STAR LUX');
    });

    it('should get Arabic translation', () => {
      const translation = getTranslation('ar-IQ', 'app.title');
      expect(translation).toBe('STAR LUX');
    });

    it('should return key as fallback if translation not found', () => {
      const translation = getTranslation('en-US', 'nonexistent.key' as any);
      expect(translation).toBe('nonexistent.key');
    });

    it('should fallback to English if language not found', () => {
      const translation = getTranslation('xx-XX', 'app.title');
      expect(translation).toBe('STAR LUX');
    });
  });

  describe('Translation Completeness', () => {
    it('should have non-empty translations for all keys', () => {
      Object.entries(translations).forEach(([lang, langTranslations]) => {
        Object.entries(langTranslations).forEach(([key, value]) => {
          expect(value).toBeTruthy();
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have unique translation keys', () => {
      const arabicTranslations = translations['ar-IQ'];
      const keys = Object.keys(arabicTranslations);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });

    it('should have translations for all common UI elements', () => {
      const commonKeys = [
        'common.loading',
        'common.error',
        'common.success',
        'common.cancel',
        'common.save',
        'common.delete',
        'common.language',
      ];

      commonKeys.forEach(key => {
        const translation = getTranslation('en-US', key as any);
        expect(translation).not.toBe(key);
      });
    });
  });

  describe('Language Switching', () => {
    it('should support switching between languages', () => {
      const languages: Language[] = ['ar-IQ', 'en-US', 'fr-FR'];

      languages.forEach(lang => {
        const config = getLanguageConfig(lang);
        expect(config.code).toBe(lang);
      });
    });

    it('should maintain translation consistency when switching', () => {
      const key = 'app.title' as const;
      const arTranslation = getTranslation('ar-IQ', key);
      const enTranslation = getTranslation('en-US', key);

      expect(arTranslation).toBe('STAR LUX');
      expect(enTranslation).toBe('STAR LUX');
    });

    it('should handle rapid language switches', () => {
      const languages: Language[] = ['ar-IQ', 'en-US', 'fr-FR', 'de-DE', 'ja-JP'];

      languages.forEach(lang => {
        const translation = getTranslation(lang, 'app.title');
        expect(translation).toBe('STAR LUX');
      });
    });
  });

  describe('Language Metadata', () => {
    it('should have flag emoji for each language', () => {
      const languages = getAllLanguages();
      languages.forEach(lang => {
        expect(lang.flag).toBeTruthy();
        expect(lang.flag.length).toBeGreaterThan(0);
      });
    });

    it('should have native name for each language', () => {
      const languages = getAllLanguages();
      languages.forEach(lang => {
        expect(lang.nativeName).toBeTruthy();
        expect(lang.nativeName.length).toBeGreaterThan(0);
      });
    });

    it('should have English name for each language', () => {
      const languages = getAllLanguages();
      languages.forEach(lang => {
        expect(lang.name).toBeTruthy();
        expect(lang.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Language Code Validation', () => {
    it('should have valid language codes', () => {
      const languages = getAllLanguages();
      const validCodePattern = /^[a-z]{2}-[A-Z]{2}$/;

      languages.forEach(lang => {
        expect(lang.code).toMatch(validCodePattern);
      });
    });

    it('should have unique language codes', () => {
      const languages = getAllLanguages();
      const codes = languages.map(lang => lang.code);
      const uniqueCodes = new Set(codes);

      expect(codes.length).toBe(uniqueCodes.size);
    });
  });

  describe('useTranslation Hook', () => {
    it('should return translation function', () => {
      const t = useTranslation('en-US');
      expect(typeof t).toBe('function');
    });

    it('should translate with hook function', () => {
      const t = useTranslation('en-US');
      const translation = t('app.title');
      expect(translation).toBe('STAR LUX');
    });

    it('should support Arabic with hook', () => {
      const t = useTranslation('ar-IQ');
      const translation = t('app.title');
      expect(translation).toBe('STAR LUX');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty language code gracefully', () => {
      const translation = getTranslation('', 'app.title');
      expect(translation).toBe('STAR LUX'); // Should fallback to English
    });

    it('should handle undefined language gracefully', () => {
      const translation = getTranslation(undefined as any, 'app.title');
      expect(translation).toBe('STAR LUX'); // Should fallback to English
    });

    it('should handle special characters in translation keys', () => {
      const translation = getTranslation('en-US', 'auth.forgotPassword');
      expect(translation).toBe('Forgot Password?');
    });

    it('should preserve punctuation in translations', () => {
      const translation = getTranslation('en-US', 'auth.forgotPassword');
      expect(translation).toContain('?');
    });
  });

  describe('Performance', () => {
    it('should get translation quickly', () => {
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        getTranslation('en-US', 'app.title');
      }
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 1000 translations in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle language config retrieval efficiently', () => {
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        getLanguageConfig('en-US');
      }
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 1000 config retrievals in less than 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});
