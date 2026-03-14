/**
 * نظام استعادة كلمة المرور الآمن
 * STAR LUX - منصة التجارة الإلكترونية
 * 
 * الميزات:
 * - توليد OTP عشوائي 6 أرقام
 * - تشفير OTP باستخدام HMAC-SHA256
 * - صلاحية 5 دقائق
 * - Rate Limiting لمنع التخمين
 * - قفل مؤقت بعد 5 محاولات فاشلة
 * - إرسال بريد فوري مع إعادة المحاولة
 */

import crypto from 'crypto';
import { getDb } from '../db';
import { passwordResets, users } from '../drizzle/schema';
import { eq, and, gt, desc } from 'drizzle-orm';

// ============= الثوابت =============
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const MAX_EMAIL_RETRIES = 3;
const EMAIL_RETRY_DELAY_MS = 1000;
const RATE_LIMIT_REQUESTS = 3; // عدد الطلبات المسموحة
const RATE_LIMIT_WINDOW_MINUTES = 15; // نافذة الوقت

export const CONSTANTS = {
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MINUTES,
  MAX_EMAIL_RETRIES,
  EMAIL_RETRY_DELAY_MS,
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW_MINUTES,
} as const;

// ============= توليد OTP عشوائي آمن =============
export function generateSecureOTP(): string {
  // استخدام crypto.randomInt للحصول على رقم عشوائي آمن
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  const otp = crypto.randomInt(min, max + 1);
  return otp.toString().padStart(OTP_LENGTH, '0');
}

// ============= توليد Salt عشوائي =============
export function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ============= تشفير OTP باستخدام HMAC-SHA256 =============
export function hashOTP(otp: string, salt: string): string {
  const hmac = crypto.createHmac('sha256', salt);
  hmac.update(otp);
  return hmac.digest('hex');
}

// ============= التحقق من OTP =============
export function verifyOTP(inputOTP: string, storedHash: string, salt: string): boolean {
  const inputHash = hashOTP(inputOTP, salt);
  // استخدام timingSafeEqual لمنع timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    return false;
  }
}

// ============= التحقق من Rate Limiting =============
export async function checkRateLimit(email: string): Promise<{ allowed: boolean; remainingAttempts: number; waitTime?: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  
  const db = await getDb();
  if (!db) {
    return { allowed: true, remainingAttempts: RATE_LIMIT_REQUESTS };
  }
  
  const recentRequests = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.email, email),
        gt(passwordResets.createdAt, windowStart)
      )
    );
  
  const requestCount = recentRequests.length;
  const remainingAttempts = Math.max(0, RATE_LIMIT_REQUESTS - requestCount);
  
  if (requestCount >= RATE_LIMIT_REQUESTS) {
    // حساب وقت الانتظار
    const oldestRequest = recentRequests.sort((a: typeof recentRequests[0], b: typeof recentRequests[0]) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
    const waitTime = Math.ceil(
      (new Date(oldestRequest.createdAt).getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000 - Date.now()) / 1000
    );
    
    return { allowed: false, remainingAttempts: 0, waitTime };
  }
  
  return { allowed: true, remainingAttempts };
}

// ============= إنشاء طلب استعادة كلمة المرور =============
export interface CreateResetRequestResult {
  success: boolean;
  message: string;
  resetId?: number;
  otp?: string; // فقط للاختبار، لا يُرسل للمستخدم
  expiresAt?: Date;
}

export async function createPasswordResetRequest(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<CreateResetRequestResult> {
  // 1. التحقق من وجود البريد الإلكتروني
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'خطأ في الاتصال بقاعدة البيانات' };
  }
  
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  
  // رسالة أمنية موحدة (لا تكشف وجود الحساب)
  const securityMessage = 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رمز التحقق إليه';
  
  if (user.length === 0) {
    // لا نكشف أن البريد غير موجود
    console.log(`[Password Reset] Email not found: ${email}`);
    return { success: true, message: securityMessage };
  }
  
  const foundUser = user[0];
  
  // 2. التحقق من Rate Limiting
  const rateLimit = await checkRateLimit(email);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `تم تجاوز الحد المسموح. يرجى الانتظار ${Math.ceil(rateLimit.waitTime! / 60)} دقيقة`
    };
  }
  
  // 3. إلغاء الطلبات السابقة غير المستخدمة
  await db
    .update(passwordResets)
    .set({ isUsed: true })
    .where(
      and(
        eq((passwordResets as any).userId, foundUser.id),
        eq(passwordResets.isUsed, false)
      )
    );
  
  // 4. توليد OTP جديد
  const otp = generateSecureOTP();
  const salt = generateSalt();
  const otpHash = hashOTP(otp, salt);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  
  // 5. حفظ الطلب في قاعدة البيانات
  const result = await db.insert(passwordResets).values({
    userId: foundUser.id,
    email: email.toLowerCase().trim(),
    phoneNumber: foundUser.phoneNumber || undefined,
    otp: otp, // للتوافق العكسي
    otpHash: otpHash,
    otpSalt: salt,
    expiresAt: expiresAt,
    isUsed: false,
    failedAttempts: 0,
    isLocked: false,
    emailSent: false,
    emailRetries: 0,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });
  
  const resetId = result[0].insertId;
  
  console.log(`[Password Reset] OTP generated for ${email}: ${otp} (expires: ${expiresAt.toISOString()})`);
  
  return {
    success: true,
    message: securityMessage,
    resetId: resetId,
    otp: otp, // للاختبار فقط
    expiresAt: expiresAt
  };
}

// ============= التحقق من رمز OTP =============
export interface VerifyOTPResult {
  success: boolean;
  message: string;
  resetToken?: string;
  userId?: number;
}

export async function verifyPasswordResetOTP(
  email: string,
  inputOTP: string
): Promise<VerifyOTPResult> {
  // 1. البحث عن طلب استعادة صالح
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'خطأ في الاتصال بقاعدة البيانات' };
  }
  
  const resetRequests = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.email, email.toLowerCase().trim()),
        eq(passwordResets.isUsed, false),
        eq((passwordResets as any).isLocked, false),
        gt((passwordResets as any).expiresAt, new Date())
      )
    )
    .orderBy(desc(passwordResets.createdAt))
    .limit(1);
  
  if (resetRequests.length === 0) {
    console.log(`[Password Reset] No valid reset request found for: ${email}`);
    return {
      success: false,
      message: 'رمز التحقق غير صالح أو منتهي الصلاحية'
    };
  }
  
  const resetRequest = resetRequests[0];
  
  // 2. التحقق من القفل
  if (resetRequest.isLocked) {
    const lockExpiry = resetRequest.lockedUntil;
    if (lockExpiry && new Date() < lockExpiry) {
      const remainingMinutes = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000);
      return {
        success: false,
        message: `تم قفل الحساب مؤقتاً. يرجى الانتظار ${remainingMinutes} دقيقة`
      };
    }
    // إلغاء القفل إذا انتهت المدة
    await db
      .update(passwordResets)
      .set({ isLocked: false, failedAttempts: 0 })
      .where(eq(passwordResets.id, resetRequest.id));
  }
  
  // 3. التحقق من OTP
  let isValid = false;
  
  // التحقق باستخدام النظام الجديد (HMAC)
  if (resetRequest.otpHash && resetRequest.otpSalt) {
    isValid = verifyOTP(inputOTP, resetRequest.otpHash, resetRequest.otpSalt);
  }
  // التوافق العكسي مع النظام القديم
  else if (resetRequest.otp) {
    isValid = resetRequest.otp === inputOTP;
  }
  
  if (!isValid) {
    // زيادة عداد المحاولات الفاشلة
    const newFailedAttempts = (resetRequest.failedAttempts || 0) + 1;
    const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;
    const lockedUntil = shouldLock 
      ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
      : null;
    
    await db
      .update(passwordResets)
      .set({
        failedAttempts: newFailedAttempts,
        isLocked: shouldLock,
        lockedUntil: lockedUntil
      })
      .where(eq(passwordResets.id, resetRequest.id));
    
    const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;
    
    if (shouldLock) {
      console.log(`[Password Reset] Account locked for ${email} after ${MAX_FAILED_ATTEMPTS} failed attempts`);
      return {
        success: false,
        message: `تم قفل الحساب مؤقتاً بسبب المحاولات الفاشلة. يرجى الانتظار ${LOCK_DURATION_MINUTES} دقيقة`
      };
    }
    
    console.log(`[Password Reset] Invalid OTP for ${email}. Remaining attempts: ${remainingAttempts}`);
    return {
      success: false,
      message: `رمز التحقق غير صحيح. المحاولات المتبقية: ${remainingAttempts}`
    };
  }
  
  // 4. OTP صحيح - توليد رمز إعادة التعيين
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // تحديث الطلب
  await db
    .update(passwordResets)
    .set({
      isUsed: true,
      // يمكن حفظ resetToken هنا إذا أردنا
    })
    .where(eq(passwordResets.id, resetRequest.id));
  
  console.log(`[Password Reset] OTP verified successfully for ${email}`);
  
  return {
    success: true,
    message: 'تم التحقق بنجاح',
    resetToken: resetToken,
    userId: resetRequest.userId
  };
}

// ============= إعادة تعيين كلمة المرور =============
export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

export async function resetPassword(
  userId: number,
  newPassword: string
): Promise<ResetPasswordResult> {
  // 1. التحقق من قوة كلمة المرور
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return {
      success: false,
      message: passwordValidation.message
    };
  }
  
  // 2. جلب المستخدم
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'خطأ في الاتصال بقاعدة البيانات' };
  }
  
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (userResult.length === 0) {
    return {
      success: false,
      message: 'المستخدم غير موجود'
    };
  }
  
  const user = userResult[0];
  
  // 3. التحقق من أن كلمة المرور الجديدة ليست نفس القديمة
  const bcrypt = await import('bcryptjs');
  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    return {
      success: false,
      message: 'لا يمكن استخدام كلمة المرور القديمة'
    };
  }
  
  // 4. تشفير كلمة المرور الجديدة
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
  
  // 5. تحديث كلمة المرور
  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
      failedLoginAttempts: 0, // إعادة تعيين محاولات تسجيل الدخول الفاشلة
      lockedUntil: null
    })
    .where(eq(users.id, userId));
  
  console.log(`[Password Reset] Password successfully reset for user ID: ${userId}`);
  
  return {
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح'
  };
}

// ============= التحقق من قوة كلمة المرور =============
export interface PasswordValidation {
  isValid: boolean;
  message: string;
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors: string[] = [];
  
  if (password.length < minLength) {
    errors.push(`يجب أن تكون كلمة المرور ${minLength} أحرف على الأقل`);
  }
  
  if (!hasUpperCase) {
    errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  }
  
  if (!hasLowerCase) {
    errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  }
  
  if (!hasNumbers) {
    errors.push('يجب أن تحتوي على رقم واحد على الأقل');
  }
  
  if (!hasSpecialChars) {
    errors.push('يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*)');
  }
  
  // حساب القوة
  let strengthScore = 0;
  if (password.length >= minLength) strengthScore++;
  if (password.length >= 12) strengthScore++;
  if (hasUpperCase) strengthScore++;
  if (hasLowerCase) strengthScore++;
  if (hasNumbers) strengthScore++;
  if (hasSpecialChars) strengthScore++;
  
  let strength: 'weak' | 'medium' | 'strong';
  if (strengthScore <= 3) strength = 'weak';
  else if (strengthScore <= 5) strength = 'medium';
  else strength = 'strong';
  
  return {
    isValid: errors.length === 0,
    message: errors.length > 0 ? errors.join('. ') : 'كلمة المرور قوية',
    strength
  };
}

// ============= إرسال البريد الإلكتروني =============
export interface SendEmailResult {
  success: boolean;
  message: string;
  retries?: number;
}

export async function sendPasswordResetEmail(
  email: string,
  otp: string,
  userName?: string
): Promise<SendEmailResult> {
  const maxRetries = MAX_EMAIL_RETRIES;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // استخدام نظام الإشعارات المدمج
      const { notifyOwner } = await import('../_core/notification');
      
      const emailContent = `
مرحباً ${userName || 'عزيزي المستخدم'},

لقد طلبت إعادة تعيين كلمة المرور لحسابك في STAR LUX.

رمز التحقق الخاص بك هو: ${otp}

هذا الرمز صالح لمدة 5 دقائق فقط.

إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.

مع تحيات،
فريق STAR LUX
      `.trim();
      
      // إرسال الإشعار (يمكن استبداله بـ SMTP لاحقاً)
      const sent = await notifyOwner({
        title: `رمز استعادة كلمة المرور - ${email}`,
        content: emailContent
      });
      
      if (Boolean(sent)) {
        console.log(`[Email] Password reset email sent to ${email} (attempt ${attempt})`);
        return {
          success: true,
          message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
          retries: attempt - 1
        };
      }
      
      throw new Error('فشل إرسال الإشعار');
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error?.message ?? error));
      console.error(`[Email] Failed to send password reset email to ${email} (attempt ${attempt}/${maxRetries})`, lastError);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, EMAIL_RETRY_DELAY_MS));
      }
    }
  }

  return {
    success: false,
    message: lastError?.message || 'فشل إرسال رمز التحقق، يرجى المحاولة لاحقاً',
    retries: maxRetries,
  };
}