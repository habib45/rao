import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type { LocaleCode } from "@/types/domain";
import {
  getProductsFiltered,
  getProductFilterMeta,
  type ProductSortOrder,
} from "@/lib/queries/products";
import { getActiveCategories } from "@/lib/queries/categories";
import { getSiteSettings } from "@/lib/queries/settings";
import ProductCard from "@/components/ProductCard";
import { Link } from "@/i18n/routing";
import { t } from "@/lib/i18n/translate";
import SidebarFilters from "./_components/SidebarFilters";
import SortSelect from "./_components/SortSelect";
import Pagination from "./_components/Pagination";

export const revalidate = 0;

const PAGE_SIZE = 16;

const titles: Record<string, string> = {
  en: "All Products",
  "bn-BD": "সব পণ্য",
  sv: "Alla produkter",
};

const descriptions: Record<string, string> = {
  en: "Browse all products on BestFinds — curated Amazon deals, honest reviews, and comparisons at the best prices.",
  "bn-BD": "BestFinds-এ সব পণ্য দেখুন — নির্বাচিত Amazon ডিল, সৎ রিভিউ এবং সেরা দামে তুলনা।",
  sv: "Bläddra bland alla produkter på BestFinds — utvalda Amazon-erbjudanden, ärliga recensioner och jämförelser.",
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;

  const hasFilters = !!(
    sp.cat ||
    sp.brand ||
    sp.minPrice ||
    sp.maxPrice ||
    sp.sale ||
    sp.new ||
    (sp.sort && sp.sort !== "newest")
  );

  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
    ...(hasFilters && { robots: { index: false, follow: true } }),
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const loc = locale as LocaleCode;
  setRequestLocale(locale);

  const sp = await searchParams;

  const categoryIds = sp.cat
    ? Array.isArray(sp.cat)
      ? sp.cat
      : [sp.cat]
    : undefined;
  const brands = sp.brand
    ? Array.isArray(sp.brand)
      ? sp.brand
      : [sp.brand]
    : undefined;
  const sort = (sp.sort as ProductSortOrder) ?? "newest";
  const page = Math.max(1, Number(sp.page ?? 1));
  const minPriceCents = sp.minPrice ? Number(sp.minPrice) * 100 : undefined;
  const maxPriceCents = sp.maxPrice ? Number(sp.maxPrice) * 100 : undefined;
  const onlySale = sp.sale === "1";
  const onlyNew = sp.new === "1";

  const [{ products, total }, categories, { brands: allBrands }, siteSettings] =
    await Promise.all([
      getProductsFiltered({
        categoryIds,
        minPriceCents,
        maxPriceCents,
        brands,
        onlySale,
        onlyNew,
        sort,
        page,
        pageSize: PAGE_SIZE,
      }),
      getActiveCategories(),
      getProductFilterMeta(),
      getSiteSettings(),
    ]);
  const { showPrice } = siteSettings;

  const pageTitle = titles[locale] ?? titles.en;
  const from = Math.min((page - 1) * PAGE_SIZE + 1, total);
  const to = Math.min(page * PAGE_SIZE, total);

  const categoryNameById = new Map<string, string>();
  for (const c of categories) {
    categoryNameById.set(c.id, t(c.name, loc) as string);
  }

  return (
    <div className="bg-surface min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{pageTitle}</span>
        </nav>

        <h1 className="mb-6 text-2xl font-bold text-foreground">{pageTitle}</h1>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <Suspense>
              <SidebarFilters
                categories={categories}
                brands={allBrands}
                locale={loc}
              />
            </Suspense>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted">
                {total === 0
                  ? "No products found"
                  : `Showing ${from}–${to} of ${total} results`}
              </p>
              <Suspense>
                <SortSelect />
              </Suspense>
            </div>

            {products.length === 0 ? (
              <div className="rounded-xl border border-border bg-white py-20 text-center">
                <p className="text-muted">No products match your filters.</p>
                <Link
                  href="/products"
                  className="mt-4 inline-block text-sm font-medium text-brand hover:text-brand-dark"
                >
                  Clear filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={loc}
                    categoryName={
                      product.category_id
                        ? categoryNameById.get(product.category_id)
                        : undefined
                    }
                    showPrice={showPrice}
                  />
                ))}
              </div>
            )}

            <Suspense>
              <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
