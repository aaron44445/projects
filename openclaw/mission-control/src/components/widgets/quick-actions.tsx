"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { WidgetConfig } from "@/lib/types";

interface ActionButton {
  label: string;
  cronJobId?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  icon?: string;
  confirm?: boolean;
}

type ActionStatus = "idle" | "running" | "success" | "error";

const iconMap: Record<string, string> = {
  play: "\u25b6",
  refresh: "\u21bb",
  send: "\u27a4",
  check: "\u2713",
  x: "\u2717",
  zap: "\u26a1",
  clock: "\u23f0",
  rocket: "\ud83d\ude80",
  gear: "\u2699",
  bell: "\ud83d\udd14",
};

export function QuickActions({ config }: { config: WidgetConfig }) {
  const [statuses, setStatuses] = useState<Record<string, ActionStatus>>({});

  const actions: ActionButton[] =
    (config.config?.actions as ActionButton[]) ?? [];

  const handleAction = useCallback(async (action: ActionButton, idx: number) => {
    const key = `action-${idx}`;

    if (action.confirm) {
      const confirmed = window.confirm(
        `Run "${action.label}"?`
      );
      if (!confirmed) return;
    }

    if (!action.cronJobId) return;

    setStatuses((prev) => ({ ...prev, [key]: "running" }));

    try {
      const res = await fetch(`/api/cron/${action.cronJobId}/run`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(`Failed: ${res.status}`);
      }

      setStatuses((prev) => ({ ...prev, [key]: "success" }));

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [key]: "idle" }));
      }, 3000);
    } catch {
      setStatuses((prev) => ({ ...prev, [key]: "error" }));

      // Reset to idle after 5 seconds
      setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [key]: "idle" }));
      }, 5000);
    }
  }, []);

  if (actions.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
        No actions configured
      </div>
    );
  }

  // Determine layout based on action count
  const cols =
    actions.length <= 2
      ? "grid-cols-2"
      : actions.length <= 4
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <div className={`grid ${cols} gap-2`}>
      {actions.map((action, idx) => {
        const key = `action-${idx}`;
        const status = statuses[key] ?? "idle";
        const isRunning = status === "running";
        const isSuccess = status === "success";
        const isError = status === "error";

        const iconChar = action.icon ? iconMap[action.icon] ?? "" : "";

        return (
          <Button
            key={idx}
            variant={action.variant ?? "outline"}
            size="sm"
            disabled={isRunning}
            onClick={() => handleAction(action, idx)}
            className={`
              text-[11px] font-medium h-8 gap-1.5 transition-all
              ${isSuccess ? "border-green-500/50 text-green-400" : ""}
              ${isError ? "border-red-500/50 text-red-400" : ""}
              ${isRunning ? "opacity-70" : ""}
            `}
          >
            {isRunning ? (
              <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : isSuccess ? (
              <span>{"\u2713"}</span>
            ) : isError ? (
              <span>{"\u2717"}</span>
            ) : iconChar ? (
              <span>{iconChar}</span>
            ) : null}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
