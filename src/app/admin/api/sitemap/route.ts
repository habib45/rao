import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import {
  sitemapCustomEntrySchema,
  sitemapCustomEntryUpdateSchema,
} from "@/app/admin/_lib/schemas/sitemap";
import type { LocaleCode } from "@/types/domain";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bestfinds.com";
const locales: LocaleCode[] = ["en", "bn-BD", "sv"];

// GET /admin/api/sitemap?action=custom|preview&page=1&limit=50
export async function GET(req: NextRequest) {
  await requireAdmin();
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action") ?? "custom";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));

  if (action === "custom") {
    const supabase = createAdminClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
      .from("sitemap_custom_entries")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ entries: data ?? [], total: count ?? 0 });
  }

  if (action === "preview") {
    const supabase = await createServerClient();
    const [
      { data: products },
      { data: categories },
      { data: blogPosts },
      { data: blogCategories },
      { data: exclusionsSetting },
      { data: customEntries },
    ] = await Promise.all([
      supabase.from("products").select("slug, updated_at").eq("is_active", true),
      supabase.from("categories").select("slug, updated_at").eq("is_active", true),
      supabase.from("blog_posts").select("slug, updated_at").eq("status", "published"),
      supabase.from("blog_categories").select("slug").eq("is_active", true),
      supabase.from("admin_settings").select("value").eq("key", "sitemap_exclusions").single(),
      supabase.from("sitemap_custom_entries").select("url, priority, changefreq, last_modified").eq("is_active", true),
    ]);

    const excludedSlugs: string[] =
      (exclusionsSetting?.value as { slugs?: string[] })?.slugs ?? [];

    type PreviewEntry = {
      url: string;
      type: string;
      lastModified: string | null;
      priority: number;
    };
    const entries: PreviewEntry[] = [];

    const staticPages = ["", "/categories", "/search", "/cart", "/blog"];
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/en${page}`,
        type: "static",
        lastModified: new Date().toISOString(),
        priority: 1.0,
      });
    }

    for (const p of products ?? []) {
      const slug = (p.slug as Record<string, string>)?.en;
      if (!slug || excludedSlugs.includes(slug)) continue;
      entries.push({
        url: `${BASE_URL}/en/products/${slug}`,
        type: "product",
        lastModified: p.updated_at as string,
        priority: 0.8,
      });
    }

    for (const c of categories ?? []) {
      const slug = (c.slug as Record<string, string>)?.en;
      if (!slug || excludedSlugs.includes(slug)) continue;
      entries.push({
        url: `${BASE_URL}/en/categories/${slug}`,
        type: "category",
        lastModified: c.updated_at as string,
        priority: 0.7,
      });
    }

    for (const post of blogPosts ?? []) {
      const slug = (post.slug as Record<string, string>)?.en;
      if (!slug || excludedSlugs.includes(slug)) continue;
      entries.push({
        url: `${BASE_URL}/en/blog/${slug}`,
        type: "blog_post",
        lastModified: post.updated_at as string,
        priority: 0.6,
      });
    }

    for (const cat of blogCategories ?? []) {
      const slug = (cat.slug as Record<string, string>)?.en;
      if (!slug || excludedSlugs.includes(slug)) continue;
      entries.push({
        url: `${BASE_URL}/en/blog/category/${slug}`,
        type: "blog_category",
        lastModified: null,
        priority: 0.5,
      });
    }

    for (const entry of customEntries ?? []) {
      entries.push({
        url: entry.url as string,
        type: "custom",
        lastModified: entry.last_modified as string | null,
        priority: Number(entry.priority),
      });
    }

    const totalEntries = entries.length;
    const offset = (page - 1) * limit;
    const paginated = entries.slice(offset, offset + limit);

    void locales; // locales used in sitemap.ts, referenced here for symmetry
    return NextResponse.json({ entries: paginated, total: totalEntries });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// POST /admin/api/sitemap — create custom entry
export async function POST(req: NextRequest) {
  await requireAdmin();
  const body: unknown = await req.json();
  const parsed = sitemapCustomEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sitemap_custom_entries")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(data, { status: 201 });
}

// PATCH /admin/api/sitemap?id={uuid} — update custom entry
export async function PATCH(req: NextRequest) {
  await requireAdmin();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const body: unknown = await req.json();
  const parsed = sitemapCustomEntryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sitemap_custom_entries")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// DELETE /admin/api/sitemap?id={uuid} — delete custom entry
export async function DELETE(req: NextRequest) {
  await requireAdmin();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sitemap_custom_entries")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
