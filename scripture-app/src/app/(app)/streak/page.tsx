"use client";

import { useEffect, useState, useCallback } from "react";
import StreakCounter from "@/components/streak/streak-counter";
import EmergencyButton from "@/components/streak/emergency-button";
import EmergencyOverlay from "@/components/streak/emergency-overlay";
import CalendarHeatmap from "@/components/streak/calendar-heatmap";

interface EmergencyScripture { ref: string; text: string; theme: string; }

export default function StreakPage() {
  const [currentDays, setCurrentDays] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [checkins, setCheckins] = useState([]);
  const [emergency, setEmergency] = useState<EmergencyScripture | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    const res = await fetch("/api/streak");
    const data = await res.json();
    setCurrentDays(data.currentDays);
    setLongestStreak(data.longestStreak);
    setCheckins(data.checkins);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStreak(); }, [fetchStreak]);

  async function handleReset() {
    await fetch("/api/streak", { method: "POST" });
    fetchStreak();
  }

  async function handleEmergency() {
    const res = await fetch("/api/ai/emergency");
    const data = await res.json();
    setEmergency(data.scripture);
  }

  if (loading) return <div className="min-h-[60vh]" />;

  return (
    <div>
      <StreakCounter currentDays={currentDays} longestStreak={longestStreak} onReset={handleReset} />
      <div className="mt-12">
        <CalendarHeatmap checkins={checkins} />
      </div>
      <div className="mt-12">
        <EmergencyButton onPress={handleEmergency} />
      </div>
      {emergency && (
        <EmergencyOverlay text={emergency.text} scriptureRef={emergency.ref} onClose={() => setEmergency(null)} />
      )}
    </div>
  );
}
