"use client";

import { useRef, useEffect } from "react";
import { useSSEContext } from "@/components/providers/sse-provider";
import { getAgentSprite } from "@/lib/sprites";

interface AgentMeta {
  id: string;
  label: string;
  color: string;
  project: string;
  idleLabel?: string; // custom label when idle (instead of "Standing by")
  scheduledOnly?: boolean; // true = only works during scheduled runs (e.g. Board)
}

const AGENTS: AgentMeta[] = [
  { id: "enforcer", label: "Sentinel", color: "#F59E0B", project: "All Agents", idleLabel: "Patrolling every 10 min" },
  { id: "main", label: "Claw", color: "#00ff41", project: "InjectSEO" },
  { id: "marketer", label: "Bloom", color: "#ff69b4", project: "MedSEO" },
  { id: "board-moderator", label: "The Board", color: "#9b59b6", project: "InjectSEO", idleLabel: "Next board: tonight", scheduledOnly: true },
  { id: "builder", label: "Forge", color: "#ff6600", project: "Forge Station" },
];

function SpritePreview({ agentId, size = 48 }: { agentId: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const sprite = getAgentSprite(agentId);
    if (!sprite || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const scale = size / sprite.sheet.size;
    let frame = 0;

    const interval = setInterval(() => {
      const frames = sprite.sheet.idle;
      const currentFrame = frames[frame % frames.length];
      ctx.clearRect(0, 0, size, size);

      for (let row = 0; row < 16; row++) {
        for (let col = 0; col < 16; col++) {
          const colorIdx = currentFrame[row][col];
          if (colorIdx === 0) continue;
          ctx.fillStyle = sprite.sheet.palette[colorIdx];
          ctx.fillRect(col * scale, row * scale, scale, scale);
        }
      }
      frame++;
    }, 300);

    return () => clearInterval(interval);
  }, [agentId, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="shrink-0"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function AgentStatusSidebar() {
  const { agentActivities } = useSSEContext();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2a2a3e]">
        <h2 className="font-[family-name:var(--font-pixel)] text-[8px] text-[#ffa500] tracking-wider">
          AGENT STATUS
        </h2>
      </div>

      {/* Agent cards */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {AGENTS.map((agent) => {
          // Get latest activity for this agent
          const activities = (agentActivities ?? []).filter(
            (a) => a.agentId === agent.id
          );
          const latest = activities.length > 0
            ? activities.reduce((a, b) => (a.timestamp > b.timestamp ? a : b))
            : null;

          const status = latest?.action ?? "idle";
          const isScheduledOnly = agent.scheduledOnly ?? false;

          let statusLabel: string;
          let statusColor: string;
          if (status === "working") {
            statusLabel = "ACTIVE";
            statusColor = "#00ff41";
          } else if (status === "error") {
            statusLabel = "ERROR";
            statusColor = "#ff2d2d";
          } else if (status === "completed") {
            statusLabel = "DONE";
            statusColor = "#00ff41";
          } else if (isScheduledOnly) {
            statusLabel = "SCHEDULED";
            statusColor = "#9b59b6";
          } else {
            statusLabel = "READY";
            statusColor = "#ffa500";
          }

          return (
            <div
              key={agent.id}
              className="rounded border border-[#2a2a3e] bg-[#111118] p-3 hover:border-[#3a3a4e] transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Sprite */}
                <div className="rounded bg-[#0a0a0f] border border-[#1a1a2e] p-1">
                  <SpritePreview agentId={agent.id} size={40} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-[family-name:var(--font-pixel)] text-[9px] tracking-wide"
                      style={{ color: agent.color }}
                    >
                      {agent.label.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: statusColor,
                          boxShadow: status === "working" ? `0 0 4px ${statusColor}` : "none",
                        }}
                      />
                      <span
                        className="font-mono text-[8px] tracking-wider"
                        style={{ color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Agent ID */}
                  <div className="font-mono text-[9px] text-[#666680] mt-0.5">
                    {agent.id}
                  </div>

                  {/* Current task */}
                  <div className="mt-1.5 font-mono text-[10px] text-[#8a8aaa] truncate">
                    {latest?.description && latest.description !== "Standing by"
                      ? latest.description
                      : agent.idleLabel ?? "Awaiting orders"}
                  </div>

                  {/* Project assignment */}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="font-mono text-[8px] text-[#555566]">PROJECT</span>
                    <span className="font-mono text-[9px] text-[#00ff41]/60">
                      {agent.project}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-2.5 border-t border-[#2a2a3e] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-[#555566]">AGENTS</span>
          <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#00ff41]">
            {AGENTS.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-[#555566]">ACTIVE</span>
          <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#ffa500]">
            {(agentActivities ?? []).filter((a) => a.action === "working").length}
          </span>
        </div>
      </div>
    </div>
  );
}
