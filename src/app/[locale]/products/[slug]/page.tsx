import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";
import { formatPrice } from "@/lib/i18n/format";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products";
import { getSiteSettings, getComparisonKeys } from "@/lib/queries/settings";
import { getComparisonCandidates } from "@/lib/queries/comparison";
import { getProductFAQs } from "@/lib/queries/faqs";
import { normalizeImage, buildProductMetadata } from "@/lib/seo";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import { FAQSchema } from "@/components/schema/FAQSchema";
import { parseContentSegments } from "@/lib/wizard";
import { WizardBlock } from "@/app/[locale]/blog/[slug]/_components/WizardBlock";
// import { ComparisonWizard } from "./_components/ComparisonWizard";
import { ComparisonBlock } from "./_components/ComparisonBlock";
import { ProductGallery } from "./_components/ProductGallery";

export const revalidate = 3600; // ISR: revalidate every hour

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as LocaleCode;
  const product = await getProductBySlug(slug, loc);
  if (!product) return { title: "Product Not Found" };

  const name = t(product.name, loc) as string;
  const description = t(product.description, loc) as string;
  const primaryImage = product.product_images?.find((img) => img.is_primary);

  const metaDescription = description
    ? `${description.slice(0, 140)}... Buy on Amazon at best price.`
    : `Buy ${name} on Amazon at best price. Expert reviews and comparisons.`;

  const ogImage = primaryImage
    ? normalizeImage({
        url: primaryImage.url,
        alt: name,
      })
    : undefined;

  return buildProductMetadata({
    title: (t(product.meta_title, loc) as string) || name,
    description: (t(product.meta_description, loc) as string) || metaDescription,
    path: `/${loc}/products/${t(product.slug, loc)}`,
    image: ogImage,
    price: product.price_cents ? product.price_cents / 100 : undefined,
    currency: product.currency,
    availability: product.availability === "in_stock" ? "in_stock" : "out_of_stock",
    rating: product.rating ?? undefined,
    reviewCount: product.review_count ?? undefined,
  });
}

function ProductJsonLd({
  product,
  locale,
}: {
  product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
  locale: LocaleCode;
}) {
  const name = t(product.name, locale) as string;
  const description = t(product.description, locale) as string;
  const primaryImage = product.product_images?.find((img) => img.is_primary);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: primaryImage?.url,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    ...(product.rating !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.review_count || 1,
        bestRating: 5,
      },
    }),
    ...(product.price_cents !== null && {
      offers: {
        "@type": "Offer",
        price: (product.price_cents / 100).toFixed(2),
        priceCurrency: product.currency,
        availability:
          product.availability === "in_stock"
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        url: product.affiliate_url,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale as LocaleCode;
  setRequestLocale(locale);

  const [product, { showPrice }] = await Promise.all([
    getProductBySlug(slug, loc),
    getSiteSettings(),
  ]);
  if (!product) notFound();

  const [related, _comparisonCandidates, _comparisonKeys, faqs] = await Promise.all([
    getRelatedProducts(product.id, product.category_id, 4),
    getComparisonCandidates(product.id, product.category_id, 10),
    getComparisonKeys(),
    getProductFAQs(product.id),
  ]);

  const tProduct = await getTranslations("product");

  const name = t(product.name, loc) as string;
  const description = t(product.description, loc) as string;
  const productImages = product.product_images ?? [];
  const sortedImages = [...productImages].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${process.env.NEXT_PUBLIC_SITE_URL}/${loc}` },
      { "@type": "ListItem", position: 2, name: "Products", item: `${process.env.NEXT_PUBLIC_SITE_URL}/${loc}/products` },
      { "@type": "ListItem", position: 3, name, item: `${process.env.NEXT_PUBLIC_SITE_URL}/${loc}/products/${t(product.slug, loc)}` },
    ],
  };

  // Filter FAQs by current locale
  const localeFAQs = faqs.filter((faq) => faq.locale === locale && faq.is_active);

  return (
    <>
      <ProductJsonLd product={product} locale={loc} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {localeFAQs.length > 0 && (
        <FAQSchema faqs={localeFAQs.map((faq) => ({ question: faq.question, answer: faq.answer }))} />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery (client component: thumbnail swap + lightbox) */}
          <ProductGallery
            images={sortedImages}
            productName={name}
            locale={loc}
          />

          {/* Product Details */}
          <div>
            {product.brand && (
              <p className="text-sm text-muted mb-1">{product.brand}</p>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {name}
            </h1>
            {/* Rating */}
            {product.rating !== null && (
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="flex"
                  aria-label={tProduct("rating", { rating: product.rating })}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(product.rating!)
                          ? "text-brand"
                          : "text-gray-200"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-muted">
                  {tProduct("reviews", { count: product.review_count })}
                </span>
              </div>
            )}
            {/* Price */}
            {showPrice && (
              <div className="mt-4">
                {product.price_cents !== null ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-foreground">
                      {formatPrice(product.price_cents, product.currency, loc)}
                    </span>
                    {product.original_price_cents !== null &&
                      product.original_price_cents > product.price_cents && (
                        <>
                          <span className="text-lg text-muted line-through">
                            {formatPrice(
                              product.original_price_cents,
                              product.currency,
                              loc,
                            )}
                          </span>
                          <span className="text-sm font-semibold text-red-500">
                            {tProduct("discount", {
                              percent: product.discount_pct,
                            })}
                          </span>
                        </>
                      )}
                  </div>
                ) : (
                  <p className="text-lg text-muted">
                    {tProduct("price_unavailable")}
                  </p>
                )}
              </div>
            )}
            {/* Availability */}
            <div className="mt-3">
              {product.availability === "in_stock" ? (
                <span className="text-sm font-medium text-green-600">
                  {tProduct("in_stock")}
                </span>
              ) : product.availability === "out_of_stock" ? (
                <span className="text-sm font-medium text-red-500">
                  {tProduct("out_of_stock")}
                </span>
              ) : (
                <span className="text-sm text-muted">
                  {tProduct("unknown_availability")}
                </span>
              )}
            </div>
            {/* Buy Button */}
            <a
              href={product.affiliate_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-6 inline-flex items-center justify-center w-full sm:w-auto rounded-lg bg-brand px-8 py-3 text-base font-semibold text-white hover:bg-brand-dark transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              aria-label={`Buy ${name} on Amazon`}
            >
              {tProduct("buy_on_amazon")}
            </a>
            &nbsp; &nbsp;
            <AddToCartButton product={product} />
            {/* Description */}
            {description && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {tProduct("description")}
                </h2>
                {parseContentSegments(description).map((seg, i) =>
                  seg.type === "html" ? (
                    <div
                      key={i}
                      className="prose prose-sm max-w-none text-muted leading-relaxed [&_a]:text-brand [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: seg.content }}
                    />
                  ) : seg.type === "wizard" ? (
                    <WizardBlock
                      key={i}
                      steps={seg.steps}
                      showFooter={seg.showFooter}
                      shadow={seg.shadow}
                      showBorder={seg.showBorder}
                      showPanelBorder={seg.showPanelBorder}
                      panelBorderColor={seg.panelBorderColor}
                    />
                  ) : (
                    <ComparisonBlock key={i} data={seg.data} />
                  ),
                )}
              </div>
            )}
            {/* Features */}
            {product.features.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {tProduct("features")}
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-muted">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* FAQs */}
            {localeFAQs.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {localeFAQs.map((faq) => (
                    <div key={faq.id} className="border-b border-border pb-4">
                      <h3 className="font-medium text-foreground mb-2">{faq.question}</h3>
                      <p className="text-sm text-muted">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Wizard — full width below product grid */}
        {/* {comparisonCandidates.length > 0 && (
          <div className="mt-8">
            <ComparisonWizard
              currentProduct={product}
              candidates={comparisonCandidates}
              comparisonKeys={comparisonKeys}
              locale={loc}
              showPrice={showPrice}
            />
          </div>
        )} */}
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mx-auto max-w-7xl border-t border-border px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-bold text-foreground">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                locale={loc}
                showPrice={showPrice}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
