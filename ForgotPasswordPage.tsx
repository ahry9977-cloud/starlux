/**
 * صفحة نسيت كلمة المرور المتقدمة
 * STAR LUX - منصة التجارة الإلكترونية
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Loader2,
  Sparkles,
  Clock
} from 'lucide-react';

type Step = 'email' | 'otp' | 'password' | 'success';

// Floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <div
        key={i}
        className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-20"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 5}s`,
        }}
      />
    ))}
  </div>
);

// Password strength indicator
const PasswordStrength = ({ password }: { password: string }) => {
  const getStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getStrength();
  const labels = ["ضعيفة جداً", "ضعيفة", "متوسطة", "قوية", "قوية جداً"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];

  if (!password) return null;

  return (
    <div className="space-y-2 animate-fadeIn">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i < strength ? colors[strength - 1] : "bg-slate-700"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs transition-colors duration-300 ${
        strength <= 2 ? "text-red-400" : strength <= 3 ? "text-yellow-400" : "text-green-400"
      }`}>
        قوة كلمة المرور: {labels[strength - 1] || ""}
      </p>
    </div>
  );
};

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);
  
  // الحالة الرئيسية
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // بيانات الجلسة
  const [resetToken, setResetToken] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // حالة التحميل والأخطاء
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // tRPC mutations
  const requestReset = trpc.auth.requestPasswordReset.useMutation();
  const verifyOtp = trpc.auth.verifyPasswordResetOtp.useMutation();
  const resetPassword = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time validation
  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('البريد الإلكتروني غير صالح');
    } else {
      setEmailError('');
    }
  }, [email]);

  useEffect(() => {
    if (newPassword && newPassword.length < 8) {
      setPasswordError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    } else {
      setPasswordError('');
    }
  }, [newPassword]);

  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setConfirmPasswordError('كلمتا المرور غير متطابقتين');
    } else {
      setConfirmPasswordError('');
    }
  }, [newPassword, confirmPassword]);
  
  // عداد الوقت المتبقي
  useEffect(() => {
    if (!expiresAt) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
        setError('انتهت صلاحية الرمز. يرجى طلب رمز جديد.');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  // تنسيق الوقت المتبقي
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // الخطوة 1: طلب رمز التحقق
  const handleRequestReset = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!email.trim() || emailError) {
      setEmailError('يرجى إدخال بريد إلكتروني صالح');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await requestReset.mutateAsync({ email: email.trim() });
      
      if (result.success) {
        setSuccessMessage(result.message);
        if (result.expiresAt) {
          setExpiresAt(new Date(result.expiresAt));
        }
        setStep('otp');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, emailError, requestReset]);

  // OTP input handling
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };
  
  // الخطوة 2: التحقق من OTP
  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await verifyOtp.mutateAsync({ email, otp });
      
      if (result.success) {
        setResetToken(result.resetToken || '');
        setUserId(result.userId || null);
        setSuccessMessage(result.message);
        setStep('password');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, otpDigits, verifyOtp]);
  
  // الخطوة 3: إعادة تعيين كلمة المرور
  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (newPassword.length < 8 || passwordError) {
      setPasswordError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }
    
    if (!userId) {
      setError('خطأ في الجلسة. يرجى إعادة المحاولة');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await resetPassword.mutateAsync({
        userId,
        resetToken,
        newPassword
      });
      
      if (result.success) {
        setSuccessMessage(result.message);
        setStep('success');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId, resetToken, newPassword, confirmPassword, passwordError, resetPassword]);
  
  // إعادة إرسال الرمز
  const resendOtpMutation = trpc.auth.resendOTP.useMutation();
  
  const handleResendOtp = useCallback(async (channel?: 'email' | 'whatsapp') => {
    setError('');
    setOtpDigits(['', '', '', '', '', '']);
    
    setIsLoading(true);
    try {
      const result = await resendOtpMutation.mutateAsync({ 
        identifier: email,
        purpose: 'password_reset',
        channel: channel || 'email'
      });
      
      if (result.success) {
        setSuccessMessage(result.message || 'تم إرسال رمز جديد');
        if (result.expiresAt) {
          setExpiresAt(new Date(result.expiresAt));
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, resendOtpMutation]);
  
  // الرجوع للخطوة السابقة
  const handleBack = () => {
    setError('');
    setSuccessMessage('');
    if (step === 'otp') {
      setStep('email');
      setOtpDigits(['', '', '', '', '', '']);
    } else if (step === 'password') {
      setStep('otp');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // Step indicator
  const steps = ['email', 'otp', 'password'];
  const currentStepIndex = steps.indexOf(step);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/50 to-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      
      {/* Floating particles */}
      <FloatingParticles />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Main Card */}
      <div 
        className={`relative w-full max-w-md z-10 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
        }`}
      >
        {/* Animated glow border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-3xl blur-lg opacity-40 animate-gradient-xy" />
        
        {/* Glass card */}
        <div className="relative bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          
          {/* Back Button */}
          {step !== 'email' && step !== 'success' && (
            <button
              onClick={handleBack}
              className="absolute top-6 left-6 p-2.5 text-slate-400 hover:text-white transition-all duration-300 rounded-xl hover:bg-slate-800/50 group z-10"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            </button>
          )}

          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/30 rounded-xl blur-lg animate-pulse" />
                <div className="relative bg-gradient-to-br from-cyan-500 to-blue-500 p-3 rounded-xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                STAR LUX
              </h1>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {step === 'email' && 'نسيت كلمة المرور'}
              {step === 'otp' && 'التحقق من الرمز'}
              {step === 'password' && 'كلمة مرور جديدة'}
              {step === 'success' && 'تم بنجاح!'}
            </h2>
            <p className="text-slate-400 text-sm">
              {step === 'email' && 'أدخل بريدك الإلكتروني لإرسال رمز التحقق'}
              {step === 'otp' && 'أدخل الرمز المرسل إلى بريدك الإلكتروني'}
              {step === 'password' && 'أدخل كلمة المرور الجديدة'}
              {step === 'success' && 'تم تغيير كلمة المرور بنجاح'}
            </p>
          </div>

          {/* Step Indicator */}
          {step !== 'success' && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                    currentStepIndex >= i 
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white" 
                      : "bg-slate-800 text-slate-500"
                  }`}>
                    {currentStepIndex > i ? <CheckCircle className="w-5 h-5" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 transition-all duration-500 ${
                      currentStepIndex > i ? "bg-gradient-to-r from-cyan-500 to-blue-500" : "bg-slate-700"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {successMessage && step !== 'success' && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-400">{successMessage}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleRequestReset} className="space-y-6 animate-slideIn">
              <div className="space-y-2">
                <Label className={`text-sm font-medium transition-colors duration-300 ${
                  emailError ? "text-red-400" : "text-slate-300"
                }`}>
                  البريد الإلكتروني
                </Label>
                <div className="relative group">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-0 transition-opacity duration-300 group-focus-within:opacity-30`} />
                  <div className="relative">
                    <Mail className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                      emailError ? "text-red-400" : "text-slate-500 group-focus-within:text-cyan-400"
                    }`} />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="أدخل بريدك الإلكتروني"
                      disabled={isLoading}
                      dir="ltr"
                      className={`pr-11 h-12 bg-slate-800/60 backdrop-blur-sm border-2 text-white placeholder:text-slate-500 rounded-xl transition-all duration-300 ${
                        emailError 
                          ? "border-red-500 ring-2 ring-red-500/20" 
                          : "border-slate-700 hover:border-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                      }`}
                    />
                  </div>
                </div>
                {emailError && (
                  <div className="flex items-center gap-2 text-sm text-red-400 animate-fadeIn">
                    <AlertCircle className="w-4 h-4" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !!emailError}
                className="w-full h-14 relative overflow-hidden group bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:via-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري الإرسال...</span>
                  </div>
                ) : (
                  <span>إرسال رمز التحقق</span>
                )}
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-slideIn">
              {/* Timer */}
              {timeRemaining > 0 && (
                <div className="flex items-center justify-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-mono text-lg">{formatTime(timeRemaining)}</span>
                </div>
              )}

              <p className="text-slate-400 text-center text-sm">
                أدخل الرمز المرسل إلى<br />
                <span className="text-cyan-400 font-medium">{email}</span>
              </p>
              
              <div className="flex justify-center gap-2" dir="ltr">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    disabled={isLoading}
                    className={`w-12 h-14 text-center text-2xl font-bold bg-slate-800/60 border-2 rounded-xl text-white transition-all duration-300 focus:outline-none ${
                      digit 
                        ? "border-cyan-500 ring-2 ring-cyan-500/20" 
                        : "border-slate-700 focus:border-cyan-500"
                    }`}
                  />
                ))}
              </div>

              <Button
                type="submit"
                disabled={isLoading || otpDigits.join('').length !== 6}
                className="w-full h-14 relative overflow-hidden group bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:via-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري التحقق...</span>
                  </div>
                ) : (
                  <span>تأكيد الرمز</span>
                )}
              </Button>

              <button
                type="button"
                onClick={() => handleResendOtp()}
                disabled={isLoading || timeRemaining > 0}
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>إعادة إرسال الرمز</span>
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-slideIn">
              <div className="space-y-2">
                <Label className={`text-sm font-medium transition-colors duration-300 ${
                  passwordError ? "text-red-400" : "text-slate-300"
                }`}>
                  كلمة المرور الجديدة
                </Label>
                <div className="relative group">
                  <Lock className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    passwordError ? "text-red-400" : "text-slate-500 group-focus-within:text-cyan-400"
                  }`} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    disabled={isLoading}
                    dir="ltr"
                    className={`pr-11 pl-11 h-12 bg-slate-800/60 border-2 text-white placeholder:text-slate-500 rounded-xl transition-all duration-300 ${
                      passwordError 
                        ? "border-red-500 ring-2 ring-red-500/20" 
                        : "border-slate-700 hover:border-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && (
                  <div className="flex items-center gap-2 text-sm text-red-400 animate-fadeIn">
                    <AlertCircle className="w-4 h-4" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              {newPassword && <PasswordStrength password={newPassword} />}

              <div className="space-y-2">
                <Label className={`text-sm font-medium transition-colors duration-300 ${
                  confirmPasswordError ? "text-red-400" : "text-slate-300"
                }`}>
                  تأكيد كلمة المرور
                </Label>
                <div className="relative group">
                  <Lock className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    confirmPasswordError ? "text-red-400" : "text-slate-500 group-focus-within:text-cyan-400"
                  }`} />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    disabled={isLoading}
                    dir="ltr"
                    className={`pr-11 pl-11 h-12 bg-slate-800/60 border-2 text-white placeholder:text-slate-500 rounded-xl transition-all duration-300 ${
                      confirmPasswordError 
                        ? "border-red-500 ring-2 ring-red-500/20" 
                        : "border-slate-700 hover:border-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className="flex items-center gap-2 text-sm text-red-400 animate-fadeIn">
                    <AlertCircle className="w-4 h-4" />
                    <span>{confirmPasswordError}</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !!passwordError || !!confirmPasswordError || !newPassword || !confirmPassword}
                className="w-full h-14 relative overflow-hidden group bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:via-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </div>
                ) : (
                  <span>حفظ كلمة المرور الجديدة</span>
                )}
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center space-y-6 animate-scaleIn">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-2">تم تغيير كلمة المرور!</h3>
                <p className="text-slate-400 text-sm">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة</p>
              </div>

              <Button
                onClick={() => setLocation('/login')}
                className="w-full h-14 relative overflow-hidden group bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-500 hover:via-emerald-500 hover:to-green-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span>تسجيل الدخول</span>
              </Button>
            </div>
          )}

          {/* Login Link */}
          {step !== 'success' && (
            <div className="text-center mt-6 pt-6 border-t border-slate-800">
              <p className="text-slate-400">
                تذكرت كلمة المرور؟{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-300 hover:underline"
                >
                  تسجيل الدخول
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 0%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 8s ease infinite;
        }
        
        .animate-blob {
          animation: blob 10s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
