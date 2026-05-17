import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../subscribe/route";

// Mock fetch
global.fetch = vi.fn();

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(body: unknown) {
    return new NextRequest("http://localhost:3000/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  it("returns 200 with valid email and consent", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const req = makeRequest({
      email: "test@example.com",
      consent: true,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/newsletter/subscribe"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("test@example.com"),
      })
    );
  });

  it("returns 400 with invalid email", async () => {
    const req = makeRequest({
      email: "not-an-email",
      consent: true,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("returns 400 when consent is false", async () => {
    const req = makeRequest({
      email: "test@example.com",
      consent: false,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Consent required");
  });

  it("accepts an optional name", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const req = makeRequest({
      email: "test@example.com",
      name: "John Doe",
      consent: true,
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("John Doe"),
      })
    );
  });

  it("accepts an optional locale", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const req = makeRequest({
      email: "test@example.com",
      locale: "bn-BD",
      consent: true,
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("bn-BD"),
      })
    );
  });

  it("defaults locale to en when not provided", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const req = makeRequest({
      email: "test@example.com",
      consent: true,
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const body = fetchCall[1] as { body: string };
    const parsedBody = JSON.parse(body.body);
    expect(parsedBody.locale).toBe("en");
  });

  it("hashes IP address from x-real-ip header", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const req = new NextRequest("http://localhost:3000/api/newsletter/subscribe", {
      method: "POST",
      headers: { "x-real-ip": "192.168.1.1" },
      body: JSON.stringify({ email: "test@example.com", consent: true }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const body = fetchCall[1] as { body: string };
    const parsedBody = JSON.parse(body.body);
    expect(parsedBody.ip_hash).toBeDefined();
    expect(parsedBody.ip_hash).not.toBe("192.168.1.1");
  });

  it("hashes IP address from x-forwarded-for header", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const req = new NextRequest("http://localhost:3000/api/newsletter/subscribe", {
      method: "POST",
      headers: { "x-forwarded-for": "10.0.0.1, 10.0.0.2" },
      body: JSON.stringify({ email: "test@example.com", consent: true }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const body = fetchCall[1] as { body: string };
    const parsedBody = JSON.parse(body.body);
    expect(parsedBody.ip_hash).toBeDefined();
  });

  it("defaults to unknown IP when headers missing", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const req = makeRequest({
      email: "test@example.com",
      consent: true,
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const body = fetchCall[1] as { body: string };
    const parsedBody = JSON.parse(body.body);
    expect(parsedBody.ip_hash).toBeDefined();
  });

  it("returns 500 when MySQL API fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Database error" }),
    } as Response);

    const req = makeRequest({
      email: "test@example.com",
      consent: true,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Database error");
  });

  it("returns 500 when MySQL API fails with no error message", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const req = makeRequest({
      email: "test@example.com",
      consent: true,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Subscription failed");
  });

  it("handles malformed JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/newsletter/subscribe", {
      method: "POST",
      body: "invalid json",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });
});
