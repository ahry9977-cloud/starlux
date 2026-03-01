import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { 
  ShoppingCart, Store, Users, Zap, Globe, Lock, Search, 
  Smartphone, Shirt, Home as HomeIcon, Heart, Trophy,
  MessageCircle, Send, Phone, Mail, ChevronDown, ChevronRight,
  Instagram, ExternalLink, Moon, Sun
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { EnhancedMotionBackground } from "@/components/backgrounds/EnhancedMotionBackground";
import { useTheme } from "@/contexts/ThemeContext";

// أيقونات مخصصة للتواصل
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// أيقونات الأقسام
const categoryIcons: Record<string, React.ReactNode> = {
  'Smartphone': <Smartphone className="w-8 h-8" />,
  'Shirt': <Shirt className="w-8 h-8" />,
  'Home': <HomeIcon className="w-8 h-8" />,
  'Heart': <Heart className="w-8 h-8" />,
  'Trophy': <Trophy className="w-8 h-8" />,
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { t, direction, language } = useLanguage();
  const { theme, toggleTheme, switchable } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  // جلب الأقسام مع الفرعية
  const { data: categoriesData } = trpc.products.getCategoriesHierarchy.useQuery();

  // SEO Meta Tags
  const seoData = {
    title: 'STAR LUX - منصة التجارة الإلكترونية العالمية',
    description: 'منصة تجارة إلكترونية عالمية آمنة ومتعددة البائعين. اشترِ وبع ملايين المنتجات من السيارات إلى الإلكترونيات والملابس والعطور والكتب والمزيد.',
    keywords: 'تجارة إلكترونية, متجر إلكتروني, بيع أونلاين, شراء أونلاين, منصة بيع, متجر عالمي, منصة تسوق, STAR LUX',
    url: 'https://star-lux.com',
    type: 'website' as const,
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // معلومات التواصل
  const socialLinks = {
    instagram: { url: 'https://instagram.com/0q.b4', handle: '@0q.b4' },
    tiktok: { url: 'https://tiktok.com/@4j_j7', handle: '@4j_j7' },
    telegram: { url: 'https://t.me/T54_5', handle: '@T54_5' },
    whatsapp: { url: 'https://wa.me/9647819501604', phone: '+964 781 950 1604' },
    email: { url: 'mailto:ahmedyassin555555555@gmail.com', address: 'ahmedyassin555555555@gmail.com' },
  };

  return (
    <>
      <SEOHead {...seoData} />
      <EnhancedMotionBackground variant="particles" colorScheme="purple" intensity="vivid" parallax={true} />
      <div className="min-h-screen text-foreground relative z-10" dir={direction}>
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="text-2xl font-bold text-accent">STAR LUX</div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={language === 'ar-IQ' ? 'ابحث عن منتجات...' : 'Search products...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 bg-background/50"
                />
              </div>
            </form>

            <div className="flex items-center !gap-8">
              <LanguageSwitcher />
              {switchable && toggleTheme && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="gap-2 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background hover:border-border"
                  title={theme === "dark" ? "Light mode" : "Dark mode"}
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              )}
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground hidden md:block">{user?.name || user?.email}</span>
                  {/* زر لوحة التحكم - يظهر فقط للأدمن */}
                  {(user?.role === 'admin' || user?.role === 'sub_admin') && (
                    <Button className="bg-red-600 hover:bg-red-700 text-white font-bold" size="sm" onClick={() => navigate('/admin-dashboard')}>
                      لوحة التحكم
                    </Button>
                  )}
                  {/* زر لوحة البائع */}
                  {user?.role === 'seller' && (
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold" size="sm" onClick={() => navigate('/seller-dashboard')}>
                      لوحة البائع
                    </Button>
                  )}
                  {/* زر حسابي للمستخدمين العاديين */}
                  {user?.role === 'user' && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                      {language === 'ar-IQ' ? 'حسابي' : 'My Account'}
                    </Button>
                  )}
                </>
              ) : (
                <Button size="sm" onClick={() => navigate("/auth")}>
                  {t('nav.signIn')}
                </Button>
              )}
            </div>
          </div>
        </nav>

        {/* Mobile Search */}
        <div className="md:hidden px-4 py-3 bg-card/50 border-b border-border">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={language === 'ar-IQ' ? 'ابحث عن منتجات...' : 'Search products...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </form>
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 !py-20 md:!py-28 lg:!py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('home.globalMarketplace')} <span className="text-accent">for Everyone</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                {t('home.buyAndSell')}
              </p>
              <div className="flex flex-wrap !gap-6">
                <Button size="lg" onClick={() => navigate("/explore")}>
                  {t('home.exploreProducts')}
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/register-new")}>
                  {t('home.becomeSeller')}
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="group border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-3 group-hover:from-accent group-hover:to-accent/80 transition-all duration-300">
                    <ShoppingCart className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-lg">{t('home.easyShoppingTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t('home.easyShoppingDesc')}</p>
                </CardContent>
              </Card>

              <Card className="group border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-3 group-hover:from-accent group-hover:to-accent/80 transition-all duration-300">
                    <Store className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-lg">{t('home.sellAnywhereTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t('home.sellAnywhereDesc')}</p>
                </CardContent>
              </Card>

              <Card className="group border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-3 group-hover:from-accent group-hover:to-accent/80 transition-all duration-300">
                    <Lock className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-lg">{t('home.secureTransactionsTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t('home.secureTransactionsDesc')}</p>
                </CardContent>
              </Card>

              <Card className="group border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-3 group-hover:from-accent group-hover:to-accent/80 transition-all duration-300">
                    <Globe className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-lg">{t('home.worldwideReachTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t('home.worldwideReachDesc')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-card/30 !py-24 md:!py-28 lg:!py-32 border-y border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              {language === 'ar-IQ' ? 'تصفح الأقسام' : 'Browse Categories'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {categoriesData?.map((category) => (
                <Card 
                  key={category.id} 
                  className="border-border/50 bg-card hover:bg-card/80 transition-all cursor-pointer group"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1"
                        onClick={() => navigate(`/category/${category.id}`)}
                      >
                        <div className="p-3 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                          {categoryIcons[category.icon || 'Smartphone'] || <ShoppingCart className="w-8 h-8" />}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {language === 'ar-IQ' ? category.nameAr : category.nameEn}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {(category as any).subcategories?.length || 0} {language === 'ar-IQ' ? 'قسم فرعي' : 'subcategories'}
                          </CardDescription>
                        </div>
                      </div>
                      {(category as any).subcategories?.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCategory(expandedCategory === category.id ? null : category.id);
                          }}
                        >
                          {expandedCategory === category.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  {/* Subcategories */}
                  {expandedCategory === category.id && (category as any).subcategories?.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="border-t border-border/50 pt-3 mt-2 space-y-1">
                        {(category as any).subcategories.map((sub: any) => (
                          <Button
                            key={sub.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sm h-8"
                            onClick={() => navigate(`/category/${sub.id}`)}
                          >
                            {language === 'ar-IQ' ? sub.nameAr : sub.nameEn}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="container mx-auto px-4 !py-24 md:!py-28 lg:!py-32">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            {language === 'ar-IQ' ? 'لماذا تختار STAR LUX' : 'Why Choose STAR LUX'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-border/50 text-center">
              <CardHeader>
                <Users className="w-12 h-12 text-accent mx-auto mb-4" />
                <CardTitle>{language === 'ar-IQ' ? 'مجتمع عالمي' : 'Global Community'}</CardTitle>
                <CardDescription>
                  {language === 'ar-IQ' ? 'تواصل مع ملايين المستخدمين حول العالم' : 'Connect with millions of users worldwide'}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 text-center">
              <CardHeader>
                <Zap className="w-12 h-12 text-accent mx-auto mb-4" />
                <CardTitle>{language === 'ar-IQ' ? 'سرعة فائقة' : 'Lightning Fast'}</CardTitle>
                <CardDescription>
                  {language === 'ar-IQ' ? 'محسّن للسرعة والأداء العالي' : 'Optimized for speed and performance'}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 text-center">
              <CardHeader>
                <Lock className="w-12 h-12 text-accent mx-auto mb-4" />
                <CardTitle>{language === 'ar-IQ' ? 'آمن ومحمي' : 'Secure & Safe'}</CardTitle>
                <CardDescription>
                  {language === 'ar-IQ' ? 'أمان على مستوى المؤسسات لراحة بالك' : 'Enterprise-grade security for your peace of mind'}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Contact & Social Section */}
        <section className="bg-gradient-to-br from-accent/10 via-background to-accent/5 !py-24 md:!py-28 lg:!py-32 border-y border-border">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              {language === 'ar-IQ' ? 'تواصل معنا' : 'Contact Us'}
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              {language === 'ar-IQ' 
                ? 'نحن هنا لمساعدتك! تواصل معنا عبر أي من قنوات التواصل التالية'
                : 'We are here to help! Contact us through any of the following channels'}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {/* Instagram */}
              <a 
                href={socialLinks.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="border-border/50 bg-card hover:bg-gradient-to-br hover:from-pink-500/20 hover:to-purple-500/20 transition-all h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Instagram className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-sm">Instagram</p>
                    <p className="text-xs text-muted-foreground">{socialLinks.instagram.handle}</p>
                  </CardContent>
                </Card>
              </a>

              {/* TikTok */}
              <a 
                href={socialLinks.tiktok.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="border-border/50 bg-card hover:bg-gradient-to-br hover:from-black/20 hover:to-pink-500/20 transition-all h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <TikTokIcon />
                    </div>
                    <p className="font-semibold text-sm">TikTok</p>
                    <p className="text-xs text-muted-foreground">{socialLinks.tiktok.handle}</p>
                  </CardContent>
                </Card>
              </a>

              {/* Telegram */}
              <a 
                href={socialLinks.telegram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="border-border/50 bg-card hover:bg-gradient-to-br hover:from-blue-400/20 hover:to-blue-600/20 transition-all h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <TelegramIcon />
                    </div>
                    <p className="font-semibold text-sm">Telegram</p>
                    <p className="text-xs text-muted-foreground">{socialLinks.telegram.handle}</p>
                  </CardContent>
                </Card>
              </a>

              {/* WhatsApp */}
              <a 
                href={socialLinks.whatsapp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="border-border/50 bg-card hover:bg-gradient-to-br hover:from-green-400/20 hover:to-green-600/20 transition-all h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <WhatsAppIcon />
                    </div>
                    <p className="font-semibold text-sm">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">{language === 'ar-IQ' ? 'دردشة مباشرة' : 'Direct Chat'}</p>
                  </CardContent>
                </Card>
              </a>

              {/* Email */}
              <a 
                href={socialLinks.email.url}
                className="group col-span-2 md:col-span-1"
              >
                <Card className="border-border/50 bg-card hover:bg-gradient-to-br hover:from-red-400/20 hover:to-orange-500/20 transition-all h-full">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-sm">Email</p>
                    <p className="text-xs text-muted-foreground truncate">{language === 'ar-IQ' ? 'راسلنا' : 'Email Us'}</p>
                  </CardContent>
                </Card>
              </a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 !py-24 md:!py-28 lg:!py-32 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {language === 'ar-IQ' ? 'هل أنت مستعد للبدء؟' : 'Ready to Get Started?'}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {language === 'ar-IQ' 
              ? 'انضم إلى آلاف المشترين والبائعين على STAR LUX اليوم'
              : 'Join thousands of buyers and sellers on STAR LUX today'}
          </p>
          <div className="flex flex-wrap gap-6 justify-center">
            <Button size="lg" onClick={() => navigate("/register-new")}>
              {t('auth.signUpButton')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/explore")}>
              {t('home.exploreProducts')}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card/50 !py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-xl mb-4 text-accent">STAR LUX</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'ar-IQ' ? 'منصة تجارة إلكترونية عالمية للجميع' : 'Global marketplace for everyone'}
                </p>
                {/* Social Icons in Footer */}
                <div className="flex gap-3">
                  <a href={socialLinks.instagram.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href={socialLinks.tiktok.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">
                    <TikTokIcon />
                  </a>
                  <a href={socialLinks.telegram.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">
                    <TelegramIcon />
                  </a>
                  <a href={socialLinks.whatsapp.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">
                    <WhatsAppIcon />
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{language === 'ar-IQ' ? 'الشركة' : 'Company'}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="/about" className="hover:text-foreground transition-colors">{language === 'ar-IQ' ? 'من نحن' : 'About'}</a></li>
                  <li><a href="/blog" className="hover:text-foreground transition-colors">{language === 'ar-IQ' ? 'المدونة' : 'Blog'}</a></li>
                  <li><a href="/careers" className="hover:text-foreground transition-colors">{language === 'ar-IQ' ? 'الوظائف' : 'Careers'}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{language === 'ar-IQ' ? 'الدعم' : 'Support'}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="/help" className="hover:text-foreground transition-colors">{language === 'ar-IQ' ? 'مركز المساعدة' : 'Help Center'}</a></li>
                  <li><a href="/contact" className="hover:text-foreground transition-colors">{language === 'ar-IQ' ? 'اتصل بنا' : 'Contact'}</a></li>
                  <li><a href="/faq" className="hover:text-foreground transition-colors">{language === 'ar-IQ' ? 'الأسئلة الشائعة' : 'FAQ'}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{language === 'ar-IQ' ? 'قانوني' : 'Legal'}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="/privacy" className="hover:text-foreground transition-colors">{language === 'ar-IQ' ? 'الخصوصية' : 'Privacy'}</a></li>
                  <li><a href="/terms" className="hover:text-foreground transition-colors">{language === 'ar-IQ' ? 'الشروط' : 'Terms'}</a></li>
                  <li><a href="/cookies" className="hover:text-foreground transition-colors">{language === 'ar-IQ' ? 'ملفات تعريف الارتباط' : 'Cookies'}</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2026 STAR LUX. {language === 'ar-IQ' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
