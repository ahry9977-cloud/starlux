import React from 'react';
import { cn } from '@/lib/utils';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  loading = false,
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-[#4B00FF] to-[#FF00FF] hover:shadow-[0_10px_40px_rgba(75,0,255,0.5),0_0_60px_rgba(255,0,255,0.3)]',
    secondary: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-[0_10px_40px_rgba(0,255,255,0.5)]',
    outline: 'bg-transparent border-2 border-[#4B00FF] hover:bg-[#4B00FF]/20 hover:shadow-[0_0_30px_rgba(75,0,255,0.3)]',
  };

  const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-4 px-8 text-base',
    lg: 'py-5 px-10 text-lg',
  };

  return (
    <button
      className={cn(
        'glow-button relative w-full rounded-xl text-white font-semibold',
        'transition-all duration-300 ease-out',
        'overflow-hidden',
        variants[variant],
        sizes[size],
        loading && 'loading pointer-events-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shine effect */}
      <span className="absolute inset-0 overflow-hidden rounded-xl">
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
      </span>
      
      {/* Button content */}
      <span className={cn('button-text relative z-10 flex items-center justify-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>
      
      {/* Loading spinner */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      )}
      
      {/* Ripple effect on click */}
      <style>{`
        .glow-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s ease;
        }
        .glow-button:hover::before {
          left: 100%;
        }
      `}</style>
    </button>
  );
};

export default GlowButton;
