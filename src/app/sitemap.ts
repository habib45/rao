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

  // Static pages
  const staticPages = ["", "/categories", "/search", "/cart", "/blog"];
  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}/en${page}`,
      lastModified: new Date(),
      alternates: { languages: alternateLanguages(page) },
    });
  }

  // Product pages
  for (const product of products) {
    const slug = product.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/products/${slug}`,
      lastModified: new Date(product.updated_at),
      alternates: { languages: alternateLanguages(`/products/${slug}`) },
    });
  }

  // Category pages
  for (const category of categories) {
    const slug = category.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/categories/${slug}`,
      lastModified: new Date(),
      alternates: { languages: alternateLanguages(`/categories/${slug}`) },
    });
  }

  // Blog post pages
  for (const post of blogPosts) {
    const slug = post.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/blog/${slug}`,
      lastModified: new Date(post.updated_at),
      alternates: { languages: alternateLanguages(`/blog/${slug}`) },
    });
  }

  // Blog category pages
  for (const cat of blogCategories) {
    const slug = cat.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/blog/category/${slug}`,
      alternates: { languages: alternateLanguages(`/blog/category/${slug}`) },
    });
  }

  return entries;
}
