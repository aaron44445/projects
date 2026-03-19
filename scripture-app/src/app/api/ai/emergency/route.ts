import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { askGemini } from "@/lib/gemini";
import emergencyScriptures from "../../../../../data/emergency-scriptures.json";

export async function GET() {
  const { data: recentLogs } = await supabase
    .from("emergency_log")
    .select("scripture_ref")
    .order("shown_at", { ascending: false })
    .limit(10);

  const recentRefs = new Set((recentLogs ?? []).map((l) => l.scripture_ref));

  let candidates = emergencyScriptures.filter((s) => !recentRefs.has(s.ref));
  if (candidates.length === 0) candidates = emergencyScriptures;

  let selected = candidates[Math.floor(Math.random() * candidates.length)];

  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const { data: recentEntries } = await supabase
      .from("journal_entries")
      .select("content, type")
      .in("type", ["trigger", "checkin_evening"])
      .gte("created_at", threeDaysAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentEntries && recentEntries.length > 0) {
      const entrySummary = recentEntries
        .map((e) => `[${e.type}] ${e.content || ""}`)
        .filter((e) => e.length > 10)
        .join("\n");

      if (entrySummary) {
        const candidateList = candidates
          .map((s, i) => `${i}: [${s.theme}] ${s.ref}`)
          .join("\n");

        const result = await askGemini(
          `You are selecting an emergency scripture for someone in a moment of temptation. Based on their recent journal entries, pick the MOST relevant scripture from the numbered list. Respond with ONLY the number, nothing else.`,
          `Recent entries:\n${entrySummary}\n\nScriptures:\n${candidateList}`
        );

        const idx = parseInt(result.trim(), 10);
        if (!isNaN(idx) && idx >= 0 && idx < candidates.length) {
          selected = candidates[idx];
        }
      }
    }
  } catch {
    // Fall back to random selection if Gemini fails
  }

  await supabase.from("emergency_log").insert({ scripture_ref: selected.ref });

  return NextResponse.json({ scripture: selected });
}
