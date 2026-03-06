import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    if (!path) {
      return NextResponse.json(
        { error: "path parameter required" },
        { status: 400 }
      );
    }
    // Security: only allow reading from openclaw directories
    const allowed = ["C:/Users/aaron/.openclaw/", "C:\\Users\\aaron\\.openclaw\\"];
    if (!allowed.some((prefix) => path.startsWith(prefix))) {
      return NextResponse.json({ error: "path not allowed" }, { status: 403 });
    }
    const content = await gateway.readFile(path);
    const isJson = path.endsWith(".json");
    if (isJson) {
      return NextResponse.json(JSON.parse(content));
    }
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
