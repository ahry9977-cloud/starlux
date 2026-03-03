---
description: Hosting & Production Setup
---

# Production/Hosting Setup

This repo can be hosted as a **single server** (Express serves the built Vite frontend from `dist/public`) or as **separate frontend + backend**.

## 1) Build

```bash
npm install
npm run build
```

This builds the frontend into:

- `dist/public`

## 2) Run (production)

```bash
# make sure NODE_ENV=production is set by your host
npm run start
```

The server listens on:

- `PORT` (defaults to `3000`)

## 3) Required environment variables

### Auth

- `COOKIE_SECRET` (required in production)
- `APP_ID` (optional; defaults to empty)

### Database (production)

Use MySQL in production (recommended). Provide either:

- `DATABASE_URL` (mysql connection URL)

or the parts:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

> In development, if MySQL is not reachable, the server falls back to a local SQLite file `dev.db`.

### CORS (when frontend is separate)

If you deploy frontend separately (e.g. Vercel) you MUST set allowed origins:

- `CORS_ORIGINS` = comma-separated list of allowed origins

Example:

- `CORS_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com`

## 4) Frontend talking to backend (separate deployment)

If frontend is NOT served by the same backend domain, set in the frontend build:

- `VITE_API_BASE_URL=https://your-backend-domain.com`

If not set, the frontend defaults to same-origin (`/api/trpc`).

## 5) Notes

- The backend enables `trust proxy` in production for correct cookie security behind reverse proxies.
- OAuth requires `OAUTH_SERVER_URL`. If you are not using OAuth, you can ignore that warning.

## 6) Railway deployment

### Recommended setup (single service)

This repository can be deployed as a single Railway service (backend serves frontend from `dist/public`).

### Steps

1. Create a new Railway project.
2. Add a **MySQL** database in Railway (Plugin).
3. Connect this repo to the project (Deploy from GitHub).
4. Railway will use `nixpacks.toml` to:
   - install: `npm ci`
   - build: `npm run build:prod`
   - start: `npm run start`

### Railway environment variables

Set these in Railway Variables:

- `NODE_ENV=production`
- `COOKIE_SECRET` (set a strong random value)
- `DATABASE_URL` (Railway MySQL plugin will provide this; ensure it is exposed to the service)

Optional:

- `CORS_ORIGINS=https://YOUR-RAILWAY-DOMAIN.up.railway.app` (if you serve frontend from same domain, you can omit)
- `APP_ID=star_lux`
- `OAUTH_SERVER_URL=...` (only if using OAuth)

### Cookie / HTTPS note

In production the app relies on `x-forwarded-proto` from Railway to set secure cookies correctly.
