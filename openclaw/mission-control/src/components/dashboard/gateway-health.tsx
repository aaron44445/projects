"use client";

import { useSSEContext } from "@/components/providers/sse-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export function GatewayHealth() {
  const { health, connected, lastUpdate } = useSSEContext();

  const gatewayStatus = connected
    ? health?.status === "online"
      ? "online"
      : health?.status === "degraded"
        ? "warning"
        : "error"
    : "offline";

  const statusLabel = connected
    ? health?.status ?? "connecting"
    : "disconnected";

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Gateway
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {!connected && !health ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Status row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusDot status={gatewayStatus} size="md" />
                <span className="font-mono text-sm font-semibold uppercase tracking-wide">
                  {statusLabel}
                </span>
              </div>
              {connected && (
                <span className="font-mono text-[10px] text-status-green">
                  SSE LIVE
                </span>
              )}
            </div>

            {/* Uptime */}
            {health?.uptime != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-mono text-foreground">
                  {formatUptime(health.uptime)}
                </span>
              </div>
            )}

            {/* Agent count */}
            {health?.agents && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Agents</span>
                <span className="font-mono text-foreground">
                  {health.agents.length}
                </span>
              </div>
            )}

            {/* Last update */}
            {lastUpdate && (
              <div className="border-t border-border/50 pt-2">
                <span className="text-[10px] text-muted-foreground">
                  Updated{" "}
                  {formatDistanceToNow(new Date(lastUpdate), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
