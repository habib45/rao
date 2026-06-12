import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { z } from "zod";

const fromUrlSchema = z.object({
  extractedContent: z.object({
    title: z.string(),
    description: z.string(),
    content: z.string(),
    url: z.string(),
    keywords: z.array(z.string()),
    headings: z.array(z.string()),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      title: z.string(),
    })),
    author: z.string(),
    publishDate: z.string(),
    wordCount: z.number(),
    readTime: z.number(),
  }),
  locale: z.enum(["en", "bn-BD", "sv"]).default("en"),
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

function getBlogContentPrompt(extractedContent: {
  title: string;
  description: string;
  content: string;
  url: string;
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
}, locale: string): string {
  const { title, description, content, keywords, headings, images, author, publishDate } = extractedContent;
  
  // Create image HTML for inclusion in content (limit to avoid prompt overflow)
  const imageHtml = images.length > 0 
    ? `\n\n**Available Images to Include:**
${images.slice(0, 3).map((img, index) => `${index + 1}. <img src="${img.src}" alt="${img.alt}" title="${img.title || img.alt}" />`).join('\n')}
${images.length > 3 ? `... and ${images.length - 3} more images available` : ''}`
    : '';

  // Limit content to prevent prompt overflow
  const maxContentLength = 3000;
  const contentSummary = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + "..."
    : content;

  const basePrompt = `You are a professional blog content writer. Based on the following extracted content from a URL, create a comprehensive blog post.

**Source Content:**
Title: ${title}
Description: ${description}
Author: ${author || 'Unknown'}
Publish Date: ${publishDate || 'Unknown'}
Keywords: ${keywords.join(", ")}
Main Headings: ${headings.slice(0, 5).join(", ")}
Word Count: ${content.length} characters
Read Time: ${Math.ceil(content.length / 5)} minutes

Content Summary: ${contentSummary}${imageHtml}

**Instructions:**
1. Create an engaging, SEO-optimized blog post title
2. Write a compelling excerpt (150-200 characters)
3. Generate comprehensive blog content (800-1200 words) in HTML format
4. Create SEO meta title (60 characters max)
5. Write SEO meta description (160 characters max)
6. Suggest relevant tags (5-10 tags)
7. Generate URL-friendly slug

**CRITICAL REQUIREMENT - IMAGES:**
- You MUST include relevant images from the provided image list in your HTML content
- Place images strategically within the content where they make sense
- Use proper HTML img tags: <img src="URL" alt="description" title="title" />
- Include at least 2-3 images throughout the article if available
- Images should enhance the content and reading experience

**Requirements:**
- Content should be original and unique
- Include relevant headings and subheadings (h1, h2, h3 tags)
- Maintain professional but engaging tone
- Incorporate the keywords naturally
- Structure content with introduction, body, and conclusion
- Add value beyond the original content with insights and analysis
- Use proper HTML formatting for better readability

**Output Format:**
Return a JSON object with the following structure:
{
  "title": "Generated blog title",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling excerpt",
  "content": "Full blog content in HTML format with images included",
  "metaTitle": "SEO meta title",
  "metaDescription": "SEO meta description",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  if (locale === "bn-BD") {
    return basePrompt + "\n\n**Additional Requirement:** Generate content in Bengali language while maintaining the same structure and quality.";
  } else if (locale === "sv") {
    return basePrompt + "\n\n**Additional Requirement:** Generate content in Swedish language while maintaining the same structure and quality.";
  }

  return basePrompt;
}

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Gemini API error:", response.status, response.statusText, errorData);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Gemini API response:", JSON.stringify(data).substring(0, 200));
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    console.error("No text in Gemini response:", data);
    throw new Error("No response from Gemini");
  }

  return text;
}

async function callOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("OpenAI API error:", response.status, response.statusText, errorData);
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("OpenAI API response:", JSON.stringify(data).substring(0, 200));
  
  const text = data.choices?.[0]?.message?.content;
  
  if (!text) {
    console.error("No text in OpenAI response:", data);
    throw new Error("No response from OpenAI");
  }

  return text;
}

async function callGroq(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not configured");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mixtral-8x7b-32768",
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Groq API error:", response.status, response.statusText, errorData);
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Groq API response:", JSON.stringify(data).substring(0, 200));
  
  const text = data.choices?.[0]?.message?.content;
  
  if (!text) {
    console.error("No text in Groq response:", data);
    throw new Error("No response from Groq");
  }

  return text;
}

function parseAIResponse(responseText: string): {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
} {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: parse manually if JSON parsing fails
    const lines = responseText.split('\n');
    const result: {
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      metaTitle: string;
      metaDescription: string;
      tags: string[];
    } = {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      tags: []
    };
    
    lines.forEach(line => {
      if (line.includes('"title":')) {
        result.title = line.split('"')[3];
      } else if (line.includes('"slug":')) {
        result.slug = line.split('"')[3];
      } else if (line.includes('"excerpt":')) {
        result.excerpt = line.split('"')[3];
      } else if (line.includes('"content":')) {
        result.content = line.split('"')[3];
      } else if (line.includes('"metaTitle":')) {
        result.metaTitle = line.split('"')[3];
      } else if (line.includes('"metaDescription":')) {
        result.metaDescription = line.split('"')[3];
      } else if (line.includes('"tags":')) {
        result.tags = line.match(/\[(.*?)\]/)?.[1]?.split(',').map((t: string) => t.trim().replace(/"/g, '')) || [];
      }
    });
    
    return result;
  } catch (error) {
    console.error("Error parsing AI response:", error);
    throw new Error("Failed to parse AI response");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    
    // Log incoming data for debugging
    console.log("Received request body keys:", Object.keys(body));
    console.log("Extracted content keys:", Object.keys(body.extractedContent || {}));
    
    const { extractedContent, locale } = fromUrlSchema.parse(body);

    console.log(`Generating blog content from URL: ${extractedContent.url}`);
    console.log("Content length:", extractedContent.content?.length);
    console.log("Images count:", extractedContent.images?.length);

    const prompt = getBlogContentPrompt(extractedContent, locale);
    
    let aiResponse: string;
    let providerUsed: string;

    // Try AI providers in order of preference
    try {
      aiResponse = await callGemini(prompt);
      providerUsed = "Gemini";
    } catch (error) {
      console.log("Gemini failed, trying OpenAI:", error);
      try {
        aiResponse = await callOpenAI(prompt);
        providerUsed = "OpenAI";
      } catch (error2) {
        console.log("OpenAI failed, trying Groq:", error2);
        try {
          aiResponse = await callGroq(prompt);
          providerUsed = "Groq";
        } catch (_error3) {
          throw new Error("All AI providers failed");
        }
      }
    }

    const generatedContent = parseAIResponse(aiResponse);

    console.log(`Successfully generated content using ${providerUsed}`);

    return NextResponse.json({
      success: true,
      provider: providerUsed,
      ...generatedContent
    });

  } catch (error) {
    console.error('URL-based AI generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format", details: error.issues },
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
      { error: "Failed to generate content from URL" },
      { status: 500 }
    );
  }
}
