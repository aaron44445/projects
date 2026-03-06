"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface ReportEntry {
  filename: string;
  date: string;
}

interface ReportListProps {
  reports: ReportEntry[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

function formatReportDate(dateStr: string): {
  weekday: string;
  display: string;
} {
  try {
    const d = new Date(dateStr + "T12:00:00");
    if (isNaN(d.getTime())) return { weekday: "", display: dateStr };
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const display = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return { weekday, display };
  } catch {
    return { weekday: "", display: dateStr };
  }
}

function isToday(dateStr: string): boolean {
  try {
    const d = new Date(dateStr + "T12:00:00");
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
}

export function ReportList({
  reports,
  selectedDate,
  onSelect,
}: ReportListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">
            Reports
          </span>
          <span className="text-[10px] text-muted-foreground/40 font-mono">
            ({reports.length})
          </span>
        </div>
      </div>

      {/* Scrollable list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {reports.map((report) => {
            const active = selectedDate === report.date;
            const { weekday, display } = formatReportDate(report.date);
            const today = isToday(report.date);

            return (
              <button
                key={report.date}
                onClick={() => onSelect(report.date)}
                className={`w-full text-left px-3 py-2.5 rounded-md transition-all group ${
                  active
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-secondary/50 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      active
                        ? "text-primary"
                        : "text-foreground/80 group-hover:text-foreground"
                    }`}
                  >
                    {display}
                  </span>
                  {today && (
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-status-green bg-status-green/10 px-1.5 py-0.5 rounded">
                      Today
                    </span>
                  )}
                </div>
                {weekday && (
                  <span
                    className={`text-[10px] font-mono ${
                      active
                        ? "text-primary/60"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {weekday}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
