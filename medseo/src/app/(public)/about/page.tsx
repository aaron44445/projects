"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const team = [
  {
    initials: "AM",
    name: "Aaron McBride",
    role: "Co-founder, Growth Strategy",
  },
  {
    initials: "S",
    name: "Seth",
    role: "Co-founder, SEO & Content",
  },
];

export default function AboutPage() {
  return (
    <section className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <span className="font-mono text-xs text-lume/60 uppercase tracking-widest">
            About
          </span>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mt-2 mb-6">
            We&apos;re Not Another Agency
          </h1>
          <p className="font-mono text-sm md:text-base text-white/40 leading-relaxed max-w-xl">
            Most agencies try to serve everyone. We chose to master one thing:
            growing med spas through organic search. Every strategy, every piece
            of content, every optimization we build is purpose-made for aesthetic
            practices.
          </p>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-20"
        >
          <h2 className="font-heading text-2xl font-bold text-white mb-8">
            The Team
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="p-6 rounded-lg border border-white/10 bg-[#0A0A0B]/60"
              >
                <div className="w-14 h-14 rounded-full border border-lume/30 bg-lume/10 flex items-center justify-center mb-4">
                  <span className="font-heading text-lg font-bold text-lume">
                    {member.initials}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-bold text-white">
                  {member.name}
                </h3>
                <p className="font-mono text-xs text-white/40 mt-1">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Why Med Spas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-20"
        >
          <h2 className="font-heading text-2xl font-bold text-white mb-4">
            Why Med Spas?
          </h2>
          <div className="space-y-4 font-mono text-sm text-white/40 leading-relaxed">
            <p>
              The med spa industry is booming, but most practices are invisible
              online. They rely on word-of-mouth and paid ads while leaving
              thousands of high-intent searches on the table every month.
            </p>
            <p>
              We saw the gap: practices spending $10K+ on ads when patients are
              actively searching for their exact services on Google. The
              opportunity is massive, and no one was solving it properly.
            </p>
            <p>
              By focusing exclusively on med spas, we&apos;ve built a playbook
              that works. We know which keywords convert to bookings, what
              content resonates with patients, and how to outrank competitors in
              every local market.
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="text-center"
        >
          <p className="font-mono text-sm text-white/40 mb-6">
            Want to see what we can do for your practice?
          </p>
          <Link
            href="/book"
            className="group inline-flex items-center gap-3 px-6 py-3 text-sm font-mono text-lume border border-lume/30 rounded-lg transition-all hover:bg-lume/10 hover:border-lume/60 hover:shadow-[0_0_30px_rgba(0,255,143,0.15)]"
          >
            Book a Call
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
    </section>
  );
}
