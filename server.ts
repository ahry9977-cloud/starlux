import "dotenv/config";
import express from "express";
import compression from "compression";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { getDb } from "./db";
import {
  createTokenPair,
  refreshAccessToken,
  verifyAccessToken,
} from "./auth-advanced";
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  updateUserLoginAttempts,
} from "./db";

const app = express();

async function bootstrapAdminFromEnv() {
  const emailRaw = process.env.ADMIN_EMAIL ?? "";
  const passwordRaw = process.env.ADMIN_PASSWORD ?? "";
  const shouldRun = emailRaw.trim().length > 0 && passwordRaw.trim().length > 0;
  if (!shouldRun) return;

  const email = emailRaw.toLowerCase().trim();
  const password = String(passwordRaw);

  await getDb();

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await getUserByEmail(email);

  if (!existing) {
    const userId = await createUser({
      email,
      passwordHash,
      name: "Admin",
      role: "admin",
      isVerified: true,
      isBlocked: false,
      failedLoginAttempts: 0,
      lastSignedIn: null,
    });
    console.log("[bootstrap-admin] created admin user", { email, userId });
    return;
  }

  await updateUser(existing.id, {
    passwordHash,
    role: "admin",
    isVerified: true,
    isBlocked: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
  console.log("[bootstrap-admin] updated admin user", { email, userId: existing.id });
}

if (process.env.NODE_ENV === "production") {
  // Required when running behind reverse proxies (Railway/Render/Nginx)
  // so req.protocol and x-forwarded-proto are handled correctly.
  app.set("trust proxy", 1);
}

function getCorsOrigins(): true | string[] {
  const raw = process.env.CORS_ORIGINS ?? "";
  const origins = raw
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

  if (origins.length === 0) return true;
  return origins;
}

app.use(
  cors({
    origin: getCorsOrigins(),
    credentials: true,
  })
);
app.use(compression());
app.use(express.json());

function isSocialBot(userAgentRaw: unknown): boolean {
  const ua = String(userAgentRaw ?? "").toLowerCase();
  if (!ua) return false;
  const needles = [
    "facebookexternalhit",
    "twitterbot",
    "whatsapp",
    "telegrambot",
    "slackbot",
    "discordbot",
    "linkedinbot",
    "embedly",
  ];
  return needles.some(n => ua.includes(n));
}

function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeParseImages(images: unknown): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images.filter(x => typeof x === "string") as string[];
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed.filter(x => typeof x === "string") as string[];
    } catch {
      return [];
    }
  }
  return [];
}

function renderOgHtml(opts: {
  title: string;
  description: string;
  image?: string;
  url: string;
  type: string;
}): string {
  const title = escapeHtml(opts.title);
  const description = escapeHtml(opts.description);
  const url = escapeHtml(opts.url);
  const type = escapeHtml(opts.type);
  const image = opts.image ? escapeHtml(opts.image) : "";

  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    ${image ? `<meta property="og:image" content="${image}" />` : ""}
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    ${image ? `<meta property="twitter:image" content="${image}" />` : ""}
  </head>
  <body>
    <noscript>${title}</noscript>
  </body>
</html>`;
}

// Serve the built frontend from the same server when available.
// On some hosts (e.g. Railway) NODE_ENV may not be set to "production".
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "dist", "public");
const hasBuiltFrontend = fs.existsSync(path.join(publicDir, "index.html"));

if (hasBuiltFrontend) {
  app.get("/product/:id", async (req, res, next) => {
    try {
      if (!isSocialBot(req.headers["user-agent"])) {
        return res.sendFile(path.join(publicDir, "index.html"));
      }

      const productId = Number(req.params.id);
      if (!Number.isFinite(productId) || productId <= 0) {
        return res.sendFile(path.join(publicDir, "index.html"));
      }

      const { getProductById } = await import("./db");
      const product = await getProductById(productId);
      if (!product) {
        return res.sendFile(path.join(publicDir, "index.html"));
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const url = `${baseUrl}/product/${productId}`;
      const imgs = safeParseImages((product as any)?.images);
      const image = imgs[0] || undefined;

      const title = String((product as any)?.title ?? "Product");
      const price = (product as any)?.price != null ? String((product as any).price) : "";
      const description = String((product as any)?.description ?? "").slice(0, 200) || (price ? `السعر: ${price}` : "منتج على STAR LUX");

      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.status(200).send(
        renderOgHtml({
          title,
          description,
          image,
          url,
          type: "product",
        })
      );
    } catch (err) {
      return next(err);
    }
  });

  app.get("/store/:id", async (req, res, next) => {
    try {
      if (!isSocialBot(req.headers["user-agent"])) {
        return res.sendFile(path.join(publicDir, "index.html"));
      }

      const storeId = Number(req.params.id);
      if (!Number.isFinite(storeId) || storeId <= 0) {
        return res.sendFile(path.join(publicDir, "index.html"));
      }

      const { getStoreById } = await import("./db");
      const store = await getStoreById(storeId);
      if (!store) {
        return res.sendFile(path.join(publicDir, "index.html"));
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const url = `${baseUrl}/store/${storeId}`;

      const title = String((store as any)?.name ?? "Store");
      const description = String((store as any)?.description ?? "").slice(0, 220) || "متجر على STAR LUX";
      const image = (store as any)?.logoUrl ? String((store as any).logoUrl) : undefined;

      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.status(200).send(
        renderOgHtml({
          title,
          description,
          image,
          url,
          type: "website",
        })
      );
    } catch (err) {
      return next(err);
    }
  });

  app.use(express.static(publicDir));
  app.get("/", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
  app.get("/admin-dashboard", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
  app.get("/seller-dashboard", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/ai-suggest", async (req, res) => {
  try {
    const q = String(req.query?.q ?? "").trim();
    if (!q || q.length < 2) return res.json({ ok: true, suggestions: [] });

    const db = await getDb();
    if (!db) return res.json({ ok: true, suggestions: [] });

    const { products } = await import("./drizzle/schema");
    const likeQ = `%${q}%`;

    const rows = (await db
      .select({ id: products.id, title: products.title })
      .from(products)
      .where(and(eq(products.isActive, true), like(products.title, likeQ)))
      .orderBy(desc(products.id))
      .limit(8)) as any[];

    const suggestions = rows.map((r: any) => ({ id: Number(r.id), title: String(r.title ?? "") }));
    return res.json({ ok: true, suggestions });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message ?? "Server error" });
  }
});

app.post("/api/ai-search", async (req, res) => {
  try {
    const query = String(req.body?.query ?? "").trim();
    if (!query) return res.status(400).json({ ok: false, message: "Missing query" });

    const { invokeLLM } = await import("./_core/llm");
    const { logSearchQuery } = await import("./db");

    // Best effort: try to extract filters via LLM, otherwise use heuristics.
    type Filters = {
      keywords?: string;
      categoryId?: number;
      minPrice?: number;
      maxPrice?: number;
    };

    const heuristic: Filters = (() => {
      const q = query.toLowerCase();
      const nums = q.match(/\d+(?:\.\d+)?/g)?.map((n) => Number(n)).filter((n) => Number.isFinite(n)) ?? [];
      const minPrice = nums.length >= 2 ? Math.min(nums[0], nums[1]) : undefined;
      const maxPrice = nums.length >= 2 ? Math.max(nums[0], nums[1]) : undefined;
      // Very lightweight keywords extraction
      const keywords = query.length > 3 ? query : undefined;
      return { keywords, minPrice, maxPrice };
    })();

    let filters: Filters = heuristic;
    try {
      const llm = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Convert the user search query to JSON filters for e-commerce product search. Output ONLY a JSON object with keys: keywords, minPrice, maxPrice, categoryId.",
          },
          { role: "user", content: query },
        ],
      });
      const content = String((llm as any)?.choices?.[0]?.message?.content ?? "").trim();
      if (content.startsWith("{")) {
        const parsed = JSON.parse(content);
        filters = {
          keywords: typeof parsed?.keywords === "string" ? parsed.keywords : heuristic.keywords,
          categoryId: Number.isFinite(Number(parsed?.categoryId)) ? Number(parsed.categoryId) : undefined,
          minPrice: Number.isFinite(Number(parsed?.minPrice)) ? Number(parsed.minPrice) : heuristic.minPrice,
          maxPrice: Number.isFinite(Number(parsed?.maxPrice)) ? Number(parsed.maxPrice) : heuristic.maxPrice,
        };
      }
    } catch {
      // ignore
    }

    await logSearchQuery(query, null);

    const db = await getDb();
    if (!db) {
      const { advancedProductSearch } = await import("./db");
      const result = await advancedProductSearch({
        query: filters.keywords ?? query,
        categoryId: filters.categoryId,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        limit: 60,
        offset: 0,
      });
      return res.json({ ok: true, filters, ...result });
    }

    const { products, orderItems, orders, productReviews } = await import("./drizzle/schema");
    const likeQ = `%${String(filters.keywords ?? query).trim()}%`;

    const whereParts: any[] = [sql`${products.isActive} = 1`];
    whereParts.push(sql`(${products.title} LIKE ${likeQ} OR ${products.description} LIKE ${likeQ})`);
    if (filters.categoryId) whereParts.push(sql`${products.categoryId} = ${Number(filters.categoryId)}`);
    if (filters.minPrice != null) whereParts.push(sql`${products.price} >= ${Number(filters.minPrice)}`);
    if (filters.maxPrice != null) whereParts.push(sql`${products.price} <= ${Number(filters.maxPrice)}`);
    const whereSql = whereParts.length === 1 ? whereParts[0] : sql`${sql.join(whereParts, sql` AND `)}`;

    const rankedRes = (await db.execute(sql`
      SELECT
        p.*,
        COALESCE(AVG(pr.rating), 0) AS avgRating,
        COALESCE(SUM(oi.quantity), 0) AS salesQty,
        ((p.title LIKE ${likeQ}) * 2 + (p.description LIKE ${likeQ})) AS relevance
      FROM ${products} p
      LEFT JOIN ${productReviews} pr ON pr.product_id = p.id
      LEFT JOIN ${orderItems} oi ON oi.productId = p.id
      LEFT JOIN ${orders} o ON o.id = oi.orderId
      WHERE ${whereSql}
      GROUP BY p.id
      ORDER BY relevance DESC, avgRating DESC, salesQty DESC, p.id DESC
      LIMIT 60
    `)) as any;

    const rankedRows = (rankedRes as any)?.[0] ?? (rankedRes as any);
    const productsRows = Array.isArray(rankedRows) ? rankedRows : [];

    let didYouMean: string | undefined;
    if (productsRows.length < 3 && query.length >= 3) {
      const token = String(query).trim().split(/\s+/)[0];
      const tokenLike = `%${token}%`;
      const suggestRes = (await db.execute(sql`
        SELECT p.title
        FROM ${products} p
        WHERE ${products.isActive} = 1 AND p.title LIKE ${tokenLike}
        ORDER BY ABS(CHAR_LENGTH(p.title) - ${query.length}) ASC, p.id DESC
        LIMIT 1
      `)) as any;
      const suggestRows = (suggestRes as any)?.[0] ?? (suggestRes as any);
      const title = Array.isArray(suggestRows) ? (suggestRows[0]?.title ?? "") : "";
      const normalized = String(title ?? "").trim();
      if (normalized && normalized.toLowerCase() !== query.toLowerCase()) {
        didYouMean = normalized;
      }
    }

    return res.json({ ok: true, filters, products: productsRows, total: productsRows.length, didYouMean });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message ?? "Server error" });
  }
});

app.get("/api/health/db", async (_req, res) => {
  const rawUrl = process.env.DATABASE_URL ?? "";
  const urlSource = process.env.DATABASE_URL ? "DATABASE_URL" : "none";
  const hasDatabaseUrl = Boolean(rawUrl);
  const hasDbParts = false;

  let urlInfo:
    | {
        source: string;
        user?: string;
        host?: string;
        port?: string;
        database?: string;
      }
    | undefined;

  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      urlInfo = {
        source: urlSource,
        user: u.username || undefined,
        host: u.hostname || undefined,
        port: u.port || undefined,
        database: u.pathname?.replace(/^\//, "") || undefined,
      };
    } catch {
      urlInfo = { source: urlSource };
    }
  }

  const start = Date.now();
  try {
    const db = await getDb();
    if (!db) {
      return res.status(503).json({
        ok: false,
        db: {
          configured: false,
          hasDatabaseUrl,
          hasDbParts,
          urlInfo,
        },
        durationMs: Date.now() - start,
      });
    }

    const durationMs = Date.now() - start;
    return res.json({
      ok: true,
      db: {
        configured: true,
        hasDatabaseUrl,
        hasDbParts,
        urlInfo,
      },
      durationMs,
    });
  } catch (err: any) {
    return res.status(503).json({
      ok: false,
      db: {
        configured: true,
        hasDatabaseUrl,
        hasDbParts,
        urlInfo,
      },
      durationMs: Date.now() - start,
      error: {
        name: err?.name,
        message: err?.message,
        code: err?.code,
      },
    });
  }
});

app.get("/api/rest/cart", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, message: "Missing bearer token" });

    const payload = await verifyAccessToken(token);
    const userId = Number((payload as any).userId);
    if (!Number.isFinite(userId)) return res.status(401).json({ ok: false, message: "Invalid token" });

    const { getUserCart } = await import("./db");
    const items = await getUserCart(userId);
    return res.json({ ok: true, items });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message ?? "Server error" });
  }
});

app.post("/api/rest/cart/add", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, message: "Missing bearer token" });

    const payload = await verifyAccessToken(token);
    const userId = Number((payload as any).userId);
    if (!Number.isFinite(userId)) return res.status(401).json({ ok: false, message: "Invalid token" });

    const productId = Number(req.body?.productId);
    const quantity = Number(req.body?.quantity ?? 1);
    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid productId" });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ ok: false, message: "Invalid quantity" });
    }

    const { addToCart } = await import("./db");
    const itemId = await addToCart(userId, productId, quantity);
    return res.json({ ok: true, itemId });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message ?? "Server error" });
  }
});

app.post("/api/rest/cart/checkout", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, message: "Missing bearer token" });

    const payload = await verifyAccessToken(token);
    const userId = Number((payload as any).userId);
    if (!Number.isFinite(userId)) return res.status(401).json({ ok: false, message: "Invalid token" });

    const paymentMethod = String(req.body?.paymentMethod ?? "").toLowerCase().trim();
    const allowed = new Set(["mastercard", "visa", "asia_pay", "zain_cash"]);
    if (!allowed.has(paymentMethod)) {
      return res.status(400).json({ ok: false, message: "Unsupported payment method" });
    }

    const shippingAddress = req.body?.shippingAddress;
    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({ ok: false, message: "Missing shippingAddress" });
    }

    const notes = req.body?.notes;

    const { getUserCart, clearCart, createTransaction, PLATFORM_COMMISSION_RATE } = await import("./db");
    const cart = await getUserCart(userId);
    if (!cart || cart.length === 0) {
      return res.status(400).json({ ok: false, message: "Cart is empty" });
    }

    const db = await getDb();
    if (!db) return res.status(503).json({ ok: false, message: "Database not available" });
    const { orders, orderItems, stores } = await import("./drizzle/schema");

    const subtotal = cart.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0);
    const commissionTotal = Math.round(subtotal * PLATFORM_COMMISSION_RATE * 100) / 100;

    const storeGroups = new Map<number, typeof cart>();
    for (const item of cart as any[]) {
      const storeId = Number((item as any).storeId ?? 1);
      if (!storeGroups.has(storeId)) storeGroups.set(storeId, [] as any);
      storeGroups.get(storeId)!.push(item);
    }

    const orderIds: number[] = [];
    for (const [storeId, items] of Array.from(storeGroups.entries())) {
      const orderTotal = items.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0);
      const orderCommission = Math.round(orderTotal * PLATFORM_COMMISSION_RATE * 100) / 100;
      const sellerAmount = orderTotal - orderCommission;

      const [orderResult] = await db.insert(orders).values({
        buyerId: userId,
        storeId,
        totalAmount: orderTotal,
        commission: orderCommission,
        sellerAmount,
        paymentMethod,
        paymentStatus: "pending",
        shippingAddress: JSON.stringify(shippingAddress),
        notes: notes ? String(notes) : null,
      } as any);
      const orderId = Number((orderResult as any).insertId ?? (orderResult as any));
      orderIds.push(orderId);

      for (const item of items) {
        await db.insert(orderItems).values({
          orderId,
          productId: Number(item.productId ?? item.productId ?? item.id),
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.price) * Number(item.quantity),
        } as any);
      }

      const [storeData] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
      const sellerId = Number((storeData as any)?.sellerId ?? 1);

      await db.execute(sql`
        INSERT INTO sellerWallet (sellerId, balance, currency, updatedAt)
        VALUES (${sellerId}, ${sellerAmount}, 'USD', NOW())
        ON DUPLICATE KEY UPDATE
          balance = balance + VALUES(balance),
          updatedAt = NOW()
      `);

      await createTransaction({
        orderId,
        buyerId: userId,
        sellerId,
        amount: orderTotal,
        paymentMethod,
      });
    }

    await clearCart(userId);

    return res.json({
      ok: true,
      orderIds,
      subtotal,
      commission: commissionTotal,
      commissionRate: PLATFORM_COMMISSION_RATE * 100,
      total: subtotal,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message ?? "Server error" });
  }
});

app.get("/api/rest/seller/payment-methods", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, message: "Missing bearer token" });

    const payload = await verifyAccessToken(token);
    const userId = Number((payload as any).userId);
    const role = String((payload as any).role ?? "");
    if (!Number.isFinite(userId)) return res.status(401).json({ ok: false, message: "Invalid token" });
    if (role !== "seller" && role !== "admin" && role !== "sub_admin") {
      return res.status(403).json({ ok: false, message: "Seller access required" });
    }

    const { getSellerStore, getSellerPaymentMethods } = await import("./db");
    const store = await getSellerStore(userId);
    if (!store) return res.json({ ok: true, methods: [] });
    const methods = await getSellerPaymentMethods(store.id);
    return res.json({ ok: true, methods });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message ?? "Server error" });
  }
});

app.post("/api/rest/seller/payment-methods", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, message: "Missing bearer token" });

    const payload = await verifyAccessToken(token);
    const userId = Number((payload as any).userId);
    const role = String((payload as any).role ?? "");
    if (!Number.isFinite(userId)) return res.status(401).json({ ok: false, message: "Invalid token" });
    if (role !== "seller" && role !== "admin" && role !== "sub_admin") {
      return res.status(403).json({ ok: false, message: "Seller access required" });
    }

    const methodType = String(req.body?.methodType ?? "").toLowerCase().trim();
    const accountDetails = String(req.body?.accountDetails ?? "").trim();
    if (methodType !== "sindipay") {
      return res.status(400).json({ ok: false, message: "Only sindipay is supported for seller" });
    }
    if (!accountDetails || accountDetails.length < 3) {
      return res.status(400).json({ ok: false, message: "Invalid accountDetails" });
    }

    const { getSellerStore, addSellerPaymentMethod } = await import("./db");
    const store = await getSellerStore(userId);
    if (!store) return res.status(400).json({ ok: false, message: "No store" });

    const methodId = await addSellerPaymentMethod(store.id, "sindipay", accountDetails);
    return res.json({ ok: true, methodId });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message ?? "Server error" });
  }
});

app.delete("/api/rest/seller/payment-methods/:id", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, message: "Missing bearer token" });

    const payload = await verifyAccessToken(token);
    const userId = Number((payload as any).userId);
    const role = String((payload as any).role ?? "");
    if (!Number.isFinite(userId)) return res.status(401).json({ ok: false, message: "Invalid token" });
    if (role !== "seller" && role !== "admin" && role !== "sub_admin") {
      return res.status(403).json({ ok: false, message: "Seller access required" });
    }

    const methodId = Number(req.params.id);
    if (!Number.isFinite(methodId)) return res.status(400).json({ ok: false, message: "Invalid id" });

    const { getSellerStore, removeSellerPaymentMethod } = await import("./db");
    const store = await getSellerStore(userId);
    if (!store) return res.status(400).json({ ok: false, message: "No store" });

    await removeSellerPaymentMethod(store.id, methodId);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message ?? "Server error" });
  }
});

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function getBearerToken(req: express.Request): string | null {
  const auth = req.header("authorization") ?? "";
  const [scheme, token] = auth.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer") return null;
  if (!token) return null;
  return token.trim();
}

app.post("/api/rest/auth/register", async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").toLowerCase().trim();
    const password = String(req.body?.password ?? "");
    const name = String(req.body?.name ?? "").trim();

    if (!email || !email.includes("@")) {
      return res.status(400).json({ ok: false, message: "Invalid email" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ ok: false, message: "Password too short" });
    }
    if (!name || name.length < 2) {
      return res.status(400).json({ ok: false, message: "Name too short" });
    }

    const db = await getDb();
    if (!db) return res.status(503).json({ ok: false, message: "Database not available" });

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ ok: false, message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await createUser({
      email,
      passwordHash,
      name,
      role: "user",
      isVerified: false,
      isBlocked: false,
      failedLoginAttempts: 0,
    });

    const user = await getUserById(Number(userId));
    if (!user) {
      return res.status(500).json({ ok: false, message: "User creation failed" });
    }

    const tokens = await createTokenPair(user as any);
    return res.json({ ok: true, user, tokens });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message ?? "Server error" });
  }
});

app.post("/api/rest/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").toLowerCase().trim();
    const password = String(req.body?.password ?? "");

    if (!email || !email.includes("@")) {
      return res.status(400).json({ ok: false, message: "Invalid email" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ ok: false, message: "Password too short" });
    }

    const db = await getDb();
    if (!db) return res.status(503).json({ ok: false, message: "Database not available" });

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ ok: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    if ((user as any).isBlocked) {
      return res.status(403).json({ ok: false, message: "الحساب محظور" });
    }

    if ((user as any).lockedUntil && new Date() < new Date((user as any).lockedUntil)) {
      return res.status(403).json({ ok: false, message: "الحساب مقفل مؤقتاً. يرجى المحاولة لاحقاً." });
    }

    const passwordMatch = await bcrypt.compare(password, (user as any).passwordHash);
    if (!passwordMatch) {
      const newAttempts = Number((user as any).failedLoginAttempts || 0) + 1;
      let lockedUntil: Date | undefined;
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }

      await updateUserLoginAttempts(email, newAttempts, lockedUntil);
      return res.status(401).json({ ok: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    await updateUserLoginAttempts(email, 0, undefined);
    await updateUser((user as any).id, { lastSignedIn: new Date() });

    const tokens = await createTokenPair(user as any);
    return res.json({ ok: true, user, tokens });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message ?? "Server error" });
  }
});

app.post("/api/rest/auth/refresh", async (req, res) => {
  try {
    const refreshToken = String(req.body?.refreshToken ?? "").trim();
    if (!refreshToken) {
      return res.status(400).json({ ok: false, message: "Missing refreshToken" });
    }
    const token = await refreshAccessToken(refreshToken);
    return res.json({ ok: true, token });
  } catch (err: any) {
    return res.status(401).json({ ok: false, message: err?.message ?? "Unauthorized" });
  }
});

app.post("/api/rest/auth/logout", async (_req, res) => {
  return res.json({ ok: true });
});

app.get("/api/rest/auth/me", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, message: "Missing bearer token" });

    const payload = await verifyAccessToken(token);
    const userId = Number((payload as any).userId);
    if (!Number.isFinite(userId)) {
      return res.status(401).json({ ok: false, message: "Invalid token" });
    }

    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ ok: false, message: "User not found" });

    return res.json({ ok: true, user });
  } catch (err: any) {
    return res.status(401).json({ ok: false, message: err?.message ?? "Unauthorized" });
  }
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

bootstrapAdminFromEnv().catch((err) => {
  console.error("[bootstrap-admin] failed", err);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`[server] listening on http://127.0.0.1:${port}`);
});
