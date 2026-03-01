import React, { useState } from 'react';
import { Mail, Lock, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { GlowInput } from './GlowInput';
import { GlowButton } from './GlowButton';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  onLogin: (data: { identifier: string; password: string }) => Promise<void>;
  onForgotPassword: () => void;
  isLoading?: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onForgotPassword,
  isLoading = false,
  error,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!identifier) {
      errors.identifier = loginMethod === 'email' 
        ? 'البريد الإلكتروني مطلوب' 
        : 'رقم الهاتف مطلوب';
    } else if (loginMethod === 'email' && !validateEmail(identifier)) {
      errors.identifier = 'البريد الإلكتروني غير صالح';
    } else if (loginMethod === 'phone' && !validatePhone(identifier)) {
      errors.identifier = 'رقم الهاتف غير صالح';
    }

    if (!password) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      await onLogin({ identifier, password });
      setShowSuccess(true);
    } catch {
      // Error handled by parent
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Login Method Toggle */}
      <div className="flex bg-black/30 rounded-xl p-1 mb-6">
        <button
          type="button"
          onClick={() => {
            setLoginMethod('email');
            setIdentifier('');
            setValidationErrors({});
          }}
          className={cn(
            'flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300',
            loginMethod === 'email'
              ? 'bg-gradient-to-r from-[#4B00FF] to-[#FF00FF] text-white shadow-lg'
              : 'text-white/60 hover:text-white'
          )}
        >
          <Mail className="w-4 h-4 inline-block mr-2" />
          البريد الإلكتروني
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMethod('phone');
            setIdentifier('');
            setValidationErrors({});
          }}
          className={cn(
            'flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300',
            loginMethod === 'phone'
              ? 'bg-gradient-to-r from-[#4B00FF] to-[#FF00FF] text-white shadow-lg'
              : 'text-white/60 hover:text-white'
          )}
        >
          <Phone className="w-4 h-4 inline-block mr-2" />
          رقم الهاتف
        </button>
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
          <span>تم تسجيل الدخول بنجاح!</span>
        </div>
      )}

      {/* Identifier Input */}
      <GlowInput
        icon={loginMethod === 'email' ? Mail : Phone}
        type={loginMethod === 'email' ? 'email' : 'tel'}
        placeholder={loginMethod === 'email' ? 'البريد الإلكتروني' : 'رقم الهاتف'}
        value={identifier}
        onChange={(e) => {
          setIdentifier(e.target.value);
          if (validationErrors.identifier) {
            setValidationErrors({ ...validationErrors, identifier: '' });
          }
        }}
        error={validationErrors.identifier}
        success={identifier.length > 0 && !validationErrors.identifier}
        dir={loginMethod === 'phone' ? 'ltr' : 'rtl'}
      />

      {/* Password Input */}
      <GlowInput
        icon={Lock}
        type="password"
        placeholder="كلمة المرور"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (validationErrors.password) {
            setValidationErrors({ ...validationErrors, password: '' });
          }
        }}
        error={validationErrors.password}
        success={password.length >= 6}
        showPasswordToggle
      />

      {/* Forgot Password Link */}
      <div className="text-left">
        <button
          type="button"
          onClick={onForgotPassword}
          className="auth-link text-sm"
        >
          هل نسيت كلمة المرور؟
        </button>
      </div>

      {/* Submit Button */}
      <GlowButton
        type="submit"
        loading={isLoading}
        disabled={!identifier || !password}
      >
        تسجيل الدخول
      </GlowButton>

      {/* Divider */}
      <div className="auth-divider">
        <span>أو</span>
      </div>

      {/* Social Login Buttons */}
      <div className="social-buttons">
        <button type="button" className="social-button google" disabled>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
        <button type="button" className="social-button facebook" disabled>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>
      </div>

      <p className="text-center text-xs text-white/40 mt-4">
        قريباً: تسجيل الدخول عبر Google و Facebook
      </p>
    </form>
  );
};

export default LoginForm;
