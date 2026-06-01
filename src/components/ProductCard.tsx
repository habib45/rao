import Image from "next/image";
import { Link } from "@/i18n/routing";
import type { Product, LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";
import { formatPrice } from "@/lib/i18n/format";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductCard({
  product,
  locale,
  categoryName,
  showPrice = true,
}: {
  product: Product;
  locale: LocaleCode;
  categoryName?: string;
  showPrice?: boolean;
}) {
  const name = t(product.name, locale) as string;
  let slug = '';
  const slugData = product.slug;
  if (typeof slugData === 'string') {
    try {
      const parsed = JSON.parse(slugData) as Record<string, string>;
      slug = parsed[locale] || parsed['en'] || slugData;
    } catch {
      slug = slugData;
    }
  } else if (typeof slugData === 'object' && slugData !== null) {
    slug = (slugData as Record<string, string>)[locale] || (slugData as Record<string, string>)['en'] || '';
  }
  const primaryImage = product.product_images?.find((img) => img.is_primary);

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/products/${slug}`}
        className="flex flex-col focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 rounded-xl"
        aria-label={`View ${name}`}
      >
        <div className="relative aspect-square bg-surface">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={(t(primaryImage.alt_text, locale) as string) || name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain p-4 transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              No Image
            </div>
          )}

          {categoryName && (
            <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              {categoryName}
            </span>
          )}

          {showPrice && product.discount_pct > 0 && (
            <span className="absolute right-2 top-2 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
              -{product.discount_pct}%
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-4 pt-4">
          <h3 className="line-clamp-2 min-h-10 text-sm font-medium text-foreground transition-colors group-hover:text-brand">
            {name}
          </h3>

          {product.brand && (
            <p className="mt-1 text-xs text-muted">{product.brand}</p>
          )}

          {showPrice && (
            <div className="mt-2 flex items-baseline gap-2">
              {product.price_cents !== null ? (
                <>
                  <span className="text-lg font-bold text-foreground">
                    {formatPrice(product.price_cents, product.currency, locale)}
                  </span>
                  {product.original_price_cents !== null &&
                    product.original_price_cents > product.price_cents && (
                      <>
                        <span className="text-sm text-muted line-through">
                          {formatPrice(
                            product.original_price_cents,
                            product.currency,
                            locale,
                          )}
                        </span>
                        <span className="text-sm font-semibold text-red-500">
                          {product.discount_pct}% off
                        </span>
                      </>
                    )}
                </>
              ) : (
                <span className="text-sm text-muted">Price unavailable</span>
              )}
            </div>
          )}

          {product.rating !== null && (
            <div className="mt-2 flex items-center gap-1">
              <div
                className="flex"
                aria-label={`${product.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(product.rating!)
                        ? "text-brand"
                        : "text-gray-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-muted">
                ({product.review_count})
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="mt-auto p-4 pt-3">
        <AddToCartButton product={product} variant="solid" />
      </div>
    </div>
  );
}
