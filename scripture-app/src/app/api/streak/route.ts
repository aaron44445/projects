import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: current } = await supabase
    .from("clean_streak")
    .select("*")
    .eq("is_current", true)
    .limit(1)
    .single();

  const { data: history } = await supabase
    .from("clean_streak")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  let currentDays = 0;
  if (current) {
    const start = new Date(current.start_date);
    const now = new Date();
    currentDays = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  }

  const longestStreak = (history ?? []).reduce((max, s) => {
    const start = new Date(s.start_date);
    const end = s.end_date ? new Date(s.end_date) : new Date();
    const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    return Math.max(max, days);
  }, 0);

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: checkins } = await supabase
    .from("journal_entries")
    .select("created_at, clean_today")
    .eq("type", "checkin_evening")
    .gte("created_at", ninetyDaysAgo)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    currentDays,
    longestStreak,
    streakStart: current?.start_date,
    history,
    checkins: checkins ?? [],
  });
}

export async function POST() {
  const today = new Date().toISOString().split("T")[0];

  await supabase
    .from("clean_streak")
    .update({ is_current: false, end_date: today })
    .eq("is_current", true);

  const { data } = await supabase
    .from("clean_streak")
    .insert({ start_date: today, is_current: true })
    .select()
    .single();

  return NextResponse.json({ newStreak: data });
}
