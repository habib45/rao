// Sitemap and robots.txt management functions

import {
  ROBOTS_CONFIG_PATH,
  SITEMAP_EXCLUSIONS_PATH,
  writeSitemapFile,
} from "@/lib/sitemap/storage";

export async function getSitemapExclusions(): Promise<string[]> {
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(SITEMAP_EXCLUSIONS_PATH, "utf-8");
    const data = JSON.parse(content);
    return data.slugs || [];
  } catch {
    // File doesn't exist, return empty array
    return [];
  }
}

export async function setSitemapExclusions(slugs: string[]): Promise<string[]> {
  await writeSitemapFile(SITEMAP_EXCLUSIONS_PATH, { slugs });
  return slugs;
}

export async function getRobotsConfig(): Promise<{ rules: Array<{ userAgent: string; allow: string[]; disallow: string[]; crawlDelay?: number }> }> {
  // Try to read from JSON file first
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(ROBOTS_CONFIG_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    // Return default if file doesn't exist
    return {
      rules: [
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
      ]
    };
  }
}

export async function setRobotsConfig(config: { rules: Array<{ userAgent: string; allow: string[]; disallow: string[]; crawlDelay?: number }> }): Promise<{ rules: Array<{ userAgent: string; allow: string[]; disallow: string[]; crawlDelay?: number }> }> {
  await writeSitemapFile(ROBOTS_CONFIG_PATH, config);
  return config;
}

export async function getSitemapStats(): Promise<{
  customCount: number;
  exclusionCount: number;
}> {
  const exclusions = await getSitemapExclusions();
  return {
    customCount: 0, // Number of custom sitemap entries
    exclusionCount: exclusions.length,
  };
}
