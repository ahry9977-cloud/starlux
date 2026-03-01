import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ParticleBackground } from '@/components/auth';
import { 
  CheckCircle2, 
  Store, 
  ShoppingBag, 
  Settings, 
  MessageCircle,
  TrendingUp,
  Package,
  Users,
  Star,
  ArrowRight,
  Sparkles,
  Rocket
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OnboardingTour, useOnboardingStatus } from '@/components/onboarding';

interface WelcomePageProps {
  accountType?: 'buyer' | 'seller';
  userName?: string;
}

export default function WelcomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  // تحديد نوع الحساب من المستخدم أو من الـ URL
  const searchParams = new URLSearchParams(window.location.search);
  const accountType = (searchParams.get('type') as 'buyer' | 'seller') || 
                      (user?.role === 'seller' ? 'seller' : 'buyer');
  const userName = searchParams.get('name') || user?.name || 'المستخدم';
  
  // التحقق من حالة الجولة التعريفية
  const { status: tourStatus } = useOnboardingStatus(accountType);

  // تأثير الاحتفال عند التحميل
  useEffect(() => {
    // إطلاق الكونفيتي
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#4B00FF', '#FF00FF', '#00ffff']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#4B00FF', '#FF00FF', '#00ffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // إظهار المحتوى بعد تأخير قصير
    setTimeout(() => setShowContent(true), 500);
    
    // عرض الجولة التعريفية بعد انتهاء الكونفيتي
    if (tourStatus === 'pending') {
      setTimeout(() => setShowTour(true), 3500);
    }
  }, [tourStatus]);

  // إرشادات المشتري
  const buyerGuides = [
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: 'استكشف المنتجات',
      description: 'تصفح آلاف المنتجات من مختلف الأقسام',
      action: () => navigate('/explore'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'تواصل مع البائعين',
      description: 'راسل البائعين مباشرة للاستفسار',
      action: () => navigate('/messages'),
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'قيّم تجربتك',
      description: 'شارك رأيك وساعد الآخرين',
      action: () => navigate('/explore'),
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: 'أكمل ملفك الشخصي',
      description: 'أضف معلوماتك للحصول على تجربة أفضل',
      action: () => navigate('/dashboard'),
      color: 'from-purple-500 to-pink-500'
    }
  ];

  // إرشادات البائع
  const sellerGuides = [
    {
      icon: <Store className="w-6 h-6" />,
      title: 'أنشئ متجرك',
      description: 'صمم متجرك وأضف شعارك ووصفك',
      action: () => navigate('/seller-dashboard/store'),
      color: 'from-[#4B00FF] to-[#FF00FF]'
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: 'أضف منتجاتك',
      description: 'ارفع صور ومعلومات منتجاتك',
      action: () => navigate('/seller-dashboard/products'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'تابع إحصائياتك',
      description: 'راقب المبيعات والزيارات',
      action: () => navigate('/seller-dashboard'),
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'تواصل مع العملاء',
      description: 'رد على استفسارات المشترين',
      action: () => navigate('/seller-dashboard/messages'),
      color: 'from-orange-500 to-red-500'
    }
  ];

  const guides = accountType === 'seller' ? sellerGuides : buyerGuides;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a]">
      {/* خلفية الجزيئات */}
      <ParticleBackground />

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        {/* رسالة الترحيب */}
        <div className={`text-center mb-8 transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          {/* أيقونة النجاح */}
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-[#4B00FF] to-[#FF00FF] flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* العنوان */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-[#4B00FF] via-[#FF00FF] to-[#00ffff] bg-clip-text text-transparent">
              مرحباً بك، {userName}!
            </span>
          </h1>

          <p className="text-white/60 text-lg sm:text-xl max-w-md mx-auto">
            {accountType === 'seller' 
              ? 'تم إنشاء حسابك كبائع بنجاح! ابدأ رحلتك التجارية الآن'
              : 'تم إنشاء حسابك بنجاح! استكشف عالم STAR LUX'
            }
          </p>
        </div>

        {/* بطاقات الإرشادات */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full mb-8 transition-all duration-1000 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {guides.map((guide, index) => (
            <Card 
              key={index}
              className="group bg-white/5 border-white/10 hover:border-white/30 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#4B00FF]/10"
              onClick={guide.action}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${guide.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    {guide.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1 group-hover:text-[#4B00FF] transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-white/50 text-sm">
                      {guide.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-[#4B00FF] group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* أزرار الإجراءات */}
        <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Button
            size="lg"
            onClick={() => navigate(accountType === 'seller' ? '/seller-dashboard' : '/dashboard')}
            className="bg-gradient-to-r from-[#4B00FF] to-[#FF00FF] hover:from-[#5B10FF] hover:to-[#FF10FF] text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-[#4B00FF]/30 hover:shadow-xl hover:shadow-[#4B00FF]/40 transition-all"
          >
            <Rocket className="w-5 h-5 ml-2" />
            {accountType === 'seller' ? 'الذهاب للوحة التحكم' : 'الذهاب لحسابي'}
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/')}
            className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl"
          >
            العودة للرئيسية
          </Button>
        </div>

        {/* نصائح سريعة */}
        <div className={`mt-12 max-w-md w-full transition-all duration-1000 delay-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-gradient-to-r from-[#4B00FF]/10 to-[#FF00FF]/10 rounded-2xl p-6 border border-[#4B00FF]/20">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4B00FF]" />
              نصيحة سريعة
            </h4>
            <p className="text-white/60 text-sm">
              {accountType === 'seller' 
                ? 'أضف صوراً عالية الجودة لمنتجاتك لزيادة فرص البيع بنسبة 40%!'
                : 'فعّل الإشعارات لتكون أول من يعرف عن العروض والخصومات الحصرية!'
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* الجولة التعريفية */}
      {showTour && (
        <OnboardingTour
          userType={accountType}
          onComplete={() => {
            setShowTour(false);
            navigate(accountType === 'seller' ? '/seller-dashboard' : '/dashboard');
          }}
          onSkip={() => setShowTour(false)}
          autoStart={true}
        />
      )}
    </div>
  );
}
