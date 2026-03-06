# Prompt Vault Sales Site — Design

## Goal

Standalone sales page at `vault.aaronmcbride.com` that sells the AI Prompt Vault PDF for $9 via Stripe Checkout. After payment, buyer is redirected to a download page.

## Architecture

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS — dark mode, Syne + DM Sans fonts, lime-green accent (#e4ff54)
- **Payments:** Stripe Checkout (hosted) — no custom payment forms
- **Hosting:** Vercel, separate deploy from hub app
- **PDF hosting:** Stored in `/public` directory, served via download link on success page
- **Domain:** `vault.aaronmcbride.com` (subdomain of personal brand domain)

## Pages

### 1. `/` — Sales Landing Page

Single-page sales pitch with these sections:

- **Hero:** Title ("The AI Prompt Vault"), subtitle, price ($9), primary CTA button
- **Hook:** "Like a $500 coaching session for the price of a coffee"
- **What's Inside:** 5 categories with all 20 prompt names listed
- **How It Works:** 3 steps (copy prompt → AI asks diagnostic questions → get personalized guidance)
- **FAQ:** Common questions (works with free ChatGPT, reusable, PDF format, refund policy)
- **Final CTA:** Repeat buy button at bottom

CTA button hits `/api/checkout` to create Stripe session.

### 2. `/api/checkout` — API Route

- Creates a Stripe Checkout Session
- Product: "The AI Prompt Vault" — $9, one-time payment
- Success URL: `/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `/`
- Redirects browser to Stripe's hosted checkout page

### 3. `/success` — Download Page

- Receives `session_id` query parameter from Stripe redirect
- Server-side: verifies the session ID with Stripe API to confirm payment
- If valid: shows download button linking to the PDF
- If invalid: shows error message with link back to home

## Stripe Flow

```
User clicks "Get the Vault — $9"
  → POST /api/checkout
  → Creates Stripe Checkout Session ($9 one-time)
  → Redirects to checkout.stripe.com
  → User pays
  → Stripe redirects to /success?session_id=xxx
  → Success page verifies session via Stripe API
  → Shows PDF download button
```

## Design System

Matches existing hub app:
- Background: #060608
- Surface: #0e0e12
- Text: #f0ece4
- Text dim: #8a8680
- Accent: #e4ff54 (lime-green)
- Display font: Syne
- Body font: DM Sans
- Mono font: JetBrains Mono

## Not Included (YAGNI)

- No user accounts or auth
- No email collection
- No admin dashboard
- No analytics beyond Vercel built-in
- No multiple products — single product site
