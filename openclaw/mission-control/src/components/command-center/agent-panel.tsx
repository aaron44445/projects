"use client";

import { useRef, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useSSEContext } from "@/components/providers/sse-provider";
import { getAgentSprite } from "@/lib/sprites";
import type { AgentActivity } from "@/lib/types";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Agent metadata (hardcoded for now)
// ---------------------------------------------------------------------------
const AGENT_META: Record<
  string,
  { label: string; model: string; fallbacks: string[]; description: string }
> = {
  main: {
    label: "Claw",
    model: "nvidia/moonshotai/kimi-k2.5",
    fallbacks: [
      "openai-codex/gpt-5.3-codex",
      "anthropic/claude-sonnet-4-6",
    ],
    description:
      "Primary autonomous agent — strategy, communication, business ops",
  },
  marketer: {
    label: "Bloom",
    model: "nvidia/writer/palmyra-creative-122b",
    fallbacks: ["nvidia/deepseek-ai/deepseek-v3.2"],
    description: "Digital marketing agent for InjectSEO",
  },
  "board-moderator": {
    label: "The Board",
    model: "anthropic/claude-opus-4-6",
    fallbacks: ["anthropic/claude-sonnet-4-6"],
    description: "Nightly advisory board synthesizer",
  },
  builder: {
    label: "Forge",
    model: "openai-codex/gpt-5.3-codex",
    fallbacks: ["anthropic/claude-sonnet-4-6"],
    description: "Dedicated coding sub-agent — builds, PRs, refactoring",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Relative timestamp like "2m ago", "1h ago", etc. */
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Status icon character for activity actions */
function statusIcon(action: AgentActivity["action"]): string {
  switch (action) {
    case "working":
      return "\u25B6"; // play triangle
    case "completed":
      return "\u2714"; // check mark
    case "error":
      return "\u2716"; // X mark
    case "idle":
      return "\u25CF"; // circle
    default:
      return "\u25CB"; // empty circle
  }
}

/** Color for a status action */
function statusColor(action: AgentActivity["action"]): string {
  switch (action) {
    case "working":
      return "#ffa500";
    case "completed":
      return "#00ff41";
    case "error":
      return "#ff2d2d";
    case "idle":
      return "#00ff41";
    default:
      return "#888";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AgentPanelProps {
  agentId: string | null;
  onClose: () => void;
}

export function AgentPanel({ agentId, onClose }: AgentPanelProps) {
  const { agentActivities } = useSSEContext();
  const sprite = agentId ? getAgentSprite(agentId) : null;
  const meta = agentId ? AGENT_META[agentId] : null;

  // Canvas ref for sprite preview
  const spriteCanvasRef = useRef<HTMLCanvasElement>(null);

  // ---------------------------------------------------------------------------
  // Sprite animation loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!sprite || !spriteCanvasRef.current) return;
    const ctx = spriteCanvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let frame = 0;
    const interval = setInterval(() => {
      const frames = sprite.sheet.idle;
      const currentFrame = frames[frame % frames.length];
      ctx.clearRect(0, 0, 64, 64);

      // Draw at 4x scale (16x16 sprite -> 64x64 canvas)
      for (let row = 0; row < 16; row++) {
        for (let col = 0; col < 16; col++) {
          const colorIdx = currentFrame[row][col];
          if (colorIdx === 0) continue;
          ctx.fillStyle = sprite.sheet.palette[colorIdx];
          ctx.fillRect(col * 4, row * 4, 4, 4);
        }
      }
      frame++;
    }, 250);

    return () => clearInterval(interval);
  }, [sprite]);

  // ---------------------------------------------------------------------------
  // Filter activities for this agent (last 10)
  // ---------------------------------------------------------------------------
  const recentActivities = useMemo(() => {
    if (!agentId) return [];
    return agentActivities
      .filter((a) => a.agentId === agentId)
      .slice(-10)
      .reverse(); // newest first
  }, [agentActivities, agentId]);

  // ---------------------------------------------------------------------------
  // Determine current status from latest activity
  // ---------------------------------------------------------------------------
  const latestActivity = recentActivities[0] ?? null;
  const currentStatus: AgentActivity["action"] =
    latestActivity?.action ?? "idle";
  const currentTask =
    currentStatus === "working" ? latestActivity?.description : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Sheet open={!!agentId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="border-l border-[#2a2a3e] bg-[#141420] p-0 sm:max-w-sm overflow-y-auto"
        showCloseButton={false}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-[#00ff41]/60 hover:text-[#00ff41] transition-colors text-lg leading-none font-mono"
          aria-label="Close panel"
        >
          {"\u2716"}
        </button>

        {agentId && meta && (
          <div className="flex flex-col h-full">
            {/* --------------------------------------------------------------- */}
            {/* Header */}
            {/* --------------------------------------------------------------- */}
            <SheetHeader className="border-b border-[#2a2a3e] px-5 pt-5 pb-4">
              <div className="flex items-start gap-4">
                {/* Sprite canvas */}
                <div className="shrink-0 rounded border border-[#2a2a3e] bg-[#0a0a14] p-1">
                  <canvas
                    ref={spriteCanvasRef}
                    width={64}
                    height={64}
                    className="block"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>

                {/* Name + ID + status */}
                <div className="flex flex-col gap-1 min-w-0">
                  <SheetTitle className="font-[family-name:var(--font-pixel)] text-[14px] text-[#00ff41] leading-tight tracking-wide">
                    {meta.label}
                  </SheetTitle>
                  <span className="font-mono text-[11px] text-[#00ff41]/50 truncate">
                    {agentId}
                  </span>
                  <Badge
                    variant="outline"
                    className={`mt-1 w-fit border font-mono text-[10px] uppercase tracking-wider ${
                      currentStatus === "error"
                        ? "border-[#ff2d2d]/60 text-[#ff2d2d] bg-[#ff2d2d]/10"
                        : currentStatus === "working"
                          ? "border-[#ffa500]/60 text-[#ffa500] bg-[#ffa500]/10"
                          : "border-[#00ff41]/60 text-[#00ff41] bg-[#00ff41]/10"
                    }`}
                  >
                    {currentStatus === "completed" ? "idle" : currentStatus}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            {/* --------------------------------------------------------------- */}
            {/* Body */}
            {/* --------------------------------------------------------------- */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Description */}
              <section>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#00ff41]/40 mb-1">
                  Role
                </h3>
                <p className="font-mono text-[12px] text-[#00ff41]/80 leading-relaxed">
                  {meta.description}
                </p>
              </section>

              {/* Current task */}
              {currentTask && (
                <section>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#ffa500]/60 mb-1">
                    Current Task
                  </h3>
                  <div className="rounded border border-[#ffa500]/20 bg-[#ffa500]/5 px-3 py-2">
                    <p className="font-mono text-[11px] text-[#ffa500] leading-relaxed">
                      {currentTask}
                    </p>
                  </div>
                </section>
              )}

              {/* Model info */}
              <section>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#00ff41]/40 mb-2">
                  Model
                </h3>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#00ff41]/40 shrink-0 w-[60px]">
                      Primary
                    </span>
                    <span className="font-mono text-[11px] text-[#00ff41]/80 truncate">
                      {meta.model}
                    </span>
                  </div>
                  {meta.fallbacks.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-[10px] text-[#00ff41]/40 shrink-0 w-[60px] pt-px">
                        Fallback
                      </span>
                      <div className="flex flex-col gap-0.5">
                        {meta.fallbacks.map((fb) => (
                          <span
                            key={fb}
                            className="font-mono text-[11px] text-[#00ff41]/50 truncate"
                          >
                            {fb}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Activity log */}
              <section>
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#00ff41]/40 mb-2">
                  Recent Activity
                </h3>
                {recentActivities.length === 0 ? (
                  <p className="font-mono text-[11px] text-[#00ff41]/30 italic">
                    No recent activity
                  </p>
                ) : (
                  <div className="space-y-1">
                    {recentActivities.map((activity, i) => (
                      <div
                        key={`${activity.timestamp}-${i}`}
                        className="flex items-start gap-2 py-1 border-b border-[#2a2a3e]/50 last:border-b-0"
                      >
                        <span
                          className="shrink-0 text-[11px] mt-px"
                          style={{ color: statusColor(activity.action) }}
                        >
                          {statusIcon(activity.action)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[11px] text-[#00ff41]/70 leading-snug truncate">
                            {activity.description}
                          </p>
                          <span className="font-mono text-[9px] text-[#00ff41]/30">
                            {timeAgo(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* Footer link */}
            {/* --------------------------------------------------------------- */}
            <div className="border-t border-[#2a2a3e] px-5 py-3">
              <Link
                href="/agents"
                className="font-mono text-[11px] text-[#00ff41]/60 hover:text-[#00ff41] transition-colors underline underline-offset-2"
              >
                View full agent details &rarr;
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
