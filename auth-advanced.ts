/**
 * نظام المصادقة المتقدم
 * JWT + Refresh Tokens + حماية Brute Force
 */

import { SignJWT, jwtVerify } from 'jose';
import { User } from './drizzle/schema';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_SECRET + '-refresh');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const BRUTE_FORCE_MAX_ATTEMPTS = 5;
const BRUTE_FORCE_LOCK_TIME = 15 * 60 * 1000; // 15 دقيقة

/**
 * إنشاء Access Token
 */
export async function createAccessToken(user: User): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

/**
 * إنشاء Refresh Token
 */
export async function createRefreshToken(user: User): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_SECRET);

  return token;
}

/**
 * التحقق من Access Token
 */
export async function verifyAccessToken(token: string) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * التحقق من Refresh Token
 */
export async function verifyRefreshToken(token: string) {
  try {
    const verified = await jwtVerify(token, REFRESH_SECRET);
    return verified.payload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * فئة لإدارة محاولات تسجيل الدخول الفاشلة
 */
export class BruteForceProtection {
  private static attempts: Map<string, { count: number; lockedUntil: number }> = new Map();

  /**
   * التحقق من حالة الحساب
   */
  static isLocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    const now = Date.now();
    if (now > record.lockedUntil) {
      this.attempts.delete(identifier);
      return false;
    }

    return record.count >= BRUTE_FORCE_MAX_ATTEMPTS;
  }

  /**
   * تسجيل محاولة فاشلة
   */
  static recordFailedAttempt(identifier: string): void {
    const record = this.attempts.get(identifier) || {
      count: 0,
      lockedUntil: 0,
    };

    record.count++;
    record.lockedUntil = Date.now() + BRUTE_FORCE_LOCK_TIME;

    this.attempts.set(identifier, record);
  }

  /**
   * إعادة تعيين المحاولات الفاشلة
   */
  static resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * الحصول على معلومات المحاولات
   */
  static getAttempts(identifier: string) {
    const record = this.attempts.get(identifier);
    if (!record) {
      return { count: 0, lockedUntil: null };
    }

    const now = Date.now();
    if (now > record.lockedUntil) {
      this.attempts.delete(identifier);
      return { count: 0, lockedUntil: null };
    }

    return {
      count: record.count,
      lockedUntil: new Date(record.lockedUntil),
      remainingTime: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }
}

/**
 * إنشاء Tokens للمستخدم
 */
export async function createTokenPair(user: User) {
  const accessToken = await createAccessToken(user);
  const refreshToken = await createRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 دقيقة بالثواني
    tokenType: 'Bearer',
  };
}

/**
 * تحديث Access Token باستخدام Refresh Token
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = await verifyRefreshToken(refreshToken);

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // يجب الحصول على بيانات المستخدم من قاعدة البيانات
    // هذا مثال توضيحي فقط
    const newAccessToken = await new SignJWT({
      userId: payload.userId,
      email: payload.email,
      role: 'user', // يجب الحصول عليه من DB
      type: 'access',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRY)
      .sign(JWT_SECRET);

    return {
      accessToken: newAccessToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  } catch (error) {
    throw new Error('Failed to refresh token');
  }
}

/**
 * فك تشفير Token بدون التحقق من الصلاحية
 */
export async function decodeToken(token: string) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload;
  } catch {
    // محاولة فك التشفير بدون التحقق
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );
      return payload;
    } catch {
      return null;
    }
  }
}
