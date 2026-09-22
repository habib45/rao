/**
 * Auth / login round-trip check.
 *
 * Probes `POST /api/auth/login` on the configured API gateway. Three modes:
 *   - `?mode=missing-credentials` → expect 400 (validation works)
 *   - `?mode=wrong-password&email=<x>` → expect 401 (auth path works)
 *   - no params → defaults to "wrong-password" with a synthetic email
 *
 * The route deliberately does NOT log in as a real user — it only verifies
 * that the auth code path is reachable and returns the expected status.
 *
 * GET /api/health/auth
 * GET /api/health/auth?mode=missing-credentials
 * GET /api/health/auth?mode=wrong-password&email=probe@example.com
 */
import { NextResponse } from "next/server";
import { MYSQL_API_URL } from "@/lib/config/datasource";

export const dynamic = "force-dynamic";

type AuthStatus = "ok" | "config-missing" | "unreachable" | "timeout" | "unexpected-status";

interface AuthProbeResult {
  status: AuthStatus;
  apiUrl: string | null;
  requestMode: "missing-credentials" | "wrong-password";
  httpStatus: number | null;
  latencyMs: number;
  bodyExcerpt: string | null;
  error: string | null;
  expectationMet: boolean;
}

interface AuthRequestBody {
  email?: string;
  password?: string;
}

async function probe(
  url: string,
  body: AuthRequestBody,
  expectedStatus: number,
  timeoutMs: number,
): Promise<AuthProbeResult> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    const latencyMs = Date.now() - started;

    let bodyExcerpt: string | null = null;
    try {
      const text = await res.text();
      bodyExcerpt = text.slice(0, 240);
    } catch {
      bodyExcerpt = null;
    }

    return {
      status: res.status === expectedStatus ? "ok" : "unexpected-status",
      apiUrl: url,
      requestMode: body.email
        ? "wrong-password"
        : "missing-credentials",
      httpStatus: res.status,
      latencyMs,
      bodyExcerpt,
      error: null,
      expectationMet: res.status === expectedStatus,
    };
  } catch (e) {
    const latencyMs = Date.now() - started;
    const message = e instanceof Error ? e.message : String(e);
    const isTimeout = message.toLowerCase().includes("timeout");
    return {
      status: isTimeout ? "timeout" : "unreachable",
      apiUrl: url,
      requestMode: body.email ? "wrong-password" : "missing-credentials",
      httpStatus: null,
      latencyMs,
      bodyExcerpt: null,
      error: message,
      expectationMet: false,
    };
  }
}

export async function GET(req: Request) {
  const startedAt = new Date().toISOString();
  const { searchParams } = new URL(req.url);

  if (!MYSQL_API_URL) {
    return NextResponse.json(
      {
        status: "error",
        startedAt,
        check: "auth-login",
        probe: {
          status: "config-missing",
          apiUrl: null,
          requestMode: "missing-credentials",
          httpStatus: null,
          latencyMs: 0,
          bodyExcerpt: null,
          error: "MYSQL_API_URL is not set in the environment",
          expectationMet: false,
        } satisfies AuthProbeResult,
      },
      { status: 503 },
    );
  }

  const mode = searchParams.get("mode") ?? "wrong-password";
  const target = `${MYSQL_API_URL.replace(/\/+$/, "")}/api/auth/login`;

  let result: AuthProbeResult;
  if (mode === "missing-credentials") {
    // Empty body — server should reject with 400 (per auth.js line 44).
    result = await probe(target, {}, 400, 5_000);
  } else {
    // Synthetic email + wrong password — server should reject with 401.
    const email = searchParams.get("email") ?? "probe@example.com";
    result = await probe(
      target,
      { email, password: "definitely-wrong-password" },
      401,
      5_000,
    );
  }

  const httpStatus =
    result.status === "ok" ? 200 : result.status === "config-missing" ? 503 : 502;

  return NextResponse.json(
    {
      status: result.status === "ok" ? "ok" : "error",
      startedAt,
      check: "auth-login",
      probe: result,
    },
    { status: httpStatus },
  );
}