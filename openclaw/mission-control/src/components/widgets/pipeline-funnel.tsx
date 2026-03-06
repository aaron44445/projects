"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetConfig, PipelineData } from "@/lib/types";

interface FunnelStage {
  name: string;
  count: number;
  color: string;
}

const stageColors: Record<string, string> = {
  prospect: "bg-blue-500/70",
  researched: "bg-blue-400/70",
  contacted: "bg-cyan-500/70",
  "email-sent": "bg-cyan-400/70",
  "follow-up": "bg-teal-500/70",
  replied: "bg-green-500/70",
  "call-booked": "bg-green-400/70",
  closed: "bg-emerald-500/70",
  won: "bg-emerald-400/70",
  lost: "bg-red-500/40",
  "not-interested": "bg-gray-500/40",
  bounced: "bg-red-400/40",
};

function getStageColor(stage: string): string {
  const normalized = stage.toLowerCase().replace(/\s+/g, "-");
  return stageColors[normalized] ?? "bg-purple-500/60";
}

export function PipelineFunnel({ config }: { config: WidgetConfig }) {
  const [stages, setStages] = useState<FunnelStage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.data) {
      // Placeholder stages
      setStages([
        { name: "Prospect", count: 0, color: "bg-blue-500/70" },
        { name: "Contacted", count: 0, color: "bg-cyan-500/70" },
        { name: "Replied", count: 0, color: "bg-green-500/70" },
        { name: "Booked", count: 0, color: "bg-emerald-500/70" },
      ]);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/files?path=${encodeURIComponent(config.data!)}`
        );
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data: PipelineData = await res.json();

        // Count leads per stage
        const stageCounts: Record<string, number> = {};
        for (const lead of data.leads) {
          const stage = lead.stage;
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        }

        // Define funnel order (top to bottom)
        const funnelOrder = [
          "prospect",
          "researched",
          "contacted",
          "email-sent",
          "follow-up",
          "replied",
          "call-booked",
          "closed",
          "won",
        ];

        // Build stages list: ordered stages first, then any unknown stages
        const knownStages = new Set(funnelOrder);
        const orderedStages: FunnelStage[] = [];

        for (const stage of funnelOrder) {
          if (stageCounts[stage]) {
            orderedStages.push({
              name: stage
                .replace(/-/g, " ")
                .replace(/^./, (s) => s.toUpperCase()),
              count: stageCounts[stage],
              color: getStageColor(stage),
            });
          }
        }

        // Add any stages not in the predefined order
        for (const [stage, count] of Object.entries(stageCounts)) {
          if (!knownStages.has(stage)) {
            orderedStages.push({
              name: stage
                .replace(/-/g, " ")
                .replace(/^./, (s) => s.toUpperCase()),
              count,
              color: getStageColor(stage),
            });
          }
        }

        setStages(orderedStages.length > 0 ? orderedStages : null);
      } catch (err) {
        setError(String(err));
      }
    };

    fetchData();
  }, [config.data]);

  if (error) {
    return (
      <div className="text-xs text-red-400/80 py-2">
        Failed to load pipeline
      </div>
    );
  }

  if (!stages) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 rounded" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    );
  }

  if (stages.every((s) => s.count === 0)) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        No pipeline data
      </div>
    );
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-1.5">
      {stages.map((stage, idx) => {
        const widthPct = Math.max((stage.count / maxCount) * 100, 8);
        return (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-20 shrink-0 text-right">
              <span className="text-[10px] text-muted-foreground truncate">
                {stage.name}
              </span>
            </div>
            <div className="flex-1 h-6 bg-background/30 rounded overflow-hidden relative">
              <div
                className={`h-full rounded transition-all duration-700 ease-out ${stage.color}`}
                style={{ width: `${widthPct}%` }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center font-mono text-[10px] font-semibold text-foreground">
                {stage.count}
              </span>
            </div>
          </div>
        );
      })}
      <div className="pt-1 text-right">
        <span className="font-mono text-[10px] text-muted-foreground">
          {stages.reduce((sum, s) => sum + s.count, 0)} total
        </span>
      </div>
    </div>
  );
}
