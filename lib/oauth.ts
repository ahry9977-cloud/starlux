import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/login", async (req: Request, res: Response) => {
    const provider = (getQueryParam(req, "provider") ?? "").toLowerCase();
    const allowed = new Set(["google", "facebook", "github"]);
    const normalizedProvider = allowed.has(provider) ? provider : undefined;

    const base = String(ENV.oAuthServerUrl ?? "").trim().replace(/\/+$/, "");
    if (!base) {
      res.status(500).json({ error: "OAUTH_SERVER_URL is not configured" });
      return;
    }

    const proto = String((req.headers["x-forwarded-proto"] as any) ?? req.protocol ?? "http").split(",")[0].trim();
    const host = req.get("host");
    const callbackUrl = `${proto}://${host}/api/oauth/callback`;
    const state = Buffer.from(callbackUrl, "utf8").toString("base64url");

    const returnTo = getQueryParam(req, "returnTo");
    if (returnTo && returnTo.length > 0) {
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie("oauth_return_to", returnTo, { ...cookieOptions, maxAge: 10 * 60 * 1000 });
    }

    const url = new URL(base);
    url.searchParams.set("state", state);
    if (ENV.appId) url.searchParams.set("clientId", ENV.appId);
    if (normalizedProvider) url.searchParams.set("provider", normalizedProvider);
    res.redirect(302, url.toString());
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // For OAuth users, create with a temporary password
      const existingUser = await db.getUserByEmail(userInfo.email || `oauth-${userInfo.openId}@starlux.local`);
      if (!existingUser) {
        await db.createUser({
          email: userInfo.email || `oauth-${userInfo.openId}@starlux.local`,
          passwordHash: "", // OAuth users don't have passwords
          name: userInfo.name || null,
          role: "user",
          isVerified: true,
          isBlocked: false,
          failedLoginAttempts: 0,
          lastSignedIn: new Date(),
        });
      } else {
        await db.updateUser(existingUser.id, {
          lastSignedIn: new Date(),
        });
      }


      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      const returnToCookie = (req as any)?.cookies?.oauth_return_to;
      const returnToHeader = req.headers.cookie
        ? req.headers.cookie
            .split(";")
            .map((v) => v.trim())
            .find((v) => v.startsWith("oauth_return_to="))
        : undefined;
      const returnToValue =
        typeof returnToCookie === "string"
          ? returnToCookie
          : typeof returnToHeader === "string"
            ? decodeURIComponent(returnToHeader.split("=").slice(1).join("="))
            : "";
      if (returnToValue) {
        res.clearCookie("oauth_return_to", { ...cookieOptions, maxAge: -1 });
        res.redirect(302, returnToValue);
        return;
      }

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
