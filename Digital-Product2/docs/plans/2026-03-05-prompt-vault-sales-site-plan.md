# Prompt Vault Sales Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone Next.js sales page at `vault.aaronmcbride.com` that sells the AI Prompt Vault PDF for $9 via Stripe Checkout, with a verified download page after payment.

**Architecture:** Next.js App Router with Tailwind CSS for the frontend, Stripe Checkout (hosted) for payments, and a server-side success page that verifies payment before serving a download link. The PDF lives in `/public`. Same design system as the hub app (dark mode, Syne + DM Sans, lime-green accent).

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Stripe SDK, TypeScript

---

### Task 1: Scaffold Next.js App

**Files:**
- Create: `products/vault/package.json`
- Create: `products/vault/tsconfig.json`
- Create: `products/vault/next.config.ts`
- Create: `products/vault/postcss.config.mjs`
- Create: `products/vault/app/layout.tsx`
- Create: `products/vault/app/globals.css`
- Create: `products/vault/.gitignore`
- Create: `products/vault/.env.local` (git-ignored)

**Step 1: Create the project directory and package.json**

```bash
mkdir -p products/vault
```

```json
{
  "name": "vault",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "stripe": "^17"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

**Step 2: Create config files**

`tsconfig.json` — copy from hub app pattern:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`:

```typescript
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

`postcss.config.mjs`:

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

`.gitignore`:

```
node_modules/
.next/
.env.local
```

`.env.local`:

```
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

**Step 3: Create layout and globals.css**

`app/layout.tsx` — same pattern as hub:

```tsx
import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The AI Prompt Vault — Life Transformation Edition",
  description:
    "20 AI prompts that turn ChatGPT into a world-class life strategist. Like a $500 coaching session for the price of a coffee.",
  openGraph: {
    title: "The AI Prompt Vault — Life Transformation Edition",
    description:
      "20 AI prompts that turn ChatGPT into a world-class life strategist.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The AI Prompt Vault",
    description:
      "20 AI prompts that turn ChatGPT into a world-class life strategist.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

`app/globals.css` — copy the hub's globals.css exactly (same design system: colors, fonts, animations, noise texture, ambient glow, tag pills, shimmer, scroll reveal).

**Step 4: Install dependencies**

```bash
cd products/vault && npm install
```

**Step 5: Copy the PDF into public**

```bash
mkdir -p products/vault/public
cp products/prompt-pack/output/ai-prompt-vault.pdf products/vault/public/ai-prompt-vault.pdf
```

**Step 6: Verify dev server starts**

```bash
cd products/vault && npm run dev
```

Visit http://localhost:3002 — should see a blank dark page with no errors.

**Step 7: Commit**

```bash
git add products/vault/ -f
git commit -m "feat: scaffold vault sales site with Next.js + Stripe"
```

---

### Task 2: Build the Sales Landing Page

**Files:**
- Create: `products/vault/app/page.tsx`

**Step 1: Build the full sales page**

This is a single-file page component with all sections. Use the sales copy from `products/prompt-pack/gumroad-listing.md` as content source. Use the hub's design patterns (scroll reveal, ambient glows, font classes, color tokens).

The page has these sections:

```tsx
"use client";

import { useEffect, useRef } from "react";

/* ── Scroll reveal hook (same as hub) ── */
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

/* ── Data ── */
const categories = [
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

const faqs = [
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

/* ── Buy button component ── */
function BuyButton({ className }: { className?: string }) {
  const handleClick = async () => {
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };
  return (
    <button onClick={handleClick} className={className}>
      Get the Vault — $9
    </button>
  );
}

/* ── Page sections ── */
// Hero: Title, subtitle, hook, CTA
// What's Inside: 5 category cards with prompt lists
// How It Works: 3 steps
// FAQ: Accordion or simple list
// Final CTA: Repeat buy button

export default function Home() {
  const revealRef = useScrollReveal();
  // ... render all sections using the data above
  // Style with Tailwind using the same tokens as hub (font-display, text-accent, bg-surface, etc.)
}
```

**Key design decisions:**
- CTA button: lime-green background (`bg-accent text-background`), large, prominent
- Category cards: use each category's color as accent on the left border (same pattern as PDF)
- FAQ: simple toggle with `<details>/<summary>` — no JS library needed
- Mobile-first, single column, max-w-3xl centered
- @superpowers:frontend-design should be used for the actual visual design

**Step 2: Verify the page renders**

```bash
cd products/vault && npm run dev
```

Visit http://localhost:3002 — full sales page should render. CTA button won't work yet (no API route).

**Step 3: Commit**

```bash
git add products/vault/app/page.tsx
git commit -m "feat: build vault sales landing page"
```

---

### Task 3: Stripe Checkout API Route

**Files:**
- Create: `products/vault/app/api/checkout/route.ts`

**Step 1: Create the checkout API route**

```typescript
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "The AI Prompt Vault: Life Transformation Edition",
              description: "20 AI prompts that turn ChatGPT into a world-class life strategist",
            },
            unit_amount: 900, // $9.00 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3002"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3002"}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
```

**Step 2: Add NEXT_PUBLIC_URL to .env.local**

```
NEXT_PUBLIC_URL=http://localhost:3002
```

**Step 3: Test the route**

```bash
curl -X POST http://localhost:3002/api/checkout
```

Should return JSON with a `url` field pointing to `checkout.stripe.com`.

**Step 4: Commit**

```bash
git add products/vault/app/api/checkout/route.ts
git commit -m "feat: add Stripe Checkout API route"
```

---

### Task 4: Success / Download Page

**Files:**
- Create: `products/vault/app/success/page.tsx`

**Step 1: Build the success page with server-side session verification**

```tsx
import Stripe from "stripe";
import Link from "next/link";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return <InvalidPage message="No session ID provided." />;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return <InvalidPage message="Payment not completed." />;
    }

    // Payment verified — show download
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <div className="mb-6 text-5xl">✓</div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            You're in.
          </h1>
          <p className="text-foreground-dim mb-8">
            Thanks for grabbing the Vault. Open the PDF, pick the prompt
            that matches what you're dealing with, and paste it into
            ChatGPT or Claude. Be honest when it asks you questions.
          </p>
          <a
            href="/ai-prompt-vault.pdf"
            download
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 font-display text-lg font-bold text-background transition-transform hover:scale-105"
          >
            Download the Vault
          </a>
          <p className="mt-6 text-sm text-foreground-dim/50">
            Bookmark this page — you can come back to download again.
          </p>
        </div>
      </div>
    );
  } catch {
    return <InvalidPage message="Could not verify payment." />;
  }
}

function InvalidPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md text-center px-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-4">
          Something went wrong
        </h1>
        <p className="text-foreground-dim mb-8">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-surface-border px-6 py-3 font-display font-bold text-foreground transition-colors hover:bg-surface"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
```

**Key details:**
- This is a **Server Component** (no "use client") — it calls Stripe server-side
- `searchParams` is a Promise in Next.js 16 — must be awaited
- Verifies `payment_status === "paid"` before showing download
- Download link points to `/ai-prompt-vault.pdf` in the `public/` folder
- Invalid states show a clear error with a link back to home

**Step 2: Test the full flow**

1. Visit http://localhost:3002
2. Click "Get the Vault — $9"
3. Should redirect to Stripe Checkout (use test card 4242 4242 4242 4242)
4. After payment, should land on /success with download button
5. Click download — PDF should download

**Step 3: Commit**

```bash
git add products/vault/app/success/page.tsx
git commit -m "feat: add success page with Stripe session verification"
```

---

### Task 5: Final Polish and Build Verification

**Step 1: Verify production build**

```bash
cd products/vault && npm run build
```

Should complete with no errors.

**Step 2: Update hub page to link to vault**

In `products/hub/app/page.tsx`, update the AI Prompt Vault product entry:

```typescript
{
  title: "The AI Prompt Vault",
  tagline: "20 AI prompts that turn ChatGPT into your personal life strategist",
  price: "$9",
  link: "https://vault.aaronmcbride.com",
  tag: "prompts",
},
```

**Step 3: Commit**

```bash
git add products/vault/ products/hub/app/page.tsx
git commit -m "feat: vault site ready for deploy — update hub link"
```

---

## Deployment Notes (after all tasks)

1. **Deploy vault to Vercel** — new project, root directory `products/vault`
2. **Set env vars in Vercel:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_URL`
3. **Connect domain:** Add `vault.aaronmcbride.com` subdomain in Vercel + DNS
4. **Switch Stripe to live keys** when ready to accept real payments
