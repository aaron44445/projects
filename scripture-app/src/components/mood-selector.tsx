"use client";

const moods = [
  { value: 1, label: "Low" },
  { value: 2, label: "Hard" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Great" },
];

interface MoodSelectorProps {
  value: number | null;
  onChange: (mood: number) => void;
}

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex justify-between">
      {moods.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`flex flex-col items-center gap-2 px-3 py-2 transition-all duration-300 ${
            value === m.value ? "text-[var(--accent)]" : "text-[var(--muted)]"
          }`}
        >
          <span className="text-2xl font-light">{m.value}</span>
          <span className="text-[10px] tracking-[0.15em] uppercase">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
