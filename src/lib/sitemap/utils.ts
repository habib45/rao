/**
 * Shared sitemap utility functions
 * These are used by both the public sitemap.ts and admin API routes
 */

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

export function isDevelopmentUrl(url: string): boolean {
  return url.includes("localhost") || 
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