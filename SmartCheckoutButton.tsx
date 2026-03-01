import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Check, 
  Loader2, 
  AlertCircle, 
  ShoppingBag,
  Sparkles,
  ArrowLeft,
  Lock,
  CreditCard,
  Truck
} from 'lucide-react';
import './animations.css';

// أنواع حالات الزر
export type SmartButtonState = 
  | 'hidden'      // مخفي - البيانات غير مكتملة
  | 'appearing'   // يظهر - البيانات اكتملت للتو
  | 'ready'       // جاهز - يمكن النقر
  | 'validating'  // يتحقق - جاري التحقق من البيانات
  | 'processing'  // يعالج - جاري إتمام الطلب
  | 'success'     // نجاح - تم إتمام الطلب
  | 'error';      // خطأ - فشل إتمام الطلب

interface ValidationResult {
  isValid: boolean;
  message?: string;
  field?: string;
}

interface SmartCheckoutButtonProps {
  // حالة الجاهزية
  isFormValid: boolean;
  isPaymentSelected: boolean;
  isShippingComplete: boolean;
  
  // الأحداث
  onCheckout: () => Promise<void>;
  onValidationFail?: (result: ValidationResult) => void;
  
  // التخصيص
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  
  // النصوص
  readyText?: string;
  processingText?: string;
  successText?: string;
  errorText?: string;
  
  // الخيارات
  showSecurityBadge?: boolean;
  showTruckAnimation?: boolean;
  vibrationEnabled?: boolean;
  soundEnabled?: boolean;
  
  // حالة خارجية
  externalState?: SmartButtonState;
  externalError?: string;
}

// مكون الجزيئات المتطايرة
function ParticleEffect({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  
  useEffect(() => {
    if (active) {
      const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#f472b6'];
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setParticles(newParticles);
      
      const timer = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timer);
    }
  }, [active]);
  
  if (!active || particles.length === 0) return null;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            animation: `confettiFall 1.5s ease-out forwards`,
            animationDelay: `${Math.random() * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

// مكون أيقونة الشاحنة المتحركة
function AnimatedTruck({ active }: { active: boolean }) {
  if (!active) return null;
  
  return (
    <div className="relative w-8 h-6 overflow-hidden">
      <Truck 
        className="w-6 h-6 text-white absolute animate-truck" 
        style={{ animationDuration: '1.5s', animationIterationCount: 'infinite' }}
      />
    </div>
  );
}

// مكون شريط التقدم الدائري
function CircularLoader({ progress, size = 20 }: { progress: number; size?: number }) {
  const radius = (size - 4) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="3"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-300"
      />
    </svg>
  );
}

export function SmartCheckoutButton({
  isFormValid,
  isPaymentSelected,
  isShippingComplete,
  onCheckout,
  onValidationFail,
  className,
  size = 'lg',
  readyText = 'إكمال الطلب',
  processingText = 'جاري إتمام الطلب...',
  successText = 'تم بنجاح!',
  errorText = 'حدث خطأ',
  showSecurityBadge = true,
  showTruckAnimation = true,
  vibrationEnabled = true,
  externalState,
  externalError,
}: SmartCheckoutButtonProps) {
  // الحالات
  const [state, setState] = useState<SmartButtonState>('hidden');
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showParticles, setShowParticles] = useState(false);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // حساب جاهزية الزر
  const isReady = isFormValid && isPaymentSelected && isShippingComplete;

  // تحديث الحالة بناءً على الجاهزية
  useEffect(() => {
    if (externalState) {
      setState(externalState);
      return;
    }

    if (isReady && state === 'hidden') {
      setState('appearing');
      setTimeout(() => setState('ready'), 500);
    } else if (!isReady && (state === 'ready' || state === 'appearing')) {
      setState('hidden');
    }
  }, [isReady, state, externalState]);

  // تأثير الاهتزاز
  const triggerVibration = useCallback((pattern: number[]) => {
    if (vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [vibrationEnabled]);

  // تأثير الموجة
  const handleRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleIdRef.current++;
    
    setRipples(prev => [...prev, { id, x, y }]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, []);

  // معالجة النقر
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (state !== 'ready') return;
    
    handleRipple(e);
    triggerVibration([50]);

    // التحقق من صحة البيانات
    if (!isFormValid) {
      onValidationFail?.({ isValid: false, message: 'يرجى ملء جميع الحقول المطلوبة', field: 'form' });
      setState('error');
      triggerVibration([100, 50, 100]);
      setTimeout(() => setState('ready'), 2000);
      return;
    }

    if (!isPaymentSelected) {
      onValidationFail?.({ isValid: false, message: 'يرجى اختيار طريقة الدفع', field: 'payment' });
      setState('error');
      triggerVibration([100, 50, 100]);
      setTimeout(() => setState('ready'), 2000);
      return;
    }

    // بدء المعالجة
    setState('processing');
    setProgress(0);

    // محاكاة التقدم
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      await onCheckout();
      
      // إيقاف التقدم وإكماله
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(100);
      
      // النجاح
      setState('success');
      setShowParticles(true);
      triggerVibration([100, 50, 100, 50, 100]);
      
    } catch (error) {
      // الخطأ
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setProgress(0);
      setState('error');
      triggerVibration([200, 100, 200]);
      
      setTimeout(() => {
        setState('ready');
      }, 3000);
    }
  };

  // تنظيف عند الإزالة
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // تحديد الأحجام
  const sizeClasses = {
    sm: 'px-6 py-3 text-sm min-h-[44px]',
    md: 'px-8 py-4 text-base min-h-[52px]',
    lg: 'px-10 py-5 text-lg min-h-[60px]',
  };

  // تحديد الأنماط حسب الحالة
  const getStateStyles = () => {
    switch (state) {
      case 'hidden':
        return 'opacity-0 scale-95 pointer-events-none';
      case 'appearing':
        return 'opacity-100 scale-100 animate-fadeInScale';
      case 'ready':
        return 'opacity-100 scale-100 hover:scale-[1.02] hover:shadow-2xl';
      case 'validating':
        return 'opacity-100 scale-100 cursor-wait';
      case 'processing':
        return 'opacity-100 scale-100 cursor-wait';
      case 'success':
        return 'opacity-100 scale-100 bg-gradient-to-r from-emerald-500 to-green-600';
      case 'error':
        return 'opacity-100 scale-100 bg-gradient-to-r from-red-500 to-rose-600 animate-shake';
      default:
        return '';
    }
  };

  // تحديد المحتوى حسب الحالة
  const renderContent = () => {
    switch (state) {
      case 'hidden':
      case 'appearing':
        return (
          <div className="flex items-center justify-center gap-3">
            <Lock className="w-5 h-5" />
            <span>أكمل البيانات أولاً</span>
          </div>
        );
      
      case 'ready':
        return (
          <div className="flex items-center justify-center gap-3">
            <ShoppingBag className="w-5 h-5" />
            <span>{readyText}</span>
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </div>
        );
      
      case 'validating':
        return (
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري التحقق...</span>
          </div>
        );
      
      case 'processing':
        return (
          <div className="flex items-center justify-center gap-3">
            {showTruckAnimation ? (
              <AnimatedTruck active={true} />
            ) : (
              <CircularLoader progress={progress} />
            )}
            <span className="animate-pulse">{processingText}</span>
          </div>
        );
      
      case 'success':
        return (
          <div className="flex items-center justify-center gap-3 animate-fadeInScale">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span>{successText}</span>
            <Sparkles className="w-5 h-5 animate-float" />
          </div>
        );
      
      case 'error':
        return (
          <div className="flex items-center justify-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{externalError || errorText}</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  // إذا كان الزر مخفياً تماماً
  if (state === 'hidden' && !isReady) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      {/* الزر الرئيسي */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={state !== 'ready'}
        className={cn(
          'group relative w-full overflow-hidden rounded-2xl font-bold text-white',
          'bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500',
          'transition-all duration-500 ease-out',
          'focus:outline-none focus:ring-4 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-900',
          'shadow-lg shadow-cyan-500/25',
          sizeClasses[size],
          getStateStyles()
        )}
      >
        {/* تأثير التدرج المتحرك */}
        {state === 'ready' && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
            style={{ backgroundSize: '200% 100%' }}
          />
        )}

        {/* تأثير الموجات */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 10,
              height: 10,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* تأثير التوهج عند التحويم */}
        {isHovered && state === 'ready' && (
          <div className="absolute inset-0 bg-white/10 transition-opacity duration-300" />
        )}

        {/* شريط التقدم */}
        {state === 'processing' && (
          <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
            <div 
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* المحتوى */}
        <div className="relative z-10">
          {renderContent()}
        </div>

        {/* الجزيئات */}
        <ParticleEffect active={showParticles} />
      </button>

      {/* شارة الأمان */}
      {showSecurityBadge && state === 'ready' && (
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
          <Lock className="w-3 h-3" />
          <span>معاملة آمنة ومشفرة</span>
          <CreditCard className="w-3 h-3" />
        </div>
      )}

      {/* مؤشر الحالة */}
      {state === 'processing' && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-cyan-400 whitespace-nowrap">
          جاري معالجة طلبك... {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}

export default SmartCheckoutButton;
