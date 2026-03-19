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
    <div>
      {studyStreak > 0 && (
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)] mb-8">
          Day {studyStreak}
        </p>
      )}
      <h1 className="text-4xl font-light leading-tight mb-2">{bookName}</h1>
      <p className="text-lg text-[var(--muted)] font-light mb-12">Chapter {chapter}</p>
      <button
        onClick={onComplete}
        disabled={completed || loading}
        className={`w-full py-4 text-sm tracking-[0.15em] uppercase transition-all duration-300 ${
          completed
            ? "text-[var(--clean)] border-b border-[var(--clean)]/30"
            : "text-[var(--fg)] border border-[var(--fg)]/20 active:border-[var(--accent)] active:text-[var(--accent)]"
        }`}
      >
        {completed ? "Done" : loading ? "..." : "Mark Complete"}
      </button>
    </div>
  );
}
