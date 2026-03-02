"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

/* ─── Animated Ranking Climb ─── */
function RankingCounter() {
  const [rank, setRank] = useState(47);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const animate = useCallback(() => {
    const steps = [47, 38, 29, 21, 14, 9, 5, 3, 2, 1];
    let i = 0;
    function next() {
      if (i < steps.length) {
        setRank(steps[i]);
        i++;
        setTimeout(next, i < 3 ? 300 : i < 6 ? 400 : 600);
      }
    }
    next();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          setTimeout(animate, 800);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started, animate]);

  return (
    <div ref={ref} className="text-center">
      <span
        className={`font-mono text-[80px] md:text-[100px] font-bold leading-none tabular-nums ${
          rank === 1 ? "text-lume" : "text-white/50"
        } transition-colors duration-300`}
      >
        #{rank}
      </span>
      <p className="font-mono text-xs text-white/30 mt-1">Google Ranking</p>
    </div>
  );
}

/* ─── Live Dashboard Mockup ─── */
function SEODashboard() {
  return (
    <div className="relative hero-dashboard">
      {/* Main dashboard card */}
      <div className="relative rounded-xl border border-white/10 bg-[#0d0d0e] overflow-hidden shadow-2xl shadow-lume/5">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0A0A0B]">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="flex-1 mx-3 h-6 rounded-md bg-white/5 flex items-center px-3">
            <span className="font-mono text-[10px] text-white/25">injectseo.com/audit</span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-5 space-y-4">
          {/* Top metrics row */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Organic Traffic" value="+340%" delay={0.3} />
            <MetricCard label="Keywords Top 10" value="47" delay={0.5} />
            <MetricCard label="Revenue" value="+$47K" delay={0.7} />
          </div>

          {/* Ranking climb */}
          <div className="rounded-lg border border-white/5 bg-[#0A0A0B] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">Position Tracking</span>
              <span className="font-mono text-[10px] text-lume/60">Live</span>
            </div>
            <RankingCounter />
          </div>

          {/* Mini traffic chart */}
          <div className="rounded-lg border border-white/5 bg-[#0A0A0B] p-4">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">6-Month Traffic</span>
            <svg viewBox="0 0 280 60" className="w-full h-14 mt-2" fill="none">
              {/* Grid dots */}
              {[0, 56, 112, 168, 224, 280].map((x) =>
                [0, 20, 40, 60].map((dotY) => (
                  <circle key={`${x}-${dotY}`} cx={x} cy={dotY} r="0.8" fill="rgba(255,255,255,0.06)" />
                ))
              )}
              {/* Flat "before" line */}
              <path
                d="M 0 50 L 46 48 L 92 51 L 120 49"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* Growth "after" line */}
              <path
                d="M 120 49 L 150 42 L 180 30 L 210 18 L 240 10 L 280 4"
                stroke="#00FF8F"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Glow fill */}
              <path
                d="M 120 49 L 150 42 L 180 30 L 210 18 L 240 10 L 280 4 L 280 60 L 120 60 Z"
                fill="url(#heroGrad)"
                opacity="0.12"
              />
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00FF8F" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              {/* Start label */}
              <text x="10" y="58" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="monospace">Before</text>
              {/* "InjectSEO starts" marker */}
              <line x1="120" y1="0" x2="120" y2="60" stroke="rgba(0,255,143,0.2)" strokeWidth="1" strokeDasharray="2 2" />
              <text x="122" y="8" fill="rgba(0,255,143,0.4)" fontSize="5" fontFamily="monospace">Start</text>
              {/* End dot */}
              <circle cx="280" cy="4" r="3" fill="#00FF8F" opacity="0.6" />
              <circle cx="280" cy="4" r="6" fill="#00FF8F" opacity="0.15" />
            </svg>
          </div>

          {/* Search results preview */}
          <div className="rounded-lg border border-lume/10 bg-lume/[0.03] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-lume/20 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-lume" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-mono text-[10px] text-lume/70">#1 on Google for &quot;botox near me dallas&quot;</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-lume/20 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-lume" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-mono text-[10px] text-lume/70">#1 on Google for &quot;med spa dallas&quot;</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating accent dots - dotted aesthetic */}
      <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full border border-lume/20 bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-lume animate-pulse" />
      </div>
      <div className="absolute -bottom-2 -left-2 w-5 h-5 rounded-full border border-teal-clinical/20 bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-teal-clinical animate-pulse" />
      </div>
    </div>
  );
}

/* ─── Metric Card ─── */
function MetricCard({
  label,
  value,
  delay,
}: {
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <div
      className="rounded-lg border border-white/5 bg-[#0A0A0B] p-3 animate-fade-slide-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="font-mono text-[9px] text-white/30 uppercase tracking-wider block">
        {label}
      </span>
      <span className="font-mono text-lg font-bold text-lume mt-0.5 block">
        {value}
      </span>
    </div>
  );
}

/* ─── Social Proof Bar ─── */
function SocialProof() {
  return (
    <div
      className="flex items-center gap-6 text-white/25 font-mono text-xs animate-fade-in"
      style={{ animationDelay: "0.8s" }}
    >
      <span>12+ Med Spas Served</span>
      <span className="w-1 h-1 rounded-full bg-white/15" />
      <span>Avg. +320% Traffic Growth</span>
    </div>
  );
}

/* ─── Main Hero ─── */
export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center px-6 pt-20 pb-8">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* Left side - copy */}
        <div className="space-y-6">
          <h1
            className="font-heading text-5xl md:text-7xl lg:text-[120px] font-bold text-white tracking-tight leading-[0.9] animate-fade-slide-up"
          >
            Growth is
            <br />a Science.
          </h1>

          <p
            className="font-mono text-white/40 text-sm md:text-base max-w-md leading-relaxed animate-fade-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            Precision SEO for Aesthetic Practices.
            <br />
            We don&apos;t guess; we diagnose.
          </p>

          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row gap-3 animate-fade-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Link
              href="/book"
              className="group inline-flex items-center justify-center gap-3 px-7 py-3.5 text-sm font-mono font-semibold text-[#0A0A0B] bg-lume rounded-lg transition-all hover:bg-lume/90 hover:shadow-[0_0_40px_rgba(0,255,143,0.25)]"
            >
              Book Free Audit
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
            <Link
              href="/#method"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-mono text-white/50 border border-white/10 rounded-lg transition-all hover:text-white/80 hover:border-white/20"
            >
              See Our Method
            </Link>
          </div>

          {/* Social proof */}
          <SocialProof />
        </div>

        {/* Right side - SEO Dashboard mockup */}
        <div
          className="hidden lg:block animate-fade-scale-in"
          style={{ animationDelay: "0.3s" }}
        >
          <SEODashboard />
        </div>
      </div>
    </section>
  );
}
