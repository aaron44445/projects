"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BorderBeamCard } from "@/components/border-beam";

interface CaseStudy {
  number: string;
  name: string;
  location: string;
  metrics: { label: string; value: string }[];
  chartType: "growth" | "spike" | "steady";
}

const caseStudies: CaseStudy[] = [
  {
    number: "01",
    name: "Glow Aesthetics",
    location: "Dallas, TX",
    metrics: [
      { label: "Organic Traffic", value: "+340%" },
      { label: "Top Ranking", value: "#1 for 'botox near me dallas'" },
      { label: "Monthly Revenue", value: "+$47K" },
    ],
    chartType: "growth",
  },
  {
    number: "02",
    name: "Pure Skin MedSpa",
    location: "Miami, FL",
    metrics: [
      { label: "Organic Traffic", value: "+280%" },
      { label: "Top Ranking", value: "#1 for 'laser hair removal miami'" },
      { label: "Monthly Revenue", value: "+$38K" },
    ],
    chartType: "spike",
  },
  {
    number: "03",
    name: "Rejuvenate Clinic",
    location: "Austin, TX",
    metrics: [
      { label: "Organic Traffic", value: "+420%" },
      { label: "Top Ranking", value: "#1 for 'med spa austin'" },
      { label: "Monthly Revenue", value: "+$62K" },
    ],
    chartType: "steady",
  },
];

function TrafficChart({ type }: { type: CaseStudy["chartType"] }) {
  const paths: Record<string, string> = {
    growth: "M 0 70 L 40 68 L 80 65 L 120 60 L 160 45 L 200 25 L 240 10",
    spike: "M 0 70 L 40 68 L 80 62 L 120 50 L 160 30 L 200 15 L 240 8",
    steady: "M 0 70 L 40 65 L 80 55 L 120 40 L 160 25 L 200 12 L 240 5",
  };

  const beforePath = "M 0 70 L 40 72 L 80 68 L 120 71 L 160 69 L 200 70";

  return (
    <svg viewBox="0 0 240 80" className="w-full h-20" fill="none">
      {/* Before line - flat */}
      <path
        d={beforePath}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      {/* After line - growth */}
      <path
        d={paths[type]}
        stroke="#00FF8F"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Glow under curve */}
      <path
        d={`${paths[type]} L 240 80 L 0 80 Z`}
        fill="url(#chartGradient)"
        opacity="0.15"
      />
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00FF8F" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {/* Labels */}
      <text x="0" y="78" className="fill-white/30 text-[8px]" fontFamily="monospace">Before</text>
      <text x="200" y="78" className="fill-lume text-[8px]" fontFamily="monospace">After</text>
    </svg>
  );
}

function CaseStudyCard({ study, index }: { study: CaseStudy; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="shrink-0 w-[350px] md:w-[420px]"
    >
      <BorderBeamCard className="h-full">
        <div className="p-6 md:p-8 space-y-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(0,255,143,0.08)]">
          {/* Number */}
          <span className="font-mono text-5xl font-bold text-white/10">
            {study.number}
          </span>

          {/* Name */}
          <div>
            <h3 className="font-heading text-xl font-bold text-white">
              {study.name}
            </h3>
            <p className="font-mono text-xs text-white/40 mt-1">
              {study.location}
            </p>
          </div>

          {/* Chart */}
          <TrafficChart type={study.chartType} />

          {/* Metrics */}
          <div className="space-y-3">
            {study.metrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="font-mono text-xs text-white/40">
                  {metric.label}
                </span>
                <span className="font-mono text-sm text-lume font-medium">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </BorderBeamCard>
    </motion.div>
  );
}

export function CaseStudies() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-55%"]);

  return (
    <section id="work" ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        {/* Section heading */}
        <div className="px-6 mb-12">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <span className="font-mono text-xs text-lume/60 uppercase tracking-widest">
                Case Studies
              </span>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mt-2">
                Our Work
              </h2>
            </motion.div>
          </div>
        </div>

        {/* Horizontal scrolling cards */}
        <motion.div
          style={{ x }}
          className="flex gap-8 px-6 md:px-[calc(50vw-600px)]"
        >
          {caseStudies.map((study, i) => (
            <CaseStudyCard key={study.number} study={study} index={i} />
          ))}
          {/* Trailing spacer */}
          <div className="shrink-0 w-[100px]" />
        </motion.div>
      </div>
    </section>
  );
}
