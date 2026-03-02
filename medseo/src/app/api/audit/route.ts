import { NextRequest, NextResponse } from "next/server";
import { runFullAudit } from "@/lib/audit-analyzer";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const audit = await runFullAudit(url);
    return NextResponse.json(audit);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run audit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
