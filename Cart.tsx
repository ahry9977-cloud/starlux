import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import { 
  ShoppingCart, Trash2, Plus, Minus, CreditCard, 
  ArrowRight, Loader2, Package, Store, AlertCircle,
  ShoppingBag, Heart, ArrowLeft
} from 'lucide-react';

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    title: string;
    price: string;
    images: string[] | null;
    stock: number | null;
    store?: {
      id: number;
      name: string;
    };
  };
}

export default function Cart() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // tRPC queries
  const cartQuery = trpc.cart.getCart.useQuery(undefined, {
    enabled: !!user,
  });

  // tRPC mutations
  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => {
      cartQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeItemMutation = trpc.cart.removeItem.useMutation({
    onSuccess: () => {
      toast.success('تم حذف المنتج من السلة');
      cartQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const clearCartMutation = trpc.cart.clearCart.useMutation({
    onSuccess: () => {
      toast.success('تم تفريغ السلة');
      cartQuery.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10 max-w-md">
          <ShoppingCart className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">سلة التسوق</h2>
          <p className="text-amber-200/70 mb-6">يرجى تسجيل الدخول لعرض سلة التسوق الخاصة بك</p>
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              تسجيل الدخول
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const cartItems = (cartQuery.data || []) as any[];
  const isLoading = cartQuery.isLoading;

  // Calculate totals
  const subtotal = cartItems.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.priceAtAdd || '0') * item.quantity);
  }, 0);
  const shipping = subtotal > 50 ? 0 : 5; // شحن مجاني للطلبات فوق $50
  const total = subtotal + shipping;

  // Update quantity
  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
  };

  // Remove item
  const handleRemoveItem = (itemId: number) => {
    removeItemMutation.mutate({ itemId });
  };

  // Checkout
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('السلة فارغة');
      return;
    }
    setIsCheckingOut(true);
    // Navigate to checkout page
    setTimeout(() => {
      navigate('/checkout');
      setIsCheckingOut(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-amber-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">سلة التسوق</h1>
                <p className="text-amber-200/70 text-sm">
                  {cartItems.length} {cartItems.length === 1 ? 'منتج' : 'منتجات'}
                </p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 ml-2" />
                متابعة التسوق
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : cartItems.length === 0 ? (
          // Empty cart
          <div className="text-center py-20">
            <ShoppingBag className="w-24 h-24 text-amber-400/30 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">سلة التسوق فارغة</h2>
            <p className="text-amber-200/70 mb-8">لم تقم بإضافة أي منتجات بعد</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                تصفح المنتجات
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Clear cart button */}
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearCartMutation.mutate()}
                  disabled={clearCartMutation.isPending}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  تفريغ السلة
                </Button>
              </div>

              {cartItems.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white/5 rounded-xl border border-white/10 p-4 flex gap-4"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-white/30" />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">منتج #{item.productId}</h3>
                    <p className="text-amber-400 font-bold mt-2">${item.priceAtAdd}</p>
                    
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex flex-col items-end justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-white font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={updateQuantityMutation.isPending}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Total for item */}
                    <p className="text-white font-bold">
                      ${(parseFloat(item.priceAtAdd || '0') * item.quantity).toFixed(2)}
                    </p>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removeItemMutation.isPending}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 rounded-xl border border-white/10 p-6 sticky top-4">
                <h2 className="text-xl font-bold text-white mb-6">ملخص الطلب</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-white/80">
                    <span>المجموع الفرعي</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>الشحن</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-green-400">مجاني</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {subtotal < 50 && (
                    <p className="text-amber-200/60 text-xs">
                      أضف ${(50 - subtotal).toFixed(2)} للحصول على شحن مجاني
                    </p>
                  )}
                  <hr className="border-white/10" />
                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>الإجمالي</span>
                    <span className="text-amber-400">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || cartItems.length === 0}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 ml-2" />
                      إتمام الشراء
                    </>
                  )}
                </Button>

                {/* Trust badges */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="text-amber-200/60 text-xs">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      دفع آمن
                    </div>
                    <div className="text-amber-200/60 text-xs">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      حماية المشتري
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
