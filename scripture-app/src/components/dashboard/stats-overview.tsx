interface StatsOverviewProps {
  studyStreak: number;
  longestStudyStreak: number;
  cleanDays: number;
  longestCleanStreak: number;
  cyclesCompleted: number;
}

export default function StatsOverview({ studyStreak, longestStudyStreak, cleanDays, longestCleanStreak, cyclesCompleted }: StatsOverviewProps) {
  return (
    <div className="flex flex-col">
      <div className="py-6">
        <p className="text-4xl font-light">{studyStreak}</p>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mt-1">Study streak</p>
        {longestStudyStreak > studyStreak && (
          <p className="text-xs text-[var(--muted)]/50 mt-1">best: {longestStudyStreak}</p>
        )}
      </div>
      <div className="border-t border-white/5 py-6">
        <p className="text-4xl font-light text-[var(--clean)]">{cleanDays}</p>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mt-1">Clean days</p>
        {longestCleanStreak > cleanDays && (
          <p className="text-xs text-[var(--muted)]/50 mt-1">best: {longestCleanStreak}</p>
        )}
      </div>
      {cyclesCompleted > 0 && (
        <div className="border-t border-white/5 py-6">
          <p className="text-4xl font-light text-[var(--accent)]">{cyclesCompleted}</p>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mt-1">
            {cyclesCompleted === 1 ? "Cycle complete" : "Cycles complete"}
          </p>
        </div>
      )}
    </div>
  );
}
