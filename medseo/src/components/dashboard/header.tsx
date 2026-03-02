"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/lead-finder": "Lead Finder",
  "/dashboard/dm-generator": "DM Generator",
  "/dashboard/audit": "SEO Audit",
  "/dashboard/proposals": "Proposals",
  "/dashboard/leads": "Leads",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const title =
    Object.entries(pageTitles).find(([path]) =>
      path === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(path)
    )?.[1] ?? "Dashboard";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/dashboard/login");
  }

  return (
    <header className="sticky top-0 z-20 h-14 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <h1 className="font-heading text-lg font-semibold text-white">
          {title}
        </h1>
      </div>

      <button
        onClick={handleLogout}
        className="hidden lg:flex items-center gap-2 text-xs font-mono text-white/40 hover:text-red-400 transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        Logout
      </button>
    </header>
  );
}
