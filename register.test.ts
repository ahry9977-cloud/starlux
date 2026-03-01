import { describe, it, expect } from 'vitest';
import { 
  validateEmail, 
  validatePassword, 
  sanitizeInput, 
  detectXSS, 
  detectSQLInjection,
  validatePaymentMethod,
  validatePaymentDetails,
  calculateCommission,
  SUPPORTED_PAYMENT_METHODS,
  SUBSCRIPTION_PLANS,
  validateSubscriptionPlan,
} from './security';

describe('نظام التسجيل - Registration System', () => {
  describe('التحقق من البريد الإلكتروني', () => {
    it('يقبل بريد إلكتروني صحيح', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('a07501261239@gmail.com')).toBe(true);
    });

    it('يرفض بريد إلكتروني غير صحيح', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('التحقق من كلمة المرور', () => {
    it('يقبل كلمة مرور قوية', () => {
      expect(validatePassword('Test@1234')).toBe(true);
      expect(validatePassword('MyP@ssw0rd!')).toBe(true);
    });

    it('يرفض كلمة مرور ضعيفة', () => {
      expect(validatePassword('123456')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('short')).toBe(false);
    });
  });

  describe('تنظيف المدخلات', () => {
    it('ينظف المدخلات الخطرة', () => {
      const dangerous = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(dangerous);
      expect(sanitized).not.toContain('<script>');
    });

    it('يحافظ على المدخلات الآمنة', () => {
      const safe = 'Hello World';
      expect(sanitizeInput(safe)).toBe('Hello World');
    });
  });

  describe('كشف XSS', () => {
    it('يكتشف محاولات XSS', () => {
      expect(detectXSS('<script>alert(1)</script>')).toBe(true);
      expect(detectXSS('javascript:void(0)')).toBe(true);
      expect(detectXSS('onclick=alert(1)')).toBe(true);
    });

    it('لا يكتشف نص عادي', () => {
      expect(detectXSS('Hello World')).toBe(false);
      expect(detectXSS('مرحبا بالعالم')).toBe(false);
    });
  });

  describe('كشف SQL Injection', () => {
    it('يكتشف محاولات SQL Injection', () => {
      expect(detectSQLInjection("'; DROP TABLE users;--")).toBe(true);
      expect(detectSQLInjection("' OR '1'='1")).toBe(true);
      expect(detectSQLInjection('UNION SELECT * FROM users')).toBe(true);
    });

    it('لا يكتشف نص عادي', () => {
      expect(detectSQLInjection('Hello World')).toBe(false);
      expect(detectSQLInjection('متجر رائع')).toBe(false);
    });
  });
});

describe('طرق الدفع - Payment Methods', () => {
  describe('التحقق من طريقة الدفع', () => {
    it('يقبل طرق الدفع المدعومة', () => {
      expect(validatePaymentMethod('zain_cash')).toBe(true);
      expect(validatePaymentMethod('payoneer')).toBe(true);
      expect(validatePaymentMethod('binance')).toBe(true);
      expect(validatePaymentMethod('mastercard')).toBe(true);
    });

    it('يرفض طرق الدفع غير المدعومة', () => {
      expect(validatePaymentMethod('unknown_method')).toBe(false);
      expect(validatePaymentMethod('')).toBe(false);
    });
  });

  describe('التحقق من تفاصيل طريقة الدفع', () => {
    it('يقبل تفاصيل صحيحة لـ Zain Cash', () => {
      const result = validatePaymentDetails('zain_cash', '+9647501234567');
      expect(result.valid).toBe(true);
    });

    it('يرفض تفاصيل غير صحيحة لـ Zain Cash', () => {
      const result = validatePaymentDetails('zain_cash', 'invalid');
      expect(result.valid).toBe(false);
    });

    it('يقبل بريد إلكتروني صحيح لـ Payoneer', () => {
      const result = validatePaymentDetails('payoneer', 'a07501261239@gmail.com');
      expect(result.valid).toBe(true);
    });

    it('يرفض بريد إلكتروني غير صحيح لـ Payoneer', () => {
      const result = validatePaymentDetails('payoneer', 'invalid-email');
      expect(result.valid).toBe(false);
    });

    it('يقبل عنوان محفظة صحيح لـ Binance', () => {
      const result = validatePaymentDetails('binance', 'TRx1234567890abcdefghij');
      expect(result.valid).toBe(true);
    });

    it('يرفض عنوان محفظة قصير', () => {
      const result = validatePaymentDetails('binance', 'short');
      expect(result.valid).toBe(false);
    });
  });

  describe('قائمة طرق الدفع المدعومة', () => {
    it('تحتوي على جميع طرق الدفع المطلوبة', () => {
      expect(SUPPORTED_PAYMENT_METHODS).toContain('zain_cash');
      expect(SUPPORTED_PAYMENT_METHODS).toContain('payoneer');
      expect(SUPPORTED_PAYMENT_METHODS).toContain('paypal');
      expect(SUPPORTED_PAYMENT_METHODS).toContain('binance');
      expect(SUPPORTED_PAYMENT_METHODS).toContain('usdt_trc20');
      expect(SUPPORTED_PAYMENT_METHODS).toContain('bank_transfer');
    });
  });
});

describe('نظام العمولة - Commission System', () => {
  describe('حساب العمولة', () => {
    it('يحسب عمولة 5% بشكل صحيح', () => {
      const result = calculateCommission(100);
      expect(result.commission).toBe(5);
      expect(result.sellerAmount).toBe(95);
    });

    it('يحسب العمولة لمبالغ كبيرة', () => {
      const result = calculateCommission(1000);
      expect(result.commission).toBe(50);
      expect(result.sellerAmount).toBe(950);
    });

    it('يحسب العمولة لمبالغ صغيرة', () => {
      const result = calculateCommission(10);
      expect(result.commission).toBe(0.5);
      expect(result.sellerAmount).toBe(9.5);
    });

    it('يتعامل مع الكسور العشرية', () => {
      const result = calculateCommission(99.99);
      expect(result.commission).toBe(5);
      expect(result.sellerAmount).toBe(94.99);
    });
  });
});

describe('خطط الاشتراك - Subscription Plans', () => {
  describe('التحقق من الخطط', () => {
    it('يقبل الخطط المدعومة', () => {
      expect(validateSubscriptionPlan('free')).toBe(true);
      expect(validateSubscriptionPlan('pro')).toBe(true);
      expect(validateSubscriptionPlan('community')).toBe(true);
    });

    it('يرفض الخطط غير المدعومة', () => {
      expect(validateSubscriptionPlan('premium')).toBe(false);
      expect(validateSubscriptionPlan('')).toBe(false);
    });
  });

  describe('أسعار الخطط', () => {
    it('خطة Free مجانية', () => {
      expect(SUBSCRIPTION_PLANS.free.price).toBe(0);
    });

    it('خطة Pro بسعر $50', () => {
      expect(SUBSCRIPTION_PLANS.pro.price).toBe(50);
    });

    it('خطة Community بسعر $80', () => {
      expect(SUBSCRIPTION_PLANS.community.price).toBe(80);
    });
  });

  describe('حدود المنتجات', () => {
    it('خطة Free: 10 منتجات كحد أقصى', () => {
      expect(SUBSCRIPTION_PLANS.free.maxProducts).toBe(10);
    });

    it('خطة Pro: منتجات غير محدودة', () => {
      expect(SUBSCRIPTION_PLANS.pro.maxProducts).toBe(-1);
    });

    it('خطة Community: منتجات غير محدودة', () => {
      expect(SUBSCRIPTION_PLANS.community.maxProducts).toBe(-1);
    });
  });
});
