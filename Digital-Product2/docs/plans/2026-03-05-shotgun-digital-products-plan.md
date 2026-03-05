# Shotgun Digital Products — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Launch 8 digital products over 4 weeks, marketed through a personal brand on short-form video, to generate cash flow fast.

**Architecture:** Each product is independent — its own directory under `products/`. A shared "product hub" landing page (link-in-bio) ties them together. Code products deploy to Vercel. Content products are PDFs/ZIPs uploaded to Gumroad.

**Tech Stack:** Next.js (landing pages, dashboard), Tailwind CSS, html2canvas/jsPDF (PDF generation), p5.js (wallpaper generation), Gumroad (sales platform), Vercel (deployment)

---

## Phase 0: Infrastructure (Day 1)

### Task 0.1: Initialize the Product Hub Landing Page

This is the link-in-bio page that lists all products. It's what the TikTok bio links to.

**Files:**
- Create: `products/hub/package.json`
- Create: `products/hub/next.config.js`
- Create: `products/hub/tailwind.config.js`
- Create: `products/hub/src/app/layout.tsx`
- Create: `products/hub/src/app/page.tsx`
- Create: `products/hub/src/app/globals.css`

**Step 1: Scaffold a minimal Next.js app**

```bash
cd products && npx create-next-app@latest hub --typescript --tailwind --app --no-eslint --no-src-dir --import-alias "@/*"
```

**Step 2: Build the hub page**

Single-page design:
- Hero section: name, tagline ("I build AI-powered products"), profile image placeholder
- Product grid: card per product with title, one-liner, price, and Gumroad link
- Each card links to the Gumroad product page (external)
- Footer: TikTok, Twitter/X, email signup link
- Dark mode, clean minimalist aesthetic matching "Locked In" brand
- Mobile-first (most traffic from TikTok = phones)

Design notes:
- Use a simple JSON array in the page component for product data so new products can be added in seconds
- Each product card: thumbnail, title, tagline, price badge, "Get it" button
- Animate cards on scroll (simple fade-up with CSS)
- Add a "Free Stuff" section at the bottom for lead magnets

**Step 3: Test locally**

```bash
cd products/hub && npm run dev
```

Verify: page renders, all cards show, links work, mobile responsive.

**Step 4: Deploy to Vercel**

```bash
cd products/hub && npx vercel --prod
```

Note the URL — this goes in the TikTok bio.

**Step 5: Commit**

```bash
git add products/hub
git commit -m "feat: product hub landing page — link-in-bio for TikTok"
```

---

### Task 0.2: Set Up Gumroad Account & First Listing Shell

**This is a manual task for Aaron** — Claude cannot create accounts.

Aaron needs to:
1. Create a Gumroad account at gumroad.com
2. Set up profile (name, bio, profile picture)
3. Note the Gumroad profile URL for linking from the hub

Claude will handle everything after the account exists.

---

## Phase 1: Prompt Pack (Week 1, Days 1-2)

### Task 1.1: Create the AI Prompt Pack Content

**Files:**
- Create: `products/prompt-pack/README.md`
- Create: `products/prompt-pack/prompts/business-strategy.md`
- Create: `products/prompt-pack/prompts/content-creation.md`
- Create: `products/prompt-pack/prompts/coding-assistant.md`
- Create: `products/prompt-pack/prompts/productivity.md`
- Create: `products/prompt-pack/prompts/social-media.md`

**Step 1: Write the prompt collections**

Each file contains 10-15 battle-tested prompts organized by category. Each prompt includes:
- Title (what it does in 5 words)
- The prompt itself (ready to copy-paste)
- When to use it (one sentence)
- Pro tip (one sentence on how to get better results)

Categories:
- **Business Strategy** — market analysis, competitor research, pricing decisions, business model validation
- **Content Creation** — blog posts, newsletters, social captions, video scripts, hooks
- **Coding Assistant** — debugging, code review, architecture decisions, refactoring
- **Productivity** — daily planning, goal setting, decision making, prioritization
- **Social Media** — TikTok scripts, Twitter threads, carousel ideas, engagement hooks

**Step 2: Create a cover image**

Use the `@algorithmic-art` skill or a simple HTML-to-image approach to create a product cover:
- Dark background, neon accent colors
- Title: "The AI Prompt Vault"
- Subtitle: "50+ Prompts to 10x Your Output"
- Clean, bold typography

**Step 3: Generate a styled PDF**

Create a simple script that converts the markdown files into a polished PDF:

```bash
# products/prompt-pack/build.js
```

The PDF should have:
- Cover page with the product image
- Table of contents
- Each category as a chapter
- Clean formatting with syntax highlighting for the prompts
- Footer with branding

**Step 4: Package for Gumroad**

Bundle the PDF + raw markdown files into a ZIP:

```bash
cd products/prompt-pack && zip -r ../ai-prompt-vault.zip prompts/ output/prompt-vault.pdf
```

**Step 5: Commit**

```bash
git add products/prompt-pack
git commit -m "feat: AI Prompt Vault — 50+ prompts across 5 categories"
```

---

## Phase 2: Wallpaper Pack (Week 1, Days 2-3)

### Task 2.1: Generate Aesthetic Wallpaper Collection

**Files:**
- Create: `products/wallpapers/generate.js`
- Create: `products/wallpapers/themes.json`
- Create: `products/wallpapers/README.md`

**Step 1: Build the wallpaper generator**

Use `@algorithmic-art` skill with p5.js or Canvas API to generate wallpapers programmatically.

Themes (dark mode productivity aesthetic):
- **Locked In** — dark gradient background, minimal geometric grid, subtle glow accents
- **Deep Focus** — solid dark with single focal point (circle, line, dot pattern)
- **Night Grind** — dark blue/purple gradient with constellation-like dots
- **Clean Slate** — pure minimal, near-black with faint texture
- **Flow State** — smooth wave patterns, muted tones

For each theme, generate:
- Desktop (3840x2160, 2560x1440, 1920x1080)
- Phone (1290x2796 iPhone 15 Pro, 1440x3120 Android)
- iPad (2048x2732)

That's 5 themes x 5 sizes = 25 wallpapers.

**Step 2: Generate all wallpapers**

```bash
cd products/wallpapers && node generate.js
```

Output goes to `products/wallpapers/output/` organized by theme.

**Step 3: Create product mockups**

Generate a few preview images showing the wallpapers on device frames (phone, desktop, iPad). These are for the Gumroad listing and TikTok thumbnails.

**Step 4: Package for Gumroad**

```bash
cd products/wallpapers && zip -r ../locked-in-wallpapers.zip output/
```

**Step 5: Commit**

```bash
git add products/wallpapers
git commit -m "feat: Locked In wallpaper pack — 25 wallpapers across 5 themes"
```

---

## Phase 3: Notion Template Pack (Week 1-2)

### Task 3.1: Build the Notion Templates

**Note:** Notion templates are built inside Notion and shared via link. Claude cannot directly create Notion pages. However, Claude CAN:
1. Design the template structures in detail
2. Write the content/formulas
3. Create a beautiful product listing page

**Files:**
- Create: `products/notion-templates/README.md`
- Create: `products/notion-templates/designs/goal-tracker.md`
- Create: `products/notion-templates/designs/habit-dashboard.md`
- Create: `products/notion-templates/designs/daily-planner.md`
- Create: `products/notion-templates/designs/weekly-review.md`
- Create: `products/notion-templates/designs/project-tracker.md`

**Step 1: Design each template**

Write detailed specs for 5 Notion templates. Each design doc includes:
- Database schema (properties, types, formulas)
- Views (table, board, calendar, gallery)
- Template buttons and automations
- Exact Notion formulas for calculated fields
- Screenshots/descriptions of the final layout

Templates:
1. **Goal Tracker** — quarterly/monthly/weekly goals with progress rollup
2. **Habit Dashboard** — daily habit checkboxes with streak counting and weekly scores
3. **Daily Planner** — time-blocked day with priority matrix and evening reflection
4. **Weekly Review** — structured review template with wins, lessons, next week priorities
5. **Project Tracker** — kanban + timeline for managing multiple side projects

**Step 2: Aaron builds templates in Notion from specs**

Aaron creates the actual Notion pages following the specs Claude wrote. Claude provides exact formulas, property names, and view configurations.

**Step 3: Create product listing assets**

Claude builds a preview page or PDF showing screenshots and descriptions of each template.

**Step 4: Commit specs**

```bash
git add products/notion-templates
git commit -m "feat: Notion template pack — 5 productivity templates with full specs"
```

---

## Phase 4: Build-in-Public Content Kit (Week 2)

### Task 4.1: Create the Content Kit

**Files:**
- Create: `products/content-kit/README.md`
- Create: `products/content-kit/templates/tiktok-scripts.md`
- Create: `products/content-kit/templates/twitter-threads.md`
- Create: `products/content-kit/templates/carousel-formats.md`
- Create: `products/content-kit/templates/content-calendar.md`
- Create: `products/content-kit/templates/hook-formulas.md`

**Step 1: Write the TikTok script templates**

15 fill-in-the-blank TikTok scripts for build-in-public creators:
- "I built [X] in [time] — here's what happened"
- "Day [N] of building [project] in public"
- "This one trick made my [product] go viral"
- "I made $[X] from a digital product I built in [time]"
- Etc. Each with: hook (first 3 seconds), body structure, CTA

**Step 2: Write Twitter/X thread templates**

10 thread frameworks:
- Launch day thread
- "What I learned building [X]" thread
- Revenue milestone thread
- Tool stack thread
- Behind-the-scenes thread
- Etc.

**Step 3: Write carousel templates**

8 carousel formats for Instagram/LinkedIn:
- Step-by-step tutorial
- Before/after transformation
- "X things I wish I knew"
- Tool comparison
- Etc.

**Step 4: Build the 30-day content calendar**

A complete 30-day calendar with:
- Day-by-day content type (TikTok, thread, carousel)
- Which template to use
- Topic suggestion
- Posting time recommendations

**Step 5: Write the hook formula guide**

20 proven hook formulas with fill-in-the-blank versions:
- "Stop doing [X]. Do [Y] instead."
- "I spent [time] learning [skill] so you don't have to."
- "[Number] [things] that [result]"
- Etc.

**Step 6: Generate styled PDF**

Same approach as the prompt pack — convert all markdown into a polished, branded PDF.

**Step 7: Package and commit**

```bash
git add products/content-kit
git commit -m "feat: Build-in-Public Content Kit — scripts, threads, calendars, hooks"
```

---

## Phase 5: Landing Page Templates (Week 2-3)

### Task 5.1: Build 3 Landing Page Templates

These are standalone HTML/Next.js pages that buyers can deploy for their own products.

**Files:**
- Create: `products/landing-pages/templates/starter/index.html`
- Create: `products/landing-pages/templates/starter/styles.css`
- Create: `products/landing-pages/templates/saas/` (Next.js app)
- Create: `products/landing-pages/templates/creator/index.html`
- Create: `products/landing-pages/README.md`

**Step 1: Build the "Starter" template**

Single HTML file + CSS. Zero dependencies. Buyer just edits the text and deploys.

Sections:
- Hero with headline, subheadline, CTA button
- Feature grid (3-4 features with icons)
- Social proof / testimonial section
- Pricing card
- FAQ accordion
- Footer

Design: dark mode, modern, clean typography. Fully responsive.

**Step 2: Build the "SaaS" template**

Next.js + Tailwind. More advanced, for software products.

Sections:
- Animated hero with product screenshot
- Feature breakdown with alternating image/text rows
- Pricing table (3 tiers)
- Testimonials carousel
- FAQ
- CTA banner
- Footer with links

**Step 3: Build the "Creator" template**

Single HTML file. Designed for digital product sellers (like Aaron's audience).

Sections:
- Bold hero with product mockup
- "What's inside" breakdown
- Creator bio section
- Single pricing card with checkout button
- FAQ

**Step 4: Test all templates**

Open each in browser, verify responsive behavior at mobile/tablet/desktop breakpoints.

**Step 5: Package for Gumroad**

Each template is a ZIP with the source files + a README with setup instructions.

```bash
cd products/landing-pages && zip -r ../landing-page-templates.zip templates/
```

**Step 6: Commit**

```bash
git add products/landing-pages
git commit -m "feat: 3 landing page templates — starter, SaaS, creator"
```

---

## Phase 6: Solo Founder Dashboard (Week 3)

### Task 6.1: Build the Dashboard Web App

This is a real web app with a free tier and paid features. Separate from the "Locked In" app — simpler, more focused.

**Files:**
- Create: `products/dashboard/` (full Next.js app)
- Create: `products/dashboard/src/app/page.tsx` — main dashboard
- Create: `products/dashboard/src/components/` — UI components
- Create: `products/dashboard/src/lib/store.ts` — local state (localStorage)

**Step 1: Scaffold the app**

```bash
cd products && npx create-next-app@latest dashboard --typescript --tailwind --app --no-eslint --no-src-dir --import-alias "@/*"
```

**Step 2: Build the free tier dashboard**

Single page with:
- **Today's Focus** — 3 priority items (editable)
- **Habit Tracker** — 5 toggleable habits for today
- **Quick Notes** — text area that saves to localStorage
- **Streak Counter** — days in a row you've used the dashboard

All data persists in localStorage. No backend needed.

**Step 3: Write tests for core logic**

```bash
# Test habit toggle, streak calculation, localStorage persistence
```

**Step 4: Build the paid tier features (gated)**

Behind a simple unlock code (Gumroad license key):
- **Goal Tracker** — quarterly goals with progress bars
- **Revenue Tracker** — monthly MRR/revenue input with simple chart
- **Weekly Review** — structured weekly reflection form
- **Data Export** — download your data as JSON

License validation: call Gumroad's license verification API on the client side. Simple — if valid key, unlock features and save to localStorage.

**Step 5: Test the full app**

Run locally, verify free/paid tiers, test license key flow.

**Step 6: Deploy to Vercel**

```bash
cd products/dashboard && npx vercel --prod
```

**Step 7: Commit**

```bash
git add products/dashboard
git commit -m "feat: Solo Founder Dashboard — free/paid tiers with Gumroad license"
```

---

## Phase 7: AI Business Blueprint (Week 3-4)

### Task 7.1: Write the Digital Guide

**Files:**
- Create: `products/ai-blueprint/README.md`
- Create: `products/ai-blueprint/chapters/01-intro.md`
- Create: `products/ai-blueprint/chapters/02-ai-stack.md`
- Create: `products/ai-blueprint/chapters/03-automation.md`
- Create: `products/ai-blueprint/chapters/04-agents.md`
- Create: `products/ai-blueprint/chapters/05-workflows.md`
- Create: `products/ai-blueprint/chapters/06-scaling.md`
- Create: `products/ai-blueprint/build-pdf.js`

**Step 1: Write the guide content**

6 chapters, ~2000-3000 words total (concise, actionable, not fluff):

1. **Intro** — Why AI agents are the unfair advantage for solo founders
2. **The AI Stack** — Tools and platforms (Claude, GPT, automation tools). What to use for what.
3. **Automating Repetitive Work** — Cron jobs, scheduled tasks, email monitoring. Real examples.
4. **AI Agents That Run Your Business** — How to set up agents for marketing, customer service, content. Based on Aaron's real OpenCLAW setup (anonymized/generalized).
5. **Workflows That Print Money** — Specific workflows: SEO audits, content calendars, lead prospecting, competitor analysis.
6. **Scaling Without Hiring** — How one person runs multiple businesses with AI agents.

**Step 2: Generate styled PDF**

Professional-looking PDF with:
- Cover page
- Table of contents
- Chapter formatting
- Code/config examples in styled boxes
- Callout boxes for key insights

**Step 3: Package and commit**

```bash
git add products/ai-blueprint
git commit -m "feat: AI Business Blueprint — 6-chapter guide on AI-powered solo business"
```

---

## Phase 8: Micro SaaS Tool (Week 4+)

### Task 8.1: Build a Receipt/Expense Tracker

**Note:** This product ships AFTER you have audience data. The specific tool may change based on what the audience is asking for. Defaulting to a receipt tracker as a solid starting point.

**Files:**
- Create: `products/receipt-tracker/` (full Next.js app)

**Step 1: Scaffold the app**

```bash
cd products && npx create-next-app@latest receipt-tracker --typescript --tailwind --app --no-eslint --no-src-dir --import-alias "@/*"
```

**Step 2: Build the free tier**

- Snap a receipt photo (or upload image)
- AI extracts: vendor, amount, date, category (use a free OCR API or client-side model)
- Shows a simple expense list sorted by date
- Monthly total at the top
- All data in localStorage

**Step 3: Build the paid tier**

- Category breakdown charts
- Monthly/yearly reports
- CSV export
- Cloud sync (optional — could use Supabase free tier)

**Step 4: Deploy and list**

Same Vercel + Gumroad pattern as the dashboard.

**Step 5: Commit**

```bash
git add products/receipt-tracker
git commit -m "feat: Receipt Tracker micro SaaS — free/paid tiers"
```

---

## Phase 9: Marketing Infrastructure

### Task 9.1: Update Product Hub With All Listings

After each product ships, update the hub page:

**Files:**
- Modify: `products/hub/src/app/page.tsx`

Add each product to the product data array with:
- Title
- One-liner description
- Price
- Gumroad link
- Thumbnail
- "New" badge for recently launched products

### Task 9.2: Create TikTok Content Batch

For each product launched, record or script 3-5 videos following the content formula from the design doc:

1. Hook video (screen recording of building it)
2. Result video (polished product showcase)
3. Why video (problem it solves)
4. BTS video (day-in-my-life building digital products)

**Claude's role:** Write the scripts, suggest hooks, create thumbnail concepts. Aaron films and posts.

### Task 9.3: Set Up Email List

**Files:**
- Modify: `products/hub/src/app/page.tsx` — add email signup form

Options (in order of simplicity):
1. **Buttondown** — free tier, simple API, no-code embed
2. **ConvertKit free tier** — more features, landing page builder
3. **Mailchimp free tier** — most well-known

Add signup form to the hub page footer. Offer a free lead magnet (5 free prompts from the prompt pack) as incentive.

---

## Execution Order Summary

| Day | Task | Product |
|-----|------|---------|
| Day 1 | 0.1, 0.2 | Hub page + Gumroad setup |
| Day 1-2 | 1.1 | AI Prompt Pack |
| Day 2-3 | 2.1 | Wallpaper Pack |
| Day 3-5 | 3.1 | Notion Template Pack (specs + Aaron builds in Notion) |
| Day 5-7 | 4.1 | Build-in-Public Content Kit |
| Day 7-10 | 5.1 | Landing Page Templates |
| Day 10-14 | 6.1 | Solo Founder Dashboard |
| Day 14-18 | 7.1 | AI Business Blueprint |
| Day 18+ | 8.1 | Micro SaaS (after audience data) |
| Ongoing | 9.1-9.3 | Marketing + hub updates |

**Throughout:** Film TikToks while building each product. Every build session = content.
