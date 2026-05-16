import type { Category, LocaleCode } from "@/types/domain";
import { gwGetActiveCategories, gwGetCategoryBySlug } from "@/lib/api/gateway";

export async function getActiveCategories(): Promise<Category[]> {
  return gwGetActiveCategories();
}

export async function getCategoryBySlug(
  slug: string,
  locale: LocaleCode,
): Promise<Category | null> {
  return gwGetCategoryBySlug(slug, locale);
}
