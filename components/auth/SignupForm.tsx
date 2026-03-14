import React, { useState } from 'react';
import { Mail, Lock, User, AlertCircle, CheckCircle, Store, ShoppingBag } from 'lucide-react';
import { GlowInput } from '../../GlowInput';
import { GlowButton } from '../../GlowButton';
import { PasswordStrength } from '../../PasswordStrength';
import { cn } from '@/lib/utils';

type AccountType = 'user' | 'seller';

interface SignupFormProps {
  onSignup: (data: {
    email: string;
    password: string;
    accountType: AccountType;
    sellerData?: {
      storeName: string;
      category: string;
      plan: string;
    };
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

const PRODUCT_CATEGORIES = [
  { value: 'electronics', label: 'إلكترونيات' },
  { value: 'fashion', label: 'أزياء وملابس' },
  { value: 'home', label: 'منزل وحديقة' },
  { value: 'beauty', label: 'جمال وعناية' },
  { value: 'sports', label: 'رياضة ولياقة' },
  { value: 'food', label: 'طعام ومشروبات' },
  { value: 'books', label: 'كتب وتعليم' },
  { value: 'toys', label: 'ألعاب وترفيه' },
  { value: 'other', label: 'أخرى' },
];

const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'مجاني',
    price: '0',
    features: ['متجر واحد', '10 منتجات', 'دعم أساسي'],
    popular: false,
  },
  {
    id: 'pro',
    name: 'برو',
    price: '29',
    features: ['متجر واحد', '100 منتج', 'دعم متقدم', 'تحليلات'],
    popular: true,
  },
  {
    id: 'community',
    name: 'كميونتي',
    price: '99',
    features: ['متجر واحد', 'منتجات غير محدودة', 'دعم VIP', 'تحليلات متقدمة'],
    popular: false,
  },
];

export const SignupForm: React.FC<SignupFormProps> = ({
  onSignup,
  isLoading = false,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!validateEmail(email)) {
      errors.email = 'البريد الإلكتروني غير صالح';
    }

    if (!password) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 8) {
      errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    if (accountType === 'user') return true;

    const errors: Record<string, string> = {};

    if (!storeName) {
      errors.storeName = 'اسم المتجر مطلوب';
    } else if (storeName.length < 3) {
      errors.storeName = 'اسم المتجر يجب أن يكون 3 أحرف على الأقل';
    }

    if (!category) {
      errors.category = 'فئة المنتجات مطلوبة';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      handleNextStep();
      return;
    }

    if (!validateStep2()) return;

    try {
      await onSignup({
        email,
        password,
        accountType,
        sellerData: accountType === 'seller' ? {
          storeName,
          category,
          plan: selectedPlan,
        } : undefined,
      });
      setShowSuccess(true);
    } catch {
      // Error handled by parent
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
          step >= 1 ? 'bg-gradient-to-r from-[#4B00FF] to-[#FF00FF] text-white' : 'bg-white/10 text-white/40'
        )}>
          1
        </div>
        <div className={cn(
          'w-16 h-1 rounded-full transition-all duration-500',
          step >= 2 ? 'bg-gradient-to-r from-[#4B00FF] to-[#FF00FF]' : 'bg-white/10'
        )} />
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
          step >= 2 ? 'bg-gradient-to-r from-[#4B00FF] to-[#FF00FF] text-white' : 'bg-white/10 text-white/40'
        )}>
          2
        </div>
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
          <span>تم إنشاء الحساب بنجاح!</span>
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-4 animate-[cardAppear_0.4s_ease]">
          <GlowInput
            icon={Mail}
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationErrors.email) {
                setValidationErrors({ ...validationErrors, email: '' });
              }
            }}
            error={validationErrors.email}
            success={email.length > 0 && validateEmail(email)}
          />

          <div>
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
              showPasswordToggle
            />
            <PasswordStrength password={password} />
          </div>

          <GlowInput
            icon={Lock}
            type="password"
            placeholder="تأكيد كلمة المرور"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (validationErrors.confirmPassword) {
                setValidationErrors({ ...validationErrors, confirmPassword: '' });
              }
            }}
            error={validationErrors.confirmPassword}
            success={confirmPassword.length > 0 && password === confirmPassword}
            showPasswordToggle
          />

          <GlowButton
            type="button"
            onClick={handleNextStep}
            disabled={!email || !password || !confirmPassword}
          >
            التالي
          </GlowButton>
        </div>
      )}

      {/* Step 2: Account Type & Details */}
      {step === 2 && (
        <div className="space-y-6 animate-[cardAppear_0.4s_ease]">
          {/* Account Type Selection */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">
              نوع الحساب
            </label>
            <div className="account-type-selector">
              <div
                onClick={() => setAccountType('user')}
                className={cn('account-type-card', accountType === 'user' && 'selected')}
              >
                <div className="icon">
                  <ShoppingBag className="w-12 h-12 mx-auto text-cyan-400" />
                </div>
                <div className="title">مستخدم</div>
                <div className="description">تسوق واشترِ المنتجات</div>
              </div>
              <div
                onClick={() => setAccountType('seller')}
                className={cn('account-type-card', accountType === 'seller' && 'selected')}
              >
                <div className="icon">
                  <Store className="w-12 h-12 mx-auto text-purple-400" />
                </div>
                <div className="title">بائع</div>
                <div className="description">أنشئ متجرك وابدأ البيع</div>
              </div>
            </div>
          </div>

          {/* Seller Details */}
          {accountType === 'seller' && (
            <div className="space-y-4 animate-[cardAppear_0.3s_ease]">
              <GlowInput
                icon={Store}
                type="text"
                placeholder="اسم المتجر"
                value={storeName}
                onChange={(e) => {
                  setStoreName(e.target.value);
                  if (validationErrors.storeName) {
                    setValidationErrors({ ...validationErrors, storeName: '' });
                  }
                }}
                error={validationErrors.storeName}
                success={storeName.length >= 3}
              />

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  فئة المنتجات
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (validationErrors.category) {
                      setValidationErrors({ ...validationErrors, category: '' });
                    }
                  }}
                  className={cn(
                    'glow-input w-full pl-5',
                    validationErrors.category && 'invalid',
                    category && 'valid'
                  )}
                >
                  <option value="">اختر فئة المنتجات</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {validationErrors.category && (
                  <p className="mt-2 text-sm text-red-400">{validationErrors.category}</p>
                )}
              </div>

              {/* Subscription Plans */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  خطة الاشتراك
                </label>
                <div className="subscription-plans">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={cn('plan-card', selectedPlan === plan.id && 'selected', plan.popular && 'popular')}
                    >
                      <div className="plan-name">{plan.name}</div>
                      <div className="plan-price">
                        ${plan.price}
                        <span className="text-sm text-white/50">/شهر</span>
                      </div>
                      <div className="plan-features">
                        {plan.features.map((feature, i) => (
                          <div key={i}>✓ {feature}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPlan !== 'free' && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 inline-block mr-2" />
                  سيتم توجيهك لصفحة الدفع بعد إنشاء الحساب
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <GlowButton
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              رجوع
            </GlowButton>
            <GlowButton
              type="submit"
              loading={isLoading}
              disabled={accountType === 'seller' && (!storeName || !category)}
              className="flex-1"
            >
              {accountType === 'seller' && selectedPlan !== 'free' ? 'متابعة للدفع' : 'إنشاء الحساب'}
            </GlowButton>
          </div>
        </div>
      )}
    </form>
  );
};

export default SignupForm;
