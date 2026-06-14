import type { MetadataRoute } from "next";
import type { LocaleCode } from "@/types/domain";
import {
  gwGetAllProducts,
  gwGetActiveCategories,
  gwGetPublishedBlogPosts,
  gwGetActiveBlogCategories,
} from "@/lib/api/gateway";

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://raofinds.com";
const locales: LocaleCode[] = ["en", "bn-BD", "sv"];

function alternateLanguages(path: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const locale of locales) {
    result[locale] = `${BASE_URL}/${locale}${path}`;
  }
  result["x-default"] = `${BASE_URL}/en${path}`;
  return result;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
      alternates: { languages: alternateLanguages(page.path) },
    });
  }

  // Product pages with priority and changeFrequency
  for (const product of products) {
    const slug = product.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/products/${slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: { languages: alternateLanguages(`/products/${slug}`) },
    });
  }

  // Category pages with priority and changeFrequency
  for (const category of categories) {
    const slug = category.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/categories/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: { languages: alternateLanguages(`/categories/${slug}`) },
    });
  }

  // Blog post pages with priority and changeFrequency
  for (const post of blogPosts) {
    const slug = post.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/blog/${slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: { languages: alternateLanguages(`/blog/${slug}`) },
    });
  }

  // Blog category pages with priority and changeFrequency
  for (const cat of blogCategories) {
    const slug = cat.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/blog/category/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: alternateLanguages(`/blog/category/${slug}`) },
    });
  }

  return entries;
}
