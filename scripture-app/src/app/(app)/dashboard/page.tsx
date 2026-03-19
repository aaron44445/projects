"use client";

import { useEffect, useState, useCallback } from "react";
import StatsOverview from "@/components/dashboard/stats-overview";
import SettingsPanel from "@/components/dashboard/settings-panel";

export default function DashboardPage() {
  const [stats, setStats] = useState({ studyStreak: 0, longestStudyStreak: 0, cleanDays: 0, longestCleanStreak: 0, cyclesCompleted: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const [configRes, streakRes] = await Promise.all([fetch("/api/settings"), fetch("/api/streak")]);
    const configData = await configRes.json();
    const streakData = await streakRes.json();
    setStats({
      studyStreak: configData.config?.study_streak ?? 0,
      longestStudyStreak: configData.config?.longest_study_streak ?? 0,
      cleanDays: streakData.currentDays,
      longestCleanStreak: streakData.longestStreak,
      cyclesCompleted: configData.config?.cycles_completed ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className="text-[var(--text-secondary)] text-center mt-20">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <button onClick={() => setShowSettings(!showSettings)} className="text-2xl">⚙️</button>
      </div>
      {showSettings ? <SettingsPanel onClose={() => setShowSettings(false)} /> : <StatsOverview {...stats} />}
    </div>
  );
}
