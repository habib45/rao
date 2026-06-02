"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCart } from "@/lib/cart/CartProvider";
import type { LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";
import { formatPrice } from "@/lib/i18n/format";
import { Link } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CartPage() {
  const tCart = useTranslations("cart");
  const { locale } = useParams<{ locale: string }>();
  const loc = locale as LocaleCode;
  const { items, removeItem, updateQuantity } = useCart();
  const [showPrice, setShowPrice] = useState(true);

  useEffect(() => {
    fetch("/admin/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const features = data.features as Record<string, unknown> | undefined;
        const rawShowPrice = features?.show_price;
        if (typeof rawShowPrice === "boolean") {
          setShowPrice(rawShowPrice);
        } else if (typeof rawShowPrice === "string") {
          setShowPrice(rawShowPrice === "true" || rawShowPrice === "1");
        }
      })
      .catch(() => setShowPrice(true));
  }, []);

  const totalCents = items.reduce((sum, item) => {
    return sum + (item.product.price_cents ?? 0) * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          {tCart("your_cart")}
        </h1>
        <p className="text-muted mb-8">{tCart("empty_cart")}</p>
        <Link
          href="/"
          className="inline-flex items-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          {tCart("continue_shopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        {tCart("your_cart")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            let displayName = 'Product';
            const nameData = item.product.name;
            if (typeof nameData === 'string') {
              try {
                const parsed = JSON.parse(nameData) as Record<string, string>;
                displayName = parsed[loc] || parsed['en'] || nameData;
              } catch {
                displayName = nameData;
              }
            } else if (typeof nameData === 'object' && nameData !== null) {
              displayName = (nameData as Record<string, string>)[loc] || (nameData as Record<string, string>)['en'] || 'Product';
            }
            const primaryImage = item.product.product_images?.find(
              (img) => img.is_primary,
            );

            return (
              <div
                key={item.product.id}
                className="flex gap-4 p-4 rounded-lg border border-border bg-white"
              >
                <div className="relative h-24 w-24 flex-shrink-0 bg-surface rounded overflow-hidden">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={displayName}
                      fill
                      sizes="96px"
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-muted">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2">
                    {displayName}
                  </h3>
                  {showPrice && item.product.price_cents !== null && (
                    <p className="mt-1 text-sm font-bold text-foreground">
                      {formatPrice(
                        item.product.price_cents,
                        item.product.currency,
                        loc,
                      )}
                    </p>
                  )}
                  {item.product.rating !== null && (
                    <div className="mt-2 flex items-center gap-1">
                      <div
                        className="flex"
                        aria-label={`${item.product.rating} out of 5 stars`}
                      >
                        {Array.from({ length: 5 }, (_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(item.product.rating!)
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
                        ({item.product.review_count})
                      </span>
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-3">
                    <label className="text-xs text-muted">
                      {tCart("quantity")}:
                    </label>
                    <select
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.product.id,
                          parseInt(e.target.value, 10),
                        )
                      }
                      className="border border-border rounded px-2 py-1 text-sm"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      {tCart("remove")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-white p-6 sticky top-20">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {tCart("total")}
            </h2>
            <div className="flex justify-between items-baseline mb-6">
              <span className="text-muted">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
              {showPrice && (
                <span className="text-2xl font-bold text-foreground">
                  {formatPrice(totalCents, "USD", loc)}
                </span>
              )}
            </div>

            <p className="text-xs text-muted mb-4">
              {loc === "bn-BD"
                ? "প্রতিটি আইটেম Amazon এ আলাদাভাবে চেকআউট করা হবে।"
                : loc === "sv"
                  ? "Varje artikel kommer att checkas ut separat på Amazon."
                  : "Each item will be checked out separately on Amazon."}
            </p>

            <div className="space-y-2">
              {items.map((item) => (
                <a
                  key={item.product.id}
                  href={item.product.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="block w-full text-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
                >
                  {tCart("checkout_amazon")} — {t(item.product.name, loc)}
                </a>
              ))}
            </div>

            <Link
              href="/"
              className="block mt-4 text-center text-sm text-brand hover:text-brand-dark transition-colors"
            >
              {tCart("continue_shopping")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
