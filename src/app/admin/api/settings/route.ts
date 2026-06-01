import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { MYSQL_API_SECRET } from "@/lib/config/datasource";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";
const ADMIN_HEADERS = MYSQL_API_SECRET
  ? { "x-api-key": MYSQL_API_SECRET }
  : undefined;

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

export async function GET() {
  const res = await fetch(`${MYSQL_API_URL}/api/admin/settings`, {
    cache: "no-store",
    headers: ADMIN_HEADERS,
  });
  const data = await res.json();
  const parsed = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, parseSettingValue(value)])
  );
  return NextResponse.json(parsed);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const entries = Object.entries(body as Record<string, unknown>);
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
  if (errors.length > 0) return NextResponse.json({ ok: false, errors }, { status: 207 });
  revalidateTag("site-settings");
  return NextResponse.json({ ok: true });
}
