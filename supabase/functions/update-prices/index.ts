// Supabase Edge Function: update-prices
// Cron: daily 1 AM UTC — fetches latest prices for active products
// Core logic: src/lib/amazon/handlers.ts → handleUpdatePrices

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  signRequest,
  chunkArray,
  RateLimiter,
  exponentialBackoff,
  validateBearerToken,
} from "../_shared/amazon-paapi.ts";
import type { PAAPIConfig, GetItemsResponse } from "../_shared/amazon-paapi.ts";

serve(async (req) => {
  // Verify cron secret — Authorization header check
  const authHeader = req.headers.get("Authorization");
  if (!validateBearerToken(authHeader, Deno.env.get("CRON_SECRET") ?? "")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const config: PAAPIConfig = {
    accessKey: Deno.env.get("AMAZON_ACCESS_KEY")!,
    secretKey: Deno.env.get("AMAZON_SECRET_KEY")!,
    partnerTag: Deno.env.get("AMAZON_PARTNER_TAG")!,
    host: "webservices.amazon.com",
    region: "us-east-1",
    marketplace: "www.amazon.com",
  };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: products } = await supabase
    .from("products")
    .select("id, asin, price_cents")
    .eq("is_active", true);

  if (!products?.length) {
    return new Response(JSON.stringify({ updated: 0 }));
  }

  const rateLimiter = new RateLimiter(1100);
  let updated = 0;
  const errors: string[] = [];
  const chunks = chunkArray(products, 10);

  for (const chunk of chunks) {
    try {
      await rateLimiter.acquire();
      const asins = chunk.map((p: { asin: string }) => p.asin);
      const payload = JSON.stringify({
        ItemIds: asins,
        ItemIdType: "ASIN",
        PartnerTag: config.partnerTag,
        PartnerType: "Associates",
        Marketplace: config.marketplace,
        Resources: [
          "Offers.Listings.Price",
          "Offers.Listings.SavingBasis",
          "Offers.Listings.Availability.Type",
        ],
      });

      const { headers } = signRequest("GetItems", payload, config);
      const res = await exponentialBackoff(
        () =>
          fetch(`https://${config.host}/paapi5/getitems`, {
            method: "POST",
            headers,
            body: payload,
          }),
        { retryOn: (err: Error) => err.message.includes("429") },
      );

      if (!res.ok) throw new Error(`PA-API ${res.status}`);
      const data: GetItemsResponse = await res.json();
      const items = data?.ItemsResult?.Items ?? [];

      for (const item of items) {
        const price = item.Offers?.Listings?.[0]?.Price;
        if (!price) continue;
        const newPriceCents = Math.round(price.Amount * 100);
        const product = chunk.find((p: { asin: string }) => p.asin === item.ASIN);
        if (!product) continue;

        await supabase.from("price_history").insert({
          product_id: product.id,
          price_cents: newPriceCents,
          currency: price.Currency,
        });

        if (product.price_cents !== newPriceCents) {
          await supabase
            .from("products")
            .update({
              price_cents: newPriceCents,
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

  return new Response(JSON.stringify({ updated, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});
