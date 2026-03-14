import React, { useState, useEffect } from 'react';
import { Mail, Phone, Lock, ArrowLeft, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { GlowInput } from '../../GlowInput';
import { GlowButton } from '../../GlowButton';
import { PasswordStrength } from '../../PasswordStrength';
import { cn } from '@/lib/utils';

interface ForgotPasswordFormProps {
  onSendOTP: (identifier: string, method: 'email' | 'phone' | 'whatsapp') => Promise<void>;
  onVerifyOTP: (otp: string) => Promise<boolean>;
  onResetPassword: (newPassword: string) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSendOTP,
  onVerifyOTP,
  onResetPassword,
  onBack,
  isLoading = false,
  error,
}) => {
  const [step, setStep] = useState<'identifier' | 'otp' | 'newPassword'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [method, setMethod] = useState<'email' | 'phone' | 'whatsapp'>('email');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // OTP countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[\d\s\-+()]{10,}$/.test(phone);

  const handleSendOTP = async () => {
    const errors: Record<string, string> = {};

    if (!identifier) {
      errors.identifier = method === 'email' ? 'البريد الإلكتروني مطلوب' : 'رقم الهاتف مطلوب';
    } else if (method === 'email' && !validateEmail(identifier)) {
      errors.identifier = 'البريد الإلكتروني غير صالح';
    } else if ((method === 'phone' || method === 'whatsapp') && !validatePhone(identifier)) {
      errors.identifier = 'رقم الهاتف غير صالح';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await onSendOTP(identifier, method);
      setStep('otp');
      setCountdown(60);
    } catch {
      // Error handled by parent
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setValidationErrors({ otp: 'الرجاء إدخال رمز التحقق كاملاً' });
      return;
    }

    try {
      const isValid = await onVerifyOTP(otpString);
      if (isValid) {
        setStep('newPassword');
      }
    } catch {
      // Error handled by parent
    }
  };

  const handleResetPassword = async () => {
    const errors: Record<string, string> = {};

    if (!newPassword) {
      errors.newPassword = 'كلمة المرور الجديدة مطلوبة';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await onResetPassword(newPassword);
      setShowSuccess(true);
    } catch {
      // Error handled by parent
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        العودة لتسجيل الدخول
      </button>

      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {step === 'identifier' && 'استعادة كلمة المرور'}
          {step === 'otp' && 'التحقق من الهوية'}
          {step === 'newPassword' && 'كلمة مرور جديدة'}
        </h2>
        <p className="text-white/60 text-sm">
          {step === 'identifier' && 'أدخل بريدك الإلكتروني أو رقم هاتفك'}
          {step === 'otp' && `تم إرسال رمز التحقق إلى ${identifier}`}
          {step === 'newPassword' && 'أدخل كلمة المرور الجديدة'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="success-message">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>تم تغيير كلمة المرور بنجاح!</span>
        </div>
      )}

      {/* Step 1: Identifier */}
      {step === 'identifier' && (
        <div className="space-y-4 animate-[cardAppear_0.4s_ease]">
          {/* Method Selection */}
          <div className="flex bg-black/30 rounded-xl p-1">
            {[
              { id: 'email', label: 'بريد إلكتروني', icon: Mail },
              { id: 'phone', label: 'SMS', icon: Phone },
              { id: 'whatsapp', label: 'واتساب', icon: Phone },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMethod(m.id as 'email' | 'phone' | 'whatsapp');
                  setIdentifier('');
                  setValidationErrors({});
                }}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-300',
                  method === m.id
                    ? 'bg-gradient-to-r from-[#4B00FF] to-[#FF00FF] text-white shadow-lg'
                    : 'text-white/60 hover:text-white'
                )}
              >
                <m.icon className="w-3 h-3 inline-block mr-1" />
                {m.label}
              </button>
            ))}
          </div>

          <GlowInput
            icon={method === 'email' ? Mail : Phone}
            type={method === 'email' ? 'email' : 'tel'}
            placeholder={method === 'email' ? 'البريد الإلكتروني' : 'رقم الهاتف'}
            value={identifier}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setIdentifier(e.target.value);
              if (validationErrors.identifier) {
                setValidationErrors({ ...validationErrors, identifier: '' });
              }
            }}
            error={validationErrors.identifier}
            dir={method !== 'email' ? 'ltr' : 'rtl'}
          />

          <GlowButton
            type="button"
            onClick={handleSendOTP}
            loading={isLoading}
            disabled={!identifier}
          >
            إرسال رمز التحقق
          </GlowButton>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {step === 'otp' && (
        <div className="space-y-6 animate-[cardAppear_0.4s_ease]">
          {/* OTP Input */}
          <div className="flex justify-center gap-2" dir="ltr">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleOTPKeyDown(index, e)}
                className={cn(
                  'w-12 h-14 text-center text-2xl font-bold rounded-xl',
                  'bg-black/30 border-2 border-[#4B00FF]/30 text-white',
                  'focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)]',
                  'transition-all duration-300 outline-none',
                  digit && 'border-cyan-400'
                )}
              />
            ))}
          </div>
          {validationErrors.otp && (
            <p className="text-center text-sm text-red-400">{validationErrors.otp}</p>
          )}

          {/* Resend OTP */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-white/60 text-sm">
                إعادة الإرسال بعد {countdown} ثانية
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  handleSendOTP();
                  setCountdown(60);
                }}
                className="auth-link text-sm flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة إرسال الرمز
              </button>
            )}
          </div>

          <GlowButton
            type="button"
            onClick={handleVerifyOTP}
            loading={isLoading}
            disabled={otp.join('').length !== 6}
          >
            تحقق
          </GlowButton>
        </div>
      )}

      {/* Step 3: New Password */}
      {step === 'newPassword' && (
        <div className="space-y-4 animate-[cardAppear_0.4s_ease]">
          <div>
            <GlowInput
              icon={Lock}
              type="password"
              placeholder="كلمة المرور الجديدة"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setNewPassword(e.target.value);
                if (validationErrors.newPassword) {
                  setValidationErrors({ ...validationErrors, newPassword: '' });
                }
              }}
              error={validationErrors.newPassword}
              showPasswordToggle
            />
            <PasswordStrength password={newPassword} />
          </div>

          <GlowInput
            icon={Lock}
            type="password"
            placeholder="تأكيد كلمة المرور الجديدة"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setConfirmPassword(e.target.value);
              if (validationErrors.confirmPassword) {
                setValidationErrors({ ...validationErrors, confirmPassword: '' });
              }
            }}
            error={validationErrors.confirmPassword}
            success={confirmPassword.length > 0 && newPassword === confirmPassword}
            showPasswordToggle
          />

          <GlowButton
            type="button"
            onClick={handleResetPassword}
            loading={isLoading}
            disabled={!newPassword || !confirmPassword}
          >
            تغيير كلمة المرور
          </GlowButton>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
