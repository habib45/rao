import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { z } from "zod";
import * as cheerio from "cheerio";

const scrapeUrlSchema = z.object({
  url: z.string().url().refine((url) => {
    try {
      const parsed = new URL(url);
      const validPatterns = [
        // Path patterns
        /\/blog\//i,
        /\/news\//i,
        /\/article\//i,
        /\/post\//i,
        /\/story\//i,
        /\/topics\//i,
        /\/reviews\//i,
        /\/guides\//i,
        /\/tutorials\//i,
        /\/learn\//i,
        /\/resources\//i,
        /\/features\//i,
        /\/explore\//i,
        /\/discover\//i,
        // Domain patterns
        /blog\./i,
        /news\./i,
        /medium\.com/i,
        /substack\.com/i,
        /wordpress\.org/i,
        /blogger\.com/i,
        /outdoorgearlab\.com/i,
        /gearlab\.com/i,
        /wirecutter\.com/i,
        /reviewed\.com/i,
        /tomsguide\.com/i,
        /techradar\.com/i,
        /digitaltrends\.com/i,
        /cnet\.com/i,
        /pcmag\.com/i,
        /engadget\.com/i,
        /verge\.com/i,
        /arstechnica\.com/i
      ];
      
      return validPatterns.some(pattern => 
        pattern.test(parsed.pathname) || pattern.test(parsed.hostname)
      );
    } catch {
      return false;
    }
  }, "Must be a valid news article or blog post URL"),
});

async function scrapeWithFetch(url: string): Promise<{
  title: string;
  description: string;
  content: string;
  keywords: string[];
  headings: string[];
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
      if (text && text.length > 0 && headings.length < 10) {
        headings.push(text);
      }
    });

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
        
        // Get text content
        content = element.text().trim();
        
        // If content is substantial, break
        if (content.length > 200) {
          break;
        }
      }
    }

    // Fallback to body content if no specific content found
    if (content.length < 200) {
      $('script, style, nav, header, footer, aside, .sidebar, .ads, .advertisement, .social-share').remove();
      content = $('body').text().trim();
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .substring(0, 5000); // Limit to 5000 characters

    return {
      title,
      description,
      content,
      keywords,
      headings
    };

  } catch (error) {
    console.error('Server-side scraping error:', error);
    throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { url } = scrapeUrlSchema.parse(body);

    console.log(`Attempting to scrape URL: ${url}`);

    const result = await scrapeWithFetch(url);

    console.log(`Successfully scraped: ${result.title}`);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('URL scraping error:', error);
    
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
      { error: "Failed to scrape URL" },
      { status: 500 }
    );
  }
}
