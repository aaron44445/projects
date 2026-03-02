"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BorderBeamCard } from "@/components/border-beam";

const tiers = [
  {
    name: "Foundation",
    tag: "Single Location",
    description: "Get found locally and start converting organic traffic into booked appointments.",
    features: [
      "Full technical SEO audit",
      "Google Business Profile optimization",
      "Local keyword strategy",
      "On-page optimization",
      "Monthly content (2 blog posts)",
      "Monthly performance report",
    ],
    bestFor: "New or single-location med spas ready to build organic presence.",
  },
  {
    name: "Growth",
    tag: "Most Popular",
    description: "Dominate your local market with aggressive content and full-spectrum SEO.",
    features: [
      "Everything in Foundation",
      "Advanced content strategy (4+ posts/mo)",
      "Competitor analysis & tracking",
      "Reputation management",
      "Service page optimization",
      "Bi-weekly strategy calls",
      "Google Ads consultation",
    ],
    bestFor: "Established med spas looking to outrank competitors and scale revenue.",
    highlighted: true,
  },
  {
    name: "Enterprise",
    tag: "Multi-Location",
    description: "Full-scale growth engine for multi-location practices with aggressive targets.",
    features: [
      "Everything in Growth",
      "Multi-location SEO management",
      "Paid ads management bolt-on",
      "Landing page creation",
      "Advanced analytics dashboard",
      "Dedicated account manager",
      "Weekly strategy calls",
    ],
    bestFor: "Multi-location practices or med spas targeting rapid, aggressive growth.",
  },
];

function TierCard({
  tier,
  index,
}: {
  tier: (typeof tiers)[number];
  index: number;
}) {
  const inner = (
    <div className="p-6 md:p-8 h-full flex flex-col">
      {/* Tag */}
      <span
        className={`inline-block self-start font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border mb-4 ${
          tier.highlighted
            ? "text-lume border-lume/30 bg-lume/10"
            : "text-white/40 border-white/10 bg-white/[0.03]"
        }`}
      >
        {tier.tag}
      </span>

      {/* Name */}
      <h3 className="font-heading text-2xl font-bold text-white">
        {tier.name}
      </h3>

      {/* Description */}
      <p className="font-mono text-sm text-white/40 mt-2 leading-relaxed">
        {tier.description}
      </p>

      {/* CTA replacing price */}
      <div className="mt-6 mb-6">
        <Link
          href="/book"
          className={`inline-flex items-center justify-center w-full gap-2 px-6 py-3 text-sm font-mono font-semibold rounded-lg transition-all ${
            tier.highlighted
              ? "text-[#0A0A0B] bg-lume hover:bg-lume/90 hover:shadow-[0_0_30px_rgba(0,255,143,0.2)]"
              : "text-white border border-white/15 hover:border-white/30 hover:bg-white/5"
          }`}
        >
          Book a Strategy Call
        </Link>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-white/10 mb-6" />

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <svg
              className={`w-4 h-4 mt-0.5 shrink-0 ${
                tier.highlighted ? "text-lume" : "text-teal-clinical/60"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-mono text-sm text-white/60">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Best for */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <p className="font-mono text-xs text-white/25">
          <span className="text-white/40">Best for:</span> {tier.bestFor}
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.1 }}
    >
      {tier.highlighted ? (
        <BorderBeamCard className="h-full">{inner}</BorderBeamCard>
      ) : (
        <div className="h-full rounded-xl border border-white/10 bg-[#0d0d0e] overflow-hidden">
          {inner}
        </div>
      )}
    </motion.div>
  );
}

export default function PricingPage() {
  return (
    <section className="min-h-screen pt-28 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center"
        >
          <span className="font-mono text-xs text-lume/60 uppercase tracking-widest">
            Pricing
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mt-2">
            Choose Your Growth Plan
          </h1>
          <p className="font-mono text-sm text-white/40 mt-4 max-w-lg mx-auto">
            Every plan is tailored to your practice. Book a call and we&apos;ll
            build the right strategy for your goals and budget.
          </p>
        </motion.div>

        {/* Setup fee note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-12"
        >
          <span className="inline-block font-mono text-xs text-teal-clinical/60 border border-teal-clinical/15 rounded-full px-4 py-1.5 bg-teal-clinical/5">
            All plans include a one-time setup &amp; audit onboarding
          </span>
        </motion.div>

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <TierCard key={tier.name} tier={tier} index={i} />
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center font-mono text-xs text-white/25 mt-10"
        >
          No long-term contracts. Cancel anytime. You stay because it works.
        </motion.p>
      </div>
    </section>
  );
}
