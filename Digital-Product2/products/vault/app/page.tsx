"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Scroll-reveal hook                                                 */
/* ------------------------------------------------------------------ */

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.add(
              el.dataset.revealType === "scale"
                ? "animate-reveal-scale"
                : "animate-reveal"
            );
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.08 }
    );

    const targets = root.querySelectorAll("[data-reveal]");
    targets.forEach((el) => {
      (el as HTMLElement).style.opacity = "0";
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

type Category = {
  name: string;
  color: string;
  prompts: string[];
};

const categories: Category[] = [
  {
    name: "Self Awareness",
    color: "#e4ff54",
    prompts: [
      "Personal Life Analysis",
      "Personal SWOT Analysis",
      "Identity & Behavior Pattern Analysis",
      "Strengths & Leverage Finder",
    ],
  },
  {
    name: "Life Direction",
    color: "#54b8ff",
    prompts: [
      "Life Architect",
      "Purpose Discovery",
      "Ideal Future Vision Builder",
      "Personal Values Clarifier",
    ],
  },
  {
    name: "Mental Barriers",
    color: "#ff6b6b",
    prompts: [
      "Fear Deconstruction",
      "Procrastination Analyzer",
      "Limiting Belief Destroyer",
      "Motivation & Discipline Diagnosis",
    ],
  },
  {
    name: "Systems & Habits",
    color: "#c084fc",
    prompts: [
      "Habit Architect",
      "Daily Routine Designer",
      "Productivity System Builder",
      "Weekly Review System",
    ],
  },
  {
    name: "Execution & Results",
    color: "#fb923c",
    prompts: [
      "90-Day Transformation Plan",
      "Goal Execution System",
      "Personal Bottleneck Analyzer",
      "Accountability System Builder",
    ],
  },
];

const steps = [
  "Pick the prompt that matches what you're struggling with",
  "Copy and paste it into ChatGPT or Claude",
  "Answer the diagnostic questions honestly \u2014 receive a personalized analysis and action plan",
];

const whoItems = [
  "You feel stuck but can't pinpoint why",
  "You've tried self-improvement content but nothing sticks",
  "You use ChatGPT but only for basic stuff",
  "You want real analysis, not motivational quotes",
  "You'd pay for a coach but can't justify the cost",
];

type FAQ = { q: string; a: string };

const faqs: FAQ[] = [
  {
    q: "Do these work with the free version of ChatGPT?",
    a: "Yes. Every prompt works with ChatGPT (free), ChatGPT Plus, and Claude. No paid AI subscription required.",
  },
  {
    q: "How is this different from free prompts on the internet?",
    a: "Free prompts are templates with 10 blanks to fill in that produce generic output. These prompts are engineered to make the AI diagnose your situation first, then build a personalized system.",
  },
  {
    q: "Can I use these more than once?",
    a: "Absolutely. The prompts produce different results every time because your answers change as your life changes.",
  },
  {
    q: "What format is it in?",
    a: "A single PDF file. Open it, find the prompt you need, copy it, paste it into ChatGPT or Claude.",
  },
];

/* ------------------------------------------------------------------ */
/*  CTA handler                                                        */
/* ------------------------------------------------------------------ */

async function handleCheckout() {
  const res = await fetch("/api/checkout", { method: "POST" });
  const data = await res.json();
  if (data.url) window.location.href = data.url;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CTAButton({ className = "" }: { className?: string }) {
  return (
    <button
      onClick={handleCheckout}
      className={`group relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 font-display text-lg font-bold tracking-tight text-background transition-all duration-300 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <span>Get the Vault &mdash; $9</span>
      <svg
        className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
        />
      </svg>
    </button>
  );
}

function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  return (
    <div
      data-reveal
      className={`stagger-${index + 1} group relative overflow-hidden rounded-xl border border-surface-border bg-surface transition-all duration-300 hover:border-white/[0.08] hover:bg-surface-raised`}
    >
      {/* Left color accent border */}
      <div
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ backgroundColor: category.color }}
      />

      <div className="py-5 pl-6 pr-5">
        <div className="flex items-center justify-between">
          <h3
            className="font-display text-base font-bold tracking-tight text-foreground"
            style={{ color: category.color }}
          >
            {category.name}
          </h3>
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
            style={{
              backgroundColor: `${category.color}12`,
              color: category.color,
            }}
          >
            {category.prompts.length}
          </span>
        </div>

        <ul className="mt-3 space-y-1.5">
          {category.prompts.map((prompt) => (
            <li
              key={prompt}
              className="flex items-center gap-2 text-sm text-foreground-dim"
            >
              <span
                className="inline-block h-1 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: category.color, opacity: 0.5 }}
              />
              {prompt}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StepCard({
  number,
  text,
  index,
}: {
  number: number;
  text: string;
  index: number;
}) {
  return (
    <div
      data-reveal
      className={`stagger-${index + 1} flex gap-5`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/[0.06] font-display text-lg font-bold text-accent">
        {number}
      </div>
      <p className="pt-2 text-base leading-relaxed text-foreground-dim sm:text-lg">
        {text}
      </p>
    </div>
  );
}

function FAQItem({ faq }: { faq: FAQ }) {
  return (
    <details className="group border-b border-surface-border">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 font-display text-base font-semibold tracking-tight text-foreground transition-colors duration-200 hover:text-accent sm:text-lg [&::-webkit-details-marker]:hidden">
        <span>{faq.q}</span>
        <svg
          className="h-5 w-5 shrink-0 text-foreground-dim transition-transform duration-300 group-open:rotate-45"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </summary>
      <p className="pb-5 text-sm leading-relaxed text-foreground-dim sm:text-base">
        {faq.a}
      </p>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function VaultPage() {
  const revealRef = useScrollReveal();

  return (
    <div ref={revealRef} className="relative min-h-screen overflow-hidden">
      {/* ── Top accent line ── */}
      <div className="absolute top-0 left-0 z-20 h-1 w-full bg-gradient-to-r from-accent via-accent/40 to-transparent" />

      {/* ── Background grid pattern ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(228, 255, 84, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(228, 255, 84, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* ── Hero ambient glow ── */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          top: "-180px",
          right: "-120px",
          width: "680px",
          height: "680px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(228,255,84,0.10) 0%, rgba(228,255,84,0.03) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-8">
        {/* ================================================================ */}
        {/*  HERO                                                            */}
        {/* ================================================================ */}
        <section className="pb-24 pt-20 sm:pb-32 sm:pt-28" data-reveal>
          <p className="mb-6 font-mono text-xs font-medium uppercase tracking-[0.25em] text-foreground-dim">
            AI-Powered Self Improvement
          </p>

          <h1 className="font-display font-bold leading-[1.05] tracking-tight">
            <span className="block text-2xl text-foreground-dim sm:text-3xl">
              THE AI
            </span>
            <span className="block text-6xl text-foreground sm:text-7xl lg:text-8xl">
              PROMPT
            </span>
            <span className="block text-6xl text-accent sm:text-7xl lg:text-8xl">
              VAULT
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-relaxed text-foreground-dim sm:text-lg">
            20 prompts that turn ChatGPT into a world-class life strategist.
            Each one diagnoses your situation before giving advice &mdash; like a
            $500 coaching session for the price of a coffee.
          </p>

          <div className="mt-10">
            <CTAButton />
          </div>
        </section>

        {/* ================================================================ */}
        {/*  WHAT'S INSIDE                                                   */}
        {/* ================================================================ */}
        <section className="pb-24 sm:pb-32">
          <div className="mb-8 flex items-center gap-4" data-reveal>
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-foreground-dim/50">
              What&apos;s Inside
            </h2>
            <div className="h-px flex-1 bg-surface-border" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.name} category={cat} index={i} />
            ))}
          </div>
        </section>

        {/* ================================================================ */}
        {/*  HOW IT WORKS                                                    */}
        {/* ================================================================ */}
        <section className="pb-24 sm:pb-32">
          <div className="mb-10 flex items-center gap-4" data-reveal>
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-foreground-dim/50">
              How It Works
            </h2>
            <div className="h-px flex-1 bg-surface-border" />
          </div>

          <div className="space-y-8">
            {steps.map((step, i) => (
              <StepCard key={i} number={i + 1} text={step} index={i} />
            ))}
          </div>
        </section>

        {/* ================================================================ */}
        {/*  WHO THIS IS FOR                                                 */}
        {/* ================================================================ */}
        <section className="pb-24 sm:pb-32">
          <div className="mb-10 flex items-center gap-4" data-reveal>
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-foreground-dim/50">
              Who This Is For
            </h2>
            <div className="h-px flex-1 bg-surface-border" />
          </div>

          <div
            data-reveal
            className="rounded-xl border border-surface-border bg-surface p-6 sm:p-8"
          >
            <p className="mb-5 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
              This is for you if:
            </p>
            <ul className="space-y-4">
              {whoItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg
                    className="mt-1 h-4 w-4 shrink-0 text-accent"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                  <span className="text-sm leading-relaxed text-foreground-dim sm:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ================================================================ */}
        {/*  FAQ                                                             */}
        {/* ================================================================ */}
        <section className="pb-24 sm:pb-32">
          <div className="mb-10 flex items-center gap-4" data-reveal>
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-foreground-dim/50">
              FAQ
            </h2>
            <div className="h-px flex-1 bg-surface-border" />
          </div>

          <div data-reveal className="rounded-xl border border-surface-border bg-surface px-6 sm:px-8">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} faq={faq} />
            ))}
          </div>
        </section>

        {/* ================================================================ */}
        {/*  FINAL CTA                                                       */}
        {/* ================================================================ */}
        <section className="pb-24 sm:pb-32" data-reveal>
          <div className="flex flex-col items-center text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Ready to stop guessing?
            </h2>

            <div className="mt-8">
              <CTAButton />
            </div>

            <p className="mt-5 text-sm text-foreground-dim">
              Instant download &middot; PDF format &middot; Works with free
              ChatGPT
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          data-reveal
          className="flex items-center justify-center border-t border-surface-border py-8"
        >
          <p className="text-xs text-foreground-dim/30">
            &copy; {new Date().getFullYear()} Aaron McBride
          </p>
        </footer>
      </div>
    </div>
  );
}
