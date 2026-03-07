"use client";

import { useState, useMemo } from "react";
import { MissionBanner } from "@/components/command-center/mission-banner";
import { WarRoomMap, type AgentPosition } from "@/components/command-center/war-room-map";
import { ActivityTicker, type TickerEntry } from "@/components/command-center/activity-ticker";
import { AgentPanel } from "@/components/command-center/agent-panel";
import { ProjectPanel } from "@/components/command-center/project-panel";
import { useSSEContext } from "@/components/providers/sse-provider";
import { getDefaultMapConfig } from "@/lib/map-data";

// Map agent IDs to their default project assignments
const AGENT_PROJECT_MAP: Record<string, string> = {
  main: "injectseo",
  marketer: "medseo",
  "board-moderator": "injectseo",
  builder: "forge-station",
};

const ALL_AGENT_IDS = ["main", "marketer", "board-moderator", "builder"];

export default function CommandCenter() {
  const { agentActivities } = useSSEContext();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

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

  // Compute agent positions from latest activities
  const agentPositions: AgentPosition[] = useMemo(() => {
    const latest = new Map<string, typeof agentActivities[number]>();

    // Get the latest activity per agent
    for (const activity of agentActivities ?? []) {
      const existing = latest.get(activity.agentId);
      if (!existing || activity.timestamp > existing.timestamp) {
        latest.set(activity.agentId, activity);
      }
    }

    return ALL_AGENT_IDS.map((agentId, idx) => {
      const activity = latest.get(agentId);
      const projectId = activity?.project?.toLowerCase().replace(/\s+/g, "") ?? AGENT_PROJECT_MAP[agentId];

      // Find the base for this project
      const base = mapConfig.bases.find((b) =>
        b.projectId === projectId ||
        b.name.toLowerCase().replace(/\s+/g, "") === projectId
      );

      let x: number, y: number;
      if (base) {
        // Position at dock point
        const dockIdx = idx % base.agentDockPoints.length;
        x = base.agentDockPoints[dockIdx].x;
        y = base.agentDockPoints[dockIdx].y;
      } else {
        // Idle at home with offset
        x = mapConfig.homePosition.x + (idx - 1.5) * 20;
        y = mapConfig.homePosition.y;
      }

      const state: AgentPosition["state"] =
        activity?.action === "working" ? "working" :
        activity?.action === "completed" ? "idle" :
        activity?.action === "error" ? "idle" :
        "idle";

      return {
        agentId,
        x,
        y,
        targetX: x,
        targetY: y,
        state,
        currentProject: base?.projectId,
        frame: 0,
      };
    });
  }, [agentActivities, mapConfig]);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <MissionBanner />
      <div className="flex-1 relative overflow-hidden">
        <WarRoomMap
          agentPositions={agentPositions}
          onBaseClick={setSelectedProject}
          onAgentClick={setSelectedAgent}
        />
      </div>
      <ActivityTicker entries={tickerEntries} />
      <AgentPanel agentId={selectedAgent} onClose={() => setSelectedAgent(null)} />
      <ProjectPanel projectId={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
