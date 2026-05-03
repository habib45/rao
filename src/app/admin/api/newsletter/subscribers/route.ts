import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const DATA_SOURCE = process.env.DATA_SOURCE ?? "supabase";
const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function GET(req: NextRequest): Promise<NextResponse> {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(100, Math.max(10, Number.parseInt(searchParams.get("perPage") ?? "20", 10) || 20));
  const q = searchParams.get("q")?.trim() ?? "";
  const offset = (page - 1) * perPage;

  if (DATA_SOURCE === "mysql") {
    const params = new URLSearchParams({ limit: String(perPage), offset: String(offset) });
    const res = await fetch(`${MYSQL_API_URL}/api/newsletter/subscribers?${params}`, { cache: "no-store" });
    const json = await res.json() as { data: unknown[]; total: number };
    let data = json.data ?? [];
    if (q) {
      data = data.filter((s) => (s as { email?: string }).email?.toLowerCase().includes(q.toLowerCase()));
    }
    return NextResponse.json({ data, total: json.total ?? 0 });
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("newsletter_subscribers")
    .select("*", { count: "exact" })
    .order("subscribed_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (q) query = query.ilike("email", `%${q}%`);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
}
