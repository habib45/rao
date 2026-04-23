import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase/server";
import type { LocaleCode } from "@/types/domain";

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

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("is_active", true),
    supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_active", true),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = ["", "/categories", "/search", "/cart"];
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
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/products/${slug}`,
      lastModified: new Date(product.updated_at as string),
      alternates: {
        languages: alternateLanguages(`/products/${slug}`),
      },
    });
  }

  // Category pages
  for (const category of categories ?? []) {
    const slug = (category.slug as Record<string, string>)?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/categories/${slug}`,
      lastModified: new Date(category.updated_at as string),
      alternates: {
        languages: alternateLanguages(`/categories/${slug}`),
      },
    });
  }

  return entries;
}
