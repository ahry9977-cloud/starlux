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

const GoogleIcon = memo(() => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.1 8.1 3.1l6-6C34.5 2.9 29.7 1 24 1 14.6 1 6.4 6.4 2.6 14.2l7 5.4C11.5 13.6 17.2 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.1 24.6c0-1.7-.2-3.3-.5-4.9H24v9.3h12.4c-.5 2.6-2 4.8-4.2 6.3l6.5 5c3.8-3.5 6.4-8.6 6.4-15.7z"/>
    <path fill="#FBBC05" d="M9.6 28.6c-.6-1.7-1-3.5-1-5.4s.4-3.7 1-5.4l-7-5.4C1 15.7 0 19.7 0 23.2s1 7.5 2.6 10.8l7-5.4z"/>
    <path fill="#34A853" d="M24 46.4c5.7 0 10.5-1.9 14-5.1l-6.5-5c-1.8 1.2-4.2 2-7.5 2-6.8 0-12.5-4.1-14.4-10l-7 5.4C6.4 41.6 14.6 46.4 24 46.4z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
));

const AppleIcon = memo(() => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.365 1.43c0 1.14-.43 2.2-1.19 3.03-.82.9-2.16 1.6-3.32 1.51-.14-1.1.41-2.25 1.14-3.05.81-.9 2.25-1.56 3.37-1.49z" />
    <path d="M20.64 17.02c-.62 1.43-.91 2.06-1.71 3.33-1.12 1.74-2.7 3.9-4.66 3.92-1.74.02-2.19-1.14-4.56-1.12-2.37.01-2.86 1.14-4.6 1.12-1.96-.02-3.46-1.96-4.58-3.7C.43 18.5 0 16.6 0 14.78c0-3.43 2.22-5.25 4.4-5.25 1.74 0 2.84 1.15 4.28 1.15 1.4 0 2.25-1.15 4.27-1.15 1.95 0 4.01 1.06 4.89 2.9-3.82 2.09-3.2 7.51.8 9.59z" />
  </svg>
));

const FacebookIcon = memo(() => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12a12 12 0 1 0-13.88 11.86v-8.39H7.08V12h3.04V9.36c0-3 1.79-4.66 4.53-4.66 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.39A12 12 0 0 0 24 12z" />
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
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);
  const [, navigate] = useLocation();

  const formatLoginError = useCallback((raw: unknown): string => {
    const msg = String((raw as any)?.message ?? raw ?? '').trim();
    if (!msg) return 'تعذر تسجيل الدخول. حاول مرة أخرى.';
    if (msg.toLowerCase().includes('unexpected end of json input')) {
      return 'تعذر الاتصال بالخادم. حاول مرة أخرى بعد قليل.';
    }
    if (msg.toLowerCase().includes('failed to fetch')) {
      return 'تعذر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.';
    }
    if (msg.toLowerCase().includes('network')) {
      return 'حدثت مشكلة في الشبكة. حاول مرة أخرى.';
    }
    return msg;
  }, []);
  
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
      setError(formatLoginError(error));
      setIsLoading(false);
    },
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    playFormSubmit();
    setError('');
    setIsLoading(true);

    const normalizedEmail = String(email ?? '').toLowerCase().trim();
    const normalizedPassword = String(password ?? '');

    if (!normalizedEmail) {
      setError('يرجى إدخال البريد الإلكتروني');
      setIsLoading(false);
      return;
    }
    if (!normalizedPassword) {
      setError('يرجى إدخال كلمة المرور');
      setIsLoading(false);
      return;
    }

    try {
      // استدعاء API الدخول الفعلي
      await loginMutation.mutateAsync({
        email: normalizedEmail,
        password: normalizedPassword,
      });
    } catch (err) {
      console.error('Login error:', err);
      setError((prev) => prev || formatLoginError(err));
      setIsLoading(false);
    }
  }, [email, password, loginMutation, playFormSubmit, formatLoginError]);

  const onRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y, key: Date.now() });
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Motion Background */}
      <EnhancedMotionBackground
        variant="particles"
        intensity="vivid"
        colorScheme="purple"
        parallax={true}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes slxFloatA { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(18px,-22px,0) scale(1.03); } }
          @keyframes slxFloatB { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-14px,18px,0) scale(1.04); } }
          @keyframes slxCardIn { from { opacity: 0; transform: translate3d(0,12px,0) scale(.98); } to { opacity: 1; transform: translate3d(0,0,0) scale(1); } }
          @keyframes slxGlowPulse { 0%,100% { opacity: .55; } 50% { opacity: .85; } }
          @keyframes slxRipple { from { transform: translate(-50%,-50%) scale(.2); opacity: .45; } to { transform: translate(-50%,-50%) scale(2.6); opacity: 0; } }
          .slx-auth-card { animation: slxCardIn 520ms cubic-bezier(.2,.9,.2,1) both; }
          .slx-glow-a { animation: slxFloatA 10s ease-in-out infinite; }
          .slx-glow-b { animation: slxFloatB 12s ease-in-out infinite; }
          .slx-glow-pulse { animation: slxGlowPulse 6s ease-in-out infinite; }
          .slx-input { outline: none; }
          .slx-input:focus { box-shadow: 0 0 0 4px rgba(168,85,247,.18), 0 0 30px rgba(168,85,247,.10); border-color: rgba(168,85,247,.8); }
          .slx-soft-border { background: linear-gradient(135deg, rgba(168,85,247,.55), rgba(236,72,153,.45), rgba(34,211,238,.25)); padding: 1px; border-radius: 28px; }
          .slx-ripple { position: absolute; width: 220px; height: 220px; border-radius: 999px; background: rgba(255,255,255,.65); pointer-events: none; animation: slxRipple 650ms ease-out forwards; }
        `,
        }}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full blur-3xl opacity-70 slx-glow-a"
          style={{ background: 'radial-gradient(circle at 30% 30%, rgba(168,85,247,.45), transparent 55%)' }}
        />
        <div className="absolute -bottom-28 -left-24 w-[560px] h-[560px] rounded-full blur-3xl opacity-70 slx-glow-b"
          style={{ background: 'radial-gradient(circle at 30% 30%, rgba(34,211,238,.35), transparent 60%)' }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[620px] h-[360px] rounded-full blur-3xl slx-glow-pulse"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(236,72,153,.25), transparent 60%)' }}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10 sm:px-8">
        {/* Login Card */}
        <div className="w-full max-w-[460px]">
          <div className="slx-soft-border">
            <div
              className="slx-auth-card"
              style={{
                background: 'rgba(2, 6, 23, 0.72)',
                backdropFilter: 'blur(22px)',
                borderRadius: '28px',
                boxShadow: '0 26px 60px rgba(0,0,0,.55), 0 0 140px rgba(168,85,247,.12)',
                padding: '28px',
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '22px' }}>
                <Link href="/">
                  <button
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-300"
                    onClick={() => playNavigation()}
                  >
                    <ArrowLeftIcon />
                    <span className="text-sm">العودة للرئيسية</span>
                  </button>
                </Link>
                <div className="text-white/50 text-xs">STAR LUX</div>
              </div>

              <div className="text-center" style={{ marginBottom: '22px' }}>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(168,85,247,.35), rgba(236,72,153,.25))', border: '1px solid rgba(255,255,255,.10)' }}
                >
                  <div className="w-9 h-9 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(168,85,247,.9), rgba(34,211,238,.65))', boxShadow: '0 10px 30px rgba(168,85,247,.25)' }}
                  />
                </div>
                <h1
                  className="text-3xl font-extrabold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-200 bg-clip-text text-transparent"
                  style={{ marginBottom: '10px', letterSpacing: '-0.02em' }}
                >
                  STAR LUX
                </h1>
                <p className="text-white/85 text-xl font-semibold" style={{ marginBottom: '6px' }}>Welcome back</p>
                <p className="text-white/55 text-sm">Login to your account</p>
              </div>

              {error && (
                <div
                  className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl text-center"
                  style={{ padding: '14px', marginBottom: '16px' }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label className="block text-white/70 text-xs font-medium" style={{ marginBottom: '8px' }}>
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
                      <MailIcon />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="slx-input w-full bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/35 transition-all duration-300"
                      style={{ height: '52px', padding: '0 16px 0 48px', fontSize: '16px' }}
                      disabled={isLoading}
                      autoComplete="email"
                      inputMode="email"
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label className="block text-white/70 text-xs font-medium" style={{ marginBottom: '8px' }}>
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
                      <LockIcon />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="slx-input w-full bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/35 transition-all duration-300"
                      style={{ height: '52px', padding: '0 48px 0 48px', fontSize: '16px' }}
                      disabled={isLoading}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                  <Link href="/forgot-password">
                    <span
                      className="text-xs text-cyan-200/80 hover:text-cyan-200 transition-colors cursor-pointer"
                      onClick={() => playClickSound()}
                    >
                      Forgot password?
                    </span>
                  </Link>
                  <Link href="/register-new">
                    <span
                      className="text-xs text-white/55 hover:text-white transition-colors cursor-pointer"
                      onClick={() => playClickSound()}
                    >
                      Create new account
                    </span>
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  onClick={(e) => {
                    onRipple(e);
                    playClickSound();
                  }}
                  className="relative overflow-hidden w-full text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    height: '54px',
                    fontSize: '16px',
                    background: 'linear-gradient(135deg, rgba(168,85,247,1), rgba(236,72,153,1), rgba(34,211,238,.9))',
                    boxShadow: '0 18px 45px rgba(168,85,247,.22)',
                  }}
                >
                  {ripple && (
                    <span
                      key={ripple.key}
                      className="slx-ripple"
                      style={{ left: ripple.x, top: ripple.y }}
                    />
                  )}
                  <span className="relative z-10">
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </span>
                </button>

                <div className="flex items-center gap-3" style={{ marginTop: '18px', marginBottom: '14px' }}>
                  <div className="h-px flex-1 bg-white/10" />
                  <div className="text-[11px] text-white/40">or continue with</div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      window.location.href = '/api/oauth/login';
                    }}
                    className="h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label="Continue with Google"
                  >
                    <GoogleIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      window.location.href = '/api/oauth/login';
                    }}
                    className="h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-white"
                    aria-label="Continue with Apple"
                  >
                    <AppleIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      window.location.href = '/api/oauth/login';
                    }}
                    className="h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-[#1877F2]"
                    aria-label="Continue with Facebook"
                  >
                    <FacebookIcon />
                  </button>
                </div>
              </form>

              <p className="text-center text-[11px] text-white/35 mt-6">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-white/55 hover:text-white transition-colors">Terms</a>
                {' '}and{' '}
                <a href="/privacy" className="text-white/55 hover:text-white transition-colors">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLogin;
