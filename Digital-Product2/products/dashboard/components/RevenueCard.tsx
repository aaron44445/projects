"use client";

import { useState, useMemo } from "react";
import type { RevenueEntry } from "@/lib/store";

interface RevenueCardProps {
  entries: RevenueEntry[];
  onSetRevenue: (month: string, amount: number) => void;
}

export default function RevenueCard({ entries, onSetRevenue }: RevenueCardProps) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentEntry = entries.find((e) => e.month === currentMonth);
  const [inputVal, setInputVal] = useState(
    currentEntry ? String(currentEntry.amount) : ""
  );

  // Last 6 months for bar chart
  const chartData = useMemo(() => {
    const last6: RevenueEntry[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.toISOString().slice(0, 7);
      const entry = entries.find((e) => e.month === m);
      last6.push({ month: m, amount: entry?.amount ?? 0 });
    }
    return last6;
  }, [entries]);

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1);

  function handleSave() {
    const amount = parseFloat(inputVal) || 0;
    onSetRevenue(currentMonth, amount);
  }

  function formatMonth(m: string) {
    const [, month] = m.split("-");
    const names = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return names[parseInt(month) - 1] || month;
  }

  return (
    <div className="card">
      <h2 className="card-title">Revenue</h2>

      {/* Current month input */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs text-neutral-400">This month:</span>
        <div className="flex items-center gap-1.5 flex-1">
          <span className="text-sm text-neutral-500">$</span>
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="0"
            className="flex-1 bg-transparent text-sm outline-none border-b border-neutral-700 focus:border-cyan-500 pb-0.5 transition-colors tabular-nums"
          />
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-24">
        {chartData.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-neutral-500 tabular-nums">
              {d.amount > 0 ? `$${d.amount.toLocaleString()}` : ""}
            </span>
            <div className="w-full relative" style={{ height: "60px" }}>
              <div
                className={`absolute bottom-0 w-full rounded-sm transition-all duration-300 ${
                  d.month === currentMonth
                    ? "bg-cyan-500"
                    : "bg-neutral-700"
                }`}
                style={{
                  height: `${Math.max(
                    (d.amount / maxAmount) * 100,
                    d.amount > 0 ? 4 : 0
                  )}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-neutral-500">
              {formatMonth(d.month)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
