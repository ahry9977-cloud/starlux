import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Eye, EyeOff, Mail, Lock, Loader2, Sparkles, ArrowRight, 
  CheckCircle2, AlertCircle, KeyRound, ShieldCheck
} from "lucide-react";

// Animated floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
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

// Input field with animations
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
  delay?: number;
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
  delay = 0,
}: AnimatedInputProps) => {
  const [focused, setFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`space-y-2 transition-all duration-500 ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <Label className={`text-sm font-medium transition-colors duration-300 ${
        focused ? "text-purple-400" : error ? "text-red-400" : "text-slate-300"
      }`}>
        {label}
      </Label>
      <div className={`relative group transition-all duration-300 ${
        error ? "animate-shake" : ""
      }`}>
        {/* Glow effect on focus */}
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
            dir="ltr"
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
      
      {/* Error message with animation */}
      <div className={`flex items-center gap-2 text-sm text-red-400 transition-all duration-300 ${
        error ? "opacity-100 translate-y-0 max-h-10" : "opacity-0 -translate-y-2 max-h-0 overflow-hidden"
      }`}>
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
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

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  
  // Validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpError, setOtpError] = useState("");
  
  // OTP input refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time validation
  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("البريد الإلكتروني غير صالح");
    } else {
      setEmailError("");
    }
  }, [email]);

  useEffect(() => {
    if (password && password.length < 8) {
      setPasswordError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    } else {
      setPasswordError("");
    }
  }, [password]);

  // CRITICAL: Redirect based on role when user is logged in
  useEffect(() => {
    if (!authLoading && user) {
      const role = user.role;
      if (role === "admin" || role === "sub_admin") {
        setLocation("/admin-dashboard");
      } else if (role === "seller") {
        setLocation("/seller-dashboard");
      } else {
        setLocation("/");
      }
    }
  }, [user, authLoading, setLocation]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      utils.auth.me.invalidate().catch(() => {});
      const role = data.role;
      if (role === "admin" || role === "sub_admin") {
        setLocation("/admin-dashboard");
      } else if (role === "seller") {
        setLocation("/seller-dashboard");
      } else {
        setLocation("/");
      }
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message || "فشل تسجيل الدخول");
    },
  });

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setResetStep(2);
      setIsSubmitting(false);
      toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message || "فشل إرسال رمز التحقق");
    },
  });

  const verifyResetOtpMutation = trpc.auth.verifyPasswordResetOtp.useMutation({
    onSuccess: (data) => {
      setResetStep(3);
      setResetToken(data.resetToken || null);
      setUserId(data.userId || null);
      setIsSubmitting(false);
      toast.success("تم التحقق من الرمز بنجاح");
    },
    onError: (error) => {
      setIsSubmitting(false);
      setOtpError("رمز التحقق غير صحيح");
      toast.error(error.message || "رمز التحقق غير صحيح");
    },
  });

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      toast.success("تم تغيير كلمة المرور بنجاح");
      setShowForgotPassword(false);
      setResetStep(1);
      setResetEmail("");
      setResetOtp("");
      setNewPassword("");
      setOtpDigits(["", "", "", "", "", ""]);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message || "فشل تغيير كلمة المرور");
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!email) {
      setEmailError("يرجى إدخال البريد الإلكتروني");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("البريد الإلكتروني غير صالح");
      return;
    }
    if (!password) {
      setPasswordError("يرجى إدخال كلمة المرور");
      return;
    }
    if (password.length < 8) {
      setPasswordError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setIsSubmitting(true);
    loginMutation.mutate({ email, password });
  };

  const handleRequestReset = () => {
    if (!resetEmail) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      toast.error("البريد الإلكتروني غير صالح");
      return;
    }
    setIsSubmitting(true);
    requestResetMutation.mutate({ email: resetEmail });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError("");
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Update resetOtp
    setResetOtp(newDigits.join(""));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setOtpError("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }
    setIsSubmitting(true);
    verifyResetOtpMutation.mutate({ email: resetEmail, otp });
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    setIsSubmitting(true);
    if (userId && resetToken) {
      resetPasswordMutation.mutate({ userId, resetToken, newPassword });
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin relative" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      
      {/* Floating particles */}
      <FloatingParticles />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Main Card */}
      <div 
        className={`relative w-full max-w-md z-10 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
        }`}
      >
        {/* Animated glow border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur-lg opacity-40 animate-gradient-xy" />
        
        {/* Glass card */}
        <div className="relative bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          
          {/* Logo & Title */}
          <div className="text-center mb-8 relative">
            <div 
              className={`inline-flex items-center gap-3 mb-4 transition-all duration-500 delay-100 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              }`}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/30 rounded-xl blur-lg animate-pulse" />
                <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                STAR LUX
              </h1>
            </div>
            
            <h2 
              className={`text-2xl font-bold text-white mb-2 transition-all duration-500 delay-200 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              }`}
            >
              {showForgotPassword ? "استعادة كلمة المرور" : "مرحباً بعودتك"}
            </h2>
            
            <p 
              className={`text-slate-400 transition-all duration-500 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
              }`}
            >
              {showForgotPassword 
                ? resetStep === 1 ? "أدخل بريدك الإلكتروني لاستعادة كلمة المرور"
                : resetStep === 2 ? "أدخل رمز التحقق المرسل إلى بريدك"
                : "أدخل كلمة المرور الجديدة"
                : "سجل دخولك للوصول إلى حسابك"
              }
            </p>
          </div>

          {/* Forgot Password Flow */}
          {showForgotPassword ? (
            <div className="space-y-6">
              {/* Step indicators */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                      resetStep >= step 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                        : "bg-slate-800 text-slate-500"
                    }`}>
                      {resetStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-12 h-0.5 mx-1 transition-all duration-500 ${
                        resetStep > step ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-slate-700"
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {resetStep === 1 && (
                <div className="space-y-6 animate-slideIn">
                  <AnimatedInput
                    icon={<Mail className="w-5 h-5" />}
                    label="البريد الإلكتروني"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="أدخل بريدك الإلكتروني"
                    disabled={isSubmitting}
                    delay={100}
                  />
                  
                  <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl animate-fadeIn">
                    <ShieldCheck className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <p className="text-sm text-slate-400">
                      سيتم إرسال رمز تحقق آمن إلى بريدك الإلكتروني
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleRequestReset}
                    disabled={isSubmitting || !resetEmail}
                    className="w-full h-14 relative overflow-hidden group bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جاري الإرسال...</span>
                      </div>
                    ) : (
                      <span>إرسال رمز التحقق</span>
                    )}
                  </Button>
                </div>
              )}

              {resetStep === 2 && (
                <div className="space-y-6 animate-slideIn">
                  <div className="space-y-3">
                    <Label className="text-slate-300 text-center block">رمز التحقق</Label>
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
                            otpError 
                              ? "border-red-500 animate-shake" 
                              : digit 
                                ? "border-purple-500 ring-2 ring-purple-500/20" 
                                : "border-slate-700 focus:border-purple-500"
                          }`}
                        />
                      ))}
                    </div>
                    {otpError && (
                      <div className="flex items-center justify-center gap-2 text-sm text-red-400 animate-fadeIn">
                        <AlertCircle className="w-4 h-4" />
                        <span>{otpError}</span>
                      </div>
                    )}
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
                </div>
              )}

              {resetStep === 3 && (
                <div className="space-y-6 animate-slideIn">
                  <AnimatedInput
                    icon={<KeyRound className="w-5 h-5" />}
                    label="كلمة المرور الجديدة"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    disabled={isSubmitting}
                    showToggle
                    onToggle={() => setShowPassword(!showPassword)}
                    showPassword={showPassword}
                    delay={100}
                  />
                  
                  <PasswordStrength password={newPassword} />
                  
                  <Button
                    onClick={handleResetPassword}
                    disabled={isSubmitting || newPassword.length < 8}
                    className="w-full h-14 relative overflow-hidden group bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جاري التغيير...</span>
                      </div>
                    ) : (
                      <span>تغيير كلمة المرور</span>
                    )}
                  </Button>
                </div>
              )}

              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetStep(1);
                  setResetEmail("");
                  setResetOtp("");
                  setNewPassword("");
                  setOtpDigits(["", "", "", "", "", ""]);
                  setOtpError("");
                }}
                className="w-full text-center text-sm text-slate-400 hover:text-purple-400 transition-colors duration-300 py-2"
              >
                ← العودة لتسجيل الدخول
              </button>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-6">
              <AnimatedInput
                icon={<Mail className="w-5 h-5" />}
                label="البريد الإلكتروني"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="أدخل بريدك الإلكتروني"
                error={emailError}
                disabled={isSubmitting}
                delay={200}
              />

              <AnimatedInput
                icon={<Lock className="w-5 h-5" />}
                label="كلمة المرور"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                error={passwordError}
                disabled={isSubmitting}
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
                delay={300}
              />

              <div 
                className={`flex justify-end transition-all duration-500 delay-400 ${
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors duration-300 hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>

              <div 
                className={`transition-all duration-500 delay-500 ${
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <Button
                  type="submit"
                  disabled={isSubmitting || !!emailError || !!passwordError}
                  className="w-full h-14 relative overflow-hidden group bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري تسجيل الدخول...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>تسجيل الدخول</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Register Link */}
          {!showForgotPassword && (
            <div 
              className={`text-center mt-8 pt-6 border-t border-slate-800 transition-all duration-500 delay-600 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <p className="text-slate-400">
                ليس لديك حساب؟{" "}
                <button
                  onClick={() => setLocation("/register")}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-300 hover:underline"
                >
                  إنشاء حساب جديد
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
        
        .animation-delay-4000 {
          animation-delay: 4s;
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
      `}</style>
    </div>
  );
}
