import type { MetadataRoute } from "next";
import type { LocaleCode } from "@/types/domain";
import {
  gwGetAllProducts,
  gwGetActiveCategories,
  gwGetPublishedBlogPosts,
  gwGetActiveBlogCategories,
} from "@/lib/api/gateway";

export const revalidate = 3600;

const DEFAULT_BASE_URL = "https://raofinds.com";
const ENV_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const locales: LocaleCode[] = ["en", "bn-BD", "sv"];

async function getBaseUrl(): Promise<string> {
  // Try to read from config file first
  try {
    const fs = await import("fs/promises");
    const configPath = process.cwd() + "/public/sitemap-config.json";
    const content = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(content);
    if (config.baseUrl) {
      return config.baseUrl;
    }
  } catch {
    // Config file doesn't exist or is invalid, fall back to env var
  }
  
  // Fall back to environment variable or default
  return ENV_BASE_URL ?? DEFAULT_BASE_URL;
}

async function getExcludedSlugs(): Promise<Set<string>> {
  try {
    const fs = await import("fs/promises");
    const exclusionsPath = process.cwd() + "/public/sitemap-exclusions.json";
    const content = await fs.readFile(exclusionsPath, "utf-8");
    const data = JSON.parse(content);
    return new Set(data.slugs || []);
  } catch {
    // File doesn't exist, return empty set
    return new Set();
  }
}

function alternateLanguages(path: string, baseUrl: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const locale of locales) {
    result[locale] = `${baseUrl}/${locale}${path}`;
  }
  result["x-default"] = `${baseUrl}/en${path}`;
  return result;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = await getBaseUrl();
  const excludedSlugs = await getExcludedSlugs();
  
  const [products, categories, blogPosts, blogCategories] = await Promise.all([
    gwGetAllProducts(),
    gwGetActiveCategories(),
    gwGetPublishedBlogPosts(),
    gwGetActiveBlogCategories(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Static pages with priority and changeFrequency
  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/categories", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/search", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/cart", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/privacy-policy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/terms-of-service", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/affiliate-disclaimer", priority: 0.5, changeFrequency: "monthly" as const },
  ];
  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}/en${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages: alternateLanguages(page.path, BASE_URL) },
    });
  }

  // Product pages with priority and changeFrequency
  for (const product of products) {
    const slug = product.slug?.en;
    if (!slug) continue;
    if (excludedSlugs.has(`products/${slug}`)) continue;
    entries.push({
      url: `${BASE_URL}/en/products/${slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: { languages: alternateLanguages(`/products/${slug}`, BASE_URL) },
    });
  }

  // Category pages with priority and changeFrequency
  for (const category of categories) {
    const slug = category.slug?.en;
    if (!slug) continue;
    if (excludedSlugs.has(`categories/${slug}`)) continue;
    entries.push({
      url: `${BASE_URL}/en/categories/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: { languages: alternateLanguages(`/categories/${slug}`, BASE_URL) },
    });
  }

  // Blog post pages with priority and changeFrequency
  for (const post of blogPosts) {
    const slug = post.slug?.en;
    if (!slug) continue;
    if (excludedSlugs.has(`blog/${slug}`)) continue;
    entries.push({
      url: `${BASE_URL}/en/blog/${slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: { languages: alternateLanguages(`/blog/${slug}`, BASE_URL) },
    });
  }

  // Blog category pages with priority and changeFrequency
  for (const cat of blogCategories) {
    const slug = cat.slug?.en;
    if (!slug) continue;
    if (excludedSlugs.has(`blog/category/${slug}`)) continue;
    entries.push({
      url: `${BASE_URL}/en/blog/category/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: alternateLanguages(`/blog/category/${slug}`, BASE_URL) },
    });
  }

  return entries;
}
