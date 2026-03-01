import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import './animations.css';

// أنواع حالات الزر
export type ButtonState = 'disabled' | 'active' | 'loading' | 'success' | 'error';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  state?: ButtonState;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  icon?: React.ReactNode;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  showTruck?: boolean;
  autoResetError?: boolean;
  errorResetDelay?: number;
}

// مكون أيقونة الشاحنة المتحركة
const TruckIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-6 h-6", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 3h15v13H1z" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

// مكون أيقونة التحميل
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-5 h-5 animate-spin", className)}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// مكون علامة النجاح
const CheckmarkIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-6 h-6", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      className="animate-checkmark"
      d="M5 12l5 5L20 7"
    />
  </svg>
);

// مكون علامة الخطأ
const ErrorIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("w-6 h-6", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

export function AnimatedButton({
  children,
  onClick,
  state = 'active',
  className,
  disabled = false,
  fullWidth = false,
  size = 'md',
  variant = 'primary',
  icon,
  loadingText = 'جاري المعالجة...',
  successText = 'تم بنجاح!',
  errorText = 'حدث خطأ',
  showTruck = false,
  autoResetError = true,
  errorResetDelay = 3000,
}: AnimatedButtonProps) {
  const [internalState, setInternalState] = useState<ButtonState>(state);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  // تحديث الحالة الداخلية عند تغيير الحالة الخارجية
  useEffect(() => {
    setInternalState(state);
  }, [state]);

  // إعادة تعيين حالة الخطأ تلقائياً
  useEffect(() => {
    if (internalState === 'error' && autoResetError) {
      const timer = setTimeout(() => {
        setInternalState('active');
      }, errorResetDelay);
      return () => clearTimeout(timer);
    }
  }, [internalState, autoResetError, errorResetDelay]);

  // تأثير الموجة عند النقر
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleIdRef.current++;
    
    setRipples(prev => [...prev, { x, y, id }]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  };

  // معالجة النقر
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (internalState === 'disabled' || internalState === 'loading' || disabled) {
      return;
    }

    handleRipple(e);

    if (onClick) {
      setInternalState('loading');
      try {
        await onClick();
        setInternalState('success');
        setTimeout(() => setInternalState('active'), 2000);
      } catch {
        setInternalState('error');
      }
    }
  };

  // تحديد الأحجام
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
  };

  // تحديد الألوان حسب النوع
  const variantClasses = {
    primary: 'bg-gradient-to-r from-cyan-500 to-purple-600',
    secondary: 'bg-gradient-to-r from-slate-600 to-slate-700',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600',
  };

  // تحديد الفئات حسب الحالة
  const stateClasses = {
    disabled: 'checkout-btn-disabled cursor-not-allowed opacity-50',
    active: 'checkout-btn-active hover:scale-[1.02] hover:shadow-lg',
    loading: 'checkout-btn-loading cursor-wait',
    success: 'checkout-btn-success',
    error: 'checkout-btn-error',
  };

  // تحديد المحتوى حسب الحالة
  const renderContent = () => {
    switch (internalState) {
      case 'loading':
        return (
          <div className="flex items-center justify-center gap-3">
            {showTruck ? (
              <div className="relative w-full h-6 overflow-hidden">
                <TruckIcon className="animate-truck absolute" />
              </div>
            ) : (
              <LoadingSpinner />
            )}
            <span className="animate-pulse">{loadingText}</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center justify-center gap-2 animate-fadeInScale">
            <CheckmarkIcon />
            <span>{successText}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-center gap-2">
            <ErrorIcon />
            <span>{errorText}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center gap-2">
            {icon}
            <span>{children}</span>
          </div>
        );
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled || internalState === 'disabled' || internalState === 'loading'}
      className={cn(
        'checkout-btn relative overflow-hidden rounded-xl font-bold text-white',
        'transition-all duration-300 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900',
        sizeClasses[size],
        variantClasses[variant],
        stateClasses[internalState],
        fullWidth && 'w-full',
        className
      )}
    >
      {/* تأثير الموجة */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      
      {/* تأثير اللمعان */}
      {internalState === 'active' && (
        <div className="absolute inset-0 animate-shimmer pointer-events-none" />
      )}
      
      {/* المحتوى */}
      <div className="relative z-10">
        {renderContent()}
      </div>
    </button>
  );
}

export default AnimatedButton;
