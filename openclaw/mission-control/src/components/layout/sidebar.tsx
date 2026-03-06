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
    <aside className="fixed left-0 top-0 z-30 h-screen w-56 border-r border-border/50 bg-card/80 backdrop-blur-sm flex flex-col">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border/50">
        <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
          <span className="font-mono text-primary text-sm font-bold">MC</span>
        </div>
        <span className="font-semibold text-sm">Mission Control</span>
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
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-border/50">
        <p className="text-[10px] font-mono text-muted-foreground/50">
          MISSION CONTROL v1.0
        </p>
      </div>
    </aside>
  );
}
