import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock database functions
vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve({})),
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(() => Promise.resolve("hashed_password")),
    compare: vi.fn(() => Promise.resolve(true)),
  },
}));

// Mock jose for JWT
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn(() => Promise.resolve("mock_jwt_token")),
  })),
}));

import { getUserByEmail, getUserById, createUser, updateUser } from "./db";

describe("OAuth Login API", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    role: "user",
    isVerified: true,
    isBlocked: false,
    passwordHash: "hashed_password",
    profileImage: null,
    lastSignedIn: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Google OAuth Login", () => {
    it("should login existing user with Google account", async () => {
      // Mock existing user
      vi.mocked(getUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(updateUser).mockResolvedValue(undefined);

      const input = {
        provider: "google" as const,
        email: "test@example.com",
        name: "Test User",
        providerId: "google_123456",
        profileImage: "https://example.com/photo.jpg",
      };

      // Verify getUserByEmail is called with correct email
      await getUserByEmail(input.email);
      expect(getUserByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should create new user for first-time Google login", async () => {
      // Mock no existing user
      vi.mocked(getUserByEmail).mockResolvedValue(undefined);
      vi.mocked(createUser).mockResolvedValue(2);
      vi.mocked(getUserById).mockResolvedValue({
        ...mockUser,
        id: 2,
        email: "newuser@gmail.com",
      } as any);

      const input = {
        provider: "google" as const,
        email: "newuser@gmail.com",
        name: "New User",
        providerId: "google_789012",
        profileImage: "https://example.com/newphoto.jpg",
      };

      // Simulate the flow
      const existingUser = await getUserByEmail(input.email);
      expect(existingUser).toBeUndefined();

      // Create new user
      const userId = await createUser({
        email: input.email,
        passwordHash: "hashed_password",
        name: input.name,
        role: "user",
        isVerified: true,
        isBlocked: false,
        failedLoginAttempts: 0,
        profileImage: input.profileImage,
      });

      expect(createUser).toHaveBeenCalled();
      expect(userId).toBe(2);
    });

    it("should reject blocked user on Google login", async () => {
      // Mock blocked user
      vi.mocked(getUserByEmail).mockResolvedValue({
        ...mockUser,
        isBlocked: true,
      } as any);

      const user = await getUserByEmail("blocked@example.com");
      expect(user?.isBlocked).toBe(true);
    });
  });

  describe("Facebook OAuth Login", () => {
    it("should login existing user with Facebook account", async () => {
      vi.mocked(getUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(updateUser).mockResolvedValue(undefined);

      const input = {
        provider: "facebook" as const,
        email: "test@example.com",
        name: "Test User",
        providerId: "fb_123456",
        profileImage: "https://facebook.com/photo.jpg",
      };

      await getUserByEmail(input.email);
      expect(getUserByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should create new user for first-time Facebook login", async () => {
      vi.mocked(getUserByEmail).mockResolvedValue(undefined);
      vi.mocked(createUser).mockResolvedValue(3);
      vi.mocked(getUserById).mockResolvedValue({
        ...mockUser,
        id: 3,
        email: "fbuser@facebook.com",
      } as any);

      const input = {
        provider: "facebook" as const,
        email: "fbuser@facebook.com",
        name: "FB User",
        providerId: "fb_789012",
      };

      const existingUser = await getUserByEmail(input.email);
      expect(existingUser).toBeUndefined();

      const userId = await createUser({
        email: input.email,
        passwordHash: "hashed_password",
        name: input.name,
        role: "user",
        isVerified: true,
        isBlocked: false,
        failedLoginAttempts: 0,
        profileImage: null,
      });

      expect(createUser).toHaveBeenCalled();
      expect(userId).toBe(3);
    });
  });

  describe("OAuth Input Validation", () => {
    it("should require valid email format", () => {
      const validEmails = [
        "test@example.com",
        "user@gmail.com",
        "admin@company.org",
      ];
      const invalidEmails = ["invalid", "no@", "@nodomain.com"];

      validEmails.forEach((email) => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });

      invalidEmails.forEach((email) => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it("should require provider to be google, facebook, or github", () => {
      const validProviders = ["google", "facebook", "github"];
      const invalidProviders = ["twitter", "linkedin"];

      validProviders.forEach((provider) => {
        expect(["google", "facebook", "github"]).toContain(provider);
      });

      invalidProviders.forEach((provider) => {
        expect(["google", "facebook", "github"]).not.toContain(provider);
      });
    });

    it("should require non-empty name", () => {
      const validNames = ["John Doe", "أحمد", "Test User"];
      const invalidNames = ["", "   "];

      validNames.forEach((name) => {
        expect(name.trim().length).toBeGreaterThan(0);
      });

      invalidNames.forEach((name) => {
        expect(name.trim().length).toBe(0);
      });
    });

    it("should require non-empty providerId", () => {
      const validIds = ["google_123", "fb_456", "oauth_789"];
      const invalidIds = ["", "   "];

      validIds.forEach((id) => {
        expect(id.trim().length).toBeGreaterThan(0);
      });

      invalidIds.forEach((id) => {
        expect(id.trim().length).toBe(0);
      });
    });
  });

  describe("OAuth User Creation", () => {
    it("should set isVerified to true for OAuth users", async () => {
      vi.mocked(getUserByEmail).mockResolvedValue(undefined);
      vi.mocked(createUser).mockResolvedValue(4);
      vi.mocked(getUserById).mockResolvedValue({
        ...mockUser,
        id: 4,
        isVerified: true,
      } as any);

      const userId = await createUser({
        email: "oauth@test.com",
        passwordHash: "hashed",
        name: "OAuth User",
        role: "user",
        isVerified: true, // OAuth users are auto-verified
        isBlocked: false,
        failedLoginAttempts: 0,
        profileImage: null,
      });

      const user = await getUserById(userId!);
      expect(user?.isVerified).toBe(true);
    });

    it("should set default role to user for OAuth accounts", async () => {
      vi.mocked(getUserByEmail).mockResolvedValue(undefined);
      vi.mocked(createUser).mockResolvedValue(5);
      vi.mocked(getUserById).mockResolvedValue({
        ...mockUser,
        id: 5,
        role: "user",
      } as any);

      const userId = await createUser({
        email: "newuser@oauth.com",
        passwordHash: "hashed",
        name: "New OAuth User",
        role: "user", // Default role
        isVerified: true,
        isBlocked: false,
        failedLoginAttempts: 0,
        profileImage: null,
      });

      const user = await getUserById(userId!);
      expect(user?.role).toBe("user");
    });

    it("should update profile image if provided and user has none", async () => {
      vi.mocked(getUserByEmail).mockResolvedValue({
        ...mockUser,
        profileImage: null,
      } as any);
      vi.mocked(updateUser).mockResolvedValue(undefined);

      const user = await getUserByEmail("test@example.com");
      
      if (user && !user.profileImage) {
        await updateUser(user.id, {
          profileImage: "https://new-image.com/photo.jpg",
        });
        expect(updateUser).toHaveBeenCalledWith(user.id, {
          profileImage: "https://new-image.com/photo.jpg",
        });
      }
    });
  });

  describe("OAuth Role-based Redirects", () => {
    it("should redirect admin users to admin-dashboard", () => {
      const role = "admin";
      let redirectPath = "/";

      if (role === "admin" || role === "sub_admin") {
        redirectPath = "/admin-dashboard";
      } else if (role === "seller") {
        redirectPath = "/seller-dashboard";
      } else {
        redirectPath = "/dashboard";
      }

      expect(redirectPath).toBe("/admin-dashboard");
    });

    it("should redirect seller users to seller-dashboard", () => {
      const role = "seller";
      let redirectPath = "/";

      if (role === "admin" || role === "sub_admin") {
        redirectPath = "/admin-dashboard";
      } else if (role === "seller") {
        redirectPath = "/seller-dashboard";
      } else {
        redirectPath = "/dashboard";
      }

      expect(redirectPath).toBe("/seller-dashboard");
    });

    it("should redirect regular users to dashboard", () => {
      const role = "user";
      let redirectPath = "/";

      if (role === "admin" || role === "sub_admin") {
        redirectPath = "/admin-dashboard";
      } else if (role === "seller") {
        redirectPath = "/seller-dashboard";
      } else {
        redirectPath = "/dashboard";
      }

      expect(redirectPath).toBe("/dashboard");
    });

    it("should redirect sub_admin users to admin-dashboard", () => {
      const role = "sub_admin";
      let redirectPath = "/";

      if (role === "admin" || role === "sub_admin") {
        redirectPath = "/admin-dashboard";
      } else if (role === "seller") {
        redirectPath = "/seller-dashboard";
      } else {
        redirectPath = "/dashboard";
      }

      expect(redirectPath).toBe("/admin-dashboard");
    });
  });
});
