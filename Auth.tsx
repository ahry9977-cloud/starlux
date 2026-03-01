import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, ArrowRight, Sparkles, Star } from 'lucide-react';
import { useSafeNavigate } from '@/_core/hooks/useSafeNavigate';

export default function Auth() {
  const safeNavigate = useSafeNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [resetId, setResetId] = useState<number | null>(null);

  // منع التنقل المزدوج
  const navigationPendingRef = useRef(false);



  // Mutations
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation();
  const verifyOtpMutation = trpc.auth.verifyPasswordResetOtp.useMutation();
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  // Validate email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate password strength
  const isStrongPassword = (password: string) => {
    return password.length >= 8;
  };

  // Handle login - مع ضمان التوجيه الصحيح
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // منع الإرسال المتكرر
    if (navigationPendingRef.current || isLoading) {
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Step 1: التحقق من الحقول
      if (!isValidEmail(loginEmail)) {
        throw new Error('البريد الإلكتروني غير صحيح');
      }
      if (!isStrongPassword(loginPassword)) {
        throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      }

      // Step 2: إرسال طلب تسجيل الدخول - الخادم سينشئ Session Cookie
      const result = await loginMutation.mutateAsync({
        email: loginEmail,
        password: loginPassword,
      });

      // Step 3: التحقق من نجاح تسجيل الدخول
      if (!result.success) {
        throw new Error(result.message || 'فشل تسجيل الدخول');
      }

      // Step 4: تعيين حالة التنقل
      navigationPendingRef.current = true;
      setSuccess('تم تسجيل الدخول بنجاح! جاري التحويل...');

      // Step 5: تحديد مسار التوجيه حسب الدور - من قاعدة البيانات
      const userRole = result.role;
      let redirectPath = '/dashboard';
      
      if (userRole === 'admin' || userRole === 'sub_admin') {
        redirectPath = '/admin-dashboard';
      } else if (userRole === 'seller') {
        redirectPath = '/seller-dashboard';
      }
      
      console.log('[Auth] Login successful, redirecting to:', redirectPath, 'Role:', userRole);
      
      // Step 6: التوجيه الفوري - بدون تأخير
      window.location.href = redirectPath;
      
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      navigationPendingRef.current = false;
      setError(err.message || 'فشل تسجيل الدخول');
      setIsLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (navigationPendingRef.current) {
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!isValidEmail(registerEmail)) {
        throw new Error('البريد الإلكتروني غير صحيح');
      }
      if (!isStrongPassword(registerPassword)) {
        throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      }
      if (registerName.length < 2) {
        throw new Error('الاسم يجب أن يكون حرفين على الأقل');
      }

      await registerMutation.mutateAsync({
        email: registerEmail,
        password: registerPassword,
        name: registerName,
      });

      setSuccess('تم إنشاء الحساب بنجاح. يرجى تسجيل الدخول');
      navigationPendingRef.current = true;

      setTimeout(() => {
        setMode('login');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterName('');
        navigationPendingRef.current = false;
      }, 500);
    } catch (err: any) {
      navigationPendingRef.current = false;
      setError(err.message || 'فشل إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password - request OTP
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!isValidEmail(forgotEmail)) {
        throw new Error('البريد الإلكتروني غير صحيح');
      }
      if (!forgotPhone) {
        throw new Error('رقم الهاتف مطلوب');
      }

      await requestResetMutation.mutateAsync({
        email: forgotEmail,
        phoneNumber: forgotPhone,
      });

      setSuccess('تم إرسال رمز التحقق إلى هاتفك');
      setForgotStep('otp');
    } catch (err: any) {
      setError(err.message || 'فشل طلب استعادة كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (forgotOtp.length !== 6) {
        throw new Error('رمز التحقق يجب أن يكون 6 أرقام');
      }

      const result = await verifyOtpMutation.mutateAsync({
        email: forgotEmail,
        otp: forgotOtp,
      });

      setResetId(result.resetId);
      setSuccess('تم التحقق من الرمز بنجاح');
      setForgotStep('reset');
    } catch (err: any) {
      setError(err.message || 'فشل التحقق من الرمز');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!isStrongPassword(forgotNewPassword)) {
        throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      }
      if (!resetId) {
        throw new Error('معرف إعادة التعيين غير صحيح');
      }

      await resetPasswordMutation.mutateAsync({
        email: forgotEmail,
        resetId,
        newPassword: forgotNewPassword,
      });

      setSuccess('تم تغيير كلمة المرور بنجاح');
      navigationPendingRef.current = true;

      setTimeout(() => {
        setMode('login');
        setForgotEmail('');
        setForgotPhone('');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotStep('email');
        setResetId(null);
        navigationPendingRef.current = false;
      }, 500);
    } catch (err: any) {
      navigationPendingRef.current = false;
      setError(err.message || 'فشل تغيير كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen relative overflow-hidden" dir="rtl">
        {/* خلفية متدرجة دافئة */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900" />
      
        {/* دوائر زخرفية متحركة */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-30%] left-[-15%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-yellow-500/25 to-amber-600/15 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[10%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-orange-400/20 to-yellow-500/10 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* نجوم متلألئة */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <Star
            key={i}
            className="absolute text-amber-300/30 animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 20 + 10}px`,
              height: `${Math.random() * 20 + 10}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`,
            }}
          />
        ))}
        </div>

        {/* المحتوى الرئيسي */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* بطاقة تسجيل الدخول مع تأثير الزجاج */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            {/* رأس البطاقة */}
            <div className="p-8 text-center border-b border-white/10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg shadow-orange-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                STAR <span className="text-amber-400">LUX</span>
              </h1>
              <p className="text-amber-200/70 text-sm">منصة التجارة الإلكترونية العالمية</p>
            </div>

            {/* محتوى النموذج */}
            <div className="p-8">
              {/* Login Mode */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-amber-100">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/60" />
                      <Input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pr-12 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-amber-200/40 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-amber-100">كلمة المرور</label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/60" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-12 pl-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-amber-200/40 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400/60 hover:text-amber-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                      <p className="text-red-300 text-sm text-center">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
                      <p className="text-green-300 text-sm text-center">{success}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        تسجيل الدخول
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm text-amber-300/70 hover:text-amber-200 transition-colors"
                    >
                      هل نسيت كلمة المرور؟
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-sm text-amber-300 hover:text-amber-200 font-medium transition-colors"
                    >
                      إنشاء حساب جديد
                    </button>
                  </div>
                </form>
              )}

              {/* Register Mode */}
              {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-amber-100">الاسم الكامل</label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/60" />
                      <Input
                        type="text"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="أدخل اسمك"
                        className="w-full pr-12 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-amber-200/40 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-amber-100">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/60" />
                      <Input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="your@email.com"
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)