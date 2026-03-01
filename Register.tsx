import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { 
  Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, 
  User, Store, Check, Crown, Zap, Star,
  CreditCard, Smartphone, Building2,
  ShieldCheck, AlertTriangle, Lock
} from 'lucide-react';

type AccountType = 'buyer' | 'seller' | null;
type SubscriptionPlan = 'free' | 'pro' | 'community';
type RegistrationStep = 'account-type' | 'basic-info' | 'store-info' | 'payment-methods' | 'subscription' | 'payment' | 'otp';

// طرق الدفع المتاحة للبائعين
const PAYMENT_METHODS = [
  { id: 'zain_cash', name: 'Zain Cash', nameAr: 'زين كاش', icon: Smartphone, color: 'text-green-500' },
  { id: 'asia_pay', name: 'Asia Pay', nameAr: 'آسيا باي', icon: Building2, color: 'text-blue-500' },
  { id: 'mastercard', name: 'MasterCard', nameAr: 'ماستركارد', icon: CreditCard, color: 'text-red-500' },
  { id: 'visa', name: 'Visa', nameAr: 'فيزا', icon: CreditCard, color: 'text-blue-600' },
];

// خطط الاشتراك
const SUBSCRIPTION_PLANS: { id: SubscriptionPlan; name: string; nameAr: string; price: number; features: string[]; icon: React.ReactNode; popular?: boolean }[] = [
  {
    id: 'free',
    name: 'Free',
    nameAr: 'مجانية',
    price: 0,
    icon: <Star className="w-6 h-6" />,
    features: ['متجر واحد', '10 منتجات كحد أقصى', 'صور وفيديو فقط', 'دعم عبر البريد', 'لوحة تحكم محدودة'],
  },
  {
    id: 'pro',
    name: 'Pro',
    nameAr: 'احترافية',
    price: 50,
    icon: <Zap className="w-6 h-6" />,
    popular: true,
    features: ['منتجات غير محدودة', 'ملفات قابلة للتحميل', 'حد الملف: 50MB', 'دعم فني أولوية', 'تحليلات متقدمة', 'لوحة تحكم كاملة'],
  },
  {
    id: 'community',
    name: 'Community',
    nameAr: 'مجتمعية',
    price: 80,
    icon: <Crown className="w-6 h-6" />,
    features: ['جميع ميزات Pro', 'أولوية في البحث', 'شارة متجر مميز', 'تقارير متقدمة', 'دعم 24/7', 'لوحة تحكم متقدمة'],
  },
];

export default function Register() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('account-type');
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otp, setOtp] = useState('');
  
  // منع أي تفاعل قبل اختيار نوع الحساب
  const [isAccountTypeSelected, setIsAccountTypeSelected] = useState(false);

  // بيانات المستخدم الأساسية
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    countryCode: '+964',
  });

  // بيانات المتجر (للبائع فقط)
  const [storeInfo, setStoreInfo] = useState({
    storeName: '',
    storeDescription: '',
    storeCategory: '',
    country: 'العراق',
  });

  // طرق الدفع المختارة (للبائع فقط)
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<{ id: string; details: string }[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('');
  const [currentPaymentDetails, setCurrentPaymentDetails] = useState('');

  // خطة الاشتراك (للبائع فقط)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // طريقة دفع الاشتراك
  const [subscriptionPaymentMethod, setSubscriptionPaymentMethod] = useState('');

  // حفظ بيانات التسجيل المؤقتة
  const [pendingRegistration, setPendingRegistration] = useState<any>(null);

  // Mutations
  const registerUserMutation = trpc.auth.registerUser.useMutation();
  const registerStoreMutation = trpc.auth.registerStore.useMutation();
  const verifyOtpMutation = trpc.auth.verifyRegistrationOtp.useMutation();

  // التحقق من صحة البريد الإلكتروني
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  
  // التحقق من قوة كلمة المرور
  const isStrongPassword = (password: string) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
  };

  // منع الرجوع بدون تأكيد
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep !== 'account-type' && currentStep !== 'otp') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (currentStep !== 'account-type') {
        e.preventDefault();
        if (window.confirm('هل أنت متأكد من الرجوع؟ سيتم فقدان البيانات المدخلة.')) {
          goToPreviousStep();
        } else {
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentStep]);

  // إضافة طريقة دفع
  const addPaymentMethod = () => {
    if (!currentPaymentMethod || !currentPaymentDetails) {
      setError('يرجى اختيار طريقة الدفع وإدخال التفاصيل');
      return;
    }
    if (currentPaymentDetails.length < 5) {
      setError('تفاصيل طريقة الدفع يجب أن تكون 5 أحرف على الأقل');
      return;
    }
    if (selectedPaymentMethods.find(m => m.id === currentPaymentMethod)) {
      setError('طريقة الدفع هذه مضافة بالفعل');
      return;
    }
    setSelectedPaymentMethods([...selectedPaymentMethods, { id: currentPaymentMethod, details: currentPaymentDetails }]);
    setCurrentPaymentMethod('');
    setCurrentPaymentDetails('');
    setError('');
  };

  // حذف طريقة دفع
  const removePaymentMethod = (id: string) => {
    setSelectedPaymentMethods(selectedPaymentMethods.filter(m => m.id !== id));
  };

  // التحقق من صحة الخطوة الحالية
  const validateCurrentStep = (): boolean => {
    setError('');
    
    switch (currentStep) {
      case 'account-type':
        if (!accountType) {
          setError('يجب اختيار نوع الحساب أولاً');
          return false;
        }
        return true;

      case 'basic-info':
        if (!basicInfo.name || basicInfo.name.length < 2) {
          setError('الاسم يجب أن يكون حرفين على الأقل');
          return false;
        }
        if (!isValidEmail(basicInfo.email)) {
          setError('البريد الإلكتروني غير صحيح');
          return false;
        }
        if (!isStrongPassword(basicInfo.password)) {
          setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير وصغير ورقم');
          return false;
        }
        if (!basicInfo.phoneNumber || basicInfo.phoneNumber.length < 7) {
          setError('رقم الهاتف غير صحيح');
          return false;
        }
        return true;

      case 'store-info':
        if (!storeInfo.storeName || storeInfo.storeName.length < 2) {
          setError('اسم المتجر يجب أن يكون حرفين على الأقل');
          return false;
        }
        if (!storeInfo.storeDescription || storeInfo.storeDescription.length < 10) {
          setError('وصف المتجر يجب أن يكون 10 أحرف على الأقل');
          return false;
        }
        if (!storeInfo.storeCategory) {
          setError('يجب اختيار فئة المتجر');
          return false;
        }
        return true;

      case 'payment-methods':
        if (selectedPaymentMethods.length === 0) {
          setError('يجب إضافة طريقة دفع واحدة على الأقل لاستلام أرباحك');
          return false;
        }
        return true;

      case 'subscription':
        if (!selectedPlan) {
          setError('يجب اختيار خطة الاشتراك');
          return false;
        }
        return true;

      case 'payment':
        if (selectedPlan !== 'free' && !subscriptionPaymentMethod) {
          setError('يرجى اختيار طريقة دفع الاشتراك');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // الانتقال للخطوة التالية
  const goToNextStep = () => {
    if (!validateCurrentStep()) return;

    if (accountType === 'buyer') {
      if (currentStep === 'basic-info') {
        handleRegisterBuyer();
      }
    } else if (accountType === 'seller') {
      switch (currentStep) {
        case 'basic-info':
          setCurrentStep('store-info');
          break;
        case 'store-info':
          setCurrentStep('payment-methods');
          break;
        case 'payment-methods':
          setCurrentStep('subscription');
          break;
        case 'subscription':
          if (selectedPlan === 'free') {
            handleRegisterSeller();
          } else {
            // للخطط المدفوعة، يجب الدفع أولاً
            setCurrentStep('payment');
          }
          break;
        case 'payment':
          // التحويل لصفحة الدفع
          handlePaidSubscription();
          break;
      }
    }
  };

  // الرجوع للخطوة السابقة
  const goToPreviousStep = () => {
    setError('');
    if (accountType === 'buyer') {
      if (currentStep === 'basic-info') {
        setAccountType(null);
        setIsAccountTypeSelected(false);
        setCurrentStep('account-type');
      }
    } else if (accountType === 'seller') {
      switch (currentStep) {
        case 'basic-info':
          setAccountType(null);
          setIsAccountTypeSelected(false);
          setCurrentStep('account-type');
          break;
        case 'store-info':
          setCurrentStep('basic-info');
          break;
        case 'payment-methods':
          setCurrentStep('store-info');
          break;
        case 'subscription':
          setCurrentStep('payment-methods');
          break;
        case 'payment':
          setCurrentStep('subscription');
          break;
      }
    }
  };

  // تسجيل المشتري
  const handleRegisterBuyer = async () => {
    setIsLoading(true);
    setError('');

    try {
      await registerUserMutation.mutateAsync({
        email: basicInfo.email,
        password: basicInfo.password,
        name: basicInfo.name,
        phoneNumber: basicInfo.phoneNumber,
        countryCode: basicInfo.countryCode,
      });

      setSuccess('تم إرسال رمز التحقق إلى هاتفك');
      setPendingRegistration({ type: 'buyer' });
      setCurrentStep('otp');
    } catch (err: any) {
      setError(err.message || 'فشل التسجيل');
    } finally {
      setIsLoading(false);
    }
  };

  // تسجيل البائع (للخطة المجانية فقط)
  const handleRegisterSeller = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await registerStoreMutation.mutateAsync({
        storeName: storeInfo.storeName,
        storeType: storeInfo.storeCategory,
        storeCategory: storeInfo.storeCategory,
        email: basicInfo.email,
        password: basicInfo.password,
        phoneNumber: basicInfo.phoneNumber,
        countryCode: basicInfo.countryCode,
        country: storeInfo.country,
        plan: selectedPlan || 'free',
        paymentMethods: selectedPaymentMethods,
      });

      setSuccess('تم إرسال رمز التحقق إلى هاتفك');
      setPendingRegistration({ 
        type: 'seller', 
        plan: selectedPlan,
        requiresPayment: result.requiresPayment 
      });
      setCurrentStep('otp');
    } catch (err: any) {
      setError(err.message || 'فشل التسجيل');
    } finally {
      setIsLoading(false);
    }
  };

  // معالجة الاشتراك المدفوع
  const handlePaidSubscription = async () => {
    setIsLoading(true);
    setError('');

    try {
      // حفظ بيانات التسجيل مؤقتاً
      const registrationData = {
        storeName: storeInfo.storeName,
        storeType: storeInfo.storeCategory,
        storeCategory: storeInfo.storeCategory,
        email: basicInfo.email,
        password: basicInfo.password,
        phoneNumber: basicInfo.phoneNumber,
        countryCode: basicInfo.countryCode,
        country: storeInfo.country,
        plan: selectedPlan,
        paymentMethods: selectedPaymentMethods,
        subscriptionPaymentMethod,
      };

      // حفظ في localStorage مؤقتاً
      localStorage.setItem('pendingSellerRegistration', JSON.stringify(registrationData));

      // التحويل لصفحة الدفع
      navigate(`/subscription-payment?plan=${selectedPlan}&email=${encodeURIComponent(basicInfo.email)}&newRegistration=true`);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  // التحقق من OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (otp.length !== 6) {
        throw new Error('رمز التحقق يجب أن يكون 6 أرقام');
      }

      await verifyOtpMutation.mutateAsync({
        email: basicInfo.email,
        phoneNumber: basicInfo.phoneNumber,
        otp,
        type: accountType === 'buyer' ? 'user' : 'store',
      });

      setSuccess('تم التحقق بنجاح! جاري تحويلك...');
      
      setTimeout(() => {
        if (accountType === 'buyer') {
          navigate('/');
        } else if (accountType === 'seller') {
          if (selectedPlan !== 'free' && pendingRegistration?.requiresPayment) {
            navigate('/subscription-payment?plan=' + selectedPlan);
          } else {
            navigate('/seller-dashboard');
          }
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'فشل التحقق من الرمز');
    } finally {
      setIsLoading(false);
    }
  };

  // اختيار نوع الحساب
  const handleSelectAccountType = (type: AccountType) => {
    setAccountType(type);
    setIsAccountTypeSelected(true);
    setCurrentStep('basic-info');
    setError('');
  };

  // حساب رقم الخطوة الحالية
  const getStepNumber = () => {
    if (accountType === 'buyer') {
      return currentStep === 'basic-info' ? 1 : 2;
    }
    const steps: RegistrationStep[] = ['basic-info', 'store-info', 'payment-methods', 'subscription', 'payment', 'otp'];
    return steps.indexOf(currentStep) + 1;
  };

  const getTotalSteps = () => {
    if (accountType === 'buyer') return 2;
    return selectedPlan === 'free' ? 5 : 6;
  };

  // ===== RENDER =====

  // الخطوة 1: اختيار نوع الحساب (إلزامي)
  if (currentStep === 'account-type') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="border-b border-slate-700 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              STAR LUX
            </CardTitle>
            <CardDescription className="text-slate-400">إنشاء حساب جديد</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">خطوة إلزامية</span>
              </div>
              <p className="text-sm text-slate-300">
                يجب اختيار نوع الحساب قبل المتابعة. لا يمكن تخطي هذه الخطوة.
              </p>
            </div>

            <p className="text-sm text-slate-300 text-center mb-4">اختر نوع الحساب الذي تريد إنشاءه</p>

            <Button
              onClick={() => handleSelectAccountType('buyer')}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold h-20 text-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
              <div className="relative flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="font-bold">مشتري</div>
                  <div className="text-sm opacity-80">حساب للتسوق والشراء</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => handleSelectAccountType('seller')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold h-20 text-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
              <div className="relative flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Store className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="font-bold">بائع</div>
                  <div className="text-sm opacity-80">إنشاء متجر وبيع المنتجات</div>
                </div>
              </div>
            </Button>

            <div className="pt-4 border-t border-slate-700">
              <Button
                onClick={() => navigate('/auth')}
                variant="ghost"
                className="w-full text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              >
                لديك حساب؟ تسجيل الدخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // خطوة OTP
  if (currentStep === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="border-b border-slate-700 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">التحقق من الهاتف</CardTitle>
            <CardDescription className="text-slate-400">أدخل رمز التحقق المرسل إلى هاتفك</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-300">
                  رمز التحقق مرسل إلى
                </p>
                <p className="text-lg font-mono text-white mt-1" dir="ltr">
                  {basicInfo.countryCode} {basicInfo.phoneNumber}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">رمز التحقق</label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-center text-3xl tracking-[0.5em] font-mono h-14"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm text-center">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold h-12"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <Check className="ml-2 h-5 w-5" />
                    التحقق من الرمز
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // باقي الخطوات
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-lg border-slate-700 bg-slate-800/50 backdrop-blur max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-700 sticky top-0 bg-slate-800/95 backdrop-blur z-10">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousStep}
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowRight size={16} className="ml-1" />
              رجوع
            </Button>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                accountType === 'buyer' 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {accountType === 'buyer' ? 'مشتري' : 'بائع'}
              </span>
              <span className="text-sm text-slate-400">
                {getStepNumber()} / {getTotalSteps()}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                accountType === 'buyer' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${(getStepNumber() / getTotalSteps()) * 100}%` }}
            />
          </div>

          <CardTitle className="text-xl font-bold text-white">
            {currentStep === 'basic-info' && 'البيانات الأساسية'}
            {currentStep === 'store-info' && 'بيانات المتجر'}
            {currentStep === 'payment-methods' && 'طرق استلام الأرباح'}
            {currentStep === 'subscription' && 'اختر خطة الاشتراك'}
            {currentStep === 'payment' && 'دفع الاشتراك'}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {accountType === 'buyer' ? 'إنشاء حساب مشتري' : 'إنشاء حساب بائع ومتجر'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* البيانات الأساسية */}
          {currentStep === 'basic-info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">الاسم الكامل *</label>
                <Input
                  type="text"
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                  placeholder="أحمد ياسين"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">البريد الإلكتروني *</label>
                <Input
                  type="email"
                  value={basicInfo.email}
                  onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                  placeholder="your@email.com"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">كلمة المرور *</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={basicInfo.password}
                    onChange={(e) => setBasicInfo({ ...basicInfo, password: e.target.value })}
                    placeholder="••••••••"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 pl-10"
                    disabled={isLoading}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">8 أحرف على الأقل، حرف كبير وصغير ورقم</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">رمز الدولة</label>
                  <select
                    value={basicInfo.countryCode}
                    onChange={(e) => setBasicInfo({ ...basicInfo, countryCode: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-2 py-2 text-sm"
                    disabled={isLoading}
                  >
                    <option value="+964">🇮🇶 +964</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+20">🇪🇬 +20</option>
                    <option value="+962">🇯🇴 +962</option>
                    <option value="+1">🇺🇸 +1</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-200 mb-2">رقم الهاتف *</label>
                  <Input
                    type="tel"
                    value={basicInfo.phoneNumber}
                    onChange={(e) => setBasicInfo({ ...basicInfo, phoneNumber: e.target.value })}
                    placeholder="7501234567"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* بيانات المتجر */}
          {currentStep === 'store-info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">اسم المتجر * (يجب أن يكون فريداً)</label>
                <Input
                  type="text"
                  value={storeInfo.storeName}
                  onChange={(e) => setStoreInfo({ ...storeInfo, storeName: e.target.value })}
                  placeholder="متجري الرائع"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">وصف المتجر *</label>
                <textarea
                  value={storeInfo.storeDescription}
                  onChange={(e) => setStoreInfo({ ...storeInfo, storeDescription: e.target.value })}
                  placeholder="وصف مختصر عن متجرك ومنتجاتك..."
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-md px-3 py-2 min-h-[100px] resize-none"
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-400 mt-1">10 أحرف على الأقل</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">فئة المتجر * (اختر قسم واحد فقط)</label>
                <select
                  value={storeInfo.storeCategory}
                  onChange={(e) => setStoreInfo({ ...storeInfo, storeCategory: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                  disabled={isLoading}
                >
                  <option value="">اختر فئة المتجر</option>
                  <option value="electronics">إلكترونيات</option>
                  <option value="fashion">ملابس وأزياء</option>
                  <option value="home">منتجات منزلية</option>
                  <option value="beauty">مكياج وعطور</option>
                  <option value="sports">رياضة</option>
                  <option value="books">كتب ومستلزمات</option>
                  <option value="food">طعام ومشروبات</option>
                  <option value="services">خدمات</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">الدولة</label>
                <select
                  value={storeInfo.country}
                  onChange={(e) => setStoreInfo({ ...storeInfo, country: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                  disabled={isLoading}
                >
                  <option value="العراق">العراق</option>
                  <option value="السعودية">السعودية</option>
                  <option value="الإمارات">الإمارات</option>
                  <option value="مصر">مصر</option>
                  <option value="الأردن">الأردن</option>
                  <option value="الكويت">الكويت</option>
                  <option value="قطر">قطر</option>
                  <option value="البحرين">البحرين</option>
                  <option value="عمان">عمان</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
            </div>
          )}

          {/* طرق الدفع */}
          {currentStep === 'payment-methods' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-slate-300">
                  أضف طرق الدفع التي تريد استلام أرباحك من خلالها. يجب إضافة طريقة واحدة على الأقل.
                </p>
              </div>

              {/* طرق الدفع المضافة */}
              {selectedPaymentMethods.length > 0 && (
                <div className="space-y-2 mb-4">
                  <label className="block text-sm font-medium text-slate-200">طرق الدفع المضافة ({selectedPaymentMethods.length}):</label>
                  {selectedPaymentMethods.map((method) => {
                    const methodInfo = PAYMENT_METHODS.find(m => m.id === method.id);
                    return (
                      <div key={method.id} className="flex items-center justify-between bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          {methodInfo && <methodInfo.icon className={`w-5 h-5 ${methodInfo.color}`} />}
                          <span className="text-white">{methodInfo?.nameAr}</span>
                          <span className="text-slate-400 text-sm">({method.details})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePaymentMethod(method.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          حذف
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* إضافة طريقة دفع جديدة */}
              <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <label className="block text-sm font-medium text-slate-200">إضافة طريقة دفع:</label>
                
                <select
                  value={currentPaymentMethod}
                  onChange={(e) => setCurrentPaymentMethod(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                >
                  <option value="">اختر طريقة الدفع</option>
                  {PAYMENT_METHODS.filter(m => !selectedPaymentMethods.find(s => s.id === m.id)).map((method) => (
                    <option key={method.id} value={method.id}>{method.nameAr} ({method.name})</option>
                  ))}
                </select>

                {currentPaymentMethod && (
                  <>
                    <Input
                      type="text"
                      value={currentPaymentDetails}
                      onChange={(e) => setCurrentPaymentDetails(e.target.value)}
                      placeholder={
                        (currentPaymentMethod === 'mastercard' || currentPaymentMethod === 'visa') ? 'رقم البطاقة أو الحساب' :
                        (currentPaymentMethod === 'zain_cash' || currentPaymentMethod === 'asia_pay') ? 'رقم الهاتف أو المحفظة' :
                        'تفاصيل الحساب'
                      }
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      dir="ltr"
                    />
                    <Button
                      onClick={addPaymentMethod}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Check className="ml-2 h-4 w-4" />
                      إضافة طريقة الدفع
                    </Button>
                  </>
                )}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs text-amber-400">
                  ⚠️ ملاحظة: سيتم خصم عمولة 2% من كل عملية بيع تلقائياً
                </p>
              </div>
            </div>
          )}

          {/* خطط الاشتراك */}
          {currentStep === 'subscription' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-300">
                  يجب اختيار خطة اشتراك. للخطط المدفوعة، لن يتم إنشاء المتجر حتى إتمام الدفع.
                </p>
              </div>

              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? 'bg-amber-500/20 border-2 border-amber-400 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-700/50 border border-slate-600 hover:border-slate-500'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-white text-xs font-semibold">
                      الأكثر شعبية
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedPlan === plan.id ? 'bg-amber-400 text-amber-900' : 'bg-slate-600 text-white'
                      }`}>
                        {plan.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{plan.nameAr}</h3>
                        <p className="text-sm text-slate-400">{plan.name}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-2xl font-bold text-white">${plan.price}</span>
                      {plan.price > 0 && <span className="text-slate-400 text-sm">/سنة</span>}
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {selectedPlan === plan.id && (
                    <div className="absolute top-4 left-4">
                      <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
                        <Check className="w-4 h-4 text-amber-900" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {selectedPlan && selectedPlan !== 'free' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">تنبيه مهم</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    لن يتم إنشاء المتجر ولوحة التحكم حتى إتمام عملية الدفع بنجاح.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* دفع الاشتراك */}
          {currentStep === 'payment' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-6 rounded-xl text-center">
                <p className="text-slate-300 mb-2">المبلغ المطلوب</p>
                <p className="text-4xl font-bold text-white">
                  ${SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  لخطة {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.nameAr} السنوية
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-3">اختر طريقة الدفع *</label>
                <div className="grid grid-cols-2 gap-3">
                  {['zain_cash', 'mastercard', 'visa', 'asia_pay'].map((methodId) => {
                    const method = PAYMENT_METHODS.find(m => m.id === methodId);
                    if (!method) return null;
                    return (
                      <button
                        key={methodId}
                        onClick={() => setSubscriptionPaymentMethod(methodId)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          subscriptionPaymentMethod === methodId
                            ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20'
                            : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                        }`}
                      >
                        <method.icon className={`w-8 h-8 ${method.color}`} />
                        <span className="text-white text-sm font-medium">{method.nameAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 text-center">
                  بعد الضغط على "إنشاء الحساب"، سيتم توجيهك لإكمال عملية الدفع.
                  <br />
                  سيتم إنشاء المتجر ولوحة التحكم فقط بعد نجاح الدفع.
                </p>
              </div>
            </div>
          )}

          {/* رسائل الخطأ والنجاح */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-4">
              <p className="text-green-400 text-sm text-center">{success}</p>
            </div>
          )}

          {/* زر المتابعة */}
          <Button
            onClick={goToNextStep}
            className={`w-full mt-6 font-semibold h-12 ${
              accountType === 'seller'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
            }`}
            disabled={isLoading || (currentStep === 'subscription' && !selectedPlan)}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري التحميل...
              </>
            ) : currentStep === 'subscription' && selectedPlan === 'free' ? (
              <>
                <Check className="ml-2 h-5 w-5" />
                إنشاء الحساب والمتجر
              </>
            ) : currentStep === 'payment' ? (
              <>
                <CreditCard className="ml-2 h-5 w-5" />
                المتابعة للدفع
              </>
            ) : accountType === 'buyer' && currentStep === 'basic-info' ? (
              <>
                <Check className="ml-2 h-5 w-5" />
                إنشاء الحساب
              </>
            ) : (
              <>
                التالي
                <ArrowLeft className="mr-2 h-5 w-5" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
