"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useSSEContext } from "@/components/providers/sse-provider";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Project metadata
// ---------------------------------------------------------------------------

const PROJECT_META: Record<
  string,
  {
    name: string;
    description: string;
    agents: string[];
    status: "active" | "idle";
  }
> = {
  injectseo: {
    name: "InjectSEO",
    description: "Main business — outreach, lead gen, pipeline management",
    agents: ["main", "marketer"],
    status: "active",
  },
  medseo: {
    name: "MedSEO",
    description: "InjectSEO website — landing pages, SEO, content",
    agents: ["main", "marketer"],
    status: "active",
  },
  "goal-tracker": {
    name: "Goal Tracker",
    description:
      "Personal goal tracking app — feature additions & marketing",
    agents: ["main"],
    status: "idle",
  },
  "forge-station": {
    name: "Forge Station",
    description: "Builder workspace — code builds, PRs, refactoring",
    agents: ["builder"],
    status: "active",
  },
};

// ---------------------------------------------------------------------------
// Agent display config
// ---------------------------------------------------------------------------

const AGENT_CONFIG: Record<string, { label: string; color: string }> = {
  main: { label: "Claw", color: "#00ff41" },
  marketer: { label: "Bloom", color: "#ff69b4" },
  "board-moderator": { label: "The Board", color: "#6a0dad" },
  builder: { label: "Forge", color: "#ff6600" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProjectPanelProps {
  projectId: string | null;
  onClose: () => void;
}

export function ProjectPanel({ projectId, onClose }: ProjectPanelProps) {
  const { cronJobs, agentActivities } = useSSEContext();

  const project = projectId ? PROJECT_META[projectId] : null;

  // Filter cron jobs assigned to this project's agents
  const projectCronJobs = useMemo(() => {
    if (!project) return [];
    return cronJobs.filter((job) => project.agents.includes(job.agentId));
  }, [cronJobs, project]);

  // Filter recent activity for this project
  const projectActivities = useMemo(() => {
    if (!projectId) return [];
    return agentActivities
      .filter((a) => a.project === projectId)
      .slice(-10)
      .reverse();
  }, [agentActivities, projectId]);

  return (
    <Sheet open={!!projectId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[400px] sm:max-w-[400px] bg-[#141420] border-l border-[#2a2a3e] p-0 overflow-y-auto"
      >
        {project && projectId ? (
          <>
            {/* ---- Header ---- */}
            <SheetHeader className="px-5 pt-5 pb-4 border-b border-[#2a2a3e]">
              <div className="flex items-center gap-3">
                <SheetTitle className="font-[family-name:var(--font-pixel)] text-[14px] text-[#e0e0e0] tracking-wide">
                  {project.name}
                </SheetTitle>
                <Badge
                  className={
                    project.status === "active"
                      ? "bg-[#00ff41]/15 text-[#00ff41] border-[#00ff41]/30 text-[10px] uppercase tracking-wider"
                      : "bg-[#ffa500]/15 text-[#ffa500] border-[#ffa500]/30 text-[10px] uppercase tracking-wider"
                  }
                  variant="outline"
                >
                  {project.status}
                </Badge>
              </div>
              <p className="font-mono text-[12px] text-[#8a8aaa] mt-1 leading-relaxed">
                {project.description}
              </p>
            </SheetHeader>

            {/* ---- Agents ---- */}
            <section className="px-5 py-4 border-b border-[#2a2a3e]">
              <h3 className="font-[family-name:var(--font-pixel)] text-[10px] text-[#666680] uppercase tracking-widest mb-3">
                Assigned Agents
              </h3>
              <div className="space-y-2">
                {project.agents.map((agentId) => {
                  const cfg = AGENT_CONFIG[agentId];
                  if (!cfg) return null;
                  return (
                    <div
                      key={agentId}
                      className="flex items-center gap-2.5 font-mono text-[12px]"
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: cfg.color,
                          boxShadow: `0 0 6px ${cfg.color}60`,
                        }}
                      />
                      <span className="text-[#e0e0e0]">{cfg.label}</span>
                      <span className="text-[#666680]">({agentId})</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ---- Cron Jobs ---- */}
            <section className="px-5 py-4 border-b border-[#2a2a3e]">
              <h3 className="font-[family-name:var(--font-pixel)] text-[10px] text-[#666680] uppercase tracking-widest mb-3">
                Active Cron Jobs
              </h3>
              {projectCronJobs.length === 0 ? (
                <p className="font-mono text-[11px] text-[#666680]">
                  No cron jobs assigned.
                </p>
              ) : (
                <div className="space-y-2">
                  {projectCronJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-start gap-2 font-mono text-[11px]"
                    >
                      <span
                        className={
                          job.enabled
                            ? "text-[#00ff41] shrink-0 mt-0.5"
                            : "text-[#666680] shrink-0 mt-0.5"
                        }
                      >
                        {job.enabled ? "\u25B8" : "\u25AB"}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[#e0e0e0] truncate">
                          {job.name}
                        </div>
                        <div className="text-[#666680] text-[10px]">
                          {job.schedule.expr}
                          {job.state?.lastRunStatus && (
                            <span
                              className={
                                job.state.lastRunStatus === "ok"
                                  ? "ml-2 text-[#00ff41]/60"
                                  : job.state.lastRunStatus === "error"
                                    ? "ml-2 text-[#ff2d2d]"
                                    : "ml-2 text-[#ffa500]"
                              }
                            >
                              last: {job.state.lastRunStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ---- Recent Activity ---- */}
            <section className="px-5 py-4 border-b border-[#2a2a3e]">
              <h3 className="font-[family-name:var(--font-pixel)] text-[10px] text-[#666680] uppercase tracking-widest mb-3">
                Recent Activity
              </h3>
              {projectActivities.length === 0 ? (
                <p className="font-mono text-[11px] text-[#666680]">
                  No recent activity.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {projectActivities.map((activity, i) => {
                    const agentCfg = AGENT_CONFIG[activity.agentId];
                    return (
                      <div
                        key={`${activity.timestamp}-${i}`}
                        className="flex items-start gap-2 font-mono text-[11px] leading-tight"
                      >
                        <span
                          className="shrink-0 mt-0.5"
                          style={{
                            color:
                              activity.action === "working"
                                ? "#00ff41"
                                : activity.action === "completed"
                                  ? "#00ff41"
                                  : activity.action === "error"
                                    ? "#ff2d2d"
                                    : "#666680",
                          }}
                        >
                          {activity.action === "working"
                            ? "\u25B8"
                            : activity.action === "completed"
                              ? "\u2713"
                              : activity.action === "error"
                                ? "\u2717"
                                : "\u2022"}
                        </span>
                        <div className="min-w-0">
                          <span
                            className="font-bold mr-1.5"
                            style={{ color: agentCfg?.color ?? "#ffa500" }}
                          >
                            {activity.agentLabel}
                          </span>
                          <span className="text-[#e0e0e0]/80">
                            {activity.description}
                          </span>
                          <div className="text-[#666680] text-[10px] mt-0.5">
                            {formatTimestamp(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ---- Footer link ---- */}
            <div className="px-5 py-4">
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#00ff41]/80 hover:text-[#00ff41] transition-colors"
              >
                <span>\u25B8</span>
                <span>View full project page</span>
              </Link>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default ProjectPanel;
