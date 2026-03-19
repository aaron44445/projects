interface StatsOverviewProps {
  studyStreak: number;
  longestStudyStreak: number;
  cleanDays: number;
  longestCleanStreak: number;
  cyclesCompleted: number;
}

export default function StatsOverview({ studyStreak, longestStudyStreak, cleanDays, longestCleanStreak, cyclesCompleted }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-[var(--bg-card)] rounded-2xl p-4">
        <p className="text-sm text-[var(--text-secondary)]">Study Streak</p>
        <p className="text-3xl font-bold text-[var(--accent-gold)]">{studyStreak}</p>
        <p className="text-xs text-[var(--text-secondary)]">Best: {longestStudyStreak}</p>
      </div>
      <div className="bg-[var(--bg-card)] rounded-2xl p-4">
        <p className="text-sm text-[var(--text-secondary)]">Clean Days</p>
        <p className="text-3xl font-bold text-[var(--accent-green)]">{cleanDays}</p>
        <p className="text-xs text-[var(--text-secondary)]">Best: {longestCleanStreak}</p>
      </div>
      {cyclesCompleted > 0 && (
        <div className="col-span-2 bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/30 rounded-2xl p-4 text-center">
          <p className="text-[var(--accent-gold)] font-semibold">Completed Full Cycle {cyclesCompleted}x</p>
        </div>
      )}
    </div>
  );
}
