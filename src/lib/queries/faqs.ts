import type { ProductFAQ } from "@/types/domain";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function getProductFAQs(productId: string): Promise<ProductFAQ[]> {
  const res = await fetch(`${MYSQL_API_URL}/api/products/${productId}/faqs`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json() as Promise<ProductFAQ[]>;
}
