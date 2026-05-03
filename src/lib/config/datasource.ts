/**
 * Datasource configuration.
 * Set DATA_SOURCE=mysql in .env to route all queries through the local
 * Express / MySQL API gateway instead of Supabase directly.
 */

export type DataSource = "supabase" | "mysql";

export const DATA_SOURCE: DataSource =
  (process.env.DATA_SOURCE as DataSource) ?? "supabase";

/** Base URL of the Express API gateway (used only when DATA_SOURCE=mysql) */
export const MYSQL_API_URL: string =
  process.env.MYSQL_API_URL ?? "http://localhost:4000";

/** API secret sent as x-api-key header to admin gateway endpoints */
export const MYSQL_API_SECRET: string =
  process.env.MYSQL_API_SECRET ?? "change-me-in-production";
