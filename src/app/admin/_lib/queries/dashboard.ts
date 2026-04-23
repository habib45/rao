import { createServerClient } from "@/lib/supabase/server";
import "server-only";

export async function getDashboardStats() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw error;
  return (data as Record<string, number>[])?.[0] ?? {
    total_products: 0,
    active_products: 0,
    total_categories: 0,
    active_categories: 0,
    clicks_7d: 0,
    clicks_30d: 0,
  };
}

export async function getClickTrends(days: number = 30) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("admin_click_trends", {
    days_back: days,
  });
  if (error) throw error;
  return (data as { day: string; click_count: number }[]) ?? [];
}

export async function getTopCategories(limit: number = 5) {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("admin_top_categories", {
    lim: limit,
  });
  if (error) throw error;
  return (
    (data as { category_id: string; category_name: Record<string, string>; click_count: number }[]) ?? []
  );
}

export async function getRecentSyncLogs(limit: number = 5) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("sync_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getTopProducts(limit: number = 5) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("click_tracking")
    .select("product_id, products(name, asin)")
    .order("clicked_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  // Aggregate clicks per product
  const counts = new Map<string, { name: string; asin: string; clicks: number }>();
  for (const row of data ?? []) {
    const pid = row.product_id;
    const product = row.products as unknown as { name: Record<string, string>; asin: string } | null;
    if (!product) continue;
    const existing = counts.get(pid);
    if (existing) {
      existing.clicks++;
    } else {
      counts.set(pid, {
        name: product.name?.en ?? product.asin,
        asin: product.asin,
        clicks: 1,
      });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}
