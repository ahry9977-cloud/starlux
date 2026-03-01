import { cn } from '@/lib/utils';
import { Check, ChevronLeft } from 'lucide-react';
import './animations.css';

interface CheckoutCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  animated?: boolean;
  variant?: 'default' | 'glass' | 'neon' | 'gradient';
  delay?: number;
}

export function CheckoutCard({
  children,
  className,
  title,
  subtitle,
  icon,
  isSelected = false,
  isCompleted = false,
  onClick,
  animated = true,
  variant = 'glass',
  delay = 0,
}: CheckoutCardProps) {
  const variantClasses = {
    default: 'bg-slate-800/80 border-slate-700',
    glass: 'glass-card',
    neon: 'glass-card neon-border',
    gradient: 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'checkout-card relative p-6 rounded-2xl border transition-all duration-300',
        variantClasses[variant],
        isSelected && 'checkout-card-selected border-cyan-500',
        isCompleted && 'border-emerald-500/50',
        onClick && 'cursor-pointer hover:border-cyan-400/50',
        animated && 'animate-fadeInUp opacity-0',
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {/* رأس البطاقة */}
      {(title || icon) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br from-cyan-500/20 to-purple-600/20',
                  'border border-cyan-500/30',
                  isSelected && 'from-cyan-500/30 to-purple-600/30 border-cyan-400/50',
                  isCompleted && 'from-emerald-500/30 to-green-600/30 border-emerald-400/50'
                )}
              >
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3
                  className={cn(
                    'font-bold text-lg',
                    isSelected && 'text-cyan-400',
                    isCompleted && 'text-emerald-400'
                  )}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
          
          {/* مؤشر الاكتمال */}
          {isCompleted && (
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center animate-fadeInScale">
              <Check className="w-5 h-5 text-white" />
            </div>
          )}
          
          {/* مؤشر التحديد */}
          {isSelected && !isCompleted && (
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </div>
      )}

      {/* المحتوى */}
      <div className="relative">
        {children}
      </div>

      {/* تأثير التوهج عند التحديد */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-purple-600/5" />
          <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 blur-sm -z-10" />
        </div>
      )}
    </div>
  );
}

// مكون بطاقة طريقة الدفع
interface PaymentMethodCardProps {
  name: string;
  icon: React.ReactNode;
  description?: string;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}

export function PaymentMethodCard({
  name,
  icon,
  description,
  isSelected = false,
  onClick,
  disabled = false,
  badge,
}: PaymentMethodCardProps) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all duration-300',
        'bg-slate-800/50 backdrop-blur-sm',
        isSelected
          ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
          : 'border-slate-700 hover:border-slate-600',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer hover:scale-[1.02]'
      )}
    >
      <div className="flex items-center gap-4">
        {/* الأيقونة */}
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            'bg-gradient-to-br from-slate-700 to-slate-800',
            isSelected && 'from-cyan-500/20 to-purple-600/20'
          )}
        >
          {icon}
        </div>

        {/* المعلومات */}
        <div className="flex-1">
          <p
            className={cn(
              'font-semibold',
              isSelected ? 'text-cyan-400' : 'text-white'
            )}
          >
            {name}
          </p>
          {description && (
            <p className="text-sm text-slate-400">{description}</p>
          )}
        </div>

        {/* مؤشر التحديد */}
        <div
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center',
            'transition-all duration-300',
            isSelected
              ? 'border-cyan-500 bg-cyan-500'
              : 'border-slate-600'
          )}
        >
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </div>
      </div>

      {/* الشارة */}
      {badge && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          {badge}
        </div>
      )}
    </div>
  );
}

// مكون بطاقة ملخص الطلب
interface OrderSummaryCardProps {
  items: {
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
  subtotal: number;
  shipping?: number;
  discount?: number;
  total: number;
  currency?: string;
}

export function OrderSummaryCard({
  items,
  subtotal,
  shipping = 0,
  discount = 0,
  total,
  currency = 'USD',
}: OrderSummaryCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency,
    }).format(price);
  };

  return (
    <CheckoutCard
      title="ملخص الطلب"
      icon={<ChevronLeft className="w-5 h-5 text-cyan-400" />}
      variant="glass"
    >
      {/* قائمة المنتجات */}
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 animate-fadeInUp"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-slate-400">الكمية: {item.quantity}</p>
            </div>
            <p className="font-semibold text-cyan-400">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* الفاصل */}
      <div className="border-t border-slate-700/50 my-4" />

      {/* التفاصيل المالية */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">المجموع الفرعي</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {shipping > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">الشحن</span>
            <span>{formatPrice(shipping)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>الخصم</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
      </div>

      {/* الفاصل */}
      <div className="border-t border-slate-700/50 my-4" />

      {/* الإجمالي */}
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold">الإجمالي</span>
        <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          {formatPrice(total)}
        </span>
      </div>
    </CheckoutCard>
  );
}

export default CheckoutCard;
