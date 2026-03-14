/**
 * نظام OTP المتطور - STAR LUX
 * إرسال فوري عبر البريد وWhatsApp مع Fallback تلقائي
 */

import crypto from 'crypto';

// الثوابت
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_FAILED_ATTEMPTS = 3;
const LOCK_DURATION_MINUTES = 15;
const MAX_SEND_RETRIES = 3;

// الأنواع
export type OTPPurpose = 'registration' | 'password_reset' | 'verify_account' | 'change_email' | 'change_phone';
export type SendChannel = 'email' | 'whatsapp' | 'both';

export interface SendResult {
  success: boolean;
  channel: SendChannel;
  message: string;
  error?: string;
}

export interface CreateOTPResult {
  success: boolean;
  message: string;
  otpId?: string;
  expiresAt?: Date;
  channel?: SendChannel;
  otp?: string;
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  email?: string;
  phoneNumber?: string;
}

// توليد OTP آمن
export function generateSecureOTP(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return crypto.randomInt(min, max + 1).toString().padStart(OTP_LENGTH, '0');
}

export function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashOTP(otp: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

export function verifyOTPHash(inputOTP: string, storedHash: string, salt: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hashOTP(inputOTP, salt), 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch { return false; }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone.replace(/\s/g, ''));
}

// مخزن OTP
const otpStore = new Map<string, {
  otpId: string;
  email?: string;
  phoneNumber?: string;
  otpHash: string;
  otpSalt: string;
  purpose: OTPPurpose;
  expiresAt: Date;
  isUsed: boolean;
  failedAttempts: number;
  isLocked: boolean;
  lockedUntil?: Date;
  createdAt: Date;
}>();

// إرسال البريد
export async function sendOTPViaEmail(email: string, otp: string, purpose: OTPPurpose, userName?: string): Promise<SendResult> {
  if (!isValidEmail(email)) {
    return { success: false, channel: 'email', message: 'البريد غير صالح', error: 'INVALID_EMAIL' };
  }
  
  const subjects: Record<OTPPurpose, string> = {
    registration: 'STAR LUX - رمز إنشاء الحساب',
    password_reset: 'STAR LUX - رمز استعادة كلمة المرور',
    verify_account: 'STAR LUX - رمز التحقق',
    change_email: 'STAR LUX - رمز تغيير البريد',
    change_phone: 'STAR LUX - رمز تغيير الهاتف'
  };
  
  const body = `مرحباً ${userName || ''},\n\nرمز التحقق الخاص بك: 🔐 ${otp}\n\nصالح لمدة 5 دقائق فقط.\n\nفريق STAR LUX`;
  
  for (let retry = 0; retry < MAX_SEND_RETRIES; retry++) {
    try {
      const { sendEmail } = await import('./emailNotifications');
      // إرسال بريد OTP مباشر
      const result = await sendEmail(email, 'otpCode', { otp, userName: userName || '' });
      if (result.success) {
        console.log(`[OTP Email] ✅ Sent to ${email}`);
        return { success: true, channel: 'email', message: 'تم إرسال رمز التحقق إلى بريدك' };
      }
    } catch (e) {
      console.error(`[OTP Email] Attempt ${retry + 1} failed`);
    }
    await new Promise(r => setTimeout(r, 1000 * (retry + 1)));
  }
  return { success: false, channel: 'email', message: 'فشل إرسال البريد', error: 'SEND_FAILED' };
}

// إرسال واتساب
export async function sendOTPViaWhatsApp(phoneNumber: string, otp: string, purpose: OTPPurpose): Promise<SendResult> {
  if (!isValidPhoneNumber(phoneNumber)) {
    return { success: false, channel: 'whatsapp', message: 'الرقم غير صالح', error: 'INVALID_PHONE' };
  }
  
  const message = `🌟 *STAR LUX*\n\nرمز التحقق: 🔐 *${otp}*\n\nصالح 5 دقائق`;
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  
  for (let retry = 0; retry < MAX_SEND_RETRIES; retry++) {
    try {
      if (!apiUrl || !apiKey || !phoneId) {
        console.log(`[WhatsApp Mock] Sent to ${phoneNumber}`);
        return { success: true, channel: 'whatsapp', message: 'تم إرسال رمز التحقق إلى واتساب' };
      }
      
      const response = await fetch(`${apiUrl}/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: phoneNumber.replace(/\D/g, ''), type: 'text', text: { body: message } })
      });
      
      if (response.ok) {
        console.log(`[OTP WhatsApp] ✅ Sent to ${phoneNumber}`);
        return { success: true, channel: 'whatsapp', message: 'تم إرسال رمز التحقق إلى واتساب' };
      }
    } catch (e) {
      console.error(`[OTP WhatsApp] Attempt ${retry + 1} failed`);
    }
    await new Promise(r => setTimeout(r, 1000 * (retry + 1)));
  }
  return { success: false, channel: 'whatsapp', message: 'فشل إرسال واتساب', error: 'SEND_FAILED' };
}

// Fallback تلقائي
export async function sendOTPWithFallback(
  email: string | undefined,
  phoneNumber: string | undefined,
  otp: string,
  purpose: OTPPurpose,
  userName?: string,
  preferredChannel: SendChannel = 'email'
): Promise<SendResult> {
  const hasEmail = email && isValidEmail(email);
  const hasPhone = phoneNumber && isValidPhoneNumber(phoneNumber);
  
  if (!hasEmail && !hasPhone) {
    return { success: false, channel: 'both', message: 'لا توجد قناة إرسال صالحة', error: 'NO_CHANNEL' };
  }
  
  if (preferredChannel === 'email' && hasEmail) {
    const result = await sendOTPViaEmail(email!, otp, purpose, userName);
    if (result.success) return result;
    if (hasPhone) {
      console.log('[Fallback] البريد فشل، جاري المحاولة عبر واتساب...');
      return sendOTPViaWhatsApp(phoneNumber!, otp, purpose);
    }
    return result;
  }
  
  if (preferredChannel === 'whatsapp' && hasPhone) {
    const result = await sendOTPViaWhatsApp(phoneNumber!, otp, purpose);
    if (result.success) return result;
    if (hasEmail) {
      console.log('[Fallback] واتساب فشل، جاري المحاولة عبر البريد...');
      return sendOTPViaEmail(email!, otp, purpose, userName);
    }
    return result;
  }
  
  if (hasEmail) return sendOTPViaEmail(email!, otp, purpose, userName);
  return sendOTPViaWhatsApp(phoneNumber!, otp, purpose);
}

// إنشاء وإرسال OTP
export async function createAndSendOTP(options: {
  email?: string;
  phoneNumber?: string;
  purpose: OTPPurpose;
  userName?: string;
  preferredChannel?: SendChannel;
}): Promise<CreateOTPResult> {
  const { email, phoneNumber, purpose, userName, preferredChannel = 'email' } = options;
  
  if (!email && !phoneNumber) {
    return { success: false, message: 'يرجى توفير بريد إلكتروني أو رقم هاتف' };
  }
  
  const otp = generateSecureOTP();
  const salt = generateSalt();
  const otpHash = hashOTP(otp, salt);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const otpId = crypto.randomBytes(16).toString('hex');
  
  otpStore.set(otpId, {
    otpId, email, phoneNumber, otpHash, otpSalt: salt, purpose, expiresAt,
    isUsed: false, failedAttempts: 0, isLocked: false, createdAt: new Date()
  });
  
  const sendResult = await sendOTPWithFallback(email, phoneNumber, otp, purpose, userName, preferredChannel);
  
  if (!sendResult.success) {
    otpStore.delete(otpId);
    return { success: false, message: sendResult.message };
  }
  
  console.log(`[OTP] ✅ Created and sent for ${email || phoneNumber}`);
  return { success: true, message: sendResult.message, otpId, expiresAt, channel: sendResult.channel, otp };
}

// التحقق من OTP
export async function verifyOTP(identifier: string, inputOTP: string, purpose: OTPPurpose): Promise<VerifyOTPResult> {
  let foundRecord: ReturnType<typeof otpStore.get>;
  let foundId: string | undefined;
  
  const entries = Array.from(otpStore.entries());
  for (let i = 0; i < entries.length; i++) {
    const [id, record] = entries[i];
    if ((record.email === identifier || record.phoneNumber === identifier) &&
        record.purpose === purpose && !record.isUsed && new Date() < record.expiresAt) {
      foundRecord = record;
      foundId = id;
      break;
    }
  }
  
  if (!foundRecord || !foundId) {
    return { success: false, message: 'رمز التحقق غير صالح أو منتهي الصلاحية' };
  }
  
  if (foundRecord.isLocked && foundRecord.lockedUntil && new Date() < foundRecord.lockedUntil) {
    const mins = Math.ceil((foundRecord.lockedUntil.getTime() - Date.now()) / 60000);
    return { success: false, message: `الحساب مقفل مؤقتاً. انتظر ${mins} دقيقة` };
  }
  
  if (!verifyOTPHash(inputOTP, foundRecord.otpHash, foundRecord.otpSalt)) {
    foundRecord.failedAttempts++;
    if (foundRecord.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      foundRecord.isLocked = true;
      foundRecord.lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      return { success: false, message: `تم قفل الحساب. انتظر ${LOCK_DURATION_MINUTES} دقيقة` };
    }
    return { success: false, message: `رمز خاطئ. المحاولات المتبقية: ${MAX_FAILED_ATTEMPTS - foundRecord.failedAttempts}` };
  }
  
  foundRecord.isUsed = true;
  console.log(`[OTP] ✅ Verified for ${identifier}`);
  return { success: true, message: 'تم التحقق بنجاح', email: foundRecord.email, phoneNumber: foundRecord.phoneNumber };
}

// إعادة إرسال OTP
export async function resendOTP(identifier: string, purpose: OTPPurpose, channel?: SendChannel): Promise<CreateOTPResult> {
  return createAndSendOTP({
    email: isValidEmail(identifier) ? identifier : undefined,
    phoneNumber: isValidPhoneNumber(identifier) ? identifier : undefined,
    purpose,
    preferredChannel: channel
  });
}

// تنظيف دوري
setInterval(() => {
  const now = new Date();
  const entries = Array.from(otpStore.entries());
  for (let i = 0; i < entries.length; i++) {
    const [id, record] = entries[i];
    if (record.expiresAt < now || record.isUsed) otpStore.delete(id);
  }
}, 60000);

export const OTP_CONFIG = { OTP_LENGTH, OTP_EXPIRY_MINUTES, MAX_FAILED_ATTEMPTS, LOCK_DURATION_MINUTES, MAX_SEND_RETRIES };
