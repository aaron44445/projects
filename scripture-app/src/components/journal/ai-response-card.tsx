interface AiResponseCardProps {
  response: string;
}

export default function AiResponseCard({ response }: AiResponseCardProps) {
  return (
    <div className="bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/20 rounded-2xl p-5 mt-4">
      <p className="text-sm leading-relaxed whitespace-pre-line">{response}</p>
    </div>
  );
}
