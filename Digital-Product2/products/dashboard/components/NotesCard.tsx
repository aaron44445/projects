"use client";

import { useRef, useCallback } from "react";

interface NotesCardProps {
  notes: string;
  onChange: (text: string) => void;
}

export default function NotesCard({ notes, onChange }: NotesCardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      // Debounce: update parent (which saves to localStorage) after 300ms
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(text);
      }, 300);
      // Also update immediately for UI responsiveness — parent should handle save
      onChange(text);
    },
    [onChange]
  );

  return (
    <div className="card">
      <h2 className="card-title">Quick Notes</h2>
      <textarea
        defaultValue={notes}
        onChange={handleChange}
        placeholder="Jot down thoughts, ideas, reminders..."
        rows={5}
        className="w-full resize-none bg-transparent text-sm text-neutral-200 placeholder:text-neutral-600 outline-none"
      />
    </div>
  );
}
