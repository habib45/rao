import { createServerClient } from "@/lib/supabase/server";
import type { Product, LocaleCode } from "@/types/domain";
import { DATA_SOURCE } from "@/lib/config/datasource";
import {
  gwGetFeaturedProducts,
  gwGetProductsByCategory,
  gwGetProductsByCategoryLimit,
  gwGetProductBySlug,
  gwGetAllProducts,
  gwGetProductsFiltered,
  gwGetProductFilterMeta,
  gwGetProductFilterMetaByCategory,
  gwSearchProducts,
} from "@/lib/api/gateway";

export async function getFeaturedProducts(): Promise<Product[]> {
  if (DATA_SOURCE === "mysql") return gwGetFeaturedProducts();

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("getFeaturedProducts error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Product[];
}

export async function getProductsByCategory(
  categoryId: string,
): Promise<Product[]> {
  if (DATA_SOURCE === "mysql") return gwGetProductsByCategory(categoryId);

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProductsByCategory error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Product[];
}

export async function getProductsByCategoryLimit(
  categoryId: string,
  limit: number,
): Promise<Product[]> {
  if (DATA_SOURCE === "mysql")
    return gwGetProductsByCategoryLimit(categoryId, limit);

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getProductsByCategoryLimit error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Product[];
}

export async function getProductBySlug(
  slug: string,
  locale: LocaleCode,
): Promise<Product | null> {
  if (DATA_SOURCE === "mysql") return gwGetProductBySlug(slug, locale);

  const supabase = await createServerClient();

  // Query using the JSONB slug field for the given locale
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_active", true)
    .filter(`slug->>en`, "eq", slug)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    // Try other locales as fallback
    const { data: fallback } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("is_active", true)
      .or(`slug->>${locale}.eq.${slug},slug->>en.eq.${slug}`)
      .limit(1)
      .maybeSingle();

    return (fallback as unknown as Product) ?? null;
  }

  return data as unknown as Product;
}

export async function getAllProducts(): Promise<Product[]> {
  if (DATA_SOURCE === "mysql") return gwGetAllProducts();

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllProducts error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Product[];
}

export type ProductSortOrder = "newest" | "price_asc" | "price_desc";

export interface ProductFilterParams {
  categoryIds?: string[];
  minPriceCents?: number;
  maxPriceCents?: number;
  brands?: string[];
  onlySale?: boolean;
  onlyNew?: boolean;
  sort?: ProductSortOrder;
  page?: number;
  pageSize?: number;
}

export async function getProductsFiltered(
  params: ProductFilterParams,
): Promise<{ products: Product[]; total: number }> {
  if (DATA_SOURCE === "mysql") return gwGetProductsFiltered(params);

  const {
    categoryIds,
    minPriceCents,
    maxPriceCents,
    brands,
    onlySale,
    onlyNew,
    sort = "newest",
    page = 1,
    pageSize = 16,
  } = params;

  const supabase = await createServerClient();
  let query = supabase
    .from("products")
    .select("*, product_images(*)", { count: "exact" })
    .eq("is_active", true);

  if (categoryIds && categoryIds.length > 0) {
    query = query.in("category_id", categoryIds);
  }
  if (minPriceCents !== undefined) {
    query = query.gte("price_cents", minPriceCents);
  }
  if (maxPriceCents !== undefined) {
    query = query.lte("price_cents", maxPriceCents);
  }
  if (brands && brands.length > 0) {
    query = query.in("brand", brands);
  }
  if (onlySale) {
    query = query.gt("discount_pct", 0);
  }
  if (onlyNew) {
    query = query.eq("is_featured", true);
  }

  switch (sort) {
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    console.error("getProductsFiltered error:", error.message);
    return { products: [], total: 0 };
  }

  return {
    products: (data ?? []) as unknown as Product[],
    total: count ?? 0,
  };
}

export async function getProductFilterMeta(): Promise<{ brands: string[] }> {
  if (DATA_SOURCE === "mysql") return gwGetProductFilterMeta();

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("products")
    .select("brand")
    .eq("is_active", true)
    .not("brand", "is", null);

  const brands = [...new Set((data ?? []).map((p) => p.brand as string))]
    .filter(Boolean)
    .sort();

  return { brands };
}

export async function getProductFilterMetaByCategory(
  categoryId: string,
): Promise<{ brands: string[] }> {
  if (DATA_SOURCE === "mysql")
    return gwGetProductFilterMetaByCategory(categoryId);

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("products")
    .select("brand")
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .not("brand", "is", null);

  const brands = [...new Set((data ?? []).map((p) => p.brand as string))]
    .filter(Boolean)
    .sort();

  return { brands };
}

export async function searchProducts(
  query: string,
  locale: LocaleCode,
  page: number = 1,
  pageSize: number = 12,
): Promise<{ products: Product[]; total: number }> {
  if (DATA_SOURCE === "mysql")
    return gwSearchProducts(query, locale, page, pageSize);

  const supabase = await createServerClient();

  const vectorColumn =
    locale === "bn-BD"
      ? "search_vector_bn"
      : locale === "sv"
        ? "search_vector_sv"
        : "search_vector_en";

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("products")
    .select("*, product_images(*)", { count: "exact" })
    .eq("is_active", true)
    .textSearch(vectorColumn, query, { type: "plain" })
    .range(from, to);

  if (error) {
    console.error("searchProducts error:", error.message);
    return { products: [], total: 0 };
  }

  return {
    products: (data ?? []) as unknown as Product[],
    total: count ?? 0,
  };
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4,
): Promise<Product[]> {
  if (!categoryId) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .neq("id", productId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRelatedProducts error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Product[];
}
