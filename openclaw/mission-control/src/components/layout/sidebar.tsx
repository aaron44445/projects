"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  Bot,
  FileText,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/cron", label: "Cron Control", icon: Clock },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/board", label: "Board Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-56 border-r border-[#2a2a3e] bg-[#0d0d15] flex flex-col">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-[#2a2a3e]">
        <div className="h-8 w-8 rounded bg-[#00ff41]/10 border border-[#00ff41]/20 flex items-center justify-center">
          <span className="font-[family-name:var(--font-pixel)] text-[#00ff41] text-[8px] font-bold">MC</span>
        </div>
        <span className="font-[family-name:var(--font-pixel)] text-[9px] text-[#e0e0e0]">MISSION CTRL</span>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 text-sm transition-all border-l-2 ${
                active
                  ? "border-[#00ff41] bg-[#00ff41]/5 text-[#00ff41] shadow-[inset_0_0_20px_rgba(0,255,65,0.05)]"
                  : "border-transparent text-[#666680] hover:text-[#e0e0e0] hover:bg-[#1a1a2e]/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-[#2a2a3e]">
        <p className="font-[family-name:var(--font-pixel)] text-[6px] text-[#666680]/50 tracking-wider">
          MISSION CONTROL v2.0
        </p>
      </div>
    </aside>
  );
}
