import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase/server";
import type { LocaleCode } from "@/types/domain";

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestfinds.com";
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
  const supabase = await createServerClient();

  const [
    { data: products },
    { data: categories },
    { data: blogPosts },
    { data: blogCategories },
    { data: exclusionsSetting },
    { data: customEntriesData },
  ] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_active", true),
    supabase.from("categories").select("slug, updated_at").eq("is_active", true),
    supabase.from("blog_posts").select("slug, updated_at").eq("status", "published"),
    supabase.from("blog_categories").select("slug").eq("is_active", true),
    supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "sitemap_exclusions")
      .single(),
    supabase
      .from("sitemap_custom_entries")
      .select("url, priority, changefreq, last_modified")
      .eq("is_active", true),
  ]);

  const excludedSlugs: string[] = (exclusionsSetting?.value as { slugs?: string[] })?.slugs ?? [];

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
  for (const product of products ?? []) {
    const slug = (product.slug as Record<string, string>)?.en;
    if (!slug || excludedSlugs.includes(slug)) continue;
    entries.push({
      url: `${BASE_URL}/en/products/${slug}`,
      lastModified: new Date(product.updated_at as string),
      alternates: { languages: alternateLanguages(`/products/${slug}`) },
    });
  }

  // Category pages
  for (const category of categories ?? []) {
    const slug = (category.slug as Record<string, string>)?.en;
    if (!slug || excludedSlugs.includes(slug)) continue;
    entries.push({
      url: `${BASE_URL}/en/categories/${slug}`,
      lastModified: new Date(category.updated_at as string),
      alternates: { languages: alternateLanguages(`/categories/${slug}`) },
    });
  }

  // Blog post pages
  for (const post of blogPosts ?? []) {
    const slug = (post.slug as Record<string, string>)?.en;
    if (!slug || excludedSlugs.includes(slug)) continue;
    entries.push({
      url: `${BASE_URL}/en/blog/${slug}`,
      lastModified: new Date(post.updated_at as string),
      alternates: { languages: alternateLanguages(`/blog/${slug}`) },
    });
  }

  // Blog category pages
  for (const cat of blogCategories ?? []) {
    const slug = (cat.slug as Record<string, string>)?.en;
    if (!slug || excludedSlugs.includes(slug)) continue;
    entries.push({
      url: `${BASE_URL}/en/blog/category/${slug}`,
      alternates: { languages: alternateLanguages(`/blog/category/${slug}`) },
    });
  }

  // Admin-managed custom entries
  for (const entry of customEntriesData ?? []) {
    entries.push({
      url: entry.url as string,
      lastModified: entry.last_modified
        ? new Date(entry.last_modified as string)
        : new Date(),
      changeFrequency: entry.changefreq as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: Number(entry.priority),
    });
  }

  return entries;
}
