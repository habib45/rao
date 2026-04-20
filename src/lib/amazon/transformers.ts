import type { PAAPIItem } from "./types";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/-{2,}/g, "-");
}

export function transformPAAPIItem(item: PAAPIItem) {
  const title = item.ItemInfo?.Title?.DisplayValue ?? item.ASIN;
  const price = item.Offers?.Listings?.[0]?.Price;
  const savingBasis = item.Offers?.Listings?.[0]?.SavingBasis;
  const availability = item.Offers?.Listings?.[0]?.Availability;

  return {
    asin: item.ASIN,
    name: { en: title },
    slug: { en: slugify(title) },
    description: {
      en: (item.ItemInfo?.Features?.DisplayValues ?? []).join(" "),
    },
    features: item.ItemInfo?.Features?.DisplayValues ?? [],
    price_cents: price ? Math.round(price.Amount * 100) : null,
    original_price_cents: savingBasis
      ? Math.round(savingBasis.Amount * 100)
      : null,
    currency: price?.Currency ?? "USD",
    brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ?? null,
    affiliate_url: item.DetailPageURL,
    availability:
      availability?.Type === "Now" ? "in_stock" : "out_of_stock",
    amazon_updated_at: new Date().toISOString(),
    is_active: true,
  };
}

export function transformPrice(
  item: PAAPIItem,
  productId: string,
): {
  update: {
    price_cents: number;
    original_price_cents: number | null;
    availability: string;
    amazon_updated_at: string;
  };
  history: {
    product_id: string;
    price_cents: number;
    currency: string;
  };
} | null {
  const price = item.Offers?.Listings?.[0]?.Price;
  if (!price) return null;

  const savingBasis = item.Offers?.Listings?.[0]?.SavingBasis;
  const availability = item.Offers?.Listings?.[0]?.Availability;

  return {
    update: {
      price_cents: Math.round(price.Amount * 100),
      original_price_cents: savingBasis
        ? Math.round(savingBasis.Amount * 100)
        : null,
      availability:
        availability?.Type === "Now" ? "in_stock" : "out_of_stock",
      amazon_updated_at: new Date().toISOString(),
    },
    history: {
      product_id: productId,
      price_cents: Math.round(price.Amount * 100),
      currency: price.Currency,
    },
  };
}

export function extractPrimaryImage(
  item: PAAPIItem,
): { url: string; width: number; height: number } | null {
  const primary = item.Images?.Primary?.Large;
  if (!primary) return null;

  return {
    url: primary.URL,
    width: primary.Width,
    height: primary.Height,
  };
}
