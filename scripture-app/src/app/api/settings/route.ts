import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPin } from "@/lib/pin-hash";

export async function GET() {
  const { data } = await supabase.from("user_config").select("*").limit(1).single();
  return NextResponse.json({ config: data });
}

export async function POST(req: NextRequest) {
  const { action, pin } = await req.json();

  if (action === "change_pin") {
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }
    const pinHash = await hashPin(pin);
    await supabase.from("user_config").update({ pin_hash: pinHash, updated_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
    return NextResponse.json({ success: true });
  }

  if (action === "reset_plan") {
    await supabase.from("user_config").update({ current_book: "1-nephi", current_chapter: 1, study_streak: 0, updated_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
