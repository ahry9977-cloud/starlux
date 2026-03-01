import {
  mysqlTable,
  serial,
  varchar,
  boolean,
  int,
  timestamp,
  text,
  double,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("passwordHash").notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  isVerified: boolean("isVerified").notNull().default(false),
  isBlocked: boolean("isBlocked").notNull().default(false),
  failedLoginAttempts: int("failedLoginAttempts").notNull().default(0),
  lockedUntil: timestamp("lockedUntil"),
  lastSignedIn: timestamp("lastSignedIn"),
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  profileImage: text("profileImage"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type User = typeof users.$inferSelect;

export const stores = mysqlTable("stores", {
  id: serial("id").primaryKey(),
  sellerId: int("sellerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  description: text("description"),
  logo: text("logo"),
  banner: text("banner"),
  isVerified: boolean("isVerified").notNull().default(false),
  isActive: boolean("isActive").notNull().default(true),
  rating: double("rating"),
  totalReviews: int("totalReviews").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const otpVerifications = mysqlTable("otpVerifications", {
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phoneNumber", { length: 50 }).notNull(),
  countryCode: varchar("countryCode", { length: 10 }),
  otp: varchar("otp", { length: 10 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  isUsed: boolean("isUsed").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const passwordResets = mysqlTable("passwordResets", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  otp: varchar("otp", { length: 10 }),
  isUsed: boolean("isUsed").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const roles = mysqlTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("displayName", { length: 150 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 16 }),
  icon: varchar("icon", { length: 64 }),
  priority: int("priority").notNull().default(0),
  isSystem: boolean("isSystem").notNull().default(false),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

export const permissions = mysqlTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("displayName", { length: 150 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  requiresApproval: boolean("requiresApproval").notNull().default(false),
  riskLevel: varchar("riskLevel", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

export const rolePermissions = mysqlTable("rolePermissions", {
  id: serial("id").primaryKey(),
  roleId: int("roleId").notNull(),
  permissionId: int("permissionId").notNull(),
  granted: boolean("granted").notNull().default(true),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

export const userRoles = mysqlTable("userRoles", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  roleId: int("roleId").notNull(),
  isPrimary: boolean("isPrimary").notNull().default(false),
  expiresAt: timestamp("expiresAt"),
  notes: text("notes"),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
});

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

export const userPermissions = mysqlTable("userPermissions", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  permissionId: int("permissionId").notNull(),
  granted: boolean("granted").notNull().default(true),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

export const roleAuditLogs = mysqlTable("roleAuditLogs", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  oldData: text("oldData"),
  newData: text("newData"),
  changedBy: int("changedBy"),
  ipAddress: varchar("ipAddress", { length: 50 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type InsertRoleAuditLog = typeof roleAuditLogs.$inferInsert;

export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }),
  message: text("message"),
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const notificationQueue = mysqlTable("notificationQueue", {
  id: serial("id").primaryKey(),
  notificationId: int("notificationId").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const notificationSettings = mysqlTable("notificationSettings", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const notificationLogs = mysqlTable("notificationLogs", {
  id: serial("id").primaryKey(),
  notificationId: int("notificationId"),
  status: varchar("status", { length: 50 }).notNull(),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const supportedCurrencies = mysqlTable("supportedCurrencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 100 }),
  symbol: varchar("symbol", { length: 10 }),
  isActive: boolean("isActive").notNull().default(true),
});

export const currencyConversions = mysqlTable("currencyConversions", {
  id: serial("id").primaryKey(),
  fromCode: varchar("fromCode", { length: 10 }).notNull(),
  toCode: varchar("toCode", { length: 10 }).notNull(),
  rate: double("rate").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const sellerWallet = mysqlTable(
  "sellerWallet",
  {
    id: serial("id").primaryKey(),
    sellerId: int("sellerId").notNull(),
    balance: double("balance").notNull().default(0),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    updatedAt: timestamp("updatedAt").defaultNow(),
  },
  (t) => ({
    sellerIdUnique: uniqueIndex("sellerWallet_sellerId_unique").on(t.sellerId),
  })
);

export const commissionLogs = mysqlTable("commissionLogs", {
  id: serial("id").primaryKey(),
  sellerId: int("sellerId"),
  amount: double("amount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const sellerWithdrawals = mysqlTable("sellerWithdrawals", {
  id: serial("id").primaryKey(),
  sellerId: int("sellerId").notNull(),
  amount: double("amount").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const platformCommissionRevenue = mysqlTable("platformCommissionRevenue", {
  id: serial("id").primaryKey(),
  amount: double("amount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  token: text("token"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow(),
});
