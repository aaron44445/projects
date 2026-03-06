"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetConfig } from "@/lib/types";

interface KpiMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "flat";
}

const trendColors: Record<string, string> = {
  up: "text-green-400",
  down: "text-red-400",
  flat: "text-muted-foreground",
};

const trendArrows: Record<string, string> = {
  up: "\u2191",
  down: "\u2193",
  flat: "\u2192",
};

export function KpiCards({ config }: { config: WidgetConfig }) {
  const [metrics, setMetrics] = useState<KpiMetric[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.data) {
      // Use placeholder metrics when no data file is configured
      setMetrics([
        { label: "Total Leads", value: "--", trend: "flat" },
        { label: "Reply Rate", value: "--", trend: "flat" },
        { label: "Calls Booked", value: "--", trend: "flat" },
        { label: "Pipeline Value", value: "--", trend: "flat" },
      ]);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/files?path=${encodeURIComponent(config.data!)}`
        );
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();

        // Handle different data shapes
        if (Array.isArray(data)) {
          setMetrics(data);
        } else if (data.metrics && typeof data.metrics === "object") {
          // Convert metrics object to KPI array
          const kpis: KpiMetric[] = Object.entries(data.metrics).map(
            ([key, value]) => ({
              label: key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (s) => s.toUpperCase())
                .trim(),
              value: value as string | number,
            })
          );
          setMetrics(kpis);
        } else if (data.channelPerformance) {
          // Performance data shape
          const perf = data.channelPerformance;
          setMetrics([
            {
              label: "Emails Sent",
              value: perf.email?.totalSent ?? 0,
            },
            {
              label: "Reply Rate",
              value: perf.email?.replyRate
                ? `${(perf.email.replyRate * 100).toFixed(1)}%`
                : "0%",
              trend: (perf.email?.replyRate ?? 0) > 0.05 ? "up" : "flat",
            },
            {
              label: "Calls Booked",
              value: perf.email?.callsBooked ?? 0,
              trend: (perf.email?.callsBooked ?? 0) > 0 ? "up" : "flat",
            },
            {
              label: "DM Success",
              value: perf.dm?.successRate
                ? `${(perf.dm.successRate * 100).toFixed(1)}%`
                : "0%",
            },
          ]);
        } else {
          // Fallback: show raw keys as metrics
          const kpis: KpiMetric[] = Object.entries(data)
            .filter(
              ([, v]) =>
                typeof v === "number" || typeof v === "string"
            )
            .slice(0, 6)
            .map(([key, value]) => ({
              label: key
                .replace(/([A-Z])/g, " $1")
                .replace(/[_-]/g, " ")
                .replace(/^./, (s) => s.toUpperCase())
                .trim(),
              value: value as string | number,
            }));
          setMetrics(kpis.length > 0 ? kpis : null);
        }
      } catch (err) {
        setError(String(err));
      }
    };

    fetchData();
  }, [config.data]);

  if (error) {
    return (
      <div className="text-xs text-red-400/80 py-2">
        Failed to load metrics
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  // Determine grid columns based on metric count
  const cols =
    metrics.length <= 2
      ? "grid-cols-2"
      : metrics.length <= 4
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <div className={`grid ${cols} gap-3`}>
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="rounded-md border border-border/30 bg-background/40 p-3 space-y-1"
        >
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {metric.label}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl font-semibold text-foreground tabular-nums">
              {metric.value}
            </span>
            {metric.trend && metric.change && (
              <span
                className={`font-mono text-[10px] ${trendColors[metric.trend]}`}
              >
                {trendArrows[metric.trend]} {metric.change}
              </span>
            )}
            {metric.trend && !metric.change && (
              <span
                className={`font-mono text-[10px] ${trendColors[metric.trend]}`}
              >
                {trendArrows[metric.trend]}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
