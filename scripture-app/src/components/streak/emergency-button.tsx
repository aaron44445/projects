interface EmergencyButtonProps { onPress: () => void; }

export default function EmergencyButton({ onPress }: EmergencyButtonProps) {
  return (
    <button
      onClick={onPress}
      className="w-full py-5 border border-[var(--slip)] text-[var(--slip)] text-sm tracking-[0.2em] uppercase active:bg-[var(--slip)] active:text-[var(--fg)] transition-all duration-300"
    >
      I need help now
    </button>
  );
}
