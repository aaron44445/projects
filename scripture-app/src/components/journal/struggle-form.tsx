"use client";

import { useState } from "react";
import AiResponseCard from "./ai-response-card";

interface StruggleFormProps {
  onSaved: () => void;
}

export default function StruggleForm({ onSaved }: StruggleFormProps) {
  const [content, setContent] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);

    const aiRes = await fetch("/api/ai/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const aiData = await aiRes.json();
    setAiResponse(aiData.response);

    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "trigger",
        content,
        ai_response: aiData.response,
      }),
    });

    setLoading(false);
    onSaved();
  }

  return (
    <div>
      <p className="text-lg font-light mb-6">What are you feeling right now?</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write freely..."
        className="w-full bg-transparent border-b border-white/10 focus:border-[var(--accent)] pb-3 text-[var(--fg)] resize-none h-32 mb-6 outline-none transition-colors"
      />
      {!aiResponse && (
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          className="text-sm tracking-[0.15em] uppercase text-[var(--accent)] disabled:opacity-30 transition-opacity"
        >
          {loading ? "..." : "Get support"}
        </button>
      )}
      {aiResponse && <AiResponseCard response={aiResponse} />}
    </div>
  );
}
