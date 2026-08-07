import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  signAdminSession,
  adminSessionCookieAttributes,
  type AdminRole,
} from "@/app/admin/_lib/jwt";
import { withRateLimit } from "@/lib/api/rate-limit";
import { badRequest, gatewayError, unauthorized } from "@/lib/api/errors";

/**
 * Read the API Gateway base URL.
 *
 * Production: the env var MUST be set and MUST be a valid URL. Falling back
 * to `http://localhost:4000` in production was the cause of silent
 * `ECONNREFUSED` failures because the frontend and the gateway run on
 * different hosts on Namecheap.
 */
function readGatewayUrl(): string | null {
  const raw = process.env.MYSQL_API_URL;
  if (!raw) return null;
  try {
    // `new URL()` throws on malformed strings — better to fail at boot than
    // on every request.
    new URL(raw);
    return raw.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(512),
  rememberMe: z.boolean().optional(),
});

export const POST = withRateLimit(
  { key: "login", capacity: 5, refillPerSec: 1 / 12 },
  async (request: NextRequest) => {
    try {
    const gatewayUrl = readGatewayUrl();
    if (!gatewayUrl) {
      console.error(
        "[admin/api/auth/login] MYSQL_API_URL is not configured or invalid",
      );
      return gatewayError({
        reason: "Authentication service is not configured",
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest({ reason: "Invalid JSON body" });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest({ issues: parsed.error.flatten() });
    }

    const { email, password, rememberMe } = parsed.data;

    // Forward to API Gateway for authentication. Bound the upstream call so
    // a hung gateway can't pin the admin route indefinitely.
    let res: Response;
    try {
      res = await fetch(`${gatewayUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password, rememberMe }),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
    } catch (err) {
      console.error("[admin/api/auth/login] upstream fetch failed", {
        gatewayUrl,
        error: err instanceof Error ? err.message : String(err),
      });
      return gatewayError({ reason: "Authentication service unavailable" });
    }

    if (!res.ok) {
      // Surface upstream status + a readable reason so the client can show
      // a useful message instead of a generic 500. We never leak the raw
      // password or any internal details.
      const upstream = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      console.error("[admin/api/auth/login] upstream non-ok", {
        gatewayUrl,
        status: res.status,
        upstreamError: upstream.error,
      });
      return NextResponse.json(
        { error: upstream.error || "Invalid credentials" },
        { status: res.status },
      );
    }

    let data: {
      id: string | number;
      email: string;
      role: string;
      name: string;
      username?: string;
    };
    try {
      data = (await res.json()) as typeof data;
    } catch (err) {
      console.error("[admin/api/auth/login] upstream JSON parse failed", {
        gatewayUrl,
        error: err instanceof Error ? err.message : String(err),
      });
      return gatewayError({ reason: "Authentication service returned invalid response" });
    }

    // The gateway emits a richer role set (e.g. "super_admin"). Map any
    // privileged upstream role down to the narrow AdminRole set we issue in
    // our JWT so verifyAdminSession() can validate it cleanly.
    const sessionRole: AdminRole | null =
      data.role === "admin" || data.role === "editor"
        ? data.role
        : data.role === "super_admin"
          ? "admin"
          : null;

    if (!sessionRole) {
      return unauthorized({ reason: "Account is not authorized for admin" });
    }

    // signAdminSession() throws in production when ADMIN_JWT_SECRET is
    // missing — catch that here and return a clean 500 with a useful log
    // line instead of a bare 500 page.
    let token: string;
    try {
      token = await signAdminSession({
        sub: String(data.id),
        email: data.email,
        role: sessionRole,
        name: data.name,
      });
    } catch (err) {
      console.error(
        "[admin/api/auth/login] signAdminSession failed — likely missing ADMIN_JWT_SECRET",
        { error: err instanceof Error ? err.message : String(err) },
      );
      return NextResponse.json(
        {
          error: "Server configuration error",
          reason: "Admin session signing is not configured",
        },
        { status: 500 },
      );
    }

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
    const response = NextResponse.json({
      id: data.id,
      email: data.email,
      role: sessionRole,
      name: data.name,
      username: data.username,
    });
    response.cookies.set(
      "admin_token",
      token,
      adminSessionCookieAttributes(maxAge),
    );
    return response;
    } catch (err) {
      console.error("[admin/api/auth/login] unhandled error", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return NextResponse.json(
        {
          error: "Internal Server Error",
          reason:
            process.env.NODE_ENV === "production"
              ? "Login handler failed"
              : err instanceof Error
                ? err.message
                : String(err),
        },
        { status: 500 },
      );
    }
  },
);
