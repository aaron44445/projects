"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

type Product = {
  title: string;
  tagline: string;
  price: string;
  link: string;
  tag?: string;
  featured?: boolean;
  comingSoon?: boolean;
  free?: boolean;
};

const products: Product[] = [
  {
    title: "The AI Business Blueprint",
    tagline: "How to run your entire business with AI agents. The playbook nobody's sharing.",
    price: "$39",
    link: "#",
    tag: "guide",
    featured: true,
  },
  {
    title: "Landing Page Templates",
    tagline: "3 premium dark-mode templates. Download. Edit. Ship.",
    price: "$29",
    link: "#",
    tag: "code",
    featured: true,
  },
  {
    title: "Build in Public Kit",
    tagline: "TikTok scripts, thread templates, 30-day calendar & hook formulas",
    price: "$19",
    link: "#",
    tag: "content",
  },
  {
    title: "Solo Founder Dashboard",
    tagline: "Daily command center for habits, goals, revenue & focus",
    price: "$19",
    link: "#",
    tag: "app",
  },
  {
    title: "Productivity Template Pack",
    tagline: "5 Notion systems for goals, habits, planning & weekly reviews",
    price: "$15",
    link: "#",
    tag: "notion",
  },
  {
    title: "The AI Prompt Vault",
    tagline: "20 AI prompts that turn ChatGPT into your personal life strategist",
    price: "$9",
    link: "https://vault.aaronmcbride.com",
    tag: "prompts",
  },
  {
    title: "Locked In Wallpapers",
    tagline: "25 dark-mode wallpapers. 5 themes. Every device size.",
    price: "$7",
    link: "#",
    tag: "design",
  },
  {
    title: "Receipt Tracker",
    tagline: "AI-powered expense tracking for solo operators",
    price: "Soon",
    link: "#",
    tag: "app",
    comingSoon: true,
  },
];

const freebies: Product[] = [
  {
    title: "Prompt Starter Pack",
    tagline: "10 essential AI prompts to get you moving",
    price: "Free",
    link: "#",
    free: true,
  },
  {
    title: "Creator Launch Checklist",
    tagline: "Ship your first digital product this weekend",
    price: "Free",
    link: "#",
    free: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Scroll reveal                                                      */
/* ------------------------------------------------------------------ */

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.classList.add(
              target.dataset.revealType === "scale"
                ? "animate-reveal-scale"
                : "animate-reveal"
            );
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.08 }
    );

    const children = el.querySelectorAll("[data-reveal]");
    children.forEach((child) => {
      (child as HTMLElement).style.opacity = "0";
      observer.observe(child);
    });

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function TagPill({ tag }: { tag?: string }) {
  if (!tag) return null;
  const colors: Record<string, string> = {
    guide: "border-amber-500/20 text-amber-400/80",
    code: "border-violet-500/20 text-violet-400/80",
    content: "border-rose-500/20 text-rose-400/80",
    app: "border-sky-500/20 text-sky-400/80",
    notion: "border-emerald-500/20 text-emerald-400/80",
    prompts: "border-orange-500/20 text-orange-400/80",
    design: "border-pink-500/20 text-pink-400/80",
  };
  return (
    <span className={`tag-pill ${colors[tag] ?? ""}`}>
      {tag}
    </span>
  );
}

function PriceBadge({ price, comingSoon, free }: Pick<Product, "price" | "comingSoon" | "free">) {
  if (comingSoon) {
    return (
      <span className="text-xs font-medium tracking-wide text-foreground-dim/60 uppercase">
        Soon
      </span>
    );
  }
  if (free) {
    return (
      <span className="font-display text-sm font-bold text-accent">
        Free
      </span>
    );
  }
  return (
    <span className="font-display text-lg font-bold tracking-tight text-foreground">
      {price}
    </span>
  );
}

function FeaturedCard({ product, index }: { product: Product; index: number }) {
  return (
    <a
      href={product.link}
      data-reveal
      data-reveal-type="scale"
      className={`stagger-${index + 1} group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 transition-all duration-500 hover:border-accent/15 hover:bg-surface-raised`}
    >
      {/* Shimmer effect */}
      <div className="shimmer-line" />

      {/* Accent glow on hover */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-accent/5 blur-3xl transition-opacity duration-500 opacity-0 group-hover:opacity-100" />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <TagPill tag={product.tag} />
          <PriceBadge price={product.price} comingSoon={product.comingSoon} free={product.free} />
        </div>
        <h3 className="font-display text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
          {product.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-foreground-dim sm:text-base">
          {product.tagline}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-accent transition-all duration-300 group-hover:gap-3">
        <span>Get it</span>
        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </a>
  );
}

function ProductRow({ product, index }: { product: Product; index: number }) {
  return (
    <a
      href={product.link}
      data-reveal
      className={`stagger-${index + 1} group flex items-center justify-between gap-4 rounded-xl border border-transparent bg-transparent px-4 py-4 transition-all duration-300 hover:border-surface-border hover:bg-surface`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <TagPill tag={product.tag} />
        <div className="min-w-0">
          <h3 className="font-display text-sm font-bold tracking-tight text-foreground sm:text-base truncate">
            {product.title}
          </h3>
          <p className="mt-0.5 text-xs text-foreground-dim sm:text-sm truncate">
            {product.tagline}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <PriceBadge price={product.price} comingSoon={product.comingSoon} free={product.free} />
        {!product.comingSoon && (
          <svg className="h-4 w-4 text-foreground-dim transition-all duration-300 group-hover:text-accent group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        )}
      </div>
    </a>
  );
}

function FreeCard({ product, index }: { product: Product; index: number }) {
  return (
    <a
      href={product.link}
      data-reveal
      className={`stagger-${index + 1} group flex items-center justify-between rounded-xl border border-dashed border-accent/15 bg-surface-glow px-5 py-4 transition-all duration-300 hover:border-accent/30 hover:bg-accent/[0.06]`}
    >
      <div>
        <h3 className="font-display text-sm font-bold tracking-tight text-foreground">
          {product.title}
        </h3>
        <p className="mt-0.5 text-xs text-foreground-dim">
          {product.tagline}
        </p>
      </div>
      <span className="shrink-0 font-display text-sm font-bold text-accent">
        Free &rarr;
      </span>
    </a>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-dim/50 transition-all duration-200 hover:bg-surface hover:text-foreground"
    >
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  const revealRef = useScrollReveal();
  const featured = products.filter((p) => p.featured);
  const rest = products.filter((p) => !p.featured);

  return (
    <div ref={revealRef} className="relative min-h-screen">
      {/* Ambient background glows */}
      <div className="ambient-glow bg-accent/80" style={{ top: "-200px", left: "-100px" }} />
      <div className="ambient-glow bg-warm" style={{ top: "400px", right: "-200px", opacity: 0.06 }} />

      <div className="relative z-10 mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">

        {/* ── Hero ── */}
        <header className="mb-20" data-reveal>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-accent-dim" />
            <span className="text-sm font-medium text-foreground-dim">Aaron McBride</span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            I build things<br />
            <span className="text-accent">with AI</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-foreground-dim sm:text-lg">
            Tools, templates & systems for solo founders and creators who ship fast.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {["prompts", "templates", "dashboards", "guides", "wallpapers"].map((t) => (
              <span key={t} className="tag-pill">{t}</span>
            ))}
          </div>
        </header>

        {/* ── Featured Products ── */}
        <section className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2
              data-reveal
              className="font-display text-xs font-bold uppercase tracking-[0.2em] text-foreground-dim/50"
            >
              Featured
            </h2>
            <div className="section-divider flex-1 ml-4" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((product, i) => (
              <FeaturedCard key={product.title} product={product} index={i} />
            ))}
          </div>
        </section>

        {/* ── All Products ── */}
        <section className="mb-16">
          <div className="mb-4 flex items-center justify-between">
            <h2
              data-reveal
              className="font-display text-xs font-bold uppercase tracking-[0.2em] text-foreground-dim/50"
            >
              All Products
            </h2>
            <div className="section-divider flex-1 ml-4" />
          </div>

          <div className="-mx-4 flex flex-col">
            {rest.map((product, i) => (
              <ProductRow key={product.title} product={product} index={i} />
            ))}
          </div>
        </section>

        {/* ── Free ── */}
        <section className="mb-20">
          <div className="mb-6 flex items-center justify-between">
            <h2
              data-reveal
              className="font-display text-xs font-bold uppercase tracking-[0.2em] text-accent/50"
            >
              Free stuff
            </h2>
            <div className="section-divider flex-1 ml-4" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {freebies.map((product, i) => (
              <FreeCard key={product.title} product={product} index={i} />
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer data-reveal className="flex items-center justify-between border-t border-surface-border pt-8">
          <p className="text-xs text-foreground-dim/30">
            &copy; {new Date().getFullYear()} Aaron McBride
          </p>

          <div className="flex items-center gap-1">
            {/* TikTok */}
            <SocialLink href="#" label="TikTok">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 005.58 2.15V11.7a4.83 4.83 0 01-3.77-1.24V6.69h3.77z" />
              </svg>
            </SocialLink>

            {/* Twitter / X */}
            <SocialLink href="#" label="Twitter">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </SocialLink>

            {/* Email */}
            <SocialLink href="#" label="Email">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.5-9.75-6.5" />
              </svg>
            </SocialLink>
          </div>
        </footer>
      </div>
    </div>
  );
}
