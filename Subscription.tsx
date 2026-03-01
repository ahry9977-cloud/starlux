import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { 
  Crown, Zap, Check, CreditCard, Smartphone, Building2, 
  ArrowRight, Loader2, Shield, Star, Sparkles 
} from 'lucide-react';

type PaymentMethod = 'zain_cash' | 'mastercard' | 'visa' | 'asia_pay' | null;
type SubscriptionPlan = 'free' | 'pro' | 'community';

interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  nameAr: string;
  price: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

export default function Subscription() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // بيانات الدفع
  const [paymentData, setPaymentData] = useState({
    phoneNumber: '', // لـ Zain Cash
    cardNumber: '', // لـ MasterCard
    expiryDate: '',
    cvv: '',
  });

  // خطط الاشتراك
  const plans: PlanDetails[] = [
    {
      id: 'free',
      name: 'Free',
      nameAr: 'مجانية',
      price: 0,
      icon: <Star className="w-6 h-6" />,
      features: [
        'متجر واحد',
        '10 منتجات كحد أقصى',
        'صور وفيديو فقط',
        'حد الملف: 5MB',
        'دعم عبر البريد',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      nameAr: 'احترافية',
      price: 50,
      icon: <Zap className="w-6 h-6" />,
      popular: true,
      features: [
        'متجر واحد',
        'منتجات غير محدودة',
        'ملفات قابلة للتحميل',
        'حد الملف: 50MB',
        'دعم فني أولوية',
        'تحليلات متقدمة',
      ],
    },
    {
      id: 'community',
      name: 'Community',
      nameAr: 'مجتمعية',
      price: 80,
      icon: <Crown className="w-6 h-6" />,
      features: [
        'جميع ميزات Pro',
        'أولوية في نتائج البحث',
        'شارة متجر مميز',
        'تقارير مبيعات متقدمة',
        'دعم فني 24/7',
        'ترويج مجاني شهرياً',
      ],
    },
  ];

  // طرق الدفع
  const paymentMethods = [
    {
      id: 'zain_cash' as PaymentMethod,
      name: 'Zain Cash',
      nameAr: 'زين كاش',
      icon: <Smartphone className="w-6 h-6 text-green-500" />,
      description: 'الدفع عبر محفظة زين كاش',
    },
    {
      id: 'mastercard' as PaymentMethod,
      name: 'MasterCard',
      nameAr: 'ماستركارد',
      icon: <CreditCard className="w-6 h-6 text-orange-500" />,
      description: 'الدفع ببطاقة الائتمان',
    },
    {
      id: 'visa' as PaymentMethod,
      name: 'Visa',
      nameAr: 'فيزا',
      icon: <CreditCard className="w-6 h-6 text-blue-600" />,
      description: 'الدفع ببطاقة الائتمان',
    },
    {
      id: 'asia_pay' as PaymentMethod,
      name: 'Asia Pay',
      nameAr: 'آسيا باي',
      icon: <Building2 className="w-6 h-6 text-blue-500" />,
      description: 'الدفع عبر آسيا باي',
    },
  ];

  // معالجة الدفع
  const handlePayment = async () => {
    if (!selectedPlan || selectedPlan === 'free') {
      setError('يرجى اختيار خطة مدفوعة');
      return;
    }
    if (!paymentMethod) {
      setError('يرجى اختيار طريقة الدفع');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // محاكاة معالجة الدفع
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('تم الدفع بنجاح! جاري تفعيل الاشتراك...');
      
      setTimeout(() => {
        navigate('/seller-dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'فشل في معالجة الدفع');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">خطط الاشتراك</h1>
          <p className="text-amber-200/70">اختر الخطة المناسبة لمتجرك</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* رسائل */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-200 text-center">
            {success}
          </div>
        )}

        {/* خطط الاشتراك */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative p-6 rounded-2xl cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'bg-amber-500/20 border-2 border-amber-400 scale-105'
                  : 'bg-white/5 border border-white/10 hover:border-white/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-white text-xs font-semibold">
                  الأكثر شعبية
                </div>
              )}
              
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                selectedPlan === plan.id ? 'bg-amber-400 text-amber-900' : 'bg-white/10 text-white'
              }`}>
                {plan.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{plan.nameAr}</h3>
              <p className="text-amber-200/60 text-sm mb-4">{plan.name}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  {plan.price === 0 ? 'مجاني' : `$${plan.price}`}
                </span>
                {plan.price > 0 && <span className="text-amber-200/60 text-sm">/سنة</span>}
              </div>
              
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                    <Check className={`w-4 h-4 ${selectedPlan === plan.id ? 'text-amber-400' : 'text-green-400'}`} />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {selectedPlan === plan.id && (
                <div className="absolute top-4 right-4">
                  <Check className="w-6 h-6 text-amber-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* طرق الدفع (للخطط المدفوعة فقط) */}
        {selectedPlan && selectedPlan !== 'free' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              اختر طريقة الدفع
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-xl text-right transition-all ${
                    paymentMethod === method.id
                      ? 'bg-amber-500/20 border-2 border-amber-400'
                      : 'bg-white/5 border border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {method.icon}
                    <span className="text-white font-semibold">{method.nameAr}</span>
                  </div>
                  <p className="text-amber-200/60 text-xs">{method.description}</p>
                </button>
              ))}
            </div>

            {/* نموذج الدفع حسب الطريقة المختارة */}
            {paymentMethod === 'zain_cash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-amber-200/70 mb-2">رقم هاتف زين كاش</label>
                  <Input
                    type="tel"
                    placeholder="07XX XXX XXXX"
                    value={paymentData.phoneNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <p className="text-amber-200/60 text-sm">
                  سيتم إرسال طلب دفع إلى رقم هاتفك. يرجى الموافقة على الطلب من تطبيق زين كاش.
                </p>
              </div>
            )}

            {(paymentMethod === 'mastercard' || paymentMethod === 'visa') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-amber-200/70 mb-2">رقم البطاقة</label>
                  <Input
                    type="text"
                    placeholder="XXXX XXXX XXXX XXXX"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-amber-200/70 mb-2">تاريخ الانتهاء</label>
                    <Input
                      type="text"
                      placeholder="MM/YY"
                      value={paymentData.expiryDate}
                      onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-amber-200/70 mb-2">CVV</label>
                    <Input
                      type="text"
                      placeholder="XXX"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ملخص الطلب وزر الدفع */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4">ملخص الطلب</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-white/80">
              <span>الخطة المختارة:</span>
              <span className="font-semibold text-white">
                {selectedPlan ? plans.find(p => p.id === selectedPlan)?.nameAr : 'لم يتم الاختيار'}
              </span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>المدة:</span>
              <span>سنة واحدة</span>
            </div>
            <div className="flex justify-between text-white/80">
              <span>طريقة الدفع:</span>
              <span>
                {paymentMethod ? paymentMethods.find(m => m.id === paymentMethod)?.nameAr : 'لم يتم الاختيار'}
              </span>
            </div>
            <hr className="border-white/10" />
            <div className="flex justify-between text-xl font-bold text-white">
              <span>الإجمالي:</span>
              <span className="text-amber-400">
                {selectedPlan ? `$${plans.find(p => p.id === selectedPlan)?.price || 0}` : '$0'}
              </span>
            </div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={!selectedPlan || (selectedPlan !== 'free' && !paymentMethod) || isProcessing}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                جاري المعالجة...
              </>
            ) : selectedPlan === 'free' ? (
              'تفعيل الخطة المجانية'
            ) : (
              <>
                إتمام الدفع
                <ArrowRight className="w-5 h-5 mr-2" />
              </>
            )}
          </Button>
          
          <p className="text-center text-amber-200/60 text-xs mt-4">
            بالضغط على "إتمام الدفع" أنت توافق على شروط الخدمة وسياسة الخصوصية
          </p>
        </div>
      </div>
    </div>
  );
}
