import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  ArrowLeft, ArrowRight, Check, Loader2, 
  Mail, Lock, User, Phone, Eye, EyeOff,
  Shield, AlertCircle
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { RoleSelector, type UserRole } from '@/components/auth/RoleSelector';
import { CategorySelector, type Category } from '@/components/auth/CategorySelector';
import { PlanSelector, type Plan } from '@/components/auth/PlanSelector';
import { ParticleBackground } from '@/components/auth/ParticleBackground';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { OTPInput, ResendTimer } from '@/components/auth/OTPInput';
import '@/components/auth/auth-animations.css';

type RegistrationStep = 'role' | 'category' | 'plan' | 'details' | 'verification' | 'complete';

interface RegistrationData {
  role: UserRole | null;
  category: Category | null;
  subcategories: string[];
  plan: Plan | null;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('role');
  const [data, setData] = useState<RegistrationData>({
    role: null,
    category: null,
    subcategories: [],
    plan: null,
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // tRPC mutations
  const registerMutation = trpc.auth.register.useMutation();
  const sendOtpMutation = trpc.auth.resendOTP.useMutation();
  const verifyOtpMutation = trpc.auth.verifyRegistrationOTP.useMutation();

  // Note: No automatic redirect - allow logged in users to view registration page

  // Step configuration
  const steps: { id: RegistrationStep; title: string; forRoles: UserRole[] }[] = [
    { id: 'role', title: 'نوع الحساب', forRoles: ['buyer', 'seller'] },
    { id: 'category', title: 'الفئة', forRoles: ['seller'] },
    { id: 'plan', title: 'الخطة', forRoles: ['seller'] },
    { id: 'details', title: 'البيانات', forRoles: ['buyer', 'seller'] },
    { id: 'verification', title: 'التحقق', forRoles: ['buyer', 'seller'] },
    { id: 'complete', title: 'اكتمال', forRoles: ['buyer', 'seller'] }
  ];

  const getVisibleSteps = useCallback(() => {
    if (!data.role) return steps.filter(s => s.id === 'role');
    return steps.filter(s => s.forRoles.includes(data.role!));
  }, [data.role]);

  const getCurrentStepIndex = useCallback(() => {
    return getVisibleSteps().findIndex(s => s.id === currentStep);
  }, [currentStep, getVisibleSteps]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'role':
        return !!data.role;
      case 'category':
        return !!data.category;
      case 'plan':
        return !!data.plan;
      case 'details':
        return (
          data.name.length >= 2 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
          data.password.length >= 8 &&
          data.password === data.confirmPassword
        );
      default:
        return true;
    }
  }, [currentStep, data]);

  const handleNext = useCallback(() => {
    const visibleSteps = getVisibleSteps();
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < visibleSteps.length - 1) {
      setCurrentStep(visibleSteps[currentIndex + 1].id);
    }
  }, [getCurrentStepIndex, getVisibleSteps]);

  const handleBack = useCallback(() => {
    const visibleSteps = getVisibleSteps();
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(visibleSteps[currentIndex - 1].id);
    }
  }, [getCurrentStepIndex, getVisibleSteps]);

  const handleRoleSelect = useCallback((role: UserRole) => {
    setData(prev => ({ ...prev, role }));
    // Auto-advance for buyer
    if (role === 'buyer') {
      setTimeout(() => setCurrentStep('details'), 300);
    }
  }, []);

  const handleCategorySelect = useCallback((category: Category, subcategories: string[]) => {
    setData(prev => ({ ...prev, category, subcategories }));
  }, []);

  const handlePlanSelect = useCallback((plan: Plan) => {
    setData(prev => ({ ...prev, plan }));
  }, []);

  const validateField = useCallback((field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (value.length < 2) {
          newErrors.name = 'الاسم يجب أن يكون حرفين على الأقل';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'البريد الإلكتروني غير صالح';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (value.length < 8) {
          newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
        } else {
          delete newErrors.password;
        }
        break;
      case 'confirmPassword':
        if (value !== data.password) {
          newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }
    
    setErrors(newErrors);
  }, [errors, data.password]);

  const handleInputChange = useCallback((field: keyof RegistrationData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  }, [validateField]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setErrors({});
    try {
      // إرسال OTP للبريد الإلكتروني
      await sendOtpMutation.mutateAsync({
        identifier: data.email,
        purpose: 'registration',
        channel: 'email'
      });
      setCurrentStep('verification');
    } catch (error: any) {
      setErrors({ submit: error.message || 'حدث خطأ أثناء إرسال رمز التحقق' });
    } finally {
      setIsSubmitting(false);
    }
  }, [data.email, sendOtpMutation]);

  const handleVerifyOTP = useCallback(async (otpValue: string) => {
    setVerifying(true);
    setOtpError('');
    try {
      // التحقق من OTP
      await verifyOtpMutation.mutateAsync({
        email: data.email,
        otp: otpValue
      });
      
      // إنشاء الحساب
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        name: data.name
      });
      
      // الانتقال لصفحة الترحيب
      navigate(`/welcome?type=${data.role}&name=${encodeURIComponent(data.name)}`);
    } catch (error: any) {
      setOtpError(error.message || 'رمز التحقق غير صحيح');
      setOtp('');
    } finally {
      setVerifying(false);
    }
  }, [data, verifyOtpMutation, registerMutation, navigate]);

  const handleResendOTP = useCallback(async () => {
    setResendLoading(true);
    setOtpError('');
    try {
      await sendOtpMutation.mutateAsync({
        identifier: data.email,
        purpose: 'registration',
        channel: 'email'
      });
    } catch (error: any) {
      setOtpError(error.message || 'فشل إعادة إرسال الرمز');
    } finally {
      setResendLoading(false);
    }
  }, [data.email, sendOtpMutation]);

  // Progress calculation
  const progress = ((getCurrentStepIndex() + 1) / getVisibleSteps().length) * 100;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      <ParticleBackground />
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.a
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
            STAR LUX
          </motion.a>
          
          <a href="/login" className="text-gray-400 hover:text-white transition-colors">
            لديك حساب؟ <span className="text-cyan-400">تسجيل الدخول</span>
          </a>
        </div>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 mb-8">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {getVisibleSteps().map((step, index) => (
            <div
              key={step.id}
              className={`text-xs ${
                index <= getCurrentStepIndex() ? 'text-cyan-400' : 'text-gray-600'
              }`}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <AnimatePresence mode="wait">
          {/* Step: Role Selection */}
          {currentStep === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <RoleSelector
                onRoleSelect={handleRoleSelect}
                selectedRole={data.role || undefined}
              />
            </motion.div>
          )}

          {/* Step: Category Selection (Seller only) */}
          {currentStep === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <CategorySelector
                onCategorySelect={handleCategorySelect}
                selectedCategory={data.category || undefined}
                selectedSubcategories={data.subcategories}
              />
            </motion.div>
          )}

          {/* Step: Plan Selection (Seller only) */}
          {currentStep === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <PlanSelector
                onPlanSelect={handlePlanSelect}
                selectedPlan={data.plan || undefined}
              />
            </motion.div>
          )}

          {/* Step: Details */}
          {currentStep === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-md mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">أدخل بياناتك</h2>
                <p className="text-gray-400">أكمل معلومات حسابك</p>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">الاسم الكامل</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full bg-gray-800/50 border ${errors.name ? 'border-red-500' : 'border-gray-700'} rounded-xl py-3 pr-10 pl-4 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors`}
                      placeholder="أحمد محمد"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full bg-gray-800/50 border ${errors.email ? 'border-red-500' : 'border-gray-700'} rounded-xl py-3 pr-10 pl-4 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors`}
                      placeholder="example@email.com"
                      dir="ltr"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">رقم الهاتف (اختياري)</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="tel"
                      value={data.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pr-10 pl-4 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
                      placeholder="+964 XXX XXX XXXX"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={data.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full bg-gray-800/50 border ${errors.password ? 'border-red-500' : 'border-gray-700'} rounded-xl py-3 pr-10 pl-10 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {data.password && <PasswordStrength password={data.password} />}
                </div>

(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)