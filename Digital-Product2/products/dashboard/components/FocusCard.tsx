"use client";

import { useState, useRef, useEffect } from "react";
import type { FocusItem } from "@/lib/store";

interface FocusCardProps {
  items: FocusItem[];
  onChange: (items: FocusItem[]) => void;
}

export default function FocusCard({ items, onChange }: FocusCardProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIdx !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingIdx]);

  function toggleDone(i: number) {
    const next = items.map((item, idx) =>
      idx === i ? { ...item, done: !item.done } : item
    );
    onChange(next);
  }

  function updateText(i: number, text: string) {
    const next = items.map((item, idx) =>
      idx === i ? { ...item, text } : item
    );
    onChange(next);
  }

  function handleBlur() {
    setEditingIdx(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === "Escape") {
      setEditingIdx(null);
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">Today&apos;s Focus</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <button
              onClick={() => toggleDone(i)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                item.done
                  ? "border-cyan-500 bg-cyan-500/20"
                  : "border-neutral-600 hover:border-neutral-400"
              }`}
              aria-label={item.done ? "Mark incomplete" : "Mark complete"}
            >
              {item.done && (
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
                value={item.text}
                onChange={(e) => updateText(i, e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={`Priority ${i + 1}`}
                className="flex-1 bg-transparent text-sm outline-none border-b border-neutral-700 focus:border-cyan-500 pb-0.5 transition-colors"
              />
            ) : (
              <span
                onClick={() => setEditingIdx(i)}
                className={`flex-1 text-sm cursor-pointer ${
                  item.done
                    ? "line-through text-neutral-500"
                    : item.text
                    ? "text-white"
                    : "text-neutral-500"
                }`}
              >
                {item.text || `Priority ${i + 1} — click to edit`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
