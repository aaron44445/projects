"use client";
import { StatusDot } from "@/components/ui/status-dot";
import { useSSEContext } from "@/components/providers/sse-provider";
import { formatDistanceToNow } from "date-fns";

export function TopBar() {
  const { health, connected, lastUpdate } = useSSEContext();

  const gatewayStatus =
    health?.status === "online" ? "online" : connected ? "warning" : "error";

  return (
    <header className="sticky top-0 z-20 h-12 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <StatusDot
            status={gatewayStatus === "online" ? "online" : "error"}
            size="sm"
          />
          <span className="font-mono text-muted-foreground">
            Gateway {health?.status ?? "connecting..."}
          </span>
        </div>
        {connected && (
          <span className="text-[10px] font-mono text-muted-foreground/60">
            SSE connected
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {lastUpdate && (
          <span className="text-xs font-mono text-muted-foreground">
            Updated {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}
          </span>
        )}
      </div>
    </header>
  );
}
