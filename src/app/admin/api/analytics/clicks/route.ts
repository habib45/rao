import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "50")));
  const from = sp.get("from"); // ISO date
  const to = sp.get("to"); // ISO date
  const locale = sp.get("locale");
  const productId = sp.get("product_id");
  const groupBy = sp.get("groupBy"); // "day" | "locale" | "product"

  const supabase = createAdminClient();

  // If grouping requested, return aggregated data
  if (groupBy) {
    return handleGrouped(supabase, { groupBy, from, to, locale, productId });
  }

  // Otherwise return paginated click events
  let query = supabase
    .from("click_events")
    .select("*, products!inner(name, asin)", { count: "exact" });

  if (from) query = query.gte("clicked_at", from);
  if (to) query = query.lte("clicked_at", to);
  if (locale) query = query.eq("locale", locale);
  if (productId) query = query.eq("product_id", productId);

  query = query
    .order("clicked_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    clicks: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}

async function handleGrouped(
  supabase: ReturnType<typeof createAdminClient>,
  opts: {
    groupBy: string;
    from: string | null;
    to: string | null;
    locale: string | null;
    productId: string | null;
  }
) {
  const { groupBy, from, to, locale, productId } = opts;

  if (groupBy === "day") {
    // Use the admin_click_trends function for daily grouping
    const daysBack = from
      ? Math.ceil(
          (Date.now() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 30;

    const { data, error } = await supabase.rpc("admin_click_trends", {
      days_back: daysBack,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filtered = data ?? [];
    if (to) {
      filtered = filtered.filter(
        (r: { day: string }) => r.day <= to
      );
    }

    return NextResponse.json({ grouped: filtered, groupBy: "day" });
  }

  if (groupBy === "locale") {
    let query = supabase
      .from("click_events")
      .select("locale");

    if (from) query = query.gte("clicked_at", from);
    if (to) query = query.lte("clicked_at", to);
    if (productId) query = query.eq("product_id", productId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.locale] = (counts[row.locale] || 0) + 1;
    }
    const grouped = Object.entries(counts).map(([loc, count]) => ({
      locale: loc,
      clicks: count,
    }));

    return NextResponse.json({ grouped, groupBy: "locale" });
  }

  if (groupBy === "product") {
    let query = supabase
      .from("click_events")
      .select("product_id, products!inner(name, asin)");

    if (from) query = query.gte("clicked_at", from);
    if (to) query = query.lte("clicked_at", to);
    if (locale) query = query.eq("locale", locale);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, { product_id: string; name: string; asin: string; clicks: number }> = {};
    for (const row of data ?? []) {
      const pid = row.product_id;
      if (!counts[pid]) {
        const prod = row.products as unknown as { name: Record<string, string>; asin: string };
        counts[pid] = {
          product_id: pid,
          name: prod.name?.en ?? pid,
          asin: prod.asin,
          clicks: 0,
        };
      }
      counts[pid].clicks++;
    }
    const grouped = Object.values(counts).sort((a, b) => b.clicks - a.clicks);

    return NextResponse.json({ grouped, groupBy: "product" });
  }

  return NextResponse.json({ error: "Invalid groupBy" }, { status: 400 });
}
