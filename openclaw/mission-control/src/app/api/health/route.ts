import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const health = await gateway.getHealth();
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      { status: "offline", error: String(error), timestamp: Date.now(), agents: [] },
      { status: 503 }
    );
  }
}
