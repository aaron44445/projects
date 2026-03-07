import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

const AGENTS = [
  { id: "main", label: "Claw" },
  { id: "marketer", label: "Bloom" },
  { id: "builder", label: "Forge" },
];

const DEPLOY_MESSAGE = `Mission Control just hit DEPLOY ALL. Check your priorities, memory, and tasks. Start working on the highest-priority item immediately. Report what you're doing.`;

export async function POST() {
  const results: Array<{ agentId: string; label: string; status: "ok" | "error"; response?: string; error?: string }> = [];

  // Fire all agents in parallel
  const promises = AGENTS.map(async (agent) => {
    try {
      const response = await gateway.chatWithAgent(
        agent.id,
        DEPLOY_MESSAGE,
        "mission-control:deploy"
      );
      results.push({ agentId: agent.id, label: agent.label, status: "ok", response });
    } catch (err) {
      results.push({ agentId: agent.id, label: agent.label, status: "error", error: String(err) });
    }
  });

  await Promise.allSettled(promises);

  return NextResponse.json({
    deployed: results.filter((r) => r.status === "ok").length,
    total: AGENTS.length,
    results,
  });
}
