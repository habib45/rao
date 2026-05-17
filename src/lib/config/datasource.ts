/**
 * Datasource configuration.
 * All queries route through the Express / MySQL API gateway.
 */

export type DataSource = "mysql";

export const DATA_SOURCE: DataSource = "mysql";

/** Base URL of the Express API gateway */
export const MYSQL_API_URL: string =
  process.env.MYSQL_API_URL ?? "http://localhost:4000";

/** API secret sent as x-api-key header to admin gateway endpoints */
export const MYSQL_API_SECRET: string =
  process.env.MYSQL_API_SECRET ?? "change-me-in-production";
