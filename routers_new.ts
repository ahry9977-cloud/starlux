import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { 
  getUserByEmail, 
  getUserById, 
  getDb, 
  createUser,
  updateUser,
  updateUserLoginAttempts,
  getPasswordResetByEmail,
  createPasswordReset,
  markPasswordResetAsUsed,
} from "./db";
import { users, passwordResets, otpVerifications, stores } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existingUser = await getUserByEmail(input.email);
      if (existingUser) {
        throw new Error("Email already registered");
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const userId = await createUser({
        email: input.email,
        passwordHash,
        name: input.name,
        role: "user",
        isVerified: false,
        isBlocked: false,
        failedLoginAttempts: 0,
      });

      return {
        success: true,
        userId,
        message: "Registration successful",
      };
    }),

  registerUser: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      phoneNumber: z.string().min(7).max(20),
      countryCode: z.string().length(2),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existingUser = await getUserByEmail(input.email);
      if (existingUser) {
        throw new Error("Email already registered");
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

      await db.insert(otpVerifications).values({
        phoneNumber: input.phoneNumber,
        countryCode: input.countryCode,
        otp,
        expiresAt,
        isUsed: false,
      });

      console.log(`OTP for ${input.phoneNumber}: ${otp}`);

      return {
        success: true,
        message: "OTP sent to your phone",
      };
    }),

  registerStore: publicProcedure
    .input(z.object({
      storeName: z.string().min(2),
      storeType: z.string(),
      email: z.string().email(),
      password: z.string().min(8),
      phoneNumber: z.string().min(7).max(20),
      countryCode: z.string().length(2),
      country: z.string(),
      plan: z.enum(["free", "pro", "community"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existingUser = await getUserByEmail(input.email);
      if (existingUser) {
        throw new Error("Email already registered");
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

      await db.insert(otpVerifications).values({
        phoneNumber: input.phoneNumber,
        countryCode: input.countryCode,
        otp,
        expiresAt,
        isUsed: false,
      });

      console.log(`OTP for ${input.phoneNumber}: ${otp}`);

      return {
        success: true,
        message: "OTP sent to your phone",
      };
    }),

  verifyRegistrationOtp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      phoneNumber: z.string().min(7).max(20),
      otp: z.string().length(6),
      type: z.enum(["user", "store"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const otpRecord = await db.select().from(otpVerifications)
        .where(eq(otpVerifications.phoneNumber, input.phoneNumber))
        .limit(1);

      if (!otpRecord.length) {
        throw new Error("OTP not found");
      }

      const record = otpRecord[0];
      if (record.otp !== input.otp) {
        throw new Error("Invalid OTP");
      }

      if (new Date() > record.expiresAt) {
        throw new Error("OTP expired");
      }

      if (record.isUsed) {
        throw new Error("OTP already used");
      }

      await db.update(otpVerifications)
        .set({ isUsed: true })
        .where(eq(otpVerifications.id, record.id));

      return {
        success: true,
        message: "OTP verified successfully",
      };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new Error("Invalid email or password");
      }

      if (user.isBlocked) {
        throw new Error("Account is blocked");
      }

      if (user.lockedUntil && new Date() < user.lockedUntil) {
        throw new Error("Account is temporarily locked. Please try again later.");
      }

      const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordMatch) {
        const newAttempts = (user.failedLoginAttempts || 0) + 1;
        let lockedUntil = undefined;

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        }

        await updateUserLoginAttempts(user.id, newAttempts, lockedUntil);
        throw new Error("Invalid email or password");
      }

      await updateUserLoginAttempts(user.id, 0, undefined);

      await updateUser(user.id, {
        lastSignedIn: new Date(),
      });

      return {
        success: true,
        userId: user.id,
        message: "Login successful",
      };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email(),
      phoneNumber: z.string().min(7).max(20),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new Error("Email not found");
      }

      if (user.phoneNumber !== input.phoneNumber) {
        throw new Error("Phone number does not match");
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

      await createPasswordReset({
        userId: user.id,
        email: input.email,
        phoneNumber: input.phoneNumber,
        otp,
        expiresAt,
      });

      console.log(`[Password Reset OTP] ${input.phoneNumber}: ${otp}`);

      return {
        success: true,
        message: "OTP sent to your phone",
      };
    }),

  verifyPasswordResetOtp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      otp: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const resetRecord = await getPasswordResetByEmail(input.email);
      if (!resetRecord) {
        throw new Error("No password reset request found");
      }

      if (resetRecord.otp !== input.otp) {
        throw new Error("Invalid OTP");
      }

      if (resetRecord.isUsed) {
        throw new Error("OTP already used");
      }

      if (new Date() > resetRecord.expiresAt) {
        throw new Error("OTP expired");
      }

      return {
        success: true,
        resetId: resetRecord.id,
        message: "OTP verified",
      };
    }),

  resetPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
      resetId: z.number(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new Error("User not found");
      }

      const resetRecord = await getPasswordResetByEmail(input.email);
      if (!resetRecord || resetRecord.id !== input.resetId) {
        throw new Error("Invalid reset request");
      }

      if (resetRecord.isUsed) {
        throw new Error("Reset request already used");
      }

      if (new Date() > resetRecord.expiresAt) {
        throw new Error("Reset request expired");
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 10);

      await updateUser(user.id, {
        passwordHash,
      });

      await markPasswordResetAsUsed(resetRecord.id);

      return {
        success: true,
        message: "Password reset successfully",
      };
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(8),
      newPassword: z.string().min(8),
      phoneNumber: z.string().min(7).max(20),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = await getUserById(ctx.user!.id);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.phoneNumber !== input.phoneNumber) {
        throw new Error("Phone number does not match");
      }

      const passwordMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!passwordMatch) {
        throw new Error("Current password is incorrect");
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 10);

      await updateUser(user.id, {
        passwordHash,
      });

      return {
        success: true,
        message: "Password changed successfully",
      };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
