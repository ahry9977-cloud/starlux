import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(user?: Partial<AuthenticatedUser>): { ctx: TrpcContext; clearedCookies: Array<{name: string; options: Record<string, unknown>}> } {
  const clearedCookies: Array<{name: string; options: Record<string, unknown>}> = [];

  const defaultUser: AuthenticatedUser = {
    id: 1,
    phoneNumber: "+1234567890",
    countryCode: "US",
    email: "test@example.com",
    name: "Test User",
    passwordHash: null,
    role: "user",
    isVerified: true,
    isBlocked: false,
    profileImage: null,
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: user ? { ...defaultUser, ...user } : defaultUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth", () => {
  describe("logout", () => {
    it("clears the session cookie and reports success", async () => {
      const { ctx, clearedCookies } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result).toEqual({ success: true });
      expect(clearedCookies).toHaveLength(1);
      expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
      expect(clearedCookies[0]?.options).toMatchObject({
        maxAge: -1,
        secure: true,
        sameSite: "none",
        httpOnly: true,
        path: "/",
      });
    });
  });

  describe("me", () => {
    it("returns the current authenticated user", async () => {
      const { ctx } = createAuthContext({
        id: 123,
        phoneNumber: "+9876543210",
        name: "John Doe",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeDefined();
      expect(result?.id).toBe(123);
      expect(result?.phoneNumber).toBe("+9876543210");
      expect(result?.name).toBe("John Doe");
    });
  });

  describe("updateProfile", () => {
    it("updates user profile successfully", async () => {
      const { ctx } = createAuthContext({ id: 1 });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.updateProfile({
        name: "Updated Name",
        email: "newemail@example.com",
        bio: "New bio",
      });

      expect(result).toEqual({ success: true });
    });

    it("allows partial updates", async () => {
      const { ctx } = createAuthContext({ id: 1 });
      const caller = appRouter.createCaller(ctx);
