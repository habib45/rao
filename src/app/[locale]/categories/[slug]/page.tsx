import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { getProductsByCategory } from "@/lib/queries/products";
import ProductCard from "@/components/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug, locale as LocaleCode);
  if (!category) return { title: "Category Not Found" };

  const name = t(category.name, locale as LocaleCode) as string;
  const description = t(category.description, locale as LocaleCode) as string;

  return {
    title: name,
    description: description || `Browse ${name} products on BestFinds`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale as LocaleCode;
  setRequestLocale(locale);

  const category = await getCategoryBySlug(slug, loc);
  if (!category) notFound();

  const products = await getProductsByCategory(category.id);
  const name = t(category.name, loc) as string;
  const description = t(category.description, loc) as string;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-foreground">{name}</h1>
      {description && (
        <p className="mt-2 text-muted max-w-2xl">{description}</p>
      )}

      {products.length === 0 ? (
        <p className="mt-8 text-muted">No products in this category.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={loc} />
          ))}
        </div>
      )}
    </div>
  );
}
