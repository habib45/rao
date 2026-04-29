export type LocaleCode = "en" | "bn-BD" | "sv";

export type TranslationMap<T = string> = Partial<Record<LocaleCode, T>>;

export type ProductAvailability = "in_stock" | "out_of_stock" | "unknown";

export type ProductStatus = "draft" | "pending_review" | "approved" | "published";

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
  publish_at?: string | null;
  product_status?: ProductStatus;
  rejection_reason?: string | null;
  submitted_by?: string | null;
  attributes?: Record<string, unknown>;
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

export type BlogPostStatus = "draft" | "published" | "archived";

export interface BlogCategory {
  id: string;
  name: TranslationMap;
  slug: TranslationMap;
  description: TranslationMap;
  color: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface BlogTag {
  id: string;
  name: TranslationMap;
  slug: TranslationMap;
}

export interface BlogPost {
  id: string;
  blog_category_id: string | null;
  title: TranslationMap;
  slug: TranslationMap;
  excerpt: TranslationMap;
  content: string;
  cover_image_url: string | null;
  cover_image_alt: TranslationMap;
  meta_title: TranslationMap;
  meta_description: TranslationMap;
  author_name: string;
  author_avatar_url: string | null;
  status: BlogPostStatus;
  is_featured: boolean;
  view_count: number;
  read_time_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  blog_categories?: BlogCategory | null;
  blog_post_tags?: { blog_tags: BlogTag }[];
}
