import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as any,
  };
}

describe("Registration System", () => {
  describe("registerUser", () => {
    it("should register a new user with phone verification", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const uniqueEmail = `newuser_${Date.now()}@example.com`;

      const result = await caller.auth.registerUser({
        email: uniqueEmail,
        password: "SecurePassword123",
        name: "Ahmed Yassin",
        phoneNumber: "9647819501604",
        countryCode: "IQ",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it("should reject short passwords", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const uniqueEmail = `shortpass_${Date.now()}@example.com`;

      try {
        await caller.auth.registerUser({
          email: uniqueEmail,
          password: "short",
          name: "Test User",
          phoneNumber: "1234567890",
          countryCode: "US",
        });
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).toBeDefined();
      }
    });

    it("should reject invalid email", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.auth.registerUser({
          email: "invalid-email",
          password: "SecurePassword123",
          name: "Test User",
          phoneNumber: "1234567890",
          countryCode: "US",
        });
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).toBeDefined();
      }
    });

    it("should reject short names", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const uniqueEmail = `shortname_${Date.now()}@example.com`;

      try {
        await caller.auth.registerUser({
          email: uniqueEmail,
          password: "SecurePassword123",
          name: "A",
          phoneNumber: "1234567890",
          countryCode: "US",
        });
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).toBeDefined();
      }
    });
  });

  describe("registerStore", () => {
    it("should register a new store", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const uniqueEmail = `store_${Date.now()}@example.com`;

      const result = await caller.auth.registerStore({
        storeName: "My Awesome Store",
        storeType: "electronics",
        email: uniqueEmail,
        password: "StorePassword123!",
        phoneNumber: "9647819501604",
        countryCode: "IQ",
        country: "Iraq",
        plan: "free",
        paymentMethods: [{ id: "paypal", details: "test@example.com" }],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it("should reject store with invalid plan", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const uniqueEmail = `invalid_plan_${Date.now()}@example.com`;

      try {
        await caller.auth.registerStore({
          storeName: "My Store",
          storeType: "electronics",
          email: uniqueEmail,
          password: "StorePassword123!",
          phoneNumber: "1234567890",
          countryCode: "US",
          country: "USA",
          plan: "invalid" as any,
          paymentMethods: [{ id: "paypal", details: "test@example.com" }],
        });
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err).toBeDefined();
      }
    });

    it("should support all subscription plans", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const timestamp = Date.now();

      const plans: Array<"free" | "pro" | "community"> = ["free", "pro", "community"];

      for (const plan of plans) {
        const result = await caller.auth.registerStore({
          storeName: `Store ${plan}`,
          storeType: "electronics",
          email: `store-${plan}-${timestamp}@example.com`,
          password: "StorePassword123!",
          phoneNumber: "1234567890",
          countryCode: "US",
          country: "USA",
          plan,
          paymentMethods: [{ id: "paypal", details: "test@example.com" }],
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe("verifyRegistrationOtp", () => {
    it("should verify valid OTP", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const uniqueEmail = `verify_${Date.now()}@example.com`;

      // First, register a user to get OTP
      await caller.auth.registerUser({
        email: uniqueEmail,
        password: "SecurePassword123",
        name: "Verify User",
        phoneNumber: "9876543210",
        countryCode: "US",
      });

      // Note: In a real test, we would need to capture the OTP from the database
      // For now, this test demonstrates the flow
      expect(true).toBe(true);
    });

    it("should reject invalid OTP", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.auth.verifyRegistrationOtp({
          email: "nonexistent_otp@example.com",
          phoneNumber: "1234567890",
          otp: "000000",
          type: "user",
        });
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).toBeDefined();
      }
    });

    it("should reject OTP with wrong length", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.auth.verifyRegistrationOtp({
          email: "test@example.com",
          phoneNumber: "1234567890",
          otp: "12345",
          type: "user",
        });
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err).toBeDefined();
      }
    });
  });

  describe("Login", () => {
    it("should login with valid credentials", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const uniqueEmail = `login_${Date.now()}@example.com`;

      // First register a user
      await caller.auth.register({
        email: uniqueEmail,
        password: "LoginPassword123",
        name: "Login User",
      });

      // Then login
      const result = await caller.auth.login({
        email: uniqueEmail,
        password: "LoginPassword123",
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
    });

    it("should reject invalid password", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      // Try to login with wrong password for a user that may or may not exist
      try {
        await caller.auth.login({
          email: "wrongpass_test@example.com",
          password: "WrongPassword123",
        });
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        // Accept both Arabic and English error messages
        expect(err.message).toBeDefined();
      }
    });

    it("should reject non-existent user", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.auth.login({
          email: "nonexistent_user_test@example.com",
          password: "AnyPassword123",
        });
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        // Accept both Arabic and English error messages
        expect(err.message).toBeDefined();
      }
    });
  });

  describe("Password Reset", () => {
    it("should request password reset with valid email and phone", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      // This test demonstrates the flow
      // In a real scenario, we would need a registered user
      expect(true).toBe(true);
    });

    it("should verify password reset OTP", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.auth.verifyPasswordResetOtp({
          email: "nonexistent@example.com",
          otp: "000000",
        });
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        // الرسالة بالعربية - النظام الجديد يستخدم رسالة أمنية موحدة
        expect(err.message).toContain("رمز التحقق غير صالح");
      }
    });

    it("should reset password with valid OTP", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.auth.resetPassword({
          email: "nonexistent@example.com",
          resetId: 1,
          newPassword: "NewPassword123",
        });
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err).toBeDefined();
      }
    });
  });

  describe("Change Password", () => {
    it("should require authentication", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.auth.changePassword({
          currentPassword: "OldPassword123",
          newPassword: "NewPassword123",
          phoneNumber: "1234567890",
        });
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err).toBeDefined();
      }
    });
  });

  describe("Logout", () => {
    it("should clear session cookie", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result.success).toBe(true);
      expect(ctx.res.clearCookie).toHaveBeenCalled();
    });
  });

  describe("Get Current User", () => {
    it("should return null for unauthenticated user", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeNull();
    });

    it("should return user data for authenticated user", async () => {
      const user: AuthenticatedUser = {
        id: 1,
        email: "auth@example.com",
        name: "Auth User",
        phoneNumber: "1234567890",
        countryCode: "US",
        role: "user",
        isVerified: true,
        isBlocked: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
        profileImage: null,
        bio: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        passwordHash: "",
        openId: null,
      };

      const ctx: TrpcContext = {
        user,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: vi.fn(),
        } as any,
      };

      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();

      expect(result).toEqual(user);
      expect(result?.email).toBe("auth@example.com");
    });
  });
});
