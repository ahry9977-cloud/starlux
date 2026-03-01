import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { ENV } from "./env";
import { users, type User } from "./drizzle/schema";

let _pool: mysql.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (_db) return _db as any;

  const hasUrl = Boolean(ENV.databaseUrl && ENV.databaseUrl.length > 0);
  const hasParts = Boolean(ENV.dbHost && ENV.dbUser && ENV.dbName);

  if (!hasUrl && !hasParts) {
    return null as any;
  }

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

  _db = drizzle(_pool);
  return _db as any;
}

export const PLATFORM_COMMISSION_PERCENT = 2;
export const PLATFORM_COMMISSION_RATE = PLATFORM_COMMISSION_PERCENT / 100;

export async function getUserByEmail(_email: string) {
  const db = await getDb();
  if (!db) return null as any;

  const email = _email.toLowerCase().trim();
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return (result[0] ?? null) as any;
}

export async function getUserById(_id: number) {
  const db = await getDb();
  if (!db) return null as any;

  const result = await db.select().from(users).where(eq(users.id, _id)).limit(1);
  return (result[0] ?? null) as any;
}

export async function createUser(_data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const email = String(_data.email ?? "").toLowerCase().trim();
  const payload = {
    ..._data,
    email,
  };

  const result = await db.insert(users).values(payload);
  const insertId = (result as any).insertId ?? (Array.isArray(result) ? (result as any)[0] : undefined);
  return (insertId ?? 0) as any;
}

export async function updateUser(_id: number, _data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const patch = { ..._data, updatedAt: new Date() };
  await db.update(users).set(patch).where(eq(users.id, _id));
}

export async function updateUserLoginAttempts(_email: string, _attempts: number, _lockedUntil?: Date | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const email = _email.toLowerCase().trim();
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