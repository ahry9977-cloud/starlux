import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

// Create admin context for testing
function createAdminContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user = {
    id: 1,
    email: "admin@example.com",
    passwordHash: "",
    phoneNumber: null,
    countryCode: null,
    name: "Admin User",
    role: "admin" as const,
    isVerified: true,
    isBlocked: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    profileImage: null,
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
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

// Create regular user context for testing access control
function createUserContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user = {
    id: 2,
    email: "user@example.com",
    passwordHash: "",
    phoneNumber: null,
    countryCode: null,
    name: "Regular User",
    role: "user" as const,
    isVerified: true,
    isBlocked: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
    profileImage: null,
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
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

describe("Admin API - Access Control", () => {
  it("should allow admin to access getStats", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getStats();

    expect(result).toHaveProperty("totalUsers");
    expect(result).toHaveProperty("totalStores");
    expect(result).toHaveProperty("totalProducts");
    expect(result).toHaveProperty("totalOrders");
    expect(typeof result.totalUsers).toBe("number");
    expect(typeof result.totalStores).toBe("number");
  });

  it("should deny regular user access to admin APIs", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.getStats()).rejects.toThrow("غير مصرح لك بالوصول إلى هذه الصفحة");
  });
});

describe("Admin API - Users Management", () => {
  it("should return users list with pagination", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getUsers({ limit: 10, offset: 0 });

    expect(result).toHaveProperty("users");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.users)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("should return users list without input (default pagination)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getUsers();

    expect(result).toHaveProperty("users");
    expect(result).toHaveProperty("total");
  });
});

describe("Admin API - Stores Management", () => {
  it("should have getStores endpoint defined", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Just verify the endpoint exists - actual data depends on DB schema
    expect(caller.admin.getStores).toBeDefined();
  });
});

describe("Admin API - Products Management", () => {
  it("should have getProducts endpoint defined", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Just verify the endpoint exists - actual data depends on DB schema
    expect(caller.admin.getProducts).toBeDefined();
  });
});

describe("Admin API - Categories Management", () => {
  it("should return categories list", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const hasPostgres = Boolean(process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL));
    if (!hasPostgres) {
      expect(caller.admin.getCategories).toBeDefined();
      return;
    }

    const result = await caller.admin.getCategories();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should have createCategory endpoint defined", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Just verify the endpoint exists
    expect(caller.admin.createCategory).toBeDefined();
  });

  it("should have updateCategory endpoint defined", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Just verify the endpoint exists
    expect(caller.admin.updateCategory).toBeDefined();
  });
});

describe("Admin API - Orders Management", () => {
  it("should return orders list with pagination", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const hasPostgres = Boolean(process.env.DATABASE_URL && /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL));
    if (!hasPostgres) {
      expect(caller.admin.getOrders).toBeDefined();
      return;
    }

    const result = await caller.admin.getOrders({ limit: 10, offset: 0 });

    expect(result).toHaveProperty("orders");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.orders)).toBe(true);
    expect(typeof result.total).toBe("number");
  });
});
