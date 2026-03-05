"use client";

import { useState } from "react";
import type { Review } from "@/lib/store";

interface ReviewCardProps {
  reviews: Review[];
  onAddReview: (review: Review) => void;
}

export default function ReviewCard({ reviews, onAddReview }: ReviewCardProps) {
  const [wins, setWins] = useState("");
  const [challenge, setChallenge] = useState("");
  const [lesson, setLesson] = useState("");
  const [nextPriority, setNextPriority] = useState("");
  const [viewingPast, setViewingPast] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wins.trim() && !challenge.trim() && !lesson.trim() && !nextPriority.trim())
      return;

    onAddReview({
      date: new Date().toISOString().slice(0, 10),
      wins: wins.trim(),
      challenge: challenge.trim(),
      lesson: lesson.trim(),
      nextPriority: nextPriority.trim(),
    });

    setWins("");
    setChallenge("");
    setLesson("");
    setNextPriority("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-title mb-0">Weekly Review</h2>
        {reviews.length > 0 && (
          <button
            onClick={() => setViewingPast(!viewingPast)}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {viewingPast ? "New Review" : `Past (${reviews.length})`}
          </button>
        )}
      </div>

      {viewingPast ? (
        <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
          {reviews
            .slice()
            .reverse()
            .map((r, i) => (
              <div
                key={i}
                className="rounded-lg bg-neutral-800/50 p-3 space-y-2"
              >
                <p className="text-[10px] text-neutral-500">
                  {formatDate(r.date)}
                </p>
                {r.wins && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
                      Top Wins
                    </p>
                    <p className="text-xs text-neutral-300">{r.wins}</p>
                  </div>
                )}
                {r.challenge && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
                      Challenge
                    </p>
                    <p className="text-xs text-neutral-300">{r.challenge}</p>
                  </div>
                )}
                {r.lesson && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
                      Key Lesson
                    </p>
                    <p className="text-xs text-neutral-300">{r.lesson}</p>
                  </div>
                )}
                {r.nextPriority && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
                      Next Week Priority
                    </p>
                    <p className="text-xs text-neutral-300">{r.nextPriority}</p>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
              Top 3 Wins
            </label>
            <textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              rows={2}
              placeholder="What went well this week?"
              className="w-full resize-none bg-neutral-800/50 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
              Biggest Challenge
            </label>
            <input
              type="text"
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              placeholder="What was hardest?"
              className="w-full bg-neutral-800/50 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
              Key Lesson
            </label>
            <input
              type="text"
              value={lesson}
              onChange={(e) => setLesson(e.target.value)}
              placeholder="What did you learn?"
              className="w-full bg-neutral-800/50 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
              Next Week Priority
            </label>
            <input
              type="text"
              value={nextPriority}
              onChange={(e) => setNextPriority(e.target.value)}
              placeholder="One thing to focus on"
              className="w-full bg-neutral-800/50 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
            />
          </div>
          <button type="submit" className="btn-primary text-sm w-full">
            {saved ? "Saved!" : "Save Review"}
          </button>
        </form>
      )}
    </div>
  );
}
