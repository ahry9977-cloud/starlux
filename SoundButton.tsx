/**
 * STAR LUX - Sound Button Component
 * 
 * زر محسن مع أصوات تفاعلية احترافية
 * - صوت عند Hover
 * - صوت عند Click
 * - متوافق مع جميع الأجهزة
 * - بدون تأثير على الأداء
 */

import React, { memo, useCallback, forwardRef } from 'react';
import { playSound, type SoundType } from '../../lib/soundSystem';
import { cn } from '../../lib/utils';

// أنواع الأزرار وأصواتها
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

// ربط الأصوات بأنواع الأزرار
const VARIANT_SOUNDS: Record<ButtonVariant, SoundType> = {
  primary: 'click',
  secondary: 'click',
  outline: 'click',
  ghost: 'hover',
  danger: 'warning',
  success: 'success',
};

interface SoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  soundType?: SoundType;
  hoverSound?: boolean;
  clickSound?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

// أنماط الأزرار
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25',
  secondary: 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600',
  outline: 'border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10',
  ghost: 'text-gray-300 hover:text-white hover:bg-white/5',
  danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700',
  success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

/**
 * زر محسن مع أصوات تفاعلية
 */
const SoundButton = forwardRef<HTMLButtonElement, SoundButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      soundType,
      hoverSound = true,
      clickSound = true,
      loading = false,
      className,
      onClick,
      onMouseEnter,
      onTouchStart,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // تحديد نوع الصوت
    const actualSoundType = soundType || VARIANT_SOUNDS[variant];

    // معالج النقر مع الصوت
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (clickSound && !disabled && !loading) {
          playSound(actualSoundType);
        }
        onClick?.(e);
      },
      [clickSound, disabled, loading, actualSoundType, onClick]
    );

    // معالج Hover مع الصوت
    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (hoverSound && !disabled && !loading) {
          playSound('hover');
        }
        onMouseEnter?.(e);
      },
      [hoverSound, disabled, loading, onMouseEnter]
    );

    // معالج Touch مع الصوت
    const handleTouchStart = useCallback(
      (e: React.TouchEvent<HTMLButtonElement>) => {
        if (clickSound && !disabled && !loading) {
          playSound(actualSoundType);
        }
        onTouchStart?.(e);
      },
      [clickSound, disabled, loading, actualSoundType, onTouchStart]
    );

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-lg font-medium',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-gray-900',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onTouchStart={handleTouchStart}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 animate-spin"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        <span className={loading ? 'invisible' : ''}>{children}</span>
      </button>
    );
  }
);

SoundButton.displayName = 'SoundButton';

export default memo(SoundButton);
export { SoundButton };
export type { SoundButtonProps, ButtonVariant, ButtonSize };
