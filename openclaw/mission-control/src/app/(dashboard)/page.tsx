"use client";

import { useState, useMemo, useEffect } from "react";
import { MissionBanner } from "@/components/command-center/mission-banner";
import { WarRoomMap, type AgentPosition } from "@/components/command-center/war-room-map";
import { ActivityTicker, type TickerEntry } from "@/components/command-center/activity-ticker";
import { AgentPanel } from "@/components/command-center/agent-panel";
import { ProjectPanel } from "@/components/command-center/project-panel";
import { AgentStatusSidebar } from "@/components/command-center/agent-status-sidebar";
import { useSSEContext } from "@/components/providers/sse-provider";
import { getDefaultMapConfig } from "@/lib/map-data";
import { Map as MapIcon, Users } from "lucide-react";

function ConnectionIndicator({ connected, lastUpdate }: { connected: boolean; lastUpdate: number | null }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const secondsAgo = lastUpdate ? Math.floor((now - lastUpdate) / 1000) : null;

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
      <div
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: connected ? "#00ff41" : "#ff2d2d",
          boxShadow: connected ? "0 0 6px #00ff41" : "0 0 6px #ff2d2d",
        }}
      />
      <span className="text-[10px] font-mono text-white/60">
        {connected
          ? secondsAgo !== null ? `${secondsAgo}s ago` : "Connected"
          : "Disconnected"
        }
      </span>
    </div>
  );
}

const ALL_AGENT_IDS = ["main", "marketer", "board-moderator", "builder", "enforcer"];

export default function CommandCenter() {
  const { agentActivities, connected, lastUpdate } = useSSEContext();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "troops">("map");

  const mapConfig = useMemo(() => getDefaultMapConfig(), []);

  // Convert agent activities to ticker entries
  const tickerEntries: TickerEntry[] = useMemo(() => {
    return (agentActivities ?? []).map((a) => ({
      agentId: a.agentId,
      agentLabel: a.agentLabel,
      project: a.project,
      description: a.description,
      timestamp: a.timestamp,
      status: a.action,
    }));
  }, [agentActivities]);

  // Compute agent positions from latest activities — building-based mapping
  const agentPositions: AgentPosition[] = useMemo(() => {
    const latest = new Map<string, (typeof agentActivities)[number]>();

    for (const activity of agentActivities ?? []) {
      const existing = latest.get(activity.agentId);
      if (!existing || activity.timestamp > existing.timestamp) {
        latest.set(activity.agentId, activity);
      }
    }

    return ALL_AGENT_IDS.map((agentId, idx) => {
      const activity = latest.get(agentId);
      const buildingId = (activity?.buildingId as string) || "barracks";
      const base = mapConfig.bases.find((b) => b.projectId === buildingId);

      let x: number, y: number;
      if (base) {
        const dockIdx = idx % base.agentDockPoints.length;
        x = base.agentDockPoints[dockIdx].x;
        y = base.agentDockPoints[dockIdx].y;
      } else {
        x = mapConfig.homePosition.x + (idx - 2) * 20;
        y = mapConfig.homePosition.y;
      }

      const state: AgentPosition["state"] =
        activity?.action === "working"
          ? "working"
          : activity?.action === "error"
            ? "working"
            : "idle";

      return {
        agentId,
        x,
        y,
        targetX: x,
        targetY: y,
        state,
        currentProject: buildingId,
        frame: 0,
        buildingId,
      };
    });
  }, [agentActivities, mapConfig]);

  return (
    <div className="flex flex-col h-[calc(100dvh-96px-env(safe-area-inset-bottom,0px))] md:h-[calc(100vh-48px)]">
      <MissionBanner />

      {/* Mobile view toggle */}
      <div className="flex md:hidden border-b border-[#2a2a3e] bg-[#0d0d15]">
        <button
          onClick={() => setMobileView("map")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${
            mobileView === "map"
              ? "text-[#00ff41] border-b-2 border-[#00ff41] bg-[#00ff41]/5"
              : "text-[#555566]"
          }`}
        >
          <MapIcon className="h-3.5 w-3.5" />
          <span className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider">WAR ROOM</span>
        </button>
        <button
          onClick={() => setMobileView("troops")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors ${
            mobileView === "troops"
              ? "text-[#ffa500] border-b-2 border-[#ffa500] bg-[#ffa500]/5"
              : "text-[#555566]"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider">TROOPS</span>
        </button>
      </div>

      {/* Desktop layout: side by side */}
      <div className="flex-1 hidden md:flex min-h-0">
        {/* Map area */}
        <div className="flex-1 relative overflow-hidden bg-[#0a0a0f]">
          <ConnectionIndicator connected={connected} lastUpdate={lastUpdate} />
          <WarRoomMap
            agentPositions={agentPositions}
            onBaseClick={setSelectedProject}
            onAgentClick={setSelectedAgent}
          />
        </div>

        {/* Agent status sidebar */}
        <div className="w-80 border-l border-[#2a2a3e] bg-[#0d0d15] shrink-0">
          <AgentStatusSidebar />
        </div>
      </div>

      {/* Mobile layout: toggled views */}
      <div className="flex-1 flex md:hidden min-h-0">
        {mobileView === "map" ? (
          <div className="flex-1 relative overflow-hidden bg-[#0a0a0f]">
            <ConnectionIndicator connected={connected} lastUpdate={lastUpdate} />
            <WarRoomMap
              agentPositions={agentPositions}
              onBaseClick={setSelectedProject}
              onAgentClick={setSelectedAgent}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-[#0d0d15]">
            <AgentStatusSidebar />
          </div>
        )}
      </div>

      <ActivityTicker entries={tickerEntries} />

      <AgentPanel
        agentId={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
      <ProjectPanel
        projectId={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
