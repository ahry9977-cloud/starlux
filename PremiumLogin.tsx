import React, { useState, memo, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { EnhancedMotionBackground } from '@/components/backgrounds/EnhancedMotionBackground';
import { useStarLuxSound, useFormSound, useNavigationSound } from '@/hooks/useStarLuxSound';
import { trpc } from '@/lib/trpc';

// Inline SVG Icons for instant load
const EyeIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
));

const EyeOffIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
));

const MailIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
));

const LockIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
));

const ArrowLeftIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
));

EyeIcon.displayName = 'EyeIcon';
EyeOffIcon.displayName = 'EyeOffIcon';
MailIcon.displayName = 'MailIcon';
LockIcon.displayName = 'LockIcon';
ArrowLeftIcon.displayName = 'ArrowLeftIcon';

const PremiumLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [, navigate] = useLocation();
  
  // Star Lux Sound System
  const { playClickSound, playSuccessSound, playErrorSound } = useStarLuxSound();
  const { onSubmit: playFormSubmit } = useFormSound();
  const { onNavigate: playNavigation } = useNavigationSound();

  // tRPC login mutation
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      playSuccessSound();
      // حفظ بيانات المستخدم في localStorage
      localStorage.setItem('manus-runtime-user-info', JSON.stringify({
        id: data.userId,
        email: data.email,
        name: data.name,
        role: data.role,
        isVerified: data.isVerified,
      }));
      
      // التوجيه الفوري حسب الدور
      if (data.role === 'admin' || data.role === 'sub_admin') {
        // الأدمن → لوحة التحكم
        navigate('/admin-dashboard');
      } else if (data.role === 'seller') {
        // البائع → لوحة البائع
        navigate('/seller-dashboard');
      } else {
        // المستخدم العادي → الصفحة الرئيسية
        navigate('/');
      }
    },
    onError: (error) => {
      playErrorSound();
      setError(error.message || 'حدث خطأ في تسجيل الدخول');
      setIsLoading(false);
    },
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    playFormSubmit();
    setError('');
    setIsLoading(true);

    try {
      // استدعاء API الدخول الفعلي
      await loginMutation.mutateAsync({
        email,
        password,
      });
    } catch (err) {
      // الخطأ يتم معالجته في onError
      console.error('Login error:', err);
    }
  }, [email, password, loginMutation, playFormSubmit, playSuccessSound, playErrorSound, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Motion Background */}
      <EnhancedMotionBackground
        variant="particles"
        intensity="vivid"
        colorScheme="purple"
        parallax={true}
      />

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        {/* Login Card */}
        <div 
          className="w-full max-w-md"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(139, 92, 246, 0.1)',
            padding: '48px',
          }}
        >
          {/* Header with Back Button and Sound Settings */}
          <div className="flex items-center justify-between" style={{ marginBottom: '32px' }}>
            <Link href="/">
              <button
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300"
                onClick={() => playNavigation()}
              >
                <ArrowLeftIcon />
                <span>العودة للرئيسية</span>
              </button>
            </Link>
            {/* Sound toggle in header */}
          </div>

          {/* Logo */}
          <div className="text-center" style={{ marginBottom: '48px' }}>
            <h1 
              className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
              style={{ marginBottom: '16px' }}
            >
              STAR LUX
            </h1>
            <p className="text-gray-400 text-lg">تسجيل الدخول إلى حسابك</p>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-center"
              style={{ padding: '16px', marginBottom: '24px' }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '24px' }}>
              <label 
                className="block text-gray-300 text-sm font-medium"
                style={{ marginBottom: '8px' }}
              >
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  style={{
                    padding: '16px 48px 16px 16px',
                    fontSize: '16px',
                  }}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '32px' }}>
              <label 
                className="block text-gray-300 text-sm font-medium"
                style={{ marginBottom: '8px' }}
              >
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  style={{
                    padding: '16px 48px',
                    fontSize: '16px',
                  }}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                padding: '18px 32px',
                fontSize: '18px',
                marginBottom: '24px',
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  جاري تسجيل الدخول...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="flex flex-col items-center" style={{ gap: '16px' }}>
            <Link href="/forgot-password">
              <span className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer">
                نسيت كلمة المرور؟
              </span>
            </Link>
            
            <div className="text-gray-400">
              ليس لديك حساب؟{' '}
              <Link href="/register-new">
                <span className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer font-medium">
                  إنشاء حساب جديد
                </span>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div 
            className="text-center text-gray-500 text-sm"
            style={{ marginTop: '48px' }}
          >
            <Link href="/terms">
              <span className="hover:text-gray-400 transition-colors cursor-pointer">
                شروط الاستخدام
              </span>
            </Link>
            {' • '}
            <Link href="/privacy">
              <span className="hover:text-gray-400 transition-colors cursor-pointer">
                سياسة الخصوصية
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLogin;
