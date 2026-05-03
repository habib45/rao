import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const DATA_SOURCE = process.env.DATA_SOURCE ?? "supabase";
const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function GET() {
  if (DATA_SOURCE === "mysql") {
    const res = await fetch(`${MYSQL_API_URL}/api/admin/settings`, { cache: "no-store" });
    return NextResponse.json(await res.json());
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_settings")
    .select("key, value, updated_at")
    .order("key");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (DATA_SOURCE === "mysql") {
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

  const supabase = createAdminClient();
  const errors: string[] = [];

  for (const [key, value] of Object.entries(body)) {
    const { error } = await supabase
      .from("admin_settings")
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) {
      errors.push(`Failed to save ${key}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 207 });
  }

  revalidateTag("site-settings");
  return NextResponse.json({ ok: true });
}
