import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Eye, EyeOff, Mail, Lock, User, Loader2, Sparkles, ArrowLeft, ArrowRight,
  CheckCircle, Store, Phone, Check, Crown, Zap, Users, AlertCircle, ShieldCheck,
  Package, Briefcase
} from "lucide-react";
import CountryCodeSelect from "@/components/CountryCodeSelect";
import { isBlockedCountry } from "@shared/countryCodes";

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type Plan = "free" | "pro" | "community";

const PLANS = {
  free: { 
    name: "مجانية", 
    price: 0, 
    icon: Package,
    color: "cyan",
    features: ["متجر واحد", "10 منتجات", "دعم أساسي"] 
  },
  pro: { 
    name: "برو", 
    price: 50, 
    icon: Crown,
    color: "amber",
    features: ["متجر واحد", "100 منتج", "دعم متقدم", "تقارير مفصلة"] 
  },
  community: { 
    name: "كميونتي", 
    price: 80, 
    icon: Users,
    color: "purple",
    features: ["متاجر متعددة", "منتجات غير محدودة", "دعم VIP", "تقارير متقدمة", "أولوية في البحث"] 
  },
};

// Floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <div
        key={i}
        className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20"
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

// Animated input component
interface AnimatedInputProps {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  showPassword?: boolean;
  dir?: string;
}

const AnimatedInput = ({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  showToggle,
  onToggle,
  showPassword,
  dir = "rtl",
}: AnimatedInputProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-2">
      <Label className={`text-sm font-medium transition-colors duration-300 ${
        focused ? "text-purple-400" : error ? "text-red-400" : "text-slate-300"
      }`}>
        {label}
      </Label>
      <div className={`relative group transition-all duration-300 ${error ? "animate-shake" : ""}`}>
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 transition-opacity duration-300 ${
          focused ? "opacity-30" : ""
        }`} />
        
        <div className="relative">
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${
            focused ? "text-purple-400 scale-110" : error ? "text-red-400" : "text-slate-500"
          }`}>
            {icon}
          </div>
          <Input
            type={showToggle ? (showPassword ? "text" : "password") : type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            dir={dir}
            className={`pr-11 ${showToggle ? "pl-11" : "pl-4"} h-12 bg-slate-800/60 backdrop-blur-sm border-2 text-white placeholder:text-slate-500 rounded-xl transition-all duration-300 ${
              focused 
                ? "border-purple-500 ring-2 ring-purple-500/20" 
                : error 
                  ? "border-red-500 ring-2 ring-red-500/20" 
                  : "border-slate-700 hover:border-slate-600"
            }`}
          />
          {showToggle && (
            <button
              type="button"
              onClick={onToggle}
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 ${
                focused ? "text-purple-400" : "text-slate-500 hover:text-purple-400"
              }`}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 animate-fadeIn">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

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

// Step indicator component
const StepIndicator = ({ currentStep, totalSteps = 5 }: { currentStep: number; totalSteps?: number }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {[...Array(totalSteps)].map((_, i) => {
      const step = i + 1;
      return (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
            currentStep >= step 
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
              : "bg-slate-800 text-slate-500"
          }`}>
            {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
          </div>
          {step < totalSteps && (
            <div className={`w-8 h-0.5 mx-1 transition-all duration-500 ${
              currentStep > step ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-slate-700"
            }`} />
          )}
        </div>
      );
    })}
  </div>
);

export default function SellerRegisterPage() {
  const [, setLocation] = useLocation();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Personal Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+964");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Step 2: Store Info
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  
  // Step 3: Category
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Step 4: Plan
  const [selectedPlan, setSelectedPlan] = useState<Plan | "">("");
  
  // Step 5: OTP
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Success
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [storeNameError, setStoreNameError] = useState("");
  const [storeDescError, setStoreDescError] = useState("");

  // Categories
  const categoriesQuery = trpc.products.getCategories.useQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time validation
  useEffect(() => {
    if (name && name.length < 2) setNameError("الاسم يجب أن يكون حرفين على الأقل");
    else setNameError("");
  }, [name]);

  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setEmailError("البريد الإلكتروني غير صالح");
    else setEmailError("");
  }, [email]);

  useEffect(() => {
    if (password && password.length < 8) setPasswordError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    else setPasswordError("");
  }, [password]);

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) setConfirmPasswordError("كلمتا المرور غير متطابقتين");
    else setConfirmPasswordError("");
  }, [password, confirmPassword]);

  useEffect(() => {
    if (phoneNumber && phoneNumber.length < 7) setPhoneError("رقم الهاتف غير صحيح");
    else setPhoneError("");
  }, [phoneNumber]);

  useEffect(() => {
    if (storeName && storeName.length < 3) setStoreNameError("اسم المتجر يجب أن يكون 3 أحرف على الأقل");
    else setStoreNameError("");
  }, [storeName]);

  useEffect(() => {
    if (storeDescription && storeDescription.length < 10) setStoreDescError("وصف المتجر يجب أن يكون 10 أحرف على الأقل");
    else setStoreDescError("");
  }, [storeDescription]);

  const registerMutation = trpc.auth.registerUser.useMutation({
    onSuccess: () => {
      setCurrentStep(5);
      setIsSubmitting(false);
      toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message || "فشل التسجيل");
    },
  });

  const verifyOtpMutation = trpc.auth.verifyRegistrationOtp.useMutation({
    onSuccess: () => {
      if (selectedPlan === "free") {
        setRegistrationSuccess(true);
        toast.success("تم إنشاء حسابك ومتجرك بنجاح!");
        setTimeout(() => {
          setLocation("/seller");
        }, 2000);
      } else {
        const paymentData = {
          plan: selectedPlan,
          storeName,
          storeDescription,
          category: selectedCategory,
          email,
        };
        localStorage.setItem("pendingSellerRegistration", JSON.stringify(paymentData));
        setLocation(`/subscription-payment?plan=${selectedPlan}&from=register`);
      }
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message || "رمز التحقق غير صحيح");
    },
  });

  const validateStep1 = () => {
    let hasError = false;
    if (!name) { setNameError("يرجى إدخال الاسم"); hasError = true; }
    if (!email) { setEmailError("يرجى إدخال البريد الإلكتروني"); hasError = true; }
    if (!password) { setPasswordError("يرجى إدخال كلمة المرور"); hasError = true; }
    if (!confirmPassword) { setConfirmPasswordError("يرجى تأكيد كلمة المرور"); hasError = true; }
    if (!phoneNumber) { setPhoneError("يرجى إدخال رقم الهاتف"); hasError = true; }
    if (hasError || nameError || emailError || passwordError || confirmPasswordError || phoneError) return false;
    if (isBlockedCountry(countryCode)) {
      toast.error("عذراً، هذه الدولة غير مدعومة");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    let hasError = false;
    if (!storeName) { setStoreNameError("يرجى إدخال اسم المتجر"); hasError = true; }
    if (!storeDescription) { setStoreDescError("يرجى إدخال وصف المتجر"); hasError = true; }
    if (hasError || storeNameError || storeDescError) return false;
    return true;
  };

  const validateStep3 = () => {
    if (!selectedCategory) {
      toast.error("يرجى اختيار قسم للمتجر");
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!selectedPlan) {
      toast.error("يرجى اختيار خطة اشتراك");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 1:
        if (validateStep1()) setCurrentStep(2);
        break;
      case 2:
        if (validateStep2()) setCurrentStep(3);
        break;
      case 3:
        if (validateStep3()) setCurrentStep(4);
        break;
      case 4:
        if (validateStep4()) {
          setIsSubmitting(true);
          registerMutation.mutate({ name, email, password, phoneNumber, countryCode });
        }
        break;
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      toast.error("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }
    setIsSubmitting(true);
    verifyOtpMutation.mutate({
      email,
      phoneNumber,
      otp,
      type: "store",
      name,
      password,
      countryCode,
      storeName,
      storeType: "store",
      storeCategory: selectedCategory,
      country: countryCode,
      plan: selectedPlan as Plan,
    });
  };

  // Success Screen
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
        <FloatingParticles />
        <div className="text-center relative z-10">
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-scaleIn">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 animate-fadeIn">مرحباً بك في STAR LUX!</h2>
          <p className="text-slate-400 mb-8 animate-fadeIn">تم إنشاء حسابك ومتجرك بنجاح. جاري تحويلك للوحة التحكم...</p>
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto relative" />
          </div>
        </div>
      </div>
    );
  }

  const stepTitles = {
    1: "البيانات الشخصية",
    2: "بيانات المتجر",
    3: "قسم المتجر",
    4: "خطة الاشتراك",
    5: "تأكيد البريد",
    6: "اكتمل التسجيل",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      
      {/* Floating particles */}
      <FloatingParticles />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Main Card */}
      <div 
        className={`relative w-full max-w-lg z-10 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
        }`}
      >
        {/* Animated glow border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur-lg opacity-40 animate-gradient-xy" />
        
        {/* Glass card */}
        <div className="relative bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-slate-700/50 overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          
          {/* Back Button */}
          <button
            onClick={() => currentStep === 1 ? setLocation("/account-type") : setCurrentStep((currentStep - 1) as Step)}
            className="absolute top-6 left-6 p-2.5 text-slate-400 hover:text-white transition-all duration-300 rounded-xl hover:bg-slate-800/50 group z-10"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          </button>

          {/* Logo & Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/30 rounded-xl blur-lg animate-pulse" />
                <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                STAR LUX
              </h1>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{stepTitles[currentStep]}</h2>
            <p className="text-slate-400 text-sm">
              {currentStep === 1 && "أدخل بياناتك الشخصية"}
              {currentStep === 2 && "أدخل بيانات متجرك"}
              {currentStep === 3 && "اختر قسم متجرك"}
              {currentStep === 4 && "اختر خطة الاشتراك المناسبة"}
              {currentStep === 5 && "أدخل رمز التحقق المرسل إلى بريدك"}
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} />

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-slideIn">
              <AnimatedInput
                icon={<User className="w-5 h-5" />}
                label="الاسم الكامل"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                error={nameError}
                disabled={isSubmitting}
              />

              <AnimatedInput
                icon={<Mail className="w-5 h-5" />}
                label="البريد الإلكتروني"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="أدخل بريدك الإلكتروني"
                error={emailError}
                disabled={isSubmitting}
                dir="ltr"
              />

              <AnimatedInput
                icon={<Lock className="w-5 h-5" />}
                label="كلمة المرور"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                error={passwordError}
                disabled={isSubmitting}
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
                dir="ltr"
              />

              {password && <PasswordStrength password={password} />}

              <AnimatedInput
                icon={<Lock className="w-5 h-5" />}
                label="تأكيد كلمة المرور"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                error={confirmPasswordError}
                disabled={isSubmitting}
                showToggle
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                showPassword={showConfirmPassword}
                dir="ltr"
              />

              {/* Phone Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-300">رقم الهاتف</Label>
                <div className="flex gap-2">
                  <CountryCodeSelect
                    value={countryCode}
                    onChange={setCountryCode}
                    disabled={isSubmitting}
                  />
                  <div className="relative group flex-1">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="رقم الهاتف"
                      className="pr-10 h-12 bg-slate-800/60 border-2 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 hover:border-slate-600"
                      dir="ltr"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                {phoneError && (
                  <div className="flex items-center gap-2 text-sm text-red-400 animate-fadeIn">
                    <AlertCircle className="w-4 h-4" />
                    <span>{phoneError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Store Info */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-slideIn">
              <AnimatedInput
                icon={<Store className="w-5 h-5" />}
                label="اسم المتجر"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="أدخل اسم متجرك"
                error={storeNameError}
                disabled={isSubmitting}
              />

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-300">وصف المتجر</Label>
                <div className="relative">
                  <Textarea
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="صف متجرك بإيجاز (10 أحرف على الأقل)"
                    className="min-h-[100px] bg-slate-800/60 border-2 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 hover:border-slate-600"
                    disabled={isSubmitting}
                  />
                </div>
                {storeDescError && (
                  <div className="flex items-center gap-2 text-sm text-red-400 animate-fadeIn">
                    <AlertCircle className="w-4 h-4" />
                    <span>{storeDescError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <Briefcase className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <p className="text-xs text-slate-400">
                  اختر اسماً مميزاً لمتجرك يعكس هويتك التجارية
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Category */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-slideIn">
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {categoriesQuery.data?.map((category: any) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.nameAr)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                      selectedCategory === category.nameAr
                        ? "border-purple-500 bg-purple-500/20 scale-[1.02]"
                        : "border-slate-700 bg-slate-800/30 hover:border-purple-500/50 hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="text-3xl mb-2 block">{category.icon}</span>
                    <span className={`text-sm font-medium ${
                      selectedCategory === category.nameAr ? "text-white" : "text-slate-300"
                    }`}>
                      {category.nameAr}
                    </span>
                    {selectedCategory === category.nameAr && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-purple-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Plan Selection */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-slideIn">
              {(Object.keys(PLANS) as Plan[]).map((planKey) => {
                const plan = PLANS[planKey];
                const Icon = plan.icon;
                const isSelected = selectedPlan === planKey;
                const colorClasses = {
                  cyan: { border: "border-cyan-500", bg: "bg-cyan-500/20", text: "text-cyan-400", glow: "from-cyan-500" },
                  amber: { border: "border-amber-500", bg: "bg-amber-500/20", text: "text-amber-400", glow: "from-amber-500" },
                  purple: { border: "border-purple-500", bg: "bg-purple-500/20", text: "text-purple-400", glow: "from-purple-500" },
                };
                const colors = colorClasses[plan.color as keyof typeof colorClasses];
                
                return (
                  <button
                    key={planKey}
                    onClick={() => setSelectedPlan(planKey)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-right relative overflow-hidden ${
                      isSelected
                        ? `${colors.border} ${colors.bg} scale-[1.02]`
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    {isSelected && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${colors.glow} to-transparent opacity-10`} />
                    )}
                    
                    <div className="relative flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? colors.bg : "bg-slate-800"
                        }`}>
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div>
                          <span className="text-white font-bold block">{plan.name}</span>
                          {planKey === "community" && (
                            <span className="text-xs text-purple-400">الأكثر شعبية</span>
                          )}
                        </div>
                      </div>
                      <span className={`font-bold text-lg ${colors.text}`}>
                        {plan.price === 0 ? "مجاناً" : `$${plan.price}/شهر`}
                      </span>
                    </div>
                    
                    <ul className="relative text-sm text-slate-400 space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className={`w-4 h-4 ${colors.text}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    
                    {isSelected && (
                      <div className="absolute top-4 left-4">
                        <CheckCircle className={`w-6 h-6 ${colors.text}`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 5: OTP Verification */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-slideIn">
              <p className="text-slate-400 text-center text-sm">
                أدخل رمز التحقق المرسل إلى<br />
                <span className="text-purple-400 font-medium">{email}</span>
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
                    disabled={isSubmitting}
                    className={`w-12 h-14 text-center text-2xl font-bold bg-slate-800/60 border-2 rounded-xl text-white transition-all duration-300 focus:outline-none ${
                      digit 
                        ? "border-purple-500 ring-2 ring-purple-500/20" 
                        : "border-slate-700 focus:border-purple-500"
                    }`}
                  />
                ))}
              </div>
              
              <Button
                onClick={handleVerifyOtp}
                disabled={isSubmitting || otpDigits.join("").length !== 6}
                className="w-full h-14 relative overflow-hidden group bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري التحقق...</span>
                  </div>
                ) : (
                  <span>تأكيد الرمز</span>
                )}
              </Button>
              
              <button
                onClick={() => {
                  setIsSubmitting(true);
                  registerMutation.mutate({ name, email, password, phoneNumber, countryCode });
                }}
                className="w-full text-center text-sm text-slate-400 hover:text-purple-400 transition-colors"
                disabled={isSubmitting}
              >
                لم تستلم الرمز؟ إعادة الإرسال
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <Button
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="w-full h-14 mt-6 relative overflow-hidden group bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري المعالجة...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{currentStep === 4 ? "إرسال رمز التحقق" : "التالي"}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              )}
            </Button>
          )}

          {/* Login Link */}
          <div className="text-center mt-6 pt-6 border-t border-slate-800">
            <p className="text-slate-400">
              لديك حساب بالفعل؟{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-300 hover:underline"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
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
