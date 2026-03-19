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
        <button onClick={() => setMode("menu")} className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mb-8">
          Back
        </button>
        <StruggleForm onSaved={() => setMode("menu")} />
      </div>
    );
  }

  if (mode === "morning" || mode === "evening") {
    return (
      <div>
        <button onClick={() => setMode("menu")} className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mb-8">
          Back
        </button>
        <CheckinForm
          type={mode === "morning" ? "checkin_morning" : "checkin_evening"}
          onSaved={() => setMode("menu")}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col">
        <button
          onClick={() => setMode("struggle")}
          className="py-6 text-left border-b border-white/5"
        >
          <span className="text-lg font-light">I need help</span>
        </button>
        <button
          onClick={() => setMode("morning")}
          className="py-6 text-left border-b border-white/5"
        >
          <span className="text-lg font-light">Morning</span>
          <span className="block text-sm text-[var(--muted)] mt-0.5">How are you feeling?</span>
        </button>
        <button
          onClick={() => setMode("evening")}
          className="py-6 text-left"
        >
          <span className="text-lg font-light">Evening</span>
          <span className="block text-sm text-[var(--muted)] mt-0.5">How did today go?</span>
        </button>
      </div>
    </div>
  );
}
