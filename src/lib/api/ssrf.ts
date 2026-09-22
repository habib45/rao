/**
 * SSRF guard for server-side `fetch()` calls.
 *
 * Server-rendered routes that accept a URL from the client (scrapers,
 * AI-image-URL inputs, image downloaders) MUST pass every URL through
 * `assertSafeUrl()` before issuing the request. Without this, an attacker
 * can probe `http://169.254.169.254/latest/meta-data/` (cloud metadata),
 * `http://localhost:6379/` (internal Redis), or otherwise pivot off the
 * Next.js node into the internal network.
 *
 * Policy:
 *   - Only http(s) protocols.
 *   - No loopback, link-local, private, or cloud-metadata IPs (v4 + v6).
 *   - Hostnames resolve via DNS; both the resolved address and the original
 *     hostname are checked. Blocklists resolve to IPs so `localhost` and
 *     `metadata.google.internal` are caught regardless of DNS tricks.
 *   - Optional allowlist via env: SSRF_ALLOWED_HOSTNAMES=cdn.example.com,...
 *
 * On rejection, throws `SsrfError` which route handlers should map to a
 * 400 response (with a non-leaky message).
 */

export class SsrfError extends Error {
  readonly status = 400 as const;
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

const PRIVATE_IPV4_RANGES: Array<[number, number]> = [
  [0x00000000, 0x00ffffff], // 0.0.0.0/8 — "this network"
  [0x0a000000, 0x0affffff], // 10.0.0.0/8
  [0xac100000, 0xac1fffff], // 172.16.0.0/12
  [0xc0a80000, 0xc0a8ffff], // 192.168.0.0/16
  [0x7f000000, 0x7fffffff], // 127.0.0.0/8 — loopback
  [0xa9fe0000, 0xa9feffff], // 169.254.0.0/16 — link-local / cloud metadata
  [0xfc000000, 0xfdffffff], // 192.0.0.0/8, 192.88.99.0/24 — special use
  [0xfec00000, 0xfeffffff], // 192.88.99.0/24, 192.168.0.0/16 reserved
];

function ipv4ToInt(octets: number[]): number {
  return ((octets[0]! << 24) | (octets[1]! << 16) | (octets[2]! << 8) | octets[3]!) >>> 0;
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const intVal = ipv4ToInt(nums);
  return PRIVATE_IPV4_RANGES.some(([lo, hi]) => intVal >= lo && intVal <= hi);
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized === "::") return true;
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    // fe80::/10 — link-local
    return true;
  }
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    // fc00::/7 — unique local
    return true;
  }
  if (normalized.startsWith("ff")) {
    // ff00::/8 — multicast
    return true;
  }
  // IPv4-mapped IPv6 ::ffff:x.x.x.x — pull out the IPv4 portion
  const v4Mapped = normalized.match(/^::ffff:([0-9.]+)$/);
  if (v4Mapped) return isPrivateIpv4(v4Mapped[1]!);
  return false;
}

function isPrivateAddress(addr: string): boolean {
  // Strip IPv6 zone id (e.g. fe80::1%eth0)
  const bare = addr.split("%")[0]!;
  if (bare.includes(":")) return isPrivateIpv6(bare);
  return isPrivateIpv4(bare);
}

function getAllowedHostnames(): Set<string> {
  const raw = process.env.SSRF_ALLOWED_HOSTNAMES ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0),
  );
}

/**
 * Resolve all A/AAAA records for a hostname and return them. Uses the Node
 * `dns/promises` module; available at runtime (not in edge). Returns an empty
 * array if resolution fails so the caller can refuse.
 */
async function resolveHostname(hostname: string): Promise<string[]> {
  // Skip resolution if the hostname is already an IP literal
  if (/^[0-9.]+$/.test(hostname) || hostname.includes(":")) {
    return [hostname];
  }
  try {
    // Lazy import so this module can also be imported in edge runtimes.
    // Edge runtimes don't allow raw DNS lookup; in that case allowlist-only.
    const dns = await import("dns/promises");
    const results = await dns.lookup(hostname, { all: true });
    return results.map((r) => r.address);
  } catch {
    return [];
  }
}

/**
 * Throws `SsrfError` if `rawUrl` is unsafe to fetch from a Next.js server.
 * Otherwise returns the parsed `URL` so callers can reuse it.
 */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfError("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfError(`Unsupported URL protocol: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Always block obvious loopback / metadata hostnames even if DNS is unavailable.
  if (
    hostname === "localhost" ||
    hostname === "ip6-localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "metadata.google.internal"
  ) {
    throw new SsrfError("URL points to an internal address");
  }

  // Allowlist fast-path
  const allowed = getAllowedHostnames();
  if (allowed.has(hostname)) return parsed;

  // DNS-based check
  const addresses = await resolveHostname(hostname);
  if (addresses.length === 0) {
    throw new SsrfError("Unable to resolve hostname");
  }
  for (const addr of addresses) {
    if (isPrivateAddress(addr)) {
      throw new SsrfError("URL points to an internal address");
    }
  }

  return parsed;
}

/** True if `addr` (a literal IPv4 or IPv6 string) is private/loopback. */
export function isPrivateIp(addr: string): boolean {
  return isPrivateAddress(addr);
}