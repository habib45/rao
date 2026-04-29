// Supabase Edge Function: publish-scheduled
// Phase 9 — cron: 0 * * * * (hourly).
// Flips draft products to active when their publish_at time has arrived by
// invoking the publish_scheduled_products() Postgres RPC.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateBearerToken } from "../_shared/amazon-paapi.ts";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!validateBearerToken(authHeader, Deno.env.get("CRON_SECRET") ?? "")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const startedAt = new Date().toISOString();
  const { data, error } = await supabase.rpc("publish_scheduled_products");

  if (error) {
    await supabase.from("sync_logs").insert({
      function_name: "publish-scheduled",
      status: "error",
      items_processed: 0,
      errors: [{ message: error.message }],
      started_at: startedAt,
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const published = typeof data === "number" ? data : 0;
  await supabase.from("sync_logs").insert({
    function_name: "publish-scheduled",
    status: "success",
    items_processed: published,
    errors: [],
    started_at: startedAt,
    completed_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ published }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
