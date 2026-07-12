/**
 * Minimal in-memory token-bucket rate limiter.
 *
 * Why in-memory? It is sufficient for a single Next.js node instance (which
 * the project runs in production). If the app is scaled horizontally the
 * limiter should be swapped for a shared store (Upstash Redis, etc.).
 *
 * The bucket is keyed by an opaque identifier (route, IP, etc.). Each call
 * refunds `refillPerSec` tokens up to `capacity`, then consumes one. If the
 * bucket is empty, the request is rejected with 429.
 */

import { NextRequest, NextResponse } from "next/server";
import { tooManyRequests } from "@/lib/api/errors";

interface BucketOptions {
  key: string;
  capacity: number;
  refillPerSec: number;
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

function takeBucket(opts: BucketOptions, identifier: string): boolean {
  const id = `${opts.key}:${identifier}`;
  const now = Date.now();
  const bucket = buckets.get(id) ?? {
    tokens: opts.capacity,
    lastRefill: now,
  };

  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(
    opts.capacity,
    bucket.tokens + elapsed * opts.refillPerSec,
  );
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    buckets.set(id, bucket);
    return false;
  }

  bucket.tokens -= 1;
  buckets.set(id, bucket);
  return true;
}

function identifierFor(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

type Handler = (request: NextRequest) => Promise<NextResponse> | NextResponse;

export function withRateLimit(
  options: BucketOptions,
  handler: Handler,
): Handler {
  return async (request: NextRequest) => {
    const id = identifierFor(request);
    if (!takeBucket(options, id)) {
      return tooManyRequests({ key: options.key });
    }
    return handler(request);
  };
}
