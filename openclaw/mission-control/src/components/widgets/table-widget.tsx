"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetConfig } from "@/lib/types";

type SortDirection = "asc" | "desc";

interface TableState {
  columns: string[];
  rows: Record<string, unknown>[];
  sortKey: string | null;
  sortDir: SortDirection;
}

export function TableWidget({ config }: { config: WidgetConfig }) {
  const [state, setState] = useState<TableState>({
    columns: [],
    rows: [],
    sortKey: null,
    sortDir: "asc",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.data) {
      // Placeholder data
      setState({
        columns: ["Name", "Status", "Value"],
        rows: [
          { Name: "Item A", Status: "Active", Value: 42 },
          { Name: "Item B", Status: "Paused", Value: 18 },
          { Name: "Item C", Status: "Active", Value: 73 },
        ],
        sortKey: null,
        sortDir: "asc",
      });
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/files?path=${encodeURIComponent(config.data!)}`
        );
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();

        let rows: Record<string, unknown>[] = [];

        if (Array.isArray(data)) {
          rows = data;
        } else if (data.leads && Array.isArray(data.leads)) {
          // Pipeline data - pick relevant columns
          rows = data.leads.map((lead: Record<string, unknown>) => ({
            Business: lead.business,
            Stage: lead.stage,
            City: lead.city,
            Score: lead.score ?? "--",
            Rating: lead.googleRating ?? "--",
          }));
        } else if (typeof data === "object") {
          // Convert object to single-row table
          rows = [data];
        }

        // Extract column names from first row
        const columns =
          rows.length > 0
            ? Object.keys(rows[0]).filter(
                (k) =>
                  typeof rows[0][k] !== "object" || rows[0][k] === null
              )
            : [];

        // Limit columns if configured
        const maxCols = (config.config?.maxColumns as number) ?? 6;
        const visibleCols = columns.slice(0, maxCols);

        setState((prev) => ({
          ...prev,
          columns: visibleCols,
          rows,
        }));
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config.data, config.config?.maxColumns]);

  const handleSort = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      sortKey: key,
      sortDir:
        prev.sortKey === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  }, []);

  const sortedRows = useMemo(() => {
    if (!state.sortKey) return state.rows;
    const key = state.sortKey;
    const dir = state.sortDir === "asc" ? 1 : -1;

    return [...state.rows].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [state.rows, state.sortKey, state.sortDir]);

  // Max rows to display
  const maxRows = (config.config?.maxRows as number) ?? 20;
  const displayRows = sortedRows.slice(0, maxRows);

  if (error) {
    return (
      <div className="text-xs text-red-400/80 py-2">
        Failed to load table data
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-full rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full rounded" />
        ))}
      </div>
    );
  }

  if (state.columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border/30">
            {state.columns.map((col) => (
              <th
                key={col}
                className="text-left font-medium text-muted-foreground uppercase tracking-wider px-2 py-1.5 cursor-pointer hover:text-foreground transition-colors select-none"
                onClick={() => handleSort(col)}
              >
                <span className="flex items-center gap-1">
                  {col}
                  {state.sortKey === col && (
                    <span className="text-[9px]">
                      {state.sortDir === "asc" ? "\u25b2" : "\u25bc"}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-border/15 hover:bg-background/40 transition-colors"
            >
              {state.columns.map((col) => (
                <td
                  key={col}
                  className={`px-2 py-1.5 text-foreground truncate max-w-[180px] ${
                    typeof row[col] === "number" ? "font-mono tabular-nums" : ""
                  }`}
                >
                  {row[col] !== null && row[col] !== undefined
                    ? String(row[col])
                    : "--"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sortedRows.length > maxRows && (
        <div className="text-center pt-2">
          <span className="font-mono text-[9px] text-muted-foreground">
            Showing {maxRows} of {sortedRows.length} rows
          </span>
        </div>
      )}
    </div>
  );
}
