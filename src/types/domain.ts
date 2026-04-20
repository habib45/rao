export type LocaleCode = "en" | "bn-BD" | "sv";

export type TranslationMap<T = string> = Partial<Record<LocaleCode, T>>;

export type ProductAvailability = "in_stock" | "out_of_stock" | "unknown";

export interface ProductImage {
  id: string;
  url: string;
  alt_text: TranslationMap;
  width: number | null;
  height: number | null;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  asin: string;
  category_id: string | null;
  name: TranslationMap;
  slug: TranslationMap;
  description: TranslationMap;
  features: string[];
  meta_title: TranslationMap;
  meta_description: TranslationMap;
  price_cents: number | null;
  original_price_cents: number | null;
  currency: string;
  discount_pct: number;
  rating: number | null;
  review_count: number;
  affiliate_url: string;
  brand: string | null;
  availability: ProductAvailability;
  is_featured: boolean;
  is_active: boolean;
  product_images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  amazon_node_id: string | null;
  name: TranslationMap;
  slug: TranslationMap;
  description: TranslationMap;
  parent_id: string | null;
  sort_order: number;
  image_url: string | null;
  is_active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ClickEvent {
  product_id: string;
  locale: LocaleCode;
  session_id: string;
  referrer: string;
  user_agent: string;
}

export interface PriceHistoryEntry {
  id: string;
  product_id: string;
  price_cents: number;
  currency: string;
  recorded_at: string;
}
