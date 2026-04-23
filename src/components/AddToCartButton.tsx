"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart/CartProvider";
import type { Product } from "@/types/domain";
import { useState } from "react";

type Variant = "outline" | "solid";

export default function AddToCartButton({
  product,
  variant = "outline",
}: {
  product: Product;
  variant?: Variant;
}) {
  const tProduct = useTranslations("product");
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const variantClasses =
    variant === "solid"
      ? "w-full rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      : "mt-3 w-full sm:w-auto rounded-lg border-2 border-brand px-8 py-3 text-base font-semibold text-brand hover:bg-brand hover:text-white";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center transition-colors ${variantClasses}`}
    >
      {added ? "Added!" : tProduct("add_to_cart")}
    </button>
  );
}
