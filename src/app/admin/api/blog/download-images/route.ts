import { NextRequest, NextResponse } from "next/server";
import { withAdmin, EDITOR_OR_ADMIN } from "@/app/admin/_lib/with-admin";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { generateSeoFilename, sanitizeFilename } from "@/lib/utils/slug";
import { assertSafeUrl, SsrfError } from "@/lib/api/ssrf";
import { badRequest } from "@/lib/api/errors";

const downloadImagesSchema = z.object({
  images: z.array(z.object({
    src: z.string().url("Invalid image URL"),
    alt: z.string().max(500).optional(),
    title: z.string().max(500).optional(),
  })).max(10, "Maximum 10 images per request"),
  blogTitle: z.string().min(1, "Blog title is required").max(300),
});

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Timeout per image download: 10 seconds
const DOWNLOAD_TIMEOUT = 10000;

async function downloadImage(url: string, timeout: number = DOWNLOAD_TIMEOUT): Promise<{
  buffer: Buffer;
  contentType: string;
  extension: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      throw new Error(`Invalid image type: ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Image too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (max 5MB)`);
    }

    // Determine file extension
    const extension = contentType.split('/')[1] || 'jpg';

    return { buffer, contentType, extension };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Download timeout');
    }
    throw error;
  }
}

export const POST = withAdmin(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest({ reason: "Invalid JSON body" });
  }

  const parsed = downloadImagesSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest({ issues: parsed.error.flatten() });
  }

  const { images, blogTitle } = parsed.data;

  // Create upload directory if it doesn't exist
  const uploadDir = join(process.cwd(), "public", "uploads", "blog");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create upload directory:", err);
  }

  const downloaded: Array<{
    originalUrl: string;
    path: string;
    publicUrl: string;
    alt: string;
    title: string;
  }> = [];

  const failed: Array<{
    url: string;
    error: string;
  }> = [];

  // Download images sequentially to avoid overwhelming the server.
  for (const image of images) {
    try {
      // SSRF guard — refuse internal / private network addresses.
      let safe: URL;
      try {
        safe = await assertSafeUrl(image.src);
      } catch (e) {
        if (e instanceof SsrfError) throw e;
        throw e;
      }

      // Download image
      const { buffer, extension } = await downloadImage(safe.toString());

      // Generate SEO-friendly filename
      const filename = generateSeoFilename(blogTitle, extension);
      const sanitizedFilename = sanitizeFilename(filename);

      // Save to disk
      const filePath = join(uploadDir, sanitizedFilename);
      await writeFile(filePath, buffer);

      // Public URL - use relative path to avoid domain issues
      const publicUrl = `/uploads/blog/${sanitizedFilename}`;

      downloaded.push({
        originalUrl: image.src,
        path: filePath,
        publicUrl,
        alt: image.alt || "",
        title: image.title || "",
      });
    } catch (error) {
      console.error(`Failed to download ${image.src}:`, error);
      failed.push({
        url: image.src,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    success: true,
    downloaded,
    failed,
    message: `Downloaded ${downloaded.length} of ${images.length} images`,
  });
}, EDITOR_OR_ADMIN);
