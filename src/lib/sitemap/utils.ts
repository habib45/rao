/**
 * Shared sitemap utility functions
 * These are used by both the public sitemap.ts and admin API routes
 */

/** Static (non-content) pages emitted by the public sitemap. */
export const SITEMAP_STATIC_PAGES = [
  { path: "", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/categories", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/search", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/cart", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/privacy-policy", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/terms-of-service", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/affiliate-disclaimer", priority: 0.5, changeFrequency: "monthly" as const },
];

/**
 * A sitemap base URL must be an absolute http(s) origin. Any other scheme
 * (`javascript:`, `data:`, `file:` …) would end up in admin links and in the
 * generated sitemap entries.
 */
export function isSafeBaseUrl(raw: unknown): raw is string {
  if (typeof raw !== "string" || raw.trim() === "") return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function extractSlugFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split("/").filter(Boolean);
    
    // Handle locale-prefixed URLs (e.g., /en/products/slug)
    if (parts.length >= 2 && parts[0].match(/^(en|bn-BD|sv)$/)) {
      return parts.slice(1).join("/");
    }
    
    // Handle non-locale URLs (e.g., /products/slug or just /slug)
    return parts.join("/") || null;
  } catch {
    return null;
  }
}

/** A published sitemap should only contain https:// URLs on a public host. */
export function isDevelopmentUrl(url: string): boolean {
  return url.startsWith("http://") ||
         url.includes("localhost") || 
         url.includes("127.0.0.1") ||
         url.includes("192.168.") ||
         url.includes("10.") ||
         url.includes(".local");
}

export function getUrlType(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split("/").filter(Boolean);
    
    // Remove locale prefix if present
    const contentParts = parts[0]?.match(/^(en|bn-BD|sv)$/) ? parts.slice(1) : parts;
    
    if (contentParts.length === 0) return "static";
    if (contentParts[0] === "products") return "product";
    if (contentParts[0] === "categories") return "category";
    if (contentParts[0] === "blog" && contentParts[1] === "category") return "blog_category";
    if (contentParts[0] === "blog") return "blog_post";
    
    return "static";
  } catch {
    return "unknown";
  }
}