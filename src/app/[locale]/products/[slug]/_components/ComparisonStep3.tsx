"use client";

import Image from "next/image";
import type { Product, LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";
import { formatPrice } from "@/lib/i18n/format";
import AddToCartButton from "@/components/AddToCartButton";
import { useComparison } from "@/lib/comparison/index";

interface Props {
  currentProduct: Product;
  candidates: Product[];
  locale: LocaleCode;
  showPrice: boolean;
  onBack: () => void;
  onDone: () => void;
}

export function ComparisonStep3({
  currentProduct,
  candidates,
  locale,
  showPrice,
  onBack,
  onDone,
}: Props) {
  const { selectedIds } = useComparison();

  const selected = [
    currentProduct,
    ...candidates.filter((c) => selectedIds.includes(c.id)),
  ];

  return (
    <div>
      <p className="mb-5 text-sm text-muted">
        Add any of the compared products to your cart.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {selected.map((product, i) => {
          const name = t(product.name, locale) as string;
          const image = product.product_images?.find((img) => img.is_primary);

          return (
            <div
              key={product.id}
              className={`flex flex-col rounded-xl border bg-surface p-4 ${
                i === 0 ? "border-brand ring-1 ring-brand" : "border-border"
              }`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-border/40">
                {image ? (
                  <Image
                    src={image.url}
                    alt={name}
                    fill
                    sizes="200px"
                    className="object-contain p-3"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    No image
                  </div>
                )}
              </div>
              <p className="mt-2.5 line-clamp-2 text-sm font-semibold text-foreground leading-snug">
                {name}
              </p>
              {product.brand && (
                <p className="mt-0.5 text-xs text-muted">{product.brand}</p>
              )}
              {showPrice && product.price_cents !== null && (
                <p className="mt-1.5 text-base font-bold text-foreground">
                  {formatPrice(product.price_cents, product.currency, locale)}
                </p>
              )}
              {i === 0 && (
                <p className="mt-0.5 text-xs font-semibold text-brand">Current item</p>
              )}
              <div className="mt-auto pt-3">
                <AddToCartButton product={product} variant="solid" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
        >
          ← Back to comparison
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted hover:bg-surface transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
