import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { MYSQL_API_SECRET } from "@/lib/config/datasource";
import { withAdmin } from "@/app/admin/_lib/with-admin";
import { badRequest, gatewayError } from "@/lib/api/errors";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

function parseSettingValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

export const GET = withAdmin(async () => {
  const headers: HeadersInit = {};
  if (MYSQL_API_SECRET) headers["x-api-key"] = MYSQL_API_SECRET;

  const res = await fetch(`${MYSQL_API_URL}/api/admin/settings`, {
    cache: "no-store",
    headers,
  });

  if (!res.ok) return gatewayError({ reason: "Failed to load settings" });

  const data = await res.json();
  const parsed = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, parseSettingValue(value)]),
  );
  return NextResponse.json(parsed);
});

export const PATCH = withAdmin(async (request: NextRequest) => {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || typeof body !== "object") {
    return badRequest({ reason: "Invalid body" });
  }

  const entries = Object.entries(body);
  const errors: string[] = [];
  for (const [key, value] of entries) {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (MYSQL_API_SECRET) headers["x-api-key"] = MYSQL_API_SECRET;
    const res = await fetch(`${MYSQL_API_URL}/api/admin/settings/${key}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ value }),
    });
    if (!res.ok) errors.push(`Failed to save ${key}`);
  }
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 207 });
  }
  revalidateTag("site-settings");
  return NextResponse.json({ ok: true });
});
