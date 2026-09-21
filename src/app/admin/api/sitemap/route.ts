import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { revalidatePath } from "next/cache";
import {
  gwGetAllProducts,
  gwGetActiveCategories,
  gwGetPublishedBlogPosts,
  gwGetActiveBlogCategories,
} from "@/lib/api/gateway";

const DEFAULT_BASE_URL = "https://raofinds.com";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_BASE_URL;
const CONFIG_FILE_PATH = process.cwd() + "/public/sitemap-config.json";
const EXCLUSIONS_FILE_PATH = process.cwd() + "/public/sitemap-exclusions.json";

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

  if (action === "config") {
    return handleGetConfig();
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "set-url") {
    return handleSetUrl(req);
  }

  if (action === "auto-generate") {
    return handleAutoGenerate();
  }

  if (action === "clean") {
    return handleClean();
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

async function getBaseUrl(): Promise<string> {
  // Try to read from config file first
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(CONFIG_FILE_PATH, "utf-8");
    const config = JSON.parse(content);
    if (config.baseUrl) {
      return config.baseUrl;
    }
  } catch {
    // Config file doesn't exist or is invalid, fall back to env var
  }
  
  // Fall back to environment variable or default
  return BASE_URL;
}

async function getExcludedSlugs(): Promise<Set<string>> {
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(EXCLUSIONS_FILE_PATH, "utf-8");
    const data = JSON.parse(content);
    return new Set(data.slugs || []);
  } catch {
    // File doesn't exist, return empty set
    return new Set();
  }
}

async function handlePreview(page: number, limit: number) {
  const currentBaseUrl = await getBaseUrl();
  const excludedSlugs = await getExcludedSlugs();
  
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
      url: `${currentBaseUrl}/en${pagePath}`,
      type: "static",
      lastModified: new Date().toISOString(),
      priority: 1.0,
    });
  }

  // Product pages
  for (const product of products) {
    const slug = product.slug?.en;
    if (!slug) continue;
    if (excludedSlugs.has(`products/${slug}`)) continue;
    entries.push({
      url: `${currentBaseUrl}/en/products/${slug}`,
      type: "product",
      lastModified: product.updated_at ? new Date(product.updated_at).toISOString() : null,
      priority: 0.8,
    });
  }

  // Category pages
  for (const category of categories) {
    const slug = category.slug?.en;
    if (!slug) continue;
    if (excludedSlugs.has(`categories/${slug}`)) continue;
    entries.push({
      url: `${currentBaseUrl}/en/categories/${slug}`,
      type: "category",
      lastModified: new Date().toISOString(),
      priority: 0.7,
    });
  }

  // Blog post pages
  for (const post of blogPosts) {
    const slug = post.slug?.en;
    if (!slug) continue;
    if (excludedSlugs.has(`blog/${slug}`)) continue;
    entries.push({
      url: `${currentBaseUrl}/en/blog/${slug}`,
      type: "blog_post",
      lastModified: post.updated_at ? new Date(post.updated_at).toISOString() : null,
      priority: 0.6,
    });
  }

  // Blog category pages
  for (const cat of blogCategories) {
    const slug = cat.slug?.en;
    if (!slug) continue;
    if (excludedSlugs.has(`blog/category/${slug}`)) continue;
    entries.push({
      url: `${currentBaseUrl}/en/blog/category/${slug}`,
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

async function handleGetConfig() {
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(CONFIG_FILE_PATH, "utf-8");
    const config = JSON.parse(content);
    return NextResponse.json(config);
  } catch {
    // Return default config if file doesn't exist
    return NextResponse.json({
      baseUrl: BASE_URL,
      lastGenerated: null,
      isAutoDetected: !process.env.NEXT_PUBLIC_SITE_URL,
    });
  }
}

async function handleSetUrl(req: NextRequest) {
  try {
    const body = await req.json();
    const { baseUrl } = body;

    if (!baseUrl || typeof baseUrl !== "string") {
      return NextResponse.json({ error: "Invalid baseUrl" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(baseUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const config = {
      baseUrl,
      lastGenerated: new Date().toISOString(),
      isAutoDetected: false,
    };

    const fs = await import("fs/promises");
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");

    // Revalidate sitemap
    revalidatePath("/sitemap.xml", "page");
    revalidatePath("/admin/sitemap", "page");

    return NextResponse.json({ success: true, config });
  } catch {
    return NextResponse.json({ error: "Failed to set URL" }, { status: 500 });
  }
}

async function handleAutoGenerate() {
  try {
    // Auto-detect base URL from request headers or use environment variable
    const detectedUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_BASE_URL;

    const config = {
      baseUrl: detectedUrl,
      lastGenerated: new Date().toISOString(),
      isAutoDetected: true,
    };

    const fs = await import("fs/promises");
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");

    // Revalidate sitemap
    revalidatePath("/sitemap.xml", "page");
    revalidatePath("/admin/sitemap", "page");

    return NextResponse.json({ success: true, config });
  } catch {
    return NextResponse.json({ error: "Failed to auto-generate" }, { status: 500 });
  }
}

async function handleClean() {
  try {
    const fs = await import("fs/promises");
    
    // Remove config file
    try {
      await fs.unlink(CONFIG_FILE_PATH);
    } catch {
      // File might not exist, that's ok
    }

    // Remove exclusions file
    try {
      await fs.unlink(EXCLUSIONS_FILE_PATH);
    } catch {
      // File might not exist, that's ok
    }

    // Revalidate sitemap to force regeneration with default
    revalidatePath("/sitemap.xml", "page");
    revalidatePath("/admin/sitemap", "page");

    return NextResponse.json({ success: true, message: "Sitemap cache cleaned" });
  } catch {
    return NextResponse.json({ error: "Failed to clean" }, { status: 500 });
  }
}
