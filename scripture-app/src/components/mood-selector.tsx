"use client";

const moods = [
  { value: 1, emoji: "😞", label: "Terrible" },
  { value: 2, emoji: "😔", label: "Rough" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
];

interface MoodSelectorProps {
  value: number | null;
  onChange: (mood: number) => void;
}

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex justify-between gap-2">
      {moods.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
            value === m.value
              ? "bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]"
              : "bg-[var(--bg-primary)]"
          }`}
        >
          <span className="text-2xl">{m.emoji}</span>
          <span className="text-xs text-[var(--text-secondary)]">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
