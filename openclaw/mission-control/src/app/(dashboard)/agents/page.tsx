"use client";

import { AgentDetailCard, AGENTS } from "@/components/agents/agent-detail-card";
import { ChatInterface } from "@/components/agents/chat-interface";

export default function AgentsPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Agents</h1>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {AGENTS.length} registered
          </span>
        </div>
      </div>

      {/* Agent detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AGENTS.map((agent) => (
          <AgentDetailCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Chat interface */}
      <ChatInterface />
    </div>
  );
}
