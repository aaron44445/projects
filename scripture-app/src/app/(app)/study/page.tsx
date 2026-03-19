"use client";

import { useEffect, useState, useCallback } from "react";
import ReadingCard from "@/components/study/reading-card";
import ReflectionPrompt from "@/components/study/reflection-prompt";

export default function StudyPage() {
  const [reading, setReading] = useState<{ book: string; bookName: string; chapter: number } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [studyStreak, setStudyStreak] = useState(0);
  const [reflection, setReflection] = useState<string | null>(null);
  const [loadingRead, setLoadingRead] = useState(true);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [loadingReflect, setLoadingReflect] = useState(false);
  const [adjustmentNote, setAdjustmentNote] = useState<string | null>(null);
  const [isAiAdjusted, setIsAiAdjusted] = useState(false);

  const fetchReading = useCallback(async () => {
    const lastCheck = localStorage.getItem("last_adjust_check");
    const today = new Date().toISOString().split("T")[0];
    if (lastCheck !== today) {
      localStorage.setItem("last_adjust_check", today);
      fetch("/api/ai/adjust-plan", { method: "POST" }).catch(() => {});
    }

    const res = await fetch("/api/reading");
    const data = await res.json();
    setReading(data.reading);
    setCompleted(!!data.todayLog?.completed);
    setStudyStreak(data.studyStreak);
    setAdjustmentNote(data.adjustmentNote ?? null);
    setIsAiAdjusted(data.isAiAdjusted ?? false);
    setLoadingRead(false);
  }, []);

  useEffect(() => { fetchReading(); }, [fetchReading]);

  async function handleComplete() {
    if (!reading) return;
    setLoadingComplete(true);
    const res = await fetch("/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book: reading.book, chapter: reading.chapter, isAiAdjusted }),
    });
    const data = await res.json();
    setCompleted(true);
    setStudyStreak(data.studyStreak);
    setLoadingComplete(false);

    setLoadingReflect(true);
    const refRes = await fetch("/api/ai/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book: reading.bookName, chapter: reading.chapter }),
    });
    const refData = await refRes.json();
    setReflection(refData.question);
    setLoadingReflect(false);
  }

  async function handleReflection(response: string) {
    if (!reading) return;
    if (response.trim()) {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reflection",
          content: response,
          ai_prompt: reflection,
        }),
      });
    }
    setReflection(null);
  }

  if (loadingRead) return <div className="min-h-[60vh]" />;

  return (
    <div>
      {adjustmentNote && (
        <p className="text-sm text-[var(--accent)] mb-8 leading-relaxed italic">
          {adjustmentNote}
        </p>
      )}
      {reading && (
        <ReadingCard
          bookName={reading.bookName}
          chapter={reading.chapter}
          completed={completed}
          studyStreak={studyStreak}
          onComplete={handleComplete}
          loading={loadingComplete}
        />
      )}
      {completed && reflection && (
        <ReflectionPrompt
          question={reflection}
          onSubmit={handleReflection}
          loading={loadingReflect}
        />
      )}
    </div>
  );
}
