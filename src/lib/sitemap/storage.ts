import path from "path";

/**
 * Directory holding the editable sitemap/robots JSON files.
 *
 * Defaults to `public/`, which only survives as long as the running container
 * does. Deployments with an ephemeral or read-only filesystem must point
 * SITEMAP_DATA_DIR at a writable volume shared by every instance, otherwise
 * admin edits are lost on the next deploy.
 */
export const SITEMAP_DATA_DIR =
  process.env.SITEMAP_DATA_DIR ?? path.join(process.cwd(), "public");

export const SITEMAP_CONFIG_PATH = path.join(
  SITEMAP_DATA_DIR,
  "sitemap-config.json",
);
export const SITEMAP_EXCLUSIONS_PATH = path.join(
  SITEMAP_DATA_DIR,
  "sitemap-exclusions.json",
);
export const ROBOTS_CONFIG_PATH = path.join(
  SITEMAP_DATA_DIR,
  "robots-config.json",
);

export async function writeSitemapFile(
  filePath: string,
  data: unknown,
): Promise<void> {
  const fs = await import("fs/promises");
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
