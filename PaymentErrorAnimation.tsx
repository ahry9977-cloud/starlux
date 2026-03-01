import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  X, 
  AlertTriangle, 
  RefreshCw, 
  WifiOff, 
  CreditCard, 
  Clock,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// أنواع الأخطاء
export type PaymentErrorType = 
  | 'card_declined'
  | 'insufficient_funds'
  | 'expired_card'
  | 'invalid_cvv'
  | 'network_error'
  | 'timeout'
  | 'fraud_detected'
  | 'unknown';

interface PaymentError {
  type: PaymentErrorType;
  title: string;
  message: string;
  icon: React.ReactNode;
  suggestion: string;
  canRetry: boolean;
}

const ERROR_CONFIGS: Record<PaymentErrorType, PaymentError> = {
  card_declined: {
    type: 'card_declined',
    title: 'تم رفض البطاقة',
    message: 'البنك رفض عملية الدفع. يرجى التحقق من بيانات البطاقة أو التواصل مع البنك.',
    icon: <CreditCard className="w-8 h-8" />,
    suggestion: 'جرب استخدام بطاقة أخرى أو تواصل مع البنك',
    canRetry: true,
  },
  insufficient_funds: {
    type: 'insufficient_funds',
    title: 'رصيد غير كافٍ',
    message: 'لا يوجد رصيد كافٍ في البطاقة لإتمام هذه العملية.',
    icon: <CreditCard className="w-8 h-8" />,
    suggestion: 'تأكد من توفر الرصيد الكافي أو استخدم بطاقة أخرى',
    canRetry: true,
  },
  expired_card: {
    type: 'expired_card',
    title: 'البطاقة منتهية الصلاحية',
    message: 'تاريخ انتهاء البطاقة قد مضى. يرجى استخدام بطاقة صالحة.',
    icon: <Clock className="w-8 h-8" />,
    suggestion: 'استخدم بطاقة غير منتهية الصلاحية',
    canRetry: true,
  },
  invalid_cvv: {
    type: 'invalid_cvv',
    title: 'رمز CVV غير صحيح',
    message: 'رمز الأمان (CVV) المدخل غير صحيح.',
    icon: <Shield className="w-8 h-8" />,
    suggestion: 'تحقق من رمز CVV الموجود خلف البطاقة',
    canRetry: true,
  },
  network_error: {
    type: 'network_error',
    title: 'خطأ في الاتصال',
    message: 'حدث خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.',
    icon: <WifiOff className="w-8 h-8" />,
    suggestion: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
    canRetry: true,
  },
  timeout: {
    type: 'timeout',
    title: 'انتهت مهلة الطلب',
    message: 'استغرقت العملية وقتاً أطول من المتوقع. يرجى المحاولة مرة أخرى.',
    icon: <Clock className="w-8 h-8" />,
    suggestion: 'حاول مرة أخرى، إذا استمرت المشكلة تواصل معنا',
    canRetry: true,
  },
  fraud_detected: {
    type: 'fraud_detected',
    title: 'نشاط مشبوه',
    message: 'تم اكتشاف نشاط غير عادي. تم إيقاف العملية لحماية حسابك.',
    icon: <AlertTriangle className="w-8 h-8" />,
    suggestion: 'تواصل مع الدعم الفني للمساعدة',
    canRetry: false,
  },
  unknown: {
    type: 'unknown',
    title: 'خطأ غير متوقع',
    message: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.',
    icon: <HelpCircle className="w-8 h-8" />,
    suggestion: 'إذا استمرت المشكلة، تواصل مع الدعم الفني',
    canRetry: true,
  },
};

interface PaymentErrorAnimationProps {
  isVisible: boolean;
  errorType: PaymentErrorType;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

// مكون الأيقونة المتحركة
function AnimatedErrorIcon({ 
  icon, 
  isVisible 
}: { 
  icon: React.ReactNode;
  isVisible: boolean;
}) {
  return (
    <div className="relative">
      {/* الدوائر المتوسعة */}
      {isVisible && (
        <>
          <div
            className="absolute inset-0 rounded-full border-4 border-red-400"
            style={{
              animation: 'errorPulse 1s ease-out forwards',
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-4 border-red-400"
            style={{
              animation: 'errorPulse 1s ease-out 0.2s forwards',
            }}
          />
        </>
      )}
      
      {/* الدائرة الرئيسية */}
      <div
        className={cn(
          'relative w-24 h-24 rounded-full',
          'bg-gradient-to-br from-red-500 to-red-700',
          'flex items-center justify-center',
          'shadow-2xl shadow-red-500/50',
          'transition-all duration-500',
          isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        )}
        style={{
          animation: isVisible ? 'errorShake 0.5s ease-out 0.3s' : 'none',
        }}
      >
        <div className="text-white">
          {icon}
        </div>
      </div>
      
      <style>{`
        @keyframes errorPulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

// مكون الرسالة
function ErrorMessage({ 
  error, 
  isVisible 
}: { 
  error: PaymentError;
  isVisible: boolean;
}) {
  return (
    <div
      className={cn(
        'text-center max-w-md transition-all duration-700',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: '0.3s' }}
    >
      <h2 className="text-2xl font-bold text-white mb-2">
        {error.title}
      </h2>
      <p className="text-slate-400 mb-4">
        {error.message}
      </p>
      
      {/* اقتراح الحل */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300 text-right">
            {error.suggestion}
          </p>
        </div>
      </div>
    </div>
  );
}

// المكون الرئيسي
export function PaymentErrorAnimation({
  isVisible,
  errorType,
  onRetry,
  onCancel,
  className,
}: PaymentErrorAnimationProps) {
  const [showContent, setShowContent] = useState(false);
  const error = ERROR_CONFIGS[errorType];

  useEffect(() => {
    if (isVisible) {
      setShowContent(true);
    } else {
      setShowContent(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-slate-900/95 backdrop-blur-sm',
        className
      )}
    >
      {/* تأثير التوهج الأحمر */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 50%)',
        }}
      />
      
      {/* المحتوى */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-8">
        <AnimatedErrorIcon icon={error.icon} isVisible={showContent} />
        <ErrorMessage error={error} isVisible={showContent} />
        
        {/* الأزرار */}
        <div
          className={cn(
            'flex items-center gap-4 transition-all duration-700',
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
          style={{ transitionDelay: '0.5s' }}
        >
          {error.canRetry && onRetry && (
            <Button
              onClick={onRetry}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          )}
          
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentErrorAnimation;
