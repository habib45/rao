/**
 * Generate SEO-friendly slug from text
 * Rules:
 * - Lowercase only
 * - Replace spaces with hyphens
 * - Remove special characters
 * - Max 50 characters
 */
export function generateSlug(text: string, maxLength: number = 50): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, maxLength);
}

/**
 * Generate SEO-friendly filename for images
 * Format: {slugified-title}-{timestamp}.{ext}
 * Example: nextjs-seo-guide-20260615-020530.webp
 */
export function generateSeoFilename(title: string, extension: string): string {
  const slug = generateSlug(title, 40); // Leave room for timestamp
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/T/, '-')
    .substring(0, 15); // YYYYMMDD-HHMMSS
  
  const cleanExt = extension.toLowerCase().replace(/^\./, '');
  
  return `${slug}-${timestamp}.${cleanExt}`;
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .replace(/^\.+/, '');
}
