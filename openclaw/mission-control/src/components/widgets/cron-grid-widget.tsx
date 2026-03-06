"use client";

import { useMemo } from "react";
import { useSSEContext } from "@/components/providers/sse-provider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import type { CronJob, WidgetConfig } from "@/lib/types";

type TileStatus = "ok" | "error" | "running" | "disabled" | "pending";

function getTileStatus(job: CronJob): TileStatus {
  if (!job.enabled) return "disabled";
  const last = job.state?.lastRunStatus ?? job.state?.lastStatus;
  if (last === "error" || last === "timeout") return "error";
  if (last === "ok") return "ok";
  return "pending";
}

const tileBg: Record<TileStatus, string> = {
  ok: "bg-green-500/25 border-green-500/40",
  error: "bg-red-500/25 border-red-500/40",
  running: "bg-blue-500/25 border-blue-500/40 animate-pulse",
  disabled: "bg-gray-500/10 border-gray-500/20",
  pending: "bg-amber-500/20 border-amber-500/35",
};

const dotColor: Record<TileStatus, string> = {
  ok: "bg-green-500",
  error: "bg-red-500",
  running: "bg-blue-500 animate-pulse",
  disabled: "bg-gray-600",
  pending: "bg-amber-500",
};

export function CronGridWidget({ config }: { config: WidgetConfig }) {
  const { cronJobs, connected } = useSSEContext();

  const filterAgent = config.config?.filter as string | undefined;

  const filtered = useMemo(() => {
    let jobs = [...cronJobs];

    // Apply agent filter if set
    if (filterAgent) {
      jobs = jobs.filter(
        (j) =>
          j.agentId === filterAgent ||
          j.name.includes(filterAgent)
      );
    }

    // Sort: errors first, then by name
    const priority: Record<TileStatus, number> = {
      error: 0,
      running: 1,
      pending: 2,
      ok: 3,
      disabled: 4,
    };
    return jobs.sort((a, b) => {
      const sa = getTileStatus(a);
      const sb = getTileStatus(b);
      if (priority[sa] !== priority[sb]) return priority[sa] - priority[sb];
      return a.name.localeCompare(b.name);
    });
  }, [cronJobs, filterAgent]);

  if (!connected && cronJobs.length === 0) {
    return (
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 rounded" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
        {filterAgent ? `No jobs matching "${filterAgent}"` : "No cron jobs"}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-4 gap-1.5">
        {filtered.map((job) => {
          const status = getTileStatus(job);
          const shortName = job.name
            .replace(/^(board-|daily-|weekly-|lead-|email-)/, "")
            .replace(/-/g, " ");

          return (
            <Tooltip key={job.id}>
              <TooltipTrigger asChild>
                <div
                  className={`
                    flex items-center gap-1 rounded border p-1.5
                    cursor-default transition-colors duration-150
                    ${tileBg[status]}
                  `}
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${dotColor[status]}`}
                  />
                  <span className="text-[9px] font-medium text-foreground leading-tight truncate">
                    {shortName}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-[200px] bg-[#1a1a2e] border-border/50 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground text-[11px]">
                    {job.name}
                  </div>
                  <div className="text-muted-foreground text-[10px]">
                    <span className="font-mono">{job.agentId}</span>
                    {" \u00b7 "}
                    <span className="font-mono">{job.schedule.expr}</span>
                  </div>
                  {job.state?.lastRunAtMs && (
                    <div className="text-muted-foreground text-[10px]">
                      Last:{" "}
                      <span className="font-mono">
                        {formatDistanceToNow(
                          new Date(job.state.lastRunAtMs),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
