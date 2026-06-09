import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { z } from "zod";

const optimizeContentSchema = z.object({
  content: z.string().min(1),
  type: z.enum(["title", "excerpt", "content", "meta_title", "meta_description"]),
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

interface OptimizationSuggestion {
  type: "seo" | "readability" | "engagement" | "length";
  severity: "low" | "medium" | "high";
  message: string;
  suggestion: string;
  optimizedText?: string;
}

function getOptimizationPrompt(content: string, type: string): string {
  const baseInstructions = `
Analyze the following ${type} content and provide optimization suggestions.
Focus on:
1. SEO optimization (keywords, length, structure)
2. Readability and clarity
3. Engagement potential
4. Length appropriateness

Return a JSON response with this exact structure:
{
  "suggestions": [
    {
      "type": "seo|readability|engagement|length",
      "severity": "low|medium|high",
      "message": "Brief description of the issue",
      "suggestion": "How to improve it",
      "optimizedText": "Improved version (only if applicable)"
    }
  ]
}

Content to analyze: "${content}"
`;

  switch (type) {
    case "title":
      return baseInstructions + `
Additional focus for titles:
- Should be 50-60 characters for SEO
- Must include primary keywords
- Should be compelling and clickable
- Avoid clickbait but maintain interest`;

    case "excerpt":
      return baseInstructions + `
Additional focus for excerpts:
- Should be 150-160 characters
- Must summarize content effectively
- Should include target keywords
- Should encourage reading the full article`;

    case "meta_title":
      return baseInstructions + `
Additional focus for meta titles:
- Must be under 60 characters
- Should include primary keywords at the beginning
- Must accurately describe the content
- Should be compelling for search results`;

    case "meta_description":
      return baseInstructions + `
Additional focus for meta descriptions:
- Must be 150-160 characters exactly
- Should include primary and secondary keywords
- Must accurately summarize the content
- Should encourage clicks from search results`;

    case "content":
      return baseInstructions + `
Additional focus for content:
- Should have proper heading structure (H2, H3)
- Should include relevant keywords naturally
- Should be easy to read with short paragraphs
- Should have clear call-to-action
- Should provide value to the reader`;

    default:
      return baseInstructions;
  }
}

async function callAIForOptimization(prompt: string, model: string = "gemini") {
  try {
    if (model === "gemini" && GEMINI_API_KEY) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      });

      const data = await response.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return { success: true, content: data.candidates[0].content.parts[0].text.trim() };
      }
    }

    if (model === "openai" && OPENAI_API_KEY) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        return { success: true, content: data.choices[0].message.content.trim() };
      }
    }

    if (model === "groq" && GROQ_API_KEY) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        return { success: true, content: data.choices[0].message.content.trim() };
      }
    }

    return { success: false, error: "All AI services unavailable" };
  } catch (error) {
    console.error("AI optimization error:", error);
    return { success: false, error: "AI service failed" };
  }
}

function generateFallbackSuggestions(content: string, type: string): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Length checks
  if (type === "title" || type === "meta_title") {
    if (content.length > 60) {
      suggestions.push({
        type: "length",
        severity: "high",
        message: "Title is too long for optimal SEO",
        suggestion: "Keep titles under 60 characters for best search result display",
        optimizedText: content.substring(0, 57) + "..."
      });
    }
  }

  if (type === "meta_description") {
    if (content.length < 150) {
      suggestions.push({
        type: "length",
        severity: "medium",
        message: "Meta description is too short",
        suggestion: "Aim for 150-160 characters to maximize search result space",
      });
    } else if (content.length > 160) {
      suggestions.push({
        type: "length",
        severity: "high",
        message: "Meta description is too long",
        suggestion: "Keep meta descriptions under 160 characters to avoid truncation",
        optimizedText: content.substring(0, 157) + "..."
      });
    }
  }

  if (type === "excerpt") {
    if (content.length < 100) {
      suggestions.push({
        type: "length",
        severity: "low",
        message: "Excerpt is quite short",
        suggestion: "Consider expanding to 150-200 characters for better engagement",
      });
    }
  }

  // Basic readability checks
  if (content.split(' ').length < 5) {
    suggestions.push({
      type: "readability",
      severity: "medium",
      message: "Content is very brief",
      suggestion: "Add more descriptive words to improve readability and SEO",
    });
  }

  return suggestions;
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  
  try {
    const body = await request.json();
    const parsed = optimizeContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { content, type } = parsed.data;
    
    // Build the optimization prompt
    const prompt = getOptimizationPrompt(content, type);
    
    // Try AI services in order: Gemini -> OpenAI -> Groq
    const result = await callAIForOptimization(prompt, "gemini");
    
    if (result.success) {
      try {
        // Parse the AI response
        const aiResponse = JSON.parse(result.content);
        return NextResponse.json(aiResponse);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        // Fall back to basic suggestions
        const fallbackSuggestions = generateFallbackSuggestions(content, type);
        return NextResponse.json({ suggestions: fallbackSuggestions });
      }
    }

    // Try fallback services
    const openaiResult = await callAIForOptimization(prompt, "openai");
    if (openaiResult.success) {
      try {
        const aiResponse = JSON.parse(openaiResult.content);
        return NextResponse.json(aiResponse);
      } catch {
        // Fall back to basic suggestions
      }
    }

    const groqResult = await callAIForOptimization(prompt, "groq");
    if (groqResult.success) {
      try {
        const aiResponse = JSON.parse(groqResult.content);
        return NextResponse.json(aiResponse);
      } catch {
        // Fall back to basic suggestions
      }
    }

    // If all AI services fail, provide basic suggestions
    const fallbackSuggestions = generateFallbackSuggestions(content, type);
    return NextResponse.json({ suggestions: fallbackSuggestions });

  } catch (error) {
    console.error("Content optimization error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
