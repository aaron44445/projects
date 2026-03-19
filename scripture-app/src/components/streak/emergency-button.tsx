interface EmergencyButtonProps { onPress: () => void; }

export default function EmergencyButton({ onPress }: EmergencyButtonProps) {
  return (
    <button onClick={onPress} className="w-full py-5 rounded-2xl bg-[var(--emergency)] text-white text-xl font-bold shadow-lg shadow-red-900/30 active:scale-[0.98] transition-transform mt-4">
      I Need Help Now
    </button>
  );
}
