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
    <div className="bg-[var(--bg-card)] rounded-2xl p-6 text-center">
      <p className="text-sm text-[var(--text-secondary)] mb-2">Clean Days</p>
      <p className="text-6xl font-bold text-[var(--accent-green)] mb-2">{currentDays}</p>
      <p className="text-sm text-[var(--text-secondary)] mb-4">Longest: {longestStreak} days</p>
      {confirming ? (
        <div className="flex gap-3 justify-center">
          <button onClick={() => { onReset(); setConfirming(false); }} className="px-4 py-2 rounded-lg bg-[var(--accent-red)] text-white text-sm">Yes, reset</button>
          <button onClick={() => setConfirming(false)} className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-secondary)] text-sm">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="text-sm text-[var(--accent-red)]/60 underline">Reset</button>
      )}
    </div>
  );
}
