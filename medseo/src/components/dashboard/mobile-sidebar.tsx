"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  FileSearch,
  FileText,
  Users,
  LogOut,
  Menu,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Lead Finder", href: "/dashboard/lead-finder", icon: Search },
  { label: "DM Generator", href: "/dashboard/dm-generator", icon: MessageSquare },
  { label: "SEO Audit", href: "/dashboard/audit", icon: FileSearch },
  { label: "Proposals", href: "/dashboard/proposals", icon: FileText },
  { label: "Leads", href: "/dashboard/leads", icon: Users },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden p-2 text-white/60 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 bg-[#0A0A0B] border-white/5 p-0"
      >
        <SheetHeader className="px-6 py-6 border-b border-white/5">
          <SheetTitle className="font-heading text-xl font-bold text-white tracking-tight text-left">
            Inject<span className="text-lume">SEO</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-lume/10 text-white border border-lume/20"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-lume" : "text-white/50"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
