import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
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
app.use(express.json());

// Serve the built frontend from the same server when available.
// On some hosts (e.g. Railway) NODE_ENV may not be set to "production".
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "dist", "public");
const hasBuiltFrontend = fs.existsSync(path.join(publicDir, "index.html"));

if (hasBuiltFrontend) {
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

app.get("/api/health/db", async (_req, res) => {
  const rawUrl = process.env.DATABASE_URL ?? process.env.MYSQL_URL ?? "";
  const urlSource = process.env.DATABASE_URL ? "DATABASE_URL" : process.env.MYSQL_URL ? "MYSQL_URL" : "none";
  const hasDatabaseUrl = Boolean(rawUrl);
  const hasDbParts = Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);

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

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`[server] listening on http://127.0.0.1:${port}`);
});
