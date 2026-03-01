import React, { useState, memo, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { EnhancedMotionBackground } from '@/components/backgrounds/EnhancedMotionBackground';
import { useStarLuxSound, useFormSound, useNavigationSound } from '@/hooks/useStarLuxSound';

// Inline SVG Icons
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
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="أدخل اسمك الكامل"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
            style={{ padding: '16px', fontSize: '16px' }}
          />
        </div>

        {/* Email Field */}
        <div>
          <label 
            className="block text-gray-300 text-sm font-medium"
            style={{ marginBottom: '8px' }}
          >
            البريد الإلكتروني
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="أدخل بريدك الإلكتروني"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
            style={{ padding: '16px', fontSize: '16px' }}
          />
        </div>

        {/* Password Field */}
        <div>
          <label 
            className="block text-gray-300 text-sm font-medium"
            style={{ marginBottom: '8px' }}
          >
            كلمة المرور
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="أدخل كلمة المرور"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
            style={{ padding: '16px', fontSize: '16px' }}
          />
        </div>

        {/* Confirm Password Field */}
        <div>
          <label 
            className="block text-gray-300 text-sm font-medium"
            style={{ marginBottom: '8px' }}
          >
            تأكيد كلمة المرور
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="أعد إدخال كلمة المرور"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
            style={{ padding: '16px', fontSize: '16px' }}
          />
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

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        {/* Register Card */}
        <div 
          className="w-full max-w-lg"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(139, 92, 246, 0.1)',
            padding: '48px',
          }}
        >
          {/* Back Button */}
          <Link href="/">
            <button
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300"
              style={{ marginBottom: '32px' }}
            >
              <ArrowLeftIcon />
              <span>العودة للرئيسية</span>
            </button>
          </Link>

          {/* Logo */}
          <div className="text-center" style={{ marginBottom: '32px' }}>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              STAR LUX
            </h1>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={step} totalSteps={totalSteps} />

          {/* Current Step Content */}
          {renderCurrentStep()}

          {/* Navigation Buttons */}
          <div 
            className="flex justify-between items-center"
            style={{ marginTop: '48px', gap: '24px' }}
          >
            {step > 0 && step < totalSteps - 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                style={{ padding: '16px 24px' }}
              >
                <ArrowRightIcon />
                <span>السابق</span>
              </button>
            )}

            {step === 0 && (
              <button
                onClick={handleNext}
                disabled={!accountType}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                style={{ padding: '18px 32px', fontSize: '18px' }}
              >
                <span>التالي</span>
                <ArrowLeftIcon />
              </button>
            )}

            {step === 1 && (
              <button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                style={{ padding: '18px 32px', fontSize: '18px' }}
              >
                <span>إنشاء الحساب</span>
                <ArrowLeftIcon />
              </button>
            )}

            {step === totalSteps - 1 && (
              <button
                onClick={handleComplete}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                style={{ padding: '18px 32px', fontSize: '18px' }}
              >
                <span>ابدأ الآن</span>
                <ArrowLeftIcon />
              </button>
            )}
          </div>

          {/* Login Link */}
          {step === 0 && (
            <div 
              className="text-center text-gray-400"
              style={{ marginTop: '32px' }}
            >
              لديك حساب بالفعل؟{' '}
              <Link href="/auth">
                <span className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer font-medium">
                  تسجيل الدخول
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumRegister;
