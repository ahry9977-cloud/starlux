import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  ParticleBackground, 
  LoginForm, 
  SignupForm, 
  ForgotPasswordForm 
} from '@/components/auth';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { ArrowLeft, Shield, Zap, Star } from 'lucide-react';
import './auth-page.css';

type AuthView = 'login' | 'signup' | 'forgot-password';

export const AuthPage: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [error, setError] = useState<string>('');
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const authLoading = !isAuthenticated && !user;

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      // Redirect based on role
      if (user.role === 'admin') {
        setLocation('/admin');
      } else {
        setLocation('/');
      }
    }
  }, [user, authLoading, setLocation]);

  // Login is handled via OAuth

  // Signup mutation - using requestRegistrationOTP
  const signupMutation = trpc.auth.requestRegistrationOTP.useMutation({
    onSuccess: () => {
      setError('');
      // OTP sent, user needs to verify
    },
    onError: (err: { message?: string }) => {
      setError(err.message || 'فشل إنشاء الحساب');
    },
  });

  // OTP mutations - using resendOTP for password reset
  const sendOTPMutation = trpc.auth.resendOTP.useMutation({
    onError: (err) => {
      setError(err.message || 'فشل إرسال رمز التحقق');
    },
  });

  // Verify OTP for password reset
  const verifyOTPMutation = trpc.auth.verifyPasswordResetOtp.useMutation({
    onError: (err: { message?: string }) => {
      setError(err.message || 'رمز التحقق غير صحيح');
    },
  });

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setError('');
      setView('login');
    },
    onError: (err) => {
      setError(err.message || 'فشل تغيير كلمة المرور');
    },
  });

  const handleLogin = async (data: { identifier: string; password: string }) => {
    setError('');
    // Use OAuth login flow
    window.location.href = '/api/oauth/login?provider=google';
  };

  const handleSignup = async (data: {
    email: string;
    password: string;
    accountType: 'user' | 'seller';
    sellerData?: {
      storeName: string;
      category: string;
      plan: string;
    };
  }) => {
    setError('');
    if (signupMutation) {
      await signupMutation.mutateAsync(data);
    } else {
      // Fallback: redirect to OAuth
      window.location.href = '/api/oauth/login?provider=google';
    }
  };

  const handleSendOTP = async (identifier: string, method: 'email' | 'phone' | 'whatsapp') => {
    setError('');
    const channel = method === 'whatsapp' ? 'whatsapp' : 'email';
    await sendOTPMutation.mutateAsync({ 
      identifier, 
      purpose: 'password_reset',
      channel 
    });
  };

  const handleVerifyOTP = async (otp: string): Promise<boolean> => {
    setError('');
    try {
      const result = await verifyOTPMutation.mutateAsync({ 
        email: '', // Will be set from state
        otp 
      });
      return result?.success ?? false;
    } catch {
      return false;
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    setError('');
    // Password reset will be handled via OTP flow
    setView('login');
  };

  const isLoading = signupMutation?.isPending || 
                    sendOTPMutation.isPending || verifyOTPMutation.isPending || 
                    resetPasswordMutation.isPending;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#4B00FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="auth-page min-h-screen relative overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding (Desktop only) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12">
          <div className="max-w-md text-center">
            {/* Logo */}
            <div className="mb-8">
              <h1 className="text-6xl font-black bg-gradient-to-r from-[#4B00FF] via-[#FF00FF] to-[#00ffff] bg-clip-text text-transparent animate-pulse">
                STAR LUX
              </h1>
              <p className="text-white/60 mt-2 text-lg">منصة التجارة الإلكترونية المتطورة</p>
            </div>

            {/* Features */}
            <div className="space-y-6 text-right">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:border-[#4B00FF]/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#4B00FF] to-[#FF00FF] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">أمان متقدم</h3>
                  <p className="text-white/50 text-sm">تشفير كامل وحماية من الاختراق</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:border-[#FF00FF]/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#00ffff] flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">سرعة فائقة</h3>
                  <p className="text-white/50 text-sm">تجربة سلسة بدون تأخير</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:border-[#00ffff]/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#00ffff] to-[#4B00FF] flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">تجربة مميزة</h3>
                  <p className="text-white/50 text-sm">واجهة حديثة وسهلة الاستخدام</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            {/* Back to Home */}
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للرئيسية
            </button>

            {/* Auth Card */}
            <div className="auth-card">
              {/* Mobile Logo */}
              <div className="lg:hidden auth-logo mb-6">
                <h1>STAR LUX</h1>
              </div>

              {/* View: Login or Signup */}
              {view !== 'forgot-password' && (
                <>
                  {/* Tabs */}
                  <div className="auth-tabs mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setView('login');
                        setError('');
                      }}
                      className={cn('auth-tab', view === 'login' && 'active')}
                    >
                      تسجيل الدخول
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocation('/register-new')}
                      className="auth-tab"
                    >
                      إنشاء حساب
                    </button>
                  </div>

                  {/* Forms */}
                  {view === 'login' && (
                    <LoginForm
                      onLogin={handleLogin}
                      onForgotPassword={() => {
                        setView('forgot-password');
                        setError('');
                      }}
                      isLoading={isLoading}
                      error={error}
                    />
                  )}

                  {view === 'signup' && (
                    <SignupForm
                      onSignup={handleSignup}
                      isLoading={isLoading}
                      error={error}
                    />
                  )}
                </>
              )}

              {/* View: Forgot Password */}
              {view === 'forgot-password' && (
                <ForgotPasswordForm
                  onSendOTP={handleSendOTP}
                  onVerifyOTP={handleVerifyOTP}
                  onResetPassword={handleResetPassword}
                  onBack={() => {
                    setView('login');
                    setError('');
                  }}
                  isLoading={isLoading}
                  error={error}
                />
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-white/40 text-xs mt-6">
              بالتسجيل، أنت توافق على{' '}
              <a href="/terms" className="auth-link">شروط الاستخدام</a>
              {' '}و{' '}
              <a href="/privacy" className="auth-link">سياسة الخصوصية</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
