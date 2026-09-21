import type { MetadataRoute } from "next";
import type { RobotsRule } from "@/app/admin/_lib/schemas/sitemap";
import { ROBOTS_CONFIG_PATH } from "@/lib/sitemap/storage";
import { isSafeBaseUrl } from "@/lib/sitemap/utils";

export const revalidate = 3600;

const BASE_URL = isSafeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL)
  ? process.env.NEXT_PUBLIC_SITE_URL
  : "https://raofinds.com";

const DEFAULT_RULES: RobotsRule[] = [
  { 
    userAgent: "*", 
    allow: ["/"], 
    disallow: ["/api/", "/_next/", "/admin/", "/cart", "/static/"] 
  },
  { 
    userAgent: "Googlebot", 
    allow: ["/"], 
    disallow: ["/api/", "/_next/", "/admin/", "/cart", "/static/"],
    crawlDelay: 1 
  },
  { 
    userAgent: "Bingbot", 
    allow: ["/"], 
    disallow: ["/api/", "/_next/", "/admin/", "/cart", "/static/"],
    crawlDelay: 1 
  },
];

async function fetchRobotsRules(): Promise<RobotsRule[]> {
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(ROBOTS_CONFIG_PATH, "utf-8");
    const data = JSON.parse(content) as { rules: RobotsRule[] };
    return data.rules;
  } catch {
    return DEFAULT_RULES;
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const rules = await fetchRobotsRules();

  return {
    rules: rules.map((r) => ({
      userAgent: r.userAgent,
      allow: r.allow,
      disallow: r.disallow,
      ...(r.crawlDelay && { crawlDelay: r.crawlDelay }),
    })),
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
