import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { 
  Loader2, CreditCard, Smartphone, Building2
} from 'lucide-react';
import { toast } from 'sonner';

// طرق الدفع المتاحة للاشتراكات
const PAYMENT_METHODS = [
  { id: 'zain_cash', name: 'Zain Cash', nameAr: 'زين كاش', icon: Smartphone },
  { id: 'mastercard', name: 'MasterCard', nameAr: 'ماستركارد', icon: CreditCard },
  { id: 'visa', name: 'Visa', nameAr: 'فيزا', icon: CreditCard },
  { id: 'asia_pay', name: 'Asia Pay', nameAr: 'آسيا باي', icon: Building2 },
];

// معلومات الدفع للمنصة
const PLATFORM_PAYMENT_INFO = {
  zain_cash: { phone: '+9647501261239' },
  asia_pay: { phone: '+9647501261239' },
};

const PLANS = {
  pro: { name: 'Pro', nameAr: 'احترافية', price: 50 },
  community: { name: 'Community', nameAr: 'مجتمعية', price: 80 },
};

export default function SubscriptionPayment() {
  const [, navigate] = useLocation();
  const searchString = useSearch();

  const [selectedMethod, setSelectedMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  
  // استخراج البيانات من URL
  const params = new URLSearchParams(searchString);
  const plan = params.get('plan') as 'pro' | 'community' | null;
  const email = params.get('email');
  const isNewRegistration = params.get('newRegistration') === 'true';
  
  const confirmPaymentMutation = trpc.subscription.confirmPayment.useMutation();
  
  useEffect(() => {
    if (!plan || !PLANS[plan]) {
      navigate('/register');
    }
  }, [plan, navigate]);
  
  if (!plan || !PLANS[plan]) {
    return null;
  }
  
  const planInfo = PLANS[plan];
  const selectedMethodInfo = useMemo(
    () => PAYMENT_METHODS.find((m) => m.id === selectedMethod),
    [selectedMethod]
  );

  const paymentInfo = useMemo(() => {
    if (!selectedMethod) return null;
    return (PLATFORM_PAYMENT_INFO as any)[selectedMethod] ?? null;
  }, [selectedMethod]);
  
  const handleSubmitPayment = async () => {
    if (!selectedMethod) {
      toast.error('يرجى اختيار طريقة الدفع');
      return;
    }
    
    if (!transactionId) {
      toast.error('يرجى إدخال رقم العملية أو إيصال الدفع');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await confirmPaymentMutation.mutateAsync({
        plan,
        paymentMethod: selectedMethod as any,
        transactionId,
        amount: planInfo.price,
      });

      setPaymentSubmitted(true);

      if (isNewRegistration && email) {
        navigate(`/login?email=${encodeURIComponent(email)}`);
      }
    } catch (e: any) {
      toast.error(e?.message || 'فشل تأكيد الدفع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>الدفع للاشتراك</CardTitle>
          <CardDescription>
            الخطة: {planInfo.nameAr} — ${planInfo.price}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              const isActive = selectedMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id)}
                  className={
                    `flex items-center gap-2 rounded-md border p-3 text-right transition ` +
                    (isActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40')
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{m.nameAr}</span>
                </button>
              );
            })}
          </div>

          {selectedMethodInfo && paymentInfo && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              {'phone' in paymentInfo ? (
                <div>رقم الدفع: {(paymentInfo as any).phone}</div>
              ) : (
                <div>—</div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">رقم العملية / إيصال الدفع</div>
            <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
          </div>

          <Button className="w-full" onClick={handleSubmitPayment} disabled={isLoading || paymentSubmitted}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الإرسال...
              </span>
            ) : paymentSubmitted ? (
              'تم الإرسال'
            ) : (
              'تأكيد الدفع'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}