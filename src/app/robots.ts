import type { MetadataRoute } from "next";
import type { RobotsRule } from "@/app/admin/_lib/schemas/sitemap";

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestfinds.com";

const DEFAULT_RULES: RobotsRule[] = [
  { userAgent: "*", allow: ["/"], disallow: ["/api/", "/_next/", "/admin/"] },
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  // TODO: Fetch custom rules from API gateway when available
  const rules: RobotsRule[] = DEFAULT_RULES;

  return {
    rules: rules.map((r) => ({
      userAgent: r.userAgent,
      allow: r.allow,
      disallow: r.disallow,
    })),
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
