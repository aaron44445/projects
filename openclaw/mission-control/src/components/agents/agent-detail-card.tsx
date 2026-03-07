"use client";

import { useSSEContext } from "@/components/providers/sse-provider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Bot, FolderOpen, Cpu, ShieldCheck } from "lucide-react";

interface AgentDef {
  id: string;
  label: string;
  model: string;
  fallbacks?: string[];
  workspace: string;
  description: string;
}

const AGENTS: AgentDef[] = [
  {
    id: "main",
    label: "Claw",
    model: "nvidia/moonshotai/kimi-k2.5",
    workspace: "C:\\Users\\aaron\\.openclaw\\workspace",
    description: "Primary autonomous agent — outreach, leads, content, DMs",
  },
  {
    id: "marketer",
    label: "Bloom",
    model: "nvidia/writer/palmyra-creative-122b",
    fallbacks: ["nvidia/deepseek-ai/deepseek-v3.2"],
    workspace: "C:\\Users\\aaron\\.openclaw\\workspace-marketer",
    description: "Digital marketing — strategy, SEO, content, analytics",
  },
  {
    id: "board-moderator",
    label: "The Board",
    model: "anthropic/claude-opus-4-6",
    fallbacks: ["anthropic/claude-sonnet-4-6"],
    workspace: "C:\\Users\\aaron\\.openclaw\\workspace-board",
    description: "Nightly advisory board synthesizer",
  },
  {
    id: "builder",
    label: "Forge",
    model: "openai-codex/gpt-5.3-codex",
    fallbacks: ["anthropic/claude-sonnet-4-6"],
    workspace: "C:\\Users\\aaron\\.openclaw\\workspace-builder",
    description: "Dedicated coding sub-agent — builds, PRs, refactoring",
  },
];

export { AGENTS };
export type { AgentDef };

export function AgentDetailCard({ agent }: { agent: AgentDef }) {
  const { health } = useSSEContext();

  const live = health?.agents?.find((a) => a.id === agent.id);
  const status = live
    ? live.status === "running"
      ? "running"
      : live.status === "idle"
        ? "online"
        : "offline"
    : "offline";

  return (
    <Card className="border-[#2a2a3e] bg-[#141420] py-0 overflow-hidden">
      {/* Top accent bar */}
      <div
        className={`h-0.5 w-full ${
          status === "running"
            ? "bg-[#4da6ff]"
            : status === "online"
              ? "bg-[#00ff41]"
              : "bg-border"
        }`}
      />

      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary/80 border border-border/50">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight">
                {agent.label}
              </CardTitle>
              <span className="font-mono text-[10px] text-muted-foreground">
                {agent.id}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status={status} size="sm" />
            <Badge
              variant="outline"
              className={`font-mono text-[10px] px-1.5 py-0 h-5 uppercase tracking-wider ${
                status === "running"
                  ? "border-[#4da6ff]/40 text-[#4da6ff]"
                  : status === "online"
                    ? "border-[#00ff41]/40 text-[#00ff41]"
                    : "border-border/60 text-muted-foreground"
              }`}
            >
              {status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4 pt-0 space-y-2.5">
        <p className="text-xs text-muted-foreground">{agent.description}</p>

        <div className="space-y-1.5 rounded-md bg-[#1a1a2e]/60 border border-[#2a2a3e]/50 p-3">
          {/* Primary model */}
          <div className="flex items-center gap-2">
            <Cpu className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground w-14 shrink-0">
              Model
            </span>
            <span className="font-mono text-[11px] text-foreground truncate">
              {live?.model ?? agent.model}
            </span>
          </div>

          {/* Fallback models */}
          {agent.fallbacks && agent.fallbacks.length > 0 && (
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                Fallback
              </span>
              <span className="font-mono text-[11px] text-muted-foreground truncate">
                {agent.fallbacks.join(", ")}
              </span>
            </div>
          )}

          {/* Workspace */}
          <div className="flex items-center gap-2">
            <FolderOpen className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground w-14 shrink-0">
              Path
            </span>
            <span className="font-mono text-[10px] text-muted-foreground truncate">
              {agent.workspace}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
