import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Groq from "groq-sdk";

const geminiApiKey = process.env.GEMINI_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

if (!geminiApiKey) {
  console.warn("GEMINI_API_KEY not set in environment variables");
}
if (!openaiApiKey) {
  console.warn("OPENAI_API_KEY not set in environment variables");
}
if (!groqApiKey) {
  console.warn("GROQ_API_KEY not set in environment variables");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      model = "gpt-4o-mini",
      productName,
      features,
      targetAudience,
      tone = "professional",
      action = "generate",
      existingDescription,
      locale = "en",
    } = body;

    // Validate required fields
    if (!productName) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Determine which AI service to use
    const isOpenAI = model.startsWith("gpt-");
    const isGroq = model.startsWith("llama") || model.startsWith("mixtral") || model.startsWith("gemma");
    
    if (isOpenAI) {
      if (!openaiApiKey) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 500 }
        );
      }
    } else if (isGroq) {
      if (!groqApiKey) {
        return NextResponse.json(
          { error: "Groq API key not configured" },
          { status: 500 }
        );
      }
    } else {
      if (!geminiApiKey) {
        return NextResponse.json(
          { error: "Gemini API key not configured" },
          { status: 500 }
        );
      }
    }

    // Build prompt based on action
    let prompt = "";

    if (action === "generate") {
      prompt = `Generate a compelling product description in HTML format for the following product:

Product Name: ${productName}
${features ? `Key Features: ${features}` : ""}
${targetAudience ? `Target Audience: ${targetAudience}` : ""}
Tone: ${tone}
Language: ${locale === "en" ? "English" : locale === "bn-BD" ? "Bangla" : "Swedish"}

Requirements:
- Use proper HTML formatting (h2, h3, p, ul, li, strong, em tags)
- Make it engaging and persuasive
- Include a brief introduction
- Highlight key benefits
- Use bullet points for features
- Keep it concise but informative
- Do not include any markdown code blocks
- Return only the HTML content without any additional text`;
    } else if (action === "improve") {
      prompt = `Improve the following product description in HTML format:

Product Name: ${productName}
${features ? `Key Features: ${features}` : ""}
${targetAudience ? `Target Audience: ${targetAudience}` : ""}
Tone: ${tone}
Language: ${locale === "en" ? "English" : locale === "bn-BD" ? "Bangla" : "Swedish"}

Current Description:
${existingDescription || "No existing description provided"}

Requirements:
- Enhance the existing description
- Make it more engaging and persuasive
- Improve structure and flow
- Use proper HTML formatting (h2, h3, p, ul, li, strong, em tags)
- Keep the core message but elevate the language
- Do not include any markdown code blocks
- Return only the HTML content without any additional text`;
    } else if (action === "seo") {
      prompt = `Add SEO keywords and optimize the following product description in HTML format:

Product Name: ${productName}
${features ? `Key Features: ${features}` : ""}
${targetAudience ? `Target Audience: ${targetAudience}` : ""}
Tone: ${tone}
Language: ${locale === "en" ? "English" : locale === "bn-BD" ? "Bangla" : "Swedish"}

Current Description:
${existingDescription || "No existing description provided"}

Requirements:
- Add relevant SEO keywords naturally
- Include product-related terms people search for
- Maintain readability and engagement
- Use proper HTML formatting (h2, h3, p, ul, li, strong, em tags)
- Do not keyword stuff
- Do not include any markdown code blocks
- Return only the HTML content without any additional text`;
    } else if (action === "persuasive") {
      prompt = `Make the following product description more persuasive and conversion-focused in HTML format:

Product Name: ${productName}
${features ? `Key Features: ${features}` : ""}
${targetAudience ? `Target Audience: ${targetAudience}` : ""}
Tone: ${tone}
Language: ${locale === "en" ? "English" : locale === "bn-BD" ? "Bangla" : "Swedish"}

Current Description:
${existingDescription || "No existing description provided"}

Requirements:
- Add persuasive language and psychological triggers
- Include strong calls-to-action
- Highlight benefits over features
- Create urgency and desire
- Use proper HTML formatting (h2, h3, p, ul, li, strong, em tags)
- Maintain authenticity
- Do not include any markdown code blocks
- Return only the HTML content without any additional text`;
    }

    let text = "";

    if (isOpenAI) {
      // Use OpenAI
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      text = completion.choices[0]?.message?.content || "";
    } else if (isGroq) {
      // Use Groq
      if (!groqApiKey) {
        throw new Error("Groq API key not configured");
      }
      const groq = new Groq({ apiKey: groqApiKey });
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      text = completion.choices[0]?.message?.content || "";
    } else {
      // Use Gemini
      if (!geminiApiKey) {
        throw new Error("Gemini API key not configured");
      }
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const generativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    }

    // Clean up any markdown code blocks if present
    const cleanedText = text
      .replace(/```html\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return NextResponse.json({ description: cleanedText });
  } catch (error) {
    console.error("AI API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate description",
      },
      { status: 500 }
    );
  }
}
