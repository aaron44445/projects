"use client";

import { useRef, useEffect } from "react";
import { useSSEContext } from "@/components/providers/sse-provider";
import { getAgentSprite } from "@/lib/sprites";
import {
  Mail,
  Paintbrush,
  Radio,
  Search,
  Shield,
  BedDouble,
} from "lucide-react";

interface AgentMeta {
  id: string;
  label: string;
  color: string;
  scheduledOnly?: boolean;
}

const AGENTS: AgentMeta[] = [
  { id: "enforcer", label: "SGT Sentinel", color: "#D4AF37" },
  { id: "main", label: "CPT Claw", color: "#00ff41" },
  { id: "marketer", label: "LT Bloom", color: "#ff69b4" },
  { id: "board-moderator", label: "GEN Board", color: "#9b59b6", scheduledOnly: true },
  { id: "builder", label: "SPC Forge", color: "#ff6600" },
];

const BUILDING_LABELS: Record<string, { name: string; color: string; icon: typeof Mail }> = {
  "outreach-hq": { name: "Outreach HQ", color: "#00ff41", icon: Mail },
  "content-lab": { name: "Content Lab", color: "#ff69b4", icon: Paintbrush },
  "comms-tower": { name: "Comms Tower", color: "#ff2d2d", icon: Radio },
  "intel-room": { name: "Intel Room", color: "#4da6ff", icon: Search },
  "war-room": { name: "War Room", color: "#FFD700", icon: Shield },
  "barracks": { name: "Barracks", color: "#696969", icon: BedDouble },
};

function SpritePreview({ agentId, size = 56 }: { agentId: string; size?: number }) {
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
      <div className="px-3 md:px-4 py-2.5 md:py-3 border-b border-[#2a2a3e]">
        <h2 className="font-[family-name:var(--font-pixel)] text-[10px] text-[#ffa500] tracking-wider">
          TROOP STATUS
        </h2>
      </div>

      {/* Agent cards */}
      <div className="flex-1 overflow-y-auto px-2 md:px-3 py-2 md:py-3 space-y-2 md:space-y-2.5">
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
          const buildingId = (latest?.buildingId as string) || "barracks";
          const building = BUILDING_LABELS[buildingId] ?? BUILDING_LABELS["barracks"];
          const BuildingIcon = building.icon;

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
            statusLabel = "IDLE";
            statusColor = "#ffa500";
          }

          return (
            <div
              key={agent.id}
              className="rounded-lg border border-[#2a2a3e] bg-[#111118] p-2.5 md:p-3.5 hover:border-[#3a3a4e] transition-colors"
            >
              <div className="flex items-start gap-2.5 md:gap-3.5">
                {/* Sprite — smaller on mobile */}
                <div className="rounded-md bg-[#0a0a0f] border border-[#1a1a2e] p-1 md:p-1.5">
                  <SpritePreview agentId={agent.id} size={40} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-[family-name:var(--font-pixel)] text-[9px] md:text-[11px] tracking-wide"
                      style={{ color: agent.color }}
                    >
                      {agent.label.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className="inline-block h-1.5 w-1.5 md:h-2 md:w-2 rounded-full"
                        style={{
                          backgroundColor: statusColor,
                          boxShadow: status === "working" ? `0 0 6px ${statusColor}` : "none",
                        }}
                      />
                      <span
                        className="font-mono text-[8px] md:text-[9px] font-bold tracking-wider"
                        style={{ color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Current task */}
                  <div className="mt-1 md:mt-2 font-mono text-[10px] md:text-[11px] text-[#8a8aaa] truncate">
                    {latest?.action === "working" || latest?.action === "error"
                      ? latest.description
                      : agent.id === "board-moderator" ? "Next board: tonight" : "Standing by"}
                  </div>

                  {/* Building location */}
                  <div className="mt-1 md:mt-1.5 flex items-center gap-1.5">
                    <BuildingIcon className="h-3 w-3" style={{ color: building.color }} />
                    <span
                      className="font-mono text-[9px] md:text-[10px]"
                      style={{ color: building.color }}
                    >
                      {building.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="px-3 md:px-4 py-2.5 md:py-3 border-t border-[#2a2a3e] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] md:text-[10px] text-[#555566]">TROOPS</span>
          <span className="font-[family-name:var(--font-pixel)] text-[9px] md:text-[10px] text-[#00ff41]">
            {AGENTS.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] md:text-[10px] text-[#555566]">ACTIVE</span>
          <span className="font-[family-name:var(--font-pixel)] text-[9px] md:text-[10px] text-[#ffa500]">
            {(agentActivities ?? []).filter((a) => a.action === "working").length}
          </span>
        </div>
      </div>
    </div>
  );
}
