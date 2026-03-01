import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  CreditCard,
  Clock,
  Shield,
  HelpCircle,
  X,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import './animations.css';

// أنواع الأخطاء
export type ErrorType = 
  | 'network'           // خطأ في الاتصال
  | 'payment_failed'    // فشل الدفع
  | 'payment_declined'  // رفض البطاقة
  | 'timeout'           // انتهاء المهلة
  | 'validation'        // خطأ في التحقق
  | 'server'            // خطأ في الخادم
  | 'insufficient_funds'// رصيد غير كافٍ
  | 'card_expired'      // بطاقة منتهية
  | 'security'          // خطأ أمني
  | 'unknown';          // خطأ غير معروف

// مستوى الخطورة
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// معلومات الخطأ
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  code?: string;
  details?: string;
  suggestion?: string;
  canRetry?: boolean;
  retryDelay?: number; // بالثواني
}

// تكوين الأخطاء
const ERROR_CONFIG: Record<ErrorType, {
  icon: React.ReactNode;
  title: string;
  severity: ErrorSeverity;
  color: string;
  bgColor: string;
  borderColor: string;
  defaultSuggestion: string;
  canAutoFix?: boolean;
}> = {
  network: {
    icon: <WifiOff className="w-6 h-6" />,
    title: 'خطأ في الاتصال',
    severity: 'medium',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    defaultSuggestion: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
    canAutoFix: true,
  },
  payment_failed: {
    icon: <CreditCard className="w-6 h-6" />,
    title: 'فشل عملية الدفع',
    severity: 'high',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    defaultSuggestion: 'تحقق من بيانات البطاقة وحاول مرة أخرى',
  },
  payment_declined: {
    icon: <XCircle className="w-6 h-6" />,
    title: 'تم رفض البطاقة',
    severity: 'high',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    defaultSuggestion: 'تواصل مع البنك أو جرب بطاقة أخرى',
  },
  timeout: {
    icon: <Clock className="w-6 h-6" />,
    title: 'انتهت المهلة',
    severity: 'medium',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    defaultSuggestion: 'الخادم بطيء حالياً، حاول مرة أخرى',
    canAutoFix: true,
  },
  validation: {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: 'بيانات غير صحيحة',
    severity: 'low',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    defaultSuggestion: 'تحقق من البيانات المدخلة',
  },
  server: {
    icon: <AlertCircle className="w-6 h-6" />,
    title: 'خطأ في الخادم',
    severity: 'critical',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    defaultSuggestion: 'نعمل على حل المشكلة، حاول لاحقاً',
  },
  insufficient_funds: {
    icon: <CreditCard className="w-6 h-6" />,
    title: 'رصيد غير كافٍ',
    severity: 'high',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    defaultSuggestion: 'تحقق من رصيد حسابك أو استخدم طريقة دفع أخرى',
  },
  card_expired: {
    icon: <CreditCard className="w-6 h-6" />,
    title: 'البطاقة منتهية الصلاحية',
    severity: 'high',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    defaultSuggestion: 'استخدم بطاقة صالحة',
  },
  security: {
    icon: <Shield className="w-6 h-6" />,
    title: 'تنبيه أمني',
    severity: 'critical',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    defaultSuggestion: 'تم اكتشاف نشاط مشبوه، تواصل مع الدعم',
  },
  unknown: {
    icon: <HelpCircle className="w-6 h-6" />,
    title: 'خطأ غير متوقع',
    severity: 'medium',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    defaultSuggestion: 'حاول مرة أخرى أو تواصل مع الدعم',
  },
};

interface ErrorHandlerProps {
  error: ErrorInfo | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  onContactSupport?: () => void;
  className?: string;
  autoRetry?: boolean;
  autoRetryDelay?: number;
  maxAutoRetries?: number;
  showAnimation?: boolean;
}

export function ErrorHandler({
  error,
  onRetry,
  onDismiss,
  onContactSupport,
  className,
  autoRetry = false,
  autoRetryDelay = 5,
  maxAutoRetries = 3,
  showAnimation = true,
}: ErrorHandlerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // إظهار/إخفاء الخطأ
  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setAutoRetryCount(0);
    } else {
      setIsVisible(false);
    }
  }, [error]);

  // إعادة المحاولة التلقائية
  useEffect(() => {
    if (!error || !autoRetry || !ERROR_CONFIG[error.type].canAutoFix) return;
    if (autoRetryCount >= maxAutoRetries) return;

    const delay = error.retryDelay || autoRetryDelay;
    setRetryCountdown(delay);

    const countdownInterval = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    const retryTimeout = setTimeout(() => {
      setIsRetrying(true);
      setAutoRetryCount(prev => prev + 1);
      onRetry?.();
      setTimeout(() => setIsRetrying(false), 1000);
    }, delay * 1000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(retryTimeout);
    };
  }, [error, autoRetry, autoRetryCount, maxAutoRetries, autoRetryDelay, onRetry]);

  // معالجة إعادة المحاولة اليدوية
  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    onRetry?.();
    setTimeout(() => setIsRetrying(false), 1000);
  }, [onRetry]);

  // معالجة الإغلاق
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  }, [onDismiss]);

  if (!error || !isVisible) return null;

  const config = ERROR_CONFIG[error.type];

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-slate-900/80 backdrop-blur-sm',
        showAnimation && 'animate-fadeInScale',
        className
      )}
      onClick={handleDismiss}
    >
      <div
        className={cn(
          'relative w-full max-w-md rounded-2xl p-6',
          'bg-slate-800 border',
          config.borderColor,
          showAnimation && 'animate-fadeInUp'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* زر الإغلاق */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 left-4 p-1 rounded-full hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* الأيقونة */}
        <div
          className={cn(
            'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
            config.bgColor,
            config.color,
            showAnimation && 'animate-bounce'
          )}
        >
          {config.icon}
        </div>

        {/* العنوان */}
        <h3 className={cn('text-xl font-bold text-center mb-2', config.color)}>
          {config.title}
        </h3>

        {/* الرسالة */}
        <p className="text-slate-300 text-center mb-2">
          {error.message}
        </p>

        {/* التفاصيل */}
        {error.details && (
          <p className="text-sm text-slate-400 text-center mb-4">
            {error.details}
          </p>
        )}

        {/* كود الخطأ */}
        {error.code && (
          <p className="text-xs text-slate-500 text-center mb-4 font-mono">
            كود الخطأ: {error.code}
          </p>
        )}

        {/* الاقتراح */}
        <div className={cn('p-3 rounded-lg mb-4', config.bgColor)}>
          <p className="text-sm text-center">
            💡 {error.suggestion || config.defaultSuggestion}
          </p>
        </div>

        {/* العد التنازلي لإعادة المحاولة */}
        {retryCountdown !== null && (
          <p className="text-sm text-slate-400 text-center mb-4">
            إعادة المحاولة خلال {retryCountdown} ثانية...
          </p>
        )}

        {/* الأزرار */}
        <div className="flex gap-3">
          {error.canRetry !== false && onRetry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className={cn(
                'flex-1 gap-2',
                'bg-gradient-to-r from-cyan-500 to-purple-600',
                'hover:from-cyan-600 hover:to-purple-700'
              )}
            >
              {isRetrying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              إعادة المحاولة
            </Button>
          )}
          
          {onContactSupport && (
            <Button
              onClick={onContactSupport}
              variant="outline"
              className="flex-1 gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              الدعم
            </Button>
          )}
        </div>

        {/* عدد محاولات إعادة المحاولة */}
        {autoRetryCount > 0 && (
          <p className="text-xs text-slate-500 text-center mt-3">
            المحاولة {autoRetryCount} من {maxAutoRetries}
          </p>
        )}
      </div>
    </div>
  );
}

// مكون رسالة الخطأ المضمنة
interface InlineErrorProps {
  message: string;
  type?: ErrorType;
  onDismiss?: () => void;
  className?: string;
}

export function InlineError({
  message,
  type = 'validation',
  onDismiss,
  className,
}: InlineErrorProps) {
  const config = ERROR_CONFIG[type];

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg animate-fadeInUp',
        config.bgColor,
        config.borderColor,
        'border',
        className
      )}
    >
      <span className={config.color}>{config.icon}</span>
      <p className={cn('flex-1 text-sm', config.color)}>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      )}
    </div>
  );
}

// مكون Toast للأخطاء
interface ErrorToastProps {
  error: ErrorInfo;
  onDismiss?: () => void;
  duration?: number;
}

export function ErrorToast({
  error,
  onDismiss,
  duration = 5000,
}: ErrorToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const config = ERROR_CONFIG[error.type];

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm',
        'p-4 rounded-xl shadow-2xl',
        'bg-slate-800 border',
        config.borderColor,
        'animate-slideInLeft'
      )}
    >
      <div className="flex items-start gap-3">
        <span className={config.color}>{config.icon}</span>
        <div className="flex-1">
          <p className={cn('font-semibold', config.color)}>{config.title}</p>
          <p className="text-sm text-slate-300 mt-1">{error.message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}

// دالة مساعدة لتحليل الأخطاء
export function parseError(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: 'network',
        message: 'فشل الاتصال بالخادم',
        canRetry: true,
      };
    }
    
    if (message.includes('timeout')) {
      return {
        type: 'timeout',
        message: 'انتهت مهلة الاتصال',
        canRetry: true,
      };
    }
    
    if (message.includes('payment') || message.includes('card')) {
      return {
        type: 'payment_failed',
        message: error.message,
        canRetry: true,
      };
    }
    
    return {
      type: 'unknown',
      message: error.message,
      canRetry: true,
    };
  }
  
  return {
    type: 'unknown',
    message: 'حدث خطأ غير متوقع',
    canRetry: true,
  };
}

export default ErrorHandler;
