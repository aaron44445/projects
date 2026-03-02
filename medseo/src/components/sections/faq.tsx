"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What makes you different from other SEO agencies?",
    answer:
      "We only work with med spas. Every strategy, every piece of content, every optimization is built specifically for aesthetic practices. Generic agencies spread thin across industries. We go deep in one.",
  },
  {
    question: "How long until I see results?",
    answer:
      "Most clients see measurable improvements within 60-90 days. SEO is a compounding investment \u2014 month 1 builds the foundation, months 2-3 show momentum, and by month 6 you\u2019re dominating your local market.",
  },
  {
    question: "What does the monthly retainer include?",
    answer:
      "Content creation, on-page optimization, local SEO management, Google Business Profile optimization, monthly reporting, and ongoing technical SEO. Everything needed to grow your organic presence.",
  },
  {
    question: "Do you work with other industries?",
    answer:
      "No. Med spas only. This focus means we know exactly which keywords drive bookings, what content converts patients, and how to outrank your competitors.",
  },
  {
    question: "What if I\u2019m not happy with results?",
    answer:
      "We provide transparent monthly reports showing exact progress. If you\u2019re not seeing results after 90 days, we\u2019ll audit our strategy and adjust at no extra cost. No long-term contracts \u2014 you stay because it works.",
  },
  {
    question: "How do you report on progress?",
    answer:
      "Monthly reports covering keyword rankings, organic traffic, Google Business Profile insights, and estimated revenue impact. Plus a strategy call to discuss next steps.",
  },
];

export function FAQ() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="font-mono text-xs text-lume/60 uppercase tracking-widest">
            FAQ
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mt-2">
            Questions
          </h2>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-white/10 rounded-lg px-6 bg-[#0A0A0B]/60 data-[state=open]:border-teal-clinical/30 transition-colors"
              >
                <AccordionTrigger className="font-heading text-base text-white hover:no-underline py-5 [&[data-state=open]]:text-teal-clinical">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-mono text-sm text-white/50 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
