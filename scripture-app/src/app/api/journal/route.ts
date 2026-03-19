import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10);

  let query = supabase
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const entry = {
    type: body.type,
    reading_log_id: body.reading_log_id ?? null,
    content: body.content ?? null,
    ai_prompt: body.ai_prompt ?? null,
    mood: body.mood ?? null,
    clean_today: body.clean_today ?? null,
    ai_response: body.ai_response ?? null,
  };

  const { data, error } = await supabase
    .from("journal_entries")
    .insert(entry)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}
