export const ENV = {
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  appId: process.env.APP_ID ?? "",
  appSecret: process.env.APP_SECRET ?? "",
  cookieSecret: process.env.COOKIE_SECRET ?? "dev_cookie_secret_change_me",
  databaseUrl:
    (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0
      ? process.env.DATABASE_URL
      : "") ||
    (process.env.MYSQL_PUBLIC_URL && process.env.MYSQL_PUBLIC_URL.trim().length > 0
      ? process.env.MYSQL_PUBLIC_URL
      : "") ||
    (process.env.MYSQL_URL && process.env.MYSQL_URL.trim().length > 0
      ? process.env.MYSQL_URL
      : ""),
  dbHost: process.env.DB_HOST ?? process.env.MYSQLHOST ?? process.env.MYSQL_HOST ?? "",
  dbPort: process.env.DB_PORT
    ? Number(process.env.DB_PORT)
    : process.env.MYSQLPORT
      ? Number(process.env.MYSQLPORT)
      : 3306,
  dbUser: process.env.DB_USER ?? process.env.MYSQLUSER ?? process.env.MYSQL_USER ?? "",
  dbPassword:
    process.env.DB_PASSWORD ??
    process.env.MYSQLPASSWORD ??
    process.env.MYSQL_PASSWORD ??
    process.env.MYSQL_ROOT_PASSWORD ??
    "",
  dbName: process.env.DB_NAME ?? process.env.MYSQLDATABASE ?? process.env.MYSQL_DATABASE ?? "",
};
