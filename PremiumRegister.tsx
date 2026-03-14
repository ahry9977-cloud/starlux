import React, { useState, memo, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { EnhancedMotionBackground } from '@/components/backgrounds/EnhancedMotionBackground';
import { useStarLuxSound, useFormSound, useNavigationSound } from '@/hooks/useStarLuxSound';

// Inline SVG Icons
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

const GoogleIcon = memo(() => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.1 8.1 3.1l6-6C34.5 2.9 29.7 1 24 1 14.6 1 6.4 6.4 2.6 14.2l7 5.4C11.5 13.6 17.2 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.1 24.6c0-1.7-.2-3.3-.5-4.9H24v9.3h12.4c-.5 2.6-2 4.8-4.2 6.3l6.5 5c3.8-3.5 6.4-8.6 6.4-15.7z"/>
    <path fill="#FBBC05" d="M9.6 28.6c-.6-1.7-1-3.5-1-5.4s.4-3.7 1-5.4l-7-5.4C1 15.7 0 19.7 0 23.2s1 7.5 2.6 10.8l7-5.4z"/>
    <path fill="#34A853" d="M24 46.4c5.7 0 10.5-1.9 14-5.1l-6.5-5c-1.8 1.2-4.2 2-7.5 2-6.8 0-12.5-4.1-14.4-10l-7 5.4C6.4 41.6 14.6 46.4 24 46.4z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
));

const GitHubIcon = memo(() => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.05c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.74.08-.74 1.21.09 1.85 1.25 1.85 1.25 1.08 1.84 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.67-.31-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.56.12-3.25 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.69.24 2.94.12 3.25.77.84 1.24 1.91 1.24 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.82 1.11.82 2.24v3.32c0 .32.22.7.82.58A12 12 0 0012 .5z" />
  </svg>
));

const FacebookIcon = memo(() => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12a12 12 0 1 0-13.88 11.86v-8.39H7.08V12h3.04V9.36c0-3 1.79-4.66 4.53-4.66 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.39A12 12 0 0 0 24 12z" />
  </svg>
));

const UserIcon = memo(() => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
));

const StoreIcon = memo(() => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
));

const ArrowLeftIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
));

const ArrowRightIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
));

const CheckIcon = memo(() => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
));

UserIcon.displayName = 'UserIcon';
StoreIcon.displayName = 'StoreIcon';
ArrowLeftIcon.displayName = 'ArrowLeftIcon';
ArrowRightIcon.displayName = 'ArrowRightIcon';
CheckIcon.displayName = 'CheckIcon';
GitHubIcon.displayName = 'GitHubIcon';

type AccountType = 'buyer' | 'seller' | null;

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = memo(({ currentStep, totalSteps }) => (
  <div className="flex items-center justify-center" style={{ gap: '8px', marginBottom: '48px' }}>
    {Array.from({ length: totalSteps }).map((_, index) => (
      <div
        key={index}
        className={`h-2 rounded-full transition-all duration-500 ${
          index < currentStep
            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
            : index === currentStep
            ? 'bg-purple-500'
            : 'bg-slate-700'
        }`}
        style={{
          width: index === currentStep ? '48px' : '16px',
        }}
      />
    ))}
  </div>
));

StepIndicator.displayName = 'StepIndicator';

const PremiumRegister: React.FC = () => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // Star Lux Sound System
  const { playSuccessSound, playNavigationSound, playClickSound } = useStarLuxSound();

  const totalSteps = accountType === 'seller' ? 4 : 3;

  const handleNext = useCallback(() => {
    if (step < totalSteps - 1) {
      playNavigationSound();
      setStep(step + 1);
    }
  }, [step, totalSteps, playNavigationSound]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      playNavigationSound();
      setStep(step - 1);
    }
  }, [step, playNavigationSound]);

  const handleComplete = useCallback(() => {
    playSuccessSound();
    setLocation('/welcome?type=' + accountType);
  }, [accountType, setLocation, playSuccessSound]);

  const onRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y, key: Date.now() });
  }, []);

  const renderAccountTypeStep = () => (
    <div className="text-center">
      <h2 
        className="text-2xl font-bold text-white"
        style={{ marginBottom: '16px' }}
      >
        اختر نوع حسابك
      </h2>
      <p 
        className="text-gray-400"
        style={{ marginBottom: '48px' }}
      >
        حدد كيف تريد استخدام STAR LUX
      </p>

      <div 
        className="grid grid-cols-2"
        style={{ gap: '24px', marginBottom: '48px' }}
      >
        {/* Buyer Option */}
        <button
          onClick={() => setAccountType('buyer')}
          className={`group relative rounded-2xl transition-all duration-300 transform hover:scale-105 ${
            accountType === 'buyer'
              ? 'ring-2 ring-purple-500 bg-purple-500/10'
              : 'bg-slate-800/50 hover:bg-slate-800'
          }`}
          style={{ padding: '32px' }}
        >
          <div 
            className={`mx-auto transition-colors duration-300 ${
              accountType === 'buyer' ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'
            }`}
            style={{ marginBottom: '16px' }}
          >
            <UserIcon />
          </div>
          <h3 
            className="text-lg font-bold text-white"
            style={{ marginBottom: '8px' }}
          >
            مشتري
          </h3>
          <p className="text-gray-400 text-sm">
            تصفح واشتري المنتجات
          </p>
          {accountType === 'buyer' && (
            <div className="absolute top-4 left-4 text-purple-400">
              <CheckIcon />
            </div>
          )}
        </button>

        {/* Seller Option */}
        <button
          onClick={() => setAccountType('seller')}
          className={`group relative rounded-2xl transition-all duration-300 transform hover:scale-105 ${
            accountType === 'seller'
              ? 'ring-2 ring-purple-500 bg-purple-500/10'
              : 'bg-slate-800/50 hover:bg-slate-800'
          }`}
          style={{ padding: '32px' }}
        >
          <div 
            className={`mx-auto transition-colors duration-300 ${
              accountType === 'seller' ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'
            }`}
            style={{ marginBottom: '16px' }}
          >
            <StoreIcon />
          </div>
          <h3 
            className="text-lg font-bold text-white"
            style={{ marginBottom: '8px' }}
          >
            بائع
          </h3>
          <p className="text-gray-400 text-sm">
            أنشئ متجرك وابدأ البيع
          </p>
          {accountType === 'seller' && (
            <div className="absolute top-4 left-4 text-purple-400">
              <CheckIcon />
            </div>
          )}
        </button>
      </div>

      <div className="flex items-center gap-3" style={{ marginTop: '4px', marginBottom: '14px' }}>
        <div className="h-px flex-1 bg-white/10" />
        <div className="text-[11px] text-white/40">or sign up with</div>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-3 gap-3" style={{ marginBottom: '8px' }}>
        <button
          type="button"
          onClick={() => {
            playClickSound();
            window.location.href = '/api/oauth/login?provider=google';
          }}
          className="h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
          aria-label="Sign up with Google"
        >
          <GoogleIcon />
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound();
            window.location.href = '/api/oauth/login?provider=github';
          }}
          className="h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-white"
          aria-label="Sign up with GitHub"
        >
          <GitHubIcon />
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound();
            window.location.href = '/api/oauth/login?provider=facebook';
          }}
          className="h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-[#1877F2]"
          aria-label="Sign up with Facebook"
        >
          <FacebookIcon />
        </button>
      </div>
    </div>
  );

  const renderFormStep = () => (
    <div>
      <h2 
        className="text-2xl font-bold text-white text-center"
        style={{ marginBottom: '16px' }}
      >
        معلومات الحساب
      </h2>
      <p 
        className="text-gray-400 text-center"
        style={{ marginBottom: '48px' }}
      >
        أدخل بياناتك لإنشاء حسابك
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Name Field */}
        <div>
          <label 
            className="block text-gray-300 text-sm font-medium"
            style={{ marginBottom: '8px' }}
          >
            الاسم الكامل
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
              <UserIcon />
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل اسمك الكامل"
              className="slx-input w-full bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/35 transition-all duration-300"
              style={{ height: '52px', padding: '0 16px 0 56px', fontSize: '16px' }}
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label 
            className="block text-gray-300 text-sm font-medium"
            style={{ marginBottom: '8px' }}
          >
            البريد الإلكتروني
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
              <MailIcon />
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              className="slx-input w-full bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/35 transition-all duration-300"
              style={{ height: '52px', padding: '0 16px 0 48px', fontSize: '16px' }}
              autoComplete="email"
              inputMode="email"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label 
            className="block text-gray-300 text-sm font-medium"
            style={{ marginBottom: '8px' }}
          >
            كلمة المرور
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
              <LockIcon />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="أدخل كلمة المرور"
              className="slx-input w-full bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/35 transition-all duration-300"
              style={{ height: '52px', padding: '0 48px 0 48px', fontSize: '16px' }}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 hover:text-white transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label 
            className="block text-gray-300 text-sm font-medium"
            style={{ marginBottom: '8px' }}
          >
            تأكيد كلمة المرور
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
              <LockIcon />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="أعد إدخال كلمة المرور"
              className="slx-input w-full bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/35 transition-all duration-300"
              style={{ height: '52px', padding: '0 16px 0 48px', fontSize: '16px' }}
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center">
      <div 
        className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
        style={{ marginBottom: '32px' }}
      >
        <CheckIcon />
      </div>
      <h2 
        className="text-2xl font-bold text-white"
        style={{ marginBottom: '16px' }}
      >
        تم إنشاء حسابك بنجاح!
      </h2>
      <p 
        className="text-gray-400"
        style={{ marginBottom: '48px' }}
      >
        مرحباً بك في STAR LUX
      </p>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 0:
        return renderAccountTypeStep();
      case 1:
        return renderFormStep();
      case 2:
        return renderCompleteStep();
      default:
        return renderAccountTypeStep();
    }
  };

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
          .slx-ripple { position: absolute; width: 240px; height: 240px; border-radius: 999px; background: rgba(255,255,255,.65); pointer-events: none; animation: slxRipple 650ms ease-out forwards; }
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
                    onClick={() => playClickSound()}
                  >
                    <ArrowLeftIcon />
                    <span className="text-sm">العودة للرئيسية</span>
                  </button>
                </Link>
                <div className="text-white/50 text-xs">STAR LUX</div>
              </div>

              <div className="text-center" style={{ marginBottom: '20px' }}>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-200 bg-clip-text text-transparent" style={{ letterSpacing: '-0.02em' }}>
                  STAR LUX
                </h1>
                <p className="text-white/55 text-sm" style={{ marginTop: '6px' }}>Create your account</p>
              </div>

              <StepIndicator currentStep={step} totalSteps={totalSteps} />

              {renderCurrentStep()}

              <div 
                className="flex justify-between items-center"
                style={{ marginTop: '32px', gap: '16px' }}
              >
            {step > 0 && step < totalSteps - 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                style={{ padding: '10px 10px' }}
              >
                <ArrowRightIcon />
                <span>السابق</span>
              </button>
            )}

            {step === 0 && (
              <button
                onClick={handleNext}
                disabled={!accountType}
                onMouseDown={(e) => onRipple(e as any)}
                className="relative overflow-hidden flex-1 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                style={{ height: '54px', padding: '0 16px', fontSize: '16px', background: 'linear-gradient(135deg, rgba(168,85,247,1), rgba(236,72,153,1), rgba(34,211,238,.9))', boxShadow: '0 18px 45px rgba(168,85,247,.22)' }}
              >
                {ripple && (
                  <span key={ripple.key} className="slx-ripple" style={{ left: ripple.x, top: ripple.y }} />
                )}
                <span>التالي</span>
                <ArrowLeftIcon />
              </button>
            )}

            {step === 1 && (
              <button
                onClick={handleNext}
                onMouseDown={(e) => onRipple(e as any)}
                className="relative overflow-hidden flex-1 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                style={{ height: '54px', padding: '0 16px', fontSize: '16px', background: 'linear-gradient(135deg, rgba(168,85,247,1), rgba(236,72,153,1), rgba(34,211,238,.9))', boxShadow: '0 18px 45px rgba(168,85,247,.22)' }}
              >
                {ripple && (
                  <span key={ripple.key} className="slx-ripple" style={{ left: ripple.x, top: ripple.y }} />
                )}
                <span>إنشاء الحساب</span>
                <ArrowLeftIcon />
              </button>
            )}

            {step === totalSteps - 1 && (
              <button
                onClick={handleComplete}
                onMouseDown={(e) => onRipple(e as any)}
                className="relative overflow-hidden flex-1 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                style={{ height: '54px', padding: '0 16px', fontSize: '16px', background: 'linear-gradient(135deg, rgba(168,85,247,1), rgba(236,72,153,1), rgba(34,211,238,.9))', boxShadow: '0 18px 45px rgba(168,85,247,.22)' }}
              >
                {ripple && (
                  <span key={ripple.key} className="slx-ripple" style={{ left: ripple.x, top: ripple.y }} />
                )}
                <span>ابدأ الآن</span>
                <ArrowLeftIcon />
              </button>
            )}
              </div>

              {step === 0 && (
                <div className="text-center text-white/55" style={{ marginTop: '22px' }}>
                  لديك حساب بالفعل؟{' '}
                  <Link href="/auth">
                    <span className="text-cyan-200/80 hover:text-cyan-200 transition-colors cursor-pointer font-medium">
                      تسجيل الدخول
                    </span>
                  </Link>
                </div>
              )}

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

export default PremiumRegister;
