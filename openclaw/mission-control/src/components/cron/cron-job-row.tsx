"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CronJob } from "@/lib/types";
import {
  cronToHuman,
  getNextRun,
  getLastRun,
  formatDuration,
  getJobStatusColor,
  statusColorToDotStatus,
} from "@/lib/cron-utils";

interface CronJobRowProps {
  job: CronJob;
  onSelect: (job: CronJob) => void;
  onRunNow: (jobId: string) => Promise<void>;
  onToggle: (jobId: string, enabled: boolean) => Promise<void>;
}

export function CronJobRow({ job, onSelect, onRunNow, onToggle }: CronJobRowProps) {
  const [running, setRunning] = useState(false);
  const [toggling, setToggling] = useState(false);

  const color = getJobStatusColor(job);
  const dotStatus = statusColorToDotStatus(color);
  const errors = job.state?.consecutiveErrors ?? 0;

  async function handleRunNow(e: React.MouseEvent) {
    e.stopPropagation();
    setRunning(true);
    try {
      await onRunNow(job.id);
    } finally {
      setRunning(false);
    }
  }

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setToggling(true);
    try {
      await onToggle(job.id, !job.enabled);
    } finally {
      setToggling(false);
    }
  }

  return (
    <tr
      onClick={() => onSelect(job)}
      className="group cursor-pointer border-b border-border/30 transition-colors hover:bg-secondary/30"
    >
      {/* Status */}
      <td className="py-2.5 px-3 w-10">
        <StatusDot status={dotStatus} size="sm" pulse={job.enabled && color === "green"} />
      </td>

      {/* Name */}
      <td className="py-2.5 px-3">
        <span className={`text-sm font-medium ${color === "red" ? "text-red-400" : "text-foreground"}`}>
          {job.name}
        </span>
      </td>

      {/* Agent */}
      <td className="py-2.5 px-3">
        <Badge variant="outline" className="font-mono text-[11px] px-1.5 py-0">
          {job.agentId}
        </Badge>
      </td>

      {/* Schedule */}
      <td className="py-2.5 px-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs font-mono text-muted-foreground">
              {cronToHuman(job.schedule.expr, job.schedule.tz)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <span className="font-mono">{job.schedule.expr}</span>
            {job.schedule.tz && (
              <span className="ml-1 text-muted-foreground">({job.schedule.tz})</span>
            )}
          </TooltipContent>
        </Tooltip>
      </td>

      {/* Last Run */}
      <td className="py-2.5 px-3">
        <span className="text-xs font-mono text-muted-foreground">
          {getLastRun(job.state?.lastRunAtMs)}
        </span>
      </td>

      {/* Duration */}
      <td className="py-2.5 px-3">
        <span className="text-xs font-mono text-muted-foreground">
          {formatDuration(job.state?.lastDurationMs)}
        </span>
      </td>

      {/* Next Run */}
      <td className="py-2.5 px-3">
        <span className={`text-xs font-mono ${job.enabled ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
          {job.enabled ? getNextRun(job.state?.nextRunAtMs) : "paused"}
        </span>
      </td>

      {/* Errors */}
      <td className="py-2.5 px-3 text-center">
        {errors > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="font-mono text-[11px] px-1.5 py-0 min-w-[24px]">
                {errors}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-mono text-xs break-all">
                {job.state?.lastError || "Unknown error"}
              </p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-xs font-mono text-muted-foreground/40">0</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleRunNow}
                disabled={running}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {running ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Play className="size-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Run Now</TooltipContent>
          </Tooltip>

          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`
              relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full
              border border-border/50 transition-colors duration-200
              ${job.enabled ? "bg-green-500/20 border-green-500/40" : "bg-secondary"}
              ${toggling ? "opacity-50" : ""}
            `}
            role="switch"
            aria-checked={job.enabled}
            aria-label={`${job.enabled ? "Disable" : "Enable"} ${job.name}`}
          >
            <span
              className={`
                inline-block h-3.5 w-3.5 rounded-full transition-transform duration-200
                ${job.enabled ? "translate-x-4 bg-green-500" : "translate-x-0.5 bg-muted-foreground/40"}
              `}
            />
          </button>
        </div>
      </td>
    </tr>
  );
}
