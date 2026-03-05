"use client";

import { useState, useRef, useEffect } from "react";

interface Habit {
  name: string;
  done: boolean;
}

interface HabitCardProps {
  habits: Habit[];
  onToggle: (index: number) => void;
  onRename: (index: number, name: string) => void;
}

export default function HabitCard({
  habits,
  onToggle,
  onRename,
}: HabitCardProps) {
  const doneCount = habits.filter((h) => h.done).length;
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIdx !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIdx]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-title mb-0">Habits</h2>
        <span className="text-sm text-neutral-400">
          <span className="text-cyan-400 font-semibold">{doneCount}</span>/
          {habits.length} done
        </span>
      </div>
      <div className="space-y-2.5">
        {habits.map((habit, i) => (
          <div key={i} className="flex items-center gap-3">
            <button
              onClick={() => onToggle(i)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                habit.done
                  ? "border-cyan-500 bg-cyan-500/20"
                  : "border-neutral-600 hover:border-neutral-400"
              }`}
              aria-label={
                habit.done ? `Unmark ${habit.name}` : `Mark ${habit.name} done`
              }
            >
              {habit.done && (
                <svg
                  className="h-3 w-3 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>

            {editingIdx === i ? (
              <input
                ref={inputRef}
                type="text"
                value={habit.name}
                onChange={(e) => onRename(i, e.target.value)}
                onBlur={() => setEditingIdx(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape")
                    setEditingIdx(null);
                }}
                className="flex-1 bg-transparent text-sm outline-none border-b border-neutral-700 focus:border-cyan-500 pb-0.5 transition-colors"
              />
            ) : (
              <span
                onDoubleClick={() => setEditingIdx(i)}
                className={`flex-1 text-sm cursor-default select-none ${
                  habit.done ? "text-neutral-500" : "text-white"
                }`}
                title="Double-click to rename"
              >
                {habit.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
