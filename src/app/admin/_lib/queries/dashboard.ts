import { createServerClient } from "@/lib/supabase/server";
import { DATA_SOURCE, MYSQL_API_URL, MYSQL_API_SECRET } from "@/lib/config/datasource";
import "server-only";

async function mysqlAdmin<T>(path: string): Promise<T> {
  const res = await fetch(`${MYSQL_API_URL}/api/admin${path}`, {
    cache: "no-store",
    headers: { "x-api-key": MYSQL_API_SECRET },
  });
  if (!res.ok) throw new Error(`Gateway error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getDashboardStats() {
  if (DATA_SOURCE === "mysql") {
    const data = await mysqlAdmin<Record<string, number>>("/dashboard");
    return {
      total_products: data.products ?? 0,
      active_products: data.products ?? 0,
      total_categories: data.categories ?? 0,
      active_categories: data.categories ?? 0,
      clicks_7d: data.clicks_today ?? 0,
      clicks_30d: data.clicks_today ?? 0,
    };
  }

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
  if (DATA_SOURCE === "mysql") {
    const data = await mysqlAdmin<{ grouped: { day: string; click_count: number }[] }>(
      `/analytics/clicks?group_by=day&from=${new Date(Date.now() - days * 86400000).toISOString()}`
    );
    return data.grouped ?? [];
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("admin_click_trends", { days_back: days });
  if (error) throw error;
  return (data as { day: string; click_count: number }[]) ?? [];
}

export async function getTopCategories(limit: number = 5) {
  if (DATA_SOURCE === "mysql") {
    // MySQL gateway returns top products; return empty for categories until click_tracking has category data
    return [] as { category_id: string; category_name: Record<string, string>; click_count: number }[];
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("admin_top_categories", { lim: limit });
  if (error) throw error;
  return (
    (data as { category_id: string; category_name: Record<string, string>; click_count: number }[]) ?? []
  );
}

export async function getRecentSyncLogs(limit: number = 5) {
  if (DATA_SOURCE === "mysql") {
    const data = await mysqlAdmin<unknown[]>(`/sync-logs?limit=${limit}`);
    return data ?? [];
  }

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
  if (DATA_SOURCE === "mysql") {
    const data = await mysqlAdmin<{ top_products_7d: { name: string; asin: string; clicks: number }[] }>("/dashboard");
    return (data.top_products_7d ?? []).slice(0, limit).map((p) => ({
      name: p.name,
      asin: p.asin,
      clicks: p.clicks,
    }));
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("click_tracking")
    .select("product_id, products(name, asin)")
    .order("clicked_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  const counts = new Map<string, { name: string; asin: string; clicks: number }>();
  for (const row of data ?? []) {
    const pid = row.product_id;
    const product = row.products as unknown as { name: Record<string, string>; asin: string } | null;
    if (!product) continue;
    const existing = counts.get(pid);
    if (existing) {
      existing.clicks++;
    } else {
      counts.set(pid, { name: product.name?.en ?? product.asin, asin: product.asin, clicks: 1 });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}

export async function getPendingReviewCount(): Promise<number> {
  if (DATA_SOURCE === "mysql") {
    const data = await mysqlAdmin<{ count: number }>("/pending-review-count");
    return data.count ?? 0;
  }

  const supabase = await createServerClient();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("product_status", "pending_review");
  if (error) {
    console.error("getPendingReviewCount error:", error.message);
    return 0;
  }
  return count ?? 0;
}

export interface ScheduledProduct {
  id: string;
  asin: string;
  name: Record<string, string>;
  publish_at: string;
}

export async function getScheduledProducts(limit: number = 10): Promise<ScheduledProduct[]> {
  if (DATA_SOURCE === "mysql") {
    const data = await mysqlAdmin<ScheduledProduct[]>(`/scheduled-products?limit=${limit}`);
    return data ?? [];
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, asin, name, publish_at")
    .not("publish_at", "is", null)
    .eq("is_active", false)
    .order("publish_at", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("getScheduledProducts error:", error.message);
    return [];
  }
  return (data ?? []) as ScheduledProduct[];
}
