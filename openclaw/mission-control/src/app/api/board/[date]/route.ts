import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    // Try common naming patterns
    const paths = [
      `C:/Users/aaron/.openclaw/workspace-board/history/board-report-${date}.md`,
      `C:/Users/aaron/.openclaw/workspace-board/history/${date}.md`,
    ];
    for (const path of paths) {
      try {
        const content = await gateway.readFile(path);
        return NextResponse.json({ content, date });
      } catch {
        continue;
      }
    }
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
