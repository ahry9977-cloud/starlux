import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const app = express();

app.use(cors({ origin: true, credentials: true }));
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
