import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { ENV } from "./env";
import { users, type User } from "./drizzle/schema";

let _pool: mysql.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: any | null = null;

export async function getDb() {
  if (_db) return _db as any;
  if (_sqlite) return {} as any;

  const hasUrl = Boolean(ENV.databaseUrl && ENV.databaseUrl.length > 0);
  const hasParts = Boolean(ENV.dbHost && ENV.dbUser && ENV.dbName);

  if (!hasUrl && !hasParts) {
    // Development fallback to SQLite if MySQL not configured
    if (process.env.NODE_ENV !== "production") {
      console.warn("[DB] MySQL not configured, falling back to SQLite for development");
      return await createSqliteDb();
    }
    return null as any;
  }

  try {
    _pool = hasUrl
      ? mysql.createPool(ENV.databaseUrl)
      : mysql.createPool({
          host: ENV.dbHost,
          port: ENV.dbPort,
          user: ENV.dbUser,
          password: ENV.dbPassword,
          database: ENV.dbName,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });

    // Probe connection early so we can fall back in development.
    await _pool.query("SELECT 1");

    _db = drizzle(_pool);
    return _db as any;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[DB] MySQL connection failed, falling back to SQLite for development", err);
      return await createSqliteDb();
    }
    throw err;
  }
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
  const payload = {
    ..._data,
    email,
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
  const result = await db.insert(users).values(payload);
  const insertId = (result as any).insertId ?? (Array.isArray(result) ? (result as any)[0] : undefined);
  return (insertId ?? 0) as any;
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
  return [] as any[];
}

export async function getProductsCount() {
  return 0;
}

export async function getAllCategories() {
  return [] as any[];
}

export async function getMainCategories() {
  return [] as any[];
}

export async function getFeaturedCategories() {
  return [] as any[];
}

export async function getSubcategories(_parentId: number) {
  return [] as any[];
}

export async function getCategoryById(_id: number) {
  return null as any;
}

export async function getCategoriesWithSubcategories() {
  return [] as any[];
}

export async function createCategory(_data: any) {
  return 0 as any;
}

export async function updateCategory(_id: number, _data: any) {
  return;
}

export async function deleteCategory(_id: number) {
  return;
}

export async function getAllOrders(_limit = 50, _offset = 0) {
  return [] as any[];
}

export async function getOrdersCount() {
  return 0;
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
  return [] as any[];
}

export async function searchStores(_query: string, _limit = 50) {
  return [] as any[];
}

export async function searchCategories(_query: string, _limit = 50) {
  return [] as any[];
}

export async function getProductByStringId(_stringId: string) {
  return null as any;
}

export async function getStoreById(_id: number) {
  return null as any;
}

export async function advancedProductSearch(_opts: any) {
  return { products: [], total: 0 } as any;
}

export async function getSellerStore(_sellerId: number) {
  return null as any;
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
  return [] as any[];
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
  return { items: [], total: 0 } as any;
}

export async function addToCart(_userId: number, _productId: number, _quantity: number) {
  return { success: true } as any;
}

export async function updateCartItem(_userId: number, _productId: number, _quantity: number) {
  return { success: true } as any;
}

export async function removeFromCart(_userId: number, _productId: number) {
  return { success: true } as any;
}

export async function clearCart(_userId: number) {
  return { success: true } as any;
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
  return false;
}

export async function createAuditLog(_data: any) {
  return 0 as any;
}

export async function getRatingByUserAndEntity(_userId: number, _entityType: string, _entityId: number) {
  return null as any;
}

export async function createRating(_data: any) {
  return 0 as any;
}

export async function updateRating(_id: number, _data: any) {
  return;
}

export async function deleteRating(_id: number) {
  return;
}

export async function getRatingById(_id: number) {
  return null as any;
}

export async function createReview(_data: any) {
  return 0 as any;
}

export async function getReviewByRatingId(_ratingId: number) {
  return null as any;
}

export async function getEntityRatings(
  _entityType: string,
  _entityId: number,
  _page = 1,
  _limit = 10,
  _sortBy: string = "newest"
) {
  return { ratings: [], total: 0 } as any;
}

export async function getRatingSummary(_entityType: string, _entityId: number) {
  return null as any;
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