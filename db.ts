import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
import { ENV } from "./env";
import {
  cartItems,
  categories,
  chatConversations,
  chatMessages,
  productReviews,
  productViews,
  orderItems,
  orders,
  payments,
  products,
  roleAuditLogs,
  sellerPaymentMethods,
  shares,
  stores,
  userSearchHistory,
  users,
  type User,
} from "./drizzle/schema";

let _pgPool: PgPool | null = null;
let _db: ReturnType<typeof drizzlePg> | null = null;
let _sqlite: any | null = null;
let _pgSchemaEnsured = false;

function buildDefaultAvatarDataUrl(seedRaw: string): string {
  const seed = String(seedRaw ?? "").trim() || "U";
  const initials = seed
    .replace(/\s+/g, " ")
    .split(" ")
    .slice(0, 2)
    .map((p) => (p[0] ? p[0].toUpperCase() : ""))
    .join("")
    .slice(0, 2);

  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const bg = `hsl(${hue} 70% 45%)`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="20" fill="${bg}"/><text x="64" y="74" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-size="52" fill="#fff" font-weight="700">${(initials || "U").replace(/</g, "&lt;")}</text></svg>`;

  const b64 = Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}

export async function getDb() {
  if (_db) return _db as any;
  if (_sqlite) return {} as any;

  const hasUrl = Boolean(ENV.databaseUrl && ENV.databaseUrl.length > 0);
  const urlLooksLikePostgres = hasUrl ? /^postgres(ql)?:\/\//i.test(ENV.databaseUrl) : false;

  if (!hasUrl) {
    // Development fallback to SQLite if DB not configured
    if (process.env.NODE_ENV !== "production") {
      console.warn("[DB] DATABASE_URL not configured, falling back to SQLite for development");
      return await createSqliteDb();
    }
    return null as any;
  }

  if (!urlLooksLikePostgres) {
    throw new Error("DATABASE_URL must be a Postgres connection string (postgres:// or postgresql://)");
  }

  try {
    _pgPool = new PgPool({ connectionString: ENV.databaseUrl });
    await _pgPool.query("SELECT 1");
    await ensurePostgresSchema(_pgPool);
    _db = drizzlePg(_pgPool);
    return _db as any;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[DB] Postgres connection failed, falling back to SQLite for development", err);
      return await createSqliteDb();
    }
    throw err;
  }
}

async function ensurePostgresSchema(pg: PgPool) {
  if (_pgSchemaEnsured) return;

  const isProduction = process.env.NODE_ENV === "production";
  // Avoid unexpected schema mutations outside production unless explicitly allowed.
  const allowInit = isProduction || process.env.AUTO_INIT_DB === "1";
  if (!allowInit) return;

  const res = await pg.query(`SELECT to_regclass('public.users') AS users_table`);
  const exists = Boolean(res.rows?.[0]?.users_table);
  if (exists) {
    await applyPostgresMigrations(pg);
    _pgSchemaEnsured = true;
    return;
  }

  const initPath = path.join(process.cwd(), "docker", "postgres", "init.sql");
  let ddl = "";
  try {
    ddl = await fs.promises.readFile(initPath, "utf8");
  } catch (e) {
    throw new Error(
      `Postgres schema is missing (table users not found) and init.sql could not be read at ${initPath}. ` +
        `Set up the database schema before running the server.`
    );
  }

  await pg.query(ddl);
  await applyPostgresMigrations(pg);
  _pgSchemaEnsured = true;
}

async function applyPostgresMigrations(pg: PgPool) {
  // Notifications table expansion
  await pg.query(`ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS readAt TIMESTAMPTZ NULL`);
  await pg.query(`ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS isArchived BOOLEAN NOT NULL DEFAULT FALSE`);
  await pg.query(`ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS data TEXT NULL`);
  await pg.query(`ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50) NULL`);
  await pg.query(`ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(16) NULL`);
  await pg.query(`ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS actionUrl TEXT NULL`);
  await pg.query(`ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS actionLabel TEXT NULL`);
  await pg.query(`ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS expiresAt TIMESTAMPTZ NULL`);
  await pg.query(`ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS emailSent BOOLEAN NOT NULL DEFAULT FALSE`);
  await pg.query(`ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS emailSentAt TIMESTAMPTZ NULL`);

  // Notification settings expansion
  await pg.query(`ALTER TABLE IF EXISTS notificationSettings ADD COLUMN IF NOT EXISTS emailEnabled BOOLEAN NOT NULL DEFAULT TRUE`);
  await pg.query(`ALTER TABLE IF EXISTS notificationSettings ADD COLUMN IF NOT EXISTS emailOrders BOOLEAN NOT NULL DEFAULT TRUE`);
  await pg.query(`ALTER TABLE IF EXISTS notificationSettings ADD COLUMN IF NOT EXISTS emailPayments BOOLEAN NOT NULL DEFAULT TRUE`);
  await pg.query(`ALTER TABLE IF EXISTS notificationSettings ADD COLUMN IF NOT EXISTS emailWallet BOOLEAN NOT NULL DEFAULT TRUE`);
  await pg.query(`ALTER TABLE IF EXISTS notificationSettings ADD COLUMN IF NOT EXISTS emailStore BOOLEAN NOT NULL DEFAULT TRUE`);
  await pg.query(`ALTER TABLE IF EXISTS notificationSettings ADD COLUMN IF NOT EXISTS emailSubscription BOOLEAN NOT NULL DEFAULT TRUE`);
  await pg.query(`ALTER TABLE IF EXISTS notificationSettings ADD COLUMN IF NOT EXISTS emailSystem BOOLEAN NOT NULL DEFAULT TRUE`);
  await pg.query(`ALTER TABLE IF EXISTS notificationSettings ADD COLUMN IF NOT EXISTS emailCommunication BOOLEAN NOT NULL DEFAULT TRUE`);
  await pg.query(`ALTER TABLE IF EXISTS notificationSettings ADD COLUMN IF NOT EXISTS inAppEnabled BOOLEAN NOT NULL DEFAULT TRUE`);
  await pg.query(`ALTER TABLE IF EXISTS notificationSettings ADD COLUMN IF NOT EXISTS inAppSound BOOLEAN NOT NULL DEFAULT TRUE`);
  await pg.query(`ALTER TABLE IF EXISTS notificationSettings ADD COLUMN IF NOT EXISTS pushEnabled BOOLEAN NOT NULL DEFAULT TRUE`);

  // Default-on push notifications (user approved)
  await pg.query(`UPDATE notificationSettings SET pushEnabled = TRUE WHERE pushEnabled IS DISTINCT FROM TRUE`);

  // Notification logs expansion
  await pg.query(`ALTER TABLE IF EXISTS notificationLogs ADD COLUMN IF NOT EXISTS userId INTEGER NULL`);
  await pg.query(`ALTER TABLE IF EXISTS notificationLogs ADD COLUMN IF NOT EXISTS sentAt TIMESTAMPTZ NULL`);

  // Currency tables expansion
  await pg.query(`ALTER TABLE IF EXISTS supportedCurrencies ADD COLUMN IF NOT EXISTS exchangeRate DOUBLE PRECISION NOT NULL DEFAULT 1`);

  // currencyConversions: support both old and new layouts
  await pg.query(`ALTER TABLE IF EXISTS currencyConversions ADD COLUMN IF NOT EXISTS userId INTEGER NULL`);
  await pg.query(`ALTER TABLE IF EXISTS currencyConversions ADD COLUMN IF NOT EXISTS fromCurrency VARCHAR(10) NULL`);
  await pg.query(`ALTER TABLE IF EXISTS currencyConversions ADD COLUMN IF NOT EXISTS toCurrency VARCHAR(10) NULL`);
  await pg.query(`ALTER TABLE IF EXISTS currencyConversions ADD COLUMN IF NOT EXISTS fromAmount TEXT NULL`);
  await pg.query(`ALTER TABLE IF EXISTS currencyConversions ADD COLUMN IF NOT EXISTS toAmount TEXT NULL`);
  await pg.query(`ALTER TABLE IF EXISTS currencyConversions ADD COLUMN IF NOT EXISTS exchangeRate TEXT NULL`);
  await pg.query(`ALTER TABLE IF EXISTS currencyConversions ADD COLUMN IF NOT EXISTS fee TEXT NULL`);
  await pg.query(`ALTER TABLE IF EXISTS currencyConversions ADD COLUMN IF NOT EXISTS createdAt TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP`);

  // Helpful indexes (safe if tables exist)
  await pg.query(`CREATE INDEX IF NOT EXISTS notifications_userid_createdat_idx ON notifications(userId, createdAt DESC)`);
  await pg.query(`CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications(userId, isRead) WHERE isRead = FALSE`);

  // Push notifications device tokens
  await pg.query(`
    CREATE TABLE IF NOT EXISTS userDeviceTokens (
      id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      userId INTEGER NOT NULL,
      token TEXT NOT NULL,
      platform VARCHAR(20) NULL,
      createdAt TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pg.query(`CREATE UNIQUE INDEX IF NOT EXISTS userDeviceTokens_user_token_unique ON userDeviceTokens(userId, token)`);
}

async function createSqliteDb() {
  const Database = await import("better-sqlite3");
  const sqlite = new Database.default("./dev.db");
  _sqlite = sqlite;
  await ensureSqliteTables(sqlite);
  return {} as any;
}

async function ensureSqliteTables(sqlite: any) {
  // Minimal tables needed for auth smoke test
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      isVerified INTEGER NOT NULL DEFAULT 0,
      isBlocked INTEGER NOT NULL DEFAULT 0,
      failedLoginAttempts INTEGER NOT NULL DEFAULT 0,
      lockedUntil TEXT,
      lastSignedIn TEXT,
      phoneNumber TEXT,
      profileImage TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export const PLATFORM_COMMISSION_PERCENT = 2;
export const PLATFORM_COMMISSION_RATE = PLATFORM_COMMISSION_PERCENT / 100;

export const SHARE_PLATFORMS = ["whatsapp", "telegram", "facebook", "twitter", "copy_link"] as const;
export type SharePlatform = (typeof SHARE_PLATFORMS)[number];

export async function getUserByEmail(_email: string) {
  const email = _email.toLowerCase().trim();
  if (_sqlite) {
    const row = _sqlite
      .prepare(
        "SELECT id, email, passwordHash, name, role, isVerified, isBlocked, failedLoginAttempts, lockedUntil, lastSignedIn, phoneNumber, profileImage, createdAt, updatedAt FROM users WHERE email = ? LIMIT 1"
      )
      .get(email);
    return (row ?? null) as any;
  }

  const db = await getDb();
  if (!db) return null as any;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return (result[0] ?? null) as any;
}

export async function getUserById(_id: number) {
  if (_sqlite) {
    const row = _sqlite
      .prepare(
        "SELECT id, email, passwordHash, name, role, isVerified, isBlocked, failedLoginAttempts, lockedUntil, lastSignedIn, phoneNumber, profileImage, createdAt, updatedAt FROM users WHERE id = ? LIMIT 1"
      )
      .get(_id);
    return (row ?? null) as any;
  }

  const db = await getDb();
  if (!db) return null as any;
  const result = await db.select().from(users).where(eq(users.id, _id)).limit(1);
  return (result[0] ?? null) as any;
}

export async function createUser(_data: any) {
  const email = String(_data.email ?? "").toLowerCase().trim();
  const profileImage =
    _data.profileImage != null && String(_data.profileImage).trim().length > 0
      ? String(_data.profileImage)
      : buildDefaultAvatarDataUrl(String(_data.name ?? email));
  const payload = {
    ..._data,
    email,
    profileImage,
  };

  if (_sqlite) {
    const nowIso = new Date().toISOString();
    const stmt = _sqlite.prepare(
      "INSERT INTO users (email, passwordHash, name, role, isVerified, isBlocked, failedLoginAttempts, lockedUntil, lastSignedIn, phoneNumber, profileImage, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const info = stmt.run(
      payload.email ?? null,
      payload.passwordHash ?? "",
      payload.name ?? null,
      payload.role ?? "user",
      payload.isVerified ? 1 : 0,
      payload.isBlocked ? 1 : 0,
      Number(payload.failedLoginAttempts ?? 0),
      payload.lockedUntil ? String(payload.lockedUntil) : null,
      payload.lastSignedIn ? String(payload.lastSignedIn) : null,
      payload.phoneNumber ?? null,
      payload.profileImage ?? null,
      nowIso,
      nowIso
    );
    return (info.lastInsertRowid ?? 0) as any;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db.insert(users).values(payload).returning({ id: users.id });
  const id = (inserted as any)?.[0]?.id;
  return Number(id ?? 0) as any;
}

export async function createChatConversation(_userId?: number | null) {
  if (_sqlite) return 0 as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db
    .insert(chatConversations)
    .values({
      userId: _userId != null ? Number(_userId) : null,
    } as any)
    .returning({ id: chatConversations.id });
  const id = Number((inserted as any)?.[0]?.id ?? 0);
  return id as any;
}

export async function appendChatMessage(_conversationId: number, _role: "system" | "user" | "assistant", _content: string) {
  if (_sqlite) return;
  const content = String(_content ?? "");
  if (!content.trim()) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values({
    conversationId: Number(_conversationId),
    role: _role,
    content,
  } as any);
  await db.update(chatConversations).set({ updatedAt: new Date() } as any).where(eq(chatConversations.id, Number(_conversationId)));
}

export async function getChatMessages(_conversationId: number, _limit = 20) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select({ role: chatMessages.role, content: chatMessages.content, createdAt: chatMessages.createdAt })
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, Number(_conversationId)))
    .orderBy(desc(chatMessages.id))
    .limit(Number(_limit))) as any;
}

export async function updateUser(_id: number, _data: any) {
  if (_sqlite) {
    const patch = { ..._data, updatedAt: new Date().toISOString() };
    const fields: string[] = [];
    const values: any[] = [];
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
    if (fields.length === 0) return;
    values.push(_id);
    _sqlite.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const patch = { ..._data, updatedAt: new Date() };
  await db.update(users).set(patch).where(eq(users.id, _id));
}

export async function updateUserLoginAttempts(_email: string, _attempts: number, _lockedUntil?: Date | null) {
  const email = _email.toLowerCase().trim();
  if (_sqlite) {
    _sqlite
      .prepare(
        "UPDATE users SET failedLoginAttempts = ?, lockedUntil = ?, updatedAt = ? WHERE email = ?"
      )
      .run(
        _attempts,
        _lockedUntil ? _lockedUntil.toISOString() : null,
        new Date().toISOString(),
        email
      );
    return;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(users)
    .set({
      failedLoginAttempts: _attempts,
      lockedUntil: _lockedUntil ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.email, email));
}

export async function getPasswordResetByEmail(_email: string) {
  return null as any;
}

export async function createPasswordReset(_data: any) {
  return 0 as any;
}

export async function markPasswordResetAsUsed(_id: number) {
  return;
}

export async function getAllUsers(_limit = 50, _offset = 0) {
  return [] as any[];
}

export async function getUsersCount() {
  return 0;
}

export async function getAllStores(_limit = 50, _offset = 0) {
  return [] as any[];
}

export async function getStoresCount() {
  return 0;
}

export async function getAllProducts(_limit = 50, _offset = 0) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.id))
    .limit(_limit)
    .offset(_offset)) as any;
}

export async function getProductsCount() {
  if (_sqlite) return 0;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = (await db.select({ c: (db as any).fn.count() }).from(products)) as any[];
  return Number(rows?.[0]?.c ?? 0);
}

export async function getAllCategories() {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(desc(categories.id))) as any;
}

export async function getCategoryById(_id: number) {
  if (_sqlite) return null as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = (await db.select().from(categories).where(eq(categories.id, Number(_id))).limit(1)) as any[];
  return (rows[0] ?? null) as any;
}

export async function getMainCategories() {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select()
    .from(categories)
    .where(and(eq(categories.isActive, true), eq(categories.parentId, null as any)))
    .orderBy(desc(categories.id))) as any;
}

export async function getFeaturedCategories() {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select()
    .from(categories)
    .where(and(eq(categories.isActive, true), eq(categories.isFeatured, true)))
    .orderBy(desc(categories.id))
    .limit(12)) as any;
}

export async function getSubcategories(_parentId: number) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select()
    .from(categories)
    .where(and(eq(categories.isActive, true), eq(categories.parentId, _parentId)))
    .orderBy(desc(categories.id))) as any;
}

export async function getCategoriesWithSubcategories() {
  const mains = await getMainCategories();
  const enriched = [] as any[];
  for (const c of mains as any[]) {
    const subs = await getSubcategories(Number((c as any).id));
    enriched.push({ ...c, subcategories: subs });
  }
  return enriched as any;
}

export async function createCategory(_data: any) {
  if (_sqlite) return 0 as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db
    .insert(categories)
    .values({
    nameAr: _data.nameAr,
    nameEn: _data.nameEn,
    icon: _data.icon ?? null,
    description: _data.description ?? null,
    parentId: _data.parentId ?? null,
    isFeatured: Boolean(_data.isFeatured ?? false),
    isActive: Boolean(_data.isActive ?? true),
    } as any)
    .returning({ id: categories.id });
  const id = Number((inserted as any)?.[0]?.id ?? 0);
  return id as any;
}

export async function updateCategory(_id: number, _data: any) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set({ ..._data, updatedAt: new Date() } as any).where(eq(categories.id, _id));
}

export async function deleteCategory(_id: number) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set({ isActive: false, updatedAt: new Date() } as any).where(eq(categories.id, _id));
}

export async function getAllOrders(_limit = 50, _offset = 0) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select()
    .from(orders)
    .orderBy(desc(orders.id))
    .limit(_limit)
    .offset(_offset)) as any;
}

export async function getOrdersCount() {
  if (_sqlite) return 0;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = (await db.select({ c: (db as any).fn.count() }).from(orders)) as any[];
  return Number(rows?.[0]?.c ?? 0);
}

export async function getAdminStats() {
  return {
    totalUsers: 0,
    totalStores: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  } as any;
}

export async function searchProductsByQuery(_query: string, _limit = 50) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const raw = String(_query ?? "").trim();
  if (!raw) return [] as any;

  const likeQ = `%${raw}%`;
  const tsQuery = raw
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/[':]/g, ""))
    .join(" & ");

  try {
    const res = (await db.execute(sql`
      SELECT p.*,
        ts_rank(
          to_tsvector('simple', coalesce(p.title,'') || ' ' || coalesce(p.description,'')),
          to_tsquery('simple', ${tsQuery})
        ) AS rank
      FROM products p
      WHERE p.isactive = TRUE
        AND to_tsvector('simple', coalesce(p.title,'') || ' ' || coalesce(p.description,'')) @@ to_tsquery('simple', ${tsQuery})
      ORDER BY rank DESC, p.id DESC
      LIMIT ${Number(_limit)}
    `)) as any;

    const rows = (res as any)?.[0] ?? (res as any);
    if (Array.isArray(rows) && rows.length > 0) return rows as any;
  } catch {
    // fallback to LIKE below
  }

  return (await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), or(like(products.title, likeQ), like(products.description, likeQ))))
    .orderBy(desc(products.id))
    .limit(_limit)) as any;
}

export async function searchStores(_query: string, _limit = 50) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const raw = String(_query ?? "").trim();
  if (!raw) return [] as any;

  const likeQ = `%${raw}%`;
  const tsQuery = raw
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/[':]/g, ""))
    .join(" & ");

  try {
    const res = (await db.execute(sql`
      SELECT s.*,
        ts_rank(
          to_tsvector('simple', coalesce(s.name,'') || ' ' || coalesce(s.category,'') || ' ' || coalesce(s.description,'')),
          to_tsquery('simple', ${tsQuery})
        ) AS rank
      FROM stores s
      WHERE s.isactive = TRUE
        AND to_tsvector('simple', coalesce(s.name,'') || ' ' || coalesce(s.category,'') || ' ' || coalesce(s.description,'')) @@ to_tsquery('simple', ${tsQuery})
      ORDER BY rank DESC, s.id DESC
      LIMIT ${Number(_limit)}
    `)) as any;
    const rows = (res as any)?.[0] ?? (res as any);
    if (Array.isArray(rows) && rows.length > 0) return rows as any;
  } catch {
    // fallback
  }

  return (await db
    .select()
    .from(stores)
    .where(and(eq(stores.isActive, true), or(like(stores.name, likeQ), like(stores.category, likeQ), like(stores.description, likeQ))))
    .orderBy(desc(stores.id))
    .limit(_limit)) as any;
}

export async function searchCategories(_query: string, _limit = 50) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const raw = String(_query ?? "").trim();
  if (!raw) return [] as any;

  const likeQ = `%${raw}%`;
  const tsQuery = raw
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/[':]/g, ""))
    .join(" & ");

  try {
    const res = (await db.execute(sql`
      SELECT c.*,
        ts_rank(
          to_tsvector('simple', coalesce(c.namear,'') || ' ' || coalesce(c.nameen,'') || ' ' || coalesce(c.description,'')),
          to_tsquery('simple', ${tsQuery})
        ) AS rank
      FROM categories c
      WHERE c.isactive = TRUE
        AND to_tsvector('simple', coalesce(c.namear,'') || ' ' || coalesce(c.nameen,'') || ' ' || coalesce(c.description,'')) @@ to_tsquery('simple', ${tsQuery})
      ORDER BY rank DESC, c.id DESC
      LIMIT ${Number(_limit)}
    `)) as any;
    const rows = (res as any)?.[0] ?? (res as any);
    if (Array.isArray(rows) && rows.length > 0) return rows as any;
  } catch {
    // fallback
  }

  return (await db
    .select()
    .from(categories)
    .where(and(eq(categories.isActive, true), or(like(categories.nameAr, likeQ), like(categories.nameEn, likeQ), like(categories.description, likeQ))))
    .orderBy(desc(categories.id))
    .limit(_limit)) as any;
}

export async function getProductByStringId(_stringId: string) {
  return null as any;
}

export async function getProductById(_id: number) {
  if (_sqlite) return null as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = (await db.select().from(products).where(eq(products.id, _id)).limit(1)) as any[];
  return (rows[0] ?? null) as any;
}

export async function logProductView(_productId: number, _userId?: number | null) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) return;
  await db.insert(productViews).values({
    productId: Number(_productId),
    userId: _userId != null ? Number(_userId) : null,
  } as any);
}

export async function logSearchQuery(_query: string, _userId?: number | null) {
  if (_sqlite) return;
  const q = String(_query ?? "").trim();
  if (!q) return;
  const db = await getDb();
  if (!db) return;
  await db.insert(userSearchHistory).values({
    userId: _userId != null ? Number(_userId) : null,
    query: q,
  } as any);
}

export async function trackShare(_data: { productId?: number; storeId?: number; userId?: number | null; platform: SharePlatform }) {
  if (_sqlite) return 0 as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db
    .insert(shares)
    .values({
      productId: _data.productId != null ? Number(_data.productId) : null,
      storeId: _data.storeId != null ? Number(_data.storeId) : null,
      userId: _data.userId != null ? Number(_data.userId) : null,
      platform: _data.platform,
    } as any)
    .returning({ id: shares.id });
  const id = Number((inserted as any)?.[0]?.id ?? 0);
  return id as any;
}

export async function createDirectBuyOrder(_data: {
  buyerId: number;
  productId: number;
  quantity: number;
  paymentMethod: string;
  shippingAddress?: any;
}) {
  if (_sqlite) throw new Error("Direct buy not supported on sqlite dev stub");
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const product = await getProductById(Number(_data.productId));
  if (!product) throw new Error("Product not found");
  const qty = Math.max(1, Number(_data.quantity ?? 1));
  const unitPrice = Number(product.price ?? 0);
  const total = Math.round(unitPrice * qty * 100) / 100;
  const commission = Math.round(total * PLATFORM_COMMISSION_RATE * 100) / 100;
  const sellerAmount = total - commission;

  const storeId = Number(product.storeId ?? 0);
  const [storeData] = (await db.select().from(stores).where(eq(stores.id, storeId)).limit(1)) as any[];
  const sellerId = Number(storeData?.sellerId ?? 0);

  const orderInserted = await db
    .insert(orders)
    .values({
      buyerId: Number(_data.buyerId),
      storeId,
      status: "pending",
      totalAmount: total,
      commission,
      sellerAmount,
      paymentMethod: String(_data.paymentMethod ?? "visa"),
      paymentStatus: "pending",
      shippingAddress: _data.shippingAddress ? JSON.stringify(_data.shippingAddress) : null,
      notes: null,
    } as any)
    .returning({ id: orders.id });

  const orderId = Number((orderInserted as any)?.[0]?.id ?? 0);
  if (!orderId) throw new Error("Failed to create order");

  await db.insert(orderItems).values({
    orderId,
    productId: Number(_data.productId),
    quantity: qty,
    price: unitPrice,
    total,
  } as any);

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
    buyerId: Number(_data.buyerId),
    sellerId,
    amount: total,
    paymentMethod: String(_data.paymentMethod ?? "visa"),
  });

  return { orderId, total };
}

export async function getTrendingProducts(_limit = 12) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = (await db.execute(sql`
    SELECT p.*,
      COALESCE(v.viewCount, 0) AS viewCount,
      COALESCE(o.purchaseCount, 0) AS purchaseCount
    FROM products p
    LEFT JOIN (
      SELECT product_id AS productId, COUNT(*) AS viewCount
      FROM product_views
      WHERE created_at >= (NOW() - INTERVAL '7 days')
      GROUP BY product_id
    ) v ON v.productId = p.id
    LEFT JOIN (
      SELECT oi.productid AS productId, COUNT(*) AS purchaseCount
      FROM orderitems oi
      GROUP BY oi.productid
    ) o ON o.productId = p.id
    WHERE p.isActive = TRUE
    ORDER BY (COALESCE(o.purchaseCount,0) * 3 + COALESCE(v.viewCount,0)) DESC, p.id DESC
    LIMIT ${Number(_limit)}
  `)) as any;
  return (res as any)?.[0] ?? (res as any);
}

export async function getSimilarProducts(_productId: number, _limit = 8) {
  const product = await getProductById(Number(_productId));
  if (!product) return [] as any[];
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.categoryId, Number(product.categoryId)), sql`${products.id} <> ${Number(_productId)}`))
    .orderBy(desc(products.id))
    .limit(Number(_limit))) as any;
}

export async function getRecommendedProductsForUser(_userId: number, _limit = 12) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const res = (await db.execute(sql`
    SELECT p.*
    FROM products p
    WHERE p.isActive = TRUE
      AND p.categoryId IN (
        SELECT categoryId FROM (
          SELECT pr.categoryId AS categoryId
          FROM product_views pv
          INNER JOIN products pr ON pr.id = pv.product_id
          WHERE pv.user_id = ${Number(_userId)}
          ORDER BY pv.created_at DESC
          LIMIT 20
        ) t
      )
    ORDER BY p.id DESC
    LIMIT ${Number(_limit)}
  `)) as any;

  const rows = (res as any)?.[0] ?? (res as any);
  if (Array.isArray(rows) && rows.length > 0) return rows;
  return await getTrendingProducts(_limit);
}

export async function getProductsByCategoryId(_categoryId: number) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.categoryId, _categoryId)))
    .orderBy(desc(products.id))) as any;
}

export async function createProduct(_data: any) {
  if (_sqlite) return 0 as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db.insert(products).values({
    storeId: _data.storeId,
    categoryId: _data.categoryId,
    title: _data.title,
    description: _data.description ?? null,
    price: Number(_data.price ?? 0),
    stock: Number(_data.stock ?? 0),
    images: Array.isArray(_data.images) ? JSON.stringify(_data.images) : _data.images ?? null,
    video: _data.video ?? null,
    isActive: _data.isActive ?? true,
  }).returning({ id: products.id });
  const id = (inserted as any)?.[0]?.id;
  return Number(id ?? 0) as any;
}

export async function updateProduct(_id: number, _storeId: number, _data: any) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const patch: any = { ..._data, updatedAt: new Date() };
  if (patch.images && Array.isArray(patch.images)) patch.images = JSON.stringify(patch.images);
  await db
    .update(products)
    .set(patch)
    .where(and(eq(products.id, _id), eq(products.storeId, _storeId)));
}

export async function deleteProduct(_id: number, _storeId: number) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() } as any)
    .where(and(eq(products.id, _id), eq(products.storeId, _storeId)));
}

export async function getStoreById(_id: number) {
  if (_sqlite) return null as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.select().from(stores).where(eq(stores.id, _id));
  return res[0] ?? null;
}

export async function getStoreProductsPublic(_storeId: number, _limit = 50, _offset = 0) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.storeId, Number(_storeId))))
    .orderBy(desc(products.id))
    .limit(Number(_limit))
    .offset(Number(_offset))) as any;
}

export async function getTopSharedProducts(_limit = 10) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = (await db.execute(sql`
    SELECT s.product_id AS productId, COUNT(*) AS shareCount
    FROM shares s
    WHERE s.product_id IS NOT NULL
    GROUP BY s.product_id
    ORDER BY shareCount DESC
    LIMIT ${Number(_limit)}
  `)) as any;
  const rows = (res as any)?.[0] ?? (res as any);
  if (!Array.isArray(rows) || rows.length === 0) return [] as any[];

  const ids = rows.map((r: any) => Number(r.productId)).filter((n: number) => Number.isFinite(n));
  if (ids.length === 0) return [] as any[];

  const productsRows = (await db
    .select()
    .from(products)
    .where(sql`${products.id} IN (${ids.join(",")})`)) as any[];
  const byId = new Map<number, any>(productsRows.map((p: any) => [Number(p.id), p]));

  return rows
    .map((r: any) => ({ product: byId.get(Number(r.productId)) ?? null, shareCount: Number(r.shareCount ?? 0) }))
    .filter((x: any) => x.product);
}

export async function hasSellerStore(sellerId: number): Promise<boolean> {
  if (_sqlite) return false;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.select({ id: stores.id }).from(stores).where(eq(stores.sellerId, sellerId)).limit(1);
  return res.length > 0;
}

export async function advancedProductSearch(_opts: any) {
  const { query, categoryId, minPrice, maxPrice, limit = 20, offset = 0 } = _opts ?? {};
  if (_sqlite) return { products: [], total: 0 } as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const qRaw = query != null ? String(query).trim() : "";
  if (qRaw) {
    const tsQuery = qRaw
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => t.replace(/[':]/g, ""))
      .join(" & ");
    const likeQ = `%${qRaw}%`;

    const whereParts: any[] = [sql`p.isactive = TRUE`];
    whereParts.push(sql`to_tsvector('simple', coalesce(p.title,'') || ' ' || coalesce(p.description,'')) @@ to_tsquery('simple', ${tsQuery})`);
    if (categoryId) whereParts.push(sql`p.categoryid = ${Number(categoryId)}`);
    if (minPrice != null) whereParts.push(sql`p.price >= ${Number(minPrice)}`);
    if (maxPrice != null) whereParts.push(sql`p.price <= ${Number(maxPrice)}`);
    const whereSql = whereParts.length === 1 ? whereParts[0] : sql`${sql.join(whereParts, sql` AND `)}`;

    try {
      const res = (await db.execute(sql`
        SELECT p.*,
          ts_rank(
            to_tsvector('simple', coalesce(p.title,'') || ' ' || coalesce(p.description,'')),
            to_tsquery('simple', ${tsQuery})
          ) AS rank
        FROM products p
        WHERE ${whereSql}
        ORDER BY rank DESC, p.id DESC
        LIMIT ${Number(limit)}
        OFFSET ${Number(offset)}
      `)) as any;
      const rows = (res as any)?.[0] ?? (res as any);
      const list = Array.isArray(rows) ? rows : [];
      if (list.length > 0) return { products: list, total: list.length } as any;
    } catch {
      // Fallback to LIKE-based search below
      const clauses: any[] = [eq(products.isActive, true)];
      clauses.push(or(like(products.title, likeQ), like(products.description, likeQ)));
      if (categoryId) clauses.push(eq(products.categoryId, Number(categoryId)));
      if (minPrice != null) clauses.push(gte(products.price, Number(minPrice)));
      if (maxPrice != null) clauses.push(lte(products.price, Number(maxPrice)));
      const where = clauses.length === 1 ? clauses[0] : and(...clauses);
      const rows2 = (await db.select().from(products).where(where).orderBy(desc(products.id)).limit(limit).offset(offset)) as any[];
      return { products: rows2, total: rows2.length } as any;
    }
  }

  const clauses: any[] = [eq(products.isActive, true)];
  if (query && String(query).trim().length > 0) {
    const q = `%${String(query).trim()}%`;
    clauses.push(or(like(products.title, q), like(products.description, q)));
  }
  if (categoryId) clauses.push(eq(products.categoryId, Number(categoryId)));
  if (minPrice != null) clauses.push(gte(products.price, Number(minPrice)));
  if (maxPrice != null) clauses.push(lte(products.price, Number(maxPrice)));

  const where = clauses.length === 1 ? clauses[0] : and(...clauses);
  const rows = (await db.select().from(products).where(where).orderBy(desc(products.id)).limit(limit).offset(offset)) as any[];
  return { products: rows, total: rows.length } as any;
}

export async function getSellerStore(_sellerId: number) {
  if (_sqlite) return null as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = (await db.select().from(stores).where(eq(stores.sellerId, _sellerId)).limit(1)) as any[];
  return (rows[0] ?? null) as any;
}

export async function getSellerStats(_storeId: number) {
  return {
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalReviews: 0,
    averageRating: 0,
  } as any;
}

export async function getSellerProducts(_storeId: number, _limit = 50, _offset = 0) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select()
    .from(products)
    .where(eq(products.storeId, _storeId))
    .orderBy(desc(products.id))
    .limit(_limit)
    .offset(_offset)) as any;
}

export async function getUsersWithFilters(_filters: any) {
  return { users: [], total: 0 } as any;
}

export async function getOrdersWithFilters(_filters: any) {
  return { orders: [], total: 0 } as any;
}

export async function getProductsWithFilters(_filters: any) {
  return { products: [], total: 0 } as any;
}

export async function getStoresWithFilters(_filters: any) {
  return { stores: [], total: 0 } as any;
}

export async function getUserCart(_userId: number) {
  if (_sqlite) return [] as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const items = (await db
    .select({
      itemId: cartItems.id,
      userId: cartItems.userId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      title: products.title,
      price: products.price,
      images: products.images,
      storeId: products.storeId,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, _userId))) as any[];
  return items as any;
}

export async function addToCart(_userId: number, _productId: number, _quantity: number) {
  if (_sqlite) return 0 as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const qty = Math.max(1, Number(_quantity ?? 1));
  await db.execute(sql`
    INSERT INTO cartitems (userid, productid, quantity, createdat, updatedat)
    VALUES (${_userId}, ${_productId}, ${qty}, NOW(), NOW())
    ON CONFLICT (userid, productid)
    DO UPDATE SET
      quantity = cartitems.quantity + EXCLUDED.quantity,
      updatedat = NOW()
  `);
  const rows = (await db
    .select({ id: cartItems.id })
    .from(cartItems)
    .where(and(eq(cartItems.userId, _userId), eq(cartItems.productId, _productId)))
    .limit(1)) as any[];
  return (rows?.[0]?.id ?? 0) as any;
}

export async function updateCartItemQuantity(_userId: number, _itemId: number, _quantity: number) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const qty = Math.max(1, Number(_quantity ?? 1));
  await db.update(cartItems).set({ quantity: qty, updatedAt: new Date() } as any).where(and(eq(cartItems.id, _itemId), eq(cartItems.userId, _userId)));
}

export async function removeFromCart(_userId: number, _itemId: number) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(and(eq(cartItems.id, _itemId), eq(cartItems.userId, _userId)));
}

export async function clearCart(_userId: number) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.userId, _userId));
}

export async function createStore(_data: any) {
  if (_sqlite) return 0 as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db
    .insert(stores)
    .values({
      sellerId: _data.sellerId,
      name: _data.name,
      description: _data.description ?? null,
      category: _data.category,
      isVerified: Boolean(_data.isVerified ?? false),
      isActive: Boolean(_data.isActive ?? true),
    } as any)
    .returning({ id: stores.id });
  const id = Number((inserted as any)?.[0]?.id ?? 0);
  return id as any;
}

export async function updateStore(_storeId: number, _data: any) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(stores).set({ ..._data, updatedAt: new Date() } as any).where(eq(stores.id, _storeId));
}

export async function getSellerOrders(_storeId: number, _status?: string, _limit = 50, _offset = 0) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const where = _status ? and(eq(orders.storeId, _storeId), eq(orders.status, _status as any)) : eq(orders.storeId, _storeId);
  return (await db.select().from(orders).where(where as any).orderBy(desc(orders.id)).limit(_limit).offset(_offset)) as any;
}

export async function updateOrderStatus(_orderId: number, _storeId: number, _status: string) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(orders)
    .set({ status: _status as any, updatedAt: new Date() } as any)
    .where(and(eq(orders.id, _orderId), eq(orders.storeId, _storeId)));
}

export async function getSellerPaymentMethods(_storeId: number) {
  if (_sqlite) return [] as any[];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db
    .select()
    .from(sellerPaymentMethods)
    .where(and(eq(sellerPaymentMethods.storeId, _storeId), eq(sellerPaymentMethods.isActive, true)))
    .orderBy(desc(sellerPaymentMethods.id))) as any;
}

export async function addSellerPaymentMethod(_storeId: number, _methodType: string, _accountDetails: string) {
  if (_sqlite) return 0 as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db
    .insert(sellerPaymentMethods)
    .values({
      storeId: _storeId,
      methodType: _methodType,
      accountDetails: _accountDetails,
      isActive: true,
    } as any)
    .returning({ id: sellerPaymentMethods.id });
  const id = Number((inserted as any)?.[0]?.id ?? 0);
  return id as any;
}

export async function removeSellerPaymentMethod(_storeId: number, _methodId: number) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(sellerPaymentMethods)
    .set({ isActive: false } as any)
    .where(and(eq(sellerPaymentMethods.id, _methodId), eq(sellerPaymentMethods.storeId, _storeId)));
}

export async function createTransaction(_data: any) {
  if (_sqlite) return 0 as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const orderRow = (await db.select().from(orders).where(eq(orders.id, _data.orderId)).limit(1)) as any[];
  const storeId = orderRow?.[0]?.storeId;
  const inserted = await db
    .insert(payments)
    .values({
      orderId: _data.orderId,
      buyerId: _data.buyerId,
      sellerId: _data.sellerId ?? null,
      storeId: Number(storeId ?? 0),
      method: _data.paymentMethod,
      amount: Number(_data.amount ?? 0),
      status: "pending",
      providerRef: null,
    } as any)
    .returning({ id: payments.id });
  const id = Number((inserted as any)?.[0]?.id ?? 0);
  return id as any;
}

export async function addRating(_data: any) {
  return 0 as any;
}

export async function getProductRatings(_productId: number) {
  return [] as any[];
}

export async function getProductReviews(_productId: number, _limit = 20, _offset = 0) {
  return { reviews: [], total: 0 } as any;
}

export async function checkVerifiedPurchase(_orderId: number, _userId: number) {
  if (_sqlite) return false;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { orderItems } = await import("./drizzle/schema");
  const rows = (await db
    .select({ id: orders.id })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.id, Number(_orderId)), eq(orders.buyerId, Number(_userId))))
    .limit(1)) as any[];
  return rows.length > 0;
}

export async function createAuditLog(_data: any) {
  if (_sqlite) return 0 as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db
    .insert(roleAuditLogs)
    .values({
      action: String(_data.action ?? ""),
      entityType: String(_data.entityType ?? ""),
      entityId: _data.entityId ?? null,
      oldData:
        _data.oldValue != null
          ? JSON.stringify(_data.oldValue)
          : _data.oldData != null
            ? JSON.stringify(_data.oldData)
            : null,
      newData:
        _data.newValue != null
          ? JSON.stringify(_data.newValue)
          : _data.newData != null
            ? JSON.stringify(_data.newData)
            : null,
      changedBy: _data.userId ?? _data.changedBy ?? null,
      ipAddress: _data.ipAddress ?? null,
      userAgent: _data.userAgent ?? null,
    } as any)
    .returning({ id: roleAuditLogs.id });
  const id = Number((inserted as any)?.[0]?.id ?? 0);
  return id as any;
}

export async function searchProducts(_opts: any) {
  const { query, categoryId, minPrice, maxPrice, limit = 20, offset = 0 } = _opts ?? {};
  const productsResult = await advancedProductSearch({ query, categoryId, minPrice, maxPrice, limit, offset });
  return productsResult as any;
}

export async function getRatingByUserAndEntity(_userId: number, _entityType: string, _entityId: number) {
  if (_entityType !== "product") return null as any;
  if (_sqlite) return null as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = (await db
    .select({
      id: productReviews.id,
      userId: productReviews.userId,
      entityType: sql`'product'`,
      entityId: productReviews.productId,
      rating: productReviews.rating,
      createdAt: productReviews.createdAt,
    })
    .from(productReviews)
    .where(and(eq(productReviews.userId, Number(_userId)), eq(productReviews.productId, Number(_entityId))))
    .limit(1)) as any[];
  return (rows[0] ?? null) as any;
}

export async function createRating(_data: any) {
  if (String(_data?.entityType) !== "product") return 0 as any;
  if (_sqlite) return 0 as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db
    .insert(productReviews)
    .values({
      productId: Number(_data.entityId),
      userId: Number(_data.userId),
      rating: Number(_data.rating),
      reviewText: null,
    } as any)
    .returning({ id: productReviews.id });
  const id = Number((inserted as any)?.[0]?.id ?? 0);
  return id as any;
}

export async function updateRating(_id: number, _data: any) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productReviews).set({ rating: Number(_data?.rating) } as any).where(eq(productReviews.id, Number(_id)));
}

export async function deleteRating(_id: number) {
  if (_sqlite) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productReviews).where(eq(productReviews.id, Number(_id)));
}

export async function getRatingById(_id: number) {
  if (_sqlite) return null as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = (await db.select().from(productReviews).where(eq(productReviews.id, Number(_id))).limit(1)) as any[];
  const row = rows[0];
  if (!row) return null as any;
  return {
    id: row.id,
    userId: row.userId,
    entityType: "product",
    entityId: row.productId,
    rating: row.rating,
    createdAt: row.createdAt,
  } as any;
}

export async function createReview(_data: any) {
  if (_sqlite) return 0 as any;
  const ratingId = Number(_data?.ratingId);
  if (!Number.isFinite(ratingId) || ratingId <= 0) return 0 as any;
  const content = String(_data?.content ?? "").trim();
  if (!content) return 0 as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productReviews).set({ reviewText: content } as any).where(eq(productReviews.id, ratingId));
  return ratingId as any;
}

export async function getReviewByRatingId(_ratingId: number) {
  if (_sqlite) return null as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = (await db
    .select({ id: productReviews.id, reviewText: productReviews.reviewText })
    .from(productReviews)
    .where(eq(productReviews.id, Number(_ratingId)))
    .limit(1)) as any[];
  const row = rows?.[0];
  if (!row?.reviewText) return null as any;
  return { id: row.id, content: row.reviewText } as any;
}

export async function getEntityRatings(
  _entityType: string,
  _entityId: number,
  _page = 1,
  _limit = 10,
  _sortBy: string = "newest"
) {
  if (_entityType !== "product") return { ratings: [], total: 0 } as any;
  if (_sqlite) return { ratings: [], total: 0 } as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const limit = Math.max(1, Number(_limit ?? 10));
  const page = Math.max(1, Number(_page ?? 1));
  const offset = (page - 1) * limit;

  const orderBy = (() => {
    switch (_sortBy) {
      case "highest":
        return desc(productReviews.rating);
      case "lowest":
        return productReviews.rating;
      case "oldest":
        return productReviews.createdAt;
      case "helpful":
        return desc(productReviews.createdAt);
      case "newest":
      default:
        return desc(productReviews.createdAt);
    }
  })();

  const [rows, countRows] = await Promise.all([
    db
      .select({
        rating: {
          id: productReviews.id,
          rating: productReviews.rating,
          createdAt: productReviews.createdAt,
          isVerifiedPurchase: sql`FALSE`,
        },
        userName: users.name,
        userImage: users.profileImage,
        reviewContent: productReviews.reviewText,
      })
      .from(productReviews)
      .leftJoin(users, eq(users.id, productReviews.userId))
      .where(eq(productReviews.productId, Number(_entityId)))
      .orderBy(orderBy as any)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(productReviews)
      .where(eq(productReviews.productId, Number(_entityId))),
  ]);

  return {
    ratings: rows as any,
    total: Number((countRows as any)?.[0]?.count ?? 0),
  } as any;
}

export async function getRatingSummary(_entityType: string, _entityId: number) {
  if (_entityType !== "product") return null as any;
  if (_sqlite) return null as any;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = (await db.execute(sql`
    SELECT
      COUNT(*) AS totalRatings,
      COALESCE(AVG(rating), 0) AS averageRating,
      SUM(CASE WHEN rating >= 4.5 THEN 1 ELSE 0 END) AS count5Stars,
      SUM(CASE WHEN rating >= 3.5 AND rating < 4.5 THEN 1 ELSE 0 END) AS count4Stars,
      SUM(CASE WHEN rating >= 2.5 AND rating < 3.5 THEN 1 ELSE 0 END) AS count3Stars,
      SUM(CASE WHEN rating >= 1.5 AND rating < 2.5 THEN 1 ELSE 0 END) AS count2Stars,
      SUM(CASE WHEN rating < 1.5 THEN 1 ELSE 0 END) AS count1Star,
      0 AS verifiedPurchases
    FROM product_reviews
    WHERE product_id = ${Number(_entityId)}
  `)) as any;
  const r = ((rows as any)?.[0]?.[0] ?? (rows as any)?.[0]) as any;
  if (!r) return null as any;
  return {
    totalRatings: Number(r.totalRatings ?? 0),
    averageRating: String(Number(r.averageRating ?? 0)),
    count5Stars: Number(r.count5Stars ?? 0),
    count4Stars: Number(r.count4Stars ?? 0),
    count3Stars: Number(r.count3Stars ?? 0),
    count2Stars: Number(r.count2Stars ?? 0),
    count1Star: Number(r.count1Star ?? 0),
    verifiedPurchases: 0,
  } as any;
}

export async function updateRatingSummaryForEntity(_entityType: string, _entityId: number) {
  return;
}

export async function createReviewInteraction(_data: any) {
  return 0 as any;
}

export async function getExistingInteraction(_reviewId: number, _userId: number, _interactionType: string) {
  return null as any;
}

export async function updateReviewHelpfulCount(_reviewId: number, _increment = 1) {
  return;
}

export async function updateReviewNotHelpfulCount(_reviewId: number, _increment = 1) {
  return;
}

export async function updateReviewReportCount(_reviewId: number, _increment = 1) {
  return;
}

export async function addSellerResponse(_reviewId: number, _response: string) {
  return;
}