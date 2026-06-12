import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { z } from "zod";

const aiContentSchema = z.object({
  type: z.enum(["title", "excerpt", "content", "meta_title", "meta_description", "tags", "seo_optimization", "affiliate_content"]),
  topic: z.string().min(1).max(200),
  keywords: z.array(z.string()).optional(),
  tone: z.enum(["professional", "casual", "friendly", "technical", "creative"]).default("professional"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  locale: z.enum(["en", "bn-BD", "sv"]).default("en"),
  existingContent: z.string().optional(),
  aiModel: z.enum(["gpt-4", "gpt-3.5-turbo", "claude-3", "gemini-pro", "groq"]).default("groq"),
});

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

function getPromptForType(type: string, topic: string, options: {
  keywords: string[];
  tone: "professional" | "casual" | "friendly" | "technical" | "creative";
  length: "short" | "medium" | "long";
  existingContent?: string;
}): string {
  const { keywords = [], tone, length, existingContent } = options;
  
  const baseInstructions = {
    professional: "Write in a professional, informative tone suitable for a business audience.",
    casual: "Write in a casual, conversational tone that's easy to read.",
    friendly: "Write in a friendly, approachable tone that builds rapport.",
    technical: "Write in a technical tone with precise terminology and details.",
    creative: "Write in a creative, engaging tone that captures attention."
  };

  const lengthInstructions = {
    short: "Keep it concise and to the point.",
    medium: "Provide a balanced amount of detail.",
    long: "Be comprehensive and thorough in your coverage."
  };

  const basePrompt = `${baseInstructions[tone]} ${lengthInstructions[length]}`;
  
  switch (type) {
    case "title":
      return `Generate 5 compelling blog post titles about: ${topic}. ${basePrompt}. 
Keywords to incorporate: ${keywords.join(", ")}. 
Return only the titles, one per line, without numbering or extra text.`;

    case "excerpt":
      return `Write an engaging blog post excerpt about: ${topic}. ${basePrompt}.
Keywords to include: ${keywords.join(", ")}. 
Make it 150-200 characters. ${existingContent ? `Context: ${existingContent}` : ''}
Return only the excerpt text.`;

    case "content":
      return `Write a comprehensive blog post about: ${topic}. ${basePrompt}.
Keywords to include: ${keywords.join(", ")}. 
Structure with:
- Compelling introduction
- 3-5 main points with subheadings
- Practical examples or insights
- Conclusion with call-to-action
${existingContent ? `Continue from this content: ${existingContent}` : ''}
Return only the blog post content in HTML format with proper heading tags (h2, h3) and paragraphs.`;

    case "meta_title":
      return `Generate 5 SEO-optimized meta titles about: ${topic}. ${basePrompt}.
Keywords: ${keywords.join(", ")}. 
Keep each under 60 characters. 
Return only the titles, one per line.`;

    case "meta_description":
      return `Write an SEO-optimized meta description for a blog post about: ${topic}. ${basePrompt}.
Keywords: ${keywords.join(", ")}. 
Keep it 150-160 characters. 
${existingContent ? `Context: ${existingContent}` : ''}
Return only the meta description text.`;

    case "tags":
      return `Generate 5-10 relevant tags for a blog post about: ${topic}. ${basePrompt}.
Keywords: ${keywords.join(", ")}.
${existingContent ? `Content context: ${existingContent.substring(0, 500)}` : ''}
Return only the tags, one per line, without numbering or extra text. Tags should be lowercase and hyphenated if multi-word.`;

    case "seo_optimization":
      return `Analyze and provide SEO optimization suggestions for this blog content about: ${topic}. ${basePrompt}.
${existingContent ? `Content to analyze: ${existingContent}` : 'No content provided - provide general SEO tips.'}

Provide specific recommendations for:
1. Title optimization (current and suggested improvements)
2. Meta description (150-160 characters with keywords)
3. Heading structure (H1, H2, H3 hierarchy)
4. Keyword density and placement
5. Internal linking opportunities
6. Readability improvements
7. Image alt text suggestions
8. URL structure recommendations

Keywords to focus on: ${keywords.join(", ")}.
Return structured suggestions in JSON format with sections: title, meta_description, headings, keywords, internal_links, readability, images, url.`;

    case "affiliate_content":
      return `Generate affiliate marketing content suggestions for: ${topic}. ${basePrompt}.
${existingContent ? `Existing content: ${existingContent}` : ''}

Provide:
1. Natural affiliate product placement opportunities
2. Product review sections with affiliate links
3. Comparison tables for products
4. "Best of" recommendation lists
5. Call-to-action phrases for conversions
6. Disclosure statements for FTC compliance
7. Product benefit descriptions
8. Buying guide sections

Keywords: ${keywords.join(", ")}.
Return structured suggestions in JSON format with sections: product_placements, reviews, comparisons, recommendations, ctas, disclosures, benefits, buying_guide.`;

    default:
      return `Write content about: ${topic}. ${basePrompt}.`;
  }
}

async function callAI(prompt: string, aiModel: string = "gpt-4") {
  try {
    console.log(`Attempting ${aiModel} API...`);
    
    // Map AI model names to provider names
    let provider = "groq"; // Default to Groq since it's the only working API
    if (aiModel === "gpt-4" || aiModel === "gpt-3.5-turbo") {
      provider = "openai";
    } else if (aiModel === "gemini-pro") {
      provider = "gemini";
    } else if (aiModel === "groq") {
      provider = "groq";
    }
    
    console.log(`Mapped ${aiModel} to provider: ${provider}`);
    console.log(`API Keys available: Gemini=${!!GEMINI_API_KEY}, OpenAI=${!!OPENAI_API_KEY}, Groq=${!!GROQ_API_KEY}`);
    
    if (provider === "gemini" && GEMINI_API_KEY) {
      try {
        console.log("Trying Gemini API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        });

        console.log("Gemini response status:", response.status);
        const data = await response.json();
        console.log("Gemini response data:", JSON.stringify(data).substring(0, 300));
        
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return { success: true, content: data.candidates[0].content.parts[0].text.trim() };
        } else {
          console.log("Gemini failed - no content in response:", data.error || data);
        }
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
      }
    }

    if (provider === "openai" && OPENAI_API_KEY) {
      try {
        console.log("Trying OpenAI API...");
        const modelName = aiModel === "gpt-4" ? "gpt-4" : "gpt-3.5-turbo";
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        console.log("OpenAI response status:", response.status);
        const data = await response.json();
        console.log("OpenAI response data:", JSON.stringify(data).substring(0, 300));
        
        if (data.choices?.[0]?.message?.content) {
          return { success: true, content: data.choices[0].message.content.trim() };
        } else {
          console.log("OpenAI failed - no content in response:", data.error || data);
        }
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
      }
    }

    if (provider === "groq" && GROQ_API_KEY) {
      try {
        console.log("Trying Groq API...");
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        console.log("Groq response status:", response.status);
        const data = await response.json();
        console.log("Groq response data:", JSON.stringify(data).substring(0, 300));
        
        if (data.choices?.[0]?.message?.content) {
          return { success: true, content: data.choices[0].message.content.trim() };
        } else {
          console.log("Groq failed - no content in response:", data.error || data);
        }
      } catch (groqError) {
        console.error("Groq API error:", groqError);
      }
    }

    return { success: false, error: "All AI services unavailable" };
  } catch (error) {
    console.error("AI service error:", error);
    return { success: false, error: "AI service failed" };
  }
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  
  try {
    const body = await request.json();
    const parsed = aiContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { type, topic, keywords = [], tone, length, locale, existingContent, aiModel } = parsed.data;
    
    // Limit topic and existingContent length to prevent token overflow
    const maxTopicLength = 500;
    const maxContentLength = 2000;
    const limitedTopic = topic.length > maxTopicLength ? topic.substring(0, maxTopicLength) + "..." : topic;
    const limitedContent = existingContent && existingContent.length > maxContentLength 
      ? existingContent.substring(0, maxContentLength) + "..." 
      : existingContent;
    
    console.log(`Generating ${type} for topic (${limitedTopic.length} chars) with ${keywords.length} keywords`);
    
    // Build the prompt based on content type
    const prompt = getPromptForType(type, limitedTopic, { keywords, tone, length, existingContent: limitedContent });
    
    // Try the selected AI model first
    const result = await callAI(prompt, aiModel);
    
    if (!result.success) {
      // Fallback to other providers if selected model fails
      const fallbackModels = ["groq", "gemini-pro", "gpt-3.5-turbo", "gpt-4"].filter(m => m !== aiModel);
      
      for (const fallbackModel of fallbackModels) {
        const fallbackResult = await callAI(prompt, fallbackModel);
        if (fallbackResult.success) {
          return NextResponse.json({ 
            content: fallbackResult.content,
            provider: fallbackModel
          });
        }
      }
      
      return NextResponse.json(
        { error: "All AI services are currently unavailable" },
        { status: 503 }
      );
    }

    // Log the AI usage for analytics
    try {
      await fetch(`${MYSQL_API_URL}/api/analytics/ai-usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          topic,
          keywords,
          tone,
          length,
          locale,
          provider: aiModel,
          success: true,
        }),
      }).catch(() => {
        // Ignore analytics errors
      });
    } catch {
      // Ignore analytics errors
    }

    return NextResponse.json({ 
      content: result.content,
      provider: aiModel
    });

  } catch (error) {
    console.error("AI content generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
