"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BorderBeamCard } from "@/components/border-beam";

export function CTA() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <BorderBeamCard duration={4}>
          <div className="p-12 md:p-20 text-center space-y-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold text-white"
            >
              Ready to Dominate Google?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true }}
              className="font-mono text-sm md:text-base text-white/40 max-w-xl mx-auto leading-relaxed"
            >
              Get a free SEO diagnostic for your med spa. We&apos;ll show you
              exactly where you&apos;re losing patients to competitors.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Link
                href="/book"
                className="group inline-flex items-center gap-3 px-8 py-4 text-base font-mono font-medium text-[#0A0A0B] bg-lume rounded-lg transition-all hover:bg-lume/90 hover:shadow-[0_0_40px_rgba(0,255,143,0.3)]"
              >
                Book Your Free Audit
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
            </motion.div>
          </div>
        </BorderBeamCard>
      </div>
    </section>
  );
}
