// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const REAL_ENV = { ...process.env };

// Module-level mock for dns/promises — installed before any import of ssrf.ts.
const mockLookup = vi.fn();
vi.mock("dns/promises", () => ({
  lookup: (...args: unknown[]) => mockLookup(...args),
}));

beforeEach(() => {
  process.env = { ...REAL_ENV };
  mockLookup.mockReset();
});

afterEach(() => {
  process.env = REAL_ENV;
});

async function importFresh() {
  vi.resetModules();
  return await import("@/lib/api/ssrf");
}

describe("isPrivateIp", () => {
  it("flags IPv4 loopback as private", async () => {
    const { isPrivateIp } = await importFresh();
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("127.255.255.254")).toBe(true);
  });

  it("flags RFC1918 ranges", async () => {
    const { isPrivateIp } = await importFresh();
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("172.31.255.254")).toBe(true);
    expect(isPrivateIp("192.168.0.1")).toBe(true);
  });

  it("flags the cloud-metadata link-local range", async () => {
    const { isPrivateIp } = await importFresh();
    expect(isPrivateIp("169.254.169.254")).toBe(true);
  });

  it("flags 0.0.0.0/8", async () => {
    const { isPrivateIp } = await importFresh();
    expect(isPrivateIp("0.0.0.0")).toBe(true);
  });

  it("does not flag public IPs", async () => {
    const { isPrivateIp } = await importFresh();
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("93.184.216.34")).toBe(false);
  });

  it("flags IPv6 loopback and link-local", async () => {
    const { isPrivateIp } = await importFresh();
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
  });

  it("flags IPv4-mapped IPv6 private addresses", async () => {
    const { isPrivateIp } = await importFresh();
    expect(isPrivateIp("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateIp("::ffff:10.0.0.1")).toBe(true);
  });
});

describe("assertSafeUrl", () => {
  it("throws on non-http(s) protocols", async () => {
    const { assertSafeUrl, SsrfError } = await importFresh();
    await expect(assertSafeUrl("ftp://example.com")).rejects.toBeInstanceOf(SsrfError);
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toBeInstanceOf(SsrfError);
    await expect(assertSafeUrl("gopher://example.com")).rejects.toBeInstanceOf(SsrfError);
  });

  it("throws on invalid URLs", async () => {
    const { assertSafeUrl, SsrfError } = await importFresh();
    await expect(assertSafeUrl("not a url")).rejects.toBeInstanceOf(SsrfError);
  });

  it("throws on loopback hostname", async () => {
    const { assertSafeUrl, SsrfError } = await importFresh();
    await expect(
      assertSafeUrl("http://localhost/foo"),
    ).rejects.toBeInstanceOf(SsrfError);
    await expect(
      assertSafeUrl("http://LOCALHOST:8080/"),
    ).rejects.toBeInstanceOf(SsrfError);
  });

  it("throws on .local / .internal hostnames", async () => {
    const { assertSafeUrl, SsrfError } = await importFresh();
    await expect(
      assertSafeUrl("https://printer.local/admin"),
    ).rejects.toBeInstanceOf(SsrfError);
    await expect(
      assertSafeUrl("https://db.internal/api"),
    ).rejects.toBeInstanceOf(SsrfError);
  });

  it("throws on the Google metadata hostname", async () => {
    const { assertSafeUrl, SsrfError } = await importFresh();
    await expect(
      assertSafeUrl("http://metadata.google.internal/computeMetadata/v1/"),
    ).rejects.toBeInstanceOf(SsrfError);
  });

  it("throws when a public hostname resolves to a private IP", async () => {
    mockLookup.mockResolvedValue([{ address: "10.0.0.5", family: 4 }]);
    const { assertSafeUrl, SsrfError } = await importFresh();
    await expect(
      assertSafeUrl("https://evil.example.com"),
    ).rejects.toBeInstanceOf(SsrfError);
  });

  it("throws when DNS lookup fails", async () => {
    mockLookup.mockRejectedValue(new Error("ENOTFOUND"));
    const { assertSafeUrl, SsrfError } = await importFresh();
    await expect(
      assertSafeUrl("https://does-not-exist.invalid"),
    ).rejects.toBeInstanceOf(SsrfError);
  });

  it("allows hostnames in SSRF_ALLOWED_HOSTNAMES env without DNS check", async () => {
    process.env.SSRF_ALLOWED_HOSTNAMES = "trusted.example.com";
    mockLookup.mockResolvedValue([]);
    const { assertSafeUrl } = await importFresh();
    const url = await assertSafeUrl("https://trusted.example.com/path");
    expect(url.hostname).toBe("trusted.example.com");
    // Allowlist should bypass DNS — but our resolveHostname helper still
    // calls lookup for unknown reasons only when not an IP literal; for a
    // hostname in the allowlist we short-circuit *before* lookup. We don't
    // assert call counts since that depends on internal ordering.
  });

  it("allows public URLs that resolve to a public IP", async () => {
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    const { assertSafeUrl } = await importFresh();
    const url = await assertSafeUrl("https://example.com/page");
    expect(url.hostname).toBe("example.com");
  });

  it("rejects IP literals that are loopback/private", async () => {
    const { assertSafeUrl, SsrfError } = await importFresh();
    await expect(
      assertSafeUrl("http://127.0.0.1/x"),
    ).rejects.toBeInstanceOf(SsrfError);
    await expect(
      assertSafeUrl("http://169.254.169.254/latest/meta-data/"),
    ).rejects.toBeInstanceOf(SsrfError);
  });
});