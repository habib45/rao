import { createServerClient } from "@/lib/supabase/server";
import type { Category, LocaleCode } from "@/types/domain";

export async function getActiveCategories(): Promise<Category[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getActiveCategories error:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Category[];
}

export async function getCategoryBySlug(
  slug: string,
  locale: LocaleCode,
): Promise<Category | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .or(`slug->>${locale}.eq.${slug},slug->>en.eq.${slug}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getCategoryBySlug error:", error.message);
    return null;
  }
  return (data as unknown as Category) ?? null;
}
