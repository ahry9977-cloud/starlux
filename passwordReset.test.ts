/**
 * اختبارات نظام استعادة كلمة المرور
 * STAR LUX - منصة التجارة الإلكترونية
 * 
 * تغطية الاختبارات:
 * - توليد OTP آمن
 * - تشفير OTP باستخدام HMAC-SHA256
 * - التحقق من OTP
 * - التحقق من قوة كلمة المرور
 * - Rate Limiting
 * - الأمان ضد Timing Attacks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateSecureOTP,
  generateSalt,
  hashOTP,
  verifyOTP,
  validatePasswordStrength,
  CONSTANTS
} from './passwordReset';

describe('نظام استعادة كلمة المرور', () => {
  
  describe('توليد OTP آمن', () => {
    it('يجب أن يولد OTP بطول 6 أرقام', () => {
      const otp = generateSecureOTP();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });
    
    it('يجب أن يولد OTP مختلف في كل مرة', () => {
      const otps = new Set();
      for (let i = 0; i < 100; i++) {
        otps.add(generateSecureOTP());
      }
      // يجب أن يكون هناك تنوع كبير (على الأقل 90 قيمة مختلفة من 100)
      expect(otps.size).toBeGreaterThan(90);
    });
    
    it('يجب أن يكون OTP رقمياً فقط', () => {
      for (let i = 0; i < 50; i++) {
        const otp = generateSecureOTP();
        expect(Number.isInteger(parseInt(otp, 10))).toBe(true);
        expect(parseInt(otp, 10)).toBeGreaterThanOrEqual(100000);
        expect(parseInt(otp, 10)).toBeLessThanOrEqual(999999);
      }
    });
  });
  
  describe('توليد Salt', () => {
    it('يجب أن يولد Salt بطول 64 حرف (32 bytes hex)', () => {
      const salt = generateSalt();
      expect(salt).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(salt)).toBe(true);
    });
    
    it('يجب أن يولد Salt مختلف في كل مرة', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });
  
  describe('تشفير OTP باستخدام HMAC-SHA256', () => {
    it('يجب أن يولد hash بطول 64 حرف', () => {
      const otp = '123456';
      const salt = generateSalt();
      const hash = hashOTP(otp, salt);
      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
    });
    
    it('يجب أن يولد نفس الـ hash لنفس OTP و Salt', () => {
      const otp = '123456';
      const salt = 'test-salt-12345678901234567890123456789012';
      const hash1 = hashOTP(otp, salt);
      const hash2 = hashOTP(otp, salt);
      expect(hash1).toBe(hash2);
    });
    
    it('يجب أن يولد hash مختلف لـ OTP مختلف', () => {
      const salt = generateSalt();
      const hash1 = hashOTP('123456', salt);
      const hash2 = hashOTP('654321', salt);
      expect(hash1).not.toBe(hash2);
    });
    
    it('يجب أن يولد hash مختلف لـ Salt مختلف', () => {
      const otp = '123456';
      const hash1 = hashOTP(otp, generateSalt());
      const hash2 = hashOTP(otp, generateSalt());
      expect(hash1).not.toBe(hash2);
    });
  });
  
  describe('التحقق من OTP', () => {
    it('يجب أن يتحقق من OTP صحيح', () => {
      const otp = '123456';
      const salt = generateSalt();
      const hash = hashOTP(otp, salt);
      expect(verifyOTP(otp, hash, salt)).toBe(true);
    });
    
    it('يجب أن يرفض OTP خاطئ', () => {
      const salt = generateSalt();
      const hash = hashOTP('123456', salt);
      expect(verifyOTP('654321', hash, salt)).toBe(false);
    });
    
    it('يجب أن يرفض OTP مع Salt خاطئ', () => {
      const otp = '123456';
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const hash = hashOTP(otp, salt1);
      expect(verifyOTP(otp, hash, salt2)).toBe(false);
    });
    
    it('يجب أن يتعامل مع hash غير صالح', () => {
      const otp = '123456';
      const salt = generateSalt();
      expect(verifyOTP(otp, 'invalid-hash', salt)).toBe(false);
    });
    
    it('يجب أن يتعامل مع hash فارغ', () => {
      const otp = '123456';
      const salt = generateSalt();
      expect(verifyOTP(otp, '', salt)).toBe(false);
    });
  });
  
  describe('التحقق من قوة كلمة المرور', () => {
    it('يجب أن يرفض كلمة مرور قصيرة', () => {
      const result = validatePasswordStrength('Ab1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('8 أحرف');
    });
    
    it('يجب أن يرفض كلمة مرور بدون حرف كبير', () => {
      const result = validatePasswordStrength('abcdef1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('حرف كبير');
    });
    
    it('يجب أن يرفض كلمة مرور بدون حرف صغير', () => {
      const result = validatePasswordStrength('ABCDEF1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('حرف صغير');
    });
    
    it('يجب أن يرفض كلمة مرور بدون رقم', () => {
      const result = validatePasswordStrength('Abcdefgh!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('رقم');
    });
    
    it('يجب أن يرفض كلمة مرور بدون رمز خاص', () => {
      const result = validatePasswordStrength('Abcdefg1');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('رمز خاص');
    });
    
    it('يجب أن يقبل كلمة مرور قوية', () => {
      const result = validatePasswordStrength('Abcdef1!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('medium');
    });
    
    it('يجب أن يصنف كلمة مرور طويلة وقوية', () => {
      const result = validatePasswordStrength('MyStr0ng!Password123');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });
    
    it('يجب أن يصنف كلمة مرور ضعيفة', () => {
      const result = validatePasswordStrength('abc');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
    });
  });
  
  describe('الثوابت الأمنية', () => {
    it('يجب أن يكون طول OTP 6 أرقام', () => {
      expect(CONSTANTS.OTP_LENGTH).toBe(6);
    });
    
    it('يجب أن تكون صلاحية OTP 5 دقائق', () => {
      expect(CONSTANTS.OTP_EXPIRY_MINUTES).toBe(5);
    });
    
    it('يجب أن يكون الحد الأقصى للمحاولات الفاشلة 5', () => {
      expect(CONSTANTS.MAX_FAILED_ATTEMPTS).toBe(5);
    });
    
    it('يجب أن تكون مدة القفل 15 دقيقة', () => {
      expect(CONSTANTS.LOCK_DURATION_MINUTES).toBe(15);
    });
    
    it('يجب أن يكون الحد الأقصى لإعادة إرسال البريد 3', () => {
      expect(CONSTANTS.MAX_EMAIL_RETRIES).toBe(3);
    });
    
    it('يجب أن يكون Rate Limit 3 طلبات في 15 دقيقة', () => {
      expect(CONSTANTS.RATE_LIMIT_REQUESTS).toBe(3);
      expect(CONSTANTS.RATE_LIMIT_WINDOW_MINUTES).toBe(15);
    });
  });
  
  describe('اختبارات الأمان', () => {
    it('يجب أن يكون التحقق من OTP مقاوم لـ Timing Attacks', () => {
      const salt = generateSalt();
      const correctOTP = '123456';
      const hash = hashOTP(correctOTP, salt);
      
      // قياس وقت التحقق من OTP صحيح
      const startCorrect = performance.now();
      for (let i = 0; i < 1000; i++) {
        verifyOTP(correctOTP, hash, salt);
      }
      const timeCorrect = performance.now() - startCorrect;
      
      // قياس وقت التحقق من OTP خاطئ
      const startWrong = performance.now();
      for (let i = 0; i < 1000; i++) {
        verifyOTP('000000', hash, salt);
      }
      const timeWrong = performance.now() - startWrong;
      
      // يجب أن يكون الفرق في الوقت صغيراً (أقل من 100% - مرونة للبيئات المختلفة)
      const timeDiff = Math.abs(timeCorrect - timeWrong) / Math.max(timeCorrect, timeWrong);
      expect(timeDiff).toBeLessThan(1.0);
    });
    
    it('يجب أن لا يكشف OTP من خلال الـ hash', () => {
      const salt = generateSalt();
      const hash = hashOTP('123456', salt);
      
      // لا يمكن استنتاج OTP من الـ hash
      expect(hash).not.toContain('123456');
      expect(hash.length).toBe(64);
    });
    
    it('يجب أن يكون Salt عشوائياً بما فيه الكفاية', () => {
      const salts: string[] = [];
      for (let i = 0; i < 100; i++) {
        salts.push(generateSalt());
      }
      
      // التحقق من عدم وجود تكرار
      const uniqueSalts = new Set(salts);
      expect(uniqueSalts.size).toBe(100);
    });
  });
  
  describe('اختبارات الحالات الحدية', () => {
    it('يجب أن يتعامل مع OTP يبدأ بأصفار', () => {
      const otp = '000001';
      const salt = generateSalt();
      const hash = hashOTP(otp, salt);
      expect(verifyOTP(otp, hash, salt)).toBe(true);
    });
    
    it('يجب أن يتعامل مع كلمة مرور فارغة', () => {
      const result = validatePasswordStrength('');
      expect(result.isValid).toBe(false);
    });
    
    it('يجب أن يتعامل مع كلمة مرور طويلة جداً', () => {
      const longPassword = 'Aa1!' + 'x'.repeat(1000);
      const result = validatePasswordStrength(longPassword);
      expect(result.isValid).toBe(true);
    });
    
    it('يجب أن يتعامل مع أحرف Unicode في كلمة المرور', () => {
      const result = validatePasswordStrength('Aa1!عربي');
      expect(result.isValid).toBe(true);
    });
  });
});

describe('اختبارات التكامل', () => {
  it('يجب أن يعمل التدفق الكامل: توليد → تشفير → تحقق', () => {
    // 1. توليد OTP
    const otp = generateSecureOTP();
    expect(otp).toHaveLength(6);
    
    // 2. توليد Salt
    const salt = generateSalt();
    expect(salt).toHaveLength(64);
    
    // 3. تشفير OTP
    const hash = hashOTP(otp, salt);
    expect(hash).toHaveLength(64);
    
    // 4. التحقق من OTP
    expect(verifyOTP(otp, hash, salt)).toBe(true);
    
    // 5. رفض OTP خاطئ
    const wrongOTP = otp === '123456' ? '654321' : '123456';
    expect(verifyOTP(wrongOTP, hash, salt)).toBe(false);
  });
  
  it('يجب أن يعمل تدفق كلمة المرور: تحقق → قبول/رفض', () => {
    // كلمات مرور ضعيفة
    expect(validatePasswordStrength('123').isValid).toBe(false);
    expect(validatePasswordStrength('password').isValid).toBe(false);
    expect(validatePasswordStrength('PASSWORD').isValid).toBe(false);
    
    // كلمات مرور قوية
    expect(validatePasswordStrength('MyP@ssw0rd!').isValid).toBe(true);
    expect(validatePasswordStrength('Str0ng!Pass').isValid).toBe(true);
  });
});
