"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";

/* ─── Terminal Typing Effect ─── */

const terminalLines = [
  { text: "$ scanning site health...", delay: 0, color: "text-white/60" },
  { text: "\u2713 Meta tags: Missing description", delay: 800, color: "text-yellow-400/80" },
  { text: "\u2713 Page speed: 2.8s (poor)", delay: 1400, color: "text-red-400/80" },
  { text: "\u2713 Mobile score: 45/100", delay: 2000, color: "text-yellow-400/80" },
  { text: "\u2713 Blog: Not found", delay: 2600, color: "text-red-400/80" },
  { text: "\u2713 Local SEO: 3 issues found", delay: 3200, color: "text-yellow-400/80" },
  { text: "", delay: 3800, color: "" },
  { text: "Audit complete. 5 critical issues.", delay: 4000, color: "text-lume" },
];

function TerminalWindow() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    let cancelled = false;

    async function runTyping() {
      for (let i = 0; i < terminalLines.length; i++) {
        if (cancelled) return;
        const line = terminalLines[i];

        // Wait for the delay between lines
        if (i > 0) {
          await new Promise((r) => setTimeout(r, line.delay - terminalLines[i - 1].delay));
        }
        if (cancelled) return;

        // Type each character
        setIsTyping(true);
        const text = line.text;
        for (let j = 0; j <= text.length; j++) {
          if (cancelled) return;
          setCurrentText(text.slice(0, j));
          await new Promise((r) => setTimeout(r, 20));
        }
        setIsTyping(false);
        setVisibleLines(i + 1);
        setCurrentText("");
      }
    }

    runTyping();
    return () => { cancelled = true; };
  }, [isInView]);

  return (
    <div ref={ref} className="rounded-lg border border-white/10 bg-[#0A0A0B] overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-red-500/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <div className="w-3 h-3 rounded-full bg-green-500/60" />
        <span className="ml-3 font-mono text-xs text-white/30">
          seo-audit.sh
        </span>
      </div>
      {/* Terminal content */}
      <div className="p-4 space-y-1.5 min-h-[240px]">
        {terminalLines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={`font-mono text-sm ${line.color}`}>
            {line.text}
          </div>
        ))}
        {/* Currently typing line */}
        {isTyping && visibleLines < terminalLines.length && (
          <div
            className={`font-mono text-sm ${terminalLines[visibleLines]?.color || "text-white/60"}`}
          >
            {currentText}
            <span className="inline-block w-2 h-4 bg-lume/60 animate-pulse ml-0.5 align-text-bottom" />
          </div>
        )}
        {/* Cursor when idle and not done */}
        {!isTyping && visibleLines < terminalLines.length && isInView && (
          <div className="font-mono text-sm text-white/60">
            <span className="inline-block w-2 h-4 bg-lume/60 animate-pulse align-text-bottom" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Content Injection Visual ─── */

const contentPieces = [
  { label: "Blog Post", title: "Top 5 Botox Myths Debunked", icon: "doc" },
  { label: "Service Page", title: "Optimized Landing Page", icon: "page" },
  { label: "GBP Profile", title: "Google Business Profile", icon: "map" },
];

function ContentInjection() {
  return (
    <div className="space-y-4">
      {contentPieces.map((piece, i) => (
        <motion.div
          key={piece.title}
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: i * 0.2, ease: "easeOut" }}
          viewport={{ once: true, margin: "-50px" }}
          className="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-[#0A0A0B]/80"
        >
          <div className="shrink-0 w-10 h-10 rounded-md bg-lume/10 border border-lume/20 flex items-center justify-center">
            {piece.icon === "doc" && (
              <svg className="w-5 h-5 text-lume" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            )}
            {piece.icon === "page" && (
              <svg className="w-5 h-5 text-lume" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            )}
            {piece.icon === "map" && (
              <svg className="w-5 h-5 text-lume" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            )}
          </div>
          <div>
            <span className="font-mono text-[10px] text-lume/60 uppercase tracking-wider">
              {piece.label}
            </span>
            <p className="font-heading text-sm text-white font-medium">
              {piece.title}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Revenue Counter ─── */

function RevenueCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  const animateCount = useCallback(() => {
    const target = 47500;
    const duration = 2000;
    const startTime = Date.now();

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (isInView) {
      animateCount();
    }
  }, [isInView, animateCount]);

  return (
    <div ref={ref} className="space-y-6">
      <div className="text-center">
        <span className="font-mono text-6xl md:text-7xl font-bold text-lume">
          ${count.toLocaleString()}
        </span>
        <p className="font-mono text-sm text-white/40 mt-2">
          monthly revenue increase
        </p>
      </div>
      <div className="flex justify-center gap-8">
        <div className="text-center">
          <span className="font-mono text-2xl font-bold text-white">
            +340%
          </span>
          <p className="font-mono text-xs text-white/40 mt-1">
            organic traffic
          </p>
        </div>
        <div className="w-px bg-white/10" />
        <div className="text-center">
          <span className="font-mono text-2xl font-bold text-teal-clinical">
            #1
          </span>
          <p className="font-mono text-xs text-white/40 mt-1">
            Google ranking
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Step Component ─── */

interface StepProps {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
  isLast?: boolean;
}

function Step({ number, title, description, children, isLast }: StepProps) {
  return (
    <div className="relative flex gap-8">
      {/* Dotted line connector */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-10 h-10 rounded-full border border-lume/30 bg-[#0A0A0B] flex items-center justify-center z-10">
          <span className="font-mono text-sm text-lume font-bold">
            {number}
          </span>
        </div>
        {!isLast && (
          <div className="w-px flex-1 border-l border-dashed border-white/15 my-2" />
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, margin: "-80px" }}
        className="pb-16 flex-1"
      >
        <h3 className="font-heading text-2xl font-bold text-white mb-2">
          {title}
        </h3>
        <p className="font-mono text-sm text-white/40 mb-6 max-w-md">
          {description}
        </p>
        {children}
      </motion.div>
    </div>
  );
}

/* ─── Main Process Section ─── */

export function Process() {
  return (
    <section id="method" className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <span className="font-mono text-xs text-lume/60 uppercase tracking-widest">
            Our Process
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mt-2">
            The Method
          </h2>
        </motion.div>

        {/* Steps */}
        <div>
          <Step
            number="01"
            title="The Audit"
            description="We scan every corner of your online presence to find what's broken, what's missing, and what's holding you back."
          >
            <TerminalWindow />
          </Step>

          <Step
            number="02"
            title="The Injection"
            description="Strategic content, optimized pages, and local SEO assets deployed with surgical precision."
          >
            <ContentInjection />
          </Step>

          <Step
            number="03"
            title="The Result"
            description="Watch your rankings climb, traffic surge, and revenue grow. Compounding returns, month after month."
            isLast
          >
            <RevenueCounter />
          </Step>
        </div>
      </div>
    </section>
  );
}
