export const ENV = {
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  appId: process.env.APP_ID ?? "",
  appSecret: process.env.APP_SECRET ?? "",
  cookieSecret: process.env.COOKIE_SECRET ?? "dev_cookie_secret_change_me",
  databaseUrl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0
      ? process.env.DATABASE_URL
      : "",
};
