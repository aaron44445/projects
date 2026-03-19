# Scripture Study & Accountability App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal mobile-first PWA for daily LDS scripture study and masturbation accountability, powered by Gemini AI and backed by Supabase.

**Architecture:** Next.js 15 App Router with a route group `(app)` for the 4-tab experience behind a PIN lock. All AI and DB calls go through API routes (server-side only). Static JSON provides scripture metadata for the reading plan; emergency scriptures include full verse text. Supabase Postgres stores all user state.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase (Postgres), Google Gemini API, Vercel

**Spec:** `docs/superpowers/specs/2026-03-19-scripture-accountability-app-design.md`

---

## File Structure

```
scripture-app/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker
│   └── icons/                     # PWA icons (192x192, 512x512)
├── data/
│   ├── reading-order.json         # Master sequential order of all books
│   ├── emergency-scriptures.json  # ~50 curated verses with full text
│   └── scriptures/                # One JSON per book (metadata only)
│       ├── 1-nephi.json
│       ├── 2-nephi.json
│       ├── ... (all Book of Mormon books)
│       ├── genesis.json
│       ├── ... (all Bible books)
│       ├── dc.json
│       ├── moses.json
│       ├── abraham.json
│       ├── joseph-smith-matthew.json
│       └── joseph-smith-history.json
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (dark theme, fonts)
│   │   ├── page.tsx               # PIN entry / first-time setup
│   │   ├── globals.css            # Tailwind + custom dark theme
│   │   ├── (app)/
│   │   │   ├── layout.tsx         # Tab bar layout (authenticated shell)
│   │   │   ├── study/page.tsx     # Study tab
│   │   │   ├── journal/page.tsx   # Journal tab
│   │   │   ├── streak/page.tsx    # Streak tab
│   │   │   └── dashboard/page.tsx # Dashboard tab
│   │   └── api/
│   │       ├── pin/route.ts       # POST: set/verify PIN
│   │       ├── reading/route.ts   # GET: today's reading, POST: mark complete
│   │       ├── journal/route.ts   # GET: entries, POST: new entry
│   │       ├── streak/route.ts    # GET: current streak, POST: reset
│   │       ├── settings/route.ts  # GET/POST: user config
│   │       └── ai/
│   │           ├── reflect/route.ts      # POST: generate reflection question
│   │           ├── checkin/route.ts       # POST: respond to check-in
│   │           ├── trigger/route.ts       # POST: respond to trigger journal
│   │           ├── emergency/route.ts     # GET: personalized emergency scripture
│   │           └── adjust-plan/route.ts   # POST: analyze journals, adjust plan
│   ├── components/
│   │   ├── tab-bar.tsx            # Bottom tab navigation
│   │   ├── pin-screen.tsx         # PIN entry / setup component
│   │   ├── mood-selector.tsx      # 1-5 mood scale buttons
│   │   ├── study/
│   │   │   ├── reading-card.tsx       # Today's reading display + mark complete
│   │   │   └── reflection-prompt.tsx  # AI reflection Q + response form
│   │   ├── journal/
│   │   │   ├── struggle-form.tsx      # "I'm struggling" trigger entry
│   │   │   ├── checkin-form.tsx       # Morning/evening check-in
│   │   │   └── ai-response-card.tsx   # Display AI response
│   │   ├── streak/
│   │   │   ├── streak-counter.tsx     # Big clean days number
│   │   │   ├── emergency-button.tsx   # Panic button
│   │   │   ├── emergency-overlay.tsx  # Full-screen scripture
│   │   │   └── calendar-heatmap.tsx   # Monthly calendar view
│   │   └── dashboard/
│   │       ├── stats-overview.tsx     # Both streaks + cycle badge
│   │       └── settings-panel.tsx     # Change PIN, reset plan
│   └── lib/
│       ├── supabase.ts            # Supabase server client
│       ├── gemini.ts              # Gemini API client
│       ├── pin-hash.ts            # Shared PIN hashing utility
│       ├── reading-plan.ts        # Reading plan logic (next chapter, advance, cycle)
│       ├── session.ts             # PIN session token (localStorage)
│       └── types.ts               # Shared TypeScript types
├── __tests__/
│   └── lib/
│       ├── reading-plan.test.ts   # Reading plan logic tests
│       └── session.test.ts        # Session token tests
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # All tables
├── .env.local.example             # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.env.local.example`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Initialize Next.js 15 project**

```bash
cd C:/projects/scripture-app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

Select: Yes to all defaults. This creates the Next.js scaffold with App Router, TypeScript, Tailwind, and pnpm.

- [ ] **Step 2: Install dependencies**

```bash
pnpm add @supabase/supabase-js @google/generative-ai
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Add test script to package.json**

Add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Create env template**

Create `.env.local.example`:
```
GEMINI_API_KEY=your-google-gemini-api-key
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

- [ ] **Step 6: Set up dark theme globals**

Replace `src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --accent-gold: #d4a843;
  --accent-blue: #3b82f6;
  --accent-green: #22c55e;
  --accent-red: #ef4444;
  --emergency: #dc2626;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

* {
  -webkit-overflow-scrolling: touch;
}
```

- [ ] **Step 7: Set up root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scripture Study",
  description: "Personal scripture study & accountability",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[var(--bg-primary)]">{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Verify build works**

```bash
pnpm build
```

Expected: Successful build with no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind, Vitest, and dark theme"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Define all shared types**

Create `src/lib/types.ts`:

```typescript
export interface UserConfig {
  id: string;
  pin_hash: string;
  current_book: string;
  current_chapter: number;
  study_streak: number;
  longest_study_streak: number;
  cycles_completed: number;
  created_at: string;
  updated_at: string;
}

export interface ReadingLog {
  id: string;
  date: string;
  book: string;
  chapter: number;
  completed: boolean;
  is_ai_adjusted: boolean;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  type: "reflection" | "trigger" | "checkin_morning" | "checkin_evening";
  reading_log_id: string | null;
  content: string;
  ai_prompt: string | null;
  mood: number | null;
  clean_today: boolean | null;
  ai_response: string | null;
  created_at: string;
}

export interface CleanStreak {
  id: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  created_at: string;
}

export interface AiAdjustment {
  id: string;
  detected_theme: string;
  reasoning: string;
  scriptures: { book: string; chapter: number }[];
  original_position: { book: string; chapter: number };
  created_at: string;
}

export interface EmergencyLog {
  id: string;
  scripture_ref: string;
  shown_at: string;
}

export interface ScriptureBook {
  id: string;
  name: string;
  chapters: number;
  volume: "book-of-mormon" | "old-testament" | "new-testament" | "doctrine-and-covenants" | "pearl-of-great-price";
}

export interface EmergencyScripture {
  ref: string;
  text: string;
  theme: "strength" | "temptation" | "love" | "hope" | "atonement" | "self-mastery";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared TypeScript types for all database tables and data"
```

---

## Task 3: Supabase Schema & Client

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`, `src/lib/supabase.ts`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- User configuration (single row for single user)
create table user_config (
  id uuid primary key default gen_random_uuid(),
  pin_hash text not null,
  current_book text not null default '1-nephi',
  current_chapter int not null default 1,
  study_streak int not null default 0,
  longest_study_streak int not null default 0,
  cycles_completed int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reading log (one row per daily reading)
create table reading_log (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  book text not null,
  chapter int not null,
  completed boolean not null default false,
  is_ai_adjusted boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index idx_reading_log_date on reading_log(date);

-- Journal entries (all types: reflection, trigger, check-ins)
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('reflection', 'trigger', 'checkin_morning', 'checkin_evening')),
  reading_log_id uuid references reading_log(id),
  content text,
  ai_prompt text,
  mood int check (mood between 1 and 5),
  clean_today boolean,
  ai_response text,
  created_at timestamptz not null default now()
);

create index idx_journal_type on journal_entries(type);
create index idx_journal_created on journal_entries(created_at desc);

-- Clean streak history
create table clean_streak (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

-- AI reading plan adjustments
create table ai_adjustments (
  id uuid primary key default gen_random_uuid(),
  detected_theme text not null,
  reasoning text not null,
  scriptures jsonb not null,
  original_position jsonb not null,
  created_at timestamptz not null default now()
);

-- Emergency scripture display log
create table emergency_log (
  id uuid primary key default gen_random_uuid(),
  scripture_ref text not null,
  shown_at timestamptz not null default now()
);
```

- [ ] **Step 2: Create Supabase server client**

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

- [ ] **Step 3: Commit**

```bash
git add supabase/ src/lib/supabase.ts
git commit -m "feat: add Supabase schema migration and server client"
```

---

## Task 4: Scripture Data Files

**Files:**
- Create: `data/reading-order.json`, `data/emergency-scriptures.json`, `data/scriptures/*.json`

- [ ] **Step 1: Create reading-order.json**

Create `data/reading-order.json` — the master sequential order of all books. Each entry has `id`, `name`, `chapters`, and `volume`. This file defines the reading plan path.

The full list includes:
- Book of Mormon: 15 books (1 Nephi through Moroni)
- Old Testament: 39 books (Genesis through Malachi)
- New Testament: 27 books (Matthew through Revelation)
- Doctrine & Covenants: 1 entry (138 sections + OD1 + OD2, treated as 140 chapters)
- Pearl of Great Price: 4 books (Moses, Abraham, JS-Matthew, JS-History)

Example structure:
```json
[
  { "id": "1-nephi", "name": "1 Nephi", "chapters": 22, "volume": "book-of-mormon" },
  { "id": "2-nephi", "name": "2 Nephi", "chapters": 33, "volume": "book-of-mormon" },
  ...
]
```

Generate the complete file with all ~87 books and accurate chapter counts from publicly available LDS scripture indexes.

- [ ] **Step 2: Create individual book JSON files**

For each entry in `reading-order.json`, create a corresponding file in `data/scriptures/`. Each file is simple metadata:

```json
{
  "id": "1-nephi",
  "name": "1 Nephi",
  "volume": "book-of-mormon",
  "chapters": 22
}
```

These files exist so individual book data can be loaded on demand if needed, but the reading plan primarily uses `reading-order.json`.

- [ ] **Step 3: Create emergency-scriptures.json**

Create `data/emergency-scriptures.json` with ~50 curated scriptures. Each has `ref`, `text`, and `theme`. Themes: `strength`, `temptation`, `love`, `hope`, `atonement`, `self-mastery`.

Example entries:
```json
[
  {
    "ref": "philippians-4:13",
    "text": "I can do all things through Christ which strengtheneth me.",
    "theme": "strength"
  },
  {
    "ref": "1-corinthians-10:13",
    "text": "There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it.",
    "theme": "temptation"
  },
  ...
]
```

Include verses from all standard works covering all 6 themes. Use KJV for Bible, standard LDS text for others.

- [ ] **Step 4: Commit**

```bash
git add data/
git commit -m "feat: add scripture reading order, book metadata, and emergency scriptures"
```

---

## Task 5: Reading Plan Logic (TDD)

**Files:**
- Create: `src/lib/reading-plan.ts`, `__tests__/lib/reading-plan.test.ts`

- [ ] **Step 1: Write failing tests for reading plan**

Create `__tests__/lib/reading-plan.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  getNextReading,
  advanceReading,
  getTotalChapters,
} from "@/lib/reading-plan";

describe("reading-plan", () => {
  describe("getNextReading", () => {
    it("returns first chapter of first book at start", () => {
      const reading = getNextReading("1-nephi", 1);
      expect(reading).toEqual({ book: "1-nephi", bookName: "1 Nephi", chapter: 1 });
    });

    it("returns correct chapter mid-book", () => {
      const reading = getNextReading("1-nephi", 15);
      expect(reading).toEqual({ book: "1-nephi", bookName: "1 Nephi", chapter: 15 });
    });
  });

  describe("advanceReading", () => {
    it("advances to next chapter in same book", () => {
      const next = advanceReading("1-nephi", 1);
      expect(next).toEqual({ book: "1-nephi", chapter: 2, cycleCompleted: false });
    });

    it("advances to next book at end of current book", () => {
      const next = advanceReading("1-nephi", 22);
      expect(next).toEqual({ book: "2-nephi", chapter: 1, cycleCompleted: false });
    });

    it("cycles back to 1 Nephi after last book", () => {
      // Joseph Smith—History has 1 chapter, it's the last book
      const next = advanceReading("joseph-smith-history", 1);
      expect(next).toEqual({ book: "1-nephi", chapter: 1, cycleCompleted: true });
    });
  });

  describe("getTotalChapters", () => {
    it("returns total chapters across all standard works", () => {
      const total = getTotalChapters();
      expect(total).toBeGreaterThan(1000);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- __tests__/lib/reading-plan.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement reading plan logic**

Create `src/lib/reading-plan.ts`:

```typescript
import readingOrder from "../../../data/reading-order.json";

interface Reading {
  book: string;
  bookName: string;
  chapter: number;
}

interface AdvanceResult {
  book: string;
  chapter: number;
  cycleCompleted: boolean;
}

const books: { id: string; name: string; chapters: number }[] = readingOrder;

export function getNextReading(currentBook: string, currentChapter: number): Reading {
  const book = books.find((b) => b.id === currentBook);
  if (!book) throw new Error(`Unknown book: ${currentBook}`);
  return { book: book.id, bookName: book.name, chapter: currentChapter };
}

export function advanceReading(currentBook: string, currentChapter: number): AdvanceResult {
  const bookIndex = books.findIndex((b) => b.id === currentBook);
  if (bookIndex === -1) throw new Error(`Unknown book: ${currentBook}`);

  const book = books[bookIndex];

  if (currentChapter < book.chapters) {
    return { book: currentBook, chapter: currentChapter + 1, cycleCompleted: false };
  }

  if (bookIndex < books.length - 1) {
    return { book: books[bookIndex + 1].id, chapter: 1, cycleCompleted: false };
  }

  return { book: books[0].id, chapter: 1, cycleCompleted: true };
}

export function getTotalChapters(): number {
  return books.reduce((sum, b) => sum + b.chapters, 0);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- __tests__/lib/reading-plan.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reading-plan.ts __tests__/lib/reading-plan.test.ts
git commit -m "feat: add reading plan logic with next/advance/total functions (TDD)"
```

---

## Task 6: Session Management (TDD)

**Files:**
- Create: `src/lib/session.ts`, `__tests__/lib/session.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/session.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSession, validateSession, clearSession } from "@/lib/session";

describe("session", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates a session token in localStorage", () => {
    createSession();
    expect(localStorage.getItem("session_token")).toBeTruthy();
    expect(localStorage.getItem("session_expiry")).toBeTruthy();
  });

  it("validates a fresh session", () => {
    createSession();
    expect(validateSession()).toBe(true);
  });

  it("rejects expired session", () => {
    createSession();
    const pastExpiry = Date.now() - 1000;
    localStorage.setItem("session_expiry", pastExpiry.toString());
    expect(validateSession()).toBe(false);
  });

  it("rejects missing session", () => {
    expect(validateSession()).toBe(false);
  });

  it("clears session", () => {
    createSession();
    clearSession();
    expect(localStorage.getItem("session_token")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- __tests__/lib/session.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement session management**

Create `src/lib/session.ts`:

```typescript
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createSession(): void {
  const token = crypto.randomUUID();
  const expiry = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem("session_token", token);
  localStorage.setItem("session_expiry", expiry.toString());
}

export function validateSession(): boolean {
  const token = localStorage.getItem("session_token");
  const expiry = localStorage.getItem("session_expiry");
  if (!token || !expiry) return false;
  return Date.now() < parseInt(expiry, 10);
}

export function clearSession(): void {
  localStorage.removeItem("session_token");
  localStorage.removeItem("session_expiry");
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- __tests__/lib/session.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/session.ts __tests__/lib/session.test.ts
git commit -m "feat: add PIN session management with 24-hour expiry (TDD)"
```

---

## Task 7: Gemini Client

**Files:**
- Create: `src/lib/gemini.ts`

- [ ] **Step 1: Create Gemini client wrapper**

Create `src/lib/gemini.ts`:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function askGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    systemInstruction: { role: "model", parts: [{ text: systemPrompt }] },
  });
  return result.response.text();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/gemini.ts
git commit -m "feat: add Gemini API client wrapper"
```

---

## Task 8: PIN Hash Utility & PIN API Route

**Files:**
- Create: `src/lib/pin-hash.ts`, `src/app/api/pin/route.ts`

- [ ] **Step 1: Create shared PIN hash utility**

Create `src/lib/pin-hash.ts`:

```typescript
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "scripture-app-salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

- [ ] **Step 2: Implement PIN set/verify endpoint**

Create `src/app/api/pin/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPin } from "@/lib/pin-hash";

export async function POST(req: NextRequest) {
  const { pin, action } = await req.json();

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
  }

  const pinHash = await hashPin(pin);

  if (action === "setup") {
    const { data: existing } = await supabase.from("user_config").select("id").limit(1).single();

    if (existing) {
      return NextResponse.json({ error: "PIN already set" }, { status: 409 });
    }

    const { error } = await supabase.from("user_config").insert({ pin_hash: pinHash });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Also create initial clean streak
    await supabase.from("clean_streak").insert({ start_date: new Date().toISOString().split("T")[0], is_current: true });

    return NextResponse.json({ success: true });
  }

  if (action === "verify") {
    const { data } = await supabase.from("user_config").select("pin_hash").limit(1).single();

    if (!data) {
      return NextResponse.json({ needsSetup: true }, { status: 404 });
    }

    const valid = data.pin_hash === pinHash;
    return NextResponse.json({ valid });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET() {
  const { data } = await supabase.from("user_config").select("id").limit(1).single();
  return NextResponse.json({ hasPin: !!data });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/pin-hash.ts src/app/api/pin/route.ts
git commit -m "feat: add PIN hash utility and PIN setup/verification API route"
```

---

## Task 9: PIN Screen Component

**Files:**
- Create: `src/components/pin-screen.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Create PIN screen component**

Create `src/components/pin-screen.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";

interface PinScreenProps {
  onSuccess: () => void;
}

export default function PinScreen({ onSuccess }: PinScreenProps) {
  const [pin, setPin] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pin")
      .then((r) => r.json())
      .then((data) => {
        setIsSetup(!data.hasPin);
        setLoading(false);
      });
  }, []);

  const handleDigit = (d: string) => {
    setError("");
    if (step === "enter" && pin.length < 4) {
      const newPin = pin + d;
      setPin(newPin);
      if (newPin.length === 4) {
        if (isSetup) {
          setStep("confirm");
          setPin(newPin);
        } else {
          verifyPin(newPin);
        }
      }
    } else if (step === "confirm" && confirmPin.length < 4) {
      const newConfirm = confirmPin + d;
      setConfirmPin(newConfirm);
      if (newConfirm.length === 4) {
        if (newConfirm === pin) {
          setupPin(pin);
        } else {
          setError("PINs don't match");
          setConfirmPin("");
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === "confirm") {
      setConfirmPin((p) => p.slice(0, -1));
    } else {
      setPin((p) => p.slice(0, -1));
    }
    setError("");
  };

  async function verifyPin(p: string) {
    const res = await fetch("/api/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: p, action: "verify" }),
    });
    const data = await res.json();
    if (data.valid) {
      onSuccess();
    } else {
      setError("Wrong PIN");
      setPin("");
    }
  }

  async function setupPin(p: string) {
    const res = await fetch("/api/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: p, action: "setup" }),
    });
    const data = await res.json();
    if (data.success) {
      onSuccess();
    } else {
      setError("Setup failed");
      setPin("");
      setConfirmPin("");
      setStep("enter");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  const activePin = step === "confirm" ? confirmPin : pin;

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6">
      <h1 className="text-2xl font-semibold mb-2">
        {isSetup ? (step === "confirm" ? "Confirm PIN" : "Create PIN") : "Enter PIN"}
      </h1>
      <p className="text-[var(--text-secondary)] text-sm mb-8">
        {isSetup
          ? step === "confirm"
            ? "Enter your PIN again to confirm"
            : "Choose a 4-digit PIN to protect your app"
          : "Enter your 4-digit PIN"}
      </p>

      {/* PIN dots */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 border-[var(--accent-gold)] ${
              i < activePin.length ? "bg-[var(--accent-gold)]" : ""
            }`}
          />
        ))}
      </div>

      {error && <p className="text-[var(--accent-red)] text-sm mb-4">{error}</p>}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleDigit(n.toString())}
            className="h-16 rounded-xl bg-[var(--bg-secondary)] text-2xl font-medium active:bg-[var(--accent-blue)] transition-colors"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit("0")}
          className="h-16 rounded-xl bg-[var(--bg-secondary)] text-2xl font-medium active:bg-[var(--accent-blue)] transition-colors"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-16 rounded-xl bg-[var(--bg-secondary)] text-lg active:bg-[var(--accent-red)] transition-colors"
        >
          ←
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create root page with PIN gate**

Replace `src/app/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PinScreen from "@/components/pin-screen";
import { validateSession, createSession } from "@/lib/session";

export default function Home() {
  const router = useRouter();
  const [needsPin, setNeedsPin] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (validateSession()) {
      router.replace("/study");
    } else {
      setNeedsPin(true);
      setChecking(false);
    }
  }, [router]);

  function handlePinSuccess() {
    createSession();
    router.replace("/study");
  }

  if (checking) return null;
  if (needsPin) return <PinScreen onSuccess={handlePinSuccess} />;
  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pin-screen.tsx src/app/page.tsx
git commit -m "feat: add PIN screen with numpad, setup flow, and session gate"
```

---

## Task 10: Tab Bar & App Shell

**Files:**
- Create: `src/components/tab-bar.tsx`, `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create tab bar component**

Create `src/components/tab-bar.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const tabs = [
  { href: "/study", label: "Study", icon: "📖" },
  { href: "/journal", label: "Journal", icon: "✍️" },
  { href: "/streak", label: "Streak", icon: "🔥" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                active ? "text-[var(--accent-gold)]" : "text-[var(--text-secondary)]"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create app layout with tab bar**

Create `src/app/(app)/layout.tsx`:

```tsx
import TabBar from "@/components/tab-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-20">
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
      <TabBar />
    </div>
  );
}
```

- [ ] **Step 3: Create placeholder pages for all 4 tabs**

Create `src/app/(app)/study/page.tsx`:
```tsx
export default function StudyPage() {
  return <h1 className="text-xl font-semibold">Study</h1>;
}
```

Create `src/app/(app)/journal/page.tsx`:
```tsx
export default function JournalPage() {
  return <h1 className="text-xl font-semibold">Journal</h1>;
}
```

Create `src/app/(app)/streak/page.tsx`:
```tsx
export default function StreakPage() {
  return <h1 className="text-xl font-semibold">Streak</h1>;
}
```

Create `src/app/(app)/dashboard/page.tsx`:
```tsx
export default function DashboardPage() {
  return <h1 className="text-xl font-semibold">Dashboard</h1>;
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

Expected: Successful build.

- [ ] **Step 5: Commit**

```bash
git add src/components/tab-bar.tsx src/app/"(app)"
git commit -m "feat: add bottom tab bar navigation and app shell with 4 placeholder pages"
```

---

## Task 11: Reading API Route

**Files:**
- Create: `src/app/api/reading/route.ts`

- [ ] **Step 1: Implement reading endpoints**

Create `src/app/api/reading/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getNextReading, advanceReading } from "@/lib/reading-plan";
import readingOrder from "../../../../data/reading-order.json";

// GET: today's reading assignment (checks for active AI adjustments first)
export async function GET() {
  const { data: config } = await supabase
    .from("user_config")
    .select("current_book, current_chapter, study_streak, longest_study_streak, cycles_completed")
    .limit(1)
    .single();

  if (!config) {
    return NextResponse.json({ error: "Not configured" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Check if today's reading already exists
  const { data: todayLog } = await supabase
    .from("reading_log")
    .select("*")
    .eq("date", today)
    .limit(1)
    .single();

  // Check for active AI adjustment (most recent adjustment with unfinished scriptures)
  const { data: activeAdjustment } = await supabase
    .from("ai_adjustments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let reading = getNextReading(config.current_book, config.current_chapter);
  let adjustmentNote: string | null = null;
  let isAiAdjusted = false;

  if (activeAdjustment && !todayLog) {
    const adjustedScriptures = activeAdjustment.scriptures as { book: string; chapter: number }[];
    // Count how many adjusted readings have been completed
    const { count } = await supabase
      .from("reading_log")
      .select("*", { count: "exact", head: true })
      .eq("is_ai_adjusted", true)
      .gte("created_at", activeAdjustment.created_at);

    const completedAdjusted = count ?? 0;

    if (completedAdjusted < adjustedScriptures.length) {
      const nextAdjusted = adjustedScriptures[completedAdjusted];
      const bookInfo = readingOrder.find((b) => b.id === nextAdjusted.book);
      reading = {
        book: nextAdjusted.book,
        bookName: bookInfo?.name ?? nextAdjusted.book,
        chapter: nextAdjusted.chapter,
      };
      adjustmentNote = `Based on what you've been going through, this chapter may speak to you right now. Theme: ${activeAdjustment.detected_theme}`;
      isAiAdjusted = true;
    }
  }

  return NextResponse.json({
    reading,
    todayLog,
    studyStreak: config.study_streak,
    longestStreak: config.longest_study_streak,
    cyclesCompleted: config.cycles_completed,
    adjustmentNote,
    isAiAdjusted,
  });
}

// POST: mark today's reading as complete
export async function POST(req: NextRequest) {
  const { book, chapter } = await req.json();
  const today = new Date().toISOString().split("T")[0];

  // Upsert today's reading log
  const { data: log, error: logError } = await supabase
    .from("reading_log")
    .upsert(
      { date: today, book, chapter, completed: true, is_ai_adjusted: false },
      { onConflict: "date" }
    )
    .select()
    .single();

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  // Advance reading position
  const next = advanceReading(book, chapter);

  // Update streak
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const { data: yesterdayLog } = await supabase
    .from("reading_log")
    .select("completed")
    .eq("date", yesterday)
    .eq("completed", true)
    .limit(1)
    .single();

  const { data: config } = await supabase
    .from("user_config")
    .select("study_streak, longest_study_streak, cycles_completed")
    .limit(1)
    .single();

  const currentStreak = yesterdayLog ? (config?.study_streak ?? 0) + 1 : 1;
  const longestStreak = Math.max(currentStreak, config?.longest_study_streak ?? 0);
  const cycles = (config?.cycles_completed ?? 0) + (next.cycleCompleted ? 1 : 0);

  await supabase
    .from("user_config")
    .update({
      current_book: next.book,
      current_chapter: next.chapter,
      study_streak: currentStreak,
      longest_study_streak: longestStreak,
      cycles_completed: cycles,
      updated_at: new Date().toISOString(),
    })
    .eq("id", config?.id ?? (await supabase.from("user_config").select("id").limit(1).single()).data?.id);

  return NextResponse.json({
    readingLog: log,
    next,
    studyStreak: currentStreak,
    cycleCompleted: next.cycleCompleted,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/reading/route.ts
git commit -m "feat: add reading API with today's assignment and mark-complete endpoints"
```

---

## Task 12: Study Tab Page

**Files:**
- Create: `src/components/study/reading-card.tsx`, `src/components/study/reflection-prompt.tsx`
- Modify: `src/app/(app)/study/page.tsx`

- [ ] **Step 1: Create reading card component**

Create `src/components/study/reading-card.tsx`:

```tsx
"use client";

interface ReadingCardProps {
  bookName: string;
  chapter: number;
  completed: boolean;
  studyStreak: number;
  onComplete: () => void;
  loading: boolean;
}

export default function ReadingCard({
  bookName,
  chapter,
  completed,
  studyStreak,
  onComplete,
  loading,
}: ReadingCardProps) {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[var(--text-secondary)]">Today&apos;s Reading</span>
        <span className="text-sm text-[var(--accent-gold)]">🔥 {studyStreak} day streak</span>
      </div>
      <h2 className="text-2xl font-bold mb-1">{bookName}</h2>
      <p className="text-[var(--text-secondary)] mb-6">Chapter {chapter}</p>
      <button
        onClick={onComplete}
        disabled={completed || loading}
        className={`w-full py-4 rounded-xl text-lg font-semibold transition-all ${
          completed
            ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]"
            : "bg-[var(--accent-gold)] text-[var(--bg-primary)] active:scale-[0.98]"
        }`}
      >
        {completed ? "✓ Completed" : loading ? "..." : "Mark Complete"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create reflection prompt component**

Create `src/components/study/reflection-prompt.tsx`:

```tsx
"use client";

import { useState } from "react";

interface ReflectionPromptProps {
  question: string;
  onSubmit: (response: string) => void;
  loading: boolean;
}

export default function ReflectionPrompt({ question, onSubmit, loading }: ReflectionPromptProps) {
  const [response, setResponse] = useState("");

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-6 mt-4">
      <h3 className="text-sm text-[var(--accent-gold)] mb-2">Reflect</h3>
      <p className="text-[var(--text-primary)] mb-4">{question}</p>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Write your thoughts..."
        className="w-full bg-[var(--bg-primary)] rounded-xl p-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none h-28 mb-3"
      />
      <div className="flex gap-3">
        <button
          onClick={() => onSubmit(response)}
          disabled={!response.trim() || loading}
          className="flex-1 py-3 rounded-xl bg-[var(--accent-blue)] text-white font-medium disabled:opacity-40"
        >
          {loading ? "..." : "Save"}
        </button>
        <button
          onClick={() => onSubmit("")}
          className="px-6 py-3 rounded-xl bg-[var(--bg-primary)] text-[var(--text-secondary)]"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire up study page**

Replace `src/app/(app)/study/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import ReadingCard from "@/components/study/reading-card";
import ReflectionPrompt from "@/components/study/reflection-prompt";

export default function StudyPage() {
  const [reading, setReading] = useState<{ book: string; bookName: string; chapter: number } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [studyStreak, setStudyStreak] = useState(0);
  const [reflection, setReflection] = useState<string | null>(null);
  const [loadingRead, setLoadingRead] = useState(true);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [loadingReflect, setLoadingReflect] = useState(false);
  const [adjustmentNote, setAdjustmentNote] = useState<string | null>(null);

  const fetchReading = useCallback(async () => {
    // Trigger AI plan analysis in the background (non-blocking)
    fetch("/api/ai/adjust-plan", { method: "POST" }).catch(() => {});

    const res = await fetch("/api/reading");
    const data = await res.json();
    setReading(data.reading);
    setCompleted(!!data.todayLog?.completed);
    setStudyStreak(data.studyStreak);
    setAdjustmentNote(data.adjustmentNote ?? null);
    setLoadingRead(false);
  }, []);

  useEffect(() => { fetchReading(); }, [fetchReading]);

  async function handleComplete() {
    if (!reading) return;
    setLoadingComplete(true);
    const res = await fetch("/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book: reading.book, chapter: reading.chapter }),
    });
    const data = await res.json();
    setCompleted(true);
    setStudyStreak(data.studyStreak);
    setLoadingComplete(false);

    // Fetch reflection question
    setLoadingReflect(true);
    const refRes = await fetch("/api/ai/reflect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book: reading.bookName, chapter: reading.chapter }),
    });
    const refData = await refRes.json();
    setReflection(refData.question);
    setLoadingReflect(false);
  }

  async function handleReflection(response: string) {
    if (!reading) return;
    if (response.trim()) {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reflection",
          content: response,
          ai_prompt: reflection,
        }),
      });
    }
    setReflection(null);
  }

  if (loadingRead) {
    return <div className="text-[var(--text-secondary)] text-center mt-20">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Scripture Study</h1>
      {adjustmentNote && (
        <div className="bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/30 rounded-xl p-4 mb-4 text-sm text-[var(--accent-gold)]">
          {adjustmentNote}
        </div>
      )}
      {reading && (
        <ReadingCard
          bookName={reading.bookName}
          chapter={reading.chapter}
          completed={completed}
          studyStreak={studyStreak}
          onComplete={handleComplete}
          loading={loadingComplete}
        />
      )}
      {completed && reflection && (
        <ReflectionPrompt
          question={reflection}
          onSubmit={handleReflection}
          loading={loadingReflect}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/study/ src/app/"(app)"/study/page.tsx
git commit -m "feat: build study tab with reading card, reflection prompts, and streak display"
```

---

## Task 13: AI Reflection & Check-in API Routes

**Files:**
- Create: `src/app/api/ai/reflect/route.ts`, `src/app/api/ai/checkin/route.ts`, `src/app/api/ai/trigger/route.ts`

- [ ] **Step 1: Create reflection API**

Create `src/app/api/ai/reflect/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { book, chapter } = await req.json();

  const systemPrompt = `You are a thoughtful LDS scripture study companion. Generate a single reflection question based on the scripture chapter the user just read. The question should:
- Connect the scripture to practical daily life
- Be personal and thought-provoking
- Be 1-2 sentences max
- Not be preachy or condescending
Do not include the scripture reference in your question. Just ask the question.`;

  const question = await askGemini(systemPrompt, `I just finished reading ${book} chapter ${chapter}.`);

  return NextResponse.json({ question: question.trim() });
}
```

- [ ] **Step 2: Create check-in response API**

Create `src/app/api/ai/checkin/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { type, content, mood, cleanToday } = await req.json();

  const timeOfDay = type === "checkin_morning" ? "morning" : "evening";
  const moodDesc = ["terrible", "rough", "okay", "good", "great"][mood - 1];

  let context = `It's ${timeOfDay}. I'm feeling ${moodDesc} (${mood}/5).`;
  if (content) context += ` ${content}`;
  if (typeof cleanToday === "boolean") {
    context += cleanToday ? " I stayed clean today." : " I slipped today.";
  }

  const systemPrompt = `You are a compassionate LDS accountability companion. Respond to this check-in with:
1. Brief empathetic acknowledgment (1 sentence)
2. A short relevant scripture reference with the verse text (1-2 sentences)
3. A word of encouragement (1 sentence)

Be genuine, not preachy. Keep the total response under 100 words. If they slipped, be compassionate — remind them of the Atonement and that every day is a fresh start. Never shame or guilt.`;

  const response = await askGemini(systemPrompt, context);

  return NextResponse.json({ response: response.trim() });
}
```

- [ ] **Step 3: Create trigger response API**

Create `src/app/api/ai/trigger/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { content } = await req.json();

  const systemPrompt = `You are a compassionate LDS accountability companion. The user is in a moment of temptation and reached out for help. Respond with:
1. Empathetic acknowledgment — validate that this is hard (1-2 sentences)
2. A relevant scripture about strength, self-mastery, or the Atonement — include the verse text (2-3 sentences)
3. A practical redirect — suggest one specific physical action they can do RIGHT NOW (go for a walk, do 20 push-ups, call a friend, pray, take a cold shower, etc.) (1-2 sentences)

Be warm and real. Not preachy. Under 120 words total. They're in a vulnerable moment — meet them with love.`;

  const response = await askGemini(systemPrompt, content);

  return NextResponse.json({ response: response.trim() });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ai/
git commit -m "feat: add AI API routes for reflection, check-in, and trigger responses"
```

---

## Task 14: Journal API Route

**Files:**
- Create: `src/app/api/journal/route.ts`

- [ ] **Step 1: Implement journal endpoints**

Create `src/app/api/journal/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: fetch journal entries (optionally filtered by type)
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10);

  let query = supabase
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data });
}

// POST: create a new journal entry
export async function POST(req: NextRequest) {
  const body = await req.json();

  const entry = {
    type: body.type,
    reading_log_id: body.reading_log_id ?? null,
    content: body.content ?? null,
    ai_prompt: body.ai_prompt ?? null,
    mood: body.mood ?? null,
    clean_today: body.clean_today ?? null,
    ai_response: body.ai_response ?? null,
  };

  const { data, error } = await supabase
    .from("journal_entries")
    .insert(entry)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/journal/route.ts
git commit -m "feat: add journal API route with GET (filtered) and POST endpoints"
```

---

## Task 15: Journal Tab Page

**Files:**
- Create: `src/components/journal/struggle-form.tsx`, `src/components/journal/checkin-form.tsx`, `src/components/journal/ai-response-card.tsx`, `src/components/mood-selector.tsx`
- Modify: `src/app/(app)/journal/page.tsx`

- [ ] **Step 1: Create mood selector**

Create `src/components/mood-selector.tsx`:

```tsx
"use client";

const moods = [
  { value: 1, emoji: "😞", label: "Terrible" },
  { value: 2, emoji: "😔", label: "Rough" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
];

interface MoodSelectorProps {
  value: number | null;
  onChange: (mood: number) => void;
}

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex justify-between gap-2">
      {moods.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
            value === m.value
              ? "bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]"
              : "bg-[var(--bg-primary)]"
          }`}
        >
          <span className="text-2xl">{m.emoji}</span>
          <span className="text-xs text-[var(--text-secondary)]">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create AI response card**

Create `src/components/journal/ai-response-card.tsx`:

```tsx
interface AiResponseCardProps {
  response: string;
}

export default function AiResponseCard({ response }: AiResponseCardProps) {
  return (
    <div className="bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/20 rounded-2xl p-5 mt-4">
      <p className="text-sm leading-relaxed whitespace-pre-line">{response}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create struggle form**

Create `src/components/journal/struggle-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import AiResponseCard from "./ai-response-card";

interface StruggleFormProps {
  onSaved: () => void;
}

export default function StruggleForm({ onSaved }: StruggleFormProps) {
  const [content, setContent] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);

    const aiRes = await fetch("/api/ai/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const aiData = await aiRes.json();
    setAiResponse(aiData.response);

    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "trigger",
        content,
        ai_response: aiData.response,
      }),
    });

    setLoading(false);
    onSaved();
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-1">I&apos;m struggling</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">Write what you&apos;re feeling. You&apos;re not alone.</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's going on right now..."
        className="w-full bg-[var(--bg-primary)] rounded-xl p-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none h-32 mb-3"
      />
      {!aiResponse && (
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          className="w-full py-3 rounded-xl bg-[var(--accent-blue)] text-white font-medium disabled:opacity-40"
        >
          {loading ? "Getting support..." : "Get Support"}
        </button>
      )}
      {aiResponse && <AiResponseCard response={aiResponse} />}
    </div>
  );
}
```

- [ ] **Step 4: Create check-in form**

Create `src/components/journal/checkin-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import MoodSelector from "@/components/mood-selector";
import AiResponseCard from "./ai-response-card";

interface CheckinFormProps {
  type: "checkin_morning" | "checkin_evening";
  onSaved: () => void;
}

export default function CheckinForm({ type, onSaved }: CheckinFormProps) {
  const [mood, setMood] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [cleanToday, setCleanToday] = useState<boolean | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isMorning = type === "checkin_morning";

  async function handleSubmit() {
    if (!mood) return;
    setLoading(true);

    const aiRes = await fetch("/api/ai/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content, mood, cleanToday }),
    });
    const aiData = await aiRes.json();
    setAiResponse(aiData.response);

    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        content: content || null,
        mood,
        clean_today: cleanToday,
        ai_response: aiData.response,
      }),
    });

    setLoading(false);
    onSaved();
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-1">
        {isMorning ? "Morning Check-in" : "Evening Check-in"}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        {isMorning ? "How are you feeling today?" : "How did today go?"}
      </p>

      <MoodSelector value={mood} onChange={setMood} />

      {!isMorning && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setCleanToday(true)}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              cleanToday === true
                ? "bg-[var(--accent-green)]/20 border border-[var(--accent-green)] text-[var(--accent-green)]"
                : "bg-[var(--bg-primary)] text-[var(--text-secondary)]"
            }`}
          >
            Stayed clean
          </button>
          <button
            onClick={() => setCleanToday(false)}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              cleanToday === false
                ? "bg-[var(--accent-red)]/20 border border-[var(--accent-red)] text-[var(--accent-red)]"
                : "bg-[var(--bg-primary)] text-[var(--text-secondary)]"
            }`}
          >
            I slipped
          </button>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Anything on your mind... (optional)"
        className="w-full bg-[var(--bg-primary)] rounded-xl p-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none h-20 mt-4 mb-3"
      />

      {!aiResponse && (
        <button
          onClick={handleSubmit}
          disabled={!mood || loading}
          className="w-full py-3 rounded-xl bg-[var(--accent-gold)] text-[var(--bg-primary)] font-semibold disabled:opacity-40"
        >
          {loading ? "..." : "Check In"}
        </button>
      )}
      {aiResponse && <AiResponseCard response={aiResponse} />}
    </div>
  );
}
```

- [ ] **Step 5: Wire up journal page**

Replace `src/app/(app)/journal/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import StruggleForm from "@/components/journal/struggle-form";
import CheckinForm from "@/components/journal/checkin-form";

type Mode = "menu" | "struggle" | "morning" | "evening";

export default function JournalPage() {
  const [mode, setMode] = useState<Mode>("menu");

  if (mode === "struggle") {
    return (
      <div>
        <button onClick={() => setMode("menu")} className="text-[var(--text-secondary)] mb-4">← Back</button>
        <StruggleForm onSaved={() => setMode("menu")} />
      </div>
    );
  }

  if (mode === "morning" || mode === "evening") {
    return (
      <div>
        <button onClick={() => setMode("menu")} className="text-[var(--text-secondary)] mb-4">← Back</button>
        <CheckinForm
          type={mode === "morning" ? "checkin_morning" : "checkin_evening"}
          onSaved={() => setMode("menu")}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Journal</h1>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setMode("struggle")}
          className="bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 rounded-2xl p-5 text-left"
        >
          <span className="text-lg font-semibold text-[var(--accent-red)]">I&apos;m struggling</span>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Get immediate support and encouragement</p>
        </button>
        <button
          onClick={() => setMode("morning")}
          className="bg-[var(--bg-card)] rounded-2xl p-5 text-left"
        >
          <span className="text-lg font-semibold">Morning Check-in</span>
          <p className="text-sm text-[var(--text-secondary)] mt-1">How are you feeling today?</p>
        </button>
        <button
          onClick={() => setMode("evening")}
          className="bg-[var(--bg-card)] rounded-2xl p-5 text-left"
        >
          <span className="text-lg font-semibold">Evening Check-in</span>
          <p className="text-sm text-[var(--text-secondary)] mt-1">How did today go?</p>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/journal/ src/components/mood-selector.tsx src/app/"(app)"/journal/page.tsx
git commit -m "feat: build journal tab with struggle form, check-ins, mood selector, and AI responses"
```

---

## Task 16: Streak API Route

**Files:**
- Create: `src/app/api/streak/route.ts`

- [ ] **Step 1: Implement streak endpoints**

Create `src/app/api/streak/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: current streak + history
export async function GET() {
  const { data: current } = await supabase
    .from("clean_streak")
    .select("*")
    .eq("is_current", true)
    .limit(1)
    .single();

  const { data: history } = await supabase
    .from("clean_streak")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  // Compute current days
  let currentDays = 0;
  if (current) {
    const start = new Date(current.start_date);
    const now = new Date();
    currentDays = Math.floor((now.getTime() - start.getTime()) / 86400000);
  }

  // Find longest streak
  const longestStreak = (history ?? []).reduce((max, s) => {
    const start = new Date(s.start_date);
    const end = s.end_date ? new Date(s.end_date) : new Date();
    const days = Math.floor((end.getTime() - start.getTime()) / 86400000);
    return Math.max(max, days);
  }, 0);

  // Get check-in calendar data (last 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: checkins } = await supabase
    .from("journal_entries")
    .select("created_at, clean_today")
    .eq("type", "checkin_evening")
    .gte("created_at", ninetyDaysAgo)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    currentDays,
    longestStreak,
    streakStart: current?.start_date,
    history,
    checkins: checkins ?? [],
  });
}

// POST: reset streak
export async function POST() {
  const today = new Date().toISOString().split("T")[0];

  // End current streak
  await supabase
    .from("clean_streak")
    .update({ is_current: false, end_date: today })
    .eq("is_current", true);

  // Start new streak
  const { data } = await supabase
    .from("clean_streak")
    .insert({ start_date: today, is_current: true })
    .select()
    .single();

  return NextResponse.json({ newStreak: data });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/streak/route.ts
git commit -m "feat: add streak API with current days, history, calendar data, and reset"
```

---

## Task 17: Emergency Scripture API

**Files:**
- Create: `src/app/api/ai/emergency/route.ts`

- [ ] **Step 1: Implement emergency scripture endpoint**

Create `src/app/api/ai/emergency/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { askGemini } from "@/lib/gemini";
import emergencyScriptures from "../../../../../data/emergency-scriptures.json";

export async function GET() {
  // Get recently shown scriptures to avoid repeats
  const { data: recentLogs } = await supabase
    .from("emergency_log")
    .select("scripture_ref")
    .order("shown_at", { ascending: false })
    .limit(10);

  const recentRefs = new Set((recentLogs ?? []).map((l) => l.scripture_ref));

  // Filter out recently shown
  let candidates = emergencyScriptures.filter((s) => !recentRefs.has(s.ref));
  if (candidates.length === 0) candidates = emergencyScriptures;

  // Try to personalize selection with Gemini based on recent journal entries
  let selected = candidates[Math.floor(Math.random() * candidates.length)];

  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    const { data: recentEntries } = await supabase
      .from("journal_entries")
      .select("content, type")
      .in("type", ["trigger", "checkin_evening"])
      .gte("created_at", threeDaysAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentEntries && recentEntries.length > 0) {
      const entrySummary = recentEntries
        .map((e) => `[${e.type}] ${e.content || ""}`)
        .filter((e) => e.length > 10)
        .join("\n");

      if (entrySummary) {
        const candidateList = candidates
          .map((s, i) => `${i}: [${s.theme}] ${s.ref}`)
          .join("\n");

        const result = await askGemini(
          `You are selecting an emergency scripture for someone in a moment of temptation. Based on their recent journal entries, pick the MOST relevant scripture from the numbered list. Respond with ONLY the number, nothing else.`,
          `Recent entries:\n${entrySummary}\n\nScriptures:\n${candidateList}`
        );

        const idx = parseInt(result.trim(), 10);
        if (!isNaN(idx) && idx >= 0 && idx < candidates.length) {
          selected = candidates[idx];
        }
      }
    }
  } catch {
    // Fall back to random selection if Gemini fails
  }

  // Log the display
  await supabase.from("emergency_log").insert({
    scripture_ref: selected.ref,
  });

  return NextResponse.json({ scripture: selected });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/ai/emergency/route.ts
git commit -m "feat: add emergency scripture API with repeat-avoidance"
```

---

## Task 18: Streak Tab Page

**Files:**
- Create: `src/components/streak/streak-counter.tsx`, `src/components/streak/emergency-button.tsx`, `src/components/streak/emergency-overlay.tsx`, `src/components/streak/calendar-heatmap.tsx`
- Modify: `src/app/(app)/streak/page.tsx`

- [ ] **Step 1: Create streak counter**

Create `src/components/streak/streak-counter.tsx`:

```tsx
"use client";

import { useState } from "react";

interface StreakCounterProps {
  currentDays: number;
  longestStreak: number;
  onReset: () => void;
}

export default function StreakCounter({ currentDays, longestStreak, onReset }: StreakCounterProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-6 text-center">
      <p className="text-sm text-[var(--text-secondary)] mb-2">Clean Days</p>
      <p className="text-6xl font-bold text-[var(--accent-green)] mb-2">{currentDays}</p>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Longest: {longestStreak} days
      </p>
      {confirming ? (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { onReset(); setConfirming(false); }}
            className="px-4 py-2 rounded-lg bg-[var(--accent-red)] text-white text-sm"
          >
            Yes, reset
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-secondary)] text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-sm text-[var(--accent-red)]/60 underline"
        >
          Reset
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create emergency button**

Create `src/components/streak/emergency-button.tsx`:

```tsx
interface EmergencyButtonProps {
  onPress: () => void;
}

export default function EmergencyButton({ onPress }: EmergencyButtonProps) {
  return (
    <button
      onClick={onPress}
      className="w-full py-5 rounded-2xl bg-[var(--emergency)] text-white text-xl font-bold shadow-lg shadow-red-900/30 active:scale-[0.98] transition-transform mt-4"
    >
      I Need Help Now
    </button>
  );
}
```

- [ ] **Step 3: Create emergency overlay**

Create `src/components/streak/emergency-overlay.tsx`:

```tsx
"use client";

interface EmergencyOverlayProps {
  text: string;
  ref: string;
  onClose: () => void;
}

export default function EmergencyOverlay({ text, ref: scriptureRef, onClose }: EmergencyOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col items-center justify-center p-8"
      onClick={onClose}
    >
      <p className="text-xl leading-relaxed text-center text-[var(--text-primary)] mb-8 max-w-md">
        &ldquo;{text}&rdquo;
      </p>
      <p className="text-[var(--accent-gold)] text-sm">{scriptureRef}</p>
      <p className="text-[var(--text-secondary)] text-xs mt-8">Tap anywhere to close</p>
    </div>
  );
}
```

- [ ] **Step 4: Create calendar heatmap**

Create `src/components/streak/calendar-heatmap.tsx`:

```tsx
"use client";

interface CheckinDay {
  created_at: string;
  clean_today: boolean | null;
}

interface CalendarHeatmapProps {
  checkins: CheckinDay[];
}

export default function CalendarHeatmap({ checkins }: CalendarHeatmapProps) {
  const today = new Date();
  const days: { date: string; status: "clean" | "slip" | "neutral" }[] = [];

  // Build last 90 days
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const checkin = checkins.find((c) => c.created_at.startsWith(dateStr));
    let status: "clean" | "slip" | "neutral" = "neutral";
    if (checkin) {
      status = checkin.clean_today ? "clean" : "slip";
    }
    days.push({ date: dateStr, status });
  }

  const colorMap = {
    clean: "bg-[var(--accent-green)]",
    slip: "bg-[var(--accent-red)]",
    neutral: "bg-white/10",
  };

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  // Organize days into weeks (columns) starting from Sunday
  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];
  // Pad the first week with empty days if it doesn't start on Sunday
  const firstDayOfWeek = new Date(days[0].date).getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: "", status: "neutral" as const });
  }
  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-4 mt-4">
      <h3 className="text-sm text-[var(--text-secondary)] mb-3">Last 90 Days</h3>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {weekDays.map((d, i) => (
            <div key={i} className="w-3 h-3 text-[8px] text-[var(--text-secondary)] flex items-center">{d}</div>
          ))}
        </div>
        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-3 h-3 rounded-sm ${day.date ? colorMap[day.status] : "bg-transparent"}`}
                title={day.date ? `${day.date}: ${day.status}` : ""}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[var(--accent-green)]" /> Clean
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[var(--accent-red)]" /> Slip
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-white/10" /> No data
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wire up streak page**

Replace `src/app/(app)/streak/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import StreakCounter from "@/components/streak/streak-counter";
import EmergencyButton from "@/components/streak/emergency-button";
import EmergencyOverlay from "@/components/streak/emergency-overlay";
import CalendarHeatmap from "@/components/streak/calendar-heatmap";

interface EmergencyScripture {
  ref: string;
  text: string;
  theme: string;
}

export default function StreakPage() {
  const [currentDays, setCurrentDays] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [checkins, setCheckins] = useState([]);
  const [emergency, setEmergency] = useState<EmergencyScripture | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    const res = await fetch("/api/streak");
    const data = await res.json();
    setCurrentDays(data.currentDays);
    setLongestStreak(data.longestStreak);
    setCheckins(data.checkins);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStreak(); }, [fetchStreak]);

  async function handleReset() {
    await fetch("/api/streak", { method: "POST" });
    fetchStreak();
  }

  async function handleEmergency() {
    const res = await fetch("/api/ai/emergency");
    const data = await res.json();
    setEmergency(data.scripture);
  }

  if (loading) {
    return <div className="text-[var(--text-secondary)] text-center mt-20">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Accountability</h1>
      <StreakCounter currentDays={currentDays} longestStreak={longestStreak} onReset={handleReset} />
      <EmergencyButton onPress={handleEmergency} />
      <CalendarHeatmap checkins={checkins} />
      {emergency && (
        <EmergencyOverlay
          text={emergency.text}
          ref={emergency.ref}
          onClose={() => setEmergency(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/streak/ src/app/"(app)"/streak/page.tsx
git commit -m "feat: build streak tab with counter, emergency button/overlay, and calendar heatmap"
```

---

## Task 19: AI Reading Plan Adjustment API

**Files:**
- Create: `src/app/api/ai/adjust-plan/route.ts`

- [ ] **Step 1: Implement plan adjustment endpoint**

Create `src/app/api/ai/adjust-plan/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { askGemini } from "@/lib/gemini";
import readingOrder from "../../../../../data/reading-order.json";

export async function POST() {
  // Get journal entries from last 14 days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("type, content, created_at")
    .in("type", ["trigger", "checkin_morning", "checkin_evening"])
    .gte("created_at", fourteenDaysAgo)
    .order("created_at", { ascending: true });

  if (!entries || entries.length < 3) {
    return NextResponse.json({ adjusted: false, reason: "Not enough entries for analysis" });
  }

  const { data: config } = await supabase
    .from("user_config")
    .select("current_book, current_chapter")
    .limit(1)
    .single();

  const entrySummary = entries
    .map((e) => `[${e.type}] ${e.content || "(no text)"}`)
    .join("\n");

  const bookList = readingOrder.map((b) => `${b.id}: ${b.name} (${b.chapters} chapters)`).join("\n");

  const systemPrompt = `You are an LDS scripture study AI. Analyze the user's recent journal entries (last 14 days) for recurring themes. ONLY suggest a reading plan adjustment if you find at least 3 entries touching a similar significant theme (not one-off bad days).

Available scripture books:
${bookList}

If a significant recurring theme is found, respond with EXACTLY this JSON format:
{"adjust": true, "theme": "the theme", "reasoning": "why these scriptures help", "scriptures": [{"book": "book-id", "chapter": 1}, ...]}

Include 3-5 scripture chapters that directly address the theme. Use book IDs from the list above.

If no significant recurring theme is found (fewer than 3 entries on a similar topic), respond with:
{"adjust": false, "reason": "explanation"}

Respond with ONLY the JSON, no other text.`;

  const result = await askGemini(systemPrompt, `Recent journal entries:\n${entrySummary}`);

  try {
    const parsed = JSON.parse(result.trim());

    if (parsed.adjust && config) {
      // Log the adjustment
      await supabase.from("ai_adjustments").insert({
        detected_theme: parsed.theme,
        reasoning: parsed.reasoning,
        scriptures: parsed.scriptures,
        original_position: { book: config.current_book, chapter: config.current_chapter },
      });

      return NextResponse.json({
        adjusted: true,
        theme: parsed.theme,
        reasoning: parsed.reasoning,
        scriptures: parsed.scriptures,
      });
    }

    return NextResponse.json({ adjusted: false, reason: parsed.reason });
  } catch {
    return NextResponse.json({ adjusted: false, reason: "Could not parse AI response" });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/ai/adjust-plan/route.ts
git commit -m "feat: add AI reading plan adjustment with 3-entry threshold and theme detection"
```

---

## Task 20: Dashboard Tab & Settings

**Files:**
- Create: `src/components/dashboard/stats-overview.tsx`, `src/components/dashboard/settings-panel.tsx`, `src/app/api/settings/route.ts`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create settings API**

Create `src/app/api/settings/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPin } from "@/lib/pin-hash";

export async function GET() {
  const { data } = await supabase
    .from("user_config")
    .select("*")
    .limit(1)
    .single();

  return NextResponse.json({ config: data });
}

export async function POST(req: NextRequest) {
  const { action, pin } = await req.json();

  if (action === "change_pin") {
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }
    const pinHash = await hashPin(pin);

    await supabase
      .from("user_config")
      .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // update all (single user)

    return NextResponse.json({ success: true });
  }

  if (action === "reset_plan") {
    await supabase
      .from("user_config")
      .update({
        current_book: "1-nephi",
        current_chapter: 1,
        study_streak: 0,
        updated_at: new Date().toISOString(),
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
```

- [ ] **Step 2: Create stats overview**

Create `src/components/dashboard/stats-overview.tsx`:

```tsx
interface StatsOverviewProps {
  studyStreak: number;
  longestStudyStreak: number;
  cleanDays: number;
  longestCleanStreak: number;
  cyclesCompleted: number;
}

export default function StatsOverview({
  studyStreak,
  longestStudyStreak,
  cleanDays,
  longestCleanStreak,
  cyclesCompleted,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-[var(--bg-card)] rounded-2xl p-4">
        <p className="text-sm text-[var(--text-secondary)]">Study Streak</p>
        <p className="text-3xl font-bold text-[var(--accent-gold)]">{studyStreak}</p>
        <p className="text-xs text-[var(--text-secondary)]">Best: {longestStudyStreak}</p>
      </div>
      <div className="bg-[var(--bg-card)] rounded-2xl p-4">
        <p className="text-sm text-[var(--text-secondary)]">Clean Days</p>
        <p className="text-3xl font-bold text-[var(--accent-green)]">{cleanDays}</p>
        <p className="text-xs text-[var(--text-secondary)]">Best: {longestCleanStreak}</p>
      </div>
      {cyclesCompleted > 0 && (
        <div className="col-span-2 bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/30 rounded-2xl p-4 text-center">
          <p className="text-[var(--accent-gold)] font-semibold">
            Completed Full Cycle {cyclesCompleted}x
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create settings panel**

Create `src/components/dashboard/settings-panel.tsx`:

```tsx
"use client";

import { useState } from "react";

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState("");

  async function changePin() {
    if (!/^\d{4}$/.test(newPin)) {
      setMessage("PIN must be 4 digits");
      return;
    }
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_pin", pin: newPin }),
    });
    if (res.ok) {
      setMessage("PIN changed");
      setNewPin("");
    }
  }

  async function resetPlan() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_plan" }),
    });
    setMessage("Reading plan reset to 1 Nephi 1");
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Settings</h3>
        <button onClick={onClose} className="text-[var(--text-secondary)]">Close</button>
      </div>

      <div className="mb-6">
        <label className="text-sm text-[var(--text-secondary)] block mb-2">Change PIN</label>
        <div className="flex gap-2">
          <input
            type="password"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
            placeholder="New 4-digit PIN"
            className="flex-1 bg-[var(--bg-primary)] rounded-xl px-4 py-3 text-[var(--text-primary)]"
          />
          <button onClick={changePin} className="px-4 py-3 rounded-xl bg-[var(--accent-blue)] text-white">
            Save
          </button>
        </div>
      </div>

      <div>
        <button
          onClick={resetPlan}
          className="w-full py-3 rounded-xl bg-[var(--accent-red)]/10 text-[var(--accent-red)] border border-[var(--accent-red)]/30"
        >
          Reset Reading Plan
        </button>
      </div>

      {message && <p className="text-sm text-[var(--accent-gold)] mt-3 text-center">{message}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Wire up dashboard page**

Replace `src/app/(app)/dashboard/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import StatsOverview from "@/components/dashboard/stats-overview";
import SettingsPanel from "@/components/dashboard/settings-panel";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    studyStreak: 0,
    longestStudyStreak: 0,
    cleanDays: 0,
    longestCleanStreak: 0,
    cyclesCompleted: 0,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const [configRes, streakRes] = await Promise.all([
      fetch("/api/settings"),
      fetch("/api/streak"),
    ]);
    const configData = await configRes.json();
    const streakData = await streakRes.json();

    setStats({
      studyStreak: configData.config?.study_streak ?? 0,
      longestStudyStreak: configData.config?.longest_study_streak ?? 0,
      cleanDays: streakData.currentDays,
      longestCleanStreak: streakData.longestStreak,
      cyclesCompleted: configData.config?.cycles_completed ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return <div className="text-[var(--text-secondary)] text-center mt-20">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-2xl"
        >
          ⚙️
        </button>
      </div>

      {showSettings ? (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      ) : (
        <StatsOverview {...stats} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/settings/route.ts src/components/dashboard/ src/app/"(app)"/dashboard/page.tsx
git commit -m "feat: build dashboard tab with stats overview, cycle badge, and settings panel"
```

---

## Task 21: PWA Setup

**Files:**
- Create: `public/manifest.json`, `public/sw.js`, `public/icons/` (placeholder)

- [ ] **Step 1: Create PWA manifest**

Create `public/manifest.json`:

```json
{
  "name": "Scripture Study",
  "short_name": "Scripture",
  "description": "Personal scripture study & accountability",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Create service worker**

Create `public/sw.js`:

```javascript
const CACHE_NAME = "scripture-v1";
const PRECACHE_URLS = ["/", "/study", "/journal", "/streak", "/dashboard"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
```

- [ ] **Step 3: Create service worker registration component**

Create `src/components/sw-register.tsx`:

```tsx
"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
```

Then add `<SwRegister />` inside the `<body>` tag in `src/app/layout.tsx`:

```tsx
import SwRegister from "@/components/sw-register";
// ... in the body:
<body className="min-h-dvh bg-[var(--bg-primary)]">
  {children}
  <SwRegister />
</body>
```

- [ ] **Step 4: Generate placeholder icons**

Create `public/icons/` directory and generate simple placeholder PNGs using a canvas-based Node script:

```bash
node -e "
const { createCanvas } = require('canvas');
[192, 512].forEach(size => {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#d4a843';
  ctx.font = 'bold ' + (size * 0.4) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', size/2, size/2);
  require('fs').writeFileSync('public/icons/icon-' + size + '.png', c.toBuffer('image/png'));
});
"
```

If the `canvas` npm package is not available, create simple 1x1 placeholder PNGs and replace them later with real icons:

```bash
mkdir -p public/icons
# Create minimal valid PNGs as placeholders (replace with real icons before launch)
node -e "const fs=require('fs'); const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','base64'); fs.writeFileSync('public/icons/icon-192.png',png); fs.writeFileSync('public/icons/icon-512.png',png);"
```

- [ ] **Step 5: Commit**

```bash
git add public/manifest.json public/sw.js public/icons/ src/app/layout.tsx src/components/sw-register.tsx
git commit -m "feat: add PWA manifest, service worker, registration component, and app icons"
```

---

## Task 22: Vercel Deployment

**Files:**
- Create: `vercel.json` (if needed)

- [ ] **Step 1: Create Supabase project (AARON MUST DO)**

Aaron: Go to supabase.com, create a new project. Then provide the project URL and service role key. The agentic worker will then run the migration SQL from `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor via the Supabase dashboard.

- [ ] **Step 2: Set up .env.local**

Create `.env.local` with the real values (Aaron provides credentials, worker creates the file):
```
GEMINI_API_KEY=<aaron's google api key>
SUPABASE_URL=<supabase project url>
SUPABASE_SERVICE_ROLE_KEY=<supabase service role key>
```

- [ ] **Step 3: Test locally**

```bash
pnpm dev
```

Open `http://localhost:3000` on phone (or browser dev tools mobile view). Verify:
- PIN setup flow works
- Study tab shows 1 Nephi 1
- Journal check-in works
- Streak counter shows
- Emergency button shows a scripture

- [ ] **Step 4: Deploy to Vercel**

```bash
npx vercel --prod
```

Set environment variables in Vercel dashboard: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 5: Verify production deployment**

Open the Vercel URL on phone. Test all 4 tabs. Add to home screen.

- [ ] **Step 6: Commit any deployment config**

```bash
git add -A
git commit -m "chore: finalize deployment configuration"
```

---

## Task 23: Run All Tests

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

Expected: All tests pass (reading-plan and session tests).

- [ ] **Step 2: Fix any failures**

If any tests fail, fix the issues and re-run.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: ensure all tests pass for initial release"
```
