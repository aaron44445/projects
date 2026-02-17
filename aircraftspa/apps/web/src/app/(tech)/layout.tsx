"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Camera, UserCircle } from "lucide-react";

const navItems = [
  { href: "/jobs", label: "Jobs", icon: ClipboardList },
  { href: "/photos", label: "Photos", icon: Camera },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export default function TechLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top header bar */}
      <header className="sticky top-0 z-30 bg-gray-900 px-4 py-3 text-white shadow-md">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">AircraftSpa</h1>
            <p className="text-xs text-gray-400">{today}</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">
            T
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-24">
        {children}
      </main>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b bg-blue-600" />
                )}
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className={isActive ? "font-semibold" : "font-medium"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
