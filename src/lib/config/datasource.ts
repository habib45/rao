/**
 * Datasource configuration.
 * All queries route through the Express / MySQL API gateway.
 *
 * Secret handling:
 *   - `MYSQL_API_SECRET` is required in production. There is no default value
 *     so a misconfigured deploy cannot authenticate with a known string.
 *   - `MYSQL_API_JWT_TOKEN` is the JWT the gateway uses to identify this
 *     domain. It is server-only; never prefix with NEXT_PUBLIC_.
 */

export type DataSource = "mysql";

export const DATA_SOURCE: DataSource = "mysql";

/** Base URL of the Express API gateway */
export const MYSQL_API_URL: string =
  process.env.MYSQL_API_URL ?? "http://localhost:4000";

/** Read the API secret. Throws in production if it is missing. */
function readApiSecret(): string {
  const raw = process.env.MYSQL_API_SECRET;
  if (raw && raw.length > 0) return raw;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MYSQL_API_SECRET is not set. Refusing to start in production without an x-api-key.",
    );
  }

  // Dev fallback only — must never be used to authenticate in production.
  return "dev-only-mysql-api-secret";
}

/** API secret sent as x-api-key header to admin gateway endpoints */
export const MYSQL_API_SECRET: string = readApiSecret();

/** Read the JWT token. Throws in production if it is missing. */
function readApiJwtToken(): string {
  const raw = process.env.MYSQL_API_JWT_TOKEN;
  if (raw && raw.length > 0) return raw;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MYSQL_API_JWT_TOKEN is not set. Refusing to start in production without an upstream identity token.",
    );
  }

  // Dev fallback only — must never be used to authenticate in production.
  return "dev-only-mysql-api-jwt";
}

/**
 * JWT token for API gateway authentication (identity for authorized domains).
 * Server-only — never read from a NEXT_PUBLIC_-prefixed env var.
 */
export const MYSQL_API_JWT_TOKEN: string = readApiJwtToken();
