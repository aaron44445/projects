"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";

function WireframeIllustration() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const keywordsX = useTransform(scrollYProgress, [0, 1], [60, -20]);
  const keywordsY = useTransform(scrollYProgress, [0, 1], [-10, 30]);
  const backlinksX = useTransform(scrollYProgress, [0, 1], [-40, 20]);
  const backlinksY = useTransform(scrollYProgress, [0, 1], [20, -15]);
  const revenueX = useTransform(scrollYProgress, [0, 1], [30, -10]);
  const revenueY = useTransform(scrollYProgress, [0, 1], [40, 5]);

  return (
    <div ref={ref} className="relative w-full h-full min-h-[400px] lg:min-h-[500px]">
      {/* Abstract wireframe SVG */}
      <svg
        viewBox="0 0 400 500"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer face outline - dotted */}
        <ellipse
          cx="200"
          cy="220"
          rx="120"
          ry="160"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        {/* Inner structure lines */}
        <line
          x1="200"
          y1="60"
          x2="200"
          y2="380"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="6 6"
        />
        <line
          x1="80"
          y1="220"
          x2="320"
          y2="220"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="6 6"
        />
        {/* Eye outlines */}
        <ellipse
          cx="160"
          cy="190"
          rx="30"
          ry="18"
          stroke="rgba(0,255,143,0.3)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <ellipse
          cx="240"
          cy="190"
          rx="30"
          ry="18"
          stroke="rgba(0,255,143,0.3)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {/* Nose line */}
        <path
          d="M200 210 L190 260 L210 260"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        {/* Lips */}
        <path
          d="M165 290 Q200 310 235 290"
          stroke="rgba(45,212,191,0.3)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {/* Jawline construction lines */}
        <path
          d="M80 180 Q80 360 200 380 Q320 360 320 180"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          strokeDasharray="8 8"
        />
        {/* Measurement dots */}
        <circle cx="200" cy="60" r="3" fill="rgba(0,255,143,0.4)" />
        <circle cx="200" cy="380" r="3" fill="rgba(0,255,143,0.4)" />
        <circle cx="80" cy="220" r="3" fill="rgba(45,212,191,0.4)" />
        <circle cx="320" cy="220" r="3" fill="rgba(45,212,191,0.4)" />
        {/* Grid reference points */}
        {[140, 180, 220, 260].map((y) =>
          [140, 200, 260].map((x) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r="1.5"
              fill="rgba(255,255,255,0.1)"
            />
          ))
        )}
        {/* Decorative arcs */}
        <path
          d="M100 120 Q200 80 300 120"
          stroke="rgba(0,255,143,0.15)"
          strokeWidth="0.5"
          strokeDasharray="2 4"
        />
        <path
          d="M120 340 Q200 400 280 340"
          stroke="rgba(45,212,191,0.15)"
          strokeWidth="0.5"
          strokeDasharray="2 4"
        />
      </svg>

      {/* Floating labels */}
      <motion.div
        style={{ x: keywordsX, y: keywordsY }}
        className="absolute top-[15%] right-[5%]"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-lume/20 bg-[#0A0A0B]/80 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-lume animate-pulse" />
          <span className="font-mono text-xs text-lume/80">Keywords</span>
        </div>
      </motion.div>

      <motion.div
        style={{ x: backlinksX, y: backlinksY }}
        className="absolute top-[55%] left-[0%]"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-teal-clinical/20 bg-[#0A0A0B]/80 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-clinical animate-pulse" />
          <span className="font-mono text-xs text-teal-clinical/80">
            Backlinks
          </span>
        </div>
      </motion.div>

      <motion.div
        style={{ x: revenueX, y: revenueY }}
        className="absolute bottom-[15%] right-[10%]"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-[#0A0A0B]/80 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
          <span className="font-mono text-xs text-white/60">Revenue</span>
        </div>
      </motion.div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center px-6 pt-20">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left side - copy */}
        <div className="space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="font-heading text-5xl md:text-7xl lg:text-[120px] font-bold text-white tracking-tight leading-[0.9]"
          >
            Growth is
            <br />a Science.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="font-mono text-white/40 text-sm md:text-base max-w-md leading-relaxed"
          >
            Precision SEO for Aesthetic Practices.
            <br />
            We don&apos;t guess; we diagnose.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
          >
            <Link
              href="/book"
              className="group inline-flex items-center gap-3 px-6 py-3 text-sm font-mono text-lume border border-lume/30 rounded-lg transition-all hover:bg-lume/10 hover:border-lume/60 hover:shadow-[0_0_30px_rgba(0,255,143,0.15)]"
            >
              Get Diagnostic
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </motion.div>
        </div>

        {/* Right side - wireframe illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="hidden lg:block"
        >
          <WireframeIllustration />
        </motion.div>
      </div>
    </section>
  );
}
