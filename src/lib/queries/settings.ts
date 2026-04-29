import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SiteSettings {
  showPrice: boolean;
}

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
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
