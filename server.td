import "dotenv/config";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

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