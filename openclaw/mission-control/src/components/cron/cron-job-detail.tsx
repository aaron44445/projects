"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Separator } from "@/components/ui/separator";
import type { CronJob } from "@/lib/types";
import {
  cronToHuman,
  getNextRun,
  getLastRun,
  formatDuration,
  getJobStatusColor,
  statusColorToDotStatus,
} from "@/lib/cron-utils";

interface CronJobDetailProps {
  job: CronJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  label,
  value,
  mono = false,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  accent?: "red" | "green" | "amber";
}) {
  const accentClass =
    accent === "red"
      ? "text-red-400"
      : accent === "green"
        ? "text-green-400"
        : accent === "amber"
          ? "text-amber-400"
          : "text-foreground";

  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-xs text-muted-foreground shrink-0 w-28">
        {label}
      </span>
      <span
        className={`text-xs text-right ${mono ? "font-mono" : ""} ${accentClass}`}
      >
        {value}
      </span>
    </div>
  );
}

export function CronJobDetail({ job, open, onOpenChange }: CronJobDetailProps) {
  if (!job) return null;

  const color = getJobStatusColor(job);
  const dotStatus = statusColorToDotStatus(color);
  const errors = job.state?.consecutiveErrors ?? 0;
  const lastStatus =
    job.state?.lastRunStatus ?? job.state?.lastStatus ?? "none";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2">
          <div className="flex items-center gap-2">
            <StatusDot status={dotStatus} size="md" pulse={job.enabled} />
            <SheetTitle className="text-base">{job.name}</SheetTitle>
          </div>
          <SheetDescription className="font-mono text-xs">
            {job.id}
          </SheetDescription>
        </SheetHeader>

        {/* Identity */}
        <div className="px-4 space-y-0.5">
          <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">
            Identity
          </h4>
          <DetailRow label="Agent" value={
            <Badge variant="outline" className="font-mono text-[11px] px-1.5 py-0">
              {job.agentId}
            </Badge>
          } />
          <DetailRow
            label="Status"
            value={job.enabled ? "Enabled" : "Disabled"}
            accent={job.enabled ? "green" : "amber"}
          />
          <DetailRow
            label="Session Target"
            value={job.sessionTarget}
            mono
          />
          <DetailRow
            label="Wake Mode"
            value={job.wakeMode}
            mono
          />
        </div>

        <Separator className="my-3 mx-4" />

        {/* Schedule */}
        <div className="px-4 space-y-0.5">
          <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">
            Schedule
          </h4>
          <DetailRow
            label="Expression"
            value={job.schedule.expr}
            mono
          />
          <DetailRow
            label="Human"
            value={cronToHuman(job.schedule.expr, job.schedule.tz)}
          />
          {job.schedule.tz && (
            <DetailRow label="Timezone" value={job.schedule.tz} mono />
          )}
          {job.schedule.staggerMs && (
            <DetailRow
              label="Stagger"
              value={formatDuration(job.schedule.staggerMs)}
              mono
            />
          )}
        </div>

        <Separator className="my-3 mx-4" />

        {/* Payload */}
        <div className="px-4 space-y-0.5">
          <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">
            Payload
          </h4>
          <DetailRow label="Kind" value={job.payload.kind} mono />
          {job.payload.timeoutSeconds && (
            <DetailRow
              label="Timeout"
              value={`${job.payload.timeoutSeconds}s`}
              mono
            />
          )}
          {(job.payload.message || job.payload.text) && (
            <div className="mt-2">
              <span className="text-xs text-muted-foreground block mb-1">
                {job.payload.message ? "Message" : "Text"}
              </span>
              <div className="bg-secondary/50 border border-border/50 rounded-md p-2.5 max-h-40 overflow-y-auto">
                <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
                  {job.payload.message || job.payload.text}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Delivery */}
        {job.delivery && (
          <>
            <Separator className="my-3 mx-4" />
            <div className="px-4 space-y-0.5">
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">
                Delivery
              </h4>
              <DetailRow label="Mode" value={job.delivery.mode} mono />
              {job.delivery.channel && (
                <DetailRow
                  label="Channel"
                  value={job.delivery.channel}
                  mono
                />
              )}
              {job.delivery.to && (
                <DetailRow label="To" value={job.delivery.to} mono />
              )}
              {job.state?.lastDelivered !== undefined && (
                <DetailRow
                  label="Last Delivered"
                  value={job.state.lastDelivered ? "Yes" : "No"}
                  accent={job.state.lastDelivered ? "green" : "red"}
                />
              )}
              {job.state?.lastDeliveryStatus && (
                <DetailRow
                  label="Delivery Status"
                  value={job.state.lastDeliveryStatus}
                  mono
                />
              )}
            </div>
          </>
        )}

        <Separator className="my-3 mx-4" />

        {/* Run State */}
        <div className="px-4 space-y-0.5">
          <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">
            Run State
          </h4>
          <DetailRow
            label="Last Status"
            value={lastStatus}
            mono
            accent={
              lastStatus === "ok"
                ? "green"
                : lastStatus === "error" || lastStatus === "timeout"
                  ? "red"
                  : undefined
            }
          />
          <DetailRow
            label="Last Run"
            value={getLastRun(job.state?.lastRunAtMs)}
            mono
          />
          {job.state?.lastRunAtMs && (
            <DetailRow
              label="Last Run At"
              value={new Date(job.state.lastRunAtMs).toLocaleString()}
              mono
            />
          )}
          <DetailRow
            label="Last Duration"
            value={formatDuration(job.state?.lastDurationMs)}
            mono
          />
          <DetailRow
            label="Next Run"
            value={
              job.enabled
                ? getNextRun(job.state?.nextRunAtMs)
                : "paused"
            }
            mono
            accent={job.enabled ? undefined : "amber"}
          />
          {job.state?.nextRunAtMs && job.enabled && (
            <DetailRow
              label="Next Run At"
              value={new Date(job.state.nextRunAtMs).toLocaleString()}
              mono
            />
          )}
          <DetailRow
            label="Errors"
            value={errors}
            mono
            accent={errors > 0 ? "red" : undefined}
          />
        </div>

        {/* Error Detail */}
        {job.state?.lastError && (
          <>
            <Separator className="my-3 mx-4" />
            <div className="px-4 pb-4">
              <h4 className="text-[10px] uppercase tracking-widest text-red-400/60 font-semibold mb-1">
                Last Error
              </h4>
              <div className="bg-red-500/5 border border-red-500/20 rounded-md p-2.5 max-h-32 overflow-y-auto">
                <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap break-words leading-relaxed">
                  {job.state.lastError}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* Timestamps */}
        {(job.createdAtMs || job.updatedAtMs) && (
          <>
            <Separator className="my-3 mx-4" />
            <div className="px-4 pb-4 space-y-0.5">
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-1">
                Metadata
              </h4>
              {job.createdAtMs && (
                <DetailRow
                  label="Created"
                  value={new Date(job.createdAtMs).toLocaleString()}
                  mono
                />
              )}
              {job.updatedAtMs && (
                <DetailRow
                  label="Updated"
                  value={new Date(job.updatedAtMs).toLocaleString()}
                  mono
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
