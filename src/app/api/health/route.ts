/**
 * Health check — verifies this Next.js process is alive and reports the
 * runtime configuration it booted with. Does NOT touch the database or
 * the API gateway. Use this first to confirm the app process is responding
 * (i.e. ruling out the 503 "no process listening" scenario on the host).
 *
 * GET /api/health
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // always run, no caching

export async function GET() {
  const startedAt = new Date().toISOString();

  try {
    return NextResponse.json(
      {
        status: "ok",
        service: "orh-nextjs",
        startedAt,
        nodeEnv: process.env.NODE_ENV ?? "unknown",
        nodeVersion: process.version,
        nextRuntime: "nodejs",
        // Never expose real secrets — only report presence.
        config: {
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
          mysqlApiUrlConfigured: Boolean(process.env.MYSQL_API_URL),
          mysqlApiUrlEnv: process.env.MYSQL_API_URL ?? null,
          mysqlApiSecretConfigured: Boolean(process.env.MYSQL_API_SECRET),
          mysqlApiJwtConfigured: Boolean(process.env.MYSQL_API_JWT_TOKEN),
          mysqlApiPublicUrlConfigured: Boolean(
            process.env.NEXT_PUBLIC_MYSQL_API_URL,
          ),
          port: process.env.PORT ?? "3000",
        },
      },
      { status: 200 },
    );
  } catch (err) {
    // This branch is unlikely — Next.js route handlers run inside the
    // process — but if `NextResponse` itself throws we still want a JSON
    // shape the caller can parse instead of an HTML stack trace.
    return NextResponse.json(
      {
        status: "error",
        service: "orh-nextjs",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}