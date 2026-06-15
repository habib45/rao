import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import {
  gwGetAllProducts,
  gwGetActiveCategories,
  gwGetPublishedBlogPosts,
  gwGetActiveBlogCategories,
} from "@/lib/api/gateway";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://raofinds.com";
// const locales = ["en", "bn-BD", "sv"] as const;

type PreviewEntry = {
  url: string;
  type: string;
  lastModified: string | null;
  priority: number;
};

export async function GET(req: NextRequest) {
  await requireAdmin();
  
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  if (action === "preview") {
    return handlePreview(page, limit);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

async function handlePreview(page: number, limit: number) {
  const [products, categories, blogPosts, blogCategories] = await Promise.all([
    gwGetAllProducts(),
    gwGetActiveCategories(),
    gwGetPublishedBlogPosts(1000),
    gwGetActiveBlogCategories(),
  ]);

  const entries: PreviewEntry[] = [];

  // Static pages
  const staticPages = ["", "/categories", "/search", "/cart", "/blog"];
  for (const pagePath of staticPages) {
    entries.push({
      url: `${BASE_URL}/en${pagePath}`,
      type: "static",
      lastModified: new Date().toISOString(),
      priority: 1.0,
    });
  }

  // Product pages
  for (const product of products) {
    const slug = product.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/products/${slug}`,
      type: "product",
      lastModified: product.updated_at ? new Date(product.updated_at).toISOString() : null,
      priority: 0.8,
    });
  }

  // Category pages
  for (const category of categories) {
    const slug = category.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/categories/${slug}`,
      type: "category",
      lastModified: new Date().toISOString(),
      priority: 0.7,
    });
  }

  // Blog post pages
  for (const post of blogPosts) {
    const slug = post.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/blog/${slug}`,
      type: "blog_post",
      lastModified: post.updated_at ? new Date(post.updated_at).toISOString() : null,
      priority: 0.6,
    });
  }

  // Blog category pages
  for (const cat of blogCategories) {
    const slug = cat.slug?.en;
    if (!slug) continue;
    entries.push({
      url: `${BASE_URL}/en/blog/category/${slug}`,
      type: "blog_category",
      lastModified: new Date().toISOString(),
      priority: 0.5,
    });
  }

  const total = entries.length;
  const offset = (page - 1) * limit;
  const paginatedEntries = entries.slice(offset, offset + limit);

  return NextResponse.json({
    entries: paginatedEntries,
    total,
  });
}
