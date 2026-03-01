import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Check, 
  CreditCard,
  Loader2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreditCardVisual, detectCardType } from './CreditCardVisual';
import {
  CardNumberInput,
  ExpiryDateInput,
  CVVInput,
  CardHolderInput,
  useCardForm,
} from './CardInputFields';
import './card-animations.css';

// أنواع طرق الدفع
type PaymentMethod = 'card' | 'zain_cash' | 'mastercard' | 'wallet';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'card',
    name: 'بطاقة ائتمان',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Visa, Mastercard, Amex',
  },
  {
    id: 'zain_cash',
    name: 'زين كاش',
    icon: <span className="text-lg">💳</span>,
    description: 'الدفع عبر زين كاش',
  },
  {
    id: 'wallet',
    name: 'المحفظة',
    icon: <span className="text-lg">👛</span>,
    description: 'رصيد المحفظة',
  },
];

// مكون اختيار طريقة الدفع
function PaymentMethodSelector({
  selected,
  onSelect,
  className,
}: {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-slate-400">طريقة الدفع</h3>
      <div className="grid grid-cols-3 gap-3">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={cn(
              'relative p-4 rounded-xl border transition-all duration-300',
              'flex flex-col items-center gap-2 text-center',
              'hover:bg-slate-800/50 micro-bounce',
              selected === method.id
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 bg-slate-800/30'
            )}
          >
            {selected === method.id && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              selected === method.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'
            )}>
              {method.icon}
            </div>
            <span className="text-xs font-medium text-white">{method.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// مكون مؤشر التقدم
function ProgressSteps({ currentStep }: { currentStep: number }) {
  const steps = ['طريقة الدفع', 'بيانات البطاقة', 'التأكيد'];
  
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300',
              index + 1 <= currentStep
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-800 text-slate-500'
            )}
          >
            <span
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px]',
                index + 1 <= currentStep ? 'bg-cyan-500 text-white' : 'bg-slate-700'
              )}
            >
              {index + 1 < currentStep ? <Check className="w-3 h-3" /> : index + 1}
            </span>
            <span className="hidden sm:inline">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <ChevronRight className="w-4 h-4 text-slate-600 mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

// مكون زر الدفع
function PayButton({
  isEnabled,
  isLoading,
  isSuccess,
  onClick,
  amount,
}: {
  isEnabled: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  onClick: () => void;
  amount: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!isEnabled || isLoading}
      className={cn(
        'relative w-full py-4 px-6 rounded-xl font-bold text-white',
        'transition-all duration-500 overflow-hidden',
        'focus:outline-none focus:ring-4 focus:ring-cyan-400/50',
        isEnabled && !isLoading && !isSuccess
          ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:shadow-2xl hover:shadow-cyan-500/25 button-pulse'
          : isSuccess
          ? 'bg-gradient-to-r from-emerald-500 to-green-600'
          : 'bg-slate-700 cursor-not-allowed opacity-50'
      )}
    >
      {/* تأثير اللمعان */}
      {isEnabled && !isLoading && !isSuccess && (
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.3) 50%, transparent 55%)',
            backgroundSize: '200% 200%',
            animation: 'shine 2s ease-in-out infinite',
          }}
        />
      )}

      <div className="relative flex items-center justify-center gap-3">
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري المعالجة...</span>
          </>
        ) : isSuccess ? (
          <>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span>تم الدفع بنجاح!</span>
            <Sparkles className="w-5 h-5" />
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            <span>ادفع {amount.toLocaleString()} د.ع</span>
          </>
        )}
      </div>
    </button>
  );
}

// مكون شارات الأمان
function SecurityBadges() {
  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Shield className="w-4 h-4 text-emerald-500" />
        <span>معاملة آمنة</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Lock className="w-4 h-4 text-cyan-500" />
        <span>تشفير SSL</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <CreditCard className="w-4 h-4 text-purple-500" />
        <span>PCI DSS</span>
      </div>
    </div>
  );
}

// الصفحة الرئيسية
interface CardInputPageProps {
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function CardInputPage({
  amount,
  onSuccess,
  onCancel,
  className,
}: CardInputPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const {
    formData,
    validation,
    focusedField,
    setFocusedField,
    isFormValid,
    updateField,
    resetForm,
  } = useCardForm();

  // تحديد نوع البطاقة
  const cardType = detectCardType(formData.cardNumber);

  // معالجة الدفع
  const handlePayment = useCallback(async () => {
    if (!isFormValid || isLoading) return;

    setIsLoading(true);

    try {
      // محاكاة عملية الدفع
      await new Promise(resolve => setTimeout(resolve, 2000));

      // نجاح الدفع
      setIsSuccess(true);
      setCurrentStep(3);

      // استدعاء callback النجاح
      setTimeout(() => {
        onSuccess?.();
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, isLoading, onSuccess]);

  // قلب البطاقة عند التركيز على CVV
  useEffect(() => {
    setIsCardFlipped(focusedField === 'cvv');
  }, [focusedField]);

  // الانتقال للخطوة التالية
  const handleNextStep = () => {
    if (currentStep === 1 && paymentMethod === 'card') {
      setCurrentStep(2);
    }
  };

  return (
    <div className={cn('min-h-screen animated-background soft-glow-bg', className)}>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* الرأس */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>العودة</span>
          </button>
          <h1 className="text-xl font-bold text-white">إتمام الدفع</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* مؤشر التقدم */}
        <ProgressSteps currentStep={currentStep} />

        {/* المحتوى الرئيسي */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* البطاقة المرئية */}
          <div className="flex justify-center lg:sticky lg:top-8">
            <div className="card-floating">
              <CreditCardVisual
                cardNumber={formData.cardNumber}
                cardHolder={formData.cardHolder}
                expiryDate={formData.expiryDate}
                cvv={formData.cvv}
                isFlipped={isCardFlipped}
                isFocused={
                  focusedField === 'cardNumber' ? 'number' :
                  focusedField === 'cardHolder' ? 'holder' :
                  focusedField === 'expiryDate' ? 'expiry' :
                  focusedField === 'cvv' ? 'cvv' : null
                }
              />
            </div>
          </div>

          {/* النموذج */}
          <div className="glass-card rounded-2xl p-6 space-y-6">
            {currentStep === 1 && (
              <>
                <PaymentMethodSelector
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                />

                <Button
                  onClick={handleNextStep}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                >
                  متابعة
                  <ChevronRight className="w-4 h-4 mr-2" />
                </Button>
              </>
            )}

            {currentStep === 2 && paymentMethod === 'card' && (
              <>
                <CardNumberInput
                  value={formData.cardNumber}
                  onChange={(v) => updateField('cardNumber', v)}
                  onFocus={() => setFocusedField('cardNumber')}
                  onBlur={() => setFocusedField(null)}
                  validation={validation.cardNumber}
                />

                <CardHolderInput
                  value={formData.cardHolder}
                  onChange={(v) => updateField('cardHolder', v)}
                  onFocus={() => setFocusedField('cardHolder')}
                  onBlur={() => setFocusedField(null)}
                  validation={validation.cardHolder}
                />

                <div className="grid grid-cols-2 gap-4">
                  <ExpiryDateInput
                    value={formData.expiryDate}
                    onChange={(v) => updateField('expiryDate', v)}
                    onFocus={() => setFocusedField('expiryDate')}
                    onBlur={() => setFocusedField(null)}
                    validation={validation.expiryDate}
                  />

                  <CVVInput
                    value={formData.cvv}
                    onChange={(v) => updateField('cvv', v)}
                    onFocus={() => setFocusedField('cvv')}
                    onBlur={() => setFocusedField(null)}
                    validation={validation.cvv}
                    maxLength={cardType === 'amex' ? 4 : 3}
                  />
                </div>

                {/* ملخص المبلغ */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">المبلغ الإجمالي</span>
                    <span className="text-xl font-bold text-white">
                      {amount.toLocaleString()} د.ع
                    </span>
                  </div>
                </div>

                <PayButton
                  isEnabled={isFormValid}
                  isLoading={isLoading}
                  isSuccess={isSuccess}
                  onClick={handlePayment}
                  amount={amount}
                />

                <SecurityBadges />
              </>
            )}

            {currentStep === 3 && isSuccess && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  تم الدفع بنجاح!
                </h2>
                <p className="text-slate-400 mb-6">
                  شكراً لك، تم إتمام عملية الدفع بنجاح
                </p>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-6">
                  <div className="text-sm text-slate-400 mb-1">المبلغ المدفوع</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {amount.toLocaleString()} د.ع
                  </div>
                </div>
                <Button
                  onClick={onCancel}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600"
                >
                  العودة للصفحة الرئيسية
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardInputPage;
