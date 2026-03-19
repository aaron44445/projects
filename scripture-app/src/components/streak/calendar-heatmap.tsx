"use client";

interface CheckinDay { created_at: string; clean_today: boolean | null; }

interface CalendarHeatmapProps { checkins: CheckinDay[]; }

export default function CalendarHeatmap({ checkins }: CalendarHeatmapProps) {
  const today = new Date();
  const days: { date: string; status: "clean" | "slip" | "neutral" }[] = [];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const checkin = checkins.find((c) => c.created_at.startsWith(dateStr));
    let status: "clean" | "slip" | "neutral" = "neutral";
    if (checkin) { status = checkin.clean_today ? "clean" : "slip"; }
    days.push({ date: dateStr, status });
  }

  const colorMap = { clean: "bg-[var(--clean)]", slip: "bg-[var(--slip)]", neutral: "bg-white/5" };

  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];
  const firstDayOfWeek = new Date(days[0].date).getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: "", status: "neutral" as const });
  }
  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div>
      <p className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mb-4">90 Days</p>
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-2.5 h-2.5 rounded-[1px] ${day.date ? colorMap[day.status] : "bg-transparent"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
