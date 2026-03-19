interface AiResponseCardProps {
  response: string;
}

export default function AiResponseCard({ response }: AiResponseCardProps) {
  return (
    <div className="mt-8 pt-6 border-t border-[var(--accent)]/20">
      <p className="text-base leading-relaxed italic text-[var(--fg)]/80 whitespace-pre-line">{response}</p>
    </div>
  );
}
