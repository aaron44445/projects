"use client";

import { useMemo } from "react";
import { useSSEContext } from "@/components/providers/sse-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import type { CronJob } from "@/lib/types";

type TileStatus = "ok" | "error" | "running" | "disabled" | "pending";

function getTileStatus(job: CronJob): TileStatus {
  if (!job.enabled) return "disabled";
  const last = job.state?.lastRunStatus ?? job.state?.lastStatus;
  if (last === "error" || last === "timeout") return "error";
  if (last === "ok") return "ok";
  return "pending";
}

const statusColors: Record<TileStatus, string> = {
  ok: "bg-green-500/20 border-green-500/40 hover:border-green-500/70",
  error: "bg-red-500/20 border-red-500/40 hover:border-red-500/70",
  running: "bg-blue-500/20 border-blue-500/40 hover:border-blue-500/70",
  disabled: "bg-gray-500/10 border-gray-500/20 hover:border-gray-500/40",
  pending: "bg-amber-500/15 border-amber-500/30 hover:border-amber-500/60",
};

const statusDotColors: Record<TileStatus, string> = {
  ok: "bg-green-500 shadow-green-500/60",
  error: "bg-red-500 shadow-red-500/60",
  running: "bg-blue-500 shadow-blue-500/60 animate-pulse",
  disabled: "bg-gray-600",
  pending: "bg-amber-500 shadow-amber-500/60",
};

function CronTile({ job }: { job: CronJob }) {
  const status = getTileStatus(job);
  const lastRun = job.state?.lastRunAtMs;
  const nextRun = job.state?.nextRunAtMs;
  const duration = job.state?.lastDurationMs;
  const errors = job.state?.consecutiveErrors ?? 0;

  // Abbreviate the name to fit in the tile
  const shortName = job.name
    .replace(/^(board-|daily-|weekly-|lead-|email-)/, "")
    .replace(/-/g, " ");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`
            relative flex flex-col items-start justify-between
            rounded-md border p-2 cursor-default
            transition-colors duration-150
            min-h-[56px]
            ${statusColors[status]}
          `}
        >
          {/* Status light */}
          <div className="flex items-center gap-1.5 w-full">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 shadow-sm ${statusDotColors[status]}`}
            />
            <span className="text-[10px] font-medium text-foreground leading-tight truncate">
              {shortName}
            </span>
          </div>

          {/* Bottom row: agent + timing */}
          <div className="flex items-center justify-between w-full mt-1">
            <span className="font-mono text-[8px] text-muted-foreground truncate">
              {job.agentId}
            </span>
            {lastRun ? (
              <span className="font-mono text-[8px] text-muted-foreground">
                {formatDistanceToNow(new Date(lastRun), { addSuffix: false })}
              </span>
            ) : (
              <span className="font-mono text-[8px] text-muted-foreground/50">
                --
              </span>
            )}
          </div>

          {/* Error indicator */}
          {errors > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[7px] font-bold text-white">
              {errors > 9 ? "9+" : errors}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[240px] bg-[#1a1a2e] border-border/50 text-xs"
      >
        <div className="space-y-1">
          <div className="font-semibold text-foreground">{job.name}</div>
          <div className="text-muted-foreground">
            Agent:{" "}
            <span className="font-mono text-foreground">{job.agentId}</span>
          </div>
          <div className="text-muted-foreground">
            Schedule:{" "}
            <span className="font-mono text-foreground">
              {job.schedule.expr}
            </span>
          </div>
          {lastRun && (
            <div className="text-muted-foreground">
              Last run:{" "}
              <span className="font-mono text-foreground">
                {formatDistanceToNow(new Date(lastRun), { addSuffix: true })}
              </span>
            </div>
          )}
          {duration != null && (
            <div className="text-muted-foreground">
              Duration:{" "}
              <span className="font-mono text-foreground">
                {duration < 1000
                  ? `${duration}ms`
                  : `${(duration / 1000).toFixed(1)}s`}
              </span>
            </div>
          )}
          {nextRun && (
            <div className="text-muted-foreground">
              Next run:{" "}
              <span className="font-mono text-foreground">
                {formatDistanceToNow(new Date(nextRun), { addSuffix: true })}
              </span>
            </div>
          )}
          {job.state?.lastError && (
            <div className="text-red-400 text-[10px] mt-1 break-words">
              {job.state.lastError}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function CronGrid() {
  const { cronJobs, connected } = useSSEContext();

  // Sort: enabled first, then by status priority, then alphabetical
  const sorted = useMemo(() => {
    const priority: Record<TileStatus, number> = {
      error: 0,
      running: 1,
      pending: 2,
      ok: 3,
      disabled: 4,
    };
    return [...cronJobs].sort((a, b) => {
      const sa = getTileStatus(a);
      const sb = getTileStatus(b);
      if (priority[sa] !== priority[sb]) return priority[sa] - priority[sb];
      return a.name.localeCompare(b.name);
    });
  }, [cronJobs]);

  // Summary stats
  const stats = useMemo(() => {
    const counts: Record<TileStatus, number> = {
      ok: 0,
      error: 0,
      running: 0,
      disabled: 0,
      pending: 0,
    };
    cronJobs.forEach((j) => counts[getTileStatus(j)]++);
    return counts;
  }, [cronJobs]);

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Cron Jobs
          </CardTitle>
          {cronJobs.length > 0 && (
            <div className="flex items-center gap-3">
              {stats.ok > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-green-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                  {stats.ok}
                </span>
              )}
              {stats.error > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-red-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                  {stats.error}
                </span>
              )}
              {stats.pending > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-amber-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {stats.pending}
                </span>
              )}
              {stats.disabled > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-500" />
                  {stats.disabled}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {!connected && cronJobs.length === 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        ) : cronJobs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
            No cron jobs found
          </div>
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-4 gap-2">
              {sorted.map((job) => (
                <CronTile key={job.id} job={job} />
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
