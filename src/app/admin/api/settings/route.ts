import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function GET() {
  const res = await fetch(`${MYSQL_API_URL}/api/admin/settings`, { cache: "no-store" });
  return NextResponse.json(await res.json());
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const entries = Object.entries(body as Record<string, unknown>);
  const errors: string[] = [];
  for (const [key, value] of entries) {
    const res = await fetch(`${MYSQL_API_URL}/api/admin/settings/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) errors.push(`Failed to save ${key}`);
  }
  if (errors.length > 0) return NextResponse.json({ ok: false, errors }, { status: 207 });
  revalidateTag("site-settings");
  return NextResponse.json({ ok: true });
}
