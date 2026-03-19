import { NextRequest, NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { type, content, mood, cleanToday } = await req.json();

  const timeOfDay = type === "checkin_morning" ? "morning" : "evening";
  const moodDesc = ["terrible", "rough", "okay", "good", "great"][mood - 1];

  let context = `It's ${timeOfDay}. I'm feeling ${moodDesc} (${mood}/5).`;
  if (content) context += ` ${content}`;
  if (typeof cleanToday === "boolean") {
    context += cleanToday ? " I stayed clean today." : " I slipped today.";
  }

  const systemPrompt = `You are a compassionate LDS accountability companion. Respond to this check-in with:
1. Brief empathetic acknowledgment (1 sentence)
2. A short relevant scripture reference with the verse text (1-2 sentences)
3. A word of encouragement (1 sentence)

Be genuine, not preachy. Keep the total response under 100 words. If they slipped, be compassionate — remind them of the Atonement and that every day is a fresh start. Never shame or guilt.`;

  const response = await askGemini(systemPrompt, context);
  return NextResponse.json({ response: response.trim() });
}
