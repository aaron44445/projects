"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const tabs = [
  { href: "/study", label: "Read" },
  { href: "/journal", label: "Write" },
  { href: "/streak", label: "Walk" },
  { href: "/dashboard", label: "See" },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-white/5 pb-[env(safe-area-inset-bottom)] bg-[var(--bg)]">
      <div className="flex justify-around items-center h-12 max-w-md mx-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-xs tracking-[0.2em] uppercase transition-opacity duration-300 ${
              pathname === tab.href ? "text-[var(--accent)]" : "text-[var(--muted)]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
