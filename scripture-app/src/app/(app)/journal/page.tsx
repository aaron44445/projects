"use client";

import { useState } from "react";
import StruggleForm from "@/components/journal/struggle-form";
import CheckinForm from "@/components/journal/checkin-form";

type Mode = "menu" | "struggle" | "morning" | "evening";

export default function JournalPage() {
  const [mode, setMode] = useState<Mode>("menu");

  if (mode === "struggle") {
    return (
      <div>
        <button onClick={() => setMode("menu")} className="text-[var(--text-secondary)] mb-4">← Back</button>
        <StruggleForm onSaved={() => setMode("menu")} />
      </div>
    );
  }

  if (mode === "morning" || mode === "evening") {
    return (
      <div>
        <button onClick={() => setMode("menu")} className="text-[var(--text-secondary)] mb-4">← Back</button>
        <CheckinForm
          type={mode === "morning" ? "checkin_morning" : "checkin_evening"}
          onSaved={() => setMode("menu")}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Journal</h1>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setMode("struggle")}
          className="bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 rounded-2xl p-5 text-left"
        >
          <span className="text-lg font-semibold text-[var(--accent-red)]">I&apos;m struggling</span>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Get immediate support and encouragement</p>
        </button>
        <button
          onClick={() => setMode("morning")}
          className="bg-[var(--bg-card)] rounded-2xl p-5 text-left"
        >
          <span className="text-lg font-semibold">Morning Check-in</span>
          <p className="text-sm text-[var(--text-secondary)] mt-1">How are you feeling today?</p>
        </button>
        <button
          onClick={() => setMode("evening")}
          className="bg-[var(--bg-card)] rounded-2xl p-5 text-left"
        >
          <span className="text-lg font-semibold">Evening Check-in</span>
          <p className="text-sm text-[var(--text-secondary)] mt-1">How did today go?</p>
        </button>
      </div>
    </div>
  );
}
