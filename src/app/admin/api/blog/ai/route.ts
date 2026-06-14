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
  return `You are an expert SEO content writer and Amazon Affiliate marketing specialist.

Write a comprehensive, high-quality, SEO-optimized affiliate article about: ${topic}.

Primary Keywords: ${keywords.join(", ")}

Goals:
- Rank for target keywords in Google search.
- Match search intent perfectly.
- Increase Amazon affiliate conversions.
- Follow Google's E-E-A-T guidelines (Experience, Expertise, Authoritativeness, Trustworthiness).
- Provide genuinely helpful and accurate information.

Article Structure:
- SEO-optimized title (H2 - not H1)
- Engaging introduction that addresses the reader's problem
- Quick summary section
- 5-10 detailed sections with H2 and H3 headings
- Product recommendations (if applicable)
- Pros and Cons for each recommendation
- Comparison table (HTML table)
- Buying guide section
- Key features to consider
- Common mistakes to avoid
- Frequently Asked Questions (FAQ)
- Final verdict and conclusion
- Strong call-to-action

Content Requirements:
- Minimum 2500-4000 words.
- Use primary keywords naturally throughout the article.
- Include related semantic keywords and long-tail keywords.
- Write in a conversational, human-like tone.
- Use short paragraphs for readability.
- Include bullet points and numbered lists where appropriate.
- Provide practical examples and real-world insights.
- Explain benefits, not just features.
- Be honest about advantages and disadvantages.
- Avoid keyword stuffing.
- Avoid AI-sounding phrases and generic filler content.
- Optimize content for featured snippets and People Also Ask sections.

SEO Requirements:
- Include keyword in the introduction, headings, and conclusion.
- Create descriptive H2 and H3 headings.
- Answer common search queries related to the topic.
- Include comparison and buyer-intent content.
- Focus on helping users make informed purchasing decisions.

${existingContent ? `Continue and expand from this content while maintaining style and structure: ${existingContent}` : ''}

CRITICAL FORMATTING RULES FOR CKEDITOR:
- Return ONLY clean HTML content without any markdown code blocks, backticks, or explanations.
- Use <h2> for main section headings (NOT <h1>).
- Use <h3> for subsection headings.
- Use <p> tags for all paragraphs.
- Use <ul> and <li> for unordered lists.
- Use <ol> and <li> for numbered lists.
- Use <table>, <thead>, <tbody>, <tr>, <th>, <td> for tables.
- Use <strong> for bold text.
- Use <em> for italic text.
- DO NOT wrap the HTML in markdown code blocks like \`\`\`html or \`\`\`.
- DO NOT include any text before or after the HTML content.
- Start directly with the HTML tags.

Example of correct format:
<h2>Your Main Title Here</h2>
<p>Introduction paragraph with relevant information...</p>
<h3>Subsection Title</h3>
<p>More content here...</p>
<ul>
<li>First point</li>
<li>Second point</li>
</ul>`;
   case "meta_title":
  return `You are an expert SEO strategist and affiliate marketing copywriter.

Generate 5 highly clickable SEO meta titles for: ${topic}.

Primary Keywords: ${keywords.join(", ")}

Requirements:
- Keep each title under 60 characters.
- Include the primary keyword naturally.
- Optimize for high CTR (Click-Through Rate).
- Match search intent.
- Use power words where appropriate.
- Make titles compelling but not clickbait.
- Prioritize commercial and buyer-intent searches.
- Include the current year when relevant.
- Create title variations such as:
  - Best
  - Review
  - Comparison
  - Buying Guide
  - Top Picks

Return only the 5 titles, one per line.
Do not number the titles.
Do not include explanations or additional text.`;

case "meta_description":
  return `You are an expert SEO strategist and Amazon Affiliate content writer.

Write 5 SEO-optimized meta descriptions for an article about: ${topic}.

Primary Keywords: ${keywords.join(", ")}

Requirements:
- Each meta description must be 150-160 characters.
- Include the primary keyword naturally.
- Encourage clicks with a strong value proposition.
- Match search intent and buyer intent.
- Highlight benefits, comparisons, reviews, or buying advice.
- Use action-oriented language.
- Avoid keyword stuffing.
- Make each variation unique.
- Optimize for high CTR from Google search results.

${existingContent ? `Article Context: ${existingContent}` : ''}

Return only the 5 meta descriptions.
One description per line.
Do not number them.
Do not include explanations or additional text.`;


case "tags":
  return `You are an SEO content strategist and Amazon Affiliate marketing expert.

Generate 10-15 highly relevant SEO tags for an article about: ${topic}.

Primary Keywords: ${keywords.join(", ")}

Requirements:
- Tags must be highly relevant to the topic.
- Include primary keyword variations.
- Include related semantic keywords.
- Include buyer-intent and product-related terms when appropriate.
- Avoid duplicate or overly broad tags.
- Use lowercase only.
- Use hyphens for multi-word tags.
- Focus on topical authority and content categorization.
- Prioritize tags that support internal linking and SEO clustering.

${existingContent ? `Article Context: ${existingContent.substring(0, 1000)}` : ''}

Return only the tags.
One tag per line.
No numbering.
No explanations.
No extra text.`;

case "seo_optimization":
  return `You are a senior SEO strategist specializing in Amazon Affiliate websites and Google search ranking optimization.

Analyze the following blog content and provide advanced SEO optimization recommendations for: ${topic}.

Primary Keywords: ${keywords.join(", ")}

${existingContent ? `Content to analyze:\n${existingContent}` : 'No content provided. Provide general SEO optimization strategy for this topic.'}

Your goal is to improve:
- Google first-page ranking potential
- E-E-A-T (Experience, Expertise, Authority, Trust)
- Affiliate conversion rate
- Search intent match (informational + commercial intent)

Provide detailed, actionable SEO improvements for the following categories:

1. TITLE OPTIMIZATION
- Evaluate current title (if present)
- Suggest 3 improved SEO titles
- Focus on CTR, keyword placement, and search intent

2. META DESCRIPTION
- Write 1 optimized meta description (150–160 characters)
- Include primary keyword naturally
- Focus on clicks and user intent

3. HEADING STRUCTURE (H1–H3)
- Evaluate current structure
- Suggest improved hierarchy
- Ensure logical flow and keyword-rich headings

4. KEYWORD OPTIMIZATION
- Primary keyword placement analysis
- Secondary/semantic keyword suggestions
- Keyword density recommendations (natural, not spammy)

5. INTERNAL LINKING STRATEGY
- Suggest 3–8 internal linking opportunities
- Recommend anchor text ideas
- Suggest related topic clusters

6. READABILITY IMPROVEMENTS
- Paragraph length optimization
- Sentence clarity improvements
- Scannability enhancements (bullets, tables, lists)

7. IMAGE SEO
- Suggest relevant image ideas
- Provide alt text examples optimized for SEO
- Recommend where images should be placed

8. URL STRUCTURE
- Suggest clean SEO-friendly slug
- Keep short, readable, keyword-focused

9. FEATURED SNIPPET OPTIMIZATION
- Suggest content sections that can win snippets
- Provide short answer formats if applicable

OUTPUT FORMAT:
Return ONLY valid JSON in the following structure:

{
  "title": {
    "current_analysis": "",
    "suggestions": [],
    "improved_titles": []
  },
  "meta_description": "",
  "headings": {
    "analysis": "",
    "suggested_structure": []
  },
  "keywords": {
    "primary": [],
    "secondary": [],
    "placement_notes": ""
  },
  "internal_links": {
    "opportunities": [],
    "anchor_texts": []
  },
  "readability": {
    "issues": [],
    "improvements": []
  },
  "images": {
    "ideas": [],
    "alt_text_examples": []
  },
  "url": {
    "suggested_slug": "",
    "notes": ""
  },
  "featured_snippets": {
    "opportunities": [],
    "suggestions": []
  }
}

Rules:
- Do NOT return markdown.
- Do NOT include explanations outside JSON.
- Be highly specific and actionable.
- Focus on ranking potential for Google first page.
- Optimize for Amazon affiliate conversions.
- Avoid generic SEO advice.`;
case "affiliate_content":
  return `You are a senior Amazon Affiliate marketing strategist and conversion-focused SEO copywriter.

Generate high-conversion affiliate content suggestions for: ${topic}.

Primary Keywords: ${keywords.join(", ")}

${existingContent ? `Existing content to analyze:\n${existingContent}` : ''}

Your goal is to maximize:
- Amazon affiliate click-through rate (CTR)
- Conversion rate
- Google organic rankings
- User trust (E-E-A-T compliance)
- Buyer intent satisfaction

Provide highly practical, implementation-ready suggestions for affiliate content structure.

Include:

1. PRODUCT PLACEMENT OPPORTUNITIES
- Where to naturally insert affiliate products in content
- Context-based placement (intro, comparison, mid-content, conclusion)
- Non-intrusive placement strategy

2. PRODUCT REVIEW SECTIONS
- Suggested review section structures
- What to include in each review (features, pros, cons, use cases)
- How to write trust-building reviews (non-salesy tone)

3. COMPARISON TABLES
- Suggested product comparison formats
- Key comparison attributes (price, features, durability, use case)
- Table structure optimized for conversions

4. RECOMMENDATION LISTS ("BEST OF")
- "Best X for Y" content ideas
- Tiered recommendations (Best overall, budget, premium)
- Use-case based product grouping

5. CALL-TO-ACTION (CTA) PHRASES
- Natural, high-converting CTA examples
- Non-pushy affiliate link text
- Contextual CTAs for Amazon clicks

6. FTC DISCLOSURE STRATEGY
- Proper affiliate disclosure placement
- Compliant disclosure text examples
- Where to place disclosure in article

7. PRODUCT BENEFIT ANGLES
- Emotional + practical benefits
- Problem-solution framing
- Feature-to-benefit transformation

8. BUYING GUIDE STRUCTURE
- What sections to include in a buying guide
- Decision-making factors
- Common mistakes buyers make
- Budget vs premium considerations

OUTPUT FORMAT:
Return ONLY valid JSON in this structure:

{
  "product_placements": {
    "intro": [],
    "mid_content": [],
    "comparison_sections": [],
    "conclusion": []
  },
  "reviews": {
    "structure": [],
    "key_points": []
  },
  "comparisons": {
    "table_structure": [],
    "attributes": []
  },
  "recommendations": {
    "best_of_ideas": [],
    "tiered_suggestions": []
  },
  "ctas": {
    "phrases": [],
    "placement_strategy": ""
  },
  "disclosures": {
    "text_examples": [],
    "placement": ""
  },
  "benefits": {
    "emotional": [],
    "practical": []
  },
  "buying_guide": {
    "sections": [],
    "decision_factors": [],
    "common_mistakes": []
  }
}

Rules:
- Do NOT return markdown.
- Do NOT include explanations outside JSON.
- Focus on real-world Amazon affiliate monetization strategies.
- Avoid spammy or deceptive patterns.
- Prioritize trust + SEO + conversion balance.`;
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
