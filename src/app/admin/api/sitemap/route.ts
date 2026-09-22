import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/app/admin/_lib/with-admin";
import { revalidatePath } from "next/cache";
import {
  gwGetAllProducts,
  gwGetActiveCategories,
  gwGetPublishedBlogPosts,
  gwGetActiveBlogCategories,
} from "@/lib/api/gateway";
import { SITEMAP_STATIC_PAGES, isSafeBaseUrl } from "@/lib/sitemap/utils";
import {
  SITEMAP_CONFIG_PATH,
  SITEMAP_EXCLUSIONS_PATH,
  writeSitemapFile,
} from "@/lib/sitemap/storage";

const DEFAULT_BASE_URL = "https://raofinds.com";
const BASE_URL = isSafeBaseUrl(process.env.PUBLIC_SITEMAP_URL)
  ? process.env.PUBLIC_SITEMAP_URL
  : DEFAULT_BASE_URL;


type PreviewEntry = {
  url: string;
  type: string;
  lastModified: string | null;
  priority: number;
};

export const GET = withAdmin(async (req: NextRequest) => {
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
});

export const POST = withAdmin(async (req: NextRequest) => {
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
});

async function getBaseUrl(): Promise<string> {
  // Try to read from config file first
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(SITEMAP_CONFIG_PATH, "utf-8");
    const config = JSON.parse(content);
    if (isSafeBaseUrl(config.baseUrl)) {
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
    const content = await fs.readFile(SITEMAP_EXCLUSIONS_PATH, "utf-8");
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

  // Static pages — same list the public sitemap emits, so admin totals and
  // exclusion controls cover every generated entry.
  for (const staticPage of SITEMAP_STATIC_PAGES) {
    entries.push({
      url: `${currentBaseUrl}/en${staticPage.path}`,
      type: "static",
      lastModified: new Date().toISOString(),
      priority: staticPage.priority,
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
    const content = await fs.readFile(SITEMAP_CONFIG_PATH, "utf-8");
    const config = JSON.parse(content);
    return NextResponse.json(config);
  } catch {
    // Return default config if file doesn't exist
    return NextResponse.json({
      baseUrl: BASE_URL,
      lastGenerated: null,
      isAutoDetected: !process.env.PUBLIC_SITEMAP_URL,
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

    if (!isSafeBaseUrl(baseUrl)) {
      return NextResponse.json(
        { error: "Base URL must be an absolute http(s) URL" },
        { status: 400 }
      );
    }

    const config = {
      baseUrl,
      lastGenerated: new Date().toISOString(),
      isAutoDetected: false,
    };

    await writeSitemapFile(SITEMAP_CONFIG_PATH, config);

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
    const detectedUrl = BASE_URL;

    const config = {
      baseUrl: detectedUrl,
      lastGenerated: new Date().toISOString(),
      isAutoDetected: true,
    };

    await writeSitemapFile(SITEMAP_CONFIG_PATH, config);

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
      await fs.unlink(SITEMAP_CONFIG_PATH);
    } catch {
      // File might not exist, that's ok
    }

    // Remove exclusions file
    try {
      await fs.unlink(SITEMAP_EXCLUSIONS_PATH);
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
