"use client";

import { useRef, useEffect } from "react";

const BUILDING_NAMES: Record<string, string> = {
  "war-room": "War Room",
  "outreach-hq": "Outreach HQ",
  "intel-room": "Intel Room",
  "content-lab": "Content Lab",
  "comms-tower": "Comms Tower",
  "barracks": "Barracks",
};

export interface TickerEntry {
  agentId: string;
  agentLabel: string;
  project?: string;
  buildingId?: string;
  description: string;
  timestamp: number;
  status: "working" | "completed" | "error" | "idle";
  isSentinelYell?: boolean;
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
        className="h-[56px] md:h-[88px] overflow-y-auto px-2 md:px-4 py-1.5 md:py-2 space-y-0.5 scrollbar-thin"
      >
        {entries.length === 0 ? (
          <div className="flex items-center h-full">
            <span className="font-mono text-[10px] md:text-[11px] text-[#666680]">
              Awaiting agent activity...
            </span>
          </div>
        ) : (
          entries.map((entry, i) => (
            <div key={`${entry.timestamp}-${i}`} className="flex items-center gap-1.5 md:gap-2 font-mono text-[9px] md:text-[11px] leading-tight">
              <span className={entry.isSentinelYell ? "text-[#F59E0B]" : statusColor(entry.status)}>
                {entry.isSentinelYell ? "!" : statusSymbol(entry.status)}
              </span>
              <span className={`uppercase font-bold shrink-0 ${entry.isSentinelYell ? "text-[#F59E0B]" : "text-[#ffa500]"}`}>
                {entry.agentLabel}
              </span>
              {entry.isSentinelYell ? (
                <>
                  <span className="text-[#F59E0B]/70 shrink-0">&rarr;</span>
                  <span className="text-[#ff2d2d] truncate">
                    {entry.description}
                  </span>
                </>
              ) : (
                <>
                  {entry.buildingId && (
                    <span className="text-[#4da6ff]/70 shrink-0 hidden sm:inline">
                      @ {BUILDING_NAMES[entry.buildingId] ?? entry.buildingId}
                    </span>
                  )}
                  <span className="text-[#666680] hidden sm:inline">::</span>
                  <span className="text-[#e0e0e0]/80 truncate">
                    {entry.description}
                  </span>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
