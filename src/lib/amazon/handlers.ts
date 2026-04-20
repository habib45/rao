import type {
  SearchItemsResponse,
  GetItemsResponse,
  SyncResult,
  PriceUpdateResult,
} from "./types";
import type { LocaleCode } from "@/types/domain";
import { transformPAAPIItem, transformPrice, extractPrimaryImage } from "./transformers";
import { chunkArray } from "./utils";

interface SupabaseClient {
  from(table: string): {
    select(columns?: string): unknown;
    upsert(row: unknown, options?: { onConflict: string }): Promise<{ error: { message: string } | null }>;
    insert(row: unknown): Promise<{ error: { message: string } | null }>;
    update(row: unknown): unknown;
    eq(column: string, value: unknown): unknown;
    textSearch(column: string, query: string, options?: { type: string }): unknown;
    range(from: number, to: number): Promise<{ data: unknown[]; error: unknown; count: number }>;
    single(): { data: unknown; error: unknown };
  };
}

export async function handleSyncProducts(deps: {
  supabase: SupabaseClient;
  searchItems: (keywords: string, category: string) => Promise<SearchItemsResponse>;
  categories: string[];
}): Promise<SyncResult> {
  const { supabase, searchItems, categories } = deps;
  const results: SyncResult = { synced: 0, errors: [] };

  for (const category of categories) {
    try {
      const data = await searchItems("", category);
      const items = data?.SearchResult?.Items ?? [];

      for (const item of items) {
        const productRow = transformPAAPIItem(item);

        const { error } = await supabase
          .from("products")
          .upsert(productRow, { onConflict: "asin" });

        if (error) {
          results.errors.push(`ASIN ${item.ASIN}: ${error.message}`);
        } else {
          results.synced++;
        }

        const image = extractPrimaryImage(item);
        if (image) {
          await supabase.from("product_images").upsert(
            {
              product_asin: item.ASIN,
              url: image.url,
              width: image.width,
              height: image.height,
              is_primary: true,
              sort_order: 0,
            },
            { onConflict: "product_id,is_primary" },
          );
        }
      }
    } catch (err) {
      results.errors.push(`Category ${category}: ${(err as Error).message}`);
    }
  }

  return results;
}

export async function handleUpdatePrices(deps: {
  supabase: SupabaseClient;
  getItems: (asins: string[]) => Promise<GetItemsResponse>;
  chunkSize: number;
}): Promise<PriceUpdateResult> {
  const { supabase, getItems, chunkSize } = deps;
  const results: PriceUpdateResult = { updated: 0, errors: [] };

  const productsQuery = supabase
    .from("products")
    .select("id, asin, price_cents") as unknown as {
    eq: (col: string, val: boolean) => { data: { id: string; asin: string; price_cents: number }[]; error: unknown };
  };
  const { data: products } = productsQuery.eq("is_active", true);

  if (!products?.length) {
    return results;
  }

  const chunks = chunkArray(products, chunkSize);

  for (const chunk of chunks) {
    try {
      const asins = chunk.map((p) => p.asin);
      const data = await getItems(asins);
      const items = data?.ItemsResult?.Items ?? [];

      for (const item of items) {
        const product = chunk.find((p) => p.asin === item.ASIN);
        if (!product) continue;

        const priceData = transformPrice(item, product.id);
        if (!priceData) continue;

        await supabase.from("price_history").insert(priceData.history);

        if (product.price_cents !== priceData.update.price_cents) {
          const updateChain = supabase.from("products").update(priceData.update) as unknown as {
            eq: (col: string, val: string) => Promise<{ error: unknown }>;
          };
          await updateChain.eq("id", product.id);
          results.updated++;
        }
      }
    } catch (err) {
      results.errors.push((err as Error).message);
    }
  }

  return results;
}

export async function handleTrackClick(deps: {
  supabase: SupabaseClient;
  body: {
    product_id: string;
    locale: string;
    session_id: string;
    referrer: string;
    user_agent: string;
  };
  ipHash: string;
}): Promise<{ success: boolean; error?: string }> {
  const { supabase, body, ipHash } = deps;

  const { error } = await supabase.from("click_tracking").insert({
    product_id: body.product_id,
    locale: body.locale,
    session_id: body.session_id,
    referrer: body.referrer,
    user_agent: body.user_agent,
    ip_hash: ipHash,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

const LOCALE_VECTOR_MAP: Record<LocaleCode, string> = {
  en: "search_vector_en",
  "bn-BD": "search_vector_bn",
  sv: "search_vector_sv",
};

export async function handleSearchProducts(deps: {
  supabase: SupabaseClient;
  query: string;
  locale: LocaleCode;
  page: number;
  pageSize: number;
}): Promise<{ products: unknown[]; total: number }> {
  const { supabase, query, locale, page, pageSize } = deps;
  const vectorColumn = LOCALE_VECTOR_MAP[locale] ?? "search_vector_en";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const chain = supabase
    .from("products")
    .select("*") as unknown as {
    textSearch: (col: string, q: string, opts: { type: string }) => {
      range: (from: number, to: number) => Promise<{ data: unknown[]; error: unknown; count: number }>;
    };
  };

  const { data, error, count } = await chain
    .textSearch(vectorColumn, query, { type: "plain" })
    .range(from, to);

  if (error) {
    return { products: [], total: 0 };
  }

  return { products: data ?? [], total: count ?? 0 };
}
