import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/app/admin/_lib/with-admin";
import { z } from "zod";
import * as cheerio from "cheerio";
import { assertSafeUrl, SsrfError } from "@/lib/api/ssrf";
import { badRequest } from "@/lib/api/errors";

const scrapeUrlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
});

async function scrapeWithFetch(url: string): Promise<{
  title: string;
  description: string;
  content: string;
  keywords: string[];
  headings: string[];
  images: Array<{
    src: string;
    alt: string;
    title: string;
  }>;
  author: string;
  publishDate: string;
  wordCount: number;
  readTime: number;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').text().trim() || 
                 $('h1').first().text().trim() || 
                 $('[property="og:title"]').attr('content') || '';

    // Extract description
    const description = $('meta[name="description"]').attr('content') || 
                       $('[property="og:description"]').attr('content') || 
                       $('meta[name="twitter:description"]').attr('content') || '';

    // Extract keywords
    const keywords = ($('meta[name="keywords"]').attr('content') || '')
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0);

    // Extract headings
    const headings: string[] = [];
    $('h1, h2, h3, h4, h5, h6').each((i: number, el: cheerio.Element) => {
      const text = $(el).text().trim();
      if (text && text.length > 0 && headings.length < 20) {
        headings.push(text);
      }
    });

    // Extract images
    const images: Array<{src: string, alt: string, title: string}> = [];
    $('img').each((i: number, el: cheerio.Element) => {
      const $img = $(el);
      const src = $img.attr('src');
      const alt = $img.attr('alt') || '';
      const title = $img.attr('title') || '';
      
      if (src && src.length > 0 && images.length < 10) {
        // Convert relative URLs to absolute
        let absoluteSrc = src;
        if (src.startsWith('/')) {
          const baseUrl = new URL(url);
          absoluteSrc = `${baseUrl.protocol}//${baseUrl.host}${src}`;
        } else if (src.startsWith('//')) {
          absoluteSrc = `https:${src}`;
        } else if (!src.startsWith('http')) {
          const baseUrl = new URL(url);
          absoluteSrc = `${baseUrl.protocol}//${baseUrl.host}/${src}`;
        }
        
        images.push({
          src: absoluteSrc,
          alt: alt.trim(),
          title: title.trim()
        });
      }
    });

    // Extract author
    const author = $('meta[name="author"]').attr('content') ||
                   $('[property="article:author"]').attr('content') ||
                   $('[rel="author"]').text().trim() ||
                   $('.author').text().trim() ||
                   $('.by-author').text().trim() ||
                   '';

    // Extract publish date
    const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                        $('meta[name="date"]').attr('content') ||
                        $('meta[name="publish-date"]').attr('content') ||
                        $('.publish-date').text().trim() ||
                        $('.date').text().trim() ||
                        $('[datetime]').attr('datetime') ||
                        '';

    // Extract main content
    let content = '';
    
    // Try different content selectors in order of preference
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.blog-content',
      '.story-body',
      '.post-body',
      'main',
      '.main-content',
      '#content',
      '#main'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Remove unwanted elements
        element.find('script, style, nav, header, footer, aside, .sidebar, .ads, .advertisement, .social-share').remove();
        
        // Get HTML content for rich text display
        content = element.html() || element.text().trim();
        
        // If content is substantial, break
        if (content.length > 200) {
          break;
        }
      }
    }

    // Fallback to body content if no specific content found
    if (content.length < 200) {
      $('script, style, nav, header, footer, aside, .sidebar, .ads, .advertisement, .social-share').remove();
      content = $('body').html() || $('body').text().trim();
    }

    // Clean up HTML content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .substring(0, 20000); // Increased to 20000 characters

    // Calculate word count and read time
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200)); // Average reading speed: 200 words/minute

    return {
      title,
      description,
      content,
      keywords,
      headings,
      images,
      author,
      publishDate,
      wordCount,
      readTime
    };

  } catch (error) {
    console.error('Server-side scraping error:', error);
    throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const POST = withAdmin(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest({ reason: "Invalid JSON body" });
  }

  const parsed = scrapeUrlSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest({ issues: parsed.error.flatten() });
  }

  let safeUrl: URL;
  try {
    safeUrl = await assertSafeUrl(parsed.data.url);
  } catch (e) {
    if (e instanceof SsrfError) return badRequest({ reason: e.message });
    throw e;
  }

  console.log(`Attempting to scrape URL: ${safeUrl.toString()}`);

  const result = await scrapeWithFetch(safeUrl.toString());

  console.log(`Successfully scraped: ${result.title}`);

  return NextResponse.json({
    success: true,
    ...result,
  });
});
