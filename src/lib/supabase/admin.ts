import { createClient } from "@supabase/supabase-js";
import "server-only";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      `Supabase admin client initialization failed: Missing environment variables. ` +
      `URL: ${url ? 'present' : 'missing'}, Key: ${key ? 'present' : 'missing'}`
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
