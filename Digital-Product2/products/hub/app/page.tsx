"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Product data — add new products here                              */
/* ------------------------------------------------------------------ */

type Product = {
  title: string;
  tagline: string;
  price: string;
  link: string;
  comingSoon?: boolean;
  free?: boolean;
};

const products: Product[] = [
  {
    title: "The AI Prompt Vault",
    tagline: "50+ battle-tested prompts to 10x your output",
    price: "$12",
    link: "#",
  },
  {
    title: "Locked In Wallpapers",
    tagline: "Dark mode aesthetic wallpapers for deep focus",
    price: "$7",
    link: "#",
  },
  {
    title: "Productivity Template Pack",
    tagline: "5 Notion templates for goals, habits & planning",
    price: "$15",
    link: "#",
  },
  {
    title: "Build in Public Kit",
    tagline: "Scripts, threads & calendars for content creators",
    price: "$19",
    link: "#",
  },
  {
    title: "Landing Page Templates",
    tagline: "3 premium templates for indie products",
    price: "$29",
    link: "#",
  },
  {
    title: "Solo Founder Dashboard",
    tagline: "Your daily command center",
    price: "$19",
    link: "#",
  },
  {
    title: "The AI Business Blueprint",
    tagline: "Run your business with AI agents",
    price: "$39",
    link: "#",
  },
  {
    title: "Receipt Tracker",
    tagline: "Smart expense tracking powered by AI",
    price: "Coming Soon",
    link: "#",
    comingSoon: true,
  },
];

const freebies: Product[] = [
  {
    title: "Free Prompt Starter Pack",
    tagline: "10 essential AI prompts to get started",
    price: "Free",
    link: "#",
    free: true,
  },
  {
    title: "Creator Checklist",
    tagline: "Launch your first digital product in a weekend",
    price: "Free",
    link: "#",
    free: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Intersection Observer hook for scroll animations                   */
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
            entry.target.classList.add("animate-fade-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
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

function ProfileAvatar() {
  return (
    <div className="relative mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-accent to-blue-600 p-[2px]">
      <div className="flex h-full w-full items-center justify-center rounded-full bg-background text-2xl font-bold text-accent">
        AM
      </div>
    </div>
  );
}

function PriceBadge({ price, comingSoon, free }: Pick<Product, "price" | "comingSoon" | "free">) {
  if (comingSoon) {
    return (
      <span className="inline-block rounded-full bg-badge px-3 py-1 text-xs font-medium text-muted">
        Coming Soon
      </span>
    );
  }
  if (free) {
    return (
      <span className="inline-block rounded-full bg-green-900/40 px-3 py-1 text-xs font-semibold text-green-400">
        Free
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-badge px-3 py-1 text-xs font-semibold text-accent">
      {price}
    </span>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <a
      href={product.link}
      data-reveal
      className={`stagger-${index + 1} group flex flex-col justify-between rounded-2xl border border-white/5 bg-card p-5 transition-all duration-300 hover:border-accent/20 hover:bg-card-hover`}
    >
      <div>
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight text-foreground">
            {product.title}
          </h3>
          <PriceBadge
            price={product.price}
            comingSoon={product.comingSoon}
            free={product.free}
          />
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          {product.tagline}
        </p>
      </div>
      {!product.comingSoon && (
        <span className="inline-flex items-center text-sm font-medium text-accent transition-transform duration-200 group-hover:translate-x-1">
          {product.free ? "Get it free" : "Get it"} &rarr;
        </span>
      )}
    </a>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-muted transition-colors duration-200 hover:border-accent/30 hover:text-accent"
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

  return (
    <div ref={revealRef} className="mx-auto min-h-screen max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
      {/* Hero */}
      <header className="mb-14 text-center" data-reveal>
        <ProfileAvatar />
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Aaron McBride
        </h1>
        <p className="text-base text-muted sm:text-lg">
          I build AI-powered products
        </p>
      </header>

      {/* Product Grid */}
      <section className="mb-14">
        <h2
          data-reveal
          className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted"
        >
          Products
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((product, i) => (
            <ProductCard key={product.title} product={product} index={i} />
          ))}
        </div>
      </section>

      {/* Free Stuff */}
      <section className="mb-14">
        <h2
          data-reveal
          className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted"
        >
          Free Stuff
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {freebies.map((product, i) => (
            <ProductCard
              key={product.title}
              product={product}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer data-reveal className="border-t border-white/5 pt-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          {/* TikTok */}
          <SocialIcon href="#" label="TikTok">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 005.58 2.15V11.7a4.83 4.83 0 01-3.77-1.24V6.69h3.77z" />
            </svg>
          </SocialIcon>

          {/* Twitter / X */}
          <SocialIcon href="#" label="Twitter">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </SocialIcon>

          {/* Email */}
          <SocialIcon href="#" label="Email signup">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.5-9.75-6.5" />
            </svg>
          </SocialIcon>
        </div>
        <p className="text-xs text-muted">
          &copy; {new Date().getFullYear()} Aaron McBride. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
