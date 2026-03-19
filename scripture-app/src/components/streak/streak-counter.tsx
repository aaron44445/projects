"use client";

import { useState } from "react";

interface StreakCounterProps {
  currentDays: number;
  longestStreak: number;
  onReset: () => void;
}

export default function StreakCounter({ currentDays, longestStreak, onReset }: StreakCounterProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="text-center">
      <p className="text-[7rem] font-light leading-none text-[var(--fg)] mb-2">{currentDays}</p>
      <p className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-1">
        {currentDays === 1 ? "day" : "days"} clean
      </p>
      {longestStreak > currentDays && (
        <p className="text-xs text-[var(--muted)]/50 mt-2">best: {longestStreak}</p>
      )}
      <div className="mt-4">
        {confirming ? (
          <div className="flex gap-6 justify-center text-xs tracking-[0.15em] uppercase">
            <button onClick={() => { onReset(); setConfirming(false); }} className="text-[var(--slip)]">Reset</button>
            <button onClick={() => setConfirming(false)} className="text-[var(--muted)]">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-xs text-[var(--muted)]/40 tracking-[0.15em] uppercase">
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
