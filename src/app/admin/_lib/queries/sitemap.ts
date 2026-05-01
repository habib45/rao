import { createAdminClient } from "@/lib/supabase/admin";
import type { RobotsConfig, RobotsRule } from "@/app/admin/_lib/schemas/sitemap";
import "server-only";

export type SitemapCustomEntry = {
  id: string;
  url: string;
  priority: number;
  changefreq: string;
  last_modified: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SitemapPreviewEntry = {
  url: string;
  type: "product" | "category" | "blog_post" | "blog_category" | "static" | "custom";
  lastModified: string | null;
  priority: number;
};

const DEFAULT_ROBOTS_RULES: RobotsRule[] = [
  { userAgent: "*", allow: ["/"], disallow: ["/api/", "/_next/", "/admin/"] },
];

export async function getSitemapCustomEntries(
  page = 1,
  limit = 50,
): Promise<{ entries: SitemapCustomEntry[]; total: number }> {
  const supabase = createAdminClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("sitemap_custom_entries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return {
    entries: (data ?? []) as SitemapCustomEntry[],
    total: count ?? 0,
  };
}

export async function getSitemapExclusions(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "sitemap_exclusions")
    .single();
  return (data?.value as { slugs: string[] })?.slugs ?? [];
}

export async function setSitemapExclusions(slugs: string[]): Promise<string[]> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admin_settings")
    .upsert({ key: "sitemap_exclusions", value: { slugs } }, { onConflict: "key" });
  if (error) throw error;
  return slugs;
}

export async function getRobotsConfig(): Promise<RobotsConfig> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "robots_config")
    .single();
  const rules = (data?.value as { rules?: RobotsRule[] })?.rules;
  return { rules: rules && rules.length > 0 ? rules : DEFAULT_ROBOTS_RULES };
}

export async function setRobotsConfig(config: RobotsConfig): Promise<RobotsConfig> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admin_settings")
    .upsert({ key: "robots_config", value: config }, { onConflict: "key" });
  if (error) throw error;
  return config;
}

export async function getSitemapStats(): Promise<{
  customCount: number;
  exclusionCount: number;
}> {
  const supabase = createAdminClient();
  const [{ count }, exclusions] = await Promise.all([
    supabase
      .from("sitemap_custom_entries")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    getSitemapExclusions(),
  ]);
  return { customCount: count ?? 0, exclusionCount: exclusions.length };
}
