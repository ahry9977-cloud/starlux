import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { getDb } from "./db";

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

// In production, serve the built frontend from the same server
if (process.env.NODE_ENV === "production") {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const publicDir = path.resolve(__dirname, "dist", "public");

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
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL || process.env.MYSQL_URL);
  const hasDbParts = Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);

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
