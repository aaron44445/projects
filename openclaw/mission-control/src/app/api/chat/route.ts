import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { agentId, message, sessionKey } = await request.json();

  // Try primary request
  try {
    const response = await gateway.chatWithAgent(agentId, message, sessionKey);
    return NextResponse.json({ response });
  } catch (firstError: unknown) {
    const firstMsg = firstError instanceof Error ? firstError.message : String(firstError);
    console.error(`Chat attempt 1 failed for ${agentId}:`, firstMsg);

    // Retry once on failure
    try {
      const response = await gateway.chatWithAgent(agentId, message, sessionKey);
      return NextResponse.json({ response, retried: true });
    } catch (retryError: unknown) {
      const retryMsg = retryError instanceof Error ? retryError.message : String(retryError);
      console.error(`Chat retry failed for ${agentId}:`, retryMsg);
      const errorMsg = retryMsg.includes("abort") || retryMsg.includes("timed out")
        ? "Agent timed out after 120s — NVIDIA free tier may be slow. Try again in a minute."
        : `Failed to reach ${agentId}: ${retryMsg}`;
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  }
}
