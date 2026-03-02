"use client";

import Script from "next/script";
import { motion } from "framer-motion";

export default function BookPage() {
  const calendlyUrl =
    process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

  return (
    <section className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-heading text-4xl md:text-6xl font-bold text-white mb-6"
        >
          Book Your Free SEO Diagnostic
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-mono text-white/50 text-sm md:text-base max-w-xl mx-auto leading-relaxed"
        >
          30 minutes. Zero obligation. We&apos;ll walk through your current
          online presence and show you exactly where you&apos;re losing patients
          to competitors.
        </motion.p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-4xl mx-auto"
      >
        <div
          className="calendly-inline-widget rounded-lg overflow-hidden"
          data-url={calendlyUrl}
          style={{ minWidth: "320px", height: "700px" }}
        />
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="lazyOnload"
        />
      </motion.div>
    </section>
  );
}
