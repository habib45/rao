export interface PAAPIConfig {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  host: string;
  region: string;
  marketplace: string;
}

export type PAAPIOperation = "SearchItems" | "GetItems";

export interface PAAPIPrice {
  Amount: number;
  Currency: string;
  DisplayAmount: string;
}

export interface PAAPIListing {
  Price?: PAAPIPrice;
  SavingBasis?: PAAPIPrice;
  Availability?: { Type: string };
}

export interface PAAPIImage {
  URL: string;
  Width: number;
  Height: number;
}

export interface PAAPIItem {
  ASIN: string;
  DetailPageURL: string;
  ItemInfo?: {
    Title?: { DisplayValue: string };
    Features?: { DisplayValues: string[] };
    ByLineInfo?: { Brand?: { DisplayValue: string } };
  };
  Offers?: { Listings?: PAAPIListing[] };
  Images?: {
    Primary?: { Large?: PAAPIImage };
    Variants?: { Large?: PAAPIImage }[];
  };
  BrowseNodeInfo?: {
    BrowseNodes?: { Id: string; DisplayName: string }[];
  };
}

export interface SearchItemsResponse {
  SearchResult?: {
    Items?: PAAPIItem[];
    TotalResultCount?: number;
  };
  Errors?: PAAPIError[];
}

export interface GetItemsResponse {
  ItemsResult?: {
    Items?: PAAPIItem[];
  };
  Errors?: PAAPIError[];
}

export interface PAAPIError {
  Code: string;
  Message: string;
}

export interface SyncResult {
  synced: number;
  errors: string[];
}

export interface PriceUpdateResult {
  updated: number;
  errors: string[];
}

// ── Amazon SP-API getCatalogItem response types ──────────────────────────────

export interface CatalogAttribute {
  value: string | number | boolean;
  marketplace_id?: string;
  language_tag?: string;
  unit?: string;
}

export interface CatalogPriceAttribute {
  value: number;
  currency: string;
  marketplace_id?: string;
}

export interface CatalogDimension {
  unit: string;
  value: number;
}

export interface CatalogItemDimensions {
  width?: CatalogDimension;
  length?: CatalogDimension;
  height?: CatalogDimension;
  marketplace_id?: string;
}

export interface CatalogItemImage {
  variant: string;
  link: string;
  height: number;
  width: number;
}

export interface CatalogItemImageSet {
  marketplaceId: string;
  images: CatalogItemImage[];
}

export interface CatalogItemSummary {
  marketplaceId: string;
  brand?: string;
  itemName?: string;
  manufacturer?: string;
  modelNumber?: string;
  color?: string;
  size?: string;
  style?: string;
  packageQuantity?: number;
  partNumber?: string;
  websiteDisplayGroup?: string;
  websiteDisplayGroupName?: string;
}

export interface CatalogItemAttributes {
  item_name?: CatalogAttribute[];
  brand?: CatalogAttribute[];
  bullet_point?: CatalogAttribute[];
  list_price?: CatalogPriceAttribute[];
  item_weight?: Array<CatalogAttribute & { unit: string; value: number }>;
  item_dimensions?: CatalogItemDimensions[];
  color?: CatalogAttribute[];
  model_number?: CatalogAttribute[];
  manufacturer?: CatalogAttribute[];
  warranty_description?: CatalogAttribute[];
  connectivity_technology?: CatalogAttribute[];
  special_feature?: CatalogAttribute[];
  refresh_rate?: Array<CatalogAttribute & { unit: string }>;
  resolution?: CatalogAttribute[];
  style?: CatalogAttribute[];
  item_type_name?: CatalogAttribute[];
  [key: string]: unknown;
}

export interface CatalogItemResponse {
  asin: string;
  attributes?: CatalogItemAttributes;
  summaries?: CatalogItemSummary[];
  images?: CatalogItemImageSet[];
  classifications?: unknown[];
  dimensions?: unknown[];
  identifiers?: unknown[];
  productTypes?: unknown[];
  salesRanks?: unknown[];
  relationships?: unknown[];
}

/** Normalised autofill payload returned by the fetch-preview endpoint. */
export interface ProductPreviewData {
  asin: string;
  name: { en: string };
  slug: { en: string };
  description: { en: string };
  features: string[];
  price_cents: number | null;
  original_price_cents: number | null;
  currency: string;
  brand: string | null;
  affiliate_url: string;
  availability: "in_stock" | "out_of_stock" | "unknown";
  attributes: Record<string, unknown>;
  images: Array<{ url: string; width: number; height: number; variant: string }>;
}
