"use client";

import Link from "next/link";
import { useInView } from "@/hooks/use-in-view";
import { BorderBeamCard } from "@/components/border-beam";

export function CTA() {
  const { ref: h2Ref, inView: h2InView } = useInView();
  const { ref: pRef, inView: pInView } = useInView();
  const { ref: btnRef, inView: btnInView } = useInView();

  return (
    <section className="relative py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <BorderBeamCard duration={4}>
          <div className="p-8 md:p-14 text-center space-y-6">
            <h2
              ref={h2Ref}
              className={`font-heading text-3xl md:text-5xl lg:text-6xl font-bold text-white transition-all duration-600 ${
                h2InView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              }`}
            >
              Ready to Dominate Google?
            </h2>

            <p
              ref={pRef}
              className={`font-mono text-sm md:text-base text-white/40 max-w-xl mx-auto leading-relaxed transition-all duration-600 delay-150 ${
                pInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Get a free SEO diagnostic for your med spa. We&apos;ll show you
              exactly where you&apos;re losing patients to competitors.
            </p>

            <div
              ref={btnRef}
              className={`transition-all duration-600 delay-300 ${
                btnInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Link
                href="/book"
                className="group inline-flex items-center gap-3 px-8 py-4 text-base font-mono font-semibold text-[#0A0A0B] bg-lume rounded-lg transition-all hover:bg-lume/90 hover:shadow-[0_0_40px_rgba(0,255,143,0.3)]"
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
            </div>
          </div>
        </BorderBeamCard>
      </div>
    </section>
  );
}
