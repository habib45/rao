import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  signAdminSession,
  adminSessionCookieAttributes,
  type AdminRole,
} from "@/app/admin/_lib/jwt";
import { withRateLimit } from "@/lib/api/rate-limit";
import { badRequest, gatewayError, unauthorized } from "@/lib/api/errors";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(512),
  rememberMe: z.boolean().optional(),
});

export const POST = withRateLimit(
  { key: "login", capacity: 5, refillPerSec: 1 / 12 },
  async (request: NextRequest) => {
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

    // Forward to API Gateway for authentication.
    let res: Response;
    try {
      res = await fetch(`${MYSQL_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
    } catch {
      return gatewayError({ reason: "Authentication service unavailable" });
    }

    if (!res.ok) {
      const upstream = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      return NextResponse.json(
        { error: upstream.error || "Invalid credentials" },
        { status: res.status },
      );
    }

    const data = (await res.json()) as {
      id: string;
      email: string;
      role: string;
      name: string;
      username?: string;
    };

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

    const token = await signAdminSession({
      sub: String(data.id),
      email: data.email,
      role: sessionRole,
      name: data.name,
    });

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
  },
);
