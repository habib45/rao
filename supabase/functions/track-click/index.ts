// Supabase Edge Function: track-click
// POST endpoint — records affiliate click and redirects to Amazon
// Core logic: src/lib/amazon/handlers.ts → handleTrackClick

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json();
  const ipHash = await hashIP(req.headers.get("x-forwarded-for") ?? "unknown");

  const { error } = await supabase.from("click_tracking").insert({
    product_id: body.product_id,
    locale: body.locale ?? "en",
    session_id: body.session_id,
    referrer: body.referrer ?? req.headers.get("referer") ?? "",
    user_agent: body.user_agent ?? req.headers.get("user-agent") ?? "",
    ip_hash: ipHash,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
