/**
 * STAR LUX - Interactive Button with Sonic Brand Identity
 * زر تفاعلي مع الهوية الصوتية لـ Star Lux
 */

import React, { forwardRef, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { useButtonSound, type ElementSoundType } from '@/hooks/useStarLuxSound';

export interface StarLuxButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'admin';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  soundType?: ElementSoundType;
  enableHoverSound?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles: Record<string, string> = {
  primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40',
  secondary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40',
  outline: 'border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500/10 hover:border-cyan-400',
  ghost: 'text-gray-300 hover:text-white hover:bg-white/10',
  danger: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-lg shadow-red-500/25',
  success: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25',
  admin: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25'
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-xl',
  xl: 'px-8 py-4 text-xl rounded-2xl'
};

const getSoundTypeForVariant = (variant: string): ElementSoundType => {
  switch (variant) {
    case 'primary':
    case 'success':
      return 'primary-button';
    case 'secondary':
    case 'outline':
    case 'ghost':
      return 'secondary-button';
    case 'danger':
      return 'delete';
    case 'admin':
      return 'admin';
    default:
      return 'primary-button';
  }
};

export const StarLuxButton = memo(forwardRef<HTMLButtonElement, StarLuxButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      soundType,
      enableHoverSound = true,
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      onClick,
      onMouseEnter,
      disabled,
      ...props
    },
    ref
  ) => {
    const effectiveSoundType = soundType || getSoundTypeForVariant(variant);
    const { soundProps } = useButtonSound(effectiveSoundType, enableHoverSound);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      soundProps.onClick(e);
      onClick?.(e);
    }, [disabled, loading, soundProps, onClick]);

    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      soundProps.onMouseEnter();
      onMouseEnter?.(e);
    }, [disabled, loading, soundProps, onMouseEnter]);

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center gap-2 font-medium',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
          'active:scale-[0.98]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          // Variant styles
          variantStyles[variant],
          // Size styles
          sizeStyles[size],
          // Loading state
          loading && 'cursor-wait',
          className
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <svg
            className="animate-spin h-4 w-4 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
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
        )}

        {/* Content */}
        <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </span>
      </button>
    );
  }
));

StarLuxButton.displayName = 'StarLuxButton';

export default StarLuxButton;
