// Supabase Edge Function: import-product
// Phase 9 — single-ASIN import, invoked by the admin panel on demand.
// Authentication: the admin API route signs the invocation with the service-role key,
// which Supabase forwards as Authorization: Bearer <service_role_key>. We compare it
// to SUPABASE_SERVICE_ROLE_KEY from Deno.env.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  signRequest,
  validateBearerToken,
} from "../_shared/amazon-paapi.ts";
import type { PAAPIConfig, GetItemsResponse } from "../_shared/amazon-paapi.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Only the admin route (which ships the service-role key server-side)
  // is allowed to invoke this function. No public anon access.
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!validateBearerToken(authHeader, serviceKey)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { asin?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const asin = body?.asin;
  if (typeof asin !== "string" || !/^[A-Z0-9]{10}$/.test(asin)) {
    return new Response(
      JSON.stringify({ error: "asin must be 10 uppercase alphanumerics" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const config: PAAPIConfig = {
    accessKey: Deno.env.get("AMAZON_ACCESS_KEY")!,
    secretKey: Deno.env.get("AMAZON_SECRET_KEY")!,
    partnerTag: Deno.env.get("AMAZON_PARTNER_TAG")!,
    host: Deno.env.get("AMAZON_HOST") ?? "webservices.amazon.com",
    region: "us-east-1",
    marketplace: "www.amazon.com",
  };

  const payload = JSON.stringify({
    ItemIds: [asin],
    ItemIdType: "ASIN",
    PartnerTag: config.partnerTag,
    PartnerType: "Associates",
    Marketplace: config.marketplace,
    Resources: [
      "ItemInfo.Title",
      "ItemInfo.Features",
      "ItemInfo.ByLineInfo",
      "ItemInfo.ContentInfo",
      "Images.Primary.Large",
      "Images.Variants.Large",
      "Offers.Listings.Price",
      "Offers.Listings.SavingBasis",
      "Offers.Listings.Availability.Type",
      "Offers.Listings.Availability.Message",
      "BrowseNodeInfo.BrowseNodes",
    ],
  });

  try {
    const { headers } = signRequest("GetItems", payload, config);
    const res = await fetch(`https://${config.host}/paapi5/getitems`, {
      method: "POST",
      headers,
      body: payload,
    });

    if (!res.ok) {
      const errBody = await res.text();
      return new Response(
        JSON.stringify({ error: `PA-API ${res.status}: ${errBody}` }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = (await res.json()) as GetItemsResponse;
    const item = data?.ItemsResult?.Items?.[0];

    if (!item) {
      return new Response(
        JSON.stringify({ error: "ASIN not found on Amazon" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ item }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
});
