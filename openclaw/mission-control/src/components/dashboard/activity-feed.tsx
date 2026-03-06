"use client";

import { useMemo } from "react";
import { useSSEContext } from "@/components/providers/sse-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { CronJob } from "@/lib/types";

interface ActivityEntry {
  jobId: string;
  jobName: string;
  agentId: string;
  status: "ok" | "error" | "timeout";
  runAtMs: number;
  durationMs?: number;
  error?: string;
}

function extractActivities(jobs: CronJob[]): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const job of jobs) {
    const st = job.state;
    if (!st?.lastRunAtMs) continue;

    const status = st.lastRunStatus ?? st.lastStatus;
    if (!status) continue;

    entries.push({
      jobId: job.id,
      jobName: job.name,
      agentId: job.agentId,
      status,
      runAtMs: st.lastRunAtMs,
      durationMs: st.lastDurationMs,
      error: st.lastError,
    });
  }

  // Reverse chronological
  return entries.sort((a, b) => b.runAtMs - a.runAtMs);
}

const statusIcon: Record<string, { symbol: string; color: string }> = {
  ok: { symbol: "\u2713", color: "text-green-500" },
  error: { symbol: "\u2717", color: "text-red-500" },
  timeout: { symbol: "\u23F1", color: "text-amber-500" },
};

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const icon = statusIcon[entry.status] ?? statusIcon.error;

  return (
    <div className="group flex items-start gap-2.5 py-2 border-b border-border/30 last:border-0">
      {/* Status icon */}
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold ${icon.color} bg-current/10`}
        style={{
          backgroundColor:
            entry.status === "ok"
              ? "rgba(34,197,94,0.1)"
              : entry.status === "error"
                ? "rgba(239,68,68,0.1)"
                : "rgba(245,158,11,0.1)",
        }}
      >
        {icon.symbol}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-foreground truncate">
            {entry.jobName}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(entry.runAtMs), {
              addSuffix: true,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-[10px] text-muted-foreground">
            {entry.agentId}
          </span>
          {entry.durationMs != null && (
            <>
              <span className="text-border">&middot;</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {entry.durationMs < 1000
                  ? `${entry.durationMs}ms`
                  : `${(entry.durationMs / 1000).toFixed(1)}s`}
              </span>
            </>
          )}
        </div>
        {entry.error && (
          <p className="mt-1 text-[10px] text-red-400/80 leading-tight line-clamp-2">
            {entry.error}
          </p>
        )}
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const { cronJobs, connected } = useSSEContext();

  const activities = useMemo(() => extractActivities(cronJobs), [cronJobs]);

  return (
    <Card className="border-border/50 bg-card h-full flex flex-col">
      <CardHeader className="pb-3 pt-4 px-4 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Activity
          </CardTitle>
          {activities.length > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {activities.length} events
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 flex-1 overflow-y-auto min-h-0">
        {!connected && activities.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Skeleton className="h-5 w-5 rounded shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
            No activity yet
          </div>
        ) : (
          <div className="divide-y-0">
            {activities.map((entry) => (
              <ActivityRow key={`${entry.jobId}-${entry.runAtMs}`} entry={entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
