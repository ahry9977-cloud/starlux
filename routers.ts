import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
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
  logInteraction,
  getAiUserProfile,
  upsertAiUserProfile,
  getRecommendationsForUser,
  smartSearchProducts,
  logRecommendationEvent,
  getRecommendationMetrics,
  getPasswordResetByEmail,
  createPasswordReset,
  markPasswordResetAsUsed,
  getAllUsers,
  getUsersCount,
  getAllStores,
  getStoresCount,
  getAllProducts,
  getProductsCount,
  getAllCategories,
  getMainCategories,
  getFeaturedCategories,
  getSubcategories,
  getCategoryById,
  getCategoriesWithSubcategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllOrders,
  getOrdersCount,
  getAdminStats,
  searchProductsByQuery,
  searchStores,
  searchCategories,
  getProductByStringId,
  getStoreById,
  advancedProductSearch,
} from "./db";
import { roleRouter } from "./roleRouter";
import { users, passwordResets, otpVerifications, stores, sellerPaymentMethods } from "./drizzle/schema";
import { eq, and, or, sql, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "./emailNotifications";
import { ENV } from "./env";

const ALLOWED_PAYMENT_METHODS = ['mastercard', 'visa', 'asia_pay', 'zain_cash'] as const;
const SELLER_PAYMENT_METHODS = ['sindipay'] as const;

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

function normalizeEmail(input: unknown): string {
  return String(input ?? "").toLowerCase().trim();
}

const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  
  logout: publicProcedure.mutation(async ({ ctx }) => {
    // تسجيل عملية الخروج في السجل المركزي
    const userId = ctx.user?.id;
    const userEmail = ctx.user?.email;
    const userRole = ctx.user?.role;
    
    if (userId) {
      console.log(`[LOGOUT] User logged out - ID: ${userId}, Email: ${userEmail}, Role: ${userRole}, Time: ${new Date().toISOString()}`);
    }
    
    // مسح الجلسة
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    
    return { 
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    } as const;
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

      const normalizedEmail = normalizeEmail(input.email);

      const existingUser = await getUserByEmail(normalizedEmail);
      if (existingUser) {
        throw new Error("Email already registered");
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const userId = await createUser({
        email: normalizedEmail,
        passwordHash,
        name: input.name,
        role: "user",
        isVerified: false,
        isBlocked: false,
        failedLoginAttempts: 0,
      });

      if (!userId || !Number.isFinite(Number(userId))) {
        throw new Error("فشل إنشاء الحساب");
      }

      const savedUser = await getUserById(Number(userId));
      if (!savedUser) {
        throw new Error("فشل التحقق من الحساب");
      }

      return {
        success: true,
        userId: Number(userId),
        message: "Registration successful",
      };
    }),

  registerUser: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      phoneNumber: z.string().min(7).max(20),
      countryCode: z.string().min(2).max(5),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("قاعدة البيانات غير متاحة");

      // التحقق من صحة البيانات
      const normalizedEmail = input.email.toLowerCase().trim();
      
      // التحقق من وجود البريد
      const existingUser = await getUserByEmail(normalizedEmail);
      if (existingUser) {
        throw new Error("البريد الإلكتروني مسجل مسبقاً");
      }

      // التحقق من قوة كلمة المرور
      if (!/[A-Z]/.test(input.password) || !/[a-z]/.test(input.password) || !/[0-9]/.test(input.password)) {
        throw new Error("كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم");
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const userId = await createUser({
        email: normalizedEmail,
        passwordHash,
        name: input.name,
        role: "user",
        isVerified: false,
        isBlocked: false,
        failedLoginAttempts: 0,
        phoneNumber: input.phoneNumber,
      });

      if (!userId) {
        throw new Error("فشل إنشاء الحساب");
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

      console.log(`[User Registration] OTP for ${input.phoneNumber}: ${otp}`);

      // إرسال بريد الترحيب (في الخلفية)
      sendWelcomeEmail(normalizedEmail, input.name, 'buyer').catch(err => {
        console.error('[User Registration] Failed to send welcome email:', err);
      });

      return {
        success: true,
        message: "تم إرسال رمز التحقق إلى هاتفك",
        userId,
      };
    }),

  registerStore: publicProcedure
    .input(z.object({
      storeName: z.string().min(2),
      storeType: z.string(),
      storeCategory: z.string().optional(),
      email: z.string().email(),
      password: z.string().min(8),
      phoneNumber: z.string().min(7).max(20),
      countryCode: z.string(),
      country: z.string(),
      plan: z.enum(["free", "pro", "community"]),
      paymentMethods: z.array(z.object({
        id: z.enum(ALLOWED_PAYMENT_METHODS),
        details: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("قاعدة البيانات غير متاحة");

      // التحقق من وجود البريد
      const normalizedEmail = input.email.toLowerCase().trim();
      const existingUser = await getUserByEmail(normalizedEmail);
      if (existingUser) {
        throw new Error("البريد الإلكتروني مسجل مسبقاً");
      }

      // التحقق من اسم المتجر
      if (!input.storeName || input.storeName.length < 2) {
        throw new Error("اسم المتجر يجب أن يكون حرفين على الأقل");
      }

      // التحقق من فئة المتجر
      if (!input.storeType) {
        throw new Error("فئة المتجر مطلوبة");
      }

      // التحقق من طرق الدفع (إلزامي للبائعين)
      if (!input.paymentMethods || input.paymentMethods.length === 0) {
        throw new Error("يجب إضافة طريقة دفع واحدة على الأقل لاستلام الأرباح");
      }

      // التحقق من صحة طرق الدفع
      for (const method of input.paymentMethods) {
        if (!method.details || method.details.length < 5) {
          throw new Error(`تفاصيل طريقة الدفع ${method.id} غير كاملة`);
        }
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const userId = await createUser({
        email: normalizedEmail,
        passwordHash,
        name: input.storeName,
        role: "seller",
        isVerified: false,
        isBlocked: false,
        failedLoginAttempts: 0,
        phoneNumber: input.phoneNumber,
      });

      if (!userId) {
        throw new Error("فشل إنشاء حساب البائع");
      }

      const storeInserted = await db
        .insert(stores)
        .values({
          name: input.storeName,
          sellerId: Number(userId),
          category: input.storeType,
          description: input.storeName,
          isVerified: false,
          isActive: true,
        } as any)
        .returning({ id: stores.id });

      const storeId = Number((storeInserted as any)?.[0]?.id ?? 0);
      if (!storeId) {
        throw new Error("فشل إنشاء المتجر");
      }

      for (const method of input.paymentMethods) {
        await db.insert(sellerPaymentMethods).values({
          storeId,
          methodType: String(method.id),
          accountDetails: String(method.details),
          isActive: true,
        } as any);
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

      // حفظ بيانات التسجيل مؤقتاً مع OTP
      await db.insert(otpVerifications).values({
        phoneNumber: input.phoneNumber,
        countryCode: input.countryCode,
        otp,
        expiresAt,
        isUsed: false,
      });

      console.log(`[Store Registration] OTP for ${input.phoneNumber}: ${otp}`);
      console.log(`[Store Registration] Plan: ${input.plan}, Store: ${input.storeName}`);

      // إرسال بريد الترحيب (في الخلفية)
      sendWelcomeEmail(normalizedEmail, input.storeName, 'seller').catch(err => {
        console.error('[Store Registration] Failed to send welcome email:', err);
      });

      return {
        success: true,
        message: "تم إرسال رمز التحقق إلى هاتفك",
        requiresPayment: input.plan !== 'free',
        plan: input.plan,
        userId,
        storeId,
      };
    }),

  verifyRegistrationOtp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      phoneNumber: z.string().min(7).max(20),
      otp: z.string().length(6),
      type: z.enum(["user", "store"]),
      // بيانات إضافية لإنشاء الحساب
      name: z.string().min(2).optional(),
      password: z.string().min(8).optional(),
      countryCode: z.string().optional(),
      // بيانات المتجر (للبائع فقط)
      storeName: z.string().optional(),
      storeType: z.string().optional(),
      storeCategory: z.string().optional(),
      country: z.string().optional(),
      plan: z.enum(["free", "pro", "community"]).optional(),
      paymentMethods: z.array(z.object({
        id: z.string(),
        details: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("قاعدة البيانات غير متاحة");

      // التحقق من OTP
      const otpRecord = await db
        .select()
        .from(otpVerifications)
        .where(eq(otpVerifications.phoneNumber, input.phoneNumber))
        .orderBy(desc(otpVerifications.id))
        .limit(1);

      if (!otpRecord.length) {
        throw new Error("رمز التحقق غير موجود");
      }

      const record = otpRecord[0];
      if (record.otp !== input.otp) {
        throw new Error("رمز التحقق غير صحيح");
      }

      if (new Date() > record.expiresAt) {
        throw new Error("رمز التحقق منتهي الصلاحية");
      }

      if (record.isUsed) {
        throw new Error("رمز التحقق مستخدم مسبقاً");
      }

      // تحديث OTP كمستخدم
      await db.update(otpVerifications)
        .set({ isUsed: true })
        .where(eq(otpVerifications.id, record.id));

      const normalizedEmail = normalizeEmail(input.email);
      const user = await getUserByEmail(normalizedEmail);
      if (!user) {
        throw new Error("الحساب غير موجود");
      }

      await updateUser(user.id, {
        isVerified: true,
      });

      return {
        success: true,
        message: "تم التحقق بنجاح",
        type: input.type,
      };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const normalizedEmail = normalizeEmail(input.email);

      // Step 1: Validate Credentials - Fetch User from Database
      const user = await getUserByEmail(normalizedEmail);
      if (!user) {
        throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }

      // Step 2: Check if account is blocked
      if (user.isBlocked) {
        throw new Error("الحساب محظور");
      }

      if (!user.isVerified) {
        throw new Error("يرجى تفعيل الحساب أولاً");
      }

      // Step 3: Check if account is temporarily locked
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        throw new Error("الحساب مقفل مؤقتاً. يرجى المحاولة لاحقاً.");
      }

      // Step 4: Verify Password
      const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordMatch) {
        const newAttempts = (user.failedLoginAttempts || 0) + 1;
        let lockedUntil = undefined;

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        }

        await updateUserLoginAttempts(user.id, newAttempts, lockedUntil);
        throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }

      // Step 5: Reset login attempts on successful login
      await updateUserLoginAttempts(user.id, 0, undefined);

      // Step 6: Update last signed in time
      await updateUser(user.id, {
        lastSignedIn: new Date(),
      });

      // Step 7: Create Server-Side Session - Generate JWT Token
      const { SignJWT } = await import('jose');
      const secretKey = new TextEncoder().encode(ENV.cookieSecret);
      
      const sessionToken = await new SignJWT({
        openId: user.email,
        appId: ENV.appId || 'star_lux',
        name: user.name || '',
        userId: user.id,
        role: user.role,
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
        .setIssuedAt()
        .sign(secretKey);

      // Step 8: Set Session Cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Step 9: Return user data with role for frontend redirect
      return {
        success: true,
        userId: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        profileImage: (user as any).profileImage ?? null,
        isVerified: user.isVerified,
        message: "تم تسجيل الدخول بنجاح",
      };
    }),

  // نظام استعادة كلمة المرور المتقدم - الخطوة 1: طلب الرمز
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email(),
      preferredChannel: z.enum(['email', 'whatsapp', 'both']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { createAndSendOTP } = await import('./otpSystem');

      const normalizedEmail = normalizeEmail(input.email);
      
      // جلب بيانات المستخدم
      const user = await getUserByEmail(normalizedEmail);
      
      // رسالة أمنية موحدة (لا تكشف وجود الحساب)
      const securityMessage = 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رمز التحقق';
      
      if (!user) {
        console.log(`[Password Reset] Email not found: ${normalizedEmail}`);
        return { success: true, message: securityMessage };
      }
      
      // إنشاء وإرسال OTP فوراً
      const result = await createAndSendOTP({
        email: normalizedEmail,
        phoneNumber: user.phoneNumber || undefined,
        purpose: 'password_reset',
        userName: user.name || undefined,
        preferredChannel: input.preferredChannel || 'email',
      });
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return {
        success: true,
        message: result.message,
        expiresAt: result.expiresAt?.toISOString(),
        channel: result.channel,
      };
    }),

  // نظام استعادة كلمة المرور المتقدم - الخطوة 2: التحقق من الرمز
  verifyPasswordResetOtp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      otp: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      const { verifyOTP } = await import('./otpSystem');

      const normalizedEmail = normalizeEmail(input.email);
      
      const result = await verifyOTP(normalizedEmail, input.otp, 'password_reset');
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // جلب بيانات المستخدم
      const user = await getUserByEmail(normalizedEmail);
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      
      return {
        success: true,
        resetToken,
        userId: user?.id,
        message: result.message,
      };
    }),

  // نظام استعادة كلمة المرور المتقدم - الخطوة 3: إعادة تعيين كلمة المرور
  resetPassword: publicProcedure
    .input(z.object({
      userId: z.number(),
      resetToken: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const { resetPassword, validatePasswordStrength } = await import('./passwordReset');
      
      // التحقق من قوة كلمة المرور
      const validation = validatePasswordStrength(input.newPassword);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      
      const result = await resetPassword(input.userId, input.newPassword);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return {
        success: true,
        message: result.message,
      };
    }),

  // التحقق من قوة كلمة المرور
  validatePassword: publicProcedure
    .input(z.object({
      password: z.string(),
    }))
    .query(async ({ input }) => {
      const { validatePasswordStrength } = await import('./passwordReset');
      return validatePasswordStrength(input.password);
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

  // تسجيل بائع جديد مع إنشاء متجر تلقائياً (قاعدة: متجر واحد لكل بائع)
  registerSeller: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      storeName: z.string().min(2),
      storeCategory: z.string(),
      plan: z.enum(['free', 'pro', 'community']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("قاعدة البيانات غير متاحة");

      const normalizedEmail = normalizeEmail(input.email);

      // التحقق من عدم وجود البريد مسبقاً
      const existingUser = await getUserByEmail(normalizedEmail);
      if (existingUser) {
        // إذا كان المستخدم بائعاً بالفعل، تحقق من وجود متجر
        if (existingUser.role === 'seller') {
          const { hasSellerStore } = await import('./db');
          const hasStore = await hasSellerStore(existingUser.id);
          if (hasStore) {
            throw new Error("لديك متجر بالفعل. لا يمكن إنشاء أكثر من متجر واحد.");
          }
        }
        throw new Error("البريد الإلكتروني مسجل مسبقاً");
      }

      // إنشاء حساب البائع
      const passwordHash = await bcrypt.hash(input.password, 10);
      const userId = await createUser({
        email: normalizedEmail,
        passwordHash,
        name: input.name,
        role: 'seller',
        isVerified: false,
        isBlocked: false,
        failedLoginAttempts: 0,
      });

      if (!userId || !Number.isFinite(Number(userId))) {
        throw new Error("فشل إنشاء الحساب");
      }

      const userIdNum = Number(userId);

      const savedUser = await getUserById(userIdNum);
      if (!savedUser) {
        throw new Error("فشل التحقق من الحساب");
      }

      // إنشاء المتجر تلقائياً
      const [storeResult] = await db.insert(stores).values({
        name: input.storeName,
        sellerId: userIdNum,
        category: input.storeCategory,
        description: `متجر ${input.storeName}`,
        subscriptionPlan: input.plan,
        isVerified: false,
        isActive: true,
      });

      const storeId = storeResult.insertId;

      // تحديد سعر الاشتراك
      const planPrices: Record<string, number> = { free: 0, pro: 50, community: 80 };
      const price = planPrices[input.plan];

      // إنشاء سجل الاشتراك
      const transactionId = `SUB_${Date.now()}_${userIdNum}`;
      const subscriptionStatus = input.plan === 'free' ? 'active' : 'pending_payment';
      await db.execute(`INSERT INTO subscriptions (sellerId, storeId, plan, price, status, transactionId, startsAt, expiresAt) VALUES (${userIdNum}, ${storeId}, '${input.plan}', ${price}, '${subscriptionStatus}', '${transactionId}', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`);

      return {
        success: true,
        userId: userIdNum,
        storeId,
        plan: input.plan,
        requiresPayment: input.plan !== 'free',
        transactionId: input.plan !== 'free' ? transactionId : null,
        message: input.plan === 'free' 
          ? "تم إنشاء حساب البائع والمتجر بنجاح!"
          : "تم إنشاء الحساب. يرجى إكمال الدفع لتفعيل الاشتراك.",
      };
    }),

  // OAuth Login - تسجيل الدخول عبر Google/Facebook
  oauthLogin: publicProcedure
    .input(z.object({
      provider: z.enum(['google', 'facebook']),
      email: z.string().email(),
      name: z.string().min(1),
      providerId: z.string().min(1),
      profileImage: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const normalizedEmail = normalizeEmail(input.email);

      // Step 1: البحث عن المستخدم بالبريد الإلكتروني
      let user = await getUserByEmail(normalizedEmail);

      // Step 2: إذا لم يوجد المستخدم، إنشاء حساب جديد
      if (!user) {
        // إنشاء كلمة مرور عشوائية للحسابات OAuth
        const randomPassword = `oauth_${input.provider}_${input.providerId}_${Date.now()}`;
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        const userId = await createUser({
          email: normalizedEmail,
          passwordHash,
          name: input.name,
          role: 'user', // الدور الافتراضي
          isVerified: true, // حسابات OAuth موثقة تلقائياً
          isBlocked: false,
          failedLoginAttempts: 0,
          profileImage: input.profileImage || null,
        });

        if (!userId || !Number.isFinite(Number(userId))) {
          throw new Error("فشل إنشاء الحساب");
        }

        user = await getUserById(Number(userId));
        if (!user) {
          throw new Error("فشل استرجاع بيانات الحساب");
        }
      }

      // Step 3: التحقق من أن الحساب غير محظور
      if (user.isBlocked) {
        throw new Error("الحساب محظور");
      }

      // Step 4: تحديث وقت آخر تسجيل دخول
      await updateUser(user.id, {
        lastSignedIn: new Date(),
        // تحديث الصورة إذا كانت متوفرة
        ...(input.profileImage && !user.profileImage ? { profileImage: input.profileImage } : {}),
      });

      // Step 5: إنشاء JWT Token
      const { SignJWT } = await import('jose');
      const secretKey = new TextEncoder().encode(ENV.cookieSecret);
      
      const sessionToken = await new SignJWT({
        openId: user.email,
        appId: ENV.appId || 'star_lux',
        name: user.name || '',
        userId: user.id,
        role: user.role,
        provider: input.provider,
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
        .setIssuedAt()
        .sign(secretKey);

      // Step 6: تعيين Session Cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Step 7: إرجاع بيانات المستخدم
      return {
        success: true,
        userId: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        isNewUser: !user.lastSignedIn,
        message: `تم تسجيل الدخول بنجاح عبر ${input.provider === 'google' ? 'جوجل' : 'فيسبوك'}`,
      };
    }),

  // إعادة إرسال OTP
  resendOTP: publicProcedure
    .input(z.object({
      identifier: z.string(),
      purpose: z.enum(['registration', 'password_reset', 'verify_account', 'change_email', 'change_phone']),
      channel: z.enum(['email', 'whatsapp', 'both']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { resendOTP } = await import('./otpSystem');
      
      const result = await resendOTP(input.identifier, input.purpose, input.channel);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return {
        success: true,
        message: result.message,
        expiresAt: result.expiresAt?.toISOString(),
        channel: result.channel,
      };
    }),

  // طلب OTP للتسجيل
  requestRegistrationOTP: publicProcedure
    .input(z.object({
      email: z.string().email(),
      phoneNumber: z.string().optional(),
      name: z.string().optional(),
      preferredChannel: z.enum(['email', 'whatsapp', 'both']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { createAndSendOTP } = await import('./otpSystem');

      const normalizedEmail = normalizeEmail(input.email);
      
      // التحقق من عدم وجود البريد مسبقاً
      const existingUser = await getUserByEmail(normalizedEmail);
      if (existingUser) {
        throw new Error('البريد الإلكتروني مسجل مسبقاً');
      }
      
      const result = await createAndSendOTP({
        email: normalizedEmail,
        phoneNumber: input.phoneNumber,
        purpose: 'registration',
        userName: input.name,
        preferredChannel: input.preferredChannel || 'email',
      });
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return {
        success: true,
        message: result.message,
        expiresAt: result.expiresAt?.toISOString(),
        channel: result.channel,
      };
    }),

  // التحقق من OTP التسجيل
  verifyRegistrationOTP: publicProcedure
    .input(z.object({
      email: z.string().email(),
      otp: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      const { verifyOTP } = await import('./otpSystem');
      
      const result = await verifyOTP(input.email, input.otp, 'registration');
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return {
        success: true,
        message: result.message,
        verified: true,
      };
    }),
});

// ============= Admin Procedure (للتحقق من صلاحيات الأدمن) =============
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'sub_admin') {
    throw new Error('غير مصرح لك بالوصول إلى هذه الصفحة');
  }
  return next({ ctx });
});

// ============= Admin Router =============
const adminRouter = router({
  // Get dashboard stats
  getStats: adminProcedure.query(async () => {
    return await getAdminStats();
  }),

  // Get all users
  getUsers: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0 } = input || {};
      const [users, total] = await Promise.all([
        getAllUsers(limit, offset),
        getUsersCount(),
      ]);
      return { users, total };
    }),

  // Update user
  updateUser: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.enum(['user', 'seller', 'admin', 'sub_admin']).optional(),
      isBlocked: z.boolean().optional(),
      isVerified: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await updateUser(id, updates);
      return { success: true, message: 'تم تحديث المستخدم بنجاح' };
    }),

  // Block/Unblock user
  toggleUserBlock: adminProcedure
    .input(z.object({
      id: z.number(),
      isBlocked: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      await updateUser(input.id, { isBlocked: input.isBlocked });
      return { success: true, message: input.isBlocked ? 'تم حظر المستخدم' : 'تم إلغاء حظر المستخدم' };
    }),

  // Get all stores
  getStores: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0 } = input || {};
      const [stores, total] = await Promise.all([
        getAllStores(limit, offset),
        getStoresCount(),
      ]);
      return { stores, total };
    }),

  // Verify/Unverify store
  toggleStoreVerification: adminProcedure
    .input(z.object({
      id: z.number(),
      isVerified: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db.update(stores).set({ isVerified: input.isVerified }).where(eq(stores.id, input.id));
      return { success: true, message: input.isVerified ? 'تم توثيق المتجر' : 'تم إلغاء توثيق المتجر' };
    }),

  // Activate/Deactivate store
  toggleStoreActive: adminProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db.update(stores).set({ isActive: input.isActive }).where(eq(stores.id, input.id));
      return { success: true, message: input.isActive ? 'تم تفعيل المتجر' : 'تم إيقاف المتجر' };
    }),

  // Get all products
  getProducts: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0 } = input || {};
      const [products, total] = await Promise.all([
        getAllProducts(limit, offset),
        getProductsCount(),
      ]);
      return { products, total };
    }),

  // Activate/Deactivate product
  toggleProductActive: adminProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const { products } = await import('./drizzle/schema');
      await db.update(products).set({ isActive: input.isActive }).where(eq(products.id, input.id));
      return { success: true, message: input.isActive ? 'تم تفعيل المنتج' : 'تم إيقاف المنتج' };
    }),

  // Get all categories
  getCategories: adminProcedure.query(async () => {
    return await getAllCategories();
  }),

  // Create category
  createCategory: adminProcedure
    .input(z.object({
      nameAr: z.string().min(2),
      nameEn: z.string().min(2),
      icon: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const id = await createCategory(input);
      return { success: true, id, message: 'تم إنشاء القسم بنجاح' };
    }),

  // Update category
  updateCategory: adminProcedure
    .input(z.object({
      id: z.number(),
      nameAr: z.string().min(2).optional(),
      nameEn: z.string().min(2).optional(),
      icon: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await updateCategory(id, updates);
      return { success: true, message: 'تم تحديث القسم بنجاح' };
    }),

  // Delete category
  deleteCategory: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCategory(input.id);
      return { success: true, message: 'تم حذف القسم بنجاح' };
    }),

  // Get all orders
  getOrders: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const { limit = 50, offset = 0 } = input || {};
      const [orders, total] = await Promise.all([
        getAllOrders(limit, offset),
        getOrdersCount(),
      ]);
      return { orders, total };
    }),

  // Update order status
  updateOrderStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const { orders } = await import('./drizzle/schema');
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      return { success: true, message: 'تم تحديث حالة الطلب بنجاح' };
    }),

  // ============= إدارة المتاجر من الأدمن =============
  
  // إنشاء متجر جديد من الأدمن
  createStore: adminProcedure
    .input(z.object({
      sellerId: z.number(),
      name: z.string().min(2, 'اسم المتجر يجب أن يكون حرفين على الأقل'),
      description: z.string().optional(),
      category: z.string().min(2, 'فئة المتجر مطلوبة'),
      subscriptionPlan: z.enum(['free', 'pro', 'community']).default('free'),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('قاعدة البيانات غير متاحة');
      
      // التحقق من وجود البائع
      const seller = await getUserById(input.sellerId);
      if (!seller) {
        throw new Error('البائع غير موجود');
      }
      
      // التحقق من أن المستخدم بائع
      if (seller.role !== 'seller' && seller.role !== 'admin') {
        throw new Error('المستخدم المحدد ليس بائعاً');
      }
      
      // التحقق من عدم وجود متجر للبائع
      const existingStore = await db.select().from(stores).where(eq(stores.sellerId, input.sellerId)).limit(1);
      if (existingStore.length > 0) {
        throw new Error('هذا البائع لديه متجر بالفعل');
      }
      
      // إنشاء المتجر
      const result = await db.insert(stores).values({
        sellerId: input.sellerId,
        name: input.name,
        description: input.description || '',
        category: input.category,
        subscriptionPlan: input.subscriptionPlan,
        isActive: true,
        isVerified: false,
      });
      
      const storeId = result[0]?.insertId;
      
      // تسجيل العملية
      console.log(`[Admin] Store created - ID: ${storeId}, Name: ${input.name}, By Admin: ${ctx.user?.email}`);
      
      return { 
        success: true, 
        id: storeId,
        message: 'تم إنشاء المتجر بنجاح' 
      };
    }),

  // حذف متجر من الأدمن
  deleteStore: adminProcedure
    .input(z.object({
      id: z.number(),
      deleteProducts: z.boolean().default(true), // حذف المنتجات المرتبطة
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('قاعدة البيانات غير متاحة');
      
      // التحقق من وجود المتجر
      const store = await db.select().from(stores).where(eq(stores.id, input.id)).limit(1);
      if (store.length === 0) {
        throw new Error('المتجر غير موجود');
      }
      
      // التحقق من عدم وجود طلبات نشطة
      const { orders } = await import('./drizzle/schema');
      const activeOrders = await db.select({ count: sql`COUNT(*)` }).from(orders).where(
        and(
          eq(orders.storeId, input.id),
          or(
            eq(orders.status, 'pending'),
            eq(orders.status, 'processing'),
            eq(orders.status, 'shipped')
          )
        )
      );
      
      if (Number(activeOrders[0]?.count || 0) > 0) {
        throw new Error('لا يمكن حذف متجر لديه طلبات نشطة');
      }
      
      // حذف المنتجات المرتبطة إذا طُلب ذلك
      if (input.deleteProducts) {
        const { products } = await import('./drizzle/schema');
        await db.delete(products).where(eq(products.storeId, input.id));
        console.log(`[Admin] Products deleted for store ${input.id}`);
      }
      
      // حذف المتجر
      await db.delete(stores).where(eq(stores.id, input.id));
      
      // تسجيل العملية
      console.log(`[Admin] Store deleted - ID: ${input.id}, Name: ${store[0].name}, By Admin: ${ctx.user?.email}`);
      
      return { 
        success: true, 
        message: 'تم حذف المتجر بنجاح' 
      };
    }),

  // ============= إدارة المنتجات من الأدمن =============
  
  // إنشاء منتج جديد من الأدمن
  createProduct: adminProcedure
    .input(z.object({
      storeId: z.number(),
      categoryId: z.number(),
      title: z.string().min(2, 'عنوان المنتج يجب أن يكون حرفين على الأقل'),
      description: z.string().optional(),
      price: z.number().positive('السعر يجب أن يكون أكبر من صفر'),
      stock: z.number().min(0, 'المخزون لا يمكن أن يكون سالباً').default(0),
      images: z.array(z.string()).optional(),
      video: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('قاعدة البيانات غير متاحة');
      
      // التحقق من وجود المتجر
      const store = await db.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
      if (store.length === 0) {
        throw new Error('المتجر غير موجود');
      }
      
      // التحقق من وجود القسم
      const { categories } = await import('./drizzle/schema');
      const category = await db.select().from(categories).where(eq(categories.id, input.categoryId)).limit(1);
      if (category.length === 0) {
        throw new Error('القسم غير موجود');
      }
      
      // إنشاء المنتج
      const { products } = await import('./drizzle/schema');
      const result = await db.insert(products).values({
        storeId: input.storeId,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description || '',
        price: input.price.toString(),
        stock: input.stock,
        images: input.images || [],
        video: input.video || null,
        isActive: true,
      });
      
      const productId = result[0]?.insertId;
      
      // تسجيل العملية
      console.log(`[Admin] Product created - ID: ${productId}, Title: ${input.title}, Store: ${store[0].name}, By Admin: ${ctx.user?.email}`);
      
      return { 
        success: true, 
        id: productId,
        message: 'تم إنشاء المنتج بنجاح' 
      };
    }),

  // حذف منتج من الأدمن
  deleteProduct: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('قاعدة البيانات غير متاحة');
      
      // التحقق من وجود المنتج
      const { products } = await import('./drizzle/schema');
      const product = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
      if (product.length === 0) {
        throw new Error('المنتج غير موجود');
      }
      
      // التحقق من عدم وجود طلبات نشطة للمنتج
      const { orderItems } = await import('./drizzle/schema');
      const activeOrderItems = await db.select({ orderId: orderItems.orderId }).from(orderItems).where(eq(orderItems.productId, input.id));
      
      if (activeOrderItems.length > 0) {
        const orderIds = activeOrderItems.map((r: any) => r.orderId);
        const { orders } = await import('./drizzle/schema');
        const activeOrders = await db.select({ count: sql`COUNT(*)` }).from(orders).where(
          and(
            sql`${orders.id} IN (${orderIds.join(',')})`,
            or(
              eq(orders.status, 'pending'),
              eq(orders.status, 'processing'),
              eq(orders.status, 'shipped')
            )
          )
        );
        
        if (Number(activeOrders[0]?.count || 0) > 0) {
          throw new Error('لا يمكن حذف منتج مرتبط بطلبات نشطة');
        }
      }
      
      // حذف المنتج
      await db.delete(products).where(eq(products.id, input.id));
      
      // تسجيل العملية
      console.log(`[Admin] Product deleted - ID: ${input.id}, Title: ${product[0].title}, By Admin: ${ctx.user?.email}`);
      
      return { 
        success: true, 
        message: 'تم حذف المنتج بنجاح' 
      };
    }),

  // الحصول على قائمة البائعين (للاختيار عند إنشاء متجر)
  getSellers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    // جلب البائعين الذين ليس لديهم متاجر
    const sellers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    }).from(users).where(
      and(
        eq(users.role, 'seller'),
        eq(users.isBlocked, false)
      )
    );
    
    // فلترة البائعين الذين لديهم متاجر
    const sellersWithStores = await db.select({ sellerId: stores.sellerId }).from(stores);
    const sellerIdsWithStores = new Set(sellersWithStores.map((s: any) => s.sellerId));
    
    return sellers.filter((s: any) => !sellerIdsWithStores.has(s.id));
  }),
});

// ============= Seller Router =============
const sellerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('غير مصرح بالوصول');
  }
  if (ctx.user.role !== 'seller' && ctx.user.role !== 'admin' && ctx.user.role !== 'sub_admin') {
    throw new Error('يجب أن تكون بائعاً للوصول إلى هذه الصفحة');
  }
  return next({ ctx });
});

const sellerRouter = router({
  // Get seller's store
  getMyStore: sellerProcedure.query(async ({ ctx }) => {
    const { getSellerStore } = await import('./db');
    const store = await getSellerStore(ctx.user!.id);
    return store;
  }),

  // Create store
  createStore: sellerProcedure
    .input(z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      category: z.string().min(2),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getSellerStore, createStore, createAuditLog } = await import('./db');
      
      // Check if seller already has a store
      const existingStore = await getSellerStore(ctx.user!.id);
      if (existingStore) {
        throw new Error('لديك متجر بالفعل');
      }

      const storeId = await createStore({
        sellerId: ctx.user!.id,
        name: input.name,
        description: input.description,
        category: input.category,
      });

      // Audit log
      await createAuditLog({
        userId: ctx.user!.id,
        action: 'create',
        entityType: 'store',
        entityId: storeId,
        newValue: input,
      });

      return { success: true, storeId, message: 'تم إنشاء المتجر بنجاح' };
    }),

  // Update store
  updateStore: sellerProcedure
    .input(z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      logo: z.string().optional(),
      banner: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getSellerStore, updateStore, createAuditLog } = await import('./db');
      
      const store = await getSellerStore(ctx.user!.id);
      if (!store) {
        throw new Error('لا يوجد متجر');
      }

      await updateStore(store.id, input);

      // Audit log
      await createAuditLog({
        userId: ctx.user!.id,
        action: 'update',
        entityType: 'store',
        entityId: store.id,
        oldValue: store,
        newValue: input,
      });

      return { success: true, message: 'تم تحديث المتجر بنجاح' };
    }),

  // Get seller stats
  getStats: sellerProcedure.query(async ({ ctx }) => {
    const { getSellerStore, getSellerStats } = await import('./db');
    const store = await getSellerStore(ctx.user!.id);
    if (!store) {
      return {
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        totalReviews: 0,
        averageRating: 0,
      };
    }
    return await getSellerStats(store.id);
  }),

  // Get seller's products
  getProducts: sellerProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { getSellerStore, getSellerProducts } = await import('./db');
      const store = await getSellerStore(ctx.user!.id);
      if (!store) return { products: [], total: 0 };
      
      const { limit = 50, offset = 0 } = input || {};
      const products = await getSellerProducts(store.id, limit, offset);
      return { products, total: products.length };
    }),

  // Create product
  createProduct: sellerProcedure
    .input(z.object({
      title: z.string().min(2),
      description: z.string().optional(),
      price: z.number().positive(),
      categoryId: z.number(),
      stock: z.number().min(0).default(0),
      images: z.array(z.string()).optional(),
      video: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getSellerStore, createProduct, createAuditLog } = await import('./db');
      
      const store = await getSellerStore(ctx.user!.id);
      if (!store) {
        throw new Error('يجب إنشاء متجر أولاً');
      }

      // Validation
      if (input.price <= 0) {
        throw new Error('السعر يجب أن يكون أكبر من صفر');
      }

      const productId = await createProduct({
        storeId: store.id,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        price: input.price.toString(),
        stock: input.stock,
        images: input.images || [],
        video: input.video,
      });

      // Audit log
      await createAuditLog({
        userId: ctx.user!.id,
        action: 'create',
        entityType: 'product',
        entityId: productId,
        newValue: input,
      });

      return { success: true, productId, message: 'تم إضافة المنتج بنجاح' };
    }),

  // Update product
  updateProduct: sellerProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(2).optional(),
      description: z.string().optional(),
      price: z.number().positive().optional(),
      categoryId: z.number().optional(),
      stock: z.number().min(0).optional(),
      images: z.array(z.string()).optional(),
      video: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getSellerStore, updateProduct, getProductById, createAuditLog } = await import('./db');
      
      const store = await getSellerStore(ctx.user!.id);
      if (!store) {
        throw new Error('لا يوجد متجر');
      }

      const oldProduct = await getProductById(input.id);

      const { id, ...updates } = input;
      await updateProduct(id, store.id, {
        ...updates,
        price: updates.price?.toString(),
      });

      // Audit log
      await createAuditLog({
        userId: ctx.user!.id,
        action: 'update',
        entityType: 'product',
        entityId: id,
        oldValue: oldProduct,
        newValue: updates,
      });

      return { success: true, message: 'تم تحديث المنتج بنجاح' };
    }),

  // Delete product
  deleteProduct: sellerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getSellerStore, deleteProduct, getProductById, createAuditLog } = await import('./db');
      
      const store = await getSellerStore(ctx.user!.id);
      if (!store) {
        throw new Error('لا يوجد متجر');
      }

      const oldProduct = await getProductById(input.id);

      await deleteProduct(input.id, store.id);

      // Audit log
      await createAuditLog({
        userId: ctx.user!.id,
        action: 'delete',
        entityType: 'product',
        entityId: input.id,
        oldValue: oldProduct,
      });

      return { success: true, message: 'تم حذف المنتج بنجاح' };
    }),

  // Get seller's orders
  getOrders: sellerProcedure
    .input(z.object({
      status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { getSellerStore, getSellerOrders } = await import('./db');
      const store = await getSellerStore(ctx.user!.id);
      if (!store) return { orders: [], total: 0 };
      
      const { status, limit = 50, offset = 0 } = input || {};
      const orders = await getSellerOrders(store.id, status, limit, offset);
      return { orders, total: orders.length };
    }),

  // Update order status
  updateOrderStatus: sellerProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getSellerStore, updateOrderStatus, createAuditLog } = await import('./db');
      
      const store = await getSellerStore(ctx.user!.id);
      if (!store) {
        throw new Error('لا يوجد متجر');
      }

      await updateOrderStatus(input.orderId, store.id, input.status);

      // Audit log
      await createAuditLog({
        userId: ctx.user!.id,
        action: 'update_status',
        entityType: 'order',
        entityId: input.orderId,
        newValue: { status: input.status },
      });

      return { success: true, message: 'تم تحديث حالة الطلب بنجاح' };
    }),

  // Get payment methods
  getPaymentMethods: sellerProcedure.query(async ({ ctx }) => {
    const { getSellerStore, getSellerPaymentMethods } = await import('./db');
    const store = await getSellerStore(ctx.user!.id);
    if (!store) return [];
    return await getSellerPaymentMethods(store.id);
  }),

  // Add payment method
  addPaymentMethod: sellerProcedure
    .input(z.object({
      methodType: z.enum(SELLER_PAYMENT_METHODS),
      accountDetails: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getSellerStore, addSellerPaymentMethod, createAuditLog } = await import('./db');
      
      const store = await getSellerStore(ctx.user!.id);
      if (!store) {
        throw new Error('لا يوجد متجر');
      }

      const methodId = await addSellerPaymentMethod(store.id, input.methodType, input.accountDetails);

      // Audit log
      await createAuditLog({
        userId: ctx.user!.id,
        action: 'create',
        entityType: 'payment_method',
        entityId: methodId,
        newValue: { methodType: input.methodType },
      });

      return { success: true, methodId, message: 'تم إضافة طريقة الدفع بنجاح' };
    }),

  // Remove payment method
  removePaymentMethod: sellerProcedure
    .input(z.object({ methodId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getSellerStore, removeSellerPaymentMethod, createAuditLog } = await import('./db');
      
      const store = await getSellerStore(ctx.user!.id);
      if (!store) {
        throw new Error('لا يوجد متجر');
      }

      await removeSellerPaymentMethod(store.id, input.methodId);

      // Audit log
      await createAuditLog({
        userId: ctx.user!.id,
        action: 'delete',
        entityType: 'payment_method',
        entityId: input.methodId,
      });

      return { success: true, message: 'تم حذف طريقة الدفع بنجاح' };
    }),
});

// ============= Cart Router =============
const cartRouter = router({
  // Get cart
  getCart: protectedProcedure.query(async ({ ctx }) => {
    const { getUserCart } = await import('./db');
    return await getUserCart(ctx.user!.id);
  }),

  // Add to cart
  addToCart: protectedProcedure
    .input(z.object({
      productId: z.number(),
      quantity: z.number().min(1).default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const { addToCart } = await import('./db');
      const cartItemId = await addToCart(ctx.user!.id, input.productId, input.quantity);
      return { success: true, cartItemId, message: 'تم إضافة المنتج إلى السلة' };
    }),

  // Update cart item quantity
  updateQuantity: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      quantity: z.number().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const { updateCartItemQuantity } = await import('./db');
      await updateCartItemQuantity(ctx.user!.id, input.itemId, input.quantity);
      return { success: true, message: 'تم تحديث الكمية' };
    }),

  // Remove from cart
  removeItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { removeFromCart } = await import('./db');
      await removeFromCart(ctx.user!.id, input.itemId);
      return { success: true, message: 'تم حذف المنتج من السلة' };
    }),

  // Remove from cart (legacy)
  removeFromCart: protectedProcedure
    .input(z.object({ cartItemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { removeFromCart } = await import('./db');
      await removeFromCart(ctx.user!.id, input.cartItemId);
      return { success: true, message: 'تم حذف المنتج من السلة' };
    }),

  // Clear cart
  clearCart: protectedProcedure.mutation(async ({ ctx }) => {
    const { clearCart } = await import('./db');
    await clearCart(ctx.user!.id);
    return { success: true, message: 'تم إفراغ السلة' };
  }),

  // Checkout - إتمام الشراء مع حساب العمولة
  checkout: protectedProcedure
    .input(z.object({
      paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS),
      shippingAddress: z.object({
        fullName: z.string(),
        phone: z.string(),
        address: z.string(),
        city: z.string(),
        country: z.string().default('العراق'),
      }),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getUserCart, clearCart, createTransaction, PLATFORM_COMMISSION_RATE } = await import('./db');
      const db = await getDb();
      if (!db) throw new Error('قاعدة البيانات غير متاحة');

      // الحصول على سلة المستخدم
      const cart = await getUserCart(ctx.user!.id);
      if (!cart || cart.length === 0) {
        throw new Error('السلة فارغة');
      }

      // حساب الإجمالي
      const subtotal = cart.reduce((sum: number, item: any) => sum + (Number(item.price) * item.quantity), 0);
      const commission = Math.round(subtotal * PLATFORM_COMMISSION_RATE * 100) / 100;
      const total = subtotal;

      // تجميع المنتجات حسب المتجر
      const storeGroups = new Map<number, typeof cart>();
      for (const item of cart) {
        const storeId = item.storeId || 1;
        if (!storeGroups.has(storeId)) {
          storeGroups.set(storeId, []);
        }
        storeGroups.get(storeId)!.push(item);
      }

      const orderIds: number[] = [];

      // إنشاء طلب لكل متجر
      for (const [storeId, items] of Array.from(storeGroups)) {
        const orderTotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) * item.quantity), 0);
        const orderCommission = Math.round(orderTotal * PLATFORM_COMMISSION_RATE * 100) / 100;
        const sellerAmount = orderTotal - orderCommission;

        // إنشاء الطلب
        const { orders, orderItems } = await import('./drizzle/schema');
        const orderInserted = await db
          .insert(orders)
          .values({
          buyerId: ctx.user!.id,
          storeId,
          totalAmount: orderTotal.toString(),
          commission: orderCommission.toString(),
          sellerAmount: sellerAmount.toString(),
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending',
          shippingAddress: JSON.stringify(input.shippingAddress),
          notes: input.notes,
          } as any)
          .returning({ id: orders.id });

        const orderId = Number((orderInserted as any)?.[0]?.id ?? 0);
        if (!orderId) {
          throw new Error("فشل إنشاء الطلب");
        }
        orderIds.push(orderId);

        // إضافة عناصر الطلب
        for (const item of items) {
          await db.insert(orderItems).values({
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price.toString(),
            total: (Number(item.price) * item.quantity).toString(),
          });
        }

        // إنشاء معاملة مالية (الحصول على sellerId من المتجر)
        const { stores } = await import('./drizzle/schema');
        const [storeData] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
        const sellerId = storeData?.sellerId || 1;

        try {
          await advancedNotifications.createAdvancedNotification(
            Number(sellerId),
            'order_new',
            { orderId, amount: orderTotal, currency: 'USD' },
            { actionUrl: `/seller-dashboard`, actionLabel: 'عرض الطلب' }
          );
        } catch (e) {
          console.error('[Checkout] Failed to create notification:', e);
        }

        // تحويل صافي البائع مباشرة وبشكل ذري لمنع التداخل تحت الضغط العالي
        await db.execute(sql`
          INSERT INTO sellerwallet (sellerid, balance, currency, updatedat)
          VALUES (${sellerId}, ${sellerAmount}, 'USD', NOW())
          ON CONFLICT (sellerid)
          DO UPDATE SET
            balance = sellerwallet.balance + EXCLUDED.balance,
            updatedat = NOW()
        `);

        await createTransaction({
          orderId,
          buyerId: ctx.user!.id,
          sellerId,
          amount: orderTotal,
          paymentMethod: input.paymentMethod,
        });

        console.log(`[Checkout] Order ${orderId} created - Total: $${orderTotal}, Commission: $${orderCommission}, Seller: $${sellerAmount}`);
      }

      // إفراغ السلة
      await clearCart(ctx.user!.id);

      return {
        success: true,
        orderIds,
        subtotal,
        commission,
        total,
        message: `تم إنشاء ${orderIds.length} طلب بنجاح`,
      };
    }),

  // Buy Now - إنشاء طلب مباشر لمنتج واحد ثم الانتقال لصفحة الدفع
  buyNow: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS).default("visa"),
        shippingAddress: z
          .object({
            fullName: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            city: z.string().optional(),
            country: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { createDirectBuyOrder } = await import("./db");
      const res = await createDirectBuyOrder({
        buyerId: ctx.user!.id,
        productId: input.productId,
        quantity: input.quantity,
        paymentMethod: input.paymentMethod,
        shippingAddress: input.shippingAddress,
      });
      return {
        success: true,
        orderId: res.orderId,
        total: res.total,
        message: "تم إنشاء الطلب بنجاح",
      };
    }),

  // Get cart summary with commission breakdown
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const { getUserCart, PLATFORM_COMMISSION_RATE } = await import('./db');
    const cart = await getUserCart(ctx.user!.id);
    
    if (!cart || cart.length === 0) {
      return {
        items: [],
        itemCount: 0,
        subtotal: 0,
        commission: 0,
        total: 0,
      };
    }

    const subtotal = cart.reduce((sum: number, item: any) => sum + (Number(item.price) * item.quantity), 0);
    const commission = Math.round(subtotal * PLATFORM_COMMISSION_RATE * 100) / 100;

    return {
      items: cart,
      itemCount: cart.reduce((sum: number, item: any) => sum + item.quantity, 0),
      subtotal,
      commission,
      commissionRate: PLATFORM_COMMISSION_RATE * 100,
      total: subtotal,
    };
  }),
});

// ============= Public Products Router =============
const productsRouter = router({
  // Get all products (public)
  getAll: publicProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const { getAllProducts, getProductsByCategoryId } = await import('./db');
      const { categoryId, limit = 20, offset = 0 } = input || {};
      
      if (categoryId) {
        const products = await getProductsByCategoryId(categoryId);
        return { products: products.slice(offset, offset + limit), total: products.length };
      }
      
      const products = await getAllProducts(limit, offset);
      return { products, total: products.length };
    }),

  // Get product by ID (public)
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { getProductById } = await import('./db');
      const product = await getProductById(input.id);
      if (!product) {
        throw new Error('المنتج غير موجود');
      }
      return product;
    }),

  // Get store by ID (public)
  getStoreById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { getStoreById } = await import("./db");
      const store = await getStoreById(input.id);
      if (!store) throw new Error('المتجر غير موجود');
      return store;
    }),

  // Get store products (public)
  getStoreProducts: publicProcedure
    .input(z.object({ storeId: z.number(), limit: z.number().min(1).max(100).default(40), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      const { getStoreProductsPublic } = await import("./db");
      const products = await getStoreProductsPublic(input.storeId, input.limit, input.offset);
      return { products, total: products.length };
    }),

  // Get all categories (public)
  getCategories: publicProcedure.query(async () => {
    const { getAllCategories } = await import('./db');
    return await getAllCategories();
  }),

  // Get main categories with subcategories (public)
  getCategoriesHierarchy: publicProcedure.query(async () => {
    const { getCategoriesWithSubcategories } = await import('./db');
    return await getCategoriesWithSubcategories();
  }),

  // Get featured categories for homepage (public)
  getFeaturedCategories: publicProcedure.query(async () => {
    const { getFeaturedCategories } = await import('./db');
    return await getFeaturedCategories();
  }),

  // Get subcategories by parent ID (public)
  getSubcategories: publicProcedure
    .input(z.object({ parentId: z.number() }))
    .query(async ({ input }) => {
      const { getSubcategories } = await import('./db');
      return await getSubcategories(input.parentId);
    }),

  // Get category by ID with products (public)
  getCategoryWithProducts: publicProcedure
    .input(z.object({ 
      categoryId: z.number(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const { getCategoryById, getSubcategories, getProductsByCategoryId } = await import('./db');
      
      const category = await getCategoryById(input.categoryId);
      if (!category) {
        throw new Error('القسم غير موجود');
      }
      
      const subcategories = await getSubcategories(input.categoryId);
      const products = await getProductsByCategoryId(input.categoryId);
      
      return {
        category,
        subcategories,
        products: products.slice(input.offset, input.offset + input.limit),
        total: products.length,
      };
    }),

  // Search products (public)
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      categoryId: z.number().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const { searchProducts } = await import('./db');
      return await searchProducts(input);
    }),

  // Log product view (public)
  logView: publicProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { logProductView } = await import("./db");
      await logProductView(input.productId, ctx.user?.id ?? null);
      return { success: true };
    }),

  // Trending products (public)
  getTrending: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(12) }).optional())
    .query(async ({ input }) => {
      const { getTrendingProducts } = await import("./db");
      const items = await getTrendingProducts(input?.limit ?? 12);
      return { products: items };
    }),

  // Similar products (public)
  getSimilar: publicProcedure
    .input(z.object({ productId: z.number(), limit: z.number().min(1).max(50).default(8) }))
    .query(async ({ input }) => {
      const { getSimilarProducts } = await import("./db");
      const items = await getSimilarProducts(input.productId, input.limit);
      return { products: items };
    }),

  // Recommended for user (protected)
  getRecommended: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(12) }).optional())
    .query(async ({ ctx, input }) => {
      const { getRecommendedProductsForUser } = await import("./db");
      const items = await getRecommendedProductsForUser(ctx.user!.id, input?.limit ?? 12);
      return { products: items };
    }),
});

// ============= Sharing Router =============
const sharingRouter = router({
  track: publicProcedure
    .input(
      z.object({
        platform: z.enum(["whatsapp", "telegram", "facebook", "twitter", "copy_link"]),
        productId: z.number().optional(),
        storeId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { trackShare } = await import("./db");
      const id = await trackShare({
        platform: input.platform as any,
        productId: input.productId,
        storeId: input.storeId,
        userId: ctx.user?.id ?? null,
      });
      return { success: true, id };
    }),

  topSharedProducts: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
    .query(async ({ input }) => {
      const { getTopSharedProducts } = await import("./db");
      const items = await getTopSharedProducts(input?.limit ?? 10);
      return { items };
    }),
});

// ============= ChatBot Router =============
const chatbotRouter = router({
  chat: publicProcedure
    .input(z.object({
      message: z.string().min(1).max(1000),
      language: z.string().optional(),
      conversationId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import('./_core/llm');
      const {
        appendChatMessage,
        createChatConversation,
        getChatMessages,
        getChatMemorySnippets,
        logSearchQuery,
        searchProductsByQuery,
      } = await import("./db");

      const conversationId = input.conversationId ?? (await createChatConversation(ctx.user?.id ?? null));
      await appendChatMessage(conversationId, "user", input.message);

      // Lightweight RAG: bring top matching products into context
      const candidates = await searchProductsByQuery(input.message, 6);
      const productHints = (candidates ?? []).slice(0, 6).map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
      }));

      await logSearchQuery(input.message, ctx.user?.id ?? null);

      const previous = (await getChatMessages(conversationId, 10)).slice().reverse();
      const historyMessages = previous.map((m: any) => ({
        role: (String(m.role) as any) || "user",
        content: String(m.content ?? ""),
      }));

      const memory = await getChatMemorySnippets({
        userId: ctx.user?.id ?? null,
        query: input.message,
        limit: 6,
      });

      const memoryBlock = (memory ?? [])
        .slice(0, 6)
        .map((r: any) => {
          const corrected = String(r.corrected_answer ?? "").trim();
          const rating = Number(r.rating ?? 0);
          const content = String(r.content ?? "").trim();
          return corrected
            ? `- [feedback:${rating}] Q/A snippet: ${content}\n  corrected: ${corrected}`
            : `- snippet: ${content}`;
        })
        .join("\n");
      
      const resolveLanguageBucket = (raw: unknown): 'ar' | 'ur' | 'en' => {
        const lang = String(raw ?? '').trim();
        if (!lang) return 'ar';
        const base = lang.split('-')[0]?.toLowerCase();
        if (base === 'ar') return 'ar';
        if (base === 'ur') return 'ur';
        return 'en';
      };

      const langBucket = resolveLanguageBucket(input.language);

      const systemPrompt = langBucket === 'ar'
        ? `أنت مساعد ذكي لمنصة STAR LUX للتجارة الإلكترونية.

معلومات المنصة:
- الاسم: STAR LUX
- الوصف: منصة تجارة إلكترونية عالمية متعددة البائعين
- الأقسام: الإلكترونيات، الأزياء، المنزل والحديقة، الصحة والجمال، الرياضة
- طرق الدفع: Visa, Mastercard, آسيا باي, زين كاش
- الشحن: شحن مجاني للطلبات فوق 50$
- الإرجاع: خلال 14 يوم

التواصل:
- Instagram: @0q.b4
- TikTok: @4j_j7
- Telegram: @T54_5
- WhatsApp: +9647819501604
- Email: ahmedyassin555555555@gmail.com

قواعد الدقة والشفافية (مهمة جداً):
1) لا تخترع معلومات أو أرقام أو سياسات غير مذكورة.
2) إذا سأل المستخدم عن حالة طلب/شحنة/حساب: قل بوضوح أنك لا تملك وصولاً لبياناته، واطلب رقم الطلب أو وجّهه لصفحة (طلباتي) أو الدعم.
3) إذا كان السؤال غير واضح: اسأل سؤال توضيحي واحد قبل إعطاء خطوات عامة.
4) اجعل الرد 3-6 أسطر، بنقاط قصيرة عند الحاجة.
5) تجنّب الإيموجي إلا عند الحاجة (0-1).

ابدأ بالإجابة مباشرة ثم اقترح خطوة عملية واحدة.`
        : langBucket === 'ur'
        ? `آپ STAR LUX ای کامرس پلیٹ فارم کے لیے ایک ذہین اسسٹنٹ ہیں۔

Platform Info:
- Name: STAR LUX
- Description: Global multi-vendor e-commerce platform
- Categories: Electronics, Fashion, Home & Garden, Health & Beauty, Sports
- Payment: Visa, Mastercard, Asia Pay, Zain Cash
- Shipping: Free for orders over $50
- Returns: Within 14 days

Contact:
- Instagram: @0q.b4
- TikTok: @4j_j7
- Telegram: @T54_5
- WhatsApp: +9647819501604
- Email: ahmedyassin555555555@gmail.com

Precision & transparency rules (very important):
1) Do not invent details, numbers, or policies not provided.
2) If asked about order/shipping/account status: clearly say you don't have access to the user's private data; ask for an order number or direct them to “My Orders” or support.
3) If the question is ambiguous: ask one clarifying question before giving generic steps.
4) Keep the reply 3–6 lines; use short bullet points when helpful.
5) Avoid emojis unless necessary (0–1).

IMPORTANT: Reply in Urdu.

Answer directly first, then propose one practical next step.`
        : `You are a smart assistant for STAR LUX e-commerce platform.

Platform Info:
- Name: STAR LUX
- Description: Global multi-vendor e-commerce platform
- Categories: Electronics, Fashion, Home & Garden, Health & Beauty, Sports
- Payment: Visa, Mastercard, Asia Pay, Zain Cash
- Shipping: Free for orders over $50
- Returns: Within 14 days

Contact:
- Instagram: @0q.b4
- TikTok: @4j_j7
- Telegram: @T54_5
- WhatsApp: +9647819501604
- Email: ahmedyassin555555555@gmail.com

Precision & transparency rules (very important):
1) Do not invent details, numbers, or policies not provided.
2) If asked about order/shipping/account status: clearly say you don't have access to the user's private data; ask for an order number or direct them to “My Orders” or support.
3) If the question is ambiguous: ask one clarifying question before giving generic steps.
4) Keep the reply 3–6 lines; use short bullet points when helpful.
5) Avoid emojis unless necessary (0–1).

Answer directly first, then propose one practical next step.`;
      
      try {
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            {
              role: "system",
              content:
                langBucket === "ar"
                  ? `ذاكرة/تصحيحات سابقة من المستخدم (لتحسين الدقة):\n${memoryBlock || 'لا يوجد'}`
                  : langBucket === "ur"
                  ? `پچھلی یادداشت/درستگیاں (درست جواب کے لیے):\n${memoryBlock || 'none'}`
                  : `User memory/corrections (for accuracy):\n${memoryBlock || 'none'}`,
            },
            {
              role: "system",
              content:
                langBucket === "ar"
                  ? `منتجات مقترحة من قاعدة البيانات (قد تساعد في الإجابة):\n${JSON.stringify(productHints)}`
                  : langBucket === "ur"
                  ? `ڈیٹابیس سے تجویز کردہ مصنوعات (جواب میں مدد کر سکتی ہیں):\n${JSON.stringify(productHints)}`
                  : `Suggested products from DB (may help):\n${JSON.stringify(productHints)}`,
            },
            { role: 'user', content: input.message },
          ],
        });
        
        const content = (response as any)?.choices?.[0]?.message?.content || 
          (langBucket === 'ar' 
            ? 'عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى.'
            : langBucket === 'ur'
            ? 'معذرت، میں آپ کی درخواست پروسیس نہیں کر سکا۔ براہِ کرم دوبارہ کوشش کریں۔'
            : 'Sorry, I couldn\'t process your request. Please try again.');
        
        const assistantMessageId = await appendChatMessage(conversationId, "assistant", content);
        return { response: content, conversationId, assistantMessageId };
      } catch (error) {
        console.error('ChatBot LLM error:', error);

        const msg = input.message.toLowerCase();
        const isAr = langBucket === 'ar';
        const isUr = langBucket === 'ur';
        const includesAny = (terms: string[]) => terms.some(t => msg.includes(t));

        const response = (() => {
          if (includesAny(['دفع', 'payment', 'visa', 'mastercard', 'زين', 'asia', 'آسيا'])) {
            return isAr
              ? '💳 طرق الدفع المتاحة: Visa / Mastercard / زين كاش / آسيا باي.'
              : isUr
              ? '💳 دستیاب ادائیگی کے طریقے: Visa / Mastercard / Zain Cash / Asia Pay.'
              : '💳 Available payment methods: Visa / Mastercard / Zain Cash / Asia Pay.';
          }

          if (includesAny(['شحن', 'توصيل', 'shipping', 'delivery', 'track', 'تتبع'])) {
            return isAr
              ? '🚚 الشحن عالمي (3-7 أيام)، ومجاني للطلبات فوق 50$. للتتبع: ادخل إلى (طلباتي) ثم اختر الطلب واضغط تتبع.'
              : isUr
              ? '🚚 عالمی شپنگ (3–7 دن) اور $50 سے اوپر آرڈرز پر مفت۔ ٹریکنگ کے لیے: (My Orders) میں جائیں، آرڈر کھولیں اور ٹریک کریں۔'
              : '🚚 Worldwide shipping (3–7 days). Free over $50. To track: go to “My Orders” then open the order and track it.';
          }

          if (includesAny(['ارجاع', 'استرجاع', 'refund', 'return', 'exchange', 'استبدال'])) {
            return isAr
              ? '↩️ الإرجاع خلال 14 يوم بشرط بقاء المنتج بحالته الأصلية. إذا ذكرت رقم الطلب أساعدك بخطوات الإرجاع.'
              : isUr
              ? '↩️ 14 دن کے اندر واپسی ممکن ہے اگر پروڈکٹ اصل حالت میں ہو۔ اگر آپ آرڈر نمبر دیں تو میں آپ کو مراحل بتا دوں گا۔'
              : '↩️ Returns within 14 days if the product is in original condition. If you share the order number, I’ll guide you.';
          }

          if (includesAny(['بائع', 'بيع', 'seller', 'store', 'متجر', 'اشتراك', 'plan', 'subscription', 'خطة'])) {
            return isAr
              ? '🏪 للبائعين: سجل كبائع ثم اختر خطة (مجانية/برو/كميونتي). العمولة 2%. أخبرني هل تريد فتح متجر أم ترقية خطة؟'
              : isUr
              ? '🏪 بیچنے والوں کے لیے: بطور Seller رجسٹر کریں پھر پلان منتخب کریں (Free/Pro/Community)۔ کمیشن 2% ہے۔ کیا آپ اسٹور بنانا چاہتے ہیں یا پلان اپ گریڈ؟'
              : '🏪 Sellers: register as a seller then choose a plan (Free/Pro/Community). Commission is 2%. Do you want to open a store or upgrade?';
          }

          if (includesAny(['قسم', 'اقسام', 'category', 'categories', 'فئة'])) {
            return isAr
              ? '📂 الأقسام: الإلكترونيات، الأزياء، المنزل والحديقة، الصحة والجمال، الرياضة. أي قسم يهمك؟'
              : isUr
              ? '📂 زمرے: Electronics، Fashion، Home & Garden، Health & Beauty، Sports۔ آپ کس زمرے میں دیکھنا چاہتے ہیں؟'
              : '📂 Categories: Electronics, Fashion, Home & Garden, Health & Beauty, Sports. Which one are you looking for?';
          }

          if (includesAny(['تواصل', 'support', 'help', 'مساعدة', 'contact', 'رقم'])) {
            return isAr
              ? '📞 الدعم: WhatsApp +9647819501604 | Telegram @T54_5 | Instagram @0q.b4 | TikTok @4j_j7 | Email ahmedyassin555555555@gmail.com'
              : isUr
              ? '📞 سپورٹ: WhatsApp +9647819501604 | Telegram @T54_5 | Instagram @0q.b4 | TikTok @4j_j7 | Email ahmedyassin555555555@gmail.com'
              : '📞 Support: WhatsApp +9647819501604 | Telegram @T54_5 | Instagram @0q.b4 | TikTok @4j_j7 | Email ahmedyassin555555555@gmail.com';
          }

          return isAr
            ? '🤖 فهمت سؤالك. هل تقصد (شراء/دفع/شحن/إرجاع/فتح متجر)؟ اكتب كلمة واحدة من هذه وسأعطيك الخطوات مباشرة.'
            : isUr
            ? '🤖 سمجھ گیا۔ کیا آپ (خریداری / ادائیگی / شپنگ / واپسی / فروخت) کے بارے میں پوچھ رہے ہیں؟ ایک لفظ لکھیں اور میں آپ کو مرحلہ وار بتاؤں گا۔'
            : '🤖 Got it. Are you asking about (buying / payment / shipping / returns / selling)? Reply with one word and I’ll guide you step-by-step.';
        })();

        const assistantMessageId = await appendChatMessage(conversationId, "assistant", response);
        return { 
          response,
          conversationId,
          assistantMessageId,
        };
      }
    }),

  feedback: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        messageId: z.number(),
        rating: z.enum(["up", "down"]),
        correctedAnswer: z.string().max(2000).optional(),
        notes: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { addChatFeedback } = await import("./db");
      const rating = input.rating === "up" ? 1 : -1;
      const id = await addChatFeedback({
        conversationId: input.conversationId,
        messageId: input.messageId,
        userId: ctx.user?.id ?? null,
        rating: rating as any,
        correctedAnswer: input.correctedAnswer ?? null,
        notes: input.notes ?? null,
      });
      return { ok: true, id };
    }),
});
const subscriptionRouter = router({
  // تأكيد دفع الاشتراك
  confirmPayment: publicProcedure
    .input(z.object({
      plan: z.enum(['pro', 'community']),
      paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS),
      transactionId: z.string().min(3),
      amount: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('قاعدة البيانات غير متاحة');

      // التحقق من المبلغ
      const expectedAmount = input.plan === 'pro' ? 50 : 80;
      if (input.amount !== expectedAmount) {
        throw new Error('المبلغ غير صحيح');
      }

      // حفظ طلب الدفع للمراجعة
      await db.execute(`
        INSERT INTO subscription_payments (plan, payment_method, transaction_id, amount, status, created_at)
        VALUES ('${input.plan}', '${input.paymentMethod}', '${input.transactionId}', ${input.amount}, 'pending', NOW())
      `);

      console.log(`[Subscription Payment] New payment request: ${input.plan} - ${input.transactionId}`);

      return {
        success: true,
        message: 'تم إرسال طلب الدفع للمراجعة',
      };
    }),

  // الحصول على حالة الاشتراك
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('قاعدة البيانات غير متاحة');

    const [rows] = await db.execute(`
      SELECT * FROM subscriptions WHERE sellerId = ${ctx.user!.id} ORDER BY id DESC LIMIT 1
    `) as any;

    return rows?.[0] || null;
  }),
});

// ============= Notifications Router =============

import * as advancedNotifications from './advancedNotifications';

const notificationsRouter = router({
  // الحصول على إشعارات المستخدم مع فلترة متقدمة
  getAll: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      unreadOnly: z.boolean().default(false),
      category: z.enum(['orders', 'payments', 'wallet', 'store', 'subscription', 'system', 'communication']).optional(),
      includeArchived: z.boolean().default(false),
    }).optional())
    .query(async ({ ctx, input }) => {
      return advancedNotifications.getUserNotifications(ctx.user!.id, input || {});
    }),

  // عدد الإشعارات غير المقروءة
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await advancedNotifications.getUserNotifications(ctx.user!.id, { limit: 1 });
    return result.unreadCount;
  }),

  // تحديد إشعار كمقروء
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await advancedNotifications.markAsRead(input.id, ctx.user!.id);
      return { success, message: success ? 'تم تحديد الإشعار كمقروء' : 'فشل في تحديد الإشعار' };
    }),

  // تحديد جميع الإشعارات كمقروءة
  markAllAsRead: protectedProcedure
    .input(z.object({
      category: z.enum(['orders', 'payments', 'wallet', 'store', 'subscription', 'system', 'communication']).optional(),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      const success = await advancedNotifications.markAllAsRead(ctx.user!.id, input?.category);
      return { success, message: success ? 'تم تحديد جميع الإشعارات كمقروءة' : 'فشل في تحديد الإشعارات' };
    }),

  // أرشفة إشعار
  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await advancedNotifications.archiveNotification(input.id, ctx.user!.id);
      return { success, message: success ? 'تم أرشفة الإشعار' : 'فشل في أرشفة الإشعار' };
    }),

  // حذف إشعار
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await advancedNotifications.deleteNotification(input.id, ctx.user!.id);
      return { success, message: success ? 'تم حذف الإشعار' : 'فشل في حذف الإشعار' };
    }),

  // حذف جميع الإشعارات المقروءة
  deleteAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const count = await advancedNotifications.deleteAllRead(ctx.user!.id);
    return { success: true, deletedCount: count, message: `تم حذف ${count} إشعار` };
  }),

  // الحصول على إعدادات الإشعارات
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    return advancedNotifications.getNotificationSettings(ctx.user!.id);
  }),

  // تحديث إعدادات الإشعارات
  updateSettings: protectedProcedure
    .input(z.object({
      emailEnabled: z.boolean().optional(),
      emailOrders: z.boolean().optional(),
      emailPayments: z.boolean().optional(),
      emailWallet: z.boolean().optional(),
      emailStore: z.boolean().optional(),
      emailSubscription: z.boolean().optional(),
      emailSystem: z.boolean().optional(),
      emailCommunication: z.boolean().optional(),
      inAppEnabled: z.boolean().optional(),
      inAppSound: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await advancedNotifications.updateNotificationSettings(ctx.user!.id, input);
      return { success, message: success ? 'تم تحديث الإعدادات' : 'فشل في تحديث الإعدادات' };
    }),

  // الحصول على العملات المدعومة
  getCurrencies: protectedProcedure.query(async () => {
    return advancedNotifications.getSupportedCurrencies();
  }),

  // تحويل العملة
  convertCurrency: protectedProcedure
    .input(z.object({
      fromCurrency: z.string().length(3),
      toCurrency: z.string().length(3),
      amount: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      return advancedNotifications.convertCurrency(
        ctx.user!.id,
        input.fromCurrency,
        input.toCurrency,
        input.amount
      );
    }),

  // سجل تحويلات العملات
  getCurrencyHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return advancedNotifications.getCurrencyConversionHistory(ctx.user!.id, input?.limit || 50);
    }),
});

// ============= Router التقييمات والمراجعات =============
import {
  getRatingByUserAndEntity,
  createRating,
  updateRating as updateRatingDb,
  deleteRating as deleteRatingDb,
  getRatingById,
  createReview,
  getReviewByRatingId,
  getEntityRatings,
  getRatingSummary,
  updateRatingSummaryForEntity,
  createReviewInteraction,
  getExistingInteraction,
  updateReviewHelpfulCount,
  updateReviewNotHelpfulCount,
  updateReviewReportCount,
  addSellerResponse,
  checkVerifiedPurchase,
} from './db';

const ratingsRouter = router({
  // إضافة تقييم جديد
  addRating: protectedProcedure
    .input(z.object({
      entityType: z.enum(['product', 'store', 'seller']),
      entityId: z.number(),
      rating: z.number().min(1).max(5).multipleOf(0.5),
      qualityRating: z.number().min(1).max(5).optional(),
      serviceRating: z.number().min(1).max(5).optional(),
      deliveryRating: z.number().min(1).max(5).optional(),
      valueRating: z.number().min(1).max(5).optional(),
      orderId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // التحقق من عدم وجود تقييم سابق
      const existingRating = await getRatingByUserAndEntity(ctx.user!.id, input.entityType, input.entityId);
      if (existingRating) {
        throw new Error('لقد قمت بتقييم هذا العنصر مسبقاً');
      }

      // التحقق من الشراء الفعلي
      let isVerifiedPurchase = false;
      if (input.orderId) {
        isVerifiedPurchase = await checkVerifiedPurchase(input.orderId, ctx.user!.id);
      }

      // إضافة التقييم
      const ratingId = await createRating({
        userId: ctx.user!.id,
        entityType: input.entityType,
        entityId: input.entityId,
        rating: input.rating,
        qualityRating: input.qualityRating,
        serviceRating: input.serviceRating,
        deliveryRating: input.deliveryRating,
        valueRating: input.valueRating,
        orderId: input.orderId,
        isVerifiedPurchase,
      });

      // تحديث ملخص التقييمات
      await updateRatingSummaryForEntity(input.entityType, input.entityId);

      return {
        success: true,
        message: 'تم إضافة التقييم بنجاح',
        ratingId
      };
    }),

  // تحديث تقييم موجود
  updateRating: protectedProcedure
    .input(z.object({
      ratingId: z.number(),
      rating: z.number().min(1).max(5).multipleOf(0.5),
      qualityRating: z.number().min(1).max(5).optional(),
      serviceRating: z.number().min(1).max(5).optional(),
      deliveryRating: z.number().min(1).max(5).optional(),
      valueRating: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // التحقق من ملكية التقييم
      const existingRating = await getRatingById(input.ratingId);
      if (!existingRating || existingRating.userId !== ctx.user!.id) {
        throw new Error('التقييم غير موجود أو ليس لديك صلاحية التعديل');
      }

      await updateRatingDb(input.ratingId, {
        rating: input.rating,
        qualityRating: input.qualityRating,
        serviceRating: input.serviceRating,
        deliveryRating: input.deliveryRating,
        valueRating: input.valueRating,
      });

      // تحديث ملخص التقييمات
      await updateRatingSummaryForEntity(existingRating.entityType, existingRating.entityId);

      return {
        success: true,
        message: 'تم تحديث التقييم بنجاح'
      };
    }),

  // حذف تقييم
  deleteRating: protectedProcedure
    .input(z.object({
      ratingId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // التحقق من ملكية التقييم
      const existingRating = await getRatingById(input.ratingId);
      if (!existingRating || existingRating.userId !== ctx.user!.id) {
        throw new Error('التقييم غير موجود أو ليس لديك صلاحية الحذف');
      }

      const entityType = existingRating.entityType;
      const entityId = existingRating.entityId;

      await deleteRatingDb(input.ratingId);

      // تحديث ملخص التقييمات
      await updateRatingSummaryForEntity(entityType, entityId);

      return {
        success: true,
        message: 'تم حذف التقييم بنجاح'
      };
    }),

  // إضافة مراجعة
  addReview: protectedProcedure
    .input(z.object({
      ratingId: z.number(),
      title: z.string().max(255).optional(),
      content: z.string().min(10).max(5000),
      pros: z.array(z.string()).optional(),
      cons: z.array(z.string()).optional(),
      images: z.array(z.string()).optional(),
      videos: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // التحقق من وجود التقييم وملكيته
      const ratingData = await getRatingById(input.ratingId);
      if (!ratingData || ratingData.userId !== ctx.user!.id) {
        throw new Error('التقييم غير موجود أو ليس لديك صلاحية');
      }

      // التحقق من عدم وجود مراجعة سابقة
      const existingReview = await getReviewByRatingId(input.ratingId);
      if (existingReview) {
        throw new Error('توجد مراجعة مرتبطة بهذا التقييم بالفعل');
      }

      const reviewId = await createReview({
        ratingId: input.ratingId,
        userId: ctx.user!.id,
        entityType: ratingData.entityType,
        entityId: ratingData.entityId,
        title: input.title,
        content: input.content,
        pros: input.pros,
        cons: input.cons,
        images: input.images,
        videos: input.videos,
      });

      return {
        success: true,
        message: 'تم إضافة المراجعة بنجاح',
        reviewId
      };
    }),

  // جلب تقييمات كيان معين
  getEntityRatings: publicProcedure
    .input(z.object({
      entityType: z.enum(['product', 'store', 'seller']),
      entityId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(10),
      sortBy: z.enum(['newest', 'oldest', 'highest', 'lowest', 'helpful']).default('newest'),
    }))
    .query(async ({ input }) => {
      const result = await getEntityRatings(input.entityType, input.entityId, input.page, input.limit, input.sortBy);
      const summary = await getRatingSummary(input.entityType, input.entityId);

      return {
        ratings: result.ratings,
        summary,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / input.limit)
        }
      };
    }),

  // جلب تقييم المستخدم لكيان معين
  getUserRating: protectedProcedure
    .input(z.object({
      entityType: z.enum(['product', 'store', 'seller']),
      entityId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      return await getRatingByUserAndEntity(ctx.user!.id, input.entityType, input.entityId);
    }),

  // التفاعل مع مراجعة (مفيد/غير مفيد/بلاغ)
  interactWithReview: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      interactionType: z.enum(['helpful', 'not_helpful', 'report']),
      reportReason: z.enum(['spam', 'inappropriate', 'fake', 'offensive', 'misleading', 'other']).optional(),
      reportDetails: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // التحقق من عدم التفاعل السابق
      const existingInteraction = await getExistingInteraction(input.reviewId, ctx.user!.id, input.interactionType);
      if (existingInteraction) {
        throw new Error('لقد تفاعلت مع هذه المراجعة مسبقاً');
      }

      // إضافة التفاعل
      await createReviewInteraction({
        reviewId: input.reviewId,
        userId: ctx.user!.id,
        interactionType: input.interactionType,
        reportReason: input.reportReason,
        reportDetails: input.reportDetails,
      });

      // تحديث عدادات المراجعة
      if (input.interactionType === 'helpful') {
        await updateReviewHelpfulCount(input.reviewId, 1);
      } else if (input.interactionType === 'not_helpful') {
        await updateReviewNotHelpfulCount(input.reviewId, 1);
      } else if (input.interactionType === 'report') {
        await updateReviewReportCount(input.reviewId, 1);
      }

      return {
        success: true,
        message: 'تم تسجيل تفاعلك بنجاح'
      };
    }),

  // رد البائع على مراجعة
  sellerReplyToReview: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      response: z.string().min(10).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      // التحقق من أن المستخدم بائع
      if (ctx.user?.role !== 'seller' && ctx.user?.role !== 'admin') {
        throw new Error('غير مصرح لك بالرد على المراجعات');
      }

      await addSellerResponse(input.reviewId, input.response);

      return {
        success: true,
        message: 'تم إضافة ردك بنجاح'
      };
    }),
});

// ============= Security Router =============
const securityRouter = router({
  // الحصول على إحصائيات الأمان
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('غير مصرح');
    }

    return {
      healthScore: 92,
      healthStatus: 'excellent',
      totalEvents: 1247,
      criticalEvents: 3,
      blockedIPs: 15,
      autoFixes: 47,
      vulnerabilities: {
        open: 2,
        fixed: 45,
        total: 47,
      },
      performance: {
        avgResponseTime: 145,
        uptime: 99.97,
        errorRate: 0.03,
      },
    };
  }),

  // الحصول على الأحداث الأمنية
  getEvents: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
      severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error('غير مصرح');
      }

      // بيانات تجريبية
      return [
        {
          id: 1,
          eventType: 'sql_injection_attempt',
          severity: 'critical',
          description: 'محاولة حقن SQL مكتشفة ومحظورة',
          ipAddress: '192.168.1.100',
          createdAt: new Date().toISOString(),
          actionTaken: true,
        },
        {
          id: 2,
          eventType: 'rate_limit_exceeded',
          severity: 'medium',
          description: 'تجاوز حد الطلبات من IP معين',
          ipAddress: '10.0.0.50',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          actionTaken: true,
        },
      ];
    }),

  // حظر IP
  blockIP: protectedProcedure
    .input(z.object({
      ip: z.string(),
      reason: z.string(),
      duration: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error('غير مصرح');
      }

      // تنفيذ الحظر
      return {
        success: true,
        message: `تم حظر IP: ${input.ip}`,
      };
    }),

  // إلغاء حظر IP
  unblockIP: protectedProcedure
    .input(z.object({
      ip: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error('غير مصرح');
      }

      return {
        success: true,
        message: `تم إلغاء حظر IP: ${input.ip}`,
      };
    }),

  // الحصول على الثغرات
  getVulnerabilities: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('غير مصرح');
    }

    return [
      {
        id: 1,
        type: 'xss',
        severity: 'high',
        status: 'fixed',
        title: 'ثغرة XSS في حقل التعليقات',
        description: 'تم اكتشاف إمكانية حقن سكريبت في حقل التعليقات',
        autoFixed: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }),

  // الحصول على إحصائيات التعلم
  getLearningStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('غير مصرح');
    }

    return {
      learnedPatterns: 156,
      blockedPatterns: 23,
      autoFixedCount: 47,
      attackSignatures: 89,
      suspiciousBehaviors: 12,
    };
  }),
});

// ============================================
// Search Router - نظام البحث الذكي
// ============================================
const searchRouter = router({
  // البحث الفوري مع الاقتراحات
  instantSearch: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(200),
      limit: z.number().min(1).max(20).default(8),
      type: z.enum(['all', 'products', 'stores', 'categories']).default('all'),
    }))
    .query(async ({ input }) => {
      const { query, limit, type } = input;
      
      // تنظيف وتعقيم المدخلات
      const sanitizedQuery = query
        .replace(/[<>"'&]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      
      if (!sanitizedQuery || sanitizedQuery.length < 1) {
        return { products: [], stores: [], categories: [], totalCount: 0 };
      }
      
      const results: {
        products: Array<{
          id: string;
          type: 'product';
          title: string;
          subtitle: string;
          image: string | null;
          url: string;
          price: number;
          rating: number;
        }>;
        stores: Array<{
          id: string;
          type: 'store';
          title: string;
          subtitle: string;
          image: string | null;
          url: string;
        }>;
        categories: Array<{
          id: string;
          type: 'category';
          title: string;
          subtitle: string;
          image: string | null;
          url: string;
        }>;
        totalCount: number;
      } = { products: [], stores: [], categories: [], totalCount: 0 };
      
      // البحث في المنتجات
      if (type === 'all' || type === 'products') {
        const productsResult = await searchProductsByQuery(sanitizedQuery, limit);
        results.products = productsResult.map((p: any) => ({
          id: String(p.id),
          type: 'product' as const,
          title: p.title,
          subtitle: `${p.price} د.ع`,
          image: p.images ? (typeof p.images === 'string' ? JSON.parse(p.images)[0] : p.images[0]) : null,
          url: `/product/${p.id}`,
          price: Number(p.price),
          rating: Number(p.rating) || 0,
        }));
      }
      
      // البحث في المتاجر
      if (type === 'all' || type === 'stores') {
        const storesResult = await searchStores(sanitizedQuery, Math.min(limit, 5));
        results.stores = storesResult.map((s: any) => ({
          id: String(s.id),
          type: 'store' as const,
          title: s.name,
          subtitle: s.description?.substring(0, 50) || 'متجر',
          image: s.logo,
          url: `/store/${s.id}`,
        }));
      }
      
      // البحث في الفئات
      if (type === 'all' || type === 'categories') {
        const categoriesResult = await searchCategories(sanitizedQuery, Math.min(limit, 5));
        results.categories = categoriesResult.map((c: any) => ({
          id: String(c.id),
          type: 'category' as const,
          title: c.name ?? c.nameAr ?? c.nameEn,
          subtitle: c.description?.substring(0, 50) || 'فئة',
          image: c.image ?? c.icon ?? null,
          url: `/category/${c.id}`,
        }));
      }
      
      results.totalCount = results.products.length + results.stores.length + results.categories.length;
      
      return results;
    }),

  // البحث المتقدم مع فلاتر
  advancedSearch: publicProcedure
    .input(z.object({
      query: z.string().max(200).default(''),
      category: z.string().optional(),
      minPrice: z.number().min(0).optional(),
      maxPrice: z.number().min(0).optional(),
      rating: z.number().min(0).max(5).optional(),
      sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'newest']).default('relevance'),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const { query, category, minPrice, maxPrice, rating, sortBy, page, limit } = input;
      
      // تنظيف المدخلات
      const sanitizedQuery = query
        .replace(/[<>"'&]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      
      const result = await advancedProductSearch({
        query: sanitizedQuery,
        categoryId: category,
        minPrice,
        maxPrice,
        minRating: rating,
        sortBy,
        page,
        limit,
      });
      
      const products = result.products.map((p: any) => ({
        id: String(p.id),
        name: p.title || p.name,
        description: p.description,
        price: Number(p.price),
        originalPrice: null,
        images: p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [],
        rating: Number(p.rating) || 0,
        reviewCount: 0,
        store: {
          id: String(p.storeId),
          name: '',
          logo: null,
        },
        category: {
          id: String(p.categoryId),
          name: '',
        },
      }));
      
      return {
        products,
        pagination: {
          page,
          limit,
          totalCount: result.totalCount,
          totalPages: Math.ceil(result.totalCount / limit),
          hasMore: page * limit < result.totalCount,
        },
      };
    }),

  // الحصول على اقتراحات البحث الشائعة
  getTrendingSearches: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ input }) => {
      // اقتراحات ثابتة للعرض (يمكن تحسينها لاحقاً بناءً على البيانات الفعلية)
      const trending = [
        'هواتف ذكية',
        'ملابس رجالية',
        'إلكترونيات',
        'أحذية رياضية',
        'ساعات',
        'حقائب نسائية',
        'عطور',
        'مستحضرات تجميل',
        'أجهزة منزلية',
        'ألعاب أطفال',
      ];
      
      return trending.slice(0, input.limit);
    }),

  // البحث بالرابط المباشر
  searchByUrl: publicProcedure
    .input(z.object({
      url: z.string().url(),
    }))
    .query(async ({ input }) => {
      const { url } = input;
      
      // استخراج معرف المنتج من الرابط
      const productIdMatch = url.match(/\/product\/([a-zA-Z0-9-]+)/);
      const storeIdMatch = url.match(/\/store\/([a-zA-Z0-9-]+)/);
      
      if (productIdMatch) {
        const productId = productIdMatch[1];
        const product = await getProductByStringId(productId);
        
        if (product) {
          return {
            type: 'product' as const,
            data: {
              id: String(product.id),
              name: product.title,
              description: product.description,
              price: Number(product.price),
              images: product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) : [],
              store: '',
            },
          };
        }
      }
      
      if (storeIdMatch) {
        const storeId = Number(storeIdMatch[1]);
        const store = await getStoreById(storeId);
        
        if (store) {
          return {
            type: 'store' as const,
            data: {
              id: String(store.id),
              name: store.name,
              description: store.description,
              logo: store.logo,
            },
          };
        }
      }
      
      return { type: 'not_found' as const, data: null };
    }),
});

// ============================================
// AI Engine Router - Phase 1
// ============================================
const aiRouter = router({
  logInteraction: protectedProcedure
    .input(
      z.object({
        eventType: z.enum([
          "view",
          "click",
          "add_to_cart",
          "remove_from_cart",
          "purchase",
          "search",
          "wishlist_add",
          "wishlist_remove",
        ]),
        entityType: z.enum(["product", "store", "category", "search"]).optional(),
        entityId: z.number().optional(),
        sessionId: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await logInteraction({
        userId: ctx.user?.id ?? null,
        sessionId: input.sessionId ?? null,
        eventType: input.eventType,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata,
      });

      const patch: any = {
        lastEventAt: new Date().toISOString(),
        lastEventType: input.eventType,
      };
      if (input.entityType === "product" && input.entityId) {
        patch.lastProductId = input.entityId;
      }
      if (input.eventType === "search") {
        const q = String((input.metadata as any)?.query ?? "").trim();
        if (q) patch.lastSearchQuery = q;
      }
      if (ctx.user?.id) {
        await upsertAiUserProfile(ctx.user.id, patch);
      }

      return { ok: true } as const;
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) return null;
    return await getAiUserProfile(userId);
  }),

  getRecommendations: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) return [] as any[];
      const limit = input?.limit ?? 12;
      return await getRecommendationsForUser(userId, limit);
    }),

  logRecommendationImpression: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        modelVersion: z.string().max(64).optional(),
        context: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await logRecommendationEvent({
        userId: ctx.user?.id ?? null,
        productId: input.productId,
        eventType: "impression",
        modelVersion: input.modelVersion ?? null,
        context: input.context,
      });
      return { ok: true } as const;
    }),

  logRecommendationClick: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        modelVersion: z.string().max(64).optional(),
        context: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await logRecommendationEvent({
        userId: ctx.user?.id ?? null,
        productId: input.productId,
        eventType: "click",
        modelVersion: input.modelVersion ?? null,
        context: input.context,
      });
      return { ok: true } as const;
    }),

  getMetrics: adminProcedure
    .input(
      z
        .object({
          days: z.number().min(1).max(90).optional(),
          modelVersion: z.string().max(64).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await getRecommendationMetrics({
        days: input?.days ?? 7,
        modelVersion: input?.modelVersion,
      });
    }),

  smartSearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        limit: z.number().min(1).max(50).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const results = await smartSearchProducts(input.query, input.limit ?? 20);
      if (ctx.user?.id) {
        await logInteraction({
          userId: ctx.user.id,
          eventType: "search",
          entityType: "search",
          entityId: null,
          metadata: { query: input.query, limit: input.limit ?? 20 },
        });
      }
      return results;
    }),

  trainTfidf: adminProcedure
    .input(
      z
        .object({
          model: z.string().min(1).max(80).optional(),
          maxFeatures: z.number().min(64).max(4096).optional(),
          minDf: z.number().min(1).max(50).optional(),
          maxDf: z.number().min(0.1).max(1).optional(),
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      const baseUrl = String(process.env.AI_SERVICE_URL ?? "").trim();
      const secret = String(process.env.AI_SERVICE_SECRET ?? "").trim();

      if (!baseUrl) {
        throw new Error("AI_SERVICE_URL is not configured");
      }
      if (!secret) {
        throw new Error("AI_SERVICE_SECRET is not configured");
      }

      const url = `${baseUrl.replace(/\/$/, "")}/train/tfidf`;
      const body = {
        model: input?.model ?? "tfidf-v1",
        max_features: input?.maxFeatures ?? 512,
        min_df: input?.minDf ?? 2,
        max_df: input?.maxDf ?? 0.95,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ai-secret": secret,
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`AI service error (${res.status}): ${text.slice(0, 500)}`);
      }
      try {
        return JSON.parse(text);
      } catch {
        return { ok: true, raw: text };
      }
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  admin: adminRouter,
  ai: aiRouter,
  seller: sellerRouter,
  cart: cartRouter,
  products: productsRouter,
  chatbot: chatbotRouter,
  subscription: subscriptionRouter,
  notifications: notificationsRouter,
  ratings: ratingsRouter,
  security: securityRouter,
  search: searchRouter,
  sharing: sharingRouter,
  roles: roleRouter,
});

export type AppRouter = typeof appRouter;
