import "server-only";
import type { Product } from "@/types/domain";
import { gwGetRelatedProducts } from "@/lib/api/gateway";

export async function getComparisonCandidates(
  productId: string,
  categoryId: string | null,
  limit = 10,
): Promise<Product[]> {
  if (!categoryId) return [];
  return gwGetRelatedProducts(productId, categoryId, limit);
}
