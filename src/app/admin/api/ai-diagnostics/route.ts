import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/admin/_lib/auth";

export async function GET(_request: NextRequest) {
  await requireAdmin();

  const diagnostics = {
    envLoaded: {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    },
    envSource: process.env.NODE_ENV,
    hasAnyKey: !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY),
  };

  return NextResponse.json(diagnostics);
}
