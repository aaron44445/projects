import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getNextReading, advanceReading } from "@/lib/reading-plan";
import readingOrder from "../../../../data/reading-order.json";

// GET: today's reading assignment (checks for active AI adjustments first)
export async function GET() {
  const { data: config } = await supabase
    .from("user_config")
    .select("current_book, current_chapter, study_streak, longest_study_streak, cycles_completed")
    .limit(1)
    .single();

  if (!config) {
    return NextResponse.json({ error: "Not configured" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: todayLog } = await supabase
    .from("reading_log")
    .select("*")
    .eq("date", today)
    .limit(1)
    .single();

  // Check for active AI adjustment
  const { data: activeAdjustment } = await supabase
    .from("ai_adjustments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let reading = getNextReading(config.current_book, config.current_chapter);
  let adjustmentNote: string | null = null;
  let isAiAdjusted = false;

  if (activeAdjustment && !todayLog) {
    const adjustedScriptures = activeAdjustment.scriptures as { book: string; chapter: number }[];
    const { count } = await supabase
      .from("reading_log")
      .select("*", { count: "exact", head: true })
      .eq("is_ai_adjusted", true)
      .gte("created_at", activeAdjustment.created_at);

    const completedAdjusted = count ?? 0;

    if (completedAdjusted < adjustedScriptures.length) {
      const nextAdjusted = adjustedScriptures[completedAdjusted];
      const bookInfo = readingOrder.find((b: any) => b.id === nextAdjusted.book);
      reading = {
        book: nextAdjusted.book,
        bookName: bookInfo?.name ?? nextAdjusted.book,
        chapter: nextAdjusted.chapter,
      };
      adjustmentNote = `Based on what you've been going through, this chapter may speak to you right now. Theme: ${activeAdjustment.detected_theme}`;
      isAiAdjusted = true;
    }
  }

  return NextResponse.json({
    reading,
    todayLog,
    studyStreak: config.study_streak,
    longestStreak: config.longest_study_streak,
    cyclesCompleted: config.cycles_completed,
    adjustmentNote,
    isAiAdjusted,
  });
}

// POST: mark today's reading as complete
export async function POST(req: NextRequest) {
  const { book, chapter, isAiAdjusted } = await req.json();
  const today = new Date().toISOString().split("T")[0];

  const { data: log, error: logError } = await supabase
    .from("reading_log")
    .upsert(
      { date: today, book, chapter, completed: true, is_ai_adjusted: isAiAdjusted ?? false },
      { onConflict: "date" }
    )
    .select()
    .single();

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  const next = advanceReading(book, chapter);

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const { data: yesterdayLog } = await supabase
    .from("reading_log")
    .select("completed")
    .eq("date", yesterday)
    .eq("completed", true)
    .limit(1)
    .single();

  const { data: config } = await supabase
    .from("user_config")
    .select("id, study_streak, longest_study_streak, cycles_completed")
    .limit(1)
    .single();

  const currentStreak = yesterdayLog ? (config?.study_streak ?? 0) + 1 : 1;
  const longestStreak = Math.max(currentStreak, config?.longest_study_streak ?? 0);
  const cycles = (config?.cycles_completed ?? 0) + (next.cycleCompleted ? 1 : 0);

  if (config) {
    await supabase
      .from("user_config")
      .update({
        current_book: next.book,
        current_chapter: next.chapter,
        study_streak: currentStreak,
        longest_study_streak: longestStreak,
        cycles_completed: cycles,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.id);
  }

  return NextResponse.json({
    readingLog: log,
    next,
    studyStreak: currentStreak,
    cycleCompleted: next.cycleCompleted,
  });
}
