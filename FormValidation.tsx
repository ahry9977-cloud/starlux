import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';
import './animations.css';

// أنواع قواعد التحقق
export type ValidationRule = 
  | { type: 'required'; message?: string }
  | { type: 'minLength'; value: number; message?: string }
  | { type: 'maxLength'; value: number; message?: string }
  | { type: 'pattern'; value: RegExp; message?: string }
  | { type: 'email'; message?: string }
  | { type: 'phone'; message?: string }
  | { type: 'custom'; validate: (value: string) => boolean | Promise<boolean>; message?: string };

// نتيجة التحقق
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  isValidating?: boolean;
}

// حالة الحقل
export interface FieldState {
  value: string;
  touched: boolean;
  dirty: boolean;
  validation: ValidationResult;
}

// تكوين الحقل
export interface FieldConfig {
  name: string;
  label: string;
  rules: ValidationRule[];
  debounceMs?: number;
}

// Hook للتحقق من الحقل
export function useFieldValidation(
  value: string,
  rules: ValidationRule[],
  debounceMs: number = 300
): ValidationResult & { isValidating: boolean } {
  const [result, setResult] = useState<ValidationResult>({ isValid: true });
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (val: string): Promise<ValidationResult> => {
    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (!val.trim()) {
            return { isValid: false, message: rule.message || 'هذا الحقل مطلوب' };
          }
          break;
        
        case 'minLength':
          if (val.length < rule.value) {
            return { 
              isValid: false, 
              message: rule.message || `يجب أن يكون على الأقل ${rule.value} أحرف` 
            };
          }
          break;
        
        case 'maxLength':
          if (val.length > rule.value) {
            return { 
              isValid: false, 
              message: rule.message || `يجب أن لا يتجاوز ${rule.value} أحرف` 
            };
          }
          break;
        
        case 'pattern':
          if (!rule.value.test(val)) {
            return { isValid: false, message: rule.message || 'القيمة غير صالحة' };
          }
          break;
        
        case 'email':
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(val)) {
            return { isValid: false, message: rule.message || 'البريد الإلكتروني غير صالح' };
          }
          break;
        
        case 'phone':
          const phonePattern = /^[\d\s+-]{8,}$/;
          if (!phonePattern.test(val)) {
            return { isValid: false, message: rule.message || 'رقم الهاتف غير صالح' };
          }
          break;
        
        case 'custom':
          const isValid = await rule.validate(val);
          if (!isValid) {
            return { isValid: false, message: rule.message || 'القيمة غير صالحة' };
          }
          break;
      }
    }
    
    return { isValid: true };
  }, [rules]);

  useEffect(() => {
    if (!value) {
      setResult({ isValid: true });
      return;
    }

    setIsValidating(true);
    
    const timer = setTimeout(async () => {
      const validationResult = await validate(value);
      setResult(validationResult);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, validate, debounceMs]);

  return { ...result, isValidating };
}

// مكون مؤشر صحة الحقل
interface FieldValidationIndicatorProps {
  validation: ValidationResult;
  isValidating?: boolean;
  touched?: boolean;
  className?: string;
  showMessage?: boolean;
}

export function FieldValidationIndicator({
  validation,
  isValidating = false,
  touched = true,
  className,
  showMessage = true,
}: FieldValidationIndicatorProps) {
  if (!touched) return null;

  return (
    <div className={cn('flex items-center gap-2 mt-1', className)}>
      {isValidating ? (
        <>
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="text-xs text-cyan-400">جاري التحقق...</span>
        </>
      ) : validation.isValid ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          {showMessage && <span className="text-xs text-emerald-400">صحيح</span>}
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 text-red-400" />
          {showMessage && validation.message && (
            <span className="text-xs text-red-400">{validation.message}</span>
          )}
        </>
      )}
    </div>
  );
}

// مكون شريط قوة كلمة المرور
interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    
    // الطول
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // الأحرف الكبيرة
    if (/[A-Z]/.test(password)) score += 1;
    
    // الأحرف الصغيرة
    if (/[a-z]/.test(password)) score += 1;
    
    // الأرقام
    if (/\d/.test(password)) score += 1;
    
    // الرموز الخاصة
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    const labels = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية', 'قوية جداً', 'ممتازة'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500', 'bg-cyan-500'];
    
    return {
      score,
      label: labels[Math.min(score, labels.length - 1)],
      color: colors[Math.min(score, colors.length - 1)],
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < strength.score ? strength.color : 'bg-slate-700'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400">
        قوة كلمة المرور: <span className={cn(
          strength.score <= 1 ? 'text-red-400' :
          strength.score <= 2 ? 'text-orange-400' :
          strength.score <= 3 ? 'text-yellow-400' :
          'text-emerald-400'
        )}>{strength.label}</span>
      </p>
    </div>
  );
}

// مكون ملخص التحقق من النموذج
interface FormValidationSummaryProps {
  fields: Record<string, FieldState>;
  className?: string;
}

export function FormValidationSummary({ fields, className }: FormValidationSummaryProps) {
  const summary = useMemo(() => {
    const entries = Object.entries(fields);
    const total = entries.length;
    const valid = entries.filter(([, f]) => f.validation.isValid).length;
    const invalid = entries.filter(([, f]) => !f.validation.isValid && f.touched).length;
    const untouched = entries.filter(([, f]) => !f.touched).length;
    
    return { total, valid, invalid, untouched };
  }, [fields]);

  const progress = (summary.valid / summary.total) * 100;

  return (
    <div className={cn('p-4 rounded-xl bg-slate-800/50 border border-slate-700', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">تقدم ملء النموذج</span>
        <span className="text-sm font-semibold text-cyan-400">
          {summary.valid}/{summary.total}
        </span>
      </div>
      
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-3 text-xs">
        <span className="text-emerald-400 flex items-center gap-1">
          <Check className="w-3 h-3" />
          {summary.valid} صحيح
        </span>
        {summary.invalid > 0 && (
          <span className="text-red-400 flex items-center gap-1">
            <X className="w-3 h-3" />
            {summary.invalid} خطأ
          </span>
        )}
        {summary.untouched > 0 && (
          <span className="text-slate-500">
            {summary.untouched} متبقي
          </span>
        )}
      </div>
    </div>
  );
}

// Hook لإدارة نموذج كامل
export function useFormValidation<T extends Record<string, string>>(
  initialValues: T,
  fieldConfigs: FieldConfig[]
) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validations, setValidations] = useState<Record<string, ValidationResult>>({});
  const [isValidating, setIsValidating] = useState(false);

  // تحديث قيمة حقل
  const setValue = useCallback((name: keyof T, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  // تحديد الحقل كـ touched
  const setFieldTouched = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  // التحقق من حقل واحد
  const validateField = useCallback(async (name: string, value: string): Promise<ValidationResult> => {
    const config = fieldConfigs.find(f => f.name === name);
    if (!config) return { isValid: true };

    for (const rule of config.rules) {
      switch (rule.type) {
        case 'required':
          if (!value.trim()) {
            return { isValid: false, message: rule.message || `${config.label} مطلوب` };
          }
          break;
        case 'minLength':
          if (value.length < rule.value) {
            return { isValid: false, message: rule.message || `${config.label} قصير جداً` };
          }
          break;
        case 'maxLength':
          if (value.length > rule.value) {
            return { isValid: false, message: rule.message || `${config.label} طويل جداً` };
          }
          break;
        case 'pattern':
          if (!rule.value.test(value)) {
            return { isValid: false, message: rule.message || `${config.label} غير صالح` };
          }
          break;
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return { isValid: false, message: rule.message || 'البريد الإلكتروني غير صالح' };
          }
          break;
        case 'phone':
          if (!/^[\d\s+-]{8,}$/.test(value)) {
            return { isValid: false, message: rule.message || 'رقم الهاتف غير صالح' };
          }
          break;
        case 'custom':
          const isValid = await rule.validate(value);
          if (!isValid) {
            return { isValid: false, message: rule.message || `${config.label} غير صالح` };
          }
          break;
      }
    }

    return { isValid: true };
  }, [fieldConfigs]);

  // التحقق من جميع الحقول
  const validateAll = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    const newValidations: Record<string, ValidationResult> = {};
    let allValid = true;

    for (const config of fieldConfigs) {
      const result = await validateField(config.name, values[config.name as keyof T] || '');
      newValidations[config.name] = result;
      if (!result.isValid) allValid = false;
    }

    setValidations(newValidations);
    setTouched(Object.fromEntries(fieldConfigs.map(f => [f.name, true])));
    setIsValidating(false);

    return allValid;
  }, [fieldConfigs, values, validateField]);

  // التحقق عند تغيير القيم
  useEffect(() => {
    const validateTouchedFields = async () => {
      const newValidations: Record<string, ValidationResult> = { ...validations };
      
      for (const name of Object.keys(touched).filter(k => touched[k])) {
        const result = await validateField(name, values[name as keyof T] || '');
        newValidations[name] = result;
      }
      
      setValidations(newValidations);
    };

    const timer = setTimeout(validateTouchedFields, 300);
    return () => clearTimeout(timer);
  }, [values, touched, validateField]);

  // حساب صحة النموذج
  const isFormValid = useMemo(() => {
    return fieldConfigs.every(config => {
      const validation = validations[config.name];
      return validation?.isValid !== false;
    });
  }, [fieldConfigs, validations]);

  return {
    values,
    setValue,
    touched,
    setFieldTouched,
    validations,
    validateAll,
    isFormValid,
    isValidating,
    reset: () => {
      setValues(initialValues);
      setTouched({});
      setValidations({});
    },
  };
}

export default FieldValidationIndicator;
