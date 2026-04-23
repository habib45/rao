"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCart } from "@/lib/cart/CartProvider";
import type { LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";
import { formatPrice } from "@/lib/i18n/format";
import { Link } from "@/i18n/routing";
import { useParams } from "next/navigation";

export default function CartPage() {
  const tCart = useTranslations("cart");
  const { locale } = useParams<{ locale: string }>();
  const loc = locale as LocaleCode;
  const { items, removeItem, updateQuantity } = useCart();

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
            const name = t(item.product.name, loc) as string;
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
                      alt={name}
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
                    {name}
                  </h3>
                  {item.product.price_cents !== null && (
                    <p className="mt-1 text-sm font-bold text-foreground">
                      {formatPrice(
                        item.product.price_cents,
                        item.product.currency,
                        loc,
                      )}
                    </p>
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
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(totalCents, "USD", loc)}
              </span>
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
