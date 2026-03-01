/**
 * STAR LUX - Enhanced Button Component
 * Professional Interactions - Zero Delay - Perfect Feedback
 */

import React, { memo, useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ripple?: boolean;
  glow?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// ============================================
// STYLES
// ============================================
const baseStyles = `
  relative inline-flex items-center justify-center
  font-medium rounded-xl
  transition-all duration-200 ease-out
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
  select-none overflow-hidden
  transform-gpu will-change-transform
  active:scale-[0.98]
`;

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-purple-600 to-purple-700
    hover:from-purple-500 hover:to-purple-600
    text-white shadow-lg shadow-purple-500/25
    focus:ring-purple-500
    hover:shadow-xl hover:shadow-purple-500/30
  `,
  secondary: `
    bg-gradient-to-r from-slate-700 to-slate-800
    hover:from-slate-600 hover:to-slate-700
    text-white shadow-lg shadow-slate-500/20
    focus:ring-slate-500
    hover:shadow-xl hover:shadow-slate-500/25
  `,
  outline: `
    border-2 border-purple-500/50
    hover:border-purple-400 hover:bg-purple-500/10
    text-purple-400 hover:text-purple-300
    focus:ring-purple-500
  `,
  ghost: `
    hover:bg-white/10
    text-slate-300 hover:text-white
    focus:ring-slate-500
  `,
  danger: `
    bg-gradient-to-r from-red-600 to-red-700
    hover:from-red-500 hover:to-red-600
    text-white shadow-lg shadow-red-500/25
    focus:ring-red-500
    hover:shadow-xl hover:shadow-red-500/30
  `,
  success: `
    bg-gradient-to-r from-emerald-600 to-emerald-700
    hover:from-emerald-500 hover:to-emerald-600
    text-white shadow-lg shadow-emerald-500/25
    focus:ring-emerald-500
    hover:shadow-xl hover:shadow-emerald-500/30
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 min-h-[32px]',
  md: 'px-4 py-2 text-base gap-2 min-h-[40px]',
  lg: 'px-6 py-3 text-lg gap-2.5 min-h-[48px]',
  xl: 'px-8 py-4 text-xl gap-3 min-h-[56px]',
};

const glowStyles: Record<ButtonVariant, string> = {
  primary: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]',
  secondary: 'hover:shadow-[0_0_30px_rgba(100,116,139,0.4)]',
  outline: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
  ghost: '',
  danger: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]',
  success: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]',
};

// ============================================
// RIPPLE EFFECT
// ============================================
interface RippleProps {
  x: number;
  y: number;
  size: number;
}

const Ripple = memo(({ x, y, size }: RippleProps) => (
  <span
    className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
    style={{
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
    }}
  />
));

Ripple.displayName = 'Ripple';

// ============================================
// LOADING SPINNER
// ============================================
const LoadingSpinner = memo(({ size }: { size: ButtonSize }) => {
  const spinnerSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  }[size];

  return (
    <svg
      className={`animate-spin ${spinnerSize}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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
});

LoadingSpinner.displayName = 'LoadingSpinner';

// ============================================
// MAIN COMPONENT
// ============================================
export const EnhancedButton = memo(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  ripple = true,
  glow = true,
  fullWidth = false,
  children,
  className,
  onClick,
  disabled,
  ...props
}: EnhancedButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const rippleIdRef = useRef(0);
  const lastClickRef = useRef(0);

  // Prevent double click
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    if (now - lastClickRef.current < 300) return;
    lastClickRef.current = now;

    // Add ripple effect
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;

      setRipples((prev) => [...prev, { id, x, y, size }]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }

    onClick?.(e);
  }, [onClick, ripple]);

  // Touch feedback
  const handleTouchStart = useCallback(() => {
    if (buttonRef.current) {
      buttonRef.current.style.transform = 'scale(0.98)';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (buttonRef.current) {
      buttonRef.current.style.transform = '';
    }
  }, []);

  return (
    <button
      ref={buttonRef}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        glow && glowStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((r) => (
        <Ripple key={r.id} x={r.x} y={r.y} size={r.size} />
      ))}

      {/* Loading state */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl">
          <LoadingSpinner size={size} />
        </span>
      )}

      {/* Content */}
      <span className={cn('flex items-center gap-2', loading && 'invisible')}>
        {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
      </span>
    </button>
  );
});

EnhancedButton.displayName = 'EnhancedButton';

// ============================================
// CSS ANIMATIONS (add to global styles)
// ============================================
export const buttonAnimationStyles = `
  @keyframes ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }

  .animate-ripple {
    animation: ripple 0.6s ease-out forwards;
  }
`;

export default EnhancedButton;
