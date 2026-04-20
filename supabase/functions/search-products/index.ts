// Supabase Edge Function: search-products
// GET endpoint — full-text search across locales using tsvector
// Core logic: src/lib/amazon/handlers.ts → handleSearchProducts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOCALE_VECTOR_MAP: Record<string, string> = {
  en: "search_vector_en",
  "bn-BD": "search_vector_bn",
  sv: "search_vector_sv",
};

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q") ?? "";
  const locale = url.searchParams.get("locale") ?? "en";
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") ?? "10", 10);

  if (!query.trim()) {
    return new Response(JSON.stringify({ products: [], total: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const vectorColumn = LOCALE_VECTOR_MAP[locale] ?? "search_vector_en";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .textSearch(vectorColumn, query, { type: "plain" })
    .eq("is_active", true)
    .range(from, to);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ products: data ?? [], total: count ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
