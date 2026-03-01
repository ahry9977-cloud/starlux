export const ENV = {
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  appId: process.env.APP_ID ?? "",
  appSecret: process.env.APP_SECRET ?? "",
  cookieSecret: process.env.COOKIE_SECRET ?? "dev_cookie_secret_change_me",
  databaseUrl: process.env.DATABASE_URL ?? "",
  dbHost: process.env.DB_HOST ?? "",
  dbPort: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  dbUser: process.env.DB_USER ?? "",
  dbPassword: process.env.DB_PASSWORD ?? "",
  dbName: process.env.DB_NAME ?? "",
};
