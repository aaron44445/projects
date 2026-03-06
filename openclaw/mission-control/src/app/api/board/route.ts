import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const files = await gateway.listFiles(
      "C:/Users/aaron/.openclaw/workspace-board/history"
    );
    const reports = files
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({
        filename: f,
        date: f.replace(/\.(md)$/, "").replace(/^board-report-/, ""),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ reports: [], error: String(error) });
  }
}
