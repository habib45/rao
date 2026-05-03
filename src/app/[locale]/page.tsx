import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { LocaleCode, Category, Product } from "@/types/domain";
import {
  getFeaturedProducts,
  getProductsByCategoryLimit,
} from "@/lib/queries/products";
import { getActiveCategories } from "@/lib/queries/categories";
import { getSiteSettings } from "@/lib/queries/settings";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import { Link } from "@/i18n/routing";
import { t } from "@/lib/i18n/translate";

export const revalidate = 3600;

const homeTitles: Record<string, string> = {
  en: "RaoFinds — Best Products on Amazon",
  "bn-BD": "RaoFinds — Amazon-এ সেরা পণ্য",
  sv: "RaoFinds — Bästa produkterna på Amazon",
};

const homeDescriptions: Record<string, string> = {
  en: "Discover the best products on Amazon — curated deals, honest reviews, and comparisons of trusted products at the best prices.",
  "bn-BD": "Amazon-এ সেরা পণ্য খুঁজুন — নির্বাচিত ডিল, সৎ রিভিউ এবং বিশ্বস্ত পণ্যের তুলনা সেরা দামে।",
  sv: "Upptäck de bästa produkterna på Amazon — utvalda erbjudanden, ärliga recensioner och jämförelser av pålitliga produkter till bästa pris.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const title = homeTitles[locale] ?? homeTitles.en;
  const description = homeDescriptions[locale] ?? homeDescriptions.en;

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        "bn-BD": "/bn-BD",
        sv: "/sv",
      },
    },
    openGraph: {
      type: "website",
      url: `${siteUrl}/${locale}`,
      siteName: "RaoFinds",
      title,
      description,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "RaoFinds" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

type HeroCopy = {
  tagline: string;
  description: string;
  shopNow: string;
};

type PromoCopy = {
  title: string;
  description: string;
  explore: string;
};

type FeaturedCopy = {
  title: string;
};

function getHeroCopy(locale: LocaleCode): HeroCopy {
  if (locale === "bn-BD") {
    return {
      tagline: "Amazon-এ সেরা পণ্যগুলি আবিষ্কার করুন",
      description:
        "নির্বাচিত ডিল, সৎ রিভিউ এবং সেরা দামে বিশ্বস্ত পণ্যের তুলনা।",
      shopNow: "এখনই কিনুন",
    };
  }
  if (locale === "sv") {
    return {
      tagline: "Upptäck de bästa produkterna på Amazon",
      description:
        "Utvalda erbjudanden, ärliga recensioner och jämförelser av pålitliga produkter till bästa pris.",
      shopNow: "Handla nu",
    };
  }
  return {
    tagline: "Discover the best products on Amazon",
    description:
      "Curated deals, honest reviews, and comparisons of trusted products at the best prices.",
    shopNow: "Shop now",
  };
}

function getPromoCopy(locale: LocaleCode): PromoCopy {
  if (locale === "bn-BD") {
    return {
      title: "বিশেষ অফারের মরসুম",
      description: "শীর্ষ পণ্যে সর্বোচ্চ ৫০% পর্যন্ত সাশ্রয় করুন।",
      explore: "অফার দেখুন",
    };
  }
  if (locale === "sv") {
    return {
      title: "Säsongens bästa erbjudanden",
      description: "Spara upp till 50% på topprodukter.",
      explore: "Utforska",
    };
  }
  return {
    title: "Seasonal Special Offers",
    description: "Save up to 50% on top-rated products.",
    explore: "Explore deals",
  };
}

function getFeaturedCopy(locale: LocaleCode): FeaturedCopy {
  if (locale === "bn-BD") return { title: "বৈশিষ্ট্যযুক্ত পণ্য" };
  if (locale === "sv") return { title: "Utvalda produkter" };
  return { title: "Featured Products" };
}

function SectionHeader({
  title,
  href,
  viewAllLabel,
}: {
  title: string;
  href: string;
  viewAllLabel: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          {title}
        </h2>
        <div className="mt-2 h-1 w-12 rounded-full bg-brand" />
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-dark"
      >
        {viewAllLabel}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function CategoryProductsSection({
  category,
  products,
  locale,
  viewAllLabel,
  showPrice,
}: {
  category: Category;
  products: Product[];
  locale: LocaleCode;
  viewAllLabel: string;
  showPrice: boolean;
}) {
  if (products.length === 0) return null;

  const categoryName = t(category.name, locale) as string;
  const categorySlug = t(category.slug, locale) as string;

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={categoryName}
          href={`/categories/${categorySlug}`}
          viewAllLabel={viewAllLabel}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              categoryName={categoryName}
              showPrice={showPrice}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as LocaleCode;
  setRequestLocale(locale);

  const tCommon = await getTranslations("common");

  const [featuredProducts, categories, siteSettings] = await Promise.all([
    getFeaturedProducts(),
    getActiveCategories(),
    getSiteSettings(),
  ]);
  const { showPrice } = siteSettings;

  const topCategories = categories.slice(0, 3);
  const categoryProductLists = await Promise.all(
    topCategories.map((c) => getProductsByCategoryLimit(c.id, 4)),
  );

  const hero = getHeroCopy(loc);
  const promo = getPromoCopy(loc);
  const featured = getFeaturedCopy(loc);
  const viewAllLabel = tCommon("view_all");

  // Build category -> name lookup for tagging cards in the Featured section
  const categoryNameById = new Map<string, string>();
  for (const c of categories) {
    categoryNameById.set(c.id, t(c.name, loc) as string);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": `${siteUrl}/#website`,
                url: siteUrl,
                name: "RaoFinds",
                description: hero.description,
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${siteUrl}/${loc}/search?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                "@id": `${siteUrl}/#organization`,
                name: "RaoFinds",
                url: siteUrl,
              },
            ],
          }),
        }}
      />
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand to-brand-dark">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
          <div className="max-w-lg text-white">
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              {hero.tagline}
            </h1>
            <p className="mt-4 text-base text-white/90 sm:text-lg">
              {hero.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-brand transition-colors hover:bg-gray-100"
              >
                {hero.shopNow}
              </Link>
              <div className="min-w-[16rem] max-w-md flex-1">
                <SearchBar />
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hidden items-center gap-4 lg:flex"
          >
            <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-white/20 text-sm text-white/50 backdrop-blur-sm">
              IMG
            </div>
            <div className="mt-10 flex h-36 w-36 items-center justify-center rounded-2xl bg-white/15 text-sm text-white/50 backdrop-blur-sm">
              IMG
            </div>
          </div>
        </div>
      </section>

      {/* Category Icons Row */}
      {categories.length > 0 && (
        <section className="border-b border-border bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 overflow-x-auto pb-2">
              {categories.map((category) => {
                const name = t(category.name, loc) as string;
                const slug = t(category.slug, loc) as string;
                return (
                  <Link
                    key={category.id}
                    href={`/categories/${slug}`}
                    className="group flex min-w-[72px] flex-col items-center gap-2"
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-brand/10 transition-colors group-hover:border-brand">
                      {category.image_url ? (
                        <Image
                          src={category.image_url}
                          alt={name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-brand">
                          {name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="whitespace-nowrap text-xs font-medium text-foreground transition-colors group-hover:text-brand">
                      {name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="bg-surface py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title={featured.title}
              href="/products"
              viewAllLabel={viewAllLabel}
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {featuredProducts.map((product) => (
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
          </div>
        </section>
      )}

      {/* Promotional Banner */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-gradient-to-r from-brand-dark to-brand p-8 text-white sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-bold sm:text-2xl">{promo.title}</h3>
              <p className="mt-2 text-white/80">{promo.description}</p>
            </div>
            <Link
              href="/products"
              className="whitespace-nowrap rounded-lg bg-white px-6 py-3 font-semibold text-brand transition-colors hover:bg-gray-50"
            >
              {promo.explore}
            </Link>
          </div>
        </div>
      </section>

      {/* Category product sections */}
      {topCategories.map((category, idx) => (
        <CategoryProductsSection
          key={category.id}
          category={category}
          products={categoryProductLists[idx]}
          locale={loc}
          viewAllLabel={viewAllLabel}
          showPrice={showPrice}
        />
      ))}
    </div>
  );
}
