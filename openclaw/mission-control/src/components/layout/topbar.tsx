"use client";
import { StatusDot } from "@/components/ui/status-dot";
import { useSSEContext } from "@/components/providers/sse-provider";
import { formatDistanceToNow } from "date-fns";

export function TopBar() {
  const { health, connected, lastUpdate } = useSSEContext();

  const gatewayStatus =
    health?.status === "online" ? "online" : connected ? "warning" : "error";

  return (
    <header className="sticky top-0 z-20 h-12 border-b border-[#2a2a3e] bg-[#0d0d15]/95 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-mono text-xs ${
            health?.status === "online" ? "text-[#00ff41]" : "text-[#ff2d2d]"
          }`} style={health?.status === "online" ? { textShadow: "0 0 6px rgba(0,255,65,0.3)" } : {}}>
            GATEWAY {(health?.status ?? "connecting").toUpperCase()}
          </span>
        </div>
        {connected && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00ff41] shadow-[0_0_4px_rgba(0,255,65,0.4)]" />
            <span className="font-[family-name:var(--font-pixel)] text-[7px] text-[#00ff41]/60 tracking-wider">
              SSE LINK
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {lastUpdate && (
          <span className="text-xs font-mono text-[#666680]">
            Updated {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}
          </span>
        )}
      </div>
    </header>
  );
}
