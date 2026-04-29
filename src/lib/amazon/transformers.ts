import type { PAAPIItem, CatalogItemResponse, ProductPreviewData } from "./types";

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
    attributes: {},
    is_active: true,
  };
}

/** Wraps transformPAAPIItem into the common ProductPreviewData shape. */
export function previewFromPAAPIItem(item: PAAPIItem): ProductPreviewData {
  const base = transformPAAPIItem(item);
  const primaryImage = extractPrimaryImage(item);
  const variantImages = (item.Images?.Variants ?? [])
    .map((v) => v.Large)
    .filter(Boolean)
    .map((img) => ({ url: img!.URL, width: img!.Width, height: img!.Height, variant: "PT" }));

  const images = [
    ...(primaryImage
      ? [{ url: primaryImage.url, width: primaryImage.width, height: primaryImage.height, variant: "MAIN" }]
      : []),
    ...variantImages,
  ];

  return {
    asin: base.asin,
    name: base.name as { en: string },
    slug: base.slug as { en: string },
    description: base.description as { en: string },
    features: base.features,
    price_cents: base.price_cents,
    original_price_cents: base.original_price_cents,
    currency: base.currency,
    brand: base.brand,
    affiliate_url: base.affiliate_url ?? "",
    availability: base.availability as "in_stock" | "out_of_stock" | "unknown",
    attributes: {},
    images,
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

/**
 * Transforms an Amazon SP-API getCatalogItem response into a normalised
 * ProductPreviewData object that the admin create/edit form can use for
 * autofill.  Nothing is written to the database here.
 */
export function transformCatalogItemResponse(
  item: CatalogItemResponse,
): ProductPreviewData {
  const attrs = item.attributes ?? {};
  const summary = item.summaries?.[0];

  const title =
    summary?.itemName ??
    (attrs.item_name?.[0]?.value as string | undefined) ??
    item.asin;

  const brand =
    summary?.brand ??
    (attrs.brand?.[0]?.value as string | undefined) ??
    null;

  const features = (attrs.bullet_point ?? []).map((bp) =>
    String(bp.value),
  );

  const listPrice = attrs.list_price?.[0];
  const priceCents = listPrice ? Math.round(listPrice.value * 100) : null;
  const currency = listPrice?.currency ?? "USD";

  // Collect all images; put MAIN variant first, then sort variants by name
  const imageSet = item.images?.[0]?.images ?? [];
  const mainImages = imageSet
    .filter((img) => img.variant === "MAIN")
    .sort((a, b) => b.width * b.height - a.width * a.height);
  const variantImages = imageSet
    .filter((img) => img.variant !== "MAIN")
    .sort((a, b) => a.variant.localeCompare(b.variant));

  const allImages = [...mainImages, ...variantImages];
  const uniqueImages = allImages.filter(
    (img, i, arr) => arr.findIndex((x) => x.link === img.link) === i,
  );

  // Build a clean attributes map for the product `attributes` JSONB column
  const attributes: Record<string, unknown> = {
    ...(summary?.modelNumber ? { model_number: summary.modelNumber } : {}),
    ...(summary?.color ?? attrs.color?.[0]?.value
      ? { color: summary?.color ?? attrs.color?.[0]?.value }
      : {}),
    ...(summary?.size ? { size: summary.size } : {}),
    ...(summary?.style ?? attrs.style?.[0]?.value
      ? { style: summary?.style ?? attrs.style?.[0]?.value }
      : {}),
    ...(attrs.warranty_description?.[0]?.value
      ? { warranty: attrs.warranty_description[0].value }
      : {}),
    ...(attrs.connectivity_technology?.length
      ? {
          connectivity: attrs.connectivity_technology
            .map((c) => String(c.value))
            .join(", "),
        }
      : {}),
    ...(attrs.resolution?.[0]?.value
      ? { resolution: attrs.resolution[0].value }
      : {}),
    ...(attrs.refresh_rate?.[0]
      ? {
          refresh_rate: `${attrs.refresh_rate[0].value} ${attrs.refresh_rate[0].unit ?? ""}`.trim(),
        }
      : {}),
    ...(attrs.item_weight?.[0]
      ? {
          weight: `${attrs.item_weight[0].value} ${attrs.item_weight[0].unit ?? ""}`.trim(),
        }
      : {}),
    ...(attrs.special_feature?.[0]?.value
      ? { special_features: attrs.special_feature[0].value }
      : {}),
  };

  return {
    asin: item.asin,
    name: { en: title },
    slug: { en: slugify(title) },
    description: { en: features.join("\n\n") },
    features,
    price_cents: priceCents,
    original_price_cents: null,
    currency,
    brand,
    affiliate_url: `https://www.amazon.com/dp/${item.asin}`,
    availability: "unknown",
    attributes,
    images: uniqueImages.slice(0, 10).map((img) => ({
      url: img.link,
      width: img.width,
      height: img.height,
      variant: img.variant,
    })),
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
