"use client";

import { useSSEContext } from "@/components/providers/sse-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { Radio, Clock, Wifi, Server } from "lucide-react";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

export function ConnectionStatus() {
  const { health, connected, lastUpdate } = useSSEContext();

  const gatewayUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}/api/stream`
      : "/api/stream";

  const sseStatus = connected ? "online" : "offline";
  const gatewayStatus = health?.status === "online"
    ? "online"
    : health?.status === "degraded"
      ? "warning"
      : "offline";

  return (
    <div className="space-y-4">
      {/* SSE Connection */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                SSE Connection
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status={sseStatus} size="sm" />
              <Badge
                variant={connected ? "default" : "secondary"}
                className="text-[9px] font-mono uppercase tracking-wider"
              >
                {connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="space-y-3">
            {/* Gateway URL */}
            <div className="flex items-center gap-3">
              <Wifi className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Stream Endpoint
                </p>
                <p className="font-mono text-xs text-foreground/80 truncate">
                  {gatewayUrl}
                </p>
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* Last Heartbeat */}
            <div className="flex items-center gap-3">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Last Heartbeat
                </p>
                {lastUpdate ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-foreground/80">
                      {formatDistanceToNow(new Date(lastUpdate), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {new Date(lastUpdate).toLocaleTimeString()}
                    </span>
                  </div>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground/50">
                    No heartbeat received
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gateway Health */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Gateway Health
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status={gatewayStatus} size="sm" />
              <Badge
                variant={
                  health?.status === "online"
                    ? "default"
                    : health?.status === "degraded"
                      ? "outline"
                      : "secondary"
                }
                className="text-[9px] font-mono uppercase tracking-wider"
              >
                {health?.status ?? "Unknown"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="rounded-md bg-[oklch(0.06_0.01_280)] border border-border/30 divide-y divide-border/20">
            {/* Status */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[11px] text-muted-foreground">Status</span>
              <span className="font-mono text-[11px] text-foreground/80 uppercase">
                {health?.status ?? "---"}
              </span>
            </div>

            {/* Uptime */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[11px] text-muted-foreground">Uptime</span>
              <span className="font-mono text-[11px] text-foreground/80">
                {health?.uptime != null ? formatUptime(health.uptime) : "---"}
              </span>
            </div>

            {/* Active Agents */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[11px] text-muted-foreground">
                Active Agents
              </span>
              <span className="font-mono text-[11px] text-foreground/80">
                {health?.agents?.length ?? 0}
              </span>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[11px] text-muted-foreground">
                Last Check
              </span>
              <span className="font-mono text-[11px] text-foreground/80">
                {health?.timestamp
                  ? new Date(health.timestamp).toLocaleTimeString()
                  : "---"}
              </span>
            </div>
          </div>

          {/* Agent Details */}
          {health?.agents && health.agents.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Registered Agents
              </p>
              <div className="space-y-1.5">
                {health.agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between rounded bg-[oklch(0.06_0.01_280)] border border-border/20 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <StatusDot
                        status={agent.status === "running" ? "running" : "offline"}
                        size="sm"
                      />
                      <span className="font-mono text-[11px] text-foreground/80">
                        {agent.id}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">
                      {agent.model}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
