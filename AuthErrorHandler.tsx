import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff, Clock, Shield, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlowButton } from './GlowButton';

// ==================== Error Types ====================
export type AuthErrorType = 
  | 'network'
  | 'timeout'
  | 'invalid_credentials'
  | 'account_locked'
  | 'email_exists'
  | 'phone_exists'
  | 'weak_password'
  | 'invalid_otp'
  | 'otp_expired'
  | 'rate_limited'
  | 'server_error'
  | 'unknown';

interface AuthError {
  type: AuthErrorType;
  message: string;
  suggestion?: string;
  action?: {
    label: string;
    handler: () => void;
  };
  autoRetry?: boolean;
  retryAfter?: number;
}

// ==================== Error Parser ====================
export const parseAuthError = (error: unknown): AuthError => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return {
      type: 'network',
      message: 'لا يوجد اتصال بالإنترنت',
      suggestion: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
      autoRetry: true,
    };
  }

  // Timeout
  if (lowerMessage.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'انتهت مهلة الاتصال',
      suggestion: 'الخادم بطيء حالياً، حاول مرة أخرى',
      autoRetry: true,
    };
  }

  // Invalid credentials
  if (lowerMessage.includes('invalid') && (lowerMessage.includes('password') || lowerMessage.includes('credentials'))) {
    return {
      type: 'invalid_credentials',
      message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      suggestion: 'تأكد من صحة البيانات المدخلة',
    };
  }

  // Account locked
  if (lowerMessage.includes('locked') || lowerMessage.includes('blocked')) {
    return {
      type: 'account_locked',
      message: 'الحساب مقفل مؤقتاً',
      suggestion: 'تم تجاوز الحد الأقصى للمحاولات، انتظر قليلاً',
      retryAfter: 900, // 15 minutes
    };
  }

  // Email exists
  if (lowerMessage.includes('email') && lowerMessage.includes('exist')) {
    return {
      type: 'email_exists',
      message: 'البريد الإلكتروني مسجل مسبقاً',
      suggestion: 'جرب تسجيل الدخول بدلاً من إنشاء حساب جديد',
    };
  }

  // Phone exists
  if (lowerMessage.includes('phone') && lowerMessage.includes('exist')) {
    return {
      type: 'phone_exists',
      message: 'رقم الهاتف مسجل مسبقاً',
      suggestion: 'جرب تسجيل الدخول بدلاً من إنشاء حساب جديد',
    };
  }

  // Weak password
  if (lowerMessage.includes('weak') || lowerMessage.includes('password')) {
    return {
      type: 'weak_password',
      message: 'كلمة المرور ضعيفة',
      suggestion: 'استخدم كلمة مرور أقوى تحتوي على أحرف وأرقام ورموز',
    };
  }

  // Invalid OTP
  if (lowerMessage.includes('otp') && lowerMessage.includes('invalid')) {
    return {
      type: 'invalid_otp',
      message: 'رمز التحقق غير صحيح',
      suggestion: 'تأكد من إدخال الرمز الصحيح المرسل إليك',
    };
  }

  // OTP expired
  if (lowerMessage.includes('otp') && lowerMessage.includes('expired')) {
    return {
      type: 'otp_expired',
      message: 'انتهت صلاحية رمز التحقق',
      suggestion: 'اطلب رمز تحقق جديد',
    };
  }

  // Rate limited
  if (lowerMessage.includes('rate') || lowerMessage.includes('too many')) {
    return {
      type: 'rate_limited',
      message: 'طلبات كثيرة جداً',
      suggestion: 'انتظر قليلاً قبل المحاولة مرة أخرى',
      retryAfter: 60,
    };
  }

  // Server error
  if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
    return {
      type: 'server_error',
      message: 'خطأ في الخادم',
      suggestion: 'حدث خطأ تقني، حاول مرة أخرى لاحقاً',
      autoRetry: true,
    };
  }

  // Unknown error
  return {
    type: 'unknown',
    message: errorMessage || 'حدث خطأ غير متوقع',
    suggestion: 'حاول مرة أخرى أو تواصل مع الدعم الفني',
  };
};

// ==================== Error Display Component ====================
interface AuthErrorDisplayProps {
  error: AuthError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className,
}) => {
  const [countdown, setCountdown] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const parsedError = typeof error === 'string' ? parseAuthError(error) : error;

  useEffect(() => {
    if (parsedError?.retryAfter) {
      setCountdown(parsedError.retryAfter);
    }
  }, [parsedError]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!parsedError) return null;

  const getIcon = () => {
    switch (parsedError.type) {
      case 'network':
        return <WifiOff className="w-5 h-5" />;
      case 'timeout':
        return <Clock className="w-5 h-5" />;
      case 'account_locked':
      case 'rate_limited':
        return <Shield className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true);
      try {
        await onRetry();
      } finally {
        setIsRetrying(false);
      }
    }
  };

  return (
    <div
      className={cn(
        'p-4 rounded-xl border animate-[errorAppear_0.3s_ease]',
        parsedError.type === 'network' || parsedError.type === 'timeout'
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-red-500/10 border-red-500/30',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex-shrink-0 mt-0.5',
          parsedError.type === 'network' || parsedError.type === 'timeout'
            ? 'text-yellow-400'
            : 'text-red-400'
        )}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium',
            parsedError.type === 'network' || parsedError.type === 'timeout'
              ? 'text-yellow-400'
              : 'text-red-400'
          )}>
            {parsedError.message}
          </p>
          {parsedError.suggestion && (
            <p className="text-white/60 text-sm mt-1">
              {parsedError.suggestion}
            </p>
          )}
          {countdown > 0 && (
            <p className="text-white/40 text-sm mt-2">
              يمكنك المحاولة بعد: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-white/40 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Action buttons */}
      {(onRetry || parsedError.action) && countdown === 0 && (
        <div className="flex gap-2 mt-3">
          {onRetry && parsedError.autoRetry && (
            <GlowButton
              variant="outline"
              size="sm"
              onClick={handleRetry}
              loading={isRetrying}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </GlowButton>
          )}
          {parsedError.action && (
            <GlowButton
              variant="outline"
              size="sm"
              onClick={parsedError.action.handler}
              className="flex-1"
            >
              {parsedError.action.label}
            </GlowButton>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== Network Status Hook ====================
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// ==================== Offline Banner ====================
export const OfflineBanner: React.FC = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white py-2 px-4 text-center text-sm flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" />
      <span>لا يوجد اتصال بالإنترنت</span>
    </div>
  );
};

export default {
  parseAuthError,
  AuthErrorDisplay,
  useNetworkStatus,
  OfflineBanner,
};
