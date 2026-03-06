"use client";

import { useEffect, useState } from "react";
import type { WidgetConfig } from "@/lib/types";

export function ProgressBarWidget({ config }: { config: WidgetConfig }) {
  const [animated, setAnimated] = useState(false);

  const current = (config.config?.current as number) ?? 0;
  const target = (config.config?.target as number) ?? 100;
  const unit = (config.config?.unit as string) ?? "";
  const label = (config.config?.label as string) ?? "";
  const color = (config.config?.color as string) ?? "emerald";

  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  // Animate on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const colorMap: Record<string, { bar: string; text: string; bg: string }> = {
    emerald: {
      bar: "bg-emerald-500",
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    blue: {
      bar: "bg-blue-500",
      text: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    amber: {
      bar: "bg-amber-500",
      text: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    red: {
      bar: "bg-red-500",
      text: "text-red-400",
      bg: "bg-red-500/10",
    },
    purple: {
      bar: "bg-purple-500",
      text: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    cyan: {
      bar: "bg-cyan-500",
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  };

  const colors = colorMap[color] ?? colorMap.emerald;

  return (
    <div className="space-y-2">
      {/* Header with value and percentage */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-mono text-2xl font-bold tabular-nums ${colors.text}`}>
            {current.toLocaleString()}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            / {target.toLocaleString()}
            {unit && ` ${unit}`}
          </span>
        </div>
        <span className={`font-mono text-sm font-semibold tabular-nums ${colors.text}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>

      {label && (
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
      )}

      {/* Progress bar */}
      <div className={`h-2.5 w-full rounded-full ${colors.bg} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colors.bar}`}
          style={{ width: animated ? `${percentage}%` : "0%" }}
        />
      </div>

      {/* Milestone markers */}
      {target > 0 && (
        <div className="flex justify-between">
          <span className="font-mono text-[9px] text-muted-foreground/60">0</span>
          <span className="font-mono text-[9px] text-muted-foreground/60">
            {(target * 0.25).toLocaleString()}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/60">
            {(target * 0.5).toLocaleString()}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/60">
            {(target * 0.75).toLocaleString()}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/60">
            {target.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
