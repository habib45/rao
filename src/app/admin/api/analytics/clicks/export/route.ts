import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  const locale = sp.get("locale");

  const supabase = createAdminClient();

  let query = supabase
    .from("click_events")
    .select("clicked_at, locale, session_id, referrer, user_agent, product_id, products!inner(name, asin)")
    .order("clicked_at", { ascending: false })
    .limit(10000);

  if (from) query = query.gte("clicked_at", from);
  if (to) query = query.lte("clicked_at", to);
  if (locale) query = query.eq("locale", locale);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const header = "Date,Locale,Product,ASIN,Session ID,Referrer,User Agent";
  const csvRows = rows.map((r) => {
    const prod = r.products as unknown as { name: Record<string, string>; asin: string };
    return [
      r.clicked_at,
      r.locale,
      `"${(prod.name?.en ?? "").replace(/"/g, '""')}"`,
      prod.asin,
      r.session_id,
      `"${(r.referrer ?? "").replace(/"/g, '""')}"`,
      `"${(r.user_agent ?? "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csv = [header, ...csvRows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clicks-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
