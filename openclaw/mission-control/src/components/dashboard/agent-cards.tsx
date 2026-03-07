"use client";

import { useSSEContext } from "@/components/providers/sse-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";

interface AgentDef {
  id: string;
  label: string;
  model: string;
  description: string;
}

const AGENTS: AgentDef[] = [
  {
    id: "main",
    label: "Claw",
    model: "nvidia/moonshotai/kimi-k2.5",
    description: "Primary autonomous agent",
  },
  {
    id: "marketer",
    label: "Bloom",
    model: "nvidia/writer/palmyra-creative-122b",
    description: "Digital marketing agent",
  },
  {
    id: "board-moderator",
    label: "The Board",
    model: "anthropic/claude-opus-4-6",
    description: "Nightly advisory board synthesizer",
  },
  {
    id: "builder",
    label: "Forge",
    model: "openai-codex/gpt-5.3-codex",
    description: "Dedicated coding sub-agent",
  },
];

export function AgentCards() {
  const { health } = useSSEContext();

  return (
    <div className="space-y-3">
      {AGENTS.map((agent) => {
        const live = health?.agents?.find((a) => a.id === agent.id);
        const status = live
          ? live.status === "running"
            ? "running"
            : live.status === "idle"
              ? "online"
              : "offline"
          : "offline";

        return (
          <Card key={agent.id} className="border-[#2a2a3e] bg-[#141420]">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={status} size="sm" />
                  <CardTitle className="text-sm font-semibold">
                    {agent.label}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] px-1.5 py-0 h-5 border-[#2a2a3e] text-[#666680]"
                >
                  {agent.id}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-[11px] text-muted-foreground mb-2">
                {agent.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Model
                </span>
                <span className="font-mono text-[10px] text-[#e0e0e0] truncate ml-2 max-w-[180px]">
                  {live?.model ?? agent.model}
                </span>
              </div>
              {live && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    Status
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase ${
                      status === "running"
                        ? "text-[#4da6ff]"
                        : status === "online"
                          ? "text-[#00ff41]"
                          : "text-muted-foreground"
                    }`}
                  >
                    {live.status}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
