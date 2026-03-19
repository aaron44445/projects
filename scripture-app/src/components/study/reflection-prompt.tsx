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
    <div className="bg-[var(--bg-card)] rounded-2xl p-6 mt-4">
      <h3 className="text-sm text-[var(--accent-gold)] mb-2">Reflect</h3>
      <p className="text-[var(--text-primary)] mb-4">{question}</p>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Write your thoughts..."
        className="w-full bg-[var(--bg-primary)] rounded-xl p-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none h-28 mb-3"
      />
      <div className="flex gap-3">
        <button
          onClick={() => onSubmit(response)}
          disabled={!response.trim() || loading}
          className="flex-1 py-3 rounded-xl bg-[var(--accent-blue)] text-white font-medium disabled:opacity-40"
        >
          {loading ? "..." : "Save"}
        </button>
        <button
          onClick={() => onSubmit("")}
          className="px-6 py-3 rounded-xl bg-[var(--bg-primary)] text-[var(--text-secondary)]"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
