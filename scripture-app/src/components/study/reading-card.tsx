"use client";

interface ReadingCardProps {
  bookName: string;
  chapter: number;
  completed: boolean;
  studyStreak: number;
  onComplete: () => void;
  loading: boolean;
}

export default function ReadingCard({
  bookName,
  chapter,
  completed,
  studyStreak,
  onComplete,
  loading,
}: ReadingCardProps) {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[var(--text-secondary)]">Today&apos;s Reading</span>
        <span className="text-sm text-[var(--accent-gold)]">🔥 {studyStreak} day streak</span>
      </div>
      <h2 className="text-2xl font-bold mb-1">{bookName}</h2>
      <p className="text-[var(--text-secondary)] mb-6">Chapter {chapter}</p>
      <button
        onClick={onComplete}
        disabled={completed || loading}
        className={`w-full py-4 rounded-xl text-lg font-semibold transition-all ${
          completed
            ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]"
            : "bg-[var(--accent-gold)] text-[var(--bg-primary)] active:scale-[0.98]"
        }`}
      >
        {completed ? "✓ Completed" : loading ? "..." : "Mark Complete"}
      </button>
    </div>
  );
}
