"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 50);
        ticking.current = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-6 py-4",
        scrolled && "bg-slate-950/80 backdrop-blur-md border-b border-white/5"
      )}
      style={{ willChange: "background-color, backdrop-filter" }}
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
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-mono font-semibold text-[#0A0A0B] bg-lume rounded-lg transition-all hover:bg-lume/90 hover:shadow-[0_0_30px_rgba(0,255,143,0.2)]"
          >
            Book Audit
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
