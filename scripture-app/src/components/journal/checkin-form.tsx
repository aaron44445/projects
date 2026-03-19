"use client";

import { useState } from "react";
import MoodSelector from "@/components/mood-selector";
import AiResponseCard from "./ai-response-card";

interface CheckinFormProps {
  type: "checkin_morning" | "checkin_evening";
  onSaved: () => void;
}

export default function CheckinForm({ type, onSaved }: CheckinFormProps) {
  const [mood, setMood] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [cleanToday, setCleanToday] = useState<boolean | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isMorning = type === "checkin_morning";

  async function handleSubmit() {
    if (!mood) return;
    setLoading(true);

    const aiRes = await fetch("/api/ai/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content, mood, cleanToday }),
    });
    const aiData = await aiRes.json();
    setAiResponse(aiData.response);

    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        content: content || null,
        mood,
        clean_today: cleanToday,
        ai_response: aiData.response,
      }),
    });

    setLoading(false);
    onSaved();
  }

  return (
    <div>
      <p className="text-lg font-light mb-8">
        {isMorning ? "How are you feeling?" : "How did today go?"}
      </p>

      <MoodSelector value={mood} onChange={setMood} />

      {!isMorning && (
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => setCleanToday(true)}
            className={`flex-1 py-3 text-sm tracking-[0.1em] uppercase transition-all duration-300 border ${
              cleanToday === true
                ? "border-[var(--clean)] text-[var(--clean)]"
                : "border-white/10 text-[var(--muted)]"
            }`}
          >
            Clean
          </button>
          <button
            onClick={() => setCleanToday(false)}
            className={`flex-1 py-3 text-sm tracking-[0.1em] uppercase transition-all duration-300 border ${
              cleanToday === false
                ? "border-[var(--slip)] text-[var(--slip)]"
                : "border-white/10 text-[var(--muted)]"
            }`}
          >
            Slipped
          </button>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Anything on your mind..."
        className="w-full bg-transparent border-b border-white/10 focus:border-[var(--accent)] pb-3 text-[var(--fg)] resize-none h-20 mt-8 mb-6 outline-none transition-colors"
      />

      {!aiResponse && (
        <button
          onClick={handleSubmit}
          disabled={!mood || loading}
          className="text-sm tracking-[0.15em] uppercase text-[var(--accent)] disabled:opacity-30 transition-opacity"
        >
          {loading ? "..." : "Check in"}
        </button>
      )}
      {aiResponse && <AiResponseCard response={aiResponse} />}
    </div>
  );
}
