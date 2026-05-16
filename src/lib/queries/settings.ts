import "server-only";
import { unstable_cache } from "next/cache";
import { gwGetComparisonKeys, gwGetSiteSettings } from "@/lib/api/gateway";

export interface SiteSettings {
  showPrice: boolean;
}

export const getComparisonKeys = unstable_cache(
  async (): Promise<string[]> => {
    return gwGetComparisonKeys();
  },
  ["comparison-keys"],
  { revalidate: 60, tags: ["comparison-keys"] },
);

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    return gwGetSiteSettings();
  },
  ["site-settings"],
  { revalidate: 60, tags: ["site-settings"] },
);
