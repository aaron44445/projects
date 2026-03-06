"use client";

import { useState, useMemo, useCallback } from "react";
import { Clock, AlertTriangle, CheckCircle2, PauseCircle } from "lucide-react";
import { useSSEContext } from "@/components/providers/sse-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CronJobRow } from "@/components/cron/cron-job-row";
import { CronJobDetail } from "@/components/cron/cron-job-detail";
import { getJobStatusColor } from "@/lib/cron-utils";
import type { CronJob } from "@/lib/types";

export default function CronControl() {
  const { cronJobs, connected } = useSSEContext();
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Group jobs by agentId
  const groupedJobs = useMemo(() => {
    const groups: Record<string, CronJob[]> = {};
    for (const job of cronJobs) {
      const agent = job.agentId || "unknown";
      if (!groups[agent]) groups[agent] = [];
      groups[agent].push(job);
    }
    // Sort agents alphabetically, but "main" first
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "main") return -1;
      if (b === "main") return 1;
      return a.localeCompare(b);
    });
  }, [cronJobs]);

  // Summary stats
  const stats = useMemo(() => {
    let enabled = 0;
    let errored = 0;
    let disabled = 0;
    for (const job of cronJobs) {
      const color = getJobStatusColor(job);
      if (color === "red") errored++;
      else if (job.enabled) enabled++;
      else disabled++;
    }
    return { total: cronJobs.length, enabled, errored, disabled };
  }, [cronJobs]);

  function handleSelect(job: CronJob) {
    setSelectedJob(job);
    setDetailOpen(true);
  }

  const handleRunNow = useCallback(async (jobId: string) => {
    await fetch(`/api/cron/${jobId}/run`, { method: "POST" });
  }, []);

  const handleToggle = useCallback(async (jobId: string, enabled: boolean) => {
    await fetch(`/api/cron/${jobId}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
  }, []);

  // Loading state
  if (!connected && cronJobs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Cron Control</h1>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (cronJobs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Cron Control</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No cron jobs found.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Jobs will appear here once configured in the gateway.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Cron Control</h1>
            <Badge variant="secondary" className="font-mono text-[11px]">
              {stats.total} job{stats.total !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Summary pills */}
          <div className="flex items-center gap-3">
            {stats.errored > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="font-mono">{stats.errored} errored</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-green-400/70">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-mono">{stats.enabled} active</span>
            </div>
            {stats.disabled > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
                <PauseCircle className="h-3.5 w-3.5" />
                <span className="font-mono">{stats.disabled} paused</span>
              </div>
            )}
          </div>
        </div>

        {/* Agent groups */}
        {groupedJobs.map(([agentId, jobs]) => (
          <section key={agentId}>
            {/* Agent header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
                Agent
              </span>
              <Badge variant="outline" className="font-mono text-[11px] px-1.5 py-0">
                {agentId}
              </Badge>
              <span className="text-[10px] text-muted-foreground/40 font-mono">
                ({jobs.length})
              </span>
              <div className="flex-1 h-px bg-border/30" />
            </div>

            {/* Jobs table */}
            <div className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30 bg-secondary/20">
                    <th className="py-2 px-3 w-10" />
                    <th className="py-2 px-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                      Name
                    </th>
                    <th className="py-2 px-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                      Agent
                    </th>
                    <th className="py-2 px-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                      Schedule
                    </th>
                    <th className="py-2 px-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                      Last Run
                    </th>
                    <th className="py-2 px-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                      Duration
                    </th>
                    <th className="py-2 px-3 text-left text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                      Next Run
                    </th>
                    <th className="py-2 px-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                      Errors
                    </th>
                    <th className="py-2 px-3 text-right text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <CronJobRow
                      key={job.id}
                      job={job}
                      onSelect={handleSelect}
                      onRunNow={handleRunNow}
                      onToggle={handleToggle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {/* Detail sheet */}
        <CronJobDetail
          job={selectedJob}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      </div>
    </TooltipProvider>
  );
}
