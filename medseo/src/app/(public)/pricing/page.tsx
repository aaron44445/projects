"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BorderBeamCard } from "@/components/border-beam";

export default function PricingPage() {
  return (
    <section className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="font-mono text-xs text-lume/60 uppercase tracking-widest">
            Pricing
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mt-2">
            Investment
          </h1>
        </motion.div>

        {/* Custom approach card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <BorderBeamCard duration={5}>
            <div className="p-10 md:p-16 text-center space-y-8">
              <h2 className="font-heading text-2xl md:text-4xl font-bold text-white">
                Every med spa is different.
              </h2>
              <p className="font-mono text-sm md:text-base text-white/40 max-w-lg mx-auto leading-relaxed">
                Your market, your competitors, your goals &mdash; they&apos;re
                unique. That&apos;s why we build custom growth plans instead of
                one-size-fits-all packages.
              </p>
              <p className="font-mono text-sm text-teal-clinical/80">
                Book a free strategy call and we&apos;ll build a plan that fits.
              </p>
              <div>
                <Link
                  href="/book"
                  className="group inline-flex items-center gap-3 px-8 py-4 text-base font-mono font-medium text-[#0A0A0B] bg-lume rounded-lg transition-all hover:bg-lume/90 hover:shadow-[0_0_40px_rgba(0,255,143,0.3)]"
                >
                  Book a Strategy Call
                  <svg
                    className="w-5 h-5 transition-transform group-hover:translate-x-1"
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
              </div>
            </div>
          </BorderBeamCard>
        </motion.div>
      </div>
    </section>
  );
}
