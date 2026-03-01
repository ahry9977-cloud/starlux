import { randomBytes } from 'crypto';

/**
 * تنظيف السلسلة
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * التحقق من صحة البريد الإلكتروني
 */
export const isValidEmail = (email: string): boolean => {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
};

/**
 * التحقق من قوة كلمة المرور
 */
export const isStrongPassword = (password: string): { valid: boolean; message: string } => {
  if (typeof password !== 'string') return { valid: false, message: 'كلمة المرور غير صالحة' };
  if (password.length < 8) return { valid: false, message: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' };
  if (password.length > 128) return { valid: false, message: 'كلمة المرور طويلة جداً' };

  if (!/[A-Z]/.test(password)) return { valid: false, message: 'يجب أن تحتوي على حرف كبير' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'يجب أن تحتوي على حرف صغير' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'يجب أن تحتوي على رقم' };
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, message: 'يجب أن تحتوي على رمز خاص' };

  return { valid: true, message: 'كلمة المرور قوية' };
};

/**
 * تنظيف المدخلات من الاستعلامات SQL
 */
export const sanitizeSQLInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
    .replace(/\bUNION\b\s+\bSELECT\b/gi, '')
    .replace(/\bDROP\b\s+\bTABLE\b/gi, '')
    .replace(/['"]/g, '')
    .trim();
};

/**
 * الكشف عن مدخلات مشبوهة
 */
export const isSuspiciousInput = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  const patterns = [
    /\.\.[\\/]/,
    /<\s*script\b/i,
    /javascript\s*:/i,
    /on\w+\s*=/i,
    /<\s*iframe\b/i,
  ];
  return patterns.some(p => p.test(input));
};

/**
 * توليد رمز CSRF
 */
export const generateCSRFToken = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * التحقق من قوة كلمة المرور
 */
export const validatePassword = (password: string): boolean => {
  return isStrongPassword(password).valid;
};

/**
 * تنظيف المدخلات
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return sanitizeString(input);
};

/**
 * الكشف عن XSS
 */
export const detectXSS = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
  ];
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * الكشف عن SQL Injection
 */
export const detectSQLInjection = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  const sqlPatterns = [
    /['"]/,
    /--/,
    /;\s*drop/i,
    /union\s+select/i,
    /or\s+['"]0-9]/i,
  ];
  return sqlPatterns.some(pattern => pattern.test(input));
};

// ============= Payment Method Validation =============

export const SUPPORTED_PAYMENT_METHODS = [
  'zain_cash', 'asia_pay',
  'mastercard', 'visa'
] as const;

export type PaymentMethodId = typeof SUPPORTED_PAYMENT_METHODS[number];

/**
 * التحقق من صحة طريقة الدفع
 */
export const validatePaymentMethod = (methodId: string): boolean => {
  return SUPPORTED_PAYMENT_METHODS.includes(methodId as PaymentMethodId);
};

/**
 * التحقق من تفاصيل طريقة الدفع
 */
export const validatePaymentDetails = (methodId: string, details: string): { valid: boolean; error?: string } => {
  if (!details || details.trim().length < 5) {
    return { valid: false, error: 'تفاصيل الدفع قصيرة جداً' };
  }

  // التحقق حسب نوع طريقة الدفع
  switch (methodId) {
    case 'zain_cash':
    case 'asia_pay':
      // يجب أن يكون رقم هاتف
      if (!/^\+?[0-9]{10,15}$/.test(details.replace(/\s/g, ''))) {
        return { valid: false, error: 'رقم الهاتف غير صحيح' };
      }
      break;

    case 'mastercard':
    case 'visa':
      if (!/^[0-9\s-]{12,24}$/.test(details.trim())) {
        return { valid: false, error: 'رقم البطاقة غير صحيح' };
      }
      break;

    default:
      return { valid: false, error: 'طريقة الدفع غير مدعومة' };
  }

  return { valid: true };
};