import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, EDITOR_OR_ADMIN } from "@/app/admin/_lib/with-admin";
import { badRequest, internalError } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/api/rate-limit";

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

const SUPPORTED_ACTIONS = ["generate", "improve", "seo", "persuasive"] as const;
const SUPPORTED_TONES = ["professional", "casual", "playful", "authoritative"] as const;
const SUPPORTED_LOCALES = ["en", "bn-BD", "sv"] as const;

const aiSchema = z.object({
  model: z.string().min(1).max(80).default("gpt-4o-mini"),
  productName: z.string().min(1).max(200),
  features: z.string().max(2000).optional(),
  targetAudience: z.string().max(500).optional(),
  tone: z.enum(SUPPORTED_TONES).default("professional"),
  action: z.enum(SUPPORTED_ACTIONS).default("generate"),
  existingDescription: z.string().max(20000).optional(),
  locale: z.enum(SUPPORTED_LOCALES).default("en"),
});

export const POST = withAdmin(
  withRateLimit(
    { key: "ai-generate-description", capacity: 10, refillPerSec: 1 / 6 },
    async (req: NextRequest) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest({ reason: "Invalid JSON body" });
    }

    const parsed = aiSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest({ issues: parsed.error.flatten() });
    }

    const {
      model,
      productName,
      features,
      targetAudience,
      tone,
      action,
      existingDescription,
      locale,
    } = parsed.data;

    // Determine which AI service to use
    const isOpenAI = model.startsWith("gpt-");
    const isGroq =
      model.startsWith("llama") ||
      model.startsWith("mixtral") ||
      model.startsWith("gemma");

    if (isOpenAI) {
      if (!openaiApiKey) {
        return internalError({ reason: "OpenAI API key not configured" });
      }
    } else if (isGroq) {
      if (!groqApiKey) {
        return internalError({ reason: "Groq API key not configured" });
      }
    } else if (!geminiApiKey) {
      return internalError({ reason: "Gemini API key not configured" });
    }

    // Validate required fields
    if (!productName) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Build prompt based on action
    const languageLabel =
      locale === "en" ? "English" : locale === "bn-BD" ? "Bangla" : "Swedish";

    const actionInstructions: Record<(typeof SUPPORTED_ACTIONS)[number], string> = {
      generate: [
        "Generate a compelling product description in HTML format.",
        "Include a brief introduction, highlight key benefits, use bullet points for features.",
      ].join(" "),
      improve: [
        "Improve the existing product description in HTML format.",
        "Enhance engagement, improve structure and flow, keep the core message.",
      ].join(" "),
      seo: [
        "Add relevant SEO keywords naturally to the product description in HTML format.",
        "Do not keyword stuff. Maintain readability and engagement.",
      ].join(" "),
      persuasive: [
        "Make the product description more persuasive and conversion-focused in HTML format.",
        "Include strong calls-to-action, highlight benefits, create urgency and desire.",
      ].join(" "),
    };

    const commonRequirements =
      "Use proper HTML formatting (h2, h3, p, ul, li, strong, em tags). " +
      "Do not include any markdown code blocks. Return only the HTML content without any additional text.";

    const prompt = [
      actionInstructions[action],
      "",
      `Product Name: ${productName}`,
      features ? `Key Features: ${features}` : "",
      targetAudience ? `Target Audience: ${targetAudience}` : "",
      `Tone: ${tone}`,
      `Language: ${languageLabel}`,
      "",
      action !== "generate" && existingDescription
        ? `Current Description:\n${existingDescription}`
        : "",
      "",
      `Requirements:\n- ${actionInstructions[action]}\n- ${commonRequirements}`,
    ]
      .filter(Boolean)
      .join("\n");

    let text = "";

    if (isOpenAI) {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      text = completion.choices[0]?.message?.content ?? "";
    } else if (isGroq) {
      const { default: Groq } = await import("groq-sdk");
      const groq = new Groq({ apiKey: groqApiKey });
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      text = completion.choices[0]?.message?.content ?? "";
    } else {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiApiKey!);
      const generativeModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
      });
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
  }),
  EDITOR_OR_ADMIN,
);

