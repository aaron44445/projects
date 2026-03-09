import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

const AGENT_PREFIXES: Record<string, string> = {
  "/claw": "main",
  "/bloom": "marketer",
  "/sentinel": "enforcer",
  "/board": "board-moderator",
  "/forge": "builder",
};

const HELP_TEXT = [
  "Agent Commands:",
  "  /claw <msg>     — Talk to Claw",
  "  /bloom <msg>    — Talk to Bloom",
  "  /sentinel <msg> — Talk to Sentinel",
  "  /board <msg>    — Talk to The Board",
  "  /forge <msg>    — Talk to Forge",
  "",
  "Quick Commands:",
  "  /status — All agent statuses",
  "  /idle   — List idle agents",
  "  /help   — This help text",
  "",
  "No prefix = defaults to Claw",
].join("\n");

function routeMessage(text: string) {
  const trimmed = (text || "").trim();
  if (!trimmed) return { type: "IGNORE" as const, agentId: null, message: "" };

  const lower = trimmed.toLowerCase();

  if (lower.startsWith("/help")) {
    return { type: "HELP" as const, agentId: null, message: HELP_TEXT };
  }
  if (lower.startsWith("/status")) {
    return { type: "STATUS" as const, agentId: null, message: trimmed };
  }
  if (lower.startsWith("/idle")) {
    return { type: "IDLE" as const, agentId: null, message: trimmed };
  }

  for (const [prefix, agentId] of Object.entries(AGENT_PREFIXES)) {
    if (lower.startsWith(prefix)) {
      const message = trimmed.slice(prefix.length).trim() || "What's your current status?";
      return { type: "AGENT" as const, agentId, message };
    }
  }

  return { type: "AGENT" as const, agentId: "main", message: trimmed };
}

// POST handler for Telegram webhook-style routing
// Body: { text: string } — the incoming message text
// Returns: { response: string, agentId: string | null, type: string }
export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const route = routeMessage(text);

    if (route.type === "IGNORE") {
      return NextResponse.json({ response: "", type: "ignore" });
    }

    if (route.type === "HELP") {
      return NextResponse.json({ response: HELP_TEXT, type: "help" });
    }

    if (route.type === "STATUS") {
      const activities = await gateway.getAgentActivity();
      const lines = activities.map((a) => {
        const icon = a.action === "working" ? "▸" : a.action === "error" ? "✗" : "○";
        return `${icon} ${a.agentLabel} [${a.action.toUpperCase()}] @ ${a.buildingId ?? "barracks"} — ${a.description}`;
      });
      return NextResponse.json({
        response: lines.join("\n") || "No agent activity data.",
        type: "status",
      });
    }

    if (route.type === "IDLE") {
      const activities = await gateway.getAgentActivity();
      const idle = activities.filter((a) => a.action === "idle");
      if (idle.length === 0) {
        return NextResponse.json({ response: "All agents are working.", type: "idle" });
      }
      const lines = idle.map((a) => `○ ${a.agentLabel} — ${a.description}`);
      return NextResponse.json({
        response: `Idle agents:\n${lines.join("\n")}`,
        type: "idle",
      });
    }

    // Route to specific agent
    const sessionKey = `telegram:${route.agentId}:${Date.now()}`;
    const response = await gateway.chatWithAgent(route.agentId!, route.message, sessionKey);
    return NextResponse.json({
      response,
      agentId: route.agentId,
      type: "agent",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
