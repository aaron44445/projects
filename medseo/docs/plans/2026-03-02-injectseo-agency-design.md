# InjectSEO - AI-Automated Med Spa SEO Agency Design

**Date:** 2026-03-02
**Status:** Approved
**Domain:** injectseo.com

## Overview

InjectSEO is an AI-automated SEO agency targeting med spas. Aaron handles sales and outreach, Seth handles fulfillment. The platform is a Next.js web app that serves double duty: public-facing agency website AND internal AI-powered sales tools.

**Outreach channel:** Cold DMs on Instagram (automated via OpenCLAW)
**Service offering:** SEO + Content Marketing (monthly retainer)
**Sales flow:** DM > Book a call (Calendly) > Walk through AI-generated audit > Send proposal > Close

## Brand Identity

- **Name:** InjectSEO
- **Domain:** injectseo.com (~$7/yr on Namecheap)
- **Concept:** "Clinical Growth" - SEO as surgical precision for digital presence
- **Palette:** Dark Slate (#0A0A0B) background, Bio-Lume Green (#00FF8F) accents, Clinical Teal (#2DD4BF) interactive elements
- **Typography:** Space Grotesk (headings), JetBrains Mono (data/UI)
- **Aesthetic:** High-tech medical dashboard meets Vercel/Baseten design language - dark, technical, polished

## Website Design (Public Pages)

### Visual Foundation
- Dark slate background with dotted grid overlay (10% opacity)
- Cursor follower (15px soft circle, expands to 40px glow on interactive elements)
- Micro-transitions: 200ms cubic-bezier(0.4, 0, 0.2, 1), Y(-4px) lift on hover
- Fixed minimal top nav: Work, Method, Pricing, "Book Audit" CTA
- Border beam cards (animated light traveling around card edges)

### Section 1: Hero (Full-Screen)
- 3D abstract wireframe face composed of dotted lines (center-right)
- Data nodes (Keywords, Backlinks, Revenue) float and "inject" into the wireframe on scroll
- Heading: "Growth is a Science." (Space Grotesk, 120px)
- Sub-heading: "Precision SEO for Aesthetic Practices. We don't guess; we diagnose." (JetBrains Mono)
- CTA: "Get Diagnostic" button with border beam animation

### Section 2: Horizontal Case Study Gallery
- Immersive zoom transition into clinical dashboard aesthetic
- Vertical scroll triggers horizontal slide through case studies
- Cards numbered 01, 02, 03 in JetBrains Mono
- Before/after traffic graphs in dotted line style
- Hover: scale(1.02) + soft glow behind card

### Section 3: "Inference Stack" (Process)
- Vertical dotted line down center
- Step 1: The Audit - animated terminal window "Scanning site health..."
- Step 2: The Injection - content blocks sliding into skeleton UI
- Step 3: The Result - revenue ticker counting up in JetBrains Mono

### Additional Pages
- **Case Studies:** Detailed results (placeholder content initially, real data as clients come in)
- **About:** Team intro, specialization story
- **Pricing:** Monthly retainer tiers or "Book a Call" approach
- **Book a Call:** Calendly embed

### Form UI
- Floating labels (never inside input), Space Grotesk 14px, 70% opacity
- Dark grey input background, 1px border
- Focus: 3px teal ring + box-shadow glow
- Error handling: button glows red, JetBrains Mono "Status Log" lists errors below

## Internal Dashboard (Behind Auth)

### Tool 1: Lead Finder & Qualifier
- Search by city/state to find med spas
- Pulls from Google Maps API (name, website, address, phone, reviews, rating)
- AI scores leads: "High Priority" (weak SEO) vs "Low Priority" (good SEO)
- Saves to lead tracker

### Tool 2: DM Generator
- Input: med spa website URL or Instagram handle
- AI analyzes online presence (site quality, content, social activity)
- Outputs: 3 personalized DM variations referencing specific details about their business
- Follow-up messages for Day 3, Day 7, Day 14
- Copy-to-clipboard functionality

### Tool 3: SEO Audit Report Generator
- Input: med spa website URL
- Analyzes: page speed, meta tags, mobile-friendliness, content quality, local SEO, Google Business Profile
- Output: professional branded PDF report with InjectSEO logo
- Used as lead magnet in DMs and on sales calls

### Tool 4: Proposal Generator
- Input: client name, services discussed, monthly price, call notes
- Output: polished branded PDF proposal (scope, timeline, deliverables, pricing)

### Tool 5: Lead Tracker (CRM)
- Table view of all leads
- Pipeline stages: New > DMed > Replied > Call Booked > Proposal Sent > Closed > Lost
- Notes field, follow-up dates
- Quick stats: DMs sent this week, reply rate, calls booked

## Tech Architecture

```
injectseo.com (Vercel - FREE)
+-- Public Pages
|   +-- Landing page (hero, services, process, FAQ, CTA)
|   +-- Case studies page
|   +-- About page
|   +-- Book a call (Calendly embed)
|
+-- Internal Dashboard (behind auth)
|   +-- Lead Finder (Google Maps > scored leads)
|   +-- DM Generator (URL > personalized DMs)
|   +-- SEO Audit Generator (URL > branded PDF report)
|   +-- Proposal Generator (inputs > branded proposal PDF)
|   +-- Lead Tracker (simple CRM table)
|
+-- Tech Stack
|   +-- Next.js 15 (App Router)
|   +-- Tailwind CSS + shadcn/ui
|   +-- Claude API (AI features)
|   +-- Puppeteer/Lighthouse (site analysis)
|   +-- jsPDF or React-PDF (document generation)
|
+-- External Services
    +-- Calendly (free - call booking)
    +-- Stripe (free until paid - invoicing)
    +-- OpenCLAW (outreach automation)
    +-- Namecheap/Cloudflare (domain ~$7-9/yr)
```

## Monthly Costs

| Item | Cost |
|------|------|
| Vercel hosting | $0 (free tier) |
| Domain | ~$0.60/mo ($7/yr) |
| Claude API | ~$5-15/mo (usage-based) |
| Calendly | $0 (free tier) |
| Stripe | $0 (until processing payments) |
| **Total** | **~$6-16/mo** |

## Sales Flow

1. OpenCLAW agents send personalized DMs (content generated by DM Generator tool)
2. Interested prospect replies
3. Send Calendly link to book a 30-min strategy call
4. Before call: generate SEO audit report for their site
5. On call: walk through audit findings, present approach
6. After call: send AI-generated proposal
7. Client signs contract + pays via Stripe
8. Hand off to Seth with client brief (auto-generated from audit + call notes)

## Instagram Profile

- **Handle:** @injectseo (or closest available)
- **Bio:** "We help med spas dominate Google | SEO + Content Marketing | Free SEO Audit"
- **Link:** injectseo.com
- **Starter content:** 6-9 posts before outreach (SEO tips, stats, audit mockups)

## DM Sequence (Content Templates for OpenCLAW)

- **Day 0:** Personalized DM referencing specific aspects of their business
- **Day 3:** Soft follow-up ("Just wanted to make sure this didn't get buried...")
- **Day 7:** Value-add (share relevant tip or stat)
- **Day 14:** Final follow-up ("No worries if timing isn't right...")

## Contract & Payment

- Service agreement template (PDF) covering scope, retainer, cancellation terms
- Stripe checkout or invoice link for monthly retainer
- Simple onboarding intake form for new clients
