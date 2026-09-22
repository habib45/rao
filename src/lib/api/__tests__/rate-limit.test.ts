import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

beforeEach(() => {
  vi.useFakeTimers();
});

async function importFresh() {
  vi.resetModules();
  return await import("@/lib/api/rate-limit");
}

function makeReq(ip = "1.2.3.4") {
  return new NextRequest("http://localhost/api/x", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("withRateLimit — token bucket", () => {
  it("allows the first N requests up to capacity", async () => {
    const { withRateLimit } = await importFresh();
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));

    const wrapped = withRateLimit(
      { key: "test-burst", capacity: 3, refillPerSec: 0 },
      handler,
    );

    for (let i = 0; i < 3; i++) {
      const res = await wrapped(makeReq());
      expect(res.status).toBe(200);
    }
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("returns 429 once the bucket is empty", async () => {
    const { withRateLimit } = await importFresh();
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));

    const wrapped = withRateLimit(
      { key: "test-empty", capacity: 2, refillPerSec: 0 },
      handler,
    );

    await wrapped(makeReq());
    await wrapped(makeReq());
    const res = await wrapped(makeReq());
    expect(res.status).toBe(429);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("refills tokens over time", async () => {
    const { withRateLimit } = await importFresh();
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));

    // capacity 1, refill 1/sec — after 1s of waiting, another call succeeds.
    const wrapped = withRateLimit(
      { key: "test-refill", capacity: 1, refillPerSec: 1 },
      handler,
    );

    await wrapped(makeReq()); // consumes token
    const blocked = await wrapped(makeReq());
    expect(blocked.status).toBe(429);

    vi.advanceTimersByTime(1500);
    const ok = await wrapped(makeReq());
    expect(ok.status).toBe(200);
  });

  it("isolates buckets per identifier (IP)", async () => {
    const { withRateLimit } = await importFresh();
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));

    const wrapped = withRateLimit(
      { key: "test-per-ip", capacity: 1, refillPerSec: 0 },
      handler,
    );

    await wrapped(makeReq("1.1.1.1")); // consumes for 1.1.1.1
    const blocked = await wrapped(makeReq("1.1.1.1"));
    expect(blocked.status).toBe(429);

    const otherOk = await wrapped(makeReq("2.2.2.2")); // different IP — fresh bucket
    expect(otherOk.status).toBe(200);
  });

  it("isolates buckets per key", async () => {
    const { withRateLimit } = await importFresh();
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));

    const a = withRateLimit(
      { key: "key-a", capacity: 1, refillPerSec: 0 },
      handler,
    );
    const b = withRateLimit(
      { key: "key-b", capacity: 1, refillPerSec: 0 },
      handler,
    );

    await a(makeReq()); // exhaust key-a bucket
    const blocked = await a(makeReq());
    expect(blocked.status).toBe(429);

    const ok = await b(makeReq()); // key-b is independent
    expect(ok.status).toBe(200);
  });
});