import React, { useState, useCallback, memo, useMemo } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

// Critical CSS Inline - تحميل فوري
const criticalStyles = `
  .reg-instant-bg {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%);
    min-height: 100vh;
  }
  .reg-instant-card {
    background: rgba(20, 20, 30, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(75, 0, 255, 0.2);
    border-radius: 24px;
    padding: 2rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  .reg-instant-input {
    width: 100%;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: white;
    font-size: 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .reg-instant-input:focus {
    border-color: #4B00FF;
    box-shadow: 0 0 0 3px rgba(75, 0, 255, 0.2);
  }
  .reg-instant-input.error {
    border-color: #ef4444;
  }
  .reg-instant-btn {
    width: 100%;
    padding: 14px 24px;
    background: linear-gradient(135deg, #4B00FF 0%, #FF00FF 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .reg-instant-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(75, 0, 255, 0.4);
  }
  .reg-instant-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  .reg-instant-btn-secondary {
    background: rgba(255, 255, 255, 0.1);
  }
  .reg-instant-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .reg-instant-progress {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }
  .reg-instant-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #4B00FF, #FF00FF);
    transition: width 0.3s ease;
  }
  .reg-instant-role-card {
    padding: 24px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }
  .reg-instant-role-card:hover {
    border-color: rgba(75, 0, 255, 0.5);
    background: rgba(75, 0, 255, 0.1);
  }
  .reg-instant-role-card.selected {
    border-color: #4B00FF;
    background: rgba(75, 0, 255, 0.2);
  }
  .reg-instant-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
  }
  .reg-instant-success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #4ade80;
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
  }
  .reg-instant-otp-input {
    width: 48px;
    height: 56px;
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: white;
    outline: none;
    transition: border-color 0.2s;
  }
  .reg-instant-otp-input:focus {
    border-color: #4B00FF;
  }
  .reg-instant-category-card {
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .reg-instant-category-card:hover {
    border-color: rgba(75, 0, 255, 0.5);
  }
  .reg-instant-category-card.selected {
    border-color: #4B00FF;
    background: rgba(75, 0, 255, 0.15);
  }
  .reg-instant-plan-card {
    padding: 24px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .reg-instant-plan-card:hover {
    border-color: rgba(75, 0, 255, 0.5);
  }
  .reg-instant-plan-card.selected {
    border-color: #4B00FF;
    background: rgba(75, 0, 255, 0.15);
  }
  .reg-instant-plan-card.popular::before {
    content: 'الأكثر شعبية';
    position: absolute;
    top: 12px;
    left: -30px;
    background: linear-gradient(90deg, #4B00FF, #FF00FF);
    color: white;
    font-size: 10px;
    padding: 4px 40px;
    transform: rotate(-45deg);
  }
  .reg-instant-password-strength {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 8px;
  }
  .reg-instant-password-bar {
    height: 100%;
    transition: width 0.3s, background 0.3s;
  }
  .reg-instant-link {
    color: #4B00FF;
    text-decoration: none;
    transition: color 0.2s;
  }
  .reg-instant-link:hover {
    color: #FF00FF;
  }
`;

// أيقونات SVG inline
const Icons = {
  ArrowLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  User: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Store: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Mail: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Eye: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Check: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Phone: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
};

type Step = 'role' | 'category' | 'plan' | 'details' | 'verification' | 'complete';
type Role = 'buyer' | 'seller';

interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

// الفئات المتاحة
const categories: Category[] = [
  { id: 'electronics', name: 'إلكترونيات', icon: '📱', subcategories: ['هواتف', 'حواسيب', 'أجهزة منزلية'] },
  { id: 'fashion', name: 'أزياء', icon: '👔', subcategories: ['رجالي', 'نسائي', 'أطفال'] },
  { id: 'home', name: 'المنزل', icon: '🏠', subcategories: ['أثاث', 'ديكور', 'مطبخ'] },
  { id: 'beauty', name: 'جمال', icon: '💄', subcategories: ['عناية', 'مكياج', 'عطور'] },
  { id: 'sports', name: 'رياضة', icon: '⚽', subcategories: ['ملابس', 'معدات', 'تغذية'] },
  { id: 'other', name: 'أخرى', icon: '📦', subcategories: ['متنوع'] }
];

// الخطط المتاحة
const plans: Plan[] = [
  { id: 'free', name: 'مجاني', price: 0, features: ['10 منتجات', 'دعم أساسي', 'إحصائيات بسيطة'] },
  { id: 'pro', name: 'احترافي', price: 99, features: ['منتجات غير محدودة', 'دعم أولوية', 'إحصائيات متقدمة', 'بدون عمولة'], popular: true },
  { id: 'enterprise', name: 'مؤسسي', price: 299, features: ['كل مميزات الاحترافي', 'مدير حساب', 'API مخصص', 'تخصيص كامل'] }
];

// حساب قوة كلمة المرور
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 20, label: 'ضعيفة', color: '#ef4444' };
  if (score === 2) return { score: 40, label: 'متوسطة', color: '#f59e0b' };
  if (score === 3) return { score: 60, label: 'جيدة', color: '#eab308' };
  if (score === 4) return { score: 80, label: 'قوية', color: '#22c55e' };
  return { score: 100, label: 'ممتازة', color: '#10b981' };
};

// مكون اختيار الدور
const RoleStep = memo(({ onSelect, selected }: { onSelect: (role: Role) => void; selected: Role | null }) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-white mb-2">اختر نوع حسابك</h2>
      <p className="text-white/60">حدد كيف تريد استخدام STAR LUX</p>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onSelect('buyer')}
        className={`reg-instant-role-card ${selected === 'buyer' ? 'selected' : ''}`}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4B00FF, #FF00FF)' }}>
          <Icons.User />
        </div>
        <h3 className="text-white font-semibold mb-1">مشتري</h3>
        <p className="text-white/50 text-sm">تصفح واشتري المنتجات</p>
      </button>
      
      <button
        type="button"
        onClick={() => onSelect('seller')}
        className={`reg-instant-role-card ${selected === 'seller' ? 'selected' : ''}`}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF00FF, #00ffff)' }}>
          <Icons.Store />
        </div>
        <h3 className="text-white font-semibold mb-1">بائع</h3>
        <p className="text-white/50 text-sm">أنشئ متجرك وابدأ البيع</p>
      </button>
    </div>
  </div>
));
RoleStep.displayName = 'RoleStep';

// مكون اختيار الفئة
const CategoryStep = memo(({ onSelect, selected }: { onSelect: (cat: Category) => void; selected: Category | null }) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-white mb-2">اختر فئة متجرك</h2>
      <p className="text-white/60">حدد التصنيف الرئيسي لمنتجاتك</p>
    </div>
    
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {categories.map(cat => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat)}
          className={`reg-instant-category-card ${selected?.id === cat.id ? 'selected' : ''}`}
        >
          <div className="text-3xl mb-2">{cat.icon}</div>
          <div className="text-white font-medium text-sm">{cat.name}</div>
        </button>
      ))}
    </div>
  </div>
));
CategoryStep.displayName = 'CategoryStep';

// مكون اختيار الخطة
const PlanStep = memo(({ onSelect, selected }: { onSelect: (plan: Plan) => void; selected: Plan | null }) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-white mb-2">اختر خطتك</h2>
      <p className="text-white/60">يمكنك الترقية في أي وقت</p>
    </div>
    
    <div className="space-y-4">
      {plans.map(plan => (
        <button
          key={plan.id}
          type="button"
          onClick={() => onSelect(plan)}
          className={`reg-instant-plan-card w-full text-right ${selected?.id === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-white font-bold text-lg">{plan.name}</h3>
              <p className="text-white/60 text-sm">
                {plan.price === 0 ? 'مجاناً' : `${plan.price} ر.س/شهر`}
              </p>
            </div>
            {selected?.id === plan.id && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#4B00FF' }}>
                <Icons.Check />
              </div>
            )}
          </div>
          <ul className="space-y-1">
            {plan.features.map((f, i) => (
              <li key={i} className="text-white/70 text-sm flex items-center gap-2">
                <span className="text-green-400">✓</span> {f}
              </li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  </div>
));
PlanStep.displayName = 'PlanStep';

// مكون إدخال البيانات
const DetailsStep = memo(({ 
  data, 
  onChange, 
  errors 
}: { 
  data: { name: string; email: string; phone: string; password: string; confirmPassword: string };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = useMemo(() => getPasswordStrength(data.password), [data.password]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">أدخل بياناتك</h2>
        <p className="text-white/60">أكمل معلومات حسابك</p>
      </div>
      
      <div className="space-y-4">
        {/* الاسم */}
        <div>
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.User />
            </div>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="الاسم الكامل"
              className={`reg-instant-input pr-12 ${errors.name ? 'error' : ''}`}
              dir="rtl"
              autoComplete="name"
            />
          </div>
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* البريد */}
        <div>
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.Mail />
            </div>
            <input
              type="email"
              value={data.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="البريد الإلكتروني"
              className={`reg-instant-input pr-12 ${errors.email ? 'error' : ''}`}
              dir="rtl"
              autoComplete="email"
              inputMode="email"
            />
          </div>
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* الهاتف */}
        <div>
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.Phone />
            </div>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="رقم الهاتف (اختياري)"
              className="reg-instant-input pr-12"
              dir="rtl"
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
        </div>

        {/* كلمة المرور */}
        <div>
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.Lock />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={data.password}
              onChange={(e) => onChange('password', e.target.value)}
              placeholder="كلمة المرور"
              className={`reg-instant-input pr-12 pl-12 ${errors.password ? 'error' : ''}`}
              dir="rtl"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
            </button>
          </div>
          {data.password && (
            <div className="reg-instant-password-strength">
              <div 
                className="reg-instant-password-bar" 
                style={{ width: `${passwordStrength.score}%`, background: passwordStrength.color }}
              />
            </div>
          )}
          {data.password && (
            <p className="text-xs mt-1" style={{ color: passwordStrength.color }}>
              قوة كلمة المرور: {passwordStrength.label}
            </p>
          )}
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
        </div>

        {/* تأكيد كلمة المرور */}
        <div>
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.Lock />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={data.confirmPassword}
              onChange={(e) => onChange('confirmPassword', e.target.value)}
              placeholder="تأكيد كلمة المرور"
              className={`reg-instant-input pr-12 ${errors.confirmPassword ? 'error' : ''}`}
              dir="rtl"
              autoComplete="new-password"
            />
          </div>
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>
    </div>
  );
});
DetailsStep.displayName = 'DetailsStep';

// مكون التحقق من OTP
const VerificationStep = memo(({ 
  email, 
  onVerify, 
  onResend, 
  isLoading, 
  error 
}: { 
  email: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  isLoading: boolean;
  error: string;
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // العد التنازلي
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // الانتقال للحقل التالي
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }

    // التحقق التلقائي
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      onVerify(newOtp.join(''));
    }
  }, [otp, onVerify]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  }, [otp]);

  const handleResend = useCallback(() => {
    if (canResend) {
      onResend();
      setCanResend(false);
      setCountdown(60);
    }
  }, [canResend, onResend]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4B00FF, #FF00FF)' }}>
          <Icons.Mail />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">تحقق من بريدك</h2>
        <p className="text-white/60">
          أدخل الرمز المرسل إلى<br />
          <span className="text-white font-medium">{email}</span>
        </p>
      </div>

      {error && <div className="reg-instant-error">{error}</div>}

      <div className="flex justify-center gap-2" dir="ltr">
        {otp.map((digit, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="reg-instant-otp-input"
            disabled={isLoading}
          />
        ))}
      </div>

      <div className="text-center">
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="reg-instant-link text-sm"
          >
            إعادة إرسال الرمز
          </button>
        ) : (
          <p className="text-white/50 text-sm">
            إعادة الإرسال خلال {countdown} ثانية
          </p>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center">
          <div className="reg-instant-spinner" />
        </div>
      )}
    </div>
  );
});
VerificationStep.displayName = 'VerificationStep';

// مكون الاكتمال
const CompleteStep = memo(({ name, role }: { name: string; role: Role }) => {
  const [, navigate] = useLocation();

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
        <Icons.Check />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">مرحباً بك، {name}!</h2>
      <p className="text-white/60 mb-8">
        تم إنشاء حسابك بنجاح
      </p>
      <button
        onClick={() => navigate(`/welcome?type=${role}&name=${encodeURIComponent(name)}`)}
        className="reg-instant-btn"
      >
        ابدأ الآن
      </button>
    </div>
  );
});
CompleteStep.displayName = 'CompleteStep';

// الصفحة الرئيسية
const RegisterPageOptimized: React.FC = () => {
  const [, navigate] = useLocation();
  const { loading: authLoading } = useAuth();
  
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // tRPC mutations
  const registerMutation = trpc.auth.register.useMutation();
  const sendOtpMutation = trpc.auth.resendOTP.useMutation();
  const verifyOtpMutation = trpc.auth.verifyRegistrationOTP.useMutation();

  // الخطوات المرئية
  const visibleSteps = useMemo(() => {
    const allSteps: { id: Step; title: string; forRoles: Role[] }[] = [
      { id: 'role', title: 'نوع الحساب', forRoles: ['buyer', 'seller'] },
      { id: 'category', title: 'الفئة', forRoles: ['seller'] },
      { id: 'plan', title: 'الخطة', forRoles: ['seller'] },
      { id: 'details', title: 'البيانات', forRoles: ['buyer', 'seller'] },
      { id: 'verification', title: 'التحقق', forRoles: ['buyer', 'seller'] },
      { id: 'complete', title: 'اكتمال', forRoles: ['buyer', 'seller'] }
    ];
    if (!role) return allSteps.filter(s => s.id === 'role');
    return allSteps.filter(s => s.forRoles.includes(role));
  }, [role]);

  const currentIndex = useMemo(() => 
    visibleSteps.findIndex(s => s.id === step), 
    [visibleSteps, step]
  );

  const progress = useMemo(() => 
    ((currentIndex + 1) / visibleSteps.length) * 100,
    [currentIndex, visibleSteps.length]
  );

  // التحقق من صحة البيانات
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (formData.name.length < 2) {
      newErrors.name = 'الاسم يجب أن يكون حرفين على الأقل';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // التنقل
  const goNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < visibleSteps.length) {
      setStep(visibleSteps[nextIndex].id);
    }
  }, [currentIndex, visibleSteps]);

  const goBack = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setStep(visibleSteps[prevIndex].id);
    }
  }, [currentIndex, visibleSteps]);

  // معالجة اختيار الدور
  const handleRoleSelect = useCallback((selectedRole: Role) => {
    setRole(selectedRole);
    setTimeout(() => {
      if (selectedRole === 'buyer') {
        setStep('details');
      } else {
        setStep('category');
      }
    }, 200);
  }, []);

  // معالجة تغيير الحقول
  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // إزالة الخطأ عند الكتابة
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // إرسال البيانات
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await sendOtpMutation.mutateAsync({
        identifier: formData.email,
        purpose: 'registration',
        channel: 'email'
      });
      setStep('verification');
    } catch (err: any) {
      setErrors({ submit: err.message || 'حدث خطأ' });
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, formData.email, sendOtpMutation]);

  // التحقق من OTP
  const handleVerifyOTP = useCallback(async (otp: string) => {
    setIsLoading(true);
    setOtpError('');
    try {
      await verifyOtpMutation.mutateAsync({
        email: formData.email,
        otp
      });
      
      await registerMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });
      
      setStep('complete');
    } catch (err: any) {
      setOtpError(err.message || 'رمز التحقق غير صحيح');
    } finally {
      setIsLoading(false);
    }
  }, [formData, verifyOtpMutation, registerMutation]);

  // إعادة إرسال OTP
  const handleResendOTP = useCallback(async () => {
    try {
      await sendOtpMutation.mutateAsync({
        identifier: formData.email,
        purpose: 'registration',
        channel: 'email'
      });
    } catch (err: any) {
      setOtpError(err.message || 'فشل إعادة الإرسال');
    }
  }, [formData.email, sendOtpMutation]);

  // هل يمكن المتابعة؟
  const canProceed = useMemo(() => {
    switch (step) {
      case 'role': return !!role;
      case 'category': return !!category;
      case 'plan': return !!plan;
      case 'details': return (
        formData.name.length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
        formData.password.length >= 8 &&
        formData.password === formData.confirmPassword
      );
      default: return true;
    }
  }, [step, role, category, plan, formData]);

  // Skeleton للتحميل
  if (authLoading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: criticalStyles }} />
        <div className="reg-instant-bg flex items-center justify-center">
          <div className="reg-instant-spinner" style={{ width: 32, height: 32 }} />
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: criticalStyles }} />
      
      <div className="reg-instant-bg">
        {/* Header */}
        <header className="relative z-10 p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <a
              href="/"
              className="text-2xl font-bold text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #00ffff, #4B00FF)' }}
            >
              STAR LUX
            </a>
            <a href="/auth" className="text-gray-400 hover:text-white transition-colors">
              لديك حساب؟ <span className="text-cyan-400">تسجيل الدخول</span>
            </a>
          </div>
        </header>

        {/* Progress */}
        <div className="max-w-2xl mx-auto px-6 mb-8">
          <div className="reg-instant-progress">
            <div className="reg-instant-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            {visibleSteps.map((s, i) => (
              <span
                key={s.id}
                className={`text-xs ${i <= currentIndex ? 'text-cyan-400' : 'text-gray-600'}`}
              >
                {s.title}
              </span>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-xl mx-auto px-6 pb-20">
          <div className="reg-instant-card">
            {step === 'role' && (
              <RoleStep onSelect={handleRoleSelect} selected={role} />
            )}
            
            {step === 'category' && (
              <CategoryStep onSelect={(cat) => { setCategory(cat); }} selected={category} />
            )}
            
            {step === 'plan' && (
              <PlanStep onSelect={(p) => { setPlan(p); }} selected={plan} />
            )}
            
            {step === 'details' && (
              <DetailsStep
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
              />
            )}
            
            {step === 'verification' && (
              <VerificationStep
                email={formData.email}
                onVerify={handleVerifyOTP}
                onResend={handleResendOTP}
                isLoading={isLoading}
                error={otpError}
              />
            )}
            
            {step === 'complete' && role && (
              <CompleteStep name={formData.name} role={role} />
            )}

            {/* أزرار التنقل */}
            {step !== 'role' && step !== 'verification' && step !== 'complete' && (
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={goBack}
                  className="reg-instant-btn reg-instant-btn-secondary flex items-center justify-center gap-2"
                  style={{ flex: 1 }}
                >
                  <Icons.ArrowRight />
                  السابق
                </button>
                
                {step === 'details' ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canProceed || isLoading}
                    className="reg-instant-btn flex items-center justify-center gap-2"
                    style={{ flex: 2 }}
                  >
                    {isLoading ? (
                      <>
                        <div className="reg-instant-spinner" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        إنشاء الحساب
                        <Icons.ArrowLeft />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canProceed}
                    className="reg-instant-btn flex items-center justify-center gap-2"
                    style={{ flex: 2 }}
                  >
                    التالي
                    <Icons.ArrowLeft />
                  </button>
                )}
              </div>
            )}

            {errors.submit && (
              <div className="reg-instant-error mt-4">{errors.submit}</div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default RegisterPageOptimized;
