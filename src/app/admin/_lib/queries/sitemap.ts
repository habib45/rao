// Sitemap and robots.txt management functions

export async function getSitemapExclusions(): Promise<string[]> {
  try {
    const fs = await import("fs/promises");
    const exclusionsPath = process.cwd() + "/public/sitemap-exclusions.json";
    const content = await fs.readFile(exclusionsPath, "utf-8");
    const data = JSON.parse(content);
    return data.slugs || [];
  } catch {
    // File doesn't exist, return empty array
    return [];
  }
}

export async function setSitemapExclusions(slugs: string[]): Promise<string[]> {
  const exclusionsPath = process.cwd() + "/public/sitemap-exclusions.json";
  try {
    const fs = await import("fs/promises");
    await fs.writeFile(exclusionsPath, JSON.stringify({ slugs }, null, 2), "utf-8");
    return slugs;
  } catch {
    // If write fails, just return the input
    return slugs;
  }
}

export async function getRobotsConfig(): Promise<{ rules: Array<{ userAgent: string; allow: string[]; disallow: string[]; crawlDelay?: number }> }> {
  // Try to read from JSON file first
  const robotsConfigPath = process.cwd() + "/public/robots-config.json";
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(robotsConfigPath, "utf-8");
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
  // Save config to JSON file
  const robotsConfigPath = process.cwd() + "/public/robots-config.json";
  try {
    const fs = await import("fs/promises");
    await fs.writeFile(robotsConfigPath, JSON.stringify(config, null, 2), "utf-8");
    return config;
  } catch {
    // If write fails, just return the input
    return config;
  }
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
