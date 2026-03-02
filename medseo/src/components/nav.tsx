"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-6 py-4",
        scrolled && "bg-slate-950/80 backdrop-blur-md border-b border-white/5"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-heading text-xl font-bold text-white tracking-tight">
          Inject<span className="text-lume">SEO</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#work" className="text-sm text-white/60 hover:text-white transition-colors font-mono">
            Work
          </Link>
          <Link href="/#method" className="text-sm text-white/60 hover:text-white transition-colors font-mono">
            Method
          </Link>
          <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors font-mono">
            Pricing
          </Link>
          <Link href="/book" className="relative group">
            <span className="relative z-10 inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-lume border border-lume/30 rounded-lg transition-all group-hover:bg-lume/10 group-hover:border-lume/60">
              Book Audit
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-white/60 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
