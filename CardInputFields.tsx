import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertCircle, CreditCard, Calendar, Lock, User } from 'lucide-react';
import './card-animations.css';

// ============= أنواع التحقق =============

export interface ValidationState {
  isValid: boolean;
  isValidating: boolean;
  message?: string;
}

// ============= خوارزمية Luhn للتحقق من رقم البطاقة =============

export function validateCardNumber(number: string): boolean {
  const cleanNumber = number.replace(/\s/g, '');
  
  if (!/^\d{13,19}$/.test(cleanNumber)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// ============= التحقق من تاريخ الانتهاء =============

export function validateExpiryDate(expiry: string): { isValid: boolean; message?: string } {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  
  if (!match) {
    return { isValid: false, message: 'الصيغة غير صحيحة (MM/YY)' };
  }
  
  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10) + 2000;
  
  if (month < 1 || month > 12) {
    return { isValid: false, message: 'الشهر غير صحيح' };
  }
  
  const now = new Date();
  const expDate = new Date(year, month - 1);
  
  if (expDate < now) {
    return { isValid: false, message: 'البطاقة منتهية الصلاحية' };
  }
  
  return { isValid: true };
}

// ============= التحقق من CVV =============

export function validateCVV(cvv: string, cardType?: string): boolean {
  const length = cardType === 'amex' ? 4 : 3;
  return new RegExp(`^\\d{${length}}$`).test(cvv);
}

// ============= التحقق من اسم حامل البطاقة =============

export function validateCardHolder(name: string): boolean {
  return /^[a-zA-Z\s]{2,50}$/.test(name.trim());
}

// ============= مكون مؤشر التحقق =============

interface ValidationIndicatorProps {
  state: ValidationState;
  className?: string;
}

function ValidationIndicator({ state, className }: ValidationIndicatorProps) {
  if (state.isValidating) {
    return (
      <div className={cn('card-spinner', className)} />
    );
  }
  
  if (state.isValid) {
    return (
      <div className={cn('w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center', className)}>
        <Check className="w-3 h-3 text-white" />
      </div>
    );
  }
  
  if (state.message) {
    return (
      <div className={cn('w-5 h-5 rounded-full bg-red-500 flex items-center justify-center', className)}>
        <X className="w-3 h-3 text-white" />
      </div>
    );
  }
  
  return null;
}

// ============= حقل رقم البطاقة =============

interface CardNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  validation: ValidationState;
  disabled?: boolean;
  className?: string;
}

export function CardNumberInput({
  value,
  onChange,
  onFocus,
  onBlur,
  validation,
  disabled,
  className,
}: CardNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/\D/g, '');
    
    // تنسيق الرقم بمسافات كل 4 أرقام
    newValue = newValue.slice(0, 16);
    const formatted = newValue.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    onChange(formatted);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className={cn('relative', className)}>
      <label className="block text-sm font-medium text-slate-400 mb-2">
        رقم البطاقة
      </label>
      <div
        className={cn(
          'relative flex items-center gap-3 px-4 py-3 rounded-xl',
          'bg-slate-800/50 border transition-all duration-300',
          isFocused ? 'border-cyan-500 input-focus-glow' : 'border-slate-700',
          validation.message && !validation.isValid && 'border-red-500 invalid-shake',
          validation.isValid && value && 'border-emerald-500 valid-pulse',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <CreditCard className="w-5 h-5 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'flex-1 bg-transparent border-none outline-none',
            'text-white placeholder:text-slate-500',
            'card-number-input'
          )}
        />
        <ValidationIndicator state={validation} />
      </div>
      {validation.message && !validation.isValid && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {validation.message}
        </p>
      )}
    </div>
  );
}

// ============= حقل تاريخ الانتهاء =============

interface ExpiryDateInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  validation: ValidationState;
  disabled?: boolean;
  className?: string;
}

export function ExpiryDateInput({
  value,
  onChange,
  onFocus,
  onBlur,
  validation,
  disabled,
  className,
}: ExpiryDateInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/\D/g, '');
    
    if (newValue.length >= 2) {
      newValue = newValue.slice(0, 2) + '/' + newValue.slice(2, 4);
    }
    
    onChange(newValue.slice(0, 5));
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className={cn('relative', className)}>
      <label className="block text-sm font-medium text-slate-400 mb-2">
        تاريخ الانتهاء
      </label>
      <div
        className={cn(
          'relative flex items-center gap-3 px-4 py-3 rounded-xl',
          'bg-slate-800/50 border transition-all duration-300',
          isFocused ? 'border-cyan-500 input-focus-glow' : 'border-slate-700',
          validation.message && !validation.isValid && 'border-red-500 invalid-shake',
          validation.isValid && value && 'border-emerald-500 valid-pulse',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Calendar className="w-5 h-5 text-slate-500" />
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="MM/YY"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'flex-1 bg-transparent border-none outline-none',
            'text-white placeholder:text-slate-500',
            'expiry-input'
          )}
        />
        <ValidationIndicator state={validation} />
      </div>
      {validation.message && !validation.isValid && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {validation.message}
        </p>
      )}
    </div>
  );
}

// ============= حقل CVV =============

interface CVVInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  validation: ValidationState;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

export function CVVInput({
  value,
  onChange,
  onFocus,
  onBlur,
  validation,
  maxLength = 3,
  disabled,
  className,
}: CVVInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsRevealed(false);
    onBlur?.();
  };

  return (
    <div className={cn('relative', className)}>
      <label className="block text-sm font-medium text-slate-400 mb-2">
        CVV / CVC
      </label>
      <div
        className={cn(
          'relative flex items-center gap-3 px-4 py-3 rounded-xl',
          'bg-slate-800/50 border transition-all duration-300',
          isFocused ? 'border-cyan-500 input-focus-glow' : 'border-slate-700',
          validation.message && !validation.isValid && 'border-red-500 invalid-shake',
          validation.isValid && value && 'border-emerald-500 valid-pulse',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Lock className="w-5 h-5 text-slate-500" />
        <input
          type={isRevealed ? 'text' : 'password'}
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="•••"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'flex-1 bg-transparent border-none outline-none',
            'text-white placeholder:text-slate-500',
            'cvv-input'
          )}
        />
        <button
          type="button"
          onClick={() => setIsRevealed(!isRevealed)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          {isRevealed ? '🙈' : '👁️'}
        </button>
        <ValidationIndicator state={validation} />
      </div>
      {validation.message && !validation.isValid && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {validation.message}
        </p>
      )}
    </div>
  );
}

// ============= حقل اسم حامل البطاقة =============

interface CardHolderInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  validation: ValidationState;
  disabled?: boolean;
  className?: string;
}

export function CardHolderInput({
  value,
  onChange,
  onFocus,
  onBlur,
  validation,
  disabled,
  className,
}: CardHolderInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // السماح فقط بالأحرف والمسافات
    const newValue = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
    onChange(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className={cn('relative', className)}>
      <label className="block text-sm font-medium text-slate-400 mb-2">
        اسم حامل البطاقة
      </label>
      <div
        className={cn(
          'relative flex items-center gap-3 px-4 py-3 rounded-xl',
          'bg-slate-800/50 border transition-all duration-300',
          isFocused ? 'border-cyan-500 input-focus-glow' : 'border-slate-700',
          validation.message && !validation.isValid && 'border-red-500 invalid-shake',
          validation.isValid && value && 'border-emerald-500 valid-pulse',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <User className="w-5 h-5 text-slate-500" />
        <input
          type="text"
          autoComplete="cc-name"
          placeholder="JOHN DOE"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'flex-1 bg-transparent border-none outline-none',
            'text-white placeholder:text-slate-500',
            'card-holder-input'
          )}
        />
        <ValidationIndicator state={validation} />
      </div>
      {validation.message && !validation.isValid && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {validation.message}
        </p>
      )}
    </div>
  );
}

// ============= Hook لإدارة نموذج البطاقة =============

export interface CardFormData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

export interface CardFormValidation {
  cardNumber: ValidationState;
  cardHolder: ValidationState;
  expiryDate: ValidationState;
  cvv: ValidationState;
}

export function useCardForm() {
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  const [validation, setValidation] = useState<CardFormValidation>({
    cardNumber: { isValid: false, isValidating: false },
    cardHolder: { isValid: false, isValidating: false },
    expiryDate: { isValid: false, isValidating: false },
    cvv: { isValid: false, isValidating: false },
  });

  const [focusedField, setFocusedField] = useState<keyof CardFormData | null>(null);

  // التحقق من رقم البطاقة
  useEffect(() => {
    const cleanNumber = formData.cardNumber.replace(/\s/g, '');
    
    if (!cleanNumber) {
      setValidation(prev => ({
        ...prev,
        cardNumber: { isValid: false, isValidating: false },
      }));
      return;
    }

    if (cleanNumber.length < 13) {
      setValidation(prev => ({
        ...prev,
        cardNumber: { isValid: false, isValidating: false, message: 'رقم البطاقة قصير جداً' },
      }));
      return;
    }

    const isValid = validateCardNumber(cleanNumber);
    setValidation(prev => ({
      ...prev,
      cardNumber: {
        isValid,
        isValidating: false,
        message: isValid ? undefined : 'رقم البطاقة غير صالح',
      },
    }));
  }, [formData.cardNumber]);

  // التحقق من تاريخ الانتهاء
  useEffect(() => {
    if (!formData.expiryDate) {
      setValidation(prev => ({
        ...prev,
        expiryDate: { isValid: false, isValidating: false },
      }));
      return;
    }

    const result = validateExpiryDate(formData.expiryDate);
    setValidation(prev => ({
      ...prev,
      expiryDate: {
        isValid: result.isValid,
        isValidating: false,
        message: result.message,
      },
    }));
  }, [formData.expiryDate]);

  // التحقق من CVV
  useEffect(() => {
    if (!formData.cvv) {
      setValidation(prev => ({
        ...prev,
        cvv: { isValid: false, isValidating: false },
      }));
      return;
    }

    const isValid = validateCVV(formData.cvv);
    setValidation(prev => ({
      ...prev,
      cvv: {
        isValid,
        isValidating: false,
        message: isValid ? undefined : 'CVV غير صالح',
      },
    }));
  }, [formData.cvv]);

  // التحقق من اسم حامل البطاقة
  useEffect(() => {
    if (!formData.cardHolder) {
      setValidation(prev => ({
        ...prev,
        cardHolder: { isValid: false, isValidating: false },
      }));
      return;
    }

    const isValid = validateCardHolder(formData.cardHolder);
    setValidation(prev => ({
      ...prev,
      cardHolder: {
        isValid,
        isValidating: false,
        message: isValid ? undefined : 'الاسم يجب أن يحتوي على أحرف فقط',
      },
    }));
  }, [formData.cardHolder]);

  const isFormValid = 
    validation.cardNumber.isValid &&
    validation.cardHolder.isValid &&
    validation.expiryDate.isValid &&
    validation.cvv.isValid;

  const updateField = useCallback((field: keyof CardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
    });
  }, []);

  return {
    formData,
    validation,
    focusedField,
    setFocusedField,
    isFormValid,
    updateField,
    resetForm,
  };
}

export default CardNumberInput;
