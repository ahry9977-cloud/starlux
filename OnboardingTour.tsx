import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronLeft, ChevronRight, Check, 
  ShoppingCart, Store, Package, MessageCircle,
  Star, Settings, BarChart3, Wallet,
  Search, Heart, Bell, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// أنواع الخطوات
export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string; // محدد العنصر المستهدف (اختياري)
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlight?: boolean;
}

// خطوات جولة المشتري
export const buyerTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'مرحباً بك في STAR LUX! 🎉',
    description: 'دعنا نأخذك في جولة سريعة لتتعرف على أهم ميزات المنصة.',
    icon: <Star className="w-8 h-8 text-yellow-400" />,
    position: 'center',
  },
  {
    id: 'explore',
    title: 'استكشف المنتجات 🛒',
    description: 'تصفح آلاف المنتجات من مختلف الأقسام. استخدم الفلاتر للعثور على ما تبحث عنه بسهولة.',
    icon: <ShoppingCart className="w-8 h-8 text-cyan-400" />,
    position: 'center',
  },
  {
    id: 'search',
    title: 'البحث الذكي 🔍',
    description: 'استخدم شريط البحث للعثور على المنتجات بسرعة. يمكنك البحث بالاسم أو الفئة أو الوصف.',
    icon: <Search className="w-8 h-8 text-purple-400" />,
    position: 'center',
  },
  {
    id: 'favorites',
    title: 'قائمة المفضلة ❤️',
    description: 'أضف المنتجات التي تعجبك إلى قائمة المفضلة لتجدها بسهولة لاحقاً.',
    icon: <Heart className="w-8 h-8 text-pink-400" />,
    position: 'center',
  },
  {
    id: 'messages',
    title: 'تواصل مع البائعين 💬',
    description: 'راسل البائعين مباشرة للاستفسار عن المنتجات أو التفاوض على الأسعار.',
    icon: <MessageCircle className="w-8 h-8 text-green-400" />,
    position: 'center',
  },
  {
    id: 'notifications',
    title: 'الإشعارات 🔔',
    description: 'فعّل الإشعارات لتكون أول من يعرف عن العروض والخصومات الحصرية.',
    icon: <Bell className="w-8 h-8 text-orange-400" />,
    position: 'center',
  },
  {
    id: 'profile',
    title: 'ملفك الشخصي 👤',
    description: 'أكمل ملفك الشخصي للحصول على تجربة مخصصة وتوصيات أفضل.',
    icon: <User className="w-8 h-8 text-blue-400" />,
    position: 'center',
  },
  {
    id: 'complete',
    title: 'أنت جاهز! 🚀',
    description: 'رائع! أنت الآن جاهز لاستكشاف STAR LUX. استمتع بتجربة تسوق مميزة!',
    icon: <Check className="w-8 h-8 text-green-500" />,
    position: 'center',
  },
];

// خطوات جولة البائع
export const sellerTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'مرحباً بك كبائع في STAR LUX! 🎉',
    description: 'دعنا نأخذك في جولة سريعة لتتعرف على أدوات إدارة متجرك.',
    icon: <Star className="w-8 h-8 text-yellow-400" />,
    position: 'center',
  },
  {
    id: 'store',
    title: 'إعداد متجرك 🏪',
    description: 'ابدأ بتخصيص متجرك: أضف شعارك، وصفك، ومعلومات التواصل لجذب المشترين.',
    icon: <Store className="w-8 h-8 text-cyan-400" />,
    position: 'center',
  },
  {
    id: 'products',
    title: 'إضافة المنتجات 📦',
    description: 'أضف منتجاتك مع صور عالية الجودة ووصف تفصيلي. المنتجات الجيدة تبيع أسرع!',
    icon: <Package className="w-8 h-8 text-purple-400" />,
    position: 'center',
  },
  {
    id: 'analytics',
    title: 'تحليلات المبيعات 📊',
    description: 'تابع أداء متجرك من خلال لوحة التحليلات. راقب المبيعات والزيارات والتقييمات.',
    icon: <BarChart3 className="w-8 h-8 text-green-400" />,
    position: 'center',
  },
  {
    id: 'wallet',
    title: 'المحفظة والأرباح 💰',
    description: 'تابع أرباحك واسحب رصيدك بسهولة. نوفر طرق دفع متعددة وآمنة.',
    icon: <Wallet className="w-8 h-8 text-yellow-500" />,
    position: 'center',
  },
  {
    id: 'messages',
    title: 'التواصل مع العملاء 💬',
    description: 'رد على استفسارات العملاء بسرعة. التواصل الجيد يزيد من ثقة المشترين.',
    icon: <MessageCircle className="w-8 h-8 text-blue-400" />,
    position: 'center',
  },
  {
    id: 'settings',
    title: 'إعدادات المتجر ⚙️',
    description: 'خصص إعدادات متجرك: طرق الشحن، سياسة الإرجاع، وطرق الدفع المقبولة.',
    icon: <Settings className="w-8 h-8 text-gray-400" />,
    position: 'center',
  },
  {
    id: 'complete',
    title: 'أنت جاهز للبيع! 🚀',
    description: 'رائع! متجرك جاهز الآن. ابدأ بإضافة منتجاتك وانطلق في رحلتك التجارية!',
    icon: <Check className="w-8 h-8 text-green-500" />,
    position: 'center',
  },
];

interface OnboardingTourProps {
  userType: 'buyer' | 'seller';
  onComplete: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

export function OnboardingTour({ 
  userType, 
  onComplete, 
  onSkip,
  autoStart = true 
}: OnboardingTourProps) {
  const steps = userType === 'seller' ? sellerTourSteps : buyerTourSteps;
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(autoStart);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    // حفظ حالة إكمال الجولة
    localStorage.setItem(`onboarding_${userType}_completed`, 'true');
    onComplete();
  }, [userType, onComplete]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem(`onboarding_${userType}_skipped`, 'true');
    onSkip?.();
  }, [userType, onSkip]);

  // التحقق من إكمال الجولة سابقاً
  useEffect(() => {
    const completed = localStorage.getItem(`onboarding_${userType}_completed`);
    const skipped = localStorage.getItem(`onboarding_${userType}_skipped`);
    if (completed || skipped) {
      setIsVisible(false);
    }
  }, [userType]);

  // التنقل بالكيبورد
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.key === 'ArrowRight') handlePrev();
        else handleNext();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleNext, handlePrev, handleSkip]);

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
      >
        {/* خلفية معتمة */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleSkip}
        />

        {/* بطاقة الخطوة */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden">
            {/* شريط التقدم */}
            <div className="h-1 bg-gray-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
              />
            </div>

            {/* زر الإغلاق */}
            <button
              onClick={handleSkip}
              className="absolute top-4 left-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* رقم الخطوة */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gray-800/50 text-sm text-gray-400">
              {currentStep + 1} / {steps.length}
            </div>

            {/* المحتوى */}
            <div className="p-8 pt-12 text-center">
              {/* الأيقونة */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center shadow-lg"
              >
                {step.icon}
              </motion.div>

              {/* العنوان */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-4"
              >
                {step.title}
              </motion.h2>

              {/* الوصف */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 leading-relaxed mb-8"
              >
                {step.description}
              </motion.p>

              {/* نقاط التقدم */}
              <div className="flex justify-center gap-2 mb-8">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'w-8 bg-gradient-to-r from-cyan-500 to-purple-500'
                        : index < currentStep
                        ? 'bg-cyan-500'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* أزرار التنقل */}
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    className="flex-1 bg-transparent border-gray-600 hover:bg-gray-800"
                  >
                    <ChevronRight className="w-4 h-4 ml-2" />
                    السابق
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  className={`flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 ${
                    currentStep === 0 ? 'w-full' : ''
                  }`}
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <Check className="w-4 h-4 ml-2" />
                      ابدأ الآن
                    </>
                  ) : (
                    <>
                      التالي
                      <ChevronLeft className="w-4 h-4 mr-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* رابط التخطي */}
              {currentStep < steps.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-400 transition-colors"
                >
                  تخطي الجولة
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook للتحقق من حالة الجولة
export function useOnboardingStatus(userType: 'buyer' | 'seller') {
  const [status, setStatus] = useState<'pending' | 'completed' | 'skipped'>('pending');

  useEffect(() => {
    const completed = localStorage.getItem(`onboarding_${userType}_completed`);
    const skipped = localStorage.getItem(`onboarding_${userType}_skipped`);
    
    if (completed) {
      setStatus('completed');
    } else if (skipped) {
      setStatus('skipped');
    } else {
      setStatus('pending');
    }
  }, [userType]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(`onboarding_${userType}_completed`);
    localStorage.removeItem(`onboarding_${userType}_skipped`);
    setStatus('pending');
  }, [userType]);

  return { status, resetTour };
}

export default OnboardingTour;
