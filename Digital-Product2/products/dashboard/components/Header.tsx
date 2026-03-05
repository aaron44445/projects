"use client";

interface HeaderProps {
  streak: number;
  isPro: boolean;
}

export default function Header({ streak, isPro }: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Founder Dashboard
        </h1>
        {isPro && (
          <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
            PRO
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-right">
        <span className="text-3xl font-bold text-cyan-400">{streak}</span>
        <span className="text-sm text-neutral-400">
          day{streak !== 1 ? "s" : ""} streak
        </span>
      </div>
    </header>
  );
}
