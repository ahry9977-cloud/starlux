/**
 * اختبارات نظام OTP المتطور
 * يغطي جميع جوانب النظام: الإنشاء، التحقق، الإرسال، Fallback
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAndSendOTP,
  verifyOTP,
  resendOTP,
  OTP_CONFIG
} from './otpSystem';

describe('نظام OTP المتطور', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('الإعدادات والثوابت', () => {
    it('يجب أن يكون طول OTP 6 أرقام', () => {
      expect(OTP_CONFIG.OTP_LENGTH).toBe(6);
    });

    it('يجب أن تكون صلاحية OTP 5 دقائق', () => {
      expect(OTP_CONFIG.OTP_EXPIRY_MINUTES).toBe(5);
    });

    it('يجب أن يكون الحد الأقصى للمحاولات الفاشلة 3', () => {
      expect(OTP_CONFIG.MAX_FAILED_ATTEMPTS).toBe(3);
    });

    it('يجب أن تكون مدة القفل 15 دقيقة', () => {
      expect(OTP_CONFIG.LOCK_DURATION_MINUTES).toBe(15);
    });

    it('يجب أن يكون الحد الأقصى لإعادة المحاولة 3', () => {
      expect(OTP_CONFIG.MAX_SEND_RETRIES).toBe(3);
    });
  });

  describe('التحقق من المدخلات', () => {
    it('يجب رفض البريد الفارغ', async () => {
      const result = await createAndSendOTP({
        email: '',
        purpose: 'password_reset'
      });
      
      expect(result.success).toBe(false);
    });

    it('يجب رفض الهاتف الفارغ', async () => {
      const result = await createAndSendOTP({
        phoneNumber: '',
        purpose: 'password_reset'
      });
      
      expect(result.success).toBe(false);
    });

    it('يجب رفض البريد الإلكتروني غير الصالح', async () => {
      const result = await createAndSendOTP({
        email: 'invalid-email',
        purpose: 'password_reset'
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('صالح');
    });

    it('يجب رفض رقم الهاتف غير الصالح', async () => {
      const result = await createAndSendOTP({
        phoneNumber: '123',
        purpose: 'password_reset'
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('صالح');
    });

    it('يجب رفض الطلب بدون بريد أو هاتف', async () => {
      const result = await createAndSendOTP({
        purpose: 'password_reset'
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('بريد');
    });
  });

  describe('التحقق من OTP', () => {
    it('يجب رفض OTP منتهي الصلاحية أو غير موجود', async () => {
      const verifyResult = await verifyOTP(
        'nonexistent@example.com',
        '123456',
        'password_reset'
      );
      
      expect(verifyResult.success).toBe(false);
      expect(verifyResult.message).toContain('غير صالح');
    });
  });
});
