/**
 * Dashboard queries using MySQL gateway
 * These replace the previous Supabase-based dashboard queries
 */

interface DashboardStats {
  total_products: number;
  active_products: number;
  total_categories: number;
  active_categories: number;
  clicks_7d: number;
  clicks_30d: number;
}

interface CategoryStats {
  category_name?: { en?: string };
  click_count: string | number;
}

interface ProductStats {
  asin?: string;
  name?: { en?: string };
  click_count: string | number;
}

interface SyncLog {
  id: string;
  function_name: string;
  status: string;
  items_processed: number;
  errors: unknown[];
  started_at: string;
  completed_at: string | null;
}

export interface ScheduledProduct {
  id: string;
  asin?: string;
  name?: { en?: string };
  scheduled_at: string;
  publish_at: string;
}

// Placeholder implementations - to be implemented with actual MySQL API calls

export async function getDashboardStats(): Promise<DashboardStats> {
  return {
    total_products: 0,
    active_products: 0,
    total_categories: 0,
    active_categories: 0,
    clicks_7d: 0,
    clicks_30d: 0,
  };
}

export async function getClickTrends(days: number): Promise<Array<{ day: string; click_count: number }>> {
  return [];
}

export async function getTopCategories(limit: number): Promise<CategoryStats[]> {
  return [];
}

export async function getRecentSyncLogs(limit: number): Promise<SyncLog[]> {
  return [];
}

export async function getTopProducts(limit: number): Promise<ProductStats[]> {
  return [];
}

export async function getScheduledProducts(limit: number): Promise<ScheduledProduct[]> {
  return [];
}
