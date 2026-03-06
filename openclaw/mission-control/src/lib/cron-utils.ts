import { formatDistanceToNow } from "date-fns";
import type { CronJob } from "@/lib/types";

/**
 * Convert a cron expression to human-readable text.
 * Handles common patterns used in OpenCLAW cron jobs.
 */
export function cronToHuman(expr: string, tz?: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const tzLabel = tz ? ` ${tz}` : "";

  // Helper: format hour:minute with AM/PM
  const formatTime = (h: string, m: string): string => {
    const hi = parseInt(h, 10);
    const mi = parseInt(m, 10);
    const period = hi >= 12 ? "PM" : "AM";
    const displayHour = hi === 0 ? 12 : hi > 12 ? hi - 12 : hi;
    return `${displayHour}:${mi.toString().padStart(2, "0")} ${period}`;
  };

  // Helper: describe day-of-week ranges
  const describeDow = (dow: string): string => {
    if (dow === "*") return "";
    if (dow === "1-5") return "Weekdays";
    if (dow === "0,6" || dow === "6,0") return "Weekends";
    const dayNames: Record<string, string> = {
      "0": "Sun",
      "1": "Mon",
      "2": "Tue",
      "3": "Wed",
      "4": "Thu",
      "5": "Fri",
      "6": "Sat",
    };
    return dow
      .split(",")
      .map((d) => dayNames[d] ?? d)
      .join(", ");
  };

  // Every N minutes within an hour range: */15 7-21 * * *
  if (minute.startsWith("*/") && hour.includes("-") && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const interval = minute.slice(2);
    const [startH, endH] = hour.split("-");
    const startPeriod = parseInt(startH, 10) >= 12 ? "PM" : "AM";
    const endPeriod = parseInt(endH, 10) >= 12 ? "PM" : "AM";
    const startDisplay = parseInt(startH, 10) === 0 ? 12 : parseInt(startH, 10) > 12 ? parseInt(startH, 10) - 12 : parseInt(startH, 10);
    const endDisplay = parseInt(endH, 10) === 0 ? 12 : parseInt(endH, 10) > 12 ? parseInt(endH, 10) - 12 : parseInt(endH, 10);
    return `Every ${interval} min (${startDisplay}${startPeriod}-${endDisplay}${endPeriod})${tzLabel}`;
  }

  // Every N hours: 0 */3 * * *
  if (minute === "0" && hour.startsWith("*/") && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const interval = hour.slice(2);
    return `Every ${interval} hours${tzLabel}`;
  }

  // Every N minutes globally: */5 * * * *
  if (minute.startsWith("*/") && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const interval = minute.slice(2);
    return `Every ${interval} min${tzLabel}`;
  }

  // Specific time with optional day-of-week
  if (!minute.includes("/") && !minute.includes("-") && !hour.includes("/") && !hour.includes("-") && dayOfMonth === "*" && month === "*") {
    const time = formatTime(hour, minute);
    const dow = describeDow(dayOfWeek);

    if (dayOfWeek === "*") {
      return `Daily at ${time}${tzLabel}`;
    }
    return `${dow} at ${time}${tzLabel}`;
  }

  // Specific day of month
  if (!minute.includes("/") && !hour.includes("/") && dayOfMonth !== "*" && month === "*" && dayOfWeek === "*") {
    const time = formatTime(hour, minute);
    const suffix = getDaySuffix(parseInt(dayOfMonth, 10));
    return `${dayOfMonth}${suffix} of each month at ${time}${tzLabel}`;
  }

  // Fallback: return expression
  return `${expr}${tzLabel}`;
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

/**
 * Get relative time until next run.
 */
export function getNextRun(nextRunAtMs?: number): string {
  if (!nextRunAtMs) return "--";
  const now = Date.now();
  if (nextRunAtMs <= now) return "imminent";
  return `in ${formatDistanceToNow(new Date(nextRunAtMs))}`;
}

/**
 * Get relative time since last run.
 */
export function getLastRun(lastRunAtMs?: number): string {
  if (!lastRunAtMs) return "never";
  return formatDistanceToNow(new Date(lastRunAtMs), { addSuffix: true });
}

/**
 * Format a duration in milliseconds to human-readable.
 */
export function formatDuration(ms?: number): string {
  if (ms === undefined || ms === null) return "--";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

/**
 * Determine job health color based on state.
 * - green: enabled, last run OK or never run
 * - red: last run error or timeout, or consecutive errors > 0
 * - amber: disabled but has run before
 * - gray: disabled, never run
 */
export function getJobStatusColor(
  job: CronJob
): "green" | "red" | "amber" | "gray" {
  const { enabled, state } = job;

  // Error states always red
  if (
    state?.lastRunStatus === "error" ||
    state?.lastRunStatus === "timeout" ||
    state?.lastStatus === "error" ||
    state?.lastStatus === "timeout" ||
    (state?.consecutiveErrors && state.consecutiveErrors > 0)
  ) {
    return "red";
  }

  // Enabled and healthy
  if (enabled) {
    return "green";
  }

  // Disabled with history
  if (state?.lastRunAtMs) {
    return "amber";
  }

  // Disabled, never run
  return "gray";
}

/**
 * Map job status color to StatusDot status.
 */
export function statusColorToDotStatus(
  color: "green" | "red" | "amber" | "gray"
): "online" | "error" | "warning" | "offline" {
  switch (color) {
    case "green":
      return "online";
    case "red":
      return "error";
    case "amber":
      return "warning";
    case "gray":
      return "offline";
  }
}
