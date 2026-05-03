import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import type { Product } from "@/types/domain";

export async function getComparisonCandidates(
  productId: string,
  categoryId: string | null,
  limit = 10,
): Promise<Product[]> {
  if (!categoryId) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .neq("id", productId)
    .limit(limit);

  if (error) {
    console.error("getComparisonCandidates error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Product[];
}
