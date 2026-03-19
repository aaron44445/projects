"use client";

import { useState } from "react";

interface ReflectionPromptProps {
  question: string;
  onSubmit: (response: string) => void;
  loading: boolean;
}

export default function ReflectionPrompt({ question, onSubmit, loading }: ReflectionPromptProps) {
  const [response, setResponse] = useState("");

  return (
    <div className="mt-12 pt-8 border-t border-white/5">
      <p className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mb-4">Reflect</p>
      <p className="text-lg font-light leading-relaxed mb-6">{question}</p>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Write your thoughts..."
        className="w-full bg-transparent border-b border-white/10 focus:border-[var(--accent)] pb-3 text-[var(--fg)] resize-none h-24 mb-6 outline-none transition-colors"
      />
      <div className="flex gap-6">
        <button
          onClick={() => onSubmit(response)}
          disabled={!response.trim() || loading}
          className="text-sm tracking-[0.15em] uppercase text-[var(--accent)] disabled:opacity-30 transition-opacity"
        >
          {loading ? "..." : "Save"}
        </button>
        <button
          onClick={() => onSubmit("")}
          className="text-sm tracking-[0.15em] uppercase text-[var(--muted)]"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
