import { useState, useCallback, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import {
  CardInputPage,
  PaymentSuccessAnimation,
  PaymentErrorAnimation,
  useCardSecurity,
} from '@/components/payment';
import type { PaymentErrorType } from '@/components/payment';

interface PaymentPageProps {
  orderId?: string;
  amount?: number;
}

export function PaymentPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/payment/:orderId');
  const { user, loading: authLoading } = useAuth();
  
  // حالات الصفحة
  const [amount, setAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<PaymentErrorType>('unknown');
  
  // أمان البطاقة
  const {
    processPayment,
    isSubmitting,
    isSessionValid,
    remainingAttempts,
    updateActivity,
  } = useCardSecurity({
    maxRetries: 3,
    sessionTimeout: 300000, // 5 دقائق
  });

  // جلب بيانات الطلب
  useEffect(() => {
    // في الإنتاج، يتم جلب المبلغ من الطلب
    // هنا نستخدم قيمة افتراضية للعرض
    const urlParams = new URLSearchParams(window.location.search);
    const amountParam = urlParams.get('amount');
    if (amountParam) {
      setAmount(parseInt(amountParam, 10));
    } else {
      setAmount(150000); // قيمة افتراضية
    }
  }, [params]);

  // تحديث النشاط عند التفاعل
  useEffect(() => {
    const handleActivity = () => updateActivity();
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [updateActivity]);

  // معالجة نجاح الدفع
  const handleSuccess = useCallback(() => {
    setShowSuccess(true);
    
    // الانتقال بعد 3 ثواني
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  }, [navigate]);

  // معالجة الخطأ
  const handleError = useCallback((type: PaymentErrorType) => {
    setErrorType(type);
    setShowError(true);
  }, []);

  // إعادة المحاولة
  const handleRetry = useCallback(() => {
    setShowError(false);
    setErrorType('unknown');
  }, []);

  // إلغاء الدفع
  const handleCancel = useCallback(() => {
    window.history.back();
  }, [navigate]);

  // التحقق من تسجيل الدخول
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // التحقق من صلاحية الجلسة
  if (!isSessionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md p-8 bg-slate-800/50 rounded-2xl border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">انتهت صلاحية الجلسة</h2>
          <p className="text-slate-400 mb-6">
            لأسباب أمنية، انتهت صلاحية جلسة الدفع. يرجى إعادة المحاولة.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* صفحة إدخال البطاقة */}
      <CardInputPage
        amount={amount}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      {/* أنيميشن النجاح */}
      <PaymentSuccessAnimation
        isVisible={showSuccess}
        amount={amount}
        onComplete={() => navigate('/dashboard')}
      />

      {/* أنيميشن الخطأ */}
      <PaymentErrorAnimation
        isVisible={showError}
        errorType={errorType}
        onRetry={handleRetry}
        onCancel={handleCancel}
      />

      {/* مؤشر المحاولات المتبقية */}
      {remainingAttempts < 3 && !showSuccess && !showError && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto">
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 text-center sm:text-right">
            <p className="text-sm text-amber-300">
              المحاولات المتبقية: {remainingAttempts}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default PaymentPage;
