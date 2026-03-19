import { NextRequest, NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { book, chapter } = await req.json();

  const systemPrompt = `You are a thoughtful LDS scripture study companion. Generate a single reflection question based on the scripture chapter the user just read. The question should:
- Connect the scripture to practical daily life
- Be personal and thought-provoking
- Be 1-2 sentences max
- Not be preachy or condescending
Do not include the scripture reference in your question. Just ask the question.`;

  const question = await askGemini(systemPrompt, `I just finished reading ${book} chapter ${chapter}.`);
  return NextResponse.json({ question: question.trim() });
}
