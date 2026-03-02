"use client";

import Link from "next/link";
import { useInView } from "@/hooks/use-in-view";
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
  const { ref: headerRef, inView: headerInView } = useInView();
  const { ref: bodyRef, inView: bodyInView } = useInView();
  const { ref: ctaRef, inView: ctaInView } = useInView();

  return (
    <section className="relative py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div
          ref={headerRef}
          className={`mb-10 transition-all duration-500 ${
            headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          <span className="font-mono text-xs text-lume/60 uppercase tracking-widest">
            FAQ
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mt-2">
            Questions
          </h2>
        </div>

        <div
          ref={bodyRef}
          className={`transition-all duration-500 delay-100 ${
            bodyInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-white/10 rounded-lg px-6 bg-[#0A0A0B]/60 data-[state=open]:border-teal-clinical/30 transition-colors"
              >
                <AccordionTrigger className="font-heading text-base text-white hover:no-underline py-4 [&[data-state=open]]:text-teal-clinical">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-mono text-sm text-white/50 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA after FAQ */}
        <div
          ref={ctaRef}
          className={`mt-10 text-center transition-all duration-500 delay-200 ${
            ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="font-mono text-sm text-white/30 mb-4">
            Still have questions?
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-mono font-semibold text-[#0A0A0B] bg-lume rounded-lg transition-all hover:bg-lume/90 hover:shadow-[0_0_30px_rgba(0,255,143,0.2)]"
          >
            Book a Free Call
          </Link>
        </div>
      </div>
    </section>
  );
}
