import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { 
  AnimatedButton, 
  ProgressIndicator, 
  CheckoutCard, 
  PaymentMethodCard,
  OrderSummaryCard,
  SuccessAnimation,
  TruckAnimation,
  SimpleProgressBar,
  type Step 
} from '@/components/checkout';
import '@/components/checkout/animations.css';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, 
  Truck, 
  CreditCard, 
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Building,
  FileText,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// خطوات الـ Checkout
const CHECKOUT_STEPS: Step[] = [
  { id: 1, title: 'السلة', description: 'مراجعة المنتجات', icon: <ShoppingCart className="w-5 h-5" /> },
  { id: 2, title: 'الشحن', description: 'عنوان التوصيل', icon: <Truck className="w-5 h-5" /> },
  { id: 3, title: 'الدفع', description: 'طريقة الدفع', icon: <CreditCard className="w-5 h-5" /> },
  { id: 4, title: 'التأكيد', description: 'مراجعة الطلب', icon: <CheckCircle2 className="w-5 h-5" /> },
];

// طرق الدفع المتاحة
type PaymentMethod = {
  id: string;
  name: string;
  icon: JSX.Element;
  description: string;
  badge?: string;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'zain_cash', name: 'زين كاش', icon: <Smartphone className="w-6 h-6 text-green-400" />, description: 'الدفع عبر زين كاش' },
  { id: 'mastercard', name: 'ماستركارد', icon: <CreditCard className="w-6 h-6 text-orange-400" />, description: 'بطاقة ائتمان' },
  { id: 'visa', name: 'فيزا', icon: <CreditCard className="w-6 h-6 text-blue-400" />, description: 'بطاقة ائتمان' },
  { id: 'asia_pay', name: 'آسيا باي', icon: <Building className="w-6 h-6 text-cyan-400" />, description: 'الدفع عبر آسيا باي' },
];

// نموذج عنوان الشحن
interface ShippingForm {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
}

// حالة التحقق
interface ValidationState {
  isValid: boolean;
  errors: Record<string, string>;
}

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  // الحالات
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    fullName: '',
    phone: '',
    country: 'العراق',
    city: '',
    address: '',
  });
  const [notes, setNotes] = useState('');
  const [validation, setValidation] = useState<ValidationState>({ isValid: false, errors: {} });
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [checkoutProgress, setCheckoutProgress] = useState(0);

  // استعلامات tRPC
  const { data: cartSummary, isLoading: cartLoading, refetch: refetchCart } = trpc.cart.getSummary.useQuery();
  
  const checkoutMutation = trpc.cart.checkout.useMutation({
    onSuccess: (data) => {
      setOrderNumber(`ORD-${data.orderIds[0]}`);
      setShowSuccess(true);
      refetchCart();
    },
    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء إتمام الطلب');
    },
  });

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // التحقق من صحة النموذج
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (currentStep >= 2) {
      if (!shippingForm.fullName.trim()) errors.fullName = 'الاسم مطلوب';
      if (!shippingForm.phone.trim()) errors.phone = 'رقم الهاتف مطلوب';
      if (shippingForm.phone && !/^[\d\s+-]+$/.test(shippingForm.phone)) {
        errors.phone = 'رقم هاتف غير صالح';
      }
      if (!shippingForm.city.trim()) errors.city = 'المدينة مطلوبة';
      if (!shippingForm.address.trim()) errors.address = 'العنوان مطلوب';
    }
    
    if (currentStep >= 3) {
      if (!selectedPayment) errors.payment = 'يرجى اختيار طريقة الدفع';
    }

    const isValid = Object.keys(errors).length === 0;
    setValidation({ isValid, errors });
    return isValid;
  }, [currentStep, shippingForm, selectedPayment]);

  // التحقق عند تغيير البيانات
  useEffect(() => {
    validateForm();
  }, [validateForm]);

  // تحديث التقدم
  useEffect(() => {
    const progress = ((currentStep - 1) / (CHECKOUT_STEPS.length - 1)) * 100;
    setCheckoutProgress(progress);
  }, [currentStep]);

  // الانتقال للخطوة التالية
  const handleNextStep = () => {
    if (validateForm() && currentStep < CHECKOUT_STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // الانتقال للخطوة السابقة
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // إتمام الطلب
  const handleCheckout = async () => {
    if (!validateForm()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!cartSummary || cartSummary.items.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    await checkoutMutation.mutateAsync({
      paymentMethod: selectedPayment as any,
      shippingAddress: shippingForm,
      notes: notes || undefined,
    });
  };

  // إغلاق شاشة النجاح
  const handleSuccessComplete = () => {
    setShowSuccess(false);
    navigate('/orders');
  };

  // تحديث حقل الشحن
  const updateShippingField = (field: keyof ShippingForm, value: string) => {
    setShippingForm(prev => ({ ...prev, [field]: value }));
  };

  // التحميل
  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // السلة فارغة
  if (!cartSummary || cartSummary.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <CheckoutCard
          title="السلة فارغة"
          icon={<ShoppingCart className="w-6 h-6 text-slate-400" />}
          variant="glass"
          className="max-w-md w-full text-center"
        >
          <p className="text-slate-400 mb-6">لا توجد منتجات في سلة التسوق</p>
          <AnimatedButton onClick={() => navigate('/products')} fullWidth>
            تصفح المنتجات
          </AnimatedButton>
        </CheckoutCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* شاشة النجاح */}
      <SuccessAnimation
        show={showSuccess}
        onComplete={handleSuccessComplete}
        title="تم الطلب بنجاح!"
        subtitle="شكراً لك على طلبك"
        orderNumber={orderNumber}
        showConfetti={true}
      />

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* العنوان */}
        <div className="text-center mb-8 animate-fadeInUp">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
            إتمام الطلب
          </h1>
          <p className="text-slate-400">أكمل بياناتك لإتمام عملية الشراء</p>
        </div>

        {/* مؤشر التقدم */}
        <div className="mb-8">
          <ProgressIndicator
            steps={CHECKOUT_STEPS}
            currentStep={currentStep}
            variant="horizontal"
            showLabels={true}
            animated={true}
          />
          <SimpleProgressBar
            progress={checkoutProgress}
            className="mt-4"
            animated={true}
          />
        </div>

        {/* المحتوى */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* القسم الأيسر - النموذج */}
          <div className="lg:col-span-2 space-y-6">
            {/* الخطوة 1: مراجعة السلة */}
            {currentStep === 1 && (
              <CheckoutCard
                title="مراجعة السلة"
                icon={<ShoppingCart className="w-5 h-5 text-cyan-400" />}
                variant="glass"
                animated={true}
              >
                <div className="space-y-4">
                  {cartSummary.items.map((item: any, index: any) => (
                    <div
                      key={item.productId}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl bg-slate-800/50",
                        "animate-fadeInUp"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.productName}</h3>
                        <p className="text-sm text-slate-400">الكمية: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-cyan-400">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CheckoutCard>
            )}

            {/* الخطوة 2: عنوان الشحن */}
            {currentStep === 2 && (
              <CheckoutCard
                title="عنوان الشحن"
                icon={<MapPin className="w-5 h-5 text-cyan-400" />}
                variant="glass"
                animated={true}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  {/* الاسم الكامل */}
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      الاسم الكامل *
                    </label>
                    <Input
                      value={shippingForm.fullName}
                      onChange={(e) => updateShippingField('fullName', e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      className={cn(
                        "checkout-input bg-slate-800/50 border-slate-700",
                        validation.errors.fullName && "checkout-input-error border-red-500"
                      )}
                    />
                    {validation.errors.fullName && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validation.errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* رقم الهاتف */}
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      رقم الهاتف *
                    </label>
                    <Input
                      value={shippingForm.phone}
                      onChange={(e) => updateShippingField('phone', e.target.value)}
                      placeholder="07XX XXX XXXX"
                      className={cn(
                        "checkout-input bg-slate-800/50 border-slate-700",
                        validation.errors.phone && "checkout-input-error border-red-500"
                      )}
                    />
                    {validation.errors.phone && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validation.errors.phone}
                      </p>
                    )}
                  </div>

                  {/* المدينة */}
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      المدينة *
                    </label>
                    <Input
                      value={shippingForm.city}
                      onChange={(e) => updateShippingField('city', e.target.value)}
                      placeholder="بغداد، البصرة، أربيل..."
                      className={cn(
                        "checkout-input bg-slate-800/50 border-slate-700",
                        validation.errors.city && "checkout-input-error border-red-500"
                      )}
                    />
                    {validation.errors.city && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validation.errors.city}
                      </p>
                    )}
                  </div>

                  {/* البلد */}
                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      البلد
                    </label>
                    <Input
                      value={shippingForm.country}
                      onChange={(e) => updateShippingField('country', e.target.value)}
                      placeholder="العراق"
                      className="checkout-input bg-slate-800/50 border-slate-700"
                    />
                  </div>

                  {/* العنوان التفصيلي */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm text-slate-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      العنوان التفصيلي *
                    </label>
                    <Textarea
                      value={shippingForm.address}
                      onChange={(e) => updateShippingField('address', e.target.value)}
                      placeholder="المنطقة، الشارع، رقم المبنى، أقرب نقطة دالة..."
                      rows={3}
                      className={cn(
                        "checkout-input bg-slate-800/50 border-slate-700 resize-none",
                        validation.errors.address && "checkout-input-error border-red-500"
                      )}
                    />
                    {validation.errors.address && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validation.errors.address}
                      </p>
                    )}
                  </div>
                </div>
              </CheckoutCard>
            )}

            {/* الخطوة 3: طريقة الدفع */}
            {currentStep === 3 && (
              <CheckoutCard
                title="طريقة الدفع"
                icon={<CreditCard className="w-5 h-5 text-cyan-400" />}
                variant="glass"
                animated={true}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  {PAYMENT_METHODS.map((method, index) => (
                    <div
                      key={method.id}
                      className="animate-fadeInUp"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <PaymentMethodCard
                        name={method.name}
                        icon={method.icon}
                        description={method.description}
                        isSelected={selectedPayment === method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        badge={method.badge}
                      />
                    </div>
                  ))}
                </div>
                {validation.errors.payment && (
                  <p className="text-sm text-red-400 flex items-center gap-1 mt-4">
                    <AlertCircle className="w-4 h-4" />
                    {validation.errors.payment}
                  </p>
                )}
              </CheckoutCard>
            )}

            {/* الخطوة 4: المراجعة النهائية */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* ملخص العنوان */}
                <CheckoutCard
                  title="عنوان الشحن"
                  icon={<MapPin className="w-5 h-5 text-emerald-400" />}
                  variant="glass"
                  isCompleted={true}
                  animated={true}
                >
                  <div className="text-slate-300">
                    <p className="font-semibold">{shippingForm.fullName}</p>
                    <p>{shippingForm.phone}</p>
                    <p>{shippingForm.address}</p>
                    <p>{shippingForm.city}، {shippingForm.country}</p>
                  </div>
                </CheckoutCard>

                {/* ملخص الدفع */}
                <CheckoutCard
                  title="طريقة الدفع"
                  icon={<CreditCard className="w-5 h-5 text-emerald-400" />}
                  variant="glass"
                  isCompleted={true}
                  animated={true}
                  delay={200}
                >
                  <div className="flex items-center gap-3">
                    {PAYMENT_METHODS.find(m => m.id === selectedPayment)?.icon}
                    <span className="font-semibold">
                      {PAYMENT_METHODS.find(m => m.id === selectedPayment)?.name}
                    </span>
                  </div>
                </CheckoutCard>

                {/* ملاحظات */}
                <CheckoutCard
                  title="ملاحظات إضافية"
                  icon={<FileText className="w-5 h-5 text-cyan-400" />}
                  variant="glass"
                  animated={true}
                  delay={400}
                >
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي ملاحظات خاصة بالطلب (اختياري)"
                    rows={3}
                    className="checkout-input bg-slate-800/50 border-slate-700 resize-none"
                  />
                </CheckoutCard>

                {/* أنيميشن الشاحنة */}
                {checkoutMutation.isPending && (
                  <TruckAnimation show={true} progress={50} className="my-6" />
                )}
              </div>
            )}

            {/* أزرار التنقل */}
            <div className="flex justify-between gap-4 pt-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={cn(
                  "flex items-center gap-2 px-6",
                  currentStep === 1 && "opacity-50 cursor-not-allowed"
                )}
              >
                <ArrowRight className="w-4 h-4" />
                السابق
              </Button>

              {currentStep < CHECKOUT_STEPS.length ? (
                <AnimatedButton
                  onClick={handleNextStep}
                  state={validation.isValid ? 'active' : 'disabled'}
                  disabled={!validation.isValid}
                  className="flex items-center gap-2"
                >
                  التالي
                  <ArrowLeft className="w-4 h-4" />
                </AnimatedButton>
              ) : (
                <AnimatedButton
                  onClick={handleCheckout}
                  state={checkoutMutation.isPending ? 'loading' : (validation.isValid ? 'active' : 'disabled')}
                  disabled={!validation.isValid || checkoutMutation.isPending}
                  showTruck={true}
                  loadingText="جاري إتمام الطلب..."
                  successText="تم الطلب بنجاح!"
                  size="lg"
                  className="min-w-[200px]"
                >
                  إكمال الطلب
                </AnimatedButton>
              )}
            </div>
          </div>

          {/* القسم الأيمن - ملخص الطلب */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <OrderSummaryCard
                items={cartSummary.items.map((item: any) => ({
                  name: item.productName,
                  quantity: item.quantity,
                  price: Number(item.price),
                  image: item.productImage,
                }))}
                subtotal={cartSummary.subtotal}
                shipping={0}
                discount={0}
                total={cartSummary.total}
                currency="USD"
              />

              {/* معلومات العمولة */}
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-400">
                  <span className="font-semibold">ملاحظة:</span> يتم استقطاع عمولة {cartSummary.commissionRate}% من قيمة الطلب
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
