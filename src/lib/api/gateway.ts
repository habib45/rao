/**
 * HTTP client for the local MySQL / Express API gateway.
 * Only used when DATA_SOURCE=mysql.
 * Each function mirrors a query in src/lib/queries/ and returns the same
 * domain types so the rest of the app needs zero changes.
 */

import { MYSQL_API_URL, MYSQL_API_SECRET } from "@/lib/config/datasource";
import type {
  Product,
  ProductImage,
  Category,
  BlogPost,
  BlogCategory,
  BlogTag,
  LocaleCode,
} from "@/types/domain";
import type { ProductFilterParams } from "@/lib/queries/products";
import type { SiteSettings } from "@/lib/queries/settings";

// ── Internal fetch helper ─────────────────────────────────────

type Params = Record<string, string | number | boolean | undefined | null>;

async function gw<T>(
  path: string,
  params?: Params,
  adminAuth = false,
): Promise<T> {
  const url = new URL(MYSQL_API_URL + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const headers: Record<string, string> = {};
  if (adminAuth) headers["x-api-key"] = MYSQL_API_SECRET;

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(
      `Gateway ${path} failed: ${res.status} ${await res.text()}`,
    );
  }
  return res.json() as Promise<T>;
}

// ── Shape adapters ────────────────────────────────────────────

// Products list endpoint returns primary_image_url instead of product_images[]
function adaptProductRow(row: Record<string, unknown>): Product {
  const primaryUrl = row.primary_image_url as string | null;
  const { primary_image_url: _drop, ...rest } = row;
  void _drop;
  return {
    ...(rest as unknown as Product),
    product_images: primaryUrl
      ? ([
          {
            id: "",
            url: primaryUrl,
            alt_text: {},
            width: null,
            height: null,
            sort_order: 0,
            is_primary: true,
          },
        ] as ProductImage[])
      : [],
  };
}

// Product detail endpoint returns images[] instead of product_images[]
function adaptProductDetail(row: Record<string, unknown>): Product {
  const images = ((row.images as ProductImage[] | null) ?? []).filter(
    (img) => img?.url,
  );
  const { images: _drop, ...rest } = row;
  void _drop;
  return { ...(rest as unknown as Product), product_images: images };
}

// Blog post from gateway has tags:BlogTag[] instead of blog_post_tags
function adaptBlogPost(row: Record<string, unknown>): BlogPost {
  const tags = (row.tags as BlogTag[]) ?? [];
  const { tags: _drop, ...rest } = row;
  void _drop;
  return {
    ...(rest as unknown as BlogPost),
    blog_post_tags: tags.map((t) => ({ blog_tags: t })),
  };
}

// ── Categories ────────────────────────────────────────────────

export async function gwGetActiveCategories(): Promise<Category[]> {
  try {
    return await gw<Category[]>("/api/categories");
  } catch (e) {
    console.error("gwGetActiveCategories:", e);
    return [];
  }
}

export async function gwGetCategoryBySlug(
  slug: string,
  locale: LocaleCode,
): Promise<Category | null> {
  try {
    const cats = await gw<Category[]>("/api/categories");
    return (
      cats.find((c) => {
        const s = c.slug as Record<string, string>;
        return s[locale] === slug || s["en"] === slug;
      }) ?? null
    );
  } catch (e) {
    console.error("gwGetCategoryBySlug:", e);
    return null;
  }
}

// ── Products ──────────────────────────────────────────────────

export async function gwGetFeaturedProducts(): Promise<Product[]> {
  try {
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/products",
      { is_featured: "true", is_active: "true", limit: 8 },
    );
    return data.map(adaptProductRow);
  } catch (e) {
    console.error("gwGetFeaturedProducts:", e);
    return [];
  }
}

export async function gwGetProductsByCategory(
  categoryId: string,
): Promise<Product[]> {
  try {
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/products",
      { category_id: categoryId, is_active: "true", limit: 1000 },
    );
    return data.map(adaptProductRow);
  } catch (e) {
    console.error("gwGetProductsByCategory:", e);
    return [];
  }
}

export async function gwGetProductsByCategoryLimit(
  categoryId: string,
  limit: number,
): Promise<Product[]> {
  try {
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/products",
      { category_id: categoryId, is_active: "true", limit },
    );
    return data.map(adaptProductRow);
  } catch (e) {
    console.error("gwGetProductsByCategoryLimit:", e);
    return [];
  }
}

export async function gwGetProductBySlug(
  slug: string,
  locale: LocaleCode,
): Promise<Product | null> {
  try {
    // Gateway supports ?slug=X&locale=Y for a JSON slug match
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/products",
      { slug, locale, is_active: "true", limit: 1 },
    );
    const found = data[0];
    if (!found) return null;
    // Fetch detail with full images array
    const detail = await gw<Record<string, unknown>>(
      `/api/products/${found.id as string}`,
    );
    return adaptProductDetail(detail);
  } catch (e) {
    console.error("gwGetProductBySlug:", e);
    return null;
  }
}

export async function gwGetAllProducts(): Promise<Product[]> {
  try {
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/products",
      { is_active: "true", limit: 1000 },
    );
    return data.map(adaptProductRow);
  } catch (e) {
    console.error("gwGetAllProducts:", e);
    return [];
  }
}

export async function gwGetProductsFiltered(
  params: ProductFilterParams,
): Promise<{ products: Product[]; total: number }> {
  try {
    const {
      categoryIds,
      minPriceCents,
      maxPriceCents,
      brands,
      onlySale,
      sort = "newest",
      page = 1,
      pageSize = 16,
    } = params;

    const offset = (page - 1) * pageSize;
    const queryParams: Params = {
      is_active: "true",
      limit: pageSize,
      offset,
    };

    // Gateway supports single category_id; for multi we take the first
    if (categoryIds && categoryIds.length === 1) {
      queryParams.category_id = categoryIds[0];
    }
    if (minPriceCents !== undefined) queryParams.min_price = minPriceCents;
    if (maxPriceCents !== undefined) queryParams.max_price = maxPriceCents;
    if (brands && brands.length === 1) queryParams.brand = brands[0];
    if (onlySale) queryParams.on_sale = "true";
    if (sort === "price_asc") queryParams.sort = "price_asc";
    if (sort === "price_desc") queryParams.sort = "price_desc";

    const { data, total } = await gw<{
      data: Record<string, unknown>[];
      total: number;
    }>("/api/products", queryParams);

    return { products: data.map(adaptProductRow), total };
  } catch (e) {
    console.error("gwGetProductsFiltered:", e);
    return { products: [], total: 0 };
  }
}

export async function gwGetProductFilterMeta(): Promise<{ brands: string[] }> {
  try {
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/products",
      { is_active: "true", limit: 1000 },
    );
    const brands = [
      ...new Set(
        data.map((p) => p.brand as string).filter((b) => b != null && b !== ""),
      ),
    ].sort();
    return { brands };
  } catch (e) {
    console.error("gwGetProductFilterMeta:", e);
    return { brands: [] };
  }
}

export async function gwGetProductFilterMetaByCategory(
  categoryId: string,
): Promise<{ brands: string[] }> {
  try {
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/products",
      { category_id: categoryId, is_active: "true", limit: 1000 },
    );
    const brands = [
      ...new Set(
        data.map((p) => p.brand as string).filter((b) => b != null && b !== ""),
      ),
    ].sort();
    return { brands };
  } catch (e) {
    console.error("gwGetProductFilterMetaByCategory:", e);
    return { brands: [] };
  }
}

export async function gwSearchProducts(
  query: string,
  locale: LocaleCode,
  page = 1,
  pageSize = 12,
): Promise<{ products: Product[]; total: number }> {
  try {
    const { data, total } = await gw<{
      data: Record<string, unknown>[];
      total: number;
    }>("/api/products", {
      search: query,
      locale,
      is_active: "true",
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return { products: data.map(adaptProductRow), total };
  } catch (e) {
    console.error("gwSearchProducts:", e);
    return { products: [], total: 0 };
  }
}

// ── Blog ──────────────────────────────────────────────────────

export async function gwGetPublishedBlogPosts(
  limit = 20,
  offset = 0,
  categoryId?: string,
  search?: string,
): Promise<BlogPost[]> {
  try {
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/blog/posts",
      { status: "published", category_id: categoryId, search, limit, offset },
    );
    return data.map(adaptBlogPost);
  } catch (e) {
    console.error("gwGetPublishedBlogPosts:", e);
    return [];
  }
}

export async function gwGetFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
  try {
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/blog/posts",
      { status: "published", is_featured: "true", limit },
    );
    return data.map(adaptBlogPost);
  } catch (e) {
    console.error("gwGetFeaturedBlogPosts:", e);
    return [];
  }
}

export async function gwGetTrendingBlogPosts(limit = 5): Promise<BlogPost[]> {
  try {
    // Gateway returns posts ordered by published_at by default; view_count sort added via sort param
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/blog/posts",
      { status: "published", sort: "views", limit },
    );
    return data.map(adaptBlogPost);
  } catch (e) {
    console.error("gwGetTrendingBlogPosts:", e);
    return [];
  }
}

export async function gwGetBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  try {
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/blog/posts",
      { status: "published", slug, limit: 1 },
    );
    const found = data[0];
    if (!found) return null;
    // Fetch detail with tags
    const detail = await gw<Record<string, unknown>>(
      `/api/blog/posts/${found.id as string}`,
    );
    return adaptBlogPost(detail);
  } catch (e) {
    console.error("gwGetBlogPostBySlug:", e);
    return null;
  }
}

export async function gwGetActiveBlogCategories(): Promise<BlogCategory[]> {
  try {
    return await gw<BlogCategory[]>("/api/blog/categories");
  } catch (e) {
    console.error("gwGetActiveBlogCategories:", e);
    return [];
  }
}

export async function gwGetBlogPostsByCategory(
  categoryId: string,
  limit = 12,
): Promise<BlogPost[]> {
  try {
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/blog/posts",
      { status: "published", category_id: categoryId, limit },
    );
    return data.map(adaptBlogPost);
  } catch (e) {
    console.error("gwGetBlogPostsByCategory:", e);
    return [];
  }
}

export async function gwGetBlogCategoryBySlug(
  slug: string,
): Promise<BlogCategory | null> {
  try {
    const cats = await gw<BlogCategory[]>("/api/blog/categories");
    return (
      cats.find((c) => {
        const s = c.slug as Record<string, string>;
        return (
          s["en"] === slug || s["bn-BD"] === slug || s["sv"] === slug
        );
      }) ?? null
    );
  } catch (e) {
    console.error("gwGetBlogCategoryBySlug:", e);
    return null;
  }
}

export async function gwGetRelatedBlogPosts(
  postId: string,
  categoryId: string | null,
  limit = 3,
): Promise<BlogPost[]> {
  try {
    const params: Params = { status: "published", limit: limit + 1 };
    if (categoryId) params.category_id = categoryId;
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/blog/posts",
      params,
    );
    return data
      .filter((p) => p.id !== postId)
      .slice(0, limit)
      .map(adaptBlogPost);
  } catch (e) {
    console.error("gwGetRelatedBlogPosts:", e);
    return [];
  }
}

export async function gwGetRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4,
): Promise<Product[]> {
  try {
    const params: Params = { is_active: "true", limit: limit + 1 };
    if (categoryId) params.category_id = categoryId;
    const { data } = await gw<{ data: Record<string, unknown>[] }>(
      "/api/products",
      params,
    );
    return data
      .filter((p) => p.id !== productId)
      .slice(0, limit)
      .map(adaptProductRow);
  } catch (e) {
    console.error("gwGetRelatedProducts:", e);
    return [];
  }
}

export async function gwGetPublishedBlogPostsCount(
  categoryId?: string,
  search?: string,
): Promise<number> {
  try {
    const params: Params = { status: "published", count: "true" };
    if (categoryId) params.category_id = categoryId;
    if (search) params.search = search;
    const { total } = await gw<{ total: number }>("/api/blog/posts", params);
    return total;
  } catch (e) {
    console.error("gwGetPublishedBlogPostsCount:", e);
    return 0;
  }
}

export async function gwGetApprovedBlogComments(postId: string) {
  try {
    return await gw<{ id: string; author_name: string; body: string; created_at: string }[]>(
      `/api/blog/posts/${postId}/comments`,
      { is_approved: "true" },
    );
  } catch (e) {
    console.error("gwGetApprovedBlogComments:", e);
    return [];
  }
}

export async function gwGetAllPublishedSlugs(): Promise<
  { en: string; "bn-BD"?: string; sv?: string; updated_at: string }[]
> {
  try {
    const posts = await gw<
      { id: string; slug: Record<string, string>; updated_at: string }[]
    >("/api/blog/posts", { status: "published", limit: 1000 });
    return posts.map((p) => ({
      ...(p.slug as { en: string; "bn-BD"?: string; sv?: string }),
      updated_at: p.updated_at,
    }));
  } catch (e) {
    console.error("gwGetAllPublishedSlugs:", e);
    return [];
  }
}

export async function gwGetAllActiveCategorySlugs(): Promise<
  { en: string; "bn-BD"?: string; sv?: string }[]
> {
  try {
    const categories = await gw<{ slug: Record<string, string> }[]>(
      "/api/blog/categories",
    );
    return categories.map((c) => c.slug as { en: string; "bn-BD"?: string; sv?: string });
  } catch (e) {
    console.error("gwGetAllActiveCategorySlugs:", e);
    return [];
  }
}

// ── Settings ──────────────────────────────────────────────────

export async function gwGetComparisonKeys(): Promise<string[]> {
  try {
    const settings = await gw<Record<string, unknown>>(
      "/api/admin/settings",
      undefined,
      true,
    );
    const comparison = settings["comparison"] as { keys?: string[] } | undefined;
    return comparison?.keys ?? [];
  } catch (e) {
    console.error("gwGetComparisonKeys:", e);
    return [];
  }
}

export async function gwGetSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await gw<Record<string, unknown>>(
      "/api/admin/settings",
      undefined,
      true,
    );
    const features = settings["features"] as Record<string, unknown> | undefined;
    return { showPrice: (features?.show_price as boolean) ?? true };
  } catch (e) {
    console.error("gwGetSiteSettings:", e);
    return { showPrice: true };
  }
}
