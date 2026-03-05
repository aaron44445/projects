"use client";

import { useState } from "react";
import type { Goal } from "@/lib/store";

interface GoalCardProps {
  goals: Goal[];
  onChange: (goals: Goal[]) => void;
}

export default function GoalCard({ goals, onChange }: GoalCardProps) {
  const [editingTitle, setEditingTitle] = useState<number | null>(null);

  function updateProgress(i: number, progress: number) {
    const next = goals.map((g, idx) =>
      idx === i ? { ...g, progress: Math.min(100, Math.max(0, progress)) } : g
    );
    onChange(next);
  }

  function updateTitle(i: number, title: string) {
    const next = goals.map((g, idx) =>
      idx === i ? { ...g, title } : g
    );
    onChange(next);
  }

  function addGoal() {
    if (goals.length >= 5) return;
    onChange([...goals, { title: "New Goal", progress: 0 }]);
  }

  function removeGoal(i: number) {
    onChange(goals.filter((_, idx) => idx !== i));
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-title mb-0">Quarterly Goals</h2>
        {goals.length < 5 && (
          <button
            onClick={addGoal}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            + Add Goal
          </button>
        )}
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No goals yet. Add your first quarterly goal.
        </p>
      ) : (
        <div className="space-y-4">
          {goals.map((goal, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                {editingTitle === i ? (
                  <input
                    type="text"
                    value={goal.title}
                    onChange={(e) => updateTitle(i, e.target.value)}
                    onBlur={() => setEditingTitle(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape")
                        setEditingTitle(null);
                    }}
                    className="flex-1 bg-transparent text-sm outline-none border-b border-neutral-700 focus:border-cyan-500 pb-0.5 transition-colors mr-2"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => setEditingTitle(i)}
                    className="text-sm text-white cursor-pointer hover:text-cyan-400 transition-colors"
                    title="Click to edit"
                  >
                    {goal.title}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {goal.progress}%
                  </span>
                  <button
                    onClick={() => removeGoal(i)}
                    className="text-neutral-600 hover:text-red-400 transition-colors"
                    aria-label="Remove goal"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Progress bar */}
              <div className="relative h-2 w-full rounded-full bg-neutral-800 overflow-hidden mb-1.5">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              {/* Slider */}
              <input
                type="range"
                min={0}
                max={100}
                value={goal.progress}
                onChange={(e) => updateProgress(i, parseInt(e.target.value))}
                className="w-full accent-cyan-500 h-1 cursor-pointer"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
