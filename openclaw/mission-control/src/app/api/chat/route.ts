import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { agentId, message, sessionKey } = await request.json();
    const response = await gateway.chatWithAgent(agentId, message, sessionKey);
    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
