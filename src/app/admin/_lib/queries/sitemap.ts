// Sitemap and robots.txt management functions
// These are placeholder implementations for the admin panel

export async function getSitemapExclusions(): Promise<string[]> {
  // In a real implementation, this would fetch from a database
  // For now, return empty array
  return [];
}

export async function setSitemapExclusions(slugs: string[]): Promise<string[]> {
  // In a real implementation, this would save to a database
  // For now, just return the input
  return slugs;
}

export async function getRobotsConfig(): Promise<string> {
  // Return the current robots.txt content
  const robotsPath = process.cwd() + "/public/robots.txt";
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(robotsPath, "utf-8");
    return content;
  } catch {
    // Return default if file doesn't exist
    return `User-agent: *
Allow: /

Sitemap: https://raofinds.com/sitemap.xml`;
  }
}

export async function setRobotsConfig(config: { rules: Array<{ userAgent: string; allow: string[]; disallow: string[] }> }): Promise<string> {
  // Convert the config object to robots.txt string format
  let content = "";
  for (const rule of config.rules) {
    content += `User-agent: ${rule.userAgent}\n`;
    for (const allow of rule.allow) {
      content += `Allow: ${allow}\n`;
    }
    for (const disallow of rule.disallow) {
      content += `Disallow: ${disallow}\n`;
    }
    content += "\n";
  }
  content += `Sitemap: https://raofinds.com/sitemap.xml`;

  // Save robots.txt content to public folder
  const robotsPath = process.cwd() + "/public/robots.txt";
  try {
    const fs = await import("fs/promises");
    await fs.writeFile(robotsPath, content, "utf-8");
    return content;
  } catch {
    // If write fails, just return the input as string
    return content;
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
