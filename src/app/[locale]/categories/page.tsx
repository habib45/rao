import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { LocaleCode } from "@/types/domain";
import { getActiveCategories } from "@/lib/queries/categories";
import CategoryCard from "@/components/CategoryCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "All Categories",
    "bn-BD": "সব বিভাগ",
    sv: "Alla kategorier",
  };
  return { title: titles[locale] ?? titles.en };
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as LocaleCode;
  setRequestLocale(locale);

  const t = await getTranslations("nav");
  const categories = await getActiveCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        {t("categories")}
      </h1>

      {categories.length === 0 ? (
        <p className="text-muted">No categories found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              locale={loc}
            />
          ))}
        </div>
      )}
    </div>
  );
}
