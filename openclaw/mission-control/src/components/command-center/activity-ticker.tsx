"use client";

import { useRef, useEffect } from "react";

export interface TickerEntry {
  agentId: string;
  agentLabel: string;
  project?: string;
  description: string;
  timestamp: number;
  status: "working" | "completed" | "error" | "idle";
}

interface ActivityTickerProps {
  entries: TickerEntry[];
}

export function ActivityTicker({ entries }: ActivityTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const statusSymbol = (s: string) => {
    switch (s) {
      case "working": return "\u25B8";
      case "completed": return "\u2713";
      case "error": return "\u2717";
      default: return "\u2022";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "working": return "text-[#00ff41]";
      case "completed": return "text-[#00ff41]/60";
      case "error": return "text-[#ff2d2d]";
      default: return "text-[#666680]";
    }
  };

  return (
    <div className="border-t border-[#2a2a3e] bg-[#0a0a0f]/90">
      <div
        ref={scrollRef}
        className="h-[88px] overflow-y-auto px-4 py-2 space-y-0.5 scrollbar-thin"
      >
        {entries.length === 0 ? (
          <div className="flex items-center h-full">
            <span className="font-mono text-[11px] text-[#666680]">
              Awaiting agent activity...
            </span>
          </div>
        ) : (
          entries.map((entry, i) => (
            <div key={`${entry.timestamp}-${i}`} className="flex items-center gap-2 font-mono text-[11px] leading-tight">
              <span className={statusColor(entry.status)}>
                {statusSymbol(entry.status)}
              </span>
              <span className="text-[#ffa500] uppercase font-bold shrink-0">
                {entry.agentLabel}
              </span>
              {entry.project && (
                <>
                  <span className="text-[#666680]">&gt;</span>
                  <span className="text-[#00ff41]/70 shrink-0">
                    {entry.project}
                  </span>
                </>
              )}
              <span className="text-[#666680]">::</span>
              <span className="text-[#e0e0e0]/80 truncate">
                {entry.description}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
