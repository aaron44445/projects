"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const tabs = [
  { href: "/study", label: "Study", icon: "📖" },
  { href: "/journal", label: "Journal", icon: "✍️" },
  { href: "/streak", label: "Streak", icon: "🔥" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                active ? "text-[var(--accent-gold)]" : "text-[var(--text-secondary)]"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
