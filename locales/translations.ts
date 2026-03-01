import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from "@/locales";

const baseTranslations = {
  "app.title": "STAR LUX",
  "app.subtitle": "Global E-Commerce Platform",
  "app.description": "Buy and sell anything with our secure, multi-vendor platform",
  "home.globalMarketplace": "Global Marketplace",
  "home.buyAndSell": "Buy and sell anything with our secure platform",
  "home.exploreProducts": "Explore Products",
  "home.becomeSeller": "Become a Seller",
  "home.easyShoppingTitle": "Easy Shopping",
  "home.easyShoppingDesc": "Browse millions of products easily",
  "home.sellAnywhereTitle": "Sell Anywhere",
  "home.sellAnywhereDesc": "Reach millions of buyers worldwide",
  "home.secureTransactionsTitle": "Secure Transactions",
  "home.secureTransactionsDesc": "Full protection for all transactions",
  "home.worldwideReachTitle": "Worldwide Reach",
  "home.worldwideReachDesc": "Commerce without geographic borders",
  "nav.home": "Home",
  "nav.explore": "Explore",
  "nav.categories": "Categories",
  "nav.messages": "Messages",
  "nav.dashboard": "Dashboard",
  "nav.signIn": "Sign In",
  "nav.signUp": "Sign Up",
  "nav.logout": "Logout",
  "auth.signUpButton": "Sign Up",
  "auth.email": "Email",
  "auth.password": "Password",
  "common.loading": "Loading...",
  "common.error": "Error",
  "common.success": "Success",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.back": "Back",
  "common.next": "Next",
  "common.previous": "Previous",
  "common.language": "Language",
  "common.selectLanguage": "Select language",
} as const;

export type TranslationKey = keyof typeof baseTranslations;

export const translations: Record<Language, Record<TranslationKey, string>> = Object.fromEntries(
  (Object.keys(LANGUAGES) as Language[]).map((lang) => {
    if (lang === "ar-IQ") {
      return [
        lang,
        {
          ...baseTranslations,
          "app.subtitle": "منصة تجارة إلكترونية عالمية",
          "app.description": "اشترِ وبع أي شيء مع منصتنا الآمنة متعددة البائعين",
          "home.globalMarketplace": "منصة تجارة عالمية",
          "home.buyAndSell": "اشترِ وبع أي شيء مع منصتنا الآمنة",
          "home.exploreProducts": "استكشف المنتجات",
          "home.becomeSeller": "كن بائعاً",
          "home.easyShoppingTitle": "تسوق سهل",
          "home.easyShoppingDesc": "تصفح ملايين المنتجات بسهولة",
          "home.sellAnywhereTitle": "بع في أي مكان",
          "home.sellAnywhereDesc": "وصل إلى ملايين المشترين حول العالم",
          "home.secureTransactionsTitle": "معاملات آمنة",
          "home.secureTransactionsDesc": "حماية كاملة لجميع المعاملات",
          "home.worldwideReachTitle": "وصول عالمي",
          "home.worldwideReachDesc": "تجارة بدون حدود جغرافية",
          "nav.home": "الرئيسية",
          "nav.explore": "استكشاف",
          "nav.categories": "الأقسام",
          "nav.messages": "الرسائل",
          "nav.dashboard": "لوحة التحكم",
          "nav.signIn": "تسجيل الدخول",
          "nav.signUp": "إنشاء حساب",
          "nav.logout": "تسجيل الخروج",
          "auth.signUpButton": "إنشاء حساب",
          "auth.email": "البريد الإلكتروني",
          "auth.password": "كلمة المرور",
          "common.loading": "جاري التحميل...",
          "common.error": "حدث خطأ",
          "common.success": "تم بنجاح",
          "common.cancel": "إلغاء",
          "common.save": "حفظ",
          "common.delete": "حذف",
          "common.edit": "تعديل",
          "common.back": "العودة",
          "common.next": "التالي",
          "common.previous": "السابق",
          "common.language": "اللغة",
          "common.selectLanguage": "اختر اللغة",
        },
      ];
    }

    return [lang, { ...baseTranslations }];
  })
) as Record<Language, Record<TranslationKey, string>>;

export function getTranslation(lang: Language | string, key: TranslationKey): string {
  const safeLang = (lang in translations ? (lang as Language) : "en-US") as Language;
  return translations[safeLang]?.[key] ?? translations["en-US"]?.[key] ?? key;
}

export function useTranslation(lang: Language = DEFAULT_LANGUAGE) {
  return {
    t: (key: TranslationKey) => getTranslation(lang, key),
  };
}
