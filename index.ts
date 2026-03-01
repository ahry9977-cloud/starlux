/**
 * نظام اللغات المتقدم - i18n
 * يدعم 19 لغة مع RTL/LTR تلقائي
 */

export type Language = 
  | 'ar-IQ' // العربية العراقية
  | 'en-US' // الإنجليزية
  | 'fr-FR' // الفرنسية
  | 'zh-CN' // الصينية
  | 'ja-JP' // اليابانية
  | 'tr-TR' // التركية
  | 'ru-RU' // الروسية
  | 'de-DE' // الألمانية
  | 'la-LA' // اللاتينية
  | 'es-ES' // الإسبانية
  | 'it-IT' // الإيطالية
  | 'pt-PT' // البرتغالية
  | 'ko-KR' // الكورية
  | 'hi-IN' // الهندية
  | 'fa-IR' // الفارسية
  | 'ur-PK' // الأردية
  | 'id-ID' // الإندونيسية
  | 'ms-MY' // الماليزية
  | 'sv-SE'; // السويدية

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export const LANGUAGES: Record<Language, LanguageConfig> = {
  'ar-IQ': {
    code: 'ar-IQ',
    name: 'Arabic (Iraq)',
    nativeName: 'العربية (العراق)',
    direction: 'rtl',
    flag: '🇮🇶',
  },
  'en-US': {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
  },
  'fr-FR': {
    code: 'fr-FR',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    flag: '🇫🇷',
  },
  'zh-CN': {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '中文 (简体)',
    direction: 'ltr',
    flag: '🇨🇳',
  },
  'ja-JP': {
    code: 'ja-JP',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    flag: '🇯🇵',
  },
  'tr-TR': {
    code: 'tr-TR',
    name: 'Turkish',
    nativeName: 'Türkçe',
    direction: 'ltr',
    flag: '🇹🇷',
  },
  'ru-RU': {
    code: 'ru-RU',
    name: 'Russian',
    nativeName: 'Русский',
    direction: 'ltr',
    flag: '🇷🇺',
  },
  'de-DE': {
    code: 'de-DE',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    flag: '🇩🇪',
  },
  'la-LA': {
    code: 'la-LA',
    name: 'Latin',
    nativeName: 'Lingua Latina',
    direction: 'ltr',
    flag: '🏛️',
  },
  'es-ES': {
    code: 'es-ES',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    flag: '🇪🇸',
  },
  'it-IT': {
    code: 'it-IT',
    name: 'Italian',
    nativeName: 'Italiano',
    direction: 'ltr',
    flag: '🇮🇹',
  },
  'pt-PT': {
    code: 'pt-PT',
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    flag: '🇵🇹',
  },
  'ko-KR': {
    code: 'ko-KR',
    name: 'Korean',
    nativeName: '한국어',
    direction: 'ltr',
    flag: '🇰🇷',
  },
  'hi-IN': {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  'fa-IR': {
    code: 'fa-IR',
    name: 'Persian',
    nativeName: 'فارسی',
    direction: 'rtl',
    flag: '🇮🇷',
  },
  'ur-PK': {
    code: 'ur-PK',
    name: 'Urdu',
    nativeName: 'اردو',
    direction: 'rtl',
    flag: '🇵🇰',
  },
  'id-ID': {
    code: 'id-ID',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    direction: 'ltr',
    flag: '🇮🇩',
  },
  'ms-MY': {
    code: 'ms-MY',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    direction: 'ltr',
    flag: '🇲🇾',
  },
  'sv-SE': {
    code: 'sv-SE',
    name: 'Swedish',
    nativeName: 'Svenska',
    direction: 'ltr',
    flag: '🇸🇪',
  },
};

export const DEFAULT_LANGUAGE: Language = 'ar-IQ';

export const isRTL = (lang: Language): boolean => {
  return LANGUAGES[lang].direction === 'rtl';
};

export const getLanguageConfig = (lang: Language): LanguageConfig => {
  return LANGUAGES[lang];
};

export const getAllLanguages = (): LanguageConfig[] => {
  return Object.values(LANGUAGES);
};
