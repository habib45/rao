import type { Product, LocaleCode } from "@/types/domain";
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
  gwGetRelatedProducts,
} from "@/lib/api/gateway";

export async function getFeaturedProducts(): Promise<Product[]> {
  return gwGetFeaturedProducts();
}

export async function getProductsByCategory(
  categoryId: string,
): Promise<Product[]> {
  return gwGetProductsByCategory(categoryId);
}

export async function getProductsByCategoryLimit(
  categoryId: string,
  limit: number,
): Promise<Product[]> {
  return gwGetProductsByCategoryLimit(categoryId, limit);
}

export async function getProductBySlug(
  slug: string,
  locale: LocaleCode,
): Promise<Product | null> {
  return gwGetProductBySlug(slug, locale);
}

export async function getAllProducts(): Promise<Product[]> {
  return gwGetAllProducts();
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
  return gwGetProductsFiltered(params);
}

export async function getProductFilterMeta(): Promise<{ brands: string[] }> {
  return gwGetProductFilterMeta();
}

export async function getProductFilterMetaByCategory(
  categoryId: string,
): Promise<{ brands: string[] }> {
  return gwGetProductFilterMetaByCategory(categoryId);
}

export async function searchProducts(
  query: string,
  locale: LocaleCode,
  page: number = 1,
  pageSize: number = 12,
): Promise<{ products: Product[]; total: number }> {
  return gwSearchProducts(query, locale, page, pageSize);
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4,
): Promise<Product[]> {
  if (!categoryId) return [];
  return gwGetRelatedProducts(productId, categoryId, limit);
}
