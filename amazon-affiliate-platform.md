# Amazon Affiliate E-Commerce Platform — Architecture & Implementation Guide

Stack: **Next.js 15 App Router · React TypeScript · Supabase · Tailwind CSS · Amazon PA-API 5.0**
Locales: **en** (default) · **bn-BD** (Bangla) · **sv** (Swedish)

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                             │
│  Next.js App Router (SSG/ISR + Client Components)                    │
│  ├── Tailwind CSS + Noto Sans Bengali (conditional)                  │
│  ├── next-intl (i18n: en, bn-BD, sv)                                 │
│  ├── supabase-js (anon key) → reads products, categories, cart       │
│  └── localStorage cart (guest) / Supabase cart (auth'd)              │
└──────────┬───────────────────────┬───────────────────────────────────┘
           │                       │
           │ supabase-js (anon)    │ fetch()
           ▼                       ▼
┌─────────────────────┐  ┌────────────────────────────────────────────┐
│  Supabase Database   │  │  Supabase Edge Functions (Deno TS)         │
│  (PostgreSQL + RLS)  │  │                                            │
│                      │  │  ┌─ sync-amazon-products   (scheduled)     │
│  Tables:             │  │  │  Calls PA-API 5.0 → upserts products   │
│  • products          │  │  │                                         │
│  • categories        │  │  ├─ update-prices           (cron 1 AM)   │
│  • product_images    │  │  │  Fetches latest prices from PA-API     │
│  • click_tracking    │  │  │                                         │
│  • cart_items        │  │  ├─ track-click              (POST)       │
│  • translations_ui   │  │  │  Records affiliate click + redirects   │
│  │                   │  │  │                                         │
│  │  JSONB cols with  │  │  └─ search-products          (GET)        │
│  │  GIN indexes on   │  │     Full-text search across locales       │
│  │  all translated   │  │                                            │
│  │  fields           │  │  Secrets in Supabase Vault:                │
│  └───────────────────┘  │  • AMAZON_ACCESS_KEY                       │
│                          │  • AMAZON_SECRET_KEY                       │
│                          │  • AMAZON_PARTNER_TAG                      │
│                          │  • SUPABASE_SERVICE_ROLE_KEY               │
│                          └────────────────────────────────────────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │  Amazon PA-API 5.0     │
                           │  • SearchItems          │
                           │  • GetItems              │
                           │  • GetBrowseNodes        │
                           └───────────────────────┘
```

**Key decisions:**

- **ISR (Incremental Static Regeneration)** for product pages — `revalidate: 3600` (1 hour). SEO gets static HTML; prices stay fresh.
- **SSG** for category index pages — rebuilt on deploy + ISR fallback.
- **No SSR-only pages.** Every page has a static shell for Core Web Vitals.
- **Cart is localStorage-first.** Authenticated users optionally sync to `cart_items` table. Checkout = redirect to Amazon with affiliate tag.
- **Amazon API keys NEVER touch the frontend.** All PA-API calls go through Edge Functions.

---

## 2. Database Schema (SQL)

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fuzzy search

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amazon_node_id TEXT UNIQUE,                       -- Amazon browse node ID
  name        JSONB NOT NULL DEFAULT '{}',          -- TranslationMap: {"en":"Electronics","bn-BD":"ইলেকট্রনিক্স","sv":"Elektronik"}
  slug        JSONB NOT NULL DEFAULT '{}',          -- TranslationMap: {"en":"electronics","bn-BD":"electronics","sv":"elektronik"}
  description JSONB DEFAULT '{}',
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  INT DEFAULT 0,
  image_url   TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_name_gin ON categories USING GIN (name jsonb_path_ops);
CREATE INDEX idx_categories_slug_gin ON categories USING GIN (slug jsonb_path_ops);
CREATE INDEX idx_categories_parent   ON categories (parent_id);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asin            TEXT UNIQUE NOT NULL,               -- Amazon Standard Identification Number
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Translated fields (JSONB TranslationMap)
  name            JSONB NOT NULL DEFAULT '{}',
  slug            JSONB NOT NULL DEFAULT '{}',        -- URL-safe, locale-keyed
  description     JSONB DEFAULT '{}',
  features        JSONB DEFAULT '[]',                 -- bullet points from Amazon
  meta_title      JSONB DEFAULT '{}',
  meta_description JSONB DEFAULT '{}',

  -- Pricing (stored in cents, USD base)
  price_cents     INT,                                -- current price
  original_price_cents INT,                           -- list price / was price
  currency        TEXT DEFAULT 'USD',
  discount_pct    NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN original_price_cents > 0 AND price_cents > 0
         THEN ROUND((1 - price_cents::NUMERIC / original_price_cents) * 100, 2)
         ELSE 0
    END
  ) STORED,

  -- Amazon metadata
  rating          NUMERIC(2,1),                       -- 0.0–5.0
  review_count    INT DEFAULT 0,
  affiliate_url   TEXT NOT NULL,                      -- full affiliate URL with partner tag
  brand           TEXT,
  availability    TEXT DEFAULT 'in_stock',            -- in_stock | out_of_stock | unknown
  amazon_updated_at TIMESTAMPTZ,                     -- last time PA-API returned data

  -- Search vectors (one per locale for FTS)
  search_vector_en TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(name->>'en','') || ' ' ||
      COALESCE(description->>'en','') || ' ' ||
      COALESCE(brand,'')
    )
  ) STORED,
  search_vector_sv TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('swedish',
      COALESCE(name->>'sv','') || ' ' ||
      COALESCE(description->>'sv','')
    )
  ) STORED,
  search_vector_bn TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple',
      COALESCE(name->>'bn-BD','') || ' ' ||
      COALESCE(description->>'bn-BD','')
    )
  ) STORED,

  is_featured     BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_asin          ON products (asin);
CREATE INDEX idx_products_category      ON products (category_id);
CREATE INDEX idx_products_name_gin      ON products USING GIN (name jsonb_path_ops);
CREATE INDEX idx_products_slug_gin      ON products USING GIN (slug jsonb_path_ops);
CREATE INDEX idx_products_price         ON products (price_cents);
CREATE INDEX idx_products_rating        ON products (rating DESC NULLS LAST);
CREATE INDEX idx_products_featured      ON products (is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_search_en     ON products USING GIN (search_vector_en);
CREATE INDEX idx_products_search_sv     ON products USING GIN (search_vector_sv);
CREATE INDEX idx_products_search_bn     ON products USING GIN (search_vector_bn);
CREATE INDEX idx_products_active        ON products (is_active) WHERE is_active = true;

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    JSONB DEFAULT '{}',                   -- TranslationMap
  width       INT,
  height      INT,
  sort_order  INT DEFAULT 0,
  is_primary  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images (product_id, sort_order);

-- ============================================================
-- CLICK TRACKING (affiliate analytics)
-- ============================================================
CREATE TABLE click_tracking (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id   TEXT,                                 -- anonymous session fingerprint
  referrer     TEXT,
  user_agent   TEXT,
  ip_hash      TEXT,                                 -- hashed IP, never raw
  locale       TEXT DEFAULT 'en',
  clicked_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clicks_product   ON click_tracking (product_id, clicked_at DESC);
CREATE INDEX idx_clicks_time      ON click_tracking (clicked_at DESC);

-- ============================================================
-- CART ITEMS (optional — for authenticated users)
-- ============================================================
CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INT DEFAULT 1 CHECK (quantity > 0 AND quantity <= 99),
  added_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX idx_cart_user ON cart_items (user_id);

-- ============================================================
-- UI TRANSLATIONS (static strings — navbar, buttons, etc.)
-- ============================================================
CREATE TABLE translations_ui (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  namespace   TEXT NOT NULL,                         -- e.g. 'common', 'product', 'cart'
  key         TEXT NOT NULL,                         -- e.g. 'add_to_cart'
  value       JSONB NOT NULL DEFAULT '{}',           -- TranslationMap
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (namespace, key)
);

CREATE INDEX idx_translations_ns ON translations_ui (namespace);

-- ============================================================
-- PRICE HISTORY (for trend charts / price drop alerts)
-- ============================================================
CREATE TABLE price_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_cents INT NOT NULL,
  currency    TEXT DEFAULT 'USD',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_price_history_product ON price_history (product_id, recorded_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Products: public read, no public write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT USING (is_active = true);

-- Categories: public read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT USING (is_active = true);

-- Product images: public read
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product images are publicly readable"
  ON product_images FOR SELECT USING (true);

-- Cart: users see only their own
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart"
  ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Click tracking: insert only (no reads from client)
ALTER TABLE click_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert clicks"
  ON click_tracking FOR INSERT WITH CHECK (true);
-- No SELECT policy → clients cannot read click data

-- Price history: public read
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Price history is publicly readable"
  ON price_history FOR SELECT USING (true);

-- UI translations: public read
ALTER TABLE translations_ui ENABLE ROW LEVEL SECURITY;
CREATE POLICY "UI translations are publicly readable"
  ON translations_ui FOR SELECT USING (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

---

## 3. API Integration Flow

### 3.1 Amazon PA-API 5.0 — Authentication

Amazon PA-API uses **AWS Signature Version 4 (SigV4)** signing. Every request must be signed with your Access Key + Secret Key.

```typescript
// supabase/functions/_shared/amazon-paapi.ts

import { createHmac, createHash } from "node:crypto";

interface PAAPIConfig {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  host: string;       // e.g. "webservices.amazon.com"
  region: string;     // e.g. "us-east-1"
  marketplace: string; // e.g. "www.amazon.com"
}

function getConfig(): PAAPIConfig {
  return {
    accessKey: Deno.env.get("AMAZON_ACCESS_KEY")!,
    secretKey: Deno.env.get("AMAZON_SECRET_KEY")!,
    partnerTag: Deno.env.get("AMAZON_PARTNER_TAG")!,
    host: "webservices.amazon.com",
    region: "us-east-1",
    marketplace: "www.amazon.com",
  };
}

// SigV4 signing for PA-API 5.0
function signRequest(
  operation: string,
  payload: string,
  config: PAAPIConfig,
): { headers: Record<string, string> } {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const service = "ProductAdvertisingAPI";
  const path = `/paapi5/${operation.toLowerCase()}`;

  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const payloadHash = createHash("sha256").update(payload).digest("hex");

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${config.host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}\n`;

  const signedHeaders =
    "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest = [
    "POST", path, "", canonicalHeaders, signedHeaders, payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const signingKey = [config.region, service, "aws4_request"].reduce(
    (key, msg) => createHmac("sha256", key).update(msg).digest(),
    createHmac("sha256", `AWS4${config.secretKey}`)
      .update(dateStamp)
      .digest(),
  );

  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  return {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Encoding": "amz-1.0",
      "Host": config.host,
      "X-Amz-Date": amzDate,
      "X-Amz-Target": `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`,
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
}

// SearchItems — find products by keyword
export async function searchItems(keywords: string, category?: string, page = 1) {
  const config = getConfig();
  const payload = JSON.stringify({
    Keywords: keywords,
    SearchIndex: category || "All",
    ItemCount: 10,
    ItemPage: page,
    PartnerTag: config.partnerTag,
    PartnerType: "Associates",
    Marketplace: config.marketplace,
    Resources: [
      "Images.Primary.Large",
      "Images.Variants.Large",
      "ItemInfo.Title",
      "ItemInfo.Features",
      "ItemInfo.ByLineInfo",
      "Offers.Listings.Price",
      "Offers.Listings.SavingBasis",
      "Offers.Listings.Availability.Type",
      "BrowseNodeInfo.BrowseNodes",
    ],
  });

  const { headers } = signRequest("SearchItems", payload, config);

  const res = await fetch(`https://${config.host}/paapi5/searchitems`, {
    method: "POST",
    headers,
    body: payload,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PA-API SearchItems failed (${res.status}): ${err}`);
  }

  return res.json();
}

// GetItems — fetch specific ASINs (used for price updates)
export async function getItems(asins: string[]) {
  const config = getConfig();
  const payload = JSON.stringify({
    ItemIds: asins,
    ItemIdType: "ASIN",
    PartnerTag: config.partnerTag,
    PartnerType: "Associates",
    Marketplace: config.marketplace,
    Resources: [
      "Images.Primary.Large",
      "Offers.Listings.Price",
      "Offers.Listings.SavingBasis",
      "Offers.Listings.Availability.Type",
    ],
  });

  const { headers } = signRequest("GetItems", payload, config);

  const res = await fetch(`https://${config.host}/paapi5/getitems`, {
    method: "POST",
    headers,
    body: payload,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PA-API GetItems failed (${res.status}): ${err}`);
  }

  return res.json();
}
```

### 3.2 Sync Products Edge Function

```typescript
// supabase/functions/sync-amazon-products/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { searchItems } from "../_shared/amazon-paapi.ts";

serve(async (req) => {
  // Verify cron secret or admin auth
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const categories = ["Electronics", "Books", "Home", "Fashion"];
  const results: { synced: number; errors: string[] } = { synced: 0, errors: [] };

  for (const category of categories) {
    try {
      // PA-API rate limit: 1 request/second (throttle tier dependent)
      await new Promise((r) => setTimeout(r, 1100));

      const data = await searchItems("", category, 1);
      const items = data?.SearchResult?.Items ?? [];

      for (const item of items) {
        const asin = item.ASIN;
        const price = item.Offers?.Listings?.[0]?.Price;
        const savingBasis = item.Offers?.Listings?.[0]?.SavingBasis;

        const productRow = {
          asin,
          name: { en: item.ItemInfo?.Title?.DisplayValue ?? asin },
          slug: {
            en: (item.ItemInfo?.Title?.DisplayValue ?? asin)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, ""),
          },
          description: {
            en: (item.ItemInfo?.Features?.DisplayValues ?? []).join(" "),
          },
          features: item.ItemInfo?.Features?.DisplayValues ?? [],
          price_cents: price
            ? Math.round(price.Amount * 100)
            : null,
          original_price_cents: savingBasis
            ? Math.round(savingBasis.Amount * 100)
            : null,
          currency: price?.Currency ?? "USD",
          rating: null,   // PA-API 5.0 removed rating from search results
          brand:
            item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ?? null,
          affiliate_url: item.DetailPageURL,
          availability:
            item.Offers?.Listings?.[0]?.Availability?.Type === "Now"
              ? "in_stock"
              : "out_of_stock",
          amazon_updated_at: new Date().toISOString(),
          is_active: true,
        };

        // Upsert — dedup on ASIN
        const { error } = await supabase
          .from("products")
          .upsert(productRow, { onConflict: "asin" });

        if (error) {
          results.errors.push(`ASIN ${asin}: ${error.message}`);
        } else {
          results.synced++;
        }

        // Upsert primary image
        const primaryImage = item.Images?.Primary?.Large;
        if (primaryImage) {
          await supabase.from("product_images").upsert(
            {
              product_id: (
                await supabase
                  .from("products")
                  .select("id")
                  .eq("asin", asin)
                  .single()
              ).data?.id,
              url: primaryImage.URL,
              width: primaryImage.Width,
              height: primaryImage.Height,
              is_primary: true,
              sort_order: 0,
            },
            { onConflict: "product_id,is_primary" },  // needs unique constraint
          );
        }
      }
    } catch (err) {
      results.errors.push(`Category ${category}: ${(err as Error).message}`);
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### 3.3 Price Update Cron (1 AM daily)

```typescript
// supabase/functions/update-prices/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getItems } from "../_shared/amazon-paapi.ts";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fetch all active ASINs
  const { data: products } = await supabase
    .from("products")
    .select("id, asin, price_cents")
    .eq("is_active", true);

  if (!products?.length) {
    return new Response(JSON.stringify({ updated: 0 }));
  }

  let updated = 0;
  const errors: string[] = [];

  // PA-API GetItems accepts max 10 ASINs per request
  const chunks = chunkArray(products, 10);

  for (const chunk of chunks) {
    await new Promise((r) => setTimeout(r, 1100)); // rate limit

    try {
      const asins = chunk.map((p) => p.asin);
      const data = await getItems(asins);
      const items = data?.ItemsResult?.Items ?? [];

      for (const item of items) {
        const price = item.Offers?.Listings?.[0]?.Price;
        if (!price) continue;

        const newPriceCents = Math.round(price.Amount * 100);
        const product = chunk.find((p) => p.asin === item.ASIN);
        if (!product) continue;

        // Record price history
        await supabase.from("price_history").insert({
          product_id: product.id,
          price_cents: newPriceCents,
          currency: price.Currency,
        });

        // Update product only if price changed
        if (product.price_cents !== newPriceCents) {
          const savingBasis = item.Offers?.Listings?.[0]?.SavingBasis;
          await supabase
            .from("products")
            .update({
              price_cents: newPriceCents,
              original_price_cents: savingBasis
                ? Math.round(savingBasis.Amount * 100)
                : null,
              availability:
                item.Offers?.Listings?.[0]?.Availability?.Type === "Now"
                  ? "in_stock"
                  : "out_of_stock",
              amazon_updated_at: new Date().toISOString(),
            })
            .eq("id", product.id);

          updated++;
        }
      }
    } catch (err) {
      errors.push((err as Error).message);
    }
  }

  return new Response(
    JSON.stringify({ updated, errors }),
    { headers: { "Content-Type": "application/json" } },
  );
});

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
```

**Cron schedule** (set via Supabase Dashboard → Edge Functions → Schedules):

```
update-prices: 0 1 * * *    (every day at 1:00 AM UTC)
sync-amazon-products: 0 3 * * 0   (every Sunday at 3:00 AM UTC)
```

### 3.4 PA-API Rate Limits & Failure Handling

| Constraint | Value | Strategy |
|---|---|---|
| Default rate | 1 req/sec | `setTimeout(1100)` between calls |
| Throttling tier | Based on revenue | Log `429` errors, exponential backoff (2s, 4s, 8s, max 32s) |
| Max ASINs per GetItems | 10 | Chunk array into batches of 10 |
| API downtime | Periodic | Serve stale data from DB; set `availability: 'unknown'`; log to `price_update_errors` |
| Missing products (ASIN delisted) | — | Mark `is_active = false` after 3 consecutive missing responses |
| Price mismatch | DB ≠ Amazon | Always trust Amazon price; record old price in `price_history` |
| Duplicate products | Same ASIN | `ON CONFLICT (asin)` upsert; never create duplicates |

---

## 4. UI Component Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                  # Root locale layout — html lang, Bengali font
│   │   ├── page.tsx                    # Homepage (hero + featured + categories)
│   │   ├── products/
│   │   │   ├── page.tsx                # Product listing with filters (SSG + ISR)
│   │   │   └── [slug]/
│   │   │       └── page.tsx            # Product detail page (ISR, revalidate: 3600)
│   │   ├── categories/
│   │   │   └── [slug]/page.tsx         # Category page with filters
│   │   ├── search/page.tsx             # Search results
│   │   └── cart/page.tsx               # Cart page (client component)
│   ├── api/
│   │   ├── sitemap.xml/route.ts        # Dynamic sitemap generation
│   │   ├── robots.txt/route.ts         # Robots.txt
│   │   └── og/[slug]/route.ts          # Dynamic OG image generation
│   └── not-found.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx                  # Navbar + search + locale toggle + cart icon
│   │   ├── Footer.tsx
│   │   ├── MobileMenu.tsx
│   │   └── Breadcrumbs.tsx
│   ├── product/
│   │   ├── ProductCard.tsx             # Card in listing grid
│   │   ├── ProductGrid.tsx             # Responsive grid wrapper
│   │   ├── ProductGallery.tsx          # Image carousel on detail page
│   │   ├── ProductInfo.tsx             # Title, rating, price, description
│   │   ├── BuyOnAmazonButton.tsx       # Affiliate CTA — tracks click then redirects
│   │   ├── PriceDisplay.tsx            # Formatted price with discount badge
│   │   ├── RatingStars.tsx             # Visual star rating
│   │   └── ProductJsonLd.tsx           # JSON-LD structured data
│   ├── filters/
│   │   ├── FilterSidebar.tsx           # Desktop sidebar
│   │   ├── FilterDrawer.tsx            # Mobile bottom sheet
│   │   ├── CategoryFilter.tsx
│   │   ├── PriceRangeFilter.tsx        # Slider
│   │   └── RatingFilter.tsx
│   ├── cart/
│   │   ├── CartProvider.tsx            # Context provider (localStorage + optional Supabase sync)
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CheckoutRedirect.tsx        # Maps cart items → Amazon affiliate URLs
│   ├── search/
│   │   ├── SearchInput.tsx             # Debounced search with instant results
│   │   └── SearchResults.tsx
│   ├── seo/
│   │   ├── MetaTags.tsx
│   │   └── BreadcrumbJsonLd.tsx
│   └── ui/
│       ├── LocaleSwitcher.tsx          # Language toggle dropdown
│       ├── Skeleton.tsx                # Loading skeleton
│       ├── ErrorBoundary.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # createBrowserClient
│   │   └── server.ts                   # createServerClient
│   ├── i18n/
│   │   ├── translate.ts                # t(map, locale) helper
│   │   └── format.ts                   # formatPrice with numberingSystem: 'latn'
│   └── cart/
│       └── storage.ts                  # localStorage cart helpers
├── hooks/
│   ├── useCart.ts
│   ├── useProducts.ts
│   └── useDebounce.ts
├── types/
│   ├── supabase.ts                     # Auto-generated
│   └── domain.ts                       # Product, Category, LocaleCode, TranslationMap
└── messages/
    ├── en.json
    ├── bn-BD.json
    └── sv.json
```

---

## 5. Sample Code

### 5.1 TypeScript Domain Types

```typescript
// src/types/domain.ts

export type LocaleCode = 'en' | 'bn-BD' | 'sv';
export type TranslationMap<T = string> = Partial<Record<LocaleCode, T>>;

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
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  is_featured: boolean;
  product_images: ProductImage[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text: TranslationMap;
  width: number | null;
  height: number | null;
  is_primary: boolean;
}

export interface Category {
  id: string;
  name: TranslationMap;
  slug: TranslationMap;
  description: TranslationMap;
  image_url: string | null;
  parent_id: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
```

### 5.2 Product Detail Page (ISR + SEO)

```typescript
// src/app/[locale]/products/[slug]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { t } from '@/lib/i18n/translate';
import { formatPrice } from '@/lib/i18n/format';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { BuyOnAmazonButton } from '@/components/product/BuyOnAmazonButton';
import { ProductJsonLd } from '@/components/product/ProductJsonLd';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import type { LocaleCode, Product } from '@/types/domain';

interface Props {
  params: { locale: LocaleCode; slug: string };
}

// ISR: revalidate every hour
export const revalidate = 3600;

// Generate static params for all products × locales
export async function generateStaticParams() {
  const supabase = createServerClient();
  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('is_active', true)
    .limit(500);

  const locales: LocaleCode[] = ['en', 'bn-BD', 'sv'];
  const params: { locale: string; slug: string }[] = [];

  for (const product of products ?? []) {
    for (const locale of locales) {
      const slug = (product.slug as Record<string, string>)?.[locale];
      if (slug) params.push({ locale, slug });
    }
  }
  return params;
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = params;
  const product = await getProduct(locale, slug);
  if (!product) return {};

  const title = t(product.meta_title, locale) || t(product.name, locale);
  const description = t(product.meta_description, locale)
    || t(product.description, locale).slice(0, 160);
  const primaryImage = product.product_images.find((i) => i.is_primary);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'bn-BD' ? 'bn_BD' : locale,
      images: primaryImage ? [{ url: primaryImage.url, width: primaryImage.width ?? 500, height: primaryImage.height ?? 500 }] : [],
    },
    alternates: {
      canonical: `/${locale}/products/${slug}`,
      languages: {
        en: `/en/products/${(product.slug as any).en ?? slug}`,
        'bn-BD': `/bn-BD/products/${(product.slug as any)['bn-BD'] ?? slug}`,
        sv: `/sv/products/${(product.slug as any).sv ?? slug}`,
      },
    },
  };
}

async function getProduct(locale: LocaleCode, slug: string): Promise<Product | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('products')
    .select(`
      *,
      product_images (id, url, alt_text, width, height, is_primary, sort_order),
      categories!category_id (id, name, slug)
    `)
    .eq(`slug->>'${locale}'` as any, slug)
    .eq('is_active', true)
    .single();

  return data as unknown as Product | null;
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = params;
  const product = await getProduct(locale, slug);
  if (!product) notFound();

  const images = (product.product_images ?? []).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  return (
    <>
      {/* JSON-LD structured data */}
      <ProductJsonLd product={product} locale={locale} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs locale={locale} product={product} />

        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2">
          {/* Image gallery */}
          <ProductGallery images={images} locale={locale} />

          {/* Product info */}
          <div className="flex flex-col gap-6">
            <ProductInfo product={product} locale={locale} />
            <BuyOnAmazonButton
              productId={product.id}
              affiliateUrl={product.affiliate_url}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </>
  );
}
```

### 5.3 JSON-LD Structured Data

```typescript
// src/components/product/ProductJsonLd.tsx

import { t } from '@/lib/i18n/translate';
import type { LocaleCode, Product } from '@/types/domain';

export function ProductJsonLd({ product, locale }: { product: Product; locale: LocaleCode }) {
  const primaryImage = product.product_images?.find((i) => i.is_primary);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: t(product.name, locale),
    description: t(product.description, locale),
    image: primaryImage?.url,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.review_count,
      },
    }),
    offers: {
      '@type': 'Offer',
      url: product.affiliate_url,
      priceCurrency: product.currency,
      price: product.price_cents ? (product.price_cents / 100).toFixed(2) : undefined,
      availability:
        product.availability === 'in_stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Amazon' },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

### 5.4 Affiliate Click Tracking + Redirect

```typescript
// src/components/product/BuyOnAmazonButton.tsx
'use client';

import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@/lib/supabase/client';
import type { LocaleCode } from '@/types/domain';

interface Props {
  productId: string;
  affiliateUrl: string;
  locale: LocaleCode;
}

export function BuyOnAmazonButton({ productId, affiliateUrl, locale }: Props) {
  const t = useTranslations('product');

  const handleClick = async () => {
    const supabase = createBrowserClient();

    // Fire-and-forget click tracking (don't block redirect)
    supabase
      .from('click_tracking')
      .insert({
        product_id: productId,
        locale,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        session_id: getOrCreateSessionId(),
      })
      .then(({ error }) => {
        if (error) console.error('Click tracking failed:', error);
      });

    // Redirect to Amazon immediately
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className="w-full rounded-xl bg-amber-500 px-6 py-4 text-lg font-bold
                 text-white shadow-lg transition-all hover:bg-amber-600
                 hover:shadow-xl active:scale-[0.98]"
    >
      {t('buy_on_amazon')}
    </button>
  );
}

function getOrCreateSessionId(): string {
  const key = 'aff_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}
```

### 5.5 Cart Provider (localStorage)

```typescript
// src/components/cart/CartProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '@/types/domain';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  getAmazonCheckoutUrls: () => string[];
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart');
      if (stored) setItems(JSON.parse(stored));
    } catch { /* ignore corrupt data */ }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, 99) }
            : i,
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeItem = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.product.id !== productId));

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(productId);
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: Math.min(quantity, 99) } : i,
      ),
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + (i.product.price_cents ?? 0) * i.quantity,
    0,
  );

  // Generate affiliate URLs for all cart items
  const getAmazonCheckoutUrls = () =>
    items.map((i) => i.product.affiliate_url);

  return (
    <CartContext.Provider
      value={{
        items, addItem, removeItem, updateQuantity,
        clearCart, totalItems, totalPrice, getAmazonCheckoutUrls,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
```

### 5.6 Homepage (Server Component)

```typescript
// src/app/[locale]/page.tsx

import { createServerClient } from '@/lib/supabase/server';
import { t } from '@/lib/i18n/translate';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductCard } from '@/components/product/ProductCard';
import type { LocaleCode } from '@/types/domain';

export const revalidate = 1800; // 30 min ISR

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: LocaleCode };
}) {
  const supabase = createServerClient();

  // Featured products
  const { data: featured } = await supabase
    .from('products')
    .select('*, product_images(url, alt_text, is_primary)')
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(8);

  // Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t({ en: 'Discover the Best Products', 'bn-BD': 'সেরা পণ্যগুলি আবিষ্কার করুন', sv: 'Upptäck de bästa produkterna' }, locale)}
          </h1>
          <p className="mt-4 text-lg text-indigo-200">
            {t({ en: 'Curated picks with the best prices on Amazon', 'bn-BD': 'Amazon-এ সেরা দামে বাছাই করা পণ্য', sv: 'Utvalda produkter till bästa priser på Amazon' }, locale)}
          </p>
        </div>
      </section>

      {/* Category cards */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900">
          {t({ en: 'Shop by Category', 'bn-BD': 'ক্যাটাগরি অনুযায়ী কেনাকাটা', sv: 'Handla per kategori' }, locale)}
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories?.map((cat) => (
            <a
              key={cat.id}
              href={`/${locale}/categories/${t(cat.slug, locale)}`}
              className="group relative overflow-hidden rounded-2xl bg-gray-100 p-6
                         shadow-sm transition-all hover:shadow-md"
            >
              <span className="text-lg font-semibold text-gray-900">
                {t(cat.name, locale)}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900">
          {t({ en: 'Featured Products', 'bn-BD': 'বৈশিষ্ট্যযুক্ত পণ্য', sv: 'Utvalda produkter' }, locale)}
        </h2>
        <ProductGrid className="mt-6">
          {featured?.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </ProductGrid>
      </section>
    </main>
  );
}
```

---

## 6. SEO Implementation Details

### 6.1 URL Structure

```
/en/products/sony-wh-1000xm5-headphones       ← English product
/bn-BD/products/sony-wh-1000xm5-headphones    ← Bangla product
/sv/products/sony-wh-1000xm5-headphones       ← Swedish product
/en/categories/electronics                     ← Category listing
/en/search?q=headphones                        ← Search results
```

### 6.2 Sitemap Generation

```typescript
// src/app/api/sitemap.xml/route.ts

import { createServerClient } from '@/lib/supabase/server';
import type { LocaleCode } from '@/types/domain';

const BASE_URL = 'https://yourdomain.com';
const LOCALES: LocaleCode[] = ['en', 'bn-BD', 'sv'];

export async function GET() {
  const supabase = createServerClient();

  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true);

  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .eq('is_active', true);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

  // Static pages
  for (const locale of LOCALES) {
    xml += urlEntry(`${BASE_URL}/${locale}`, LOCALES, locale);
  }

  // Products
  for (const product of products ?? []) {
    for (const locale of LOCALES) {
      const slug = (product.slug as Record<string, string>)?.[locale];
      if (!slug) continue;
      xml += urlEntry(
        `${BASE_URL}/${locale}/products/${slug}`,
        LOCALES,
        locale,
        product.updated_at,
        'weekly',
        0.8,
      );
    }
  }

  // Categories
  for (const cat of categories ?? []) {
    for (const locale of LOCALES) {
      const slug = (cat.slug as Record<string, string>)?.[locale];
      if (!slug) continue;
      xml += urlEntry(
        `${BASE_URL}/${locale}/categories/${slug}`,
        LOCALES,
        locale,
        cat.updated_at,
        'weekly',
        0.7,
      );
    }
  }

  xml += '\n</urlset>';

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}

function urlEntry(
  url: string,
  locales: LocaleCode[],
  currentLocale: LocaleCode,
  lastmod?: string,
  changefreq = 'daily',
  priority = 1.0,
): string {
  const alternates = locales
    .map((l) => {
      const altUrl = url.replace(`/${currentLocale}/`, `/${l}/`);
      return `    <xhtml:link rel="alternate" hreflang="${l === 'bn-BD' ? 'bn' : l}" href="${altUrl}" />`;
    })
    .join('\n');

  return `
  <url>
    <loc>${url}</loc>
    ${lastmod ? `<lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alternates}
  </url>`;
}
```

### 6.3 robots.txt

```typescript
// src/app/api/robots.txt/route.ts

export function GET() {
  const body = `User-agent: *
Allow: /

Sitemap: https://yourdomain.com/api/sitemap.xml

# Block internal routes
Disallow: /api/
Disallow: /_next/
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
```

### 6.4 SEO Checklist

| Area | Implementation |
|---|---|
| `<title>` + `<meta description>` | `generateMetadata()` on every page — locale-specific |
| Open Graph tags | `openGraph` in metadata — title, description, image, locale |
| `hreflang` alternates | `alternates.languages` in metadata + sitemap `xhtml:link` |
| JSON-LD Product schema | `ProductJsonLd` component on every product page |
| BreadcrumbList JSON-LD | `BreadcrumbJsonLd` on category + product pages |
| Canonical URLs | `alternates.canonical` in metadata |
| Clean URLs | `/[locale]/products/[slug]` — no query params for primary pages |
| Image optimization | Next.js `<Image>` with `priority` on LCP images, `sizes` attribute |
| Core Web Vitals | ISR (no TTFB wait), lazy-load below-fold images, font `display: swap` |
| Semantic HTML | `<main>`, `<article>`, `<nav>`, `<h1>`–`<h3>` hierarchy |
| `lang` attribute | `<html lang={locale}>` set in root layout |

---

## 7. Wireframes

(See the interactive wireframe artifact generated below.)

---

## 8. Deployment Strategy

### 8.1 Infrastructure

| Component | Provider | Notes |
|---|---|---|
| Frontend (Next.js) | **Vercel** | Edge network, ISR support, automatic preview deploys |
| Database + Auth | **Supabase** (Pro plan) | Managed Postgres, point-in-time recovery |
| Edge Functions | **Supabase** | Cron schedules for price updates + product sync |
| DNS + CDN | **Cloudflare** | Cache static assets, DDoS protection |
| Domain | Custom `.com` | HTTPS enforced via Vercel/Cloudflare |

### 8.2 Environment Setup

```bash
# Vercel (frontend only — public vars)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Supabase Vault (Edge Functions only — secret)
supabase secrets set AMAZON_ACCESS_KEY=AKIA...
supabase secrets set AMAZON_SECRET_KEY=wJal...
supabase secrets set AMAZON_PARTNER_TAG=yourtag-20
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
supabase secrets set CRON_SECRET=$(openssl rand -hex 32)
```

### 8.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-edge-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase functions deploy sync-amazon-products --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
      - run: supabase functions deploy update-prices --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
      - run: supabase functions deploy track-click --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}

  deploy-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db push --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}

  # Vercel auto-deploys from main via Git integration
```

### 8.4 Pre-launch Checklist

1. Run `npx next build` — verify no build errors, check generated page count
2. Run Lighthouse on staging — target 90+ on all four categories
3. Verify `robots.txt` and `sitemap.xml` in browser
4. Test all 3 locales end-to-end (en, bn-BD, sv)
5. Verify Bengali text renders at line-height ≥ 1.7
6. Confirm no `SUPABASE_SERVICE_ROLE_KEY` or Amazon secret in client bundle (`grep -r "service_role" .next/`)
7. Submit sitemap to Google Search Console
8. Test affiliate redirect flow — click tracking records, Amazon opens in new tab
9. Verify ISR works: update a product in DB, wait for revalidation, confirm page updates
10. Load test price update cron with 500+ products — verify completes within PA-API rate limits

---

## 9. Critical Risks & Solutions

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | **Amazon PA-API rate limiting** | Sync/price updates fail | Exponential backoff, batch requests (10 ASINs max), space calls 1.1s apart, queue system for large catalogs |
| 2 | **Amazon TOS violation** | Account banned, affiliate income lost | Never cache prices > 24 hours (cron enforces this), always show "Buy on Amazon" (not custom checkout), display Amazon branding on affiliate buttons per TOS |
| 3 | **Stale prices displayed** | User sees wrong price, loses trust | ISR revalidation at 1h, "Price as of [time]" disclaimer, price_history table for audit trail |
| 4 | **PA-API downtime** | No product sync possible | Serve existing DB data, mark `availability: 'unknown'`, alert via webhook to Slack |
| 5 | **Missing translations** | Broken UI for bn-BD/sv users | `t()` helper always falls back to `en`; translation completeness dashboard in admin |
| 6 | **SEO: duplicate content** | Google penalizes across locales | Canonical URLs + `hreflang` tags on every page; unique `meta_description` per locale |
| 7 | **Bengali font not loading** | Unreadable text for bn-BD users | Noto Sans Bengali loaded via `next/font` with `display: swap`; CSS fallback chain |
| 8 | **Click fraud** | Inflated analytics | `ip_hash` + rate limiting on click_tracking inserts (RLS + Edge Function); session dedup |
| 9 | **Product delisted on Amazon** | 404-like experience | Mark `is_active = false` after 3 failed lookups; show "Currently unavailable" instead of hiding |
| 10 | **JSONB query performance** | Slow category/search pages | GIN indexes on all JSONB columns; tsvector indexes for FTS; query by locale-specific key path |
| 11 | **Cart data loss** | User loses cart on browser clear | Offer optional Supabase sync for authenticated users; cart_items table with RLS |
| 12 | **Secret key exposure** | Security breach | All secrets in Supabase Vault; CI check: `grep -r "service_role\|AMAZON_SECRET" src/` must return empty |

---

## Appendix: Amazon Affiliate Compliance Checklist

Per the [Amazon Associates Program Operating Agreement](https://affiliate-program.amazon.com/help/operating/agreement):

- ✅ All prices must be fetched from PA-API and refreshed within 24 hours
- ✅ Must display "Available on Amazon" or "Buy on Amazon" — not imply direct sale
- ✅ Product images must come from PA-API (not scraped)
- ✅ Must include affiliate disclosure: "As an Amazon Associate, we earn from qualifying purchases"
- ✅ No cloaking affiliate links (URL must visibly go to Amazon)
- ✅ No email-based affiliate link distribution without approval
- ✅ No price comparison with other retailers using PA-API data
- ❌ Never implement direct checkout — always redirect to Amazon
- ❌ Never display cached prices older than 24 hours
