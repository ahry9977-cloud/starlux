import React, { useState, useEffect, useCallback, memo, Suspense, lazy } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// Inline Critical CSS - تحميل فوري بدون blocking
const criticalStyles = `
  .auth-instant-bg { 
    background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%);
    min-height: 100vh;
  }
  .auth-instant-card {
    background: rgba(20, 20, 30, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(75, 0, 255, 0.2);
    border-radius: 24px;
    padding: 2rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  .auth-instant-input {
    width: 100%;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: white;
    font-size: 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .auth-instant-input:focus {
    border-color: #4B00FF;
    box-shadow: 0 0 0 3px rgba(75, 0, 255, 0.2);
  }
  .auth-instant-btn {
    width: 100%;
    padding: 14px 24px;
    background: linear-gradient(135deg, #4B00FF 0%, #FF00FF 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .auth-instant-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(75, 0, 255, 0.4);
  }
  .auth-instant-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  .auth-instant-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .auth-instant-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .auth-instant-tab {
    flex: 1;
    padding: 12px;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.5);
    font-size: 14px;
    cursor: pointer;
    transition: color 0.2s;
    position: relative;
  }
  .auth-instant-tab.active {
    color: white;
  }
  .auth-instant-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #4B00FF, #FF00FF);
  }
  .auth-instant-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 16px;
  }
  .auth-instant-link {
    color: #4B00FF;
    text-decoration: none;
    transition: color 0.2s;
  }
  .auth-instant-link:hover {
    color: #FF00FF;
  }
`;

// Skeleton UI للتحميل الفوري
const AuthSkeleton = memo(() => (
  <div className="auth-instant-bg flex items-center justify-center p-4">
    <style dangerouslySetInnerHTML={{ __html: criticalStyles }} />
    <div className="auth-instant-card w-full max-w-md">
      <div className="auth-instant-skeleton h-10 w-32 mx-auto mb-8" />
      <div className="space-y-4">
        <div className="auth-instant-skeleton h-12 w-full" />
        <div className="auth-instant-skeleton h-12 w-full" />
        <div className="auth-instant-skeleton h-12 w-full" />
      </div>
    </div>
  </div>
));
AuthSkeleton.displayName = 'AuthSkeleton';

// مكون الأيقونات المحسن - SVG inline بدلاً من مكتبة
const Icons = {
  ArrowLeft: memo(() => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  )),
  Eye: memo(() => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )),
  EyeOff: memo(() => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )),
  Mail: memo(() => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  )),
  Lock: memo(() => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )),
  Shield: memo(() => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )),
  Zap: memo(() => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )),
  Star: memo(() => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ))
};

// تعيين displayName للأيقونات
Object.keys(Icons).forEach(key => {
  (Icons as any)[key].displayName = key;
});

// نموذج تسجيل الدخول المحسن
const LoginFormOptimized = memo(({ 
  onSubmit, 
  onForgotPassword, 
  isLoading, 
  error 
}: {
  onSubmit: (data: { email: string; password: string }) => void;
  onForgotPassword: () => void;
  isLoading: boolean;
  error: string;
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    // التحقق السريع
    if (!email.trim()) {
      setLocalError('يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!password) {
      setLocalError('يرجى إدخال كلمة المرور');
      return;
    }
    
    onSubmit({ email: email.trim(), password });
  }, [email, password, onSubmit]);

  const displayError = error || localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <div className="auth-instant-error" role="alert">
          {displayError}
        </div>
      )}

      {/* البريد الإلكتروني */}
      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icons.Mail />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          className="auth-instant-input pr-12"
          dir="rtl"
          autoComplete="email"
          inputMode="email"
          disabled={isLoading}
        />
      </div>

      {/* كلمة المرور */}
      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icons.Lock />
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          className="auth-instant-input pr-12 pl-12"
          dir="rtl"
          autoComplete="current-password"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
        </button>
      </div>

      {/* نسيت كلمة المرور */}
      <div className="text-left">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm auth-instant-link"
        >
          نسيت كلمة المرور؟
        </button>
      </div>

      {/* زر تسجيل الدخول */}
      <button
        type="submit"
        disabled={isLoading}
        className="auth-instant-btn flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="auth-instant-spinner" />
            <span>جاري تسجيل الدخول...</span>
          </>
        ) : (
          'تسجيل الدخول'
        )}
      </button>


    </form>
  );
});
LoginFormOptimized.displayName = 'LoginFormOptimized';

// الصفحة الرئيسية المحسنة
const AuthPageOptimized: React.FC = () => {
  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // إعادة التوجيه للمستخدم المسجل - معطلة للسماح بالوصول للصفحة
  // يمكن للمستخدم المسجل الوصول لصفحة تسجيل الدخول لتسجيل الخروج أو تبديل الحساب

  // معالجة تسجيل الدخول
  const handleLogin = useCallback(async (data: { email: string; password: string }) => {
    setError('');
    setIsLoading(true);
    try {
      // استخدام OAuth flow
      window.location.href = '/api/oauth/login?provider=github';
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
      setIsLoading(false);
    }
  }, []);

  // معالجة نسيت كلمة المرور
  const handleForgotPassword = useCallback(() => {
    setView('forgot-password');
    setError('');
  }, []);

  return (
    <>
      {/* Critical CSS Inline */}
      <style dangerouslySetInnerHTML={{ __html: criticalStyles }} />
      
      <div className="auth-instant-bg">
        {/* المحتوى الرئيسي */}
        <div className="min-h-screen flex">
          {/* الجانب الأيسر - العلامة التجارية (سطح المكتب فقط) */}
          <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12">
            <div className="max-w-md text-center">
              {/* الشعار */}
              <div className="mb-8">
                <h1 className="text-6xl font-black text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #4B00FF, #FF00FF, #00ffff)' }}>
                  STAR LUX
                </h1>
                <p className="text-white/60 mt-2 text-lg">منصة التجارة الإلكترونية المتطورة</p>
              </div>

              {/* الميزات */}
              <div className="space-y-6 text-right">
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4B00FF, #FF00FF)' }}>
                    <Icons.Shield />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">أمان متقدم</h3>
                    <p className="text-white/50 text-sm">تشفير كامل وحماية من الاختراق</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF00FF, #00ffff)' }}>
                    <Icons.Zap />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">سرعة فائقة</h3>
                    <p className="text-white/50 text-sm">تجربة سلسة بدون تأخير</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00ffff, #4B00FF)' }}>
                    <Icons.Star />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">تجربة مميزة</h3>
                    <p className="text-white/50 text-sm">واجهة حديثة وسهلة الاستخدام</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* الجانب الأيمن - نماذج المصادقة */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-md">
              {/* العودة للرئيسية */}
              <button
                onClick={() => setLocation('/')}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
              >
                <Icons.ArrowLeft />
                العودة للرئيسية
              </button>

              {/* بطاقة المصادقة */}
              <div className="auth-instant-card">
                {/* الشعار للموبايل */}
                <div className="lg:hidden text-center mb-6">
                  <h1 className="text-3xl font-black text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #4B00FF, #FF00FF, #00ffff)' }}>
                    STAR LUX
                  </h1>
                </div>

                {view === 'login' && (
                  <>
                    {/* التبويبات */}
                    <div className="flex mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <button
                        type="button"
                        className="auth-instant-tab active"
                      >
                        تسجيل الدخول
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocation('/register-new')}
                        className="auth-instant-tab"
                      >
                        إنشاء حساب
                      </button>
                    </div>

                    <LoginFormOptimized
                      onSubmit={handleLogin}
                      onForgotPassword={handleForgotPassword}
                      isLoading={isLoading}
                      error={error}
                    />
                  </>
                )}

                {view === 'forgot-password' && (
                  <ForgotPasswordOptimized
                    onBack={() => setView('login')}
                  />
                )}
              </div>

              {/* التذييل */}
              <p className="text-center text-white/40 text-xs mt-6">
                بالتسجيل، أنت توافق على{' '}
                <a href="/terms" className="auth-instant-link">شروط الاستخدام</a>
                {' '}و{' '}
                <a href="/privacy" className="auth-instant-link">سياسة الخصوصية</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// نموذج نسيت كلمة المرور المحسن
const ForgotPasswordOptimized = memo(({ onBack }: { onBack: () => void }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtpMutation = trpc.auth.resendOTP.useMutation();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await sendOtpMutation.mutateAsync({
        identifier: email,
        purpose: 'password_reset',
        channel: 'email'
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'فشل إرسال رمز التحقق');
    } finally {
      setIsLoading(false);
    }
  }, [email, sendOtpMutation]);

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4B00FF, #FF00FF)' }}>
          <Icons.Mail />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">تم إرسال رمز التحقق</h3>
        <p className="text-white/60 mb-6">
          تم إرسال رمز التحقق إلى {email}
        </p>
        <button
          onClick={onBack}
          className="auth-instant-link"
        >
          العودة لتسجيل الدخول
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">استعادة كلمة المرور</h3>
        <p className="text-white/60 text-sm">
          أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق
        </p>
      </div>

      {error && (
        <div className="auth-instant-error" role="alert">
          {error}
        </div>
      )}

      <div className="relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icons.Mail />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="البريد الإلكتروني"
          className="auth-instant-input pr-12"
          dir="rtl"
          autoComplete="email"
          inputMode="email"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="auth-instant-btn flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="auth-instant-spinner" />
            <span>جاري الإرسال...</span>
          </>
        ) : (
          'إرسال رمز التحقق'
        )}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-white/60 hover:text-white transition-colors py-2"
      >
        العودة لتسجيل الدخول
      </button>
    </form>
  );
});
ForgotPasswordOptimized.displayName = 'ForgotPasswordOptimized';

export default AuthPageOptimized;
