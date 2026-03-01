import { Language, DEFAULT_LANGUAGE, isRTL, LANGUAGES } from '@/locales';
import { getTranslation, TranslationKey } from '@/locales/translations';
import React, { createContext, useEffect, useState } from "react";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  // تحميل اللغة المحفوظة من localStorage
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('language') as Language | null;
      if (savedLanguage && LANGUAGES[savedLanguage]) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.warn('Failed to load language from localStorage:', error);
    }
    setMounted(true);
  }, []);

  // تطبيق اتجاه النص على المستند
  useEffect(() => {
    if (!mounted) return;

    const dir = isRTL(language) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;

    // تطبيق الاتجاه على جسم الصفحة
    if (dir === 'rtl') {
      document.documentElement.classList.add('rtl');
      document.documentElement.classList.remove('ltr');
    } else {
      document.documentElement.classList.add('ltr');
      document.documentElement.classList.remove('rtl');
    }
  }, [language, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('language', lang);
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error);
    }
  };

  const t = (key: TranslationKey) => getTranslation(language, key);

  const dir = isRTL(language) ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL: isRTL(language),
        direction: dir,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};