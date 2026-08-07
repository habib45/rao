/**
 * Database / API gateway reachability check.
 *
 * Tries to hit `MYSQL_API_URL` with a short timeout. Does NOT authenticate —
 * a 401 here still proves the gateway process is reachable, which is what
 * we want for a "is the backend up?" probe.
 *
 * GET /api/health/db
 */
import { NextResponse } from "next/server";
import { MYSQL_API_URL } from "@/lib/config/datasource";

export const dynamic = "force-dynamic";

type DbStatus =
  | "reachable"
  | "unreachable"
  | "auth-required"
  | "timeout"
  | "config-missing";

interface ProbeResult {
  status: DbStatus;
  apiUrl: string | null;
  httpStatus: number | null;
  latencyMs: number;
  bodyExcerpt: string | null;
  error: string | null;
}

async function probe(url: string, timeoutMs: number): Promise<ProbeResult> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      // Don't send credentials — we just want to know the gateway answered.
      headers: { Accept: "application/json" },
      // `signal` + manual AbortController works on both Node and Edge
      // runtimes, unlike AbortSignal.timeout which is Node 17+ only.
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

    let status: DbStatus = "reachable";
    if (res.status === 401 || res.status === 403) status = "auth-required";
    else if (res.status >= 500) status = "unreachable";

    return {
      status,
      apiUrl: url,
      httpStatus: res.status,
      latencyMs,
      bodyExcerpt,
      error: null,
    };
  } catch (e) {
    const latencyMs = Date.now() - started;
    const message = e instanceof Error ? e.message : String(e);
    const isTimeout = message.toLowerCase().includes("timeout");
    return {
      status: isTimeout ? "timeout" : "unreachable",
      apiUrl: url,
      httpStatus: null,
      latencyMs,
      bodyExcerpt: null,
      error: message,
    };
  }
}

export async function GET() {
  const startedAt = new Date().toISOString();

  // 1. Config gate — fail fast with a clear message if the env var is
  // missing rather than reporting a confusing DNS / connection error.
  if (!MYSQL_API_URL) {
    return NextResponse.json(
      {
        status: "error",
        startedAt,
        check: "database-gateway",
        probe: {
          status: "config-missing",
          apiUrl: null,
          httpStatus: null,
          latencyMs: 0,
          bodyExcerpt: null,
          error: "MYSQL_API_URL is not set in the environment",
        } satisfies ProbeResult,
      },
      { status: 503 },
    );
  }

  // 2. Probe the gateway root. `/api/products` with `limit=1` is a cheap,
  // idempotent call that exists on every gateway deployment.
  const target = `${MYSQL_API_URL.replace(/\/+$/, "")}/api/products?limit=1`;
  const probeResult = await probe(target, 5_000);

  // 4xx (auth-required) still counts as "the gateway is up" — surface 200
  // with the upstream status so the operator can see the difference.
  // 5xx / network errors are real failures.
  const httpStatus =
    probeResult.status === "auth-required" || probeResult.status === "reachable"
      ? 200
      : 503;

  return NextResponse.json(
    {
      status: httpStatus === 200 ? "ok" : "error",
      startedAt,
      check: "database-gateway",
      probe: probeResult,
    },
    { status: httpStatus },
  );
}