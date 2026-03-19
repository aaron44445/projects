"use client";

interface EmergencyOverlayProps {
  text: string;
  scriptureRef: string;
  onClose: () => void;
}

export default function EmergencyOverlay({ text, scriptureRef, onClose }: EmergencyOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col items-center justify-center p-8" onClick={onClose}>
      <p className="text-xl leading-relaxed text-center text-[var(--text-primary)] mb-8 max-w-md">&ldquo;{text}&rdquo;</p>
      <p className="text-[var(--accent-gold)] text-sm">{scriptureRef}</p>
      <p className="text-[var(--text-secondary)] text-xs mt-8">Tap anywhere to close</p>
    </div>
  );
}
