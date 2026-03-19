import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { askGemini } from "@/lib/gemini";
import readingOrder from "../../../../../data/reading-order.json";

export async function POST() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("type, content, created_at")
    .in("type", ["trigger", "checkin_morning", "checkin_evening"])
    .gte("created_at", fourteenDaysAgo)
    .order("created_at", { ascending: true });

  if (!entries || entries.length < 3) {
    return NextResponse.json({ adjusted: false, reason: "Not enough entries for analysis" });
  }

  const { data: config } = await supabase
    .from("user_config")
    .select("current_book, current_chapter")
    .limit(1)
    .single();

  const entrySummary = entries
    .map((e) => `[${e.type}] ${e.content || "(no text)"}`)
    .join("\n");

  const bookList = readingOrder.map((b: any) => `${b.id}: ${b.name} (${b.chapters} chapters)`).join("\n");

  const systemPrompt = `You are an LDS scripture study AI. Analyze the user's recent journal entries (last 14 days) for recurring themes. ONLY suggest a reading plan adjustment if you find at least 3 entries touching a similar significant theme (not one-off bad days).

Available scripture books:
${bookList}

If a significant recurring theme is found, respond with EXACTLY this JSON format:
{"adjust": true, "theme": "the theme", "reasoning": "why these scriptures help", "scriptures": [{"book": "book-id", "chapter": 1}, ...]}

Include 3-5 scripture chapters that directly address the theme. Use book IDs from the list above.

If no significant recurring theme is found (fewer than 3 entries on a similar topic), respond with:
{"adjust": false, "reason": "explanation"}

Respond with ONLY the JSON, no other text.`;

  const result = await askGemini(systemPrompt, `Recent journal entries:\n${entrySummary}`);

  try {
    const parsed = JSON.parse(result.trim());

    if (parsed.adjust && config) {
      await supabase.from("ai_adjustments").insert({
        detected_theme: parsed.theme,
        reasoning: parsed.reasoning,
        scriptures: parsed.scriptures,
        original_position: { book: config.current_book, chapter: config.current_chapter },
      });

      return NextResponse.json({
        adjusted: true,
        theme: parsed.theme,
        reasoning: parsed.reasoning,
        scriptures: parsed.scriptures,
      });
    }

    return NextResponse.json({ adjusted: false, reason: parsed.reason });
  } catch {
    return NextResponse.json({ adjusted: false, reason: "Could not parse AI response" });
  }
}
