import { NextRequest, NextResponse } from "next/server";
import { analyzeSite } from "@/lib/site-analyzer";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const analysis = await analyzeSite(url);
    return NextResponse.json(analysis);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to analyze site";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
