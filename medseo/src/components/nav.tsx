"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
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

          {/* Desktop Nav Links */}
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

          {/* Mobile menu button - 44px min touch target */}
          <button
            className="md:hidden flex items-center justify-center w-11 h-11 -mr-2 text-white/60 hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9h16.5m-16.5 6.75h16.5" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-all duration-300",
          menuOpen ? "visible" : "invisible pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={closeMenu}
        />

        {/* Drawer */}
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-[280px] bg-[#0A0A0B] border-l border-white/10 transition-transform duration-300 ease-out flex flex-col",
            menuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Close button */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="font-heading text-lg font-bold text-white tracking-tight">
              Inject<span className="text-lume">SEO</span>
            </span>
            <button
              className="flex items-center justify-center w-11 h-11 -mr-2 text-white/60 hover:text-white transition-colors"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 mx-6" />

          {/* Nav links */}
          <div className="flex flex-col px-6 py-6 gap-1">
            <Link
              href="/#work"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-base text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-mono"
            >
              Work
            </Link>
            <Link
              href="/#method"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-base text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-mono"
            >
              Method
            </Link>
            <Link
              href="/pricing"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-3 text-base text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-mono"
            >
              Pricing
            </Link>
          </div>

          {/* CTA at bottom of drawer */}
          <div className="mt-auto px-6 pb-8">
            <Link
              href="/book"
              onClick={closeMenu}
              className="flex items-center justify-center gap-2 w-full px-5 py-3.5 text-sm font-mono font-semibold text-[#0A0A0B] bg-lume rounded-lg transition-all active:scale-[0.98]"
            >
              Book Free Audit
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
