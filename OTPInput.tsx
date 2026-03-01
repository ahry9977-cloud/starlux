import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // تقسيم القيمة إلى مصفوفة
  const valueArray = value.split('').slice(0, length);
  while (valueArray.length < length) {
    valueArray.push('');
  }

  // التركيز على الحقل الأول عند التحميل
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // التحقق من اكتمال الإدخال
  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handleChange = useCallback((index: number, inputValue: string) => {
    // السماح فقط بالأرقام
    const digit = inputValue.replace(/\D/g, '').slice(-1);
    
    if (digit) {
      const newValue = valueArray.slice();
      newValue[index] = digit;
      onChange(newValue.join(''));
      
      // الانتقال للحقل التالي
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        setActiveIndex(index + 1);
      }
    }
  }, [valueArray, onChange, length]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      if (valueArray[index]) {
        // حذف القيمة الحالية
        const newValue = valueArray.slice();
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (index > 0) {
        // الانتقال للحقل السابق وحذفه
        const newValue = valueArray.slice();
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  }, [valueArray, onChange, length]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    
    if (pastedData) {
      onChange(pastedData);
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
      setActiveIndex(focusIndex);
    }
  }, [onChange, length]);

  const handleFocus = useCallback((index: number) => {
    setActiveIndex(index);
    // تحديد النص عند التركيز
    inputRefs.current[index]?.select();
  }, []);

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" dir="ltr">
      {valueArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            "w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl",
            "bg-white/5 border-2 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-[#4B00FF]/50",
            disabled && "opacity-50 cursor-not-allowed",
            error
              ? "border-red-500 text-red-400 animate-shake"
              : activeIndex === index
              ? "border-[#4B00FF] text-white shadow-lg shadow-[#4B00FF]/20"
              : digit
              ? "border-[#4B00FF]/50 text-white"
              : "border-white/20 text-white/60"
          )}
          aria-label={`الرقم ${index + 1} من ${length}`}
        />
      ))}
    </div>
  );
};

// مكون العد التنازلي لإعادة الإرسال
interface ResendTimerProps {
  initialSeconds?: number;
  onResend: () => void;
  disabled?: boolean;
}

export const ResendTimer: React.FC<ResendTimerProps> = ({
  initialSeconds = 60,
  onResend,
  disabled = false,
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [seconds]);

  const handleResend = () => {
    if (canResend && !disabled) {
      onResend();
      setSeconds(initialSeconds);
      setCanResend(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center mt-4">
      {canResend ? (
        <button
          type="button"
          onClick={handleResend}
          disabled={disabled}
          className={cn(
            "text-[#4B00FF] hover:text-[#FF00FF] transition-colors font-medium",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          إعادة إرسال الرمز
        </button>
      ) : (
        <p className="text-white/50 text-sm">
          إعادة الإرسال بعد <span className="text-[#4B00FF] font-mono">{formatTime(seconds)}</span>
        </p>
      )}
    </div>
  );
};

export default OTPInput;
