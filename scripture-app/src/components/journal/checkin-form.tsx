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
    <div className="bg-[var(--bg-card)] rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-1">
        {isMorning ? "Morning Check-in" : "Evening Check-in"}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        {isMorning ? "How are you feeling today?" : "How did today go?"}
      </p>

      <MoodSelector value={mood} onChange={setMood} />

      {!isMorning && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setCleanToday(true)}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              cleanToday === true
                ? "bg-[var(--accent-green)]/20 border border-[var(--accent-green)] text-[var(--accent-green)]"
                : "bg-[var(--bg-primary)] text-[var(--text-secondary)]"
            }`}
          >
            Stayed clean
          </button>
          <button
            onClick={() => setCleanToday(false)}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              cleanToday === false
                ? "bg-[var(--accent-red)]/20 border border-[var(--accent-red)] text-[var(--accent-red)]"
                : "bg-[var(--bg-primary)] text-[var(--text-secondary)]"
            }`}
          >
            I slipped
          </button>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Anything on your mind... (optional)"
        className="w-full bg-[var(--bg-primary)] rounded-xl p-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none h-20 mt-4 mb-3"
      />

      {!aiResponse && (
        <button
          onClick={handleSubmit}
          disabled={!mood || loading}
          className="w-full py-3 rounded-xl bg-[var(--accent-gold)] text-[var(--bg-primary)] font-semibold disabled:opacity-40"
        >
          {loading ? "..." : "Check In"}
        </button>
      )}
      {aiResponse && <AiResponseCard response={aiResponse} />}
    </div>
  );
}
