import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { LocaleCode } from "@/types/domain";
import { searchProducts, getAllProducts } from "@/lib/queries/products";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Search Products",
    "bn-BD": "পণ্য খুঁজুন",
    sv: "Sök produkter",
  };
  return { title: titles[locale] ?? titles.en };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { q, page: pageParam } = await searchParams;
  const loc = locale as LocaleCode;
  setRequestLocale(locale);

  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const query = q?.trim() ?? "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  let products;
  let total: number;

  if (query) {
    const result = await searchProducts(query, loc, page);
    products = result.products;
    total = result.total;
  } else {
    products = await getAllProducts();
    total = products.length;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">
        {tNav("search")}
      </h1>

      <div className="mb-8">
        <SearchBar />
      </div>

      {query && (
        <p className="mb-4 text-sm text-muted">
          {total > 0
            ? `${total} result${total !== 1 ? "s" : ""} for "${query}"`
            : tCommon("no_results")}
        </p>
      )}

      {products.length === 0 ? (
        <p className="text-muted">{tCommon("no_results")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={loc} />
          ))}
        </div>
      )}
    </div>
  );
}
