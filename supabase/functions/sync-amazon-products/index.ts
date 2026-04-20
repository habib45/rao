// Supabase Edge Function: sync-amazon-products
// Cron: Sundays 3 AM UTC — searches Amazon categories and upserts products
// Core logic: src/lib/amazon/handlers.ts → handleSyncProducts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  signRequest,
  RateLimiter,
  exponentialBackoff,
  validateBearerToken,
} from "../_shared/amazon-paapi.ts";
import type { PAAPIConfig, SearchItemsResponse } from "../_shared/amazon-paapi.ts";

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

  const rateLimiter = new RateLimiter(1100);
  const categories = ["Electronics", "Books", "Home", "Fashion"];
  const results = { synced: 0, errors: [] as string[] };

  for (const category of categories) {
    try {
      await rateLimiter.acquire();
      const payload = JSON.stringify({
        Keywords: "",
        SearchIndex: category,
        ItemCount: 10,
        ItemPage: 1,
        PartnerTag: config.partnerTag,
        PartnerType: "Associates",
        Marketplace: config.marketplace,
        Resources: [
          "Images.Primary.Large",
          "ItemInfo.Title",
          "ItemInfo.Features",
          "ItemInfo.ByLineInfo",
          "Offers.Listings.Price",
          "Offers.Listings.SavingBasis",
          "Offers.Listings.Availability.Type",
        ],
      });

      const { headers } = signRequest("SearchItems", payload, config);
      const res = await exponentialBackoff(
        () =>
          fetch(`https://${config.host}/paapi5/searchitems`, {
            method: "POST",
            headers,
            body: payload,
          }),
        { retryOn: (err: Error) => err.message.includes("429") },
      );

      if (!res.ok) throw new Error(`PA-API ${res.status}`);
      const data: SearchItemsResponse = await res.json();
      const items = data?.SearchResult?.Items ?? [];

      for (const item of items) {
        const { error } = await supabase.from("products").upsert(
          {
            asin: item.ASIN,
            name: { en: item.ItemInfo?.Title?.DisplayValue ?? item.ASIN },
            affiliate_url: item.DetailPageURL,
            is_active: true,
          },
          { onConflict: "asin" },
        );
        if (error) results.errors.push(`${item.ASIN}: ${error.message}`);
        else results.synced++;
      }
    } catch (err) {
      results.errors.push(`${category}: ${(err as Error).message}`);
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
