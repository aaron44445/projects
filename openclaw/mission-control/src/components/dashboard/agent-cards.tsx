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
    id: "board-moderator",
    label: "The Board",
    model: "anthropic/claude-opus-4-6",
    description: "Nightly advisory board synthesizer",
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
          <Card key={agent.id} className="border-border/50 bg-card">
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
                  className="font-mono text-[10px] px-1.5 py-0 h-5 border-border/60 text-muted-foreground"
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
                <span className="font-mono text-[10px] text-foreground truncate ml-2 max-w-[180px]">
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
                        ? "text-status-blue"
                        : status === "online"
                          ? "text-status-green"
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
