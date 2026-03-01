/**
 * الإجراءات المتقدمة للمصادقة والحسابات
 * JWT + Refresh Tokens + حماية Brute Force
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import bcryptjs from 'bcryptjs';
import { publicProcedure, router } from './_core/trpc';
import { getDb, getUserByEmail } from './db';
import {
  createTokenPair,
  refreshAccessToken,
  BruteForceProtection,
  verifyAccessToken,
} from './auth-advanced';
import { users } from './drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Validation Schemas
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password too short'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name too short'),
  role: z.enum(['user', 'seller']).default('user'),
  phoneNumber: z.string().optional(),
  countryCode: z.string().optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

/**
 * Advanced Auth Router
 */
export const advancedAuthRouter = router({
  /**
   * تسجيل دخول متقدم مع JWT
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;

      // التحقق من حماية Brute Force
      if (BruteForceProtection.isLocked(email)) {
        const attempts = BruteForceProtection.getAttempts(email);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Account locked. Try again in ${attempts.remainingTime} seconds`,
        });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        // البحث عن المستخدم
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || user.length === 0) {
          BruteForceProtection.recordFailedAttempt(email);
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        const dbUser = user[0];

        // التحقق من كلمة المرور
        const isPasswordValid = await bcryptjs.compare(
          password,
          dbUser.passwordHash
        );

        if (!isPasswordValid) {
          BruteForceProtection.recordFailedAttempt(email);
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        // التحقق من حالة الحساب
        if (dbUser.isBlocked) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Account is blocked',
          });
        }

        // إعادة تعيين محاولات الفشل
        BruteForceProtection.resetAttempts(email);

        // تحديث آخر وقت تسجيل دخول
        await db
          .update(users)
          .set({ lastSignedIn: new Date(), failedLoginAttempts: 0 })
          .where(eq(users.id, dbUser.id));

        // إنشاء Tokens
        const tokens = await createTokenPair(dbUser);

        return {
          success: true,
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            profileImage: dbUser.profileImage,
          },
          ...tokens,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Login failed',
        });
      }
    }),

  /**
   * تسجيل حساب جديد
   */
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      const { email, password, name, role, phoneNumber, countryCode } = input;

      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed',
          });
        }

        // التحقق من عدم وجود البريد
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already registered',
          });
        }

        // تشفير كلمة المرور
        const passwordHash = await bcryptjs.hash(password, 12);

        // إنشاء المستخدم
        const result = await db.insert(users).values({
          email,
          passwordHash,
          name,
          role: role as 'user' | 'seller',
          phoneNumber,
          countryCode,
          isVerified: false,
          isBlocked: false,
          failedLoginAttempts: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const userId = (result as any).insertId || (result as any)[0]?.insertId;

        // الحصول على بيانات المستخدم الجديد
        const newUser = await db
          .select()
          .from(users)
          .where(eq(users.id, Number(userId)))
          .limit(1);

        if (!newUser || newUser.length === 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create user',
          });
        }

        const dbUser = newUser[0];

        // إنشاء Tokens
        const tokens = await createTokenPair(dbUser);

        return {
          success: true,
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          },
          ...tokens,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Registration failed',
        });
      }
    }),

  /**
   * تحديث Access Token
   */
  refreshToken: publicProcedure
    .input(refreshTokenSchema)
    .mutation(async ({ input }) => {
      try {
        const newTokens = await refreshAccessToken(input.refreshToken);
        return {
          success: true,
          ...newTokens,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Failed to refresh token',
        });
      }
    }),

  /**
   * التحقق من صحة Token
   */
  verifyToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const payload = await verifyAccessToken(input.token);
        return {
          valid: true,
          payload,
        };
      } catch {
        return {
          valid: false,
          payload: null,
        };
      }
    }),

  /**
   * الحصول على معلومات حالة الحساب
   */
  getAccountStatus: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const attempts = BruteForceProtection.getAttempts(input.email);
      const isLocked = BruteForceProtection.isLocked(input.email);

      return {
        isLocked,
        failedAttempts: attempts.count,
        remainingAttempts: 5 - attempts.count,
        lockedUntil: attempts.lockedUntil,
        remainingTime: attempts.remainingTime,
      };
    }),
});

export type AdvancedAuthRouter = typeof advancedAuthRouter;
