import {
  pgTable,
  serial,
  varchar,
  boolean,
  integer,
  timestamp,
  text,
  doublePrecision,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("passwordhash").notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  isVerified: boolean("isverified").notNull().default(false),
  isBlocked: boolean("isblocked").notNull().default(false),
  failedLoginAttempts: integer("failedloginattempts").notNull().default(0),
  lockedUntil: timestamp("lockeduntil", { withTimezone: true }),
  lastSignedIn: timestamp("lastsignedin", { withTimezone: true }),
  phoneNumber: varchar("phonenumber", { length: 50 }),
  profileImage: text("profileimage"),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  sellerId: integer("sellerid").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  description: text("description"),
  logo: text("logo"),
  banner: text("banner"),
  isVerified: boolean("isverified").notNull().default(false),
  isActive: boolean("isactive").notNull().default(true),
  rating: doublePrecision("rating"),
  totalReviews: integer("totalreviews").default(0),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow(),
});

export const otpVerifications = pgTable("otpverifications", {
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phonenumber", { length: 50 }).notNull(),
  countryCode: varchar("countrycode", { length: 10 }),
  otp: varchar("otp", { length: 10 }).notNull(),
  expiresAt: timestamp("expiresat", { withTimezone: true }).notNull(),
  isUsed: boolean("isused").notNull().default(false),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const passwordResets = pgTable("passwordresets", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  otp: varchar("otp", { length: 10 }),
  isUsed: boolean("isused").notNull().default(false),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("displayname", { length: 150 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 16 }),
  icon: varchar("icon", { length: 64 }),
  priority: integer("priority").notNull().default(0),
  isSystem: boolean("issystem").notNull().default(false),
  isActive: boolean("isactive").notNull().default(true),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: varchar("displayname", { length: 150 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  requiresApproval: boolean("requiresapproval").notNull().default(false),
  riskLevel: varchar("risklevel", { length: 16 }),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

export const rolePermissions = pgTable("rolepermissions", {
  id: serial("id").primaryKey(),
  roleId: integer("roleid").notNull(),
  permissionId: integer("permissionid").notNull(),
  granted: boolean("granted").notNull().default(true),
  grantedAt: timestamp("grantedat", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

export const userRoles = pgTable("userroles", {
  id: serial("id").primaryKey(),
  userId: integer("userid").notNull(),
  roleId: integer("roleid").notNull(),
  isPrimary: boolean("isprimary").notNull().default(false),
  expiresAt: timestamp("expiresat", { withTimezone: true }),
  notes: text("notes"),
  grantedAt: timestamp("grantedat", { withTimezone: true }).defaultNow().notNull(),
});

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

export const userPermissions = pgTable("userpermissions", {
  id: serial("id").primaryKey(),
  userId: integer("userid").notNull(),
  permissionId: integer("permissionid").notNull(),
  granted: boolean("granted").notNull().default(true),
  grantedAt: timestamp("grantedat", { withTimezone: true }).defaultNow().notNull(),
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

export const roleAuditLogs = pgTable("roleauditlogs", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entitytype", { length: 50 }).notNull(),
  entityId: integer("entityid"),
  oldData: text("olddata"),
  newData: text("newdata"),
  changedBy: integer("changedby"),
  ipAddress: varchar("ipaddress", { length: 50 }),
  userAgent: text("useragent"),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export type InsertRoleAuditLog = typeof roleAuditLogs.$inferInsert;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userid").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }),
  message: text("message"),
  isRead: boolean("isread").notNull().default(false),
  readAt: timestamp("readat", { withTimezone: true }),
  isArchived: boolean("isarchived").notNull().default(false),
  data: text("data"),
  category: varchar("category", { length: 50 }),
  priority: varchar("priority", { length: 16 }),
  actionUrl: text("actionurl"),
  actionLabel: text("actionlabel"),
  expiresAt: timestamp("expiresat", { withTimezone: true }),
  emailSent: boolean("emailsent").notNull().default(false),
  emailSentAt: timestamp("emailsentat", { withTimezone: true }),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const notificationQueue = pgTable("notificationqueue", {
  id: serial("id").primaryKey(),
  notificationId: integer("notificationid").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const notificationSettings = pgTable("notificationsettings", {
  id: serial("id").primaryKey(),
  userId: integer("userid").notNull(),
  category: varchar("category", { length: 50 }),
  enabled: boolean("enabled").notNull().default(true),
  emailEnabled: boolean("emailenabled").notNull().default(true),
  emailOrders: boolean("emailorders").notNull().default(true),
  emailPayments: boolean("emailpayments").notNull().default(true),
  emailWallet: boolean("emailwallet").notNull().default(true),
  emailStore: boolean("emailstore").notNull().default(true),
  emailSubscription: boolean("emailsubscription").notNull().default(true),
  emailSystem: boolean("emailsystem").notNull().default(true),
  emailCommunication: boolean("emailcommunication").notNull().default(true),
  inAppEnabled: boolean("inappenabled").notNull().default(true),
  inAppSound: boolean("inappsound").notNull().default(true),
  pushEnabled: boolean("pushenabled").notNull().default(true),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const notificationLogs = pgTable("notificationlogs", {
  id: serial("id").primaryKey(),
  notificationId: integer("notificationid"),
  userId: integer("userid"),
  status: varchar("status", { length: 50 }).notNull(),
  error: text("error"),
  sentAt: timestamp("sentat", { withTimezone: true }),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const supportedCurrencies = pgTable("supportedcurrencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 100 }),
  symbol: varchar("symbol", { length: 10 }),
  exchangeRate: doublePrecision("exchangerate").notNull().default(1),
  isActive: boolean("isactive").notNull().default(true),
});

export const currencyConversions = pgTable("currencyconversions", {
  id: serial("id").primaryKey(),
  userId: integer("userid"),
  fromCurrency: varchar("fromcurrency", { length: 10 }).notNull(),
  toCurrency: varchar("tocurrency", { length: 10 }).notNull(),
  fromAmount: text("fromamount"),
  toAmount: text("toamount"),
  exchangeRate: text("exchangerate"),
  fee: text("fee"),
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const sellerWallet = pgTable(
  "sellerwallet",
  {
    id: serial("id").primaryKey(),
    sellerId: integer("sellerid").notNull(),
    balance: doublePrecision("balance").notNull().default(0),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    sellerIdUnique: uniqueIndex("sellerWallet_sellerId_unique").on(t.sellerId),
  })
);

export const commissionLogs = pgTable("commissionlogs", {
  id: serial("id").primaryKey(),
  sellerId: integer("sellerid"),
  amount: doublePrecision("amount").notNull().default(0),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const sellerWithdrawals = pgTable("sellerwithdrawals", {
  id: serial("id").primaryKey(),
  sellerId: integer("sellerid").notNull(),
  amount: doublePrecision("amount").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const platformCommissionRevenue = pgTable("platformcommissionrevenue", {
  id: serial("id").primaryKey(),
  amount: doublePrecision("amount").notNull().default(0),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userid").notNull(),
  token: text("token"),
  expiresAt: timestamp("expiresat", { withTimezone: true }),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const userDeviceTokens = pgTable(
  "userdevicetokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("userid").notNull(),
    token: text("token").notNull(),
    platform: varchar("platform", { length: 20 }),
    createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userTokenUnique: uniqueIndex("userDeviceTokens_user_token_unique").on(t.userId, t.token),
  })
);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameAr: varchar("namear", { length: 255 }).notNull(),
  nameEn: varchar("nameen", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 255 }),
  description: text("description"),
  parentId: integer("parentid"),
  isFeatured: boolean("isfeatured").notNull().default(false),
  isActive: boolean("isactive").notNull().default(true),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("storeid").notNull(),
  categoryId: integer("categoryid").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  stock: integer("stock").notNull().default(0),
  images: text("images"),
  video: text("video"),
  isActive: boolean("isactive").notNull().default(true),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyerid").notNull(),
  storeId: integer("storeid").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  totalAmount: doublePrecision("totalamount").notNull(),
  commission: doublePrecision("commission").notNull().default(0),
  sellerAmount: doublePrecision("selleramount").notNull().default(0),
  paymentMethod: varchar("paymentmethod", { length: 50 }).notNull(),
  paymentStatus: varchar("paymentstatus", { length: 50 }).notNull().default("pending"),
  shippingAddress: text("shippingaddress"),
  notes: text("notes"),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow(),
});

export const orderItems = pgTable("orderitems", {
  id: serial("id").primaryKey(),
  orderId: integer("orderid").notNull(),
  productId: integer("productid").notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  total: doublePrecision("total").notNull(),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const cartItems = pgTable(
  "cartitems",
  {
    id: serial("id").primaryKey(),
    userId: integer("userid").notNull(),
    productId: integer("productid").notNull(),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updatedat", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userProductUnique: uniqueIndex("cartItems_user_product_unique").on(t.userId, t.productId),
  })
);

export const sellerPaymentMethods = pgTable("sellerpaymentmethods", {
  id: serial("id").primaryKey(),
  storeId: integer("storeid").notNull(),
  methodType: varchar("methodtype", { length: 50 }).notNull(),
  accountDetails: text("accountdetails"),
  isActive: boolean("isactive").notNull().default(true),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("orderid").notNull(),
  buyerId: integer("buyerid").notNull(),
  sellerId: integer("sellerid"),
  storeId: integer("storeid").notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  amount: doublePrecision("amount").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  providerRef: varchar("providerref", { length: 255 }),
  createdAt: timestamp("createdat", { withTimezone: true }).defaultNow(),
});

export const productReviews = pgTable(
  "product_reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull(),
    userId: integer("user_id").notNull(),
    rating: doublePrecision("rating").notNull(),
    reviewText: text("review_text"),
    helpfulCount: integer("helpful_count").notNull().default(0),
    notHelpfulCount: integer("not_helpful_count").notNull().default(0),
    reportCount: integer("report_count").notNull().default(0),
    sellerResponse: text("seller_response"),
    sellerResponseAt: timestamp("seller_response_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userProductUnique: uniqueIndex("product_reviews_user_product_unique").on(t.userId, t.productId),
  })
);

export const reviewInteractions = pgTable(
  "review_interactions",
  {
    id: serial("id").primaryKey(),
    reviewId: integer("review_id").notNull(),
    userId: integer("user_id").notNull(),
    interactionType: varchar("interaction_type", { length: 20 }).notNull(),
    reportReason: varchar("report_reason", { length: 30 }),
    reportDetails: text("report_details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    interactionUnique: uniqueIndex("review_interactions_unique").on(t.reviewId, t.userId, t.interactionType),
  })
);

export const shares = pgTable("shares", {
  id: serial("id").primaryKey(),
  productId: integer("product_id"),
  storeId: integer("store_id"),
  userId: integer("user_id"),
  platform: varchar("platform", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const productViews = pgTable("product_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userSearchHistory = pgTable("user_search_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  query: varchar("query", { length: 500 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
