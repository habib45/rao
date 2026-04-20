// Shared PA-API module for Supabase Edge Functions (Deno)
// Core business logic lives in src/lib/amazon/ (Node.js, Vitest-testable)
// This file adapts it for the Deno Edge Function runtime

export { signRequest } from "../../../src/lib/amazon/sigv4.ts";
export { transformPAAPIItem, transformPrice, extractPrimaryImage, slugify } from "../../../src/lib/amazon/transformers.ts";
export { chunkArray, exponentialBackoff, RateLimiter, validateBearerToken } from "../../../src/lib/amazon/utils.ts";
export type { PAAPIConfig, PAAPIOperation, SearchItemsResponse, GetItemsResponse, PAAPIItem, SyncResult, PriceUpdateResult } from "../../../src/lib/amazon/types.ts";
