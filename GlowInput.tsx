import React, { useState, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  label?: string;
  error?: string;
  success?: boolean;
  showPasswordToggle?: boolean;
}

export const GlowInput = forwardRef<HTMLInputElement, GlowInputProps>(
  ({ icon: Icon, label, error, success, showPasswordToggle, className, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password') 
      : type;

    return (
      <div className="glow-input-wrapper">
        {label && (
          <label className="block text-sm font-medium text-white/70 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon 
              className={cn(
                "input-icon w-5 h-5 transition-all duration-300",
                isFocused && "text-cyan-400 drop-shadow-[0_0_5px_#00ffff]"
              )} 
            />
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "glow-input",
              !Icon && "pl-5",
              error && "invalid",
              success && "valid",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
          <div className="input-glow" />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400 flex items-center gap-1 animate-[errorAppear_0.3s_ease]">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

GlowInput.displayName = 'GlowInput';

export default GlowInput;
