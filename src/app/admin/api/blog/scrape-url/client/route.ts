import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { z } from "zod";

const scrapeUrlSchema = z.object({
  url: z.string().url(),
});

async function scrapeWithClientSide(url: string): Promise<{
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
    // Use CORS proxy for client-side scraping
    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://thingproxy.freeboard.io/fetch/${url}`
    ];

    let html = '';
    let lastError: Error | null = null;

    for (const proxyUrl of proxyUrls) {
      try {
        console.log(`Trying proxy: ${proxyUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          html = await response.text();
          if (html && html.length > 100) {
            break; // Got valid content
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.log(`Proxy ${proxyUrl} failed:`, lastError.message);
        continue;
      }
    }

    if (!html || html.length < 100) {
      throw new Error(`Failed to fetch content via proxies. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    // Basic HTML parsing without cheerio (since this is fallback)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    const keywords = keywordsMatch ? 
      keywordsMatch[1].split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0) : [];

    // Extract headings
    const headingMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi);
    const headings = headingMatches ? 
      headingMatches.slice(0, 10).map((h: string) => h.replace(/<[^>]*>/g, '').trim()).filter((h: string) => h.length > 0) : [];

    // Extract main content (basic approach)
    let content = '';
    
    // Remove script and style tags
    const cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

    // Try to find content in common containers
    const contentSelectors = [
      /<article[^>]*>([\s\S]*?)<\/article>/gi,
      /<main[^>]*>([\s\S]*?)<\/main>/gi,
      /<div[^>]*class=["'][^"']*(?:content|post|article|story|blog)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    ];

    for (const selector of contentSelectors) {
      const matches = cleanHtml.match(selector);
      if (matches && matches.length > 0) {
        const match = matches[0];
        const textContent = match.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (textContent.length > 200) {
          content = textContent;
          break;
        }
      }
    }

    // Fallback to body content
    if (content.length < 200) {
      const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        content = bodyMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }

    // Extract images (basic approach)
    const imageMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
    const images = imageMatches ? 
      imageMatches.slice(0, 10).map((imgTag: string) => {
        const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
        const altMatch = imgTag.match(/alt=["']([^"']*)["']/);
        const titleMatch = imgTag.match(/title=["']([^"']*)["']/);
        
        if (srcMatch) {
          let src = srcMatch[1];
          // Convert relative URLs to absolute
          if (src.startsWith('/')) {
            const baseUrl = new URL(url);
            src = `${baseUrl.protocol}//${baseUrl.host}${src}`;
          } else if (src.startsWith('//')) {
            src = `https:${src}`;
          } else if (!src.startsWith('http')) {
            const baseUrl = new URL(url);
            src = `${baseUrl.protocol}//${baseUrl.host}/${src}`;
          }
          
          return {
            src,
            alt: altMatch ? altMatch[1].trim() : '',
            title: titleMatch ? titleMatch[1].trim() : ''
          };
        }
        return null;
      }).filter((item): item is {src: string, alt: string, title: string} => item !== null) : [];

    // Extract author (basic approach)
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']+)["']/i);
    const author = authorMatch ? authorMatch[1].trim() : '';

    // Extract publish date (basic approach)
    const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*name=["']date["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<time[^>]*datetime=["']([^"']+)["']/i);
    const publishDate = dateMatch ? dateMatch[1].trim() : '';

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .substring(0, 20000); // Increased to 20000 characters

    // Calculate word count and read time
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

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
    console.error('Client-side scraping error:', error);
    throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { url } = scrapeUrlSchema.parse(body);

    console.log(`Attempting client-side scraping for URL: ${url}`);

    const result = await scrapeWithClientSide(url);

    console.log(`Successfully scraped via client-side: ${result.title}`);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Client-side URL scraping error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid URL format", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to scrape URL via client-side method" },
      { status: 500 }
    );
  }
}
