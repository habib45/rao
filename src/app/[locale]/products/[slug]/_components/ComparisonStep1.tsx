"use client";

import Image from "next/image";
import type { Product, LocaleCode } from "@/types/domain";
import { t } from "@/lib/i18n/translate";
import { useComparison } from "@/lib/comparison/index";

interface Props {
  currentProduct: Product;
  candidates: Product[];
  locale: LocaleCode;
  onNext: () => void;
}

function CandidateCard({
  product,
  locale,
  pinned,
}: {
  product: Product;
  locale: LocaleCode;
  pinned?: boolean;
}) {
  const { isSelected, add, remove, canAdd } = useComparison();
  const name = t(product.name, locale) as string;
  const image = product.product_images?.find((img) => img.is_primary);
  const selected = isSelected(product.id);

  return (
    <div
      className={`flex flex-col rounded-xl border bg-surface p-4 transition-colors ${
        selected || pinned
          ? "border-brand ring-1 ring-brand"
          : "border-border hover:border-brand/50"
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
      <p className="mt-2.5 line-clamp-2 text-sm font-medium text-foreground leading-snug">
        {name}
      </p>
      {product.brand && (
        <p className="mt-0.5 text-xs text-muted">{product.brand}</p>
      )}
      <div className="mt-auto pt-3">
        {pinned ? (
          <span className="block w-full rounded-lg bg-brand/10 px-2 py-2 text-center text-xs font-semibold text-brand">
            Current item
          </span>
        ) : selected ? (
          <button
            type="button"
            onClick={() => remove(product.id)}
            className="w-full rounded-lg border border-brand bg-brand px-2 py-2 text-xs font-semibold text-white hover:bg-brand-dark transition-colors"
          >
            ✓ Added
          </button>
        ) : (
          <button
            type="button"
            onClick={() => add(product.id)}
            disabled={!canAdd}
            className="w-full rounded-lg border border-brand px-2 py-2 text-xs font-semibold text-brand hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            + Add
          </button>
        )}
      </div>
    </div>
  );
}

export function ComparisonStep1({ currentProduct, candidates, locale, onNext }: Props) {
  const { selectedIds } = useComparison();

  return (
    <div>
      <p className="mb-5 text-sm text-muted">
        Select up to 5 products to compare with the current item. ({selectedIds.length}/5 selected)
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <CandidateCard product={currentProduct} locale={locale} pinned />
        {candidates.map((p) => (
          <CandidateCard key={p.id} product={p} locale={locale} />
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={selectedIds.length === 0}
          className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          Compare {selectedIds.length + 1} products →
        </button>
      </div>
    </div>
  );
}
