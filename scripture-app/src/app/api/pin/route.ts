import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPin } from "@/lib/pin-hash";

export async function POST(req: NextRequest) {
  const { pin, action } = await req.json();

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
  }

  const pinHash = await hashPin(pin);

  if (action === "setup") {
    const { data: existing } = await supabase.from("user_config").select("id").limit(1).single();

    if (existing) {
      return NextResponse.json({ error: "PIN already set" }, { status: 409 });
    }

    const { error } = await supabase.from("user_config").insert({ pin_hash: pinHash });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("clean_streak").insert({ start_date: new Date().toISOString().split("T")[0], is_current: true });

    return NextResponse.json({ success: true });
  }

  if (action === "verify") {
    const { data } = await supabase.from("user_config").select("pin_hash").limit(1).single();

    if (!data) {
      return NextResponse.json({ needsSetup: true }, { status: 404 });
    }

    const valid = data.pin_hash === pinHash;
    return NextResponse.json({ valid });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET() {
  const { data } = await supabase.from("user_config").select("id").limit(1).single();
  return NextResponse.json({ hasPin: !!data });
}
