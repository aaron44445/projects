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
    <div className="bg-[var(--bg-card)] rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-1">I&apos;m struggling</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">Write what you&apos;re feeling. You&apos;re not alone.</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's going on right now..."
        className="w-full bg-[var(--bg-primary)] rounded-xl p-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none h-32 mb-3"
      />
      {!aiResponse && (
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          className="w-full py-3 rounded-xl bg-[var(--accent-blue)] text-white font-medium disabled:opacity-40"
        >
          {loading ? "Getting support..." : "Get Support"}
        </button>
      )}
      {aiResponse && <AiResponseCard response={aiResponse} />}
    </div>
  );
}
