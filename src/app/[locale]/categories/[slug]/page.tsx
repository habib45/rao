import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";
import { getCategoryBySlug } from "@/lib/queries/categories";
import {
  getProductsFiltered,
  getProductFilterMetaByCategory,
  type ProductSortOrder,
} from "@/lib/queries/products";
import { getSiteSettings } from "@/lib/queries/settings";
import ProductCard from "@/components/ProductCard";
import { Link } from "@/i18n/routing";
import SidebarFilters from "@/app/[locale]/products/_components/SidebarFilters";
import SortSelect from "@/app/[locale]/products/_components/SortSelect";
import Pagination from "@/app/[locale]/products/_components/Pagination";

export const revalidate = 3600;

const PAGE_SIZE = 16;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const sp = await searchParams;
  const loc = locale as LocaleCode;
  const category = await getCategoryBySlug(slug, loc);
  if (!category) return { title: "Category Not Found" };

  const name = t(category.name, loc) as string;
  const description = t(category.description, loc) as string;
  const metaDescription = description || `Browse the best ${name} products on RaoFinds — curated Amazon deals and reviews.`;

  const enSlug = t(category.slug, "en") as string;
  const bnSlug = t(category.slug, "bn-BD") as string;
  const svSlug = t(category.slug, "sv") as string;

  const hasFilters = !!(
    sp.brand ||
    sp.minPrice ||
    sp.maxPrice ||
    sp.sale ||
    sp.new ||
    (sp.sort && sp.sort !== "newest")
  );

  return {
    title: name,
    description: metaDescription,
    alternates: {
      canonical: `/${locale}/categories/${slug}`,
      languages: {
        en: `/en/categories/${enSlug}`,
        "bn-BD": `/bn-BD/categories/${bnSlug}`,
        sv: `/sv/categories/${svSlug}`,
      },
    },
    openGraph: {
      type: "website",
      title: name,
      description: metaDescription,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/categories/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: metaDescription,
    },
    ...(hasFilters && { robots: { index: false, follow: true } }),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  const loc = locale as LocaleCode;
  setRequestLocale(locale);

  const category = await getCategoryBySlug(slug, loc);
  if (!category) notFound();

  const sp = await searchParams;
  const sort = (sp.sort as ProductSortOrder) ?? "newest";
  const page = Math.max(1, Number(sp.page ?? 1));
  const minPriceCents = sp.minPrice ? Number(sp.minPrice) * 100 : undefined;
  const maxPriceCents = sp.maxPrice ? Number(sp.maxPrice) * 100 : undefined;
  const brands = sp.brand
    ? Array.isArray(sp.brand)
      ? sp.brand
      : [sp.brand]
    : undefined;
  const onlySale = sp.sale === "1";
  const onlyNew = sp.new === "1";

  const [{ products, total }, { brands: allBrands }, { showPrice }] = await Promise.all([
    getProductsFiltered({
      categoryIds: [category.id],
      minPriceCents,
      maxPriceCents,
      brands,
      onlySale,
      onlyNew,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    getProductFilterMetaByCategory(category.id),
    getSiteSettings(),
  ]);

  const name = t(category.name, loc) as string;
  const description = t(category.description, loc) as string;
  const from = Math.min((page - 1) * PAGE_SIZE + 1, total);
  const to = Math.min(page * PAGE_SIZE, total);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const canonicalUrl = `${siteUrl}/${locale}/categories/${slug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Products", item: `${siteUrl}/${locale}/products` },
      { "@type": "ListItem", position: 3, name, item: canonicalUrl },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description: description || `Browse the best ${name} products on RaoFinds — curated Amazon deals and reviews.`,
    url: canonicalUrl,
  };

  return (
    <div className="bg-surface min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-brand transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-brand transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{name}</span>
        </nav>

        <h1 className="text-2xl font-bold text-foreground">{name}</h1>
        {description && (
          <p className="mt-1 mb-6 text-sm text-muted max-w-2xl">{description}</p>
        )}
        {!description && <div className="mb-6" />}

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <Suspense>
              <SidebarFilters
                categories={[]}
                brands={allBrands}
                locale={loc}
                hideCategories
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
                  href={`/categories/${slug}`}
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
                    categoryName={name}
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
