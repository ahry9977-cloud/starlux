import React, { useState } from 'react';
import { OTPInput, ResendTimer } from './OTPInput';
import { cn } from '@/lib/utils';
import { Mail, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface OTPVerificationStepProps {
  email: string;
  phone?: string;
  onVerify: (otp: string) => Promise<boolean>;
  onResend: (channel: 'email' | 'whatsapp') => Promise<boolean>;
  onBack?: () => void;
  isLoading?: boolean;
}

export const OTPVerificationStep: React.FC<OTPVerificationStepProps> = ({
  email,
  phone,
  onVerify,
  onResend,
  onBack,
  isLoading = false,
}) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendChannel, setResendChannel] = useState<'email' | 'whatsapp'>('email');
  const [resendLoading, setResendLoading] = useState(false);

  const handleComplete = async (value: string) => {
    setError('');
    setVerifying(true);
    
    try {
      const result = await onVerify(value);
      if (result) {
        setSuccess(true);
      } else {
        setError('رمز التحقق غير صحيح');
        setOtp('');
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحقق');
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      const result = await onResend(resendChannel);
      if (!result) {
        setError('فشل إعادة إرسال الرمز');
      }
    } catch {
      setError('حدث خطأ أثناء إعادة الإرسال');
    } finally {
      setResendLoading(false);
    }
  };

  // إخفاء جزء من البريد
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  const maskedPhone = phone ? phone.replace(/(.{4})(.*)(.{4})/, '$1****$3') : '';

  if (success) {
    return (
      <div className="text-center py-8 animate-fadeIn">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">تم التحقق بنجاح!</h3>
        <p className="text-white/60">جاري إكمال إنشاء حسابك...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* العنوان */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#4B00FF] to-[#FF00FF] flex items-center justify-center">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">تحقق من بريدك الإلكتروني</h3>
        <p className="text-white/60 text-sm">
          أرسلنا رمز تحقق مكون من 6 أرقام إلى
        </p>
        <p className="text-[#4B00FF] font-medium mt-1">{maskedEmail}</p>
      </div>

      {/* حقل إدخال OTP */}
      <div className="py-4">
        <OTPInput
          value={otp}
          onChange={setOtp}
          onComplete={handleComplete}
          disabled={verifying || isLoading}
          error={!!error}
        />
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="flex items-center gap-2 justify-center text-red-400 text-sm animate-shake">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* حالة التحقق */}
      {verifying && (
        <div className="flex items-center gap-2 justify-center text-[#4B00FF]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>جاري التحقق...</span>
        </div>
      )}

      {/* خيارات إعادة الإرسال */}
      <div className="space-y-4">
        {/* اختيار قناة الإرسال */}
        {phone && (
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => setResendChannel('email')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
                resendChannel === 'email'
                  ? "bg-[#4B00FF]/20 text-[#4B00FF] border border-[#4B00FF]/50"
                  : "bg-white/5 text-white/60 border border-white/10 hover:border-white/30"
              )}
            >
              <Mail className="w-4 h-4" />
              البريد
            </button>
            <button
              type="button"
              onClick={() => setResendChannel('whatsapp')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
                resendChannel === 'whatsapp'
                  ? "bg-green-500/20 text-green-400 border border-green-500/50"
                  : "bg-white/5 text-white/60 border border-white/10 hover:border-white/30"
              )}
            >
              <Phone className="w-4 h-4" />
              واتساب
            </button>
          </div>
        )}

        {/* مؤقت إعادة الإرسال */}
        <ResendTimer
          initialSeconds={60}
          onResend={handleResend}
          disabled={resendLoading}
        />
      </div>

      {/* زر العودة */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 text-white/60 hover:text-white transition-colors text-sm"
        >
          العودة لتعديل البيانات
        </button>
      )}

      {/* نصائح */}
      <div className="bg-white/5 rounded-xl p-4 text-sm text-white/50">
        <p className="font-medium text-white/70 mb-2">لم تستلم الرمز؟</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>تحقق من مجلد الرسائل غير المرغوب فيها (Spam)</li>
          <li>تأكد من صحة البريد الإلكتروني</li>
          <li>انتظر دقيقة ثم أعد الإرسال</li>
        </ul>
      </div>
    </div>
  );
};

export default OTPVerificationStep;
