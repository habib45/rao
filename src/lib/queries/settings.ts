import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { DATA_SOURCE } from "@/lib/config/datasource";
import { gwGetComparisonKeys, gwGetSiteSettings } from "@/lib/api/gateway";

export interface SiteSettings {
  showPrice: boolean;
}

export const getComparisonKeys = unstable_cache(
  async (): Promise<string[]> => {
    if (DATA_SOURCE === "mysql") return gwGetComparisonKeys();

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "comparison")
      .single();

    const row = (data?.value as { keys?: string[] }) ?? {};
    return row.keys ?? [];
  },
  ["comparison-keys"],
  { revalidate: 60, tags: ["comparison-keys"] },
);

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    if (DATA_SOURCE === "mysql") return gwGetSiteSettings();

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "features")
      .single();

    const features = (data?.value as Record<string, unknown>) ?? {};
    return {
      showPrice: (features.show_price as boolean) ?? true,
    };
  },
  ["site-settings"],
  { revalidate: 60, tags: ["site-settings"] },
);
