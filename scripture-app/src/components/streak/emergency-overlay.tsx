"use client";

interface EmergencyOverlayProps {
  text: string;
  scriptureRef: string;
  onClose: () => void;
}

export default function EmergencyOverlay({ text, scriptureRef, onClose }: EmergencyOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col items-center justify-center p-10 animate-[fadeIn_0.5s_ease]"
      onClick={onClose}
    >
      <p className="text-2xl font-light leading-relaxed text-center text-[var(--accent)] max-w-sm">
        &ldquo;{text}&rdquo;
      </p>
      <p className="text-xs tracking-[0.2em] uppercase text-[var(--muted)] mt-8">{scriptureRef}</p>
      <p className="text-[10px] text-[var(--muted)]/40 mt-16 tracking-[0.3em] uppercase">Tap to close</p>
    </div>
  );
}
