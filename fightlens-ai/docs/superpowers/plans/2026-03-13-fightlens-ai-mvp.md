# FightLens AI MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based combat sports video analysis platform that accepts user-uploaded footage, runs AI-powered analysis via background workers, and delivers coach-quality feedback with conversational follow-up.

**Architecture:** Next.js 15 App Router frontend on Vercel, Inngest background job queue for async video processing hosted on Railway, Cloudflare R2 for video/frame storage, Supabase for PostgreSQL database + auth + realtime notifications. Model-agnostic AI provider layer supporting Claude, GPT-4o, and Gemini.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Inngest, FFmpeg, Cloudflare R2 (S3-compatible), Supabase (Postgres + Auth + Realtime), pnpm

**Spec:** `docs/superpowers/specs/2026-03-13-fightlens-ai-mvp-design.md`

---

## File Structure

```
fightlens-ai/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (dark theme, Inter font)
│   │   ├── page.tsx                      # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx            # Login page
│   │   │   ├── signup/page.tsx           # Signup page
│   │   │   └── layout.tsx               # Auth layout (centered card)
│   │   ├── (app)/
│   │   │   ├── layout.tsx               # App layout (sidebar nav, auth guard)
│   │   │   ├── onboarding/page.tsx      # Sport/experience picker
│   │   │   ├── dashboard/page.tsx       # Main dashboard
│   │   │   ├── upload/page.tsx          # Video upload form
│   │   │   ├── history/page.tsx         # Analysis history list
│   │   │   ├── progress/page.tsx        # Progress charts
│   │   │   └── analysis/
│   │   │       └── [id]/
│   │   │           ├── page.tsx         # Analysis results view
│   │   │           ├── processing/page.tsx  # Processing status
│   │   │           └── chat/page.tsx    # AI coach chat
│   │   └── api/
│   │       ├── upload/route.ts          # Video upload → R2 + trigger Inngest
│   │       ├── chat/route.ts            # AI coach chat (streaming)
│   │       └── inngest/route.ts         # Inngest webhook endpoint
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Server-side Supabase client
│   │   │   └── middleware.ts            # Auth middleware for Next.js
│   │   ├── r2/
│   │   │   └── client.ts               # Cloudflare R2 (S3) client
│   │   ├── ai/
│   │   │   ├── provider.ts             # Provider interface + factory
│   │   │   ├── providers/
│   │   │   │   ├── claude.ts           # Anthropic vision API
│   │   │   │   ├── openai.ts           # GPT-4o vision API
│   │   │   │   └── gemini.ts           # Gemini vision API
│   │   │   ├── prompts/
│   │   │   │   ├── boxing.ts           # Boxing analysis prompt + dimensions
│   │   │   │   └── bjj.ts             # BJJ analysis prompt + dimensions
│   │   │   └── schema.ts              # Zod schemas for AI response validation
│   │   ├── video/
│   │   │   ├── extract-frames.ts       # FFmpeg frame extraction
│   │   │   └── select-frames.ts        # Smart frame selection (motion scoring)
│   │   ├── inngest/
│   │   │   ├── client.ts              # Inngest client instance
│   │   │   └── functions/
│   │   │       └── analyze-video.ts   # Main analysis pipeline function
│   │   ├── types.ts                    # Shared TypeScript types
│   │   └── constants.ts               # App constants (limits, dimensions, etc.)
│   └── components/
│       ├── ui/                         # shadcn/ui components (auto-generated)
│       ├── landing/
│       │   ├── hero.tsx               # Landing hero section
│       │   ├── how-it-works.tsx       # 3-step explainer
│       │   └── sport-showcase.tsx     # Boxing/BJJ showcase
│       ├── auth/
│       │   └── auth-form.tsx          # Login/signup form (shared)
│       ├── upload/
│       │   ├── video-uploader.tsx     # File picker + validation + progress
│       │   └── sport-selector.tsx     # Boxing/BJJ toggle
│       ├── analysis/
│       │   ├── score-display.tsx      # Overall score (big number)
│       │   ├── dimension-chart.tsx    # Radar/bar chart for dimensions
│       │   ├── feedback-section.tsx   # Strengths/weaknesses/drills
│       │   └── processing-status.tsx  # Animated processing indicator
│       ├── chat/
│       │   ├── chat-interface.tsx     # Message list + input
│       │   └── suggested-questions.tsx # Starter question chips
│       ├── dashboard/
│       │   ├── recent-analyses.tsx    # Last 5 analysis cards
│       │   ├── progress-summary.tsx   # Trend line chart
│       │   ├── spider-chart.tsx       # Strengths/weaknesses radar
│       │   └── stats-bar.tsx          # Quick stats row
│       └── progress/
│           ├── trend-chart.tsx        # Score over time (line chart)
│           ├── milestone-badges.tsx   # Achievement badges
│           └── sport-toggle.tsx       # Boxing/BJJ filter
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # All tables + RLS policies
├── inngest.config.ts                   # Inngest configuration
├── next.config.ts                      # Next.js config
├── tailwind.config.ts                  # Tailwind dark theme config
├── .env.local.example                  # Environment variables template
├── package.json
└── tsconfig.json
```

---

## Chunk 1: Project Setup & Database

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.env.local.example`

- [ ] **Step 1: Create Next.js app**

```bash
cd C:\projects\fightlens-ai
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

- [ ] **Step 2: Install core dependencies**

```bash
pnpm add @supabase/supabase-js @supabase/ssr @aws-sdk/client-s3 inngest recharts zod
pnpm add -D @types/node
```

- [ ] **Step 3: Install shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```

Select: New York style, Zinc base color, CSS variables enabled.

Then add core components:

```bash
pnpm dlx shadcn@latest add button card input label tabs badge progress textarea separator avatar dropdown-menu
```

- [ ] **Step 4: Configure Tailwind for dark theme**

Update `tailwind.config.ts` — extend the theme with FightLens colors:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#1a1a1a",
        border: "#2a2a2a",
        accent: "#ff3b30",
        "accent-hover": "#e6352b",
        "score-low": "#ff3b30",
        "score-mid": "#ffcc00",
        "score-high": "#34c759",
        muted: "#a3a3a3",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

- [ ] **Step 5: Create .env.local.example**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=fightlens-videos
R2_PUBLIC_URL=

# AI Providers (at least one required)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=

# AI Config
AI_DEFAULT_PROVIDER=openai

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 6: Set up root layout with dark theme**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FightLens AI — AI-Powered Combat Sports Coaching",
  description:
    "Upload your boxing or BJJ training footage and get instant, coach-quality AI feedback.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-background text-white min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Update globals.css for dark base**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 100%;
  }
}
```

Preserve any shadcn CSS variables already generated — merge, don't replace.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with Tailwind dark theme and shadcn/ui"
```

---

### Task 2: Supabase Database Schema & RLS

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Create migration file with all tables + RLS**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS (extends Supabase Auth)
-- ============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  sport_preferences text[] default '{}',
  experience_level text default 'beginner'
    check (experience_level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz default now()
);

alter table public.users enable row level security;
create policy "Users can read own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- VIDEOS
-- ============================================
create table public.videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  storage_url text not null,
  sport_mode text not null check (sport_mode in ('boxing', 'bjj')),
  duration_seconds integer,
  status text not null default 'uploading'
    check (status in ('uploading', 'processing', 'completed', 'failed')),
  notes text,
  thumbnail_url text,
  file_size_bytes bigint,
  uploaded_at timestamptz default now()
);

alter table public.videos enable row level security;
create policy "Users can read own videos" on public.videos
  for select using (auth.uid() = user_id);
create policy "Users can insert own videos" on public.videos
  for insert with check (auth.uid() = user_id);
create policy "Users can update own videos" on public.videos
  for update using (auth.uid() = user_id);
-- Service role bypasses RLS for background workers

-- ============================================
-- ANALYSES
-- ============================================
create table public.analyses (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  sport_mode text not null check (sport_mode in ('boxing', 'bjj')),
  overall_score numeric(3,1) check (overall_score >= 1.0 and overall_score <= 10.0),
  summary text,
  strengths jsonb default '[]',
  weaknesses jsonb default '[]',
  drill_recommendations jsonb default '[]',
  raw_ai_response jsonb,
  model_used text,
  frame_count integer,
  processing_time_ms integer,
  created_at timestamptz default now()
);

alter table public.analyses enable row level security;
create policy "Users can read own analyses" on public.analyses
  for select using (auth.uid() = user_id);
create policy "Users can insert own analyses" on public.analyses
  for insert with check (auth.uid() = user_id);

-- ============================================
-- SCORES (per-dimension)
-- ============================================
create table public.scores (
  id uuid primary key default uuid_generate_v4(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  sport_mode text not null check (sport_mode in ('boxing', 'bjj')),
  dimension text not null,
  score numeric(3,1) not null check (score >= 1.0 and score <= 10.0),
  feedback text
);

alter table public.scores enable row level security;
create policy "Users can read own scores" on public.scores
  for select using (auth.uid() = user_id);
create policy "Users can insert own scores" on public.scores
  for insert with check (auth.uid() = user_id);

-- ============================================
-- CHAT MESSAGES
-- ============================================
create table public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  token_count integer default 0,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;
create policy "Users can read own messages" on public.chat_messages
  for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on public.chat_messages
  for insert with check (auth.uid() = user_id);

-- ============================================
-- FRAMES
-- ============================================
create table public.frames (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid not null references public.videos(id) on delete cascade,
  timestamp_seconds numeric(6,2) not null,
  storage_url text not null,
  sequence_number integer not null
);

alter table public.frames enable row level security;
create policy "Users can read own frames" on public.frames
  for select using (
    exists (
      select 1 from public.videos
      where videos.id = frames.video_id
      and videos.user_id = auth.uid()
    )
  );

-- ============================================
-- INDEXES
-- ============================================
create index idx_videos_user_id on public.videos(user_id);
create index idx_videos_status on public.videos(status);
create index idx_analyses_user_id on public.analyses(user_id);
create index idx_analyses_video_id on public.analyses(video_id);
create index idx_analyses_created_at on public.analyses(created_at desc);
create index idx_scores_user_id_sport on public.scores(user_id, sport_mode);
create index idx_scores_analysis_id on public.scores(analysis_id);
create index idx_chat_messages_analysis_id on public.chat_messages(analysis_id);
create index idx_frames_video_id on public.frames(video_id);

-- ============================================
-- REALTIME (enable for processing status updates)
-- ============================================
alter publication supabase_realtime add table public.videos;
alter publication supabase_realtime add table public.analyses;
```

- [ ] **Step 2: Create Supabase browser client**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Create Supabase server client**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}
```

- [ ] **Step 4: Create auth middleware**

Create `src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from app routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/signup") &&
    !request.nextUrl.pathname.startsWith("/api") &&
    request.nextUrl.pathname !== "/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

Create `src/middleware.ts`:

```ts
import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 5: Commit**

```bash
git add supabase/ src/lib/supabase/ src/middleware.ts
git commit -m "feat: add Supabase schema with RLS policies and auth middleware"
```

---

### Task 3: Shared Types & Constants

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/constants.ts`

- [ ] **Step 1: Create shared types**

Create `src/lib/types.ts`:

```ts
export type SportMode = "boxing" | "bjj";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type VideoStatus = "uploading" | "processing" | "completed" | "failed";
export type ChatRole = "user" | "assistant";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  sport_preferences: SportMode[];
  experience_level: ExperienceLevel;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  storage_url: string;
  sport_mode: SportMode;
  duration_seconds: number | null;
  status: VideoStatus;
  notes: string | null;
  thumbnail_url: string | null;
  file_size_bytes: number | null;
  uploaded_at: string;
}

export interface Analysis {
  id: string;
  video_id: string;
  user_id: string;
  sport_mode: SportMode;
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  drill_recommendations: DrillRecommendation[];
  raw_ai_response: unknown;
  model_used: string;
  frame_count: number;
  processing_time_ms: number;
  created_at: string;
}

export interface DrillRecommendation {
  name: string;
  description: string;
  target_weakness: string;
}

export interface Score {
  id: string;
  analysis_id: string;
  user_id: string;
  sport_mode: SportMode;
  dimension: string;
  score: number;
  feedback: string | null;
}

export interface ChatMessage {
  id: string;
  analysis_id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  token_count: number;
  created_at: string;
}

export interface Frame {
  id: string;
  video_id: string;
  timestamp_seconds: number;
  storage_url: string;
  sequence_number: number;
}

export interface AnalysisResult {
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  dimensions: DimensionScore[];
  drill_recommendations: DrillRecommendation[];
}

export interface DimensionScore {
  dimension: string;
  score: number;
  feedback: string;
}
```

- [ ] **Step 2: Create constants**

Create `src/lib/constants.ts`:

```ts
import type { SportMode } from "./types";

export const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
export const MAX_VIDEO_DURATION_SECONDS = 600; // 10 minutes
export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
];
export const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".avi"];

export const FRAMES_PER_SECOND = 0.5; // 1 frame per 2 seconds
export const MAX_FRAMES_TO_SEND = 60;
export const MIN_FRAMES_TO_SEND = 40;
export const FRAME_MAX_WIDTH = 720;

export const MAX_CHAT_MESSAGES_PER_ANALYSIS = 50;
export const CHAT_CONTEXT_FRAME_COUNT = 15;

export const SCORING_DIMENSIONS: Record<SportMode, string[]> = {
  boxing: [
    "guard_discipline",
    "footwork",
    "punch_selection",
    "punch_mechanics",
    "defensive_movement",
    "ring_positioning",
    "combinations",
    "distance_management",
  ],
  bjj: [
    "guard_retention",
    "sweeps",
    "submission_attempts",
    "posture",
    "positional_hierarchy",
    "escapes",
    "transitions",
    "grip_fighting",
  ],
};

export const DIMENSION_LABELS: Record<string, string> = {
  guard_discipline: "Guard Discipline",
  footwork: "Footwork",
  punch_selection: "Punch Selection",
  punch_mechanics: "Punch Mechanics",
  defensive_movement: "Defensive Movement",
  ring_positioning: "Ring Positioning",
  combinations: "Combinations",
  distance_management: "Distance Management",
  guard_retention: "Guard Retention",
  sweeps: "Sweeps",
  submission_attempts: "Submission Attempts",
  posture: "Posture",
  positional_hierarchy: "Positional Hierarchy",
  escapes: "Escapes",
  transitions: "Transitions",
  grip_fighting: "Grip Fighting",
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/constants.ts
git commit -m "feat: add shared types and constants"
```

---

### Task 4: Cloudflare R2 Client

**Files:**
- Create: `src/lib/r2/client.ts`

- [ ] **Step 1: Create R2 client**

Create `src/lib/r2/client.ts`:

```ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export async function uploadToR2(
  key: string,
  body: Buffer | ReadableStream,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, command, { expiresIn: 3600 });
}

export async function getR2Object(key: string) {
  const response = await r2.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );
  return response.Body;
}

export function generateVideoKey(userId: string, videoId: string): string {
  return `videos/${userId}/${videoId}/original`;
}

export function generateFrameKey(
  userId: string,
  videoId: string,
  frameNumber: number
): string {
  return `videos/${userId}/${videoId}/frames/frame-${String(frameNumber).padStart(4, "0")}.jpg`;
}

export function generateThumbnailKey(
  userId: string,
  videoId: string
): string {
  return `videos/${userId}/${videoId}/thumbnail.jpg`;
}
```

- [ ] **Step 2: Install presigner**

```bash
pnpm add @aws-sdk/s3-request-presigner
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/r2/
git commit -m "feat: add Cloudflare R2 storage client"
```

---

## Chunk 2: AI Engine & Video Processing

### Task 5: AI Response Schema (Zod)

**Files:**
- Create: `src/lib/ai/schema.ts`

- [ ] **Step 1: Create Zod validation schema for AI responses**

Create `src/lib/ai/schema.ts`:

```ts
import { z } from "zod";

export const dimensionScoreSchema = z.object({
  dimension: z.string(),
  score: z.number().min(1).max(10),
  feedback: z.string(),
});

export const drillRecommendationSchema = z.object({
  name: z.string(),
  description: z.string(),
  target_weakness: z.string(),
});

export const analysisResultSchema = z.object({
  overall_score: z.number().min(1).max(10),
  summary: z.string(),
  strengths: z.array(z.string()).min(1).max(5),
  weaknesses: z.array(z.string()).min(1).max(5),
  dimensions: z.array(dimensionScoreSchema),
  drill_recommendations: z.array(drillRecommendationSchema).min(1).max(5),
});

export type AnalysisResultSchema = z.infer<typeof analysisResultSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/schema.ts
git commit -m "feat: add Zod schema for AI analysis response validation"
```

---

### Task 6: Sport-Specific Prompts

**Files:**
- Create: `src/lib/ai/prompts/boxing.ts`
- Create: `src/lib/ai/prompts/bjj.ts`

- [ ] **Step 1: Create boxing analysis prompt**

Create `src/lib/ai/prompts/boxing.ts`:

```ts
import { SCORING_DIMENSIONS } from "@/lib/constants";

export const BOXING_SYSTEM_PROMPT = `You are an expert boxing coach analyzing training footage. You will receive a sequence of frames from a boxing sparring or training session.

Analyze the fighter's technique across these dimensions, scoring each from 1.0 to 10.0:

${SCORING_DIMENSIONS.boxing
  .map(
    (d) =>
      `- ${d}: ${getBoxingDimensionDescription(d)}`
  )
  .join("\n")}

For each dimension, provide:
1. A numeric score (1.0–10.0, one decimal place)
2. Specific feedback explaining what you observed

Also provide:
- An overall score (1.0–10.0) reflecting total performance
- A narrative summary (2-3 paragraphs) of the session
- Top 3 strengths (specific things done well)
- Top 3 weaknesses (specific areas to improve)
- 2-3 drill recommendations targeting the weaknesses

Return your analysis as JSON matching this exact schema:
{
  "overall_score": number,
  "summary": string,
  "strengths": [string, string, string],
  "weaknesses": [string, string, string],
  "dimensions": [
    { "dimension": string, "score": number, "feedback": string }
  ],
  "drill_recommendations": [
    { "name": string, "description": string, "target_weakness": string }
  ]
}

Return ONLY valid JSON. No markdown, no explanation outside the JSON.

If the footage does not appear to be boxing or combat sports, return:
{
  "overall_score": 0,
  "summary": "This footage does not appear to contain boxing or combat sports training.",
  "strengths": [],
  "weaknesses": [],
  "dimensions": [],
  "drill_recommendations": []
}`;

function getBoxingDimensionDescription(dimension: string): string {
  const descriptions: Record<string, string> = {
    guard_discipline:
      "Consistency of keeping hands up, chin tucked, elbows in. Does the guard drop after throwing punches?",
    footwork:
      "Balance, stance width, pivot usage, lateral movement, avoiding crossing feet.",
    punch_selection:
      "Appropriate punch choices for the situation. Does the fighter read openings correctly?",
    punch_mechanics:
      "Proper form on jabs, crosses, hooks, uppercuts. Hip rotation, shoulder turn, weight transfer.",
    defensive_movement:
      "Slipping, rolling, parrying, pulling back. Head movement variety and timing.",
    ring_positioning:
      "Ring generalship. Cutting off angles, avoiding being cornered, controlling center.",
    combinations:
      "Punch variety in combinations, flow between punches, setting up power shots.",
    distance_management:
      "Maintaining effective range, stepping in and out correctly, not fighting at wrong distance.",
  };
  return descriptions[dimension] || dimension;
}
```

- [ ] **Step 2: Create BJJ analysis prompt**

Create `src/lib/ai/prompts/bjj.ts`:

```ts
import { SCORING_DIMENSIONS } from "@/lib/constants";

export const BJJ_SYSTEM_PROMPT = `You are an expert Brazilian Jiu-Jitsu coach analyzing training footage. You will receive a sequence of frames from a BJJ rolling or drilling session.

Analyze the practitioner's technique across these dimensions, scoring each from 1.0 to 10.0:

${SCORING_DIMENSIONS.bjj
  .map(
    (d) =>
      `- ${d}: ${getBjjDimensionDescription(d)}`
  )
  .join("\n")}

For each dimension, provide:
1. A numeric score (1.0–10.0, one decimal place)
2. Specific feedback explaining what you observed

Also provide:
- An overall score (1.0–10.0) reflecting total performance
- A narrative summary (2-3 paragraphs) of the session
- Top 3 strengths (specific things done well)
- Top 3 weaknesses (specific areas to improve)
- 2-3 drill recommendations targeting the weaknesses

Return your analysis as JSON matching this exact schema:
{
  "overall_score": number,
  "summary": string,
  "strengths": [string, string, string],
  "weaknesses": [string, string, string],
  "dimensions": [
    { "dimension": string, "score": number, "feedback": string }
  ],
  "drill_recommendations": [
    { "name": string, "description": string, "target_weakness": string }
  ]
}

Return ONLY valid JSON. No markdown, no explanation outside the JSON.

If the footage does not appear to be BJJ or grappling, return:
{
  "overall_score": 0,
  "summary": "This footage does not appear to contain BJJ or grappling training.",
  "strengths": [],
  "weaknesses": [],
  "dimensions": [],
  "drill_recommendations": []
}`;

function getBjjDimensionDescription(dimension: string): string {
  const descriptions: Record<string, string> = {
    guard_retention:
      "Ability to maintain guard position, frame effectively, prevent passing attempts.",
    sweeps:
      "Sweep attempts, timing, technique selection, and success rate from bottom positions.",
    submission_attempts:
      "Submission setups, control before submission, chain attacks, finishing mechanics.",
    posture:
      "Posture management in top and bottom positions. Breaking posture from guard, maintaining posture on top.",
    positional_hierarchy:
      "Understanding and pursuing dominant positions. Mount, back control, side control progression.",
    escapes:
      "Escape timing and technique from bad positions. Hip escapes, bridge and roll, guard recovery.",
    transitions:
      "Smooth movement between positions, maintaining control during transitions, not stalling.",
    grip_fighting:
      "Establishing and breaking grips, using grips purposefully, not holding dead grips.",
  };
  return descriptions[dimension] || dimension;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/prompts/
git commit -m "feat: add boxing and BJJ analysis prompts"
```

---

### Task 7: Model-Agnostic AI Provider Layer

**Files:**
- Create: `src/lib/ai/provider.ts`
- Create: `src/lib/ai/providers/claude.ts`
- Create: `src/lib/ai/providers/openai.ts`
- Create: `src/lib/ai/providers/gemini.ts`

- [ ] **Step 1: Install AI SDKs**

```bash
pnpm add @anthropic-ai/sdk openai @google/generative-ai
```

- [ ] **Step 2: Create provider interface and factory**

Create `src/lib/ai/provider.ts`:

```ts
import type { AnalysisResult } from "@/lib/types";
import type { SportMode } from "@/lib/types";

export interface AIProvider {
  name: string;
  analyzeFrames(
    frames: Buffer[],
    systemPrompt: string
  ): Promise<string>;
}

export async function getProvider(name?: string): Promise<AIProvider> {
  const providerName = name || process.env.AI_DEFAULT_PROVIDER || "openai";

  switch (providerName) {
    case "claude":
      return (await import("./providers/claude")).createClaudeProvider();
    case "openai":
      return (await import("./providers/openai")).createOpenAIProvider();
    case "gemini":
      return (await import("./providers/gemini")).createGeminiProvider();
    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }
}

const PROVIDER_FALLBACK_ORDER = ["openai", "claude", "gemini"];

export async function analyzeWithFallback(
  frames: Buffer[],
  systemPrompt: string,
  preferredProvider?: string
): Promise<{ result: string; provider: string }> {
  const order = preferredProvider
    ? [
        preferredProvider,
        ...PROVIDER_FALLBACK_ORDER.filter((p) => p !== preferredProvider),
      ]
    : PROVIDER_FALLBACK_ORDER;

  for (const providerName of order) {
    try {
      const provider = await getProvider(providerName);
      const result = await retryWithBackoff(
        () => provider.analyzeFrames(frames, systemPrompt),
        3
      );
      return { result, provider: providerName };
    } catch (error) {
      console.error(`Provider ${providerName} failed:`, error);
      continue;
    }
  }

  throw new Error("All AI providers failed");
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error("Unreachable");
}
```

- [ ] **Step 3: Create Claude provider**

Create `src/lib/ai/providers/claude.ts`:

```ts
import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "../provider";

export function createClaudeProvider(): AIProvider {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  return {
    name: "claude",
    async analyzeFrames(frames, systemPrompt) {
      const imageContent = frames.map((frame) => ({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: "image/jpeg" as const,
          data: frame.toString("base64"),
        },
      }));

      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              ...imageContent,
              {
                type: "text",
                text: "Analyze these sequential frames from a training session. Return your analysis as JSON.",
              },
            ],
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response from Claude");
      }
      return textBlock.text;
    },
  };
}
```

- [ ] **Step 4: Create OpenAI provider**

Create `src/lib/ai/providers/openai.ts`:

```ts
import OpenAI from "openai";
import type { AIProvider } from "../provider";

export function createOpenAIProvider(): AIProvider {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  return {
    name: "openai",
    async analyzeFrames(frames, systemPrompt) {
      const imageContent = frames.map((frame) => ({
        type: "image_url" as const,
        image_url: {
          url: `data:image/jpeg;base64,${frame.toString("base64")}`,
          detail: "low" as const,
        },
      }));

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              ...imageContent,
              {
                type: "text",
                text: "Analyze these sequential frames from a training session. Return your analysis as JSON.",
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No response from OpenAI");
      return content;
    },
  };
}
```

- [ ] **Step 5: Create Gemini provider**

Create `src/lib/ai/providers/gemini.ts`:

```ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "../provider";

export function createGeminiProvider(): AIProvider {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

  return {
    name: "gemini",
    async analyzeFrames(frames, systemPrompt) {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const imageParts = frames.map((frame) => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: frame.toString("base64"),
        },
      }));

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt },
              ...imageParts,
              {
                text: "Analyze these sequential frames from a training session. Return your analysis as JSON.",
              },
            ],
          },
        ],
      });

      const text = result.response.text();
      if (!text) throw new Error("No response from Gemini");
      return text;
    },
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/
git commit -m "feat: add model-agnostic AI provider layer with Claude, OpenAI, Gemini"
```

---

### Task 8: Video Frame Extraction & Selection

**Files:**
- Create: `src/lib/video/extract-frames.ts`
- Create: `src/lib/video/select-frames.ts`

- [ ] **Step 1: Install FFmpeg dependencies**

```bash
pnpm add fluent-ffmpeg @types/fluent-ffmpeg
```

Note: The Railway worker will need FFmpeg installed as a system dependency. Add to Railway config or Dockerfile.

- [ ] **Step 2: Create frame extraction module**

Create `src/lib/video/extract-frames.ts`:

```ts
import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { FRAMES_PER_SECOND, FRAME_MAX_WIDTH } from "@/lib/constants";

export interface ExtractedFrame {
  buffer: Buffer;
  timestampSeconds: number;
  sequenceNumber: number;
}

export async function extractFrames(
  videoPath: string
): Promise<ExtractedFrame[]> {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "fightlens-"));

  try {
    // Extract frames at configured rate, resize to max width
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          `-vf fps=${FRAMES_PER_SECOND},scale=${FRAME_MAX_WIDTH}:-1`,
          "-q:v 3", // JPEG quality (2-5 is good, lower = better)
        ])
        .output(path.join(outputDir, "frame-%04d.jpg"))
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    // Read extracted frames
    const files = await fs.readdir(outputDir);
    const frameFiles = files
      .filter((f) => f.startsWith("frame-") && f.endsWith(".jpg"))
      .sort();

    const frames: ExtractedFrame[] = [];
    for (let i = 0; i < frameFiles.length; i++) {
      const buffer = await fs.readFile(path.join(outputDir, frameFiles[i]));
      frames.push({
        buffer,
        timestampSeconds: i * (1 / FRAMES_PER_SECOND),
        sequenceNumber: i,
      });
    }

    return frames;
  } finally {
    // Clean up temp directory
    await fs.rm(outputDir, { recursive: true, force: true });
  }
}

export async function extractThumbnail(
  videoPath: string
): Promise<Buffer> {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "fightlens-thumb-"));
  const outputPath = path.join(outputDir, "thumbnail.jpg");

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          count: 1,
          timemarks: ["00:00:02"],
          filename: "thumbnail.jpg",
          folder: outputDir,
          size: "480x?",
        })
        .on("end", resolve)
        .on("error", reject);
    });

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(Math.round(metadata.format.duration || 0));
    });
  });
}
```

- [ ] **Step 3: Create smart frame selection module**

Create `src/lib/video/select-frames.ts`:

```ts
import {
  MAX_FRAMES_TO_SEND,
  MIN_FRAMES_TO_SEND,
} from "@/lib/constants";
import type { ExtractedFrame } from "./extract-frames";

/**
 * Selects the most action-relevant frames using pixel-difference heuristic.
 * Compares consecutive frames — high difference = action, low difference = static.
 * Returns top 40-60 most active frames.
 */
export function selectBestFrames(
  frames: ExtractedFrame[]
): ExtractedFrame[] {
  if (frames.length <= MAX_FRAMES_TO_SEND) return frames;

  // Score each frame by difference from previous frame
  const scored = frames.map((frame, i) => {
    if (i === 0) return { frame, score: 1 }; // Always include first frame
    const diff = calculateFrameDifference(
      frames[i - 1].buffer,
      frame.buffer
    );
    return { frame, score: diff };
  });

  // Sort by activity score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top N frames
  const targetCount = Math.min(
    MAX_FRAMES_TO_SEND,
    Math.max(MIN_FRAMES_TO_SEND, frames.length)
  );
  const selected = scored.slice(0, targetCount);

  // Re-sort by sequence number to maintain chronological order
  selected.sort((a, b) => a.frame.sequenceNumber - b.frame.sequenceNumber);

  return selected.map((s) => s.frame);
}

/**
 * Simple pixel-difference heuristic: samples bytes from each buffer
 * and computes average absolute difference. Fast and effective.
 */
function calculateFrameDifference(a: Buffer, b: Buffer): number {
  const sampleSize = Math.min(1000, a.length, b.length);
  const stepA = Math.floor(a.length / sampleSize);
  const stepB = Math.floor(b.length / sampleSize);

  let totalDiff = 0;
  for (let i = 0; i < sampleSize; i++) {
    totalDiff += Math.abs(a[i * stepA] - b[i * stepB]);
  }

  return totalDiff / sampleSize;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/video/
git commit -m "feat: add FFmpeg frame extraction and smart frame selection"
```

---

### Task 9: Inngest Analysis Pipeline

**Files:**
- Create: `src/lib/inngest/client.ts`
- Create: `src/lib/inngest/functions/analyze-video.ts`
- Create: `src/app/api/inngest/route.ts`

- [ ] **Step 1: Create Inngest client**

Create `src/lib/inngest/client.ts`:

```ts
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "fightlens-ai",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
```

- [ ] **Step 2: Create the main analysis pipeline function**

Create `src/lib/inngest/functions/analyze-video.ts`:

```ts
import { inngest } from "../client";
import { createServiceClient } from "@/lib/supabase/server";
import { getR2Object, uploadToR2, generateFrameKey, generateThumbnailKey } from "@/lib/r2/client";
import { extractFrames, extractThumbnail, getVideoDuration } from "@/lib/video/extract-frames";
import { selectBestFrames } from "@/lib/video/select-frames";
import { analyzeWithFallback } from "@/lib/ai/provider";
import { analysisResultSchema } from "@/lib/ai/schema";
import { BOXING_SYSTEM_PROMPT } from "@/lib/ai/prompts/boxing";
import { BJJ_SYSTEM_PROMPT } from "@/lib/ai/prompts/bjj";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import type { SportMode } from "@/lib/types";

const PROMPTS: Record<SportMode, string> = {
  boxing: BOXING_SYSTEM_PROMPT,
  bjj: BJJ_SYSTEM_PROMPT,
};

export const analyzeVideo = inngest.createFunction(
  {
    id: "analyze-video",
    retries: 2,
  },
  { event: "video/uploaded" },
  async ({ event, step }) => {
    const { videoId, userId, sportMode, storageUrl } = event.data as {
      videoId: string;
      userId: string;
      sportMode: SportMode;
      storageUrl: string;
    };

    const supabase = createServiceClient();
    const startTime = Date.now();

    // Step 1: Update status to processing
    await step.run("update-status-processing", async () => {
      await supabase
        .from("videos")
        .update({ status: "processing" })
        .eq("id", videoId);
    });

    // Step 2: Download video to temp file
    const tempVideoPath = await step.run("download-video", async () => {
      const body = await getR2Object(storageUrl);
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "fl-"));
      const tempPath = path.join(tempDir, "video.mp4");
      const chunks: Buffer[] = [];
      // @ts-ignore - ReadableStream compatibility
      for await (const chunk of body) {
        chunks.push(Buffer.from(chunk));
      }
      await fs.writeFile(tempPath, Buffer.concat(chunks));
      return tempPath;
    });

    // Step 3: Get duration and extract thumbnail
    const duration = await step.run("get-duration", async () => {
      return await getVideoDuration(tempVideoPath);
    });

    await step.run("extract-thumbnail", async () => {
      const thumbnail = await extractThumbnail(tempVideoPath);
      const thumbKey = generateThumbnailKey(userId, videoId);
      await uploadToR2(thumbKey, thumbnail, "image/jpeg");
      await supabase
        .from("videos")
        .update({ thumbnail_url: thumbKey, duration_seconds: duration })
        .eq("id", videoId);
    });

    // Step 4: Extract and select frames
    const frameBuffers = await step.run("extract-frames", async () => {
      const allFrames = await extractFrames(tempVideoPath);
      const selected = selectBestFrames(allFrames);

      // Upload frames to R2 for later use in chat
      for (const frame of selected) {
        const frameKey = generateFrameKey(userId, videoId, frame.sequenceNumber);
        await uploadToR2(frameKey, frame.buffer, "image/jpeg");

        await supabase.from("frames").insert({
          video_id: videoId,
          timestamp_seconds: frame.timestampSeconds,
          storage_url: frameKey,
          sequence_number: frame.sequenceNumber,
        });
      }

      return selected.map((f) => f.buffer);
    });

    // Step 5: Run AI analysis
    const analysisData = await step.run("ai-analysis", async () => {
      const prompt = PROMPTS[sportMode];
      const { result: rawResponse, provider } = await analyzeWithFallback(
        frameBuffers,
        prompt
      );

      // Strip markdown code fences if present
      const cleaned = rawResponse
        .replace(/^```json?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      const validated = analysisResultSchema.parse(parsed);

      return { validated, provider, raw: rawResponse };
    });

    // Step 6: Save analysis to database
    await step.run("save-analysis", async () => {
      const { validated, provider, raw } = analysisData;

      // Insert analysis
      const { data: analysis } = await supabase
        .from("analyses")
        .insert({
          video_id: videoId,
          user_id: userId,
          sport_mode: sportMode,
          overall_score: validated.overall_score,
          summary: validated.summary,
          strengths: validated.strengths,
          weaknesses: validated.weaknesses,
          drill_recommendations: validated.drill_recommendations,
          raw_ai_response: raw,
          model_used: provider,
          frame_count: frameBuffers.length,
          processing_time_ms: Date.now() - startTime,
        })
        .select("id")
        .single();

      if (!analysis) throw new Error("Failed to insert analysis");

      // Insert dimension scores
      const scores = validated.dimensions.map((d) => ({
        analysis_id: analysis.id,
        user_id: userId,
        sport_mode: sportMode,
        dimension: d.dimension,
        score: d.score,
        feedback: d.feedback,
      }));

      await supabase.from("scores").insert(scores);

      // Update video status to completed
      await supabase
        .from("videos")
        .update({ status: "completed" })
        .eq("id", videoId);
    });

    // Step 7: Clean up temp file
    await step.run("cleanup", async () => {
      const tempDir = path.dirname(tempVideoPath);
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    return { success: true, videoId };
  }
);
```

- [ ] **Step 3: Create Inngest API route**

Create `src/app/api/inngest/route.ts`:

```ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { analyzeVideo } from "@/lib/inngest/functions/analyze-video";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analyzeVideo],
});
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/inngest/ src/app/api/inngest/
git commit -m "feat: add Inngest analysis pipeline with video processing"
```

---

## Chunk 3: API Routes & Upload Flow

### Task 10: Upload API Route

**Files:**
- Create: `src/app/api/upload/route.ts`

- [ ] **Step 1: Create upload API route**

Create `src/app/api/upload/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToR2, generateVideoKey } from "@/lib/r2/client";
import { inngest } from "@/lib/inngest/client";
import { MAX_VIDEO_SIZE_BYTES, ACCEPTED_VIDEO_TYPES } from "@/lib/constants";
import type { SportMode } from "@/lib/types";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("video") as File | null;
  const sportMode = formData.get("sportMode") as SportMode | null;
  const notes = formData.get("notes") as string | null;

  if (!file || !sportMode) {
    return NextResponse.json(
      { error: "Missing video file or sport mode" },
      { status: 400 }
    );
  }

  if (!["boxing", "bjj"].includes(sportMode)) {
    return NextResponse.json(
      { error: "Invalid sport mode" },
      { status: 400 }
    );
  }

  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported video format. Use MP4, MOV, WebM, or AVI." },
      { status: 400 }
    );
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Video too large. Maximum size is 500MB." },
      { status: 400 }
    );
  }

  const videoId = randomUUID();
  const storageKey = generateVideoKey(user.id, videoId);

  try {
    // Upload video to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(storageKey, buffer, file.type);

    // Create video record in database
    const { error: dbError } = await supabase.from("videos").insert({
      id: videoId,
      user_id: user.id,
      storage_url: storageKey,
      sport_mode: sportMode,
      status: "uploading",
      notes: notes || null,
      file_size_bytes: file.size,
    });

    if (dbError) throw dbError;

    // Trigger Inngest analysis pipeline
    await inngest.send({
      name: "video/uploaded",
      data: {
        videoId,
        userId: user.id,
        sportMode,
        storageUrl: storageKey,
      },
    });

    return NextResponse.json({ videoId, status: "processing" });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/upload/
git commit -m "feat: add video upload API route"
```

---

### Task 11: Chat API Route (Streaming)

**Files:**
- Create: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create streaming chat API route**

Create `src/app/api/chat/route.ts`:

```ts
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/ai/provider";
import { getR2Object } from "@/lib/r2/client";
import {
  MAX_CHAT_MESSAGES_PER_ANALYSIS,
  CHAT_CONTEXT_FRAME_COUNT,
} from "@/lib/constants";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { analysisId, message } = await request.json();
  if (!analysisId || !message) {
    return new Response("Missing analysisId or message", { status: 400 });
  }

  // Check message cap
  const { count } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("analysis_id", analysisId)
    .eq("user_id", user.id);

  if ((count || 0) >= MAX_CHAT_MESSAGES_PER_ANALYSIS) {
    return new Response(
      JSON.stringify({
        error: `Chat limit reached (${MAX_CHAT_MESSAGES_PER_ANALYSIS} messages). Start a new analysis for more feedback.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get analysis + user data
  const { data: analysis } = await supabase
    .from("analyses")
    .select("*, scores(*)")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (!analysis) {
    return new Response("Analysis not found", { status: 404 });
  }

  const { data: userData } = await supabase
    .from("users")
    .select("experience_level, sport_preferences")
    .eq("id", user.id)
    .single();

  // Get chat history
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: true });

  // Get a subset of frames for context
  const { data: frames } = await supabase
    .from("frames")
    .select("storage_url, sequence_number")
    .eq("video_id", analysis.video_id)
    .order("sequence_number")
    .limit(CHAT_CONTEXT_FRAME_COUNT);

  // Load frame images
  const frameBuffers: Buffer[] = [];
  if (frames) {
    for (const frame of frames) {
      try {
        const body = await getR2Object(frame.storage_url);
        const chunks: Buffer[] = [];
        // @ts-ignore
        for await (const chunk of body) {
          chunks.push(Buffer.from(chunk));
        }
        frameBuffers.push(Buffer.concat(chunks));
      } catch {
        // Skip frames that fail to load
      }
    }
  }

  // Save user message
  const serviceClient = createServiceClient();
  await serviceClient.from("chat_messages").insert({
    analysis_id: analysisId,
    user_id: user.id,
    role: "user",
    content: message,
  });

  // Build chat context
  const sportLabel = analysis.sport_mode === "bjj" ? "BJJ" : "Boxing";
  const systemPrompt = `You are an expert ${sportLabel} coach having a conversation about a training session you just analyzed.

Here is the analysis you provided:
- Overall Score: ${analysis.overall_score}/10
- Summary: ${analysis.summary}
- Strengths: ${(analysis.strengths as string[]).join(", ")}
- Weaknesses: ${(analysis.weaknesses as string[]).join(", ")}
- Dimension Scores: ${(analysis.scores as any[]).map((s: any) => `${s.dimension}: ${s.score}/10`).join(", ")}

The practitioner's experience level is: ${userData?.experience_level || "unknown"}

You have access to frames from the training session. Reference specific moments when relevant.
Be encouraging but honest. Give actionable, specific advice. Suggest drills when appropriate.
Keep responses conversational and concise (2-4 paragraphs max).`;

  // Build messages for AI
  const provider = await getProvider();
  const chatMessages = (history || []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  chatMessages.push({ role: "user", content: message });

  // Stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // For chat, use text-only (no frames) to keep costs down
        // Frames are available but only sent if user asks about specific moments
        const response = await provider.analyzeFrames(
          [], // No frames for chat — use the analysis context instead
          systemPrompt +
            "\n\nChat history:\n" +
            chatMessages
              .map((m) => `${m.role}: ${m.content}`)
              .join("\n")
        );

        // Save assistant message
        await serviceClient.from("chat_messages").insert({
          analysis_id: analysisId,
          user_id: user.id,
          role: "assistant",
          content: response,
        });

        controller.enqueue(encoder.encode(response));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/chat/
git commit -m "feat: add streaming AI coach chat API route with message cap"
```

---

### Task 12: Auth Pages (Login/Signup)

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/components/auth/auth-form.tsx`

- [ ] **Step 1: Create auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create shared auth form component**

Create `src/components/auth/auth-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        router.push("/onboarding");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <Card className="bg-surface border-border">
      <CardHeader className="text-center">
        <div className="text-2xl font-black text-accent uppercase tracking-tight mb-2">
          FIGHTLENS AI
        </div>
        <CardTitle className="text-xl text-white">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full border-border text-white hover:bg-border"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border"
                placeholder="Your name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-border"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border-border"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-accent">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent-hover text-white font-bold uppercase"
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-accent hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
```

- [ ] **Step 4: Create signup page**

Create `src/app/(auth)/signup/page.tsx`:

```tsx
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/ src/components/auth/
git commit -m "feat: add login and signup pages with Supabase Auth"
```

---

### Task 13: App Layout & Onboarding

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/onboarding/page.tsx`

- [ ] **Step 1: Create app layout with sidebar navigation**

Create `src/app/(app)/layout.tsx`:

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/upload", label: "Upload", icon: "📹" },
    { href: "/history", label: "History", icon: "📋" },
    { href: "/progress", label: "Progress", icon: "📈" },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-surface border-r border-border p-4 flex flex-col">
        <Link href="/dashboard" className="mb-8">
          <span className="text-xl font-black text-accent uppercase tracking-tight">
            FIGHTLENS AI
          </span>
        </Link>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted hover:text-white hover:bg-background transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create onboarding page**

Create `src/app/(app)/onboarding/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SportMode, ExperienceLevel } from "@/lib/types";

export default function OnboardingPage() {
  const [sports, setSports] = useState<SportMode[]>([]);
  const [level, setLevel] = useState<ExperienceLevel>("beginner");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function toggleSport(sport: SportMode) {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  }

  async function handleSubmit() {
    if (sports.length === 0) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("users")
      .update({ sport_preferences: sports, experience_level: level })
      .eq("id", user.id);

    router.push("/dashboard");
  }

  return (
    <div className="max-w-lg mx-auto mt-12">
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-white text-2xl">
            Set up your profile
          </CardTitle>
          <p className="text-muted">
            Tell us about your training so we can personalize your analysis.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-white font-semibold">
              What do you train?
            </h3>
            <div className="flex gap-3">
              {(["boxing", "bjj"] as SportMode[]).map((sport) => (
                <button
                  key={sport}
                  onClick={() => toggleSport(sport)}
                  className={`flex-1 py-4 rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
                    sports.includes(sport)
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:border-muted"
                  }`}
                >
                  {sport === "bjj" ? "BJJ" : "Boxing"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-white font-semibold">Experience level</h3>
            <div className="flex gap-3">
              {(
                ["beginner", "intermediate", "advanced"] as ExperienceLevel[]
              ).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-3 rounded-lg border-2 text-sm capitalize transition-colors ${
                    level === l
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:border-muted"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={sports.length === 0 || loading}
            className="w-full bg-accent hover:bg-accent-hover text-white font-bold uppercase"
          >
            {loading ? "Saving..." : "Get Started"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/layout.tsx src/app/\(app\)/onboarding/
git commit -m "feat: add app layout with sidebar and onboarding page"
```

---

### Task 14: Upload Page

**Files:**
- Create: `src/app/(app)/upload/page.tsx`
- Create: `src/components/upload/video-uploader.tsx`
- Create: `src/components/upload/sport-selector.tsx`

- [ ] **Step 1: Create sport selector component**

Create `src/components/upload/sport-selector.tsx`:

```tsx
"use client";

import type { SportMode } from "@/lib/types";

interface SportSelectorProps {
  value: SportMode | null;
  onChange: (sport: SportMode) => void;
}

export function SportSelector({ value, onChange }: SportSelectorProps) {
  return (
    <div className="flex gap-3">
      {(["boxing", "bjj"] as SportMode[]).map((sport) => (
        <button
          key={sport}
          type="button"
          onClick={() => onChange(sport)}
          className={`flex-1 py-4 rounded-lg border-2 font-bold uppercase text-sm transition-colors ${
            value === sport
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-muted hover:border-muted"
          }`}
        >
          {sport === "bjj" ? "BJJ" : "Boxing"}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create video uploader component**

Create `src/components/upload/video-uploader.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { SportSelector } from "./sport-selector";
import {
  MAX_VIDEO_SIZE_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
  ACCEPTED_VIDEO_EXTENSIONS,
} from "@/lib/constants";
import type { SportMode } from "@/lib/types";

export function VideoUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [sportMode, setSportMode] = useState<SportMode | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function validateVideo(file: File): Promise<string | null> {
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return "Video is too large. Maximum size is 500MB.";
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_VIDEO_EXTENSIONS.includes(ext)) {
      return "Unsupported format. Use MP4, MOV, WebM, or AVI.";
    }
    // Check duration client-side
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION_SECONDS) {
          resolve("Video is too long. Maximum duration is 10 minutes.");
        }
        resolve(null);
      };
      video.onerror = () => resolve(null); // Allow upload, server will validate
      video.src = URL.createObjectURL(file);
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError("");
    const validationError = await validateVideo(selected);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFile(selected);
  }

  async function handleUpload() {
    if (!file || !sportMode) return;
    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("sportMode", sportMode);
      if (notes) formData.append("notes", notes);

      setProgress(30);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(90);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const { videoId } = await response.json();
      setProgress(100);
      router.push(`/analysis/${videoId}/processing`);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-white font-semibold">Select sport</h3>
        <SportSelector value={sportMode} onChange={setSportMode} />
      </div>

      <div className="space-y-3">
        <h3 className="text-white font-semibold">Upload video</h3>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-muted transition-colors"
        >
          {file ? (
            <div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-muted text-sm mt-1">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-muted">Click to select a video file</p>
              <p className="text-muted text-sm mt-1">
                MP4, MOV, WebM, AVI — Max 500MB, 10 min
              </p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-white font-semibold">Notes (optional)</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Focused on guard passing today..."
          className="bg-background border-border text-white"
        />
      </div>

      {error && <p className="text-accent text-sm">{error}</p>}

      {uploading && <Progress value={progress} className="h-2" />}

      <Button
        onClick={handleUpload}
        disabled={!file || !sportMode || uploading}
        className="w-full bg-accent hover:bg-accent-hover text-white font-bold uppercase py-6 text-lg"
      >
        {uploading ? "Uploading..." : "Analyze My Video"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Create upload page**

Create `src/app/(app)/upload/page.tsx`:

```tsx
import { VideoUploader } from "@/components/upload/video-uploader";

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-black text-white uppercase mb-2">
        Upload Training Footage
      </h1>
      <p className="text-muted mb-8">
        Select your sport, upload your video, and let AI analyze your technique.
      </p>
      <VideoUploader />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/upload/ src/components/upload/
git commit -m "feat: add video upload page with client-side validation"
```

---

## Chunk 4: Analysis, Chat, Dashboard & Remaining Pages

### Task 15: Processing Status Page

**Files:**
- Create: `src/app/(app)/analysis/[id]/processing/page.tsx`
- Create: `src/components/analysis/processing-status.tsx`

- [ ] **Step 1: Create processing status component**

Create `src/components/analysis/processing-status.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ProcessingStatusProps {
  videoId: string;
}

const STAGES = [
  "Uploading video...",
  "Extracting frames...",
  "Analyzing technique...",
  "Generating feedback...",
];

export function ProcessingStatus({ videoId }: ProcessingStatusProps) {
  const [stage, setStage] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Cycle through stages for visual feedback
    const interval = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 15000);

    // Check status on mount (handles tab-close and return)
    async function checkStatus() {
      const { data } = await supabase
        .from("videos")
        .select("status")
        .eq("id", videoId)
        .single();

      if (data?.status === "completed") {
        const { data: analysis } = await supabase
          .from("analyses")
          .select("id")
          .eq("video_id", videoId)
          .single();
        if (analysis) {
          router.push(`/analysis/${analysis.id}`);
          return;
        }
      }
      if (data?.status === "failed") {
        router.push(`/dashboard?error=analysis_failed`);
        return;
      }
    }
    checkStatus();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`video-${videoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "videos",
          filter: `id=eq.${videoId}`,
        },
        async (payload) => {
          if (payload.new.status === "completed") {
            const { data: analysis } = await supabase
              .from("analyses")
              .select("id")
              .eq("video_id", videoId)
              .single();
            if (analysis) {
              router.push(`/analysis/${analysis.id}`);
            }
          }
          if (payload.new.status === "failed") {
            router.push(`/dashboard?error=analysis_failed`);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [videoId, router, supabase]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-8" />
      <h2 className="text-2xl font-bold text-white mb-2">
        Analyzing your footage
      </h2>
      <p className="text-muted mb-6">{STAGES[stage]}</p>
      <p className="text-muted text-sm">
        This usually takes 60-90 seconds. You can close this tab — we'll have
        your analysis ready when you come back.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create processing page**

Create `src/app/(app)/analysis/[id]/processing/page.tsx`:

```tsx
import { ProcessingStatus } from "@/components/analysis/processing-status";

export default async function ProcessingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProcessingStatus videoId={id} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/analysis/ src/components/analysis/processing-status.tsx
git commit -m "feat: add processing status page with realtime updates"
```

---

### Task 16: Analysis Results View

**Files:**
- Create: `src/app/(app)/analysis/[id]/page.tsx`
- Create: `src/components/analysis/score-display.tsx`
- Create: `src/components/analysis/dimension-chart.tsx`
- Create: `src/components/analysis/feedback-section.tsx`

- [ ] **Step 1: Create score display component**

Create `src/components/analysis/score-display.tsx`:

```tsx
interface ScoreDisplayProps {
  score: number;
  label?: string;
  size?: "sm" | "lg";
}

function getScoreColor(score: number): string {
  if (score <= 4) return "text-score-low";
  if (score <= 7) return "text-score-mid";
  return "text-score-high";
}

export function ScoreDisplay({ score, label, size = "lg" }: ScoreDisplayProps) {
  const sizeClasses = size === "lg" ? "text-6xl" : "text-2xl";
  return (
    <div className="text-center">
      <div className={`${sizeClasses} font-black ${getScoreColor(score)}`}>
        {score.toFixed(1)}
      </div>
      {label && <div className="text-muted text-sm mt-1">{label}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Create dimension chart component**

Create `src/components/analysis/dimension-chart.tsx`:

```tsx
"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { DIMENSION_LABELS } from "@/lib/constants";
import type { Score } from "@/lib/types";

interface DimensionChartProps {
  scores: Score[];
}

export function DimensionChart({ scores }: DimensionChartProps) {
  const data = scores.map((s) => ({
    dimension: DIMENSION_LABELS[s.dimension] || s.dimension,
    score: s.score,
    fullMark: 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={data}>
        <PolarGrid stroke="#2a2a2a" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "#a3a3a3", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 10]}
          tick={{ fill: "#a3a3a3", fontSize: 10 }}
        />
        <Radar
          dataKey="score"
          stroke="#ff3b30"
          fill="#ff3b30"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Create feedback section component**

Create `src/components/analysis/feedback-section.tsx`:

```tsx
import type { DrillRecommendation } from "@/lib/types";

interface FeedbackSectionProps {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  drills: DrillRecommendation[];
}

export function FeedbackSection({
  summary,
  strengths,
  weaknesses,
  drills,
}: FeedbackSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white uppercase mb-3">
          Summary
        </h3>
        <p className="text-muted leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-score-high/5 border border-score-high/20 rounded-lg p-4">
          <h4 className="font-bold text-score-high uppercase text-sm mb-2">
            Strengths
          </h4>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="text-muted text-sm flex gap-2">
                <span className="text-score-high">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-score-low/5 border border-score-low/20 rounded-lg p-4">
          <h4 className="font-bold text-score-low uppercase text-sm mb-2">
            Weaknesses
          </h4>
          <ul className="space-y-2">
            {weaknesses.map((w, i) => (
              <li key={i} className="text-muted text-sm flex gap-2">
                <span className="text-score-low">-</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white uppercase mb-3">
          Recommended Drills
        </h3>
        <div className="space-y-3">
          {drills.map((drill, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-lg p-4"
            >
              <h4 className="font-bold text-white">{drill.name}</h4>
              <p className="text-muted text-sm mt-1">{drill.description}</p>
              <span className="text-accent text-xs mt-2 inline-block">
                Targets: {drill.target_weakness}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create analysis results page**

Create `src/app/(app)/analysis/[id]/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScoreDisplay } from "@/components/analysis/score-display";
import { DimensionChart } from "@/components/analysis/dimension-chart";
import { FeedbackSection } from "@/components/analysis/feedback-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: analysis } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!analysis) redirect("/dashboard");

  const { data: scores } = await supabase
    .from("scores")
    .select("*")
    .eq("analysis_id", id)
    .order("dimension");

  const sportLabel = analysis.sport_mode === "bjj" ? "BJJ" : "Boxing";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase">
            Analysis Results
          </h1>
          <p className="text-muted">
            {sportLabel} Session —{" "}
            {new Date(analysis.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link href={`/analysis/${id}/chat`}>
          <Button className="bg-accent hover:bg-accent-hover text-white font-bold uppercase">
            Chat with AI Coach
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface border border-border rounded-lg p-6 flex items-center justify-center">
          <ScoreDisplay score={analysis.overall_score} label="Overall Score" />
        </div>
        <div className="bg-surface border border-border rounded-lg p-6">
          <h3 className="text-sm font-bold text-muted uppercase mb-4">
            Dimension Breakdown
          </h3>
          <DimensionChart scores={scores || []} />
        </div>
      </div>

      <FeedbackSection
        summary={analysis.summary}
        strengths={analysis.strengths as string[]}
        weaknesses={analysis.weaknesses as string[]}
        drills={analysis.drill_recommendations as any[]}
      />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/analysis/ src/components/analysis/
git commit -m "feat: add analysis results page with radar chart and feedback"
```

---

### Task 17: AI Coach Chat Page

**Files:**
- Create: `src/app/(app)/analysis/[id]/chat/page.tsx`
- Create: `src/components/chat/chat-interface.tsx`
- Create: `src/components/chat/suggested-questions.tsx`

- [ ] **Step 1: Create suggested questions component**

Create `src/components/chat/suggested-questions.tsx`:

```tsx
interface SuggestedQuestionsProps {
  sportMode: string;
  onSelect: (question: string) => void;
}

const SUGGESTIONS: Record<string, string[]> = {
  boxing: [
    "What should I focus on in my next session?",
    "Why does my guard keep dropping?",
    "How can I improve my combinations?",
    "What defensive drills should I practice?",
  ],
  bjj: [
    "What should I focus on in my next roll?",
    "How can I improve my guard retention?",
    "What sweeps would work from the positions I was in?",
    "How do I improve my submission setups?",
  ],
};

export function SuggestedQuestions({
  sportMode,
  onSelect,
}: SuggestedQuestionsProps) {
  const questions = SUGGESTIONS[sportMode] || SUGGESTIONS.boxing;
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="text-sm px-3 py-1.5 rounded-full border border-border text-muted hover:text-white hover:border-accent transition-colors"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create chat interface component**

Create `src/components/chat/chat-interface.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SuggestedQuestions } from "./suggested-questions";
import type { ChatMessage } from "@/lib/types";

interface ChatInterfaceProps {
  analysisId: string;
  sportMode: string;
  initialMessages: ChatMessage[];
}

export function ChatInterface({
  analysisId,
  sportMode,
  initialMessages,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      analysis_id: analysisId,
      user_id: "",
      role: "user",
      content: text,
      token_count: 0,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, message: text }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Chat failed");
      }

      const responseText = await response.text();
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        analysis_id: analysisId,
        user_id: "",
        role: "assistant",
        content: responseText,
        token_count: 0,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        analysis_id: analysisId,
        user_id: "",
        role: "assistant",
        content: err.message || "Something went wrong. Try again.",
        token_count: 0,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-white font-bold mb-4">
              Ask your AI coach anything about this session
            </h3>
            <SuggestedQuestions
              sportMode={sportMode}
              onSelect={sendMessage}
            />
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                msg.role === "user"
                  ? "bg-accent text-white"
                  : "bg-surface border border-border text-muted"
              }`}
            >
              <p className="whitespace-pre-line text-sm">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Ask about your technique..."
          className="bg-background border-border text-white resize-none"
          rows={2}
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="bg-accent hover:bg-accent-hover text-white font-bold px-6"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create chat page**

Create `src/app/(app)/analysis/[id]/chat/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import Link from "next/link";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: analysis } = await supabase
    .from("analyses")
    .select("id, sport_mode, overall_score")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!analysis) redirect("/dashboard");

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("analysis_id", id)
    .order("created_at", { ascending: true });

  const sportLabel = analysis.sport_mode === "bjj" ? "BJJ" : "Boxing";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase">
            AI Coach
          </h1>
          <p className="text-muted text-sm">
            {sportLabel} Session — Score: {analysis.overall_score}/10
          </p>
        </div>
        <Link
          href={`/analysis/${id}`}
          className="text-accent hover:underline text-sm"
        >
          Back to Analysis
        </Link>
      </div>

      <ChatInterface
        analysisId={id}
        sportMode={analysis.sport_mode}
        initialMessages={messages || []}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/analysis/*/chat/ src/components/chat/
git commit -m "feat: add AI coach chat page with suggested questions"
```

---

### Task 18: Dashboard Page

**Files:**
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/components/dashboard/recent-analyses.tsx`
- Create: `src/components/dashboard/stats-bar.tsx`

- [ ] **Step 1: Create recent analyses component**

Create `src/components/dashboard/recent-analyses.tsx`:

```tsx
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Analysis } from "@/lib/types";

interface RecentAnalysesProps {
  analyses: Analysis[];
}

function getScoreColor(score: number): string {
  if (score <= 4) return "bg-score-low/10 text-score-low border-score-low/20";
  if (score <= 7) return "bg-score-mid/10 text-score-mid border-score-mid/20";
  return "bg-score-high/10 text-score-high border-score-high/20";
}

export function RecentAnalyses({ analyses }: RecentAnalysesProps) {
  if (analyses.length === 0) {
    return (
      <div className="text-center py-12 bg-surface border border-border rounded-lg">
        <p className="text-muted mb-4">No analyses yet</p>
        <Link
          href="/upload"
          className="text-accent hover:underline font-semibold"
        >
          Upload your first video
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((a) => (
        <Link key={a.id} href={`/analysis/${a.id}`}>
          <div className="bg-surface border border-border rounded-lg p-4 hover:border-accent/50 transition-colors flex items-center justify-between">
            <div>
              <Badge
                variant="outline"
                className="uppercase text-xs font-bold mb-1"
              >
                {a.sport_mode === "bjj" ? "BJJ" : "Boxing"}
              </Badge>
              <p className="text-muted text-sm">
                {new Date(a.created_at).toLocaleDateString()}
              </p>
            </div>
            <div
              className={`text-2xl font-black px-3 py-1 rounded border ${getScoreColor(a.overall_score)}`}
            >
              {a.overall_score.toFixed(1)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create stats bar component**

Create `src/components/dashboard/stats-bar.tsx`:

```tsx
interface StatsBarProps {
  totalSessions: number;
  avgScore: number;
  bestDimension: string;
}

export function StatsBar({
  totalSessions,
  avgScore,
  bestDimension,
}: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: "Total Sessions", value: totalSessions.toString() },
        { label: "Avg Score", value: avgScore > 0 ? avgScore.toFixed(1) : "—" },
        { label: "Strongest Area", value: bestDimension || "—" },
      ].map((stat) => (
        <div
          key={stat.label}
          className="bg-surface border border-border rounded-lg p-4 text-center"
        >
          <div className="text-2xl font-black text-white">{stat.value}</div>
          <div className="text-muted text-xs uppercase mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create dashboard page**

Create `src/app/(app)/dashboard/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecentAnalyses } from "@/components/dashboard/recent-analyses";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { Button } from "@/components/ui/button";
import { DIMENSION_LABELS } from "@/lib/constants";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch recent analyses
  const { data: analyses } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Calculate stats
  const totalSessions = analyses?.length || 0;
  const avgScore =
    totalSessions > 0
      ? (analyses || []).reduce((sum, a) => sum + a.overall_score, 0) /
        totalSessions
      : 0;

  // Get best dimension
  let bestDimension = "";
  if (totalSessions > 0) {
    const { data: scoreAggs } = await supabase
      .from("scores")
      .select("dimension, score")
      .eq("user_id", user.id);

    if (scoreAggs && scoreAggs.length > 0) {
      const dimAvgs: Record<string, { sum: number; count: number }> = {};
      for (const s of scoreAggs) {
        if (!dimAvgs[s.dimension]) dimAvgs[s.dimension] = { sum: 0, count: 0 };
        dimAvgs[s.dimension].sum += s.score;
        dimAvgs[s.dimension].count += 1;
      }
      let best = { dim: "", avg: 0 };
      for (const [dim, { sum, count }] of Object.entries(dimAvgs)) {
        const avg = sum / count;
        if (avg > best.avg) best = { dim, avg };
      }
      bestDimension = DIMENSION_LABELS[best.dim] || best.dim;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-white uppercase">Dashboard</h1>
        <Link href="/upload">
          <Button className="bg-accent hover:bg-accent-hover text-white font-bold uppercase">
            Upload Video
          </Button>
        </Link>
      </div>

      <StatsBar
        totalSessions={totalSessions}
        avgScore={avgScore}
        bestDimension={bestDimension}
      />

      <div>
        <h2 className="text-lg font-bold text-white uppercase mb-4">
          Recent Analyses
        </h2>
        <RecentAnalyses analyses={(analyses as any[]) || []} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/dashboard/ src/components/dashboard/
git commit -m "feat: add dashboard with recent analyses and stats"
```

---

### Task 19: History Page

**Files:**
- Create: `src/app/(app)/history/page.tsx`

- [ ] **Step 1: Create history page**

Create `src/app/(app)/history/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecentAnalyses } from "@/components/dashboard/recent-analyses";
import type { Analysis } from "@/lib/types";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const { sport } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (sport && ["boxing", "bjj"].includes(sport)) {
    query = query.eq("sport_mode", sport);
  }

  const { data: analyses } = await query;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-white uppercase">History</h1>

      <div className="flex gap-2">
        {[
          { label: "All", href: "/history" },
          { label: "Boxing", href: "/history?sport=boxing" },
          { label: "BJJ", href: "/history?sport=bjj" },
        ].map((filter) => (
          <a
            key={filter.label}
            href={filter.href}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-colors ${
              (!sport && filter.label === "All") ||
              sport === filter.label.toLowerCase()
                ? "bg-accent text-white"
                : "bg-surface border border-border text-muted hover:text-white"
            }`}
          >
            {filter.label}
          </a>
        ))}
      </div>

      <RecentAnalyses analyses={(analyses as Analysis[]) || []} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/history/
git commit -m "feat: add analysis history page with sport filter"
```

---

### Task 20: Progress Page

**Files:**
- Create: `src/app/(app)/progress/page.tsx`
- Create: `src/components/progress/trend-chart.tsx`
- Create: `src/components/progress/milestone-badges.tsx`

- [ ] **Step 1: Create trend chart component**

Create `src/components/progress/trend-chart.tsx`:

```tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendChartProps {
  data: { date: string; score: number; dimension?: string }[];
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        Complete more analyses to see your progress trends.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid stroke="#2a2a2a" />
        <XAxis dataKey="date" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
        <YAxis domain={[0, 10]} tick={{ fill: "#a3a3a3", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 8,
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#ff3b30"
          strokeWidth={2}
          dot={{ fill: "#ff3b30", r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Create milestone badges component**

Create `src/components/progress/milestone-badges.tsx`:

```tsx
interface MilestoneBadgesProps {
  totalSessions: number;
}

const MILESTONES = [
  { count: 1, label: "First Analysis", icon: "🥊" },
  { count: 5, label: "Getting Started", icon: "🔥" },
  { count: 10, label: "Committed", icon: "💪" },
  { count: 25, label: "Dedicated", icon: "🏆" },
  { count: 50, label: "Warrior", icon: "⚔️" },
  { count: 100, label: "Elite", icon: "👑" },
];

export function MilestoneBadges({ totalSessions }: MilestoneBadgesProps) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {MILESTONES.map((m) => {
        const earned = totalSessions >= m.count;
        return (
          <div
            key={m.count}
            className={`text-center p-3 rounded-lg border ${
              earned
                ? "border-accent bg-accent/5"
                : "border-border bg-surface opacity-40"
            }`}
          >
            <div className="text-2xl mb-1">{m.icon}</div>
            <div
              className={`text-xs font-bold uppercase ${earned ? "text-accent" : "text-muted"}`}
            >
              {m.label}
            </div>
            <div className="text-xs text-muted">{m.count} sessions</div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create progress page**

Create `src/app/(app)/progress/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrendChart } from "@/components/progress/trend-chart";
import { MilestoneBadges } from "@/components/progress/milestone-badges";
import { DimensionChart } from "@/components/analysis/dimension-chart";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get all analyses for trend data
  const { data: analyses } = await supabase
    .from("analyses")
    .select("overall_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const trendData = (analyses || []).map((a) => ({
    date: new Date(a.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: a.overall_score,
  }));

  // Get latest dimension scores for radar chart
  const { data: latestAnalysis } = await supabase
    .from("analyses")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let latestScores: any[] = [];
  if (latestAnalysis) {
    const { data } = await supabase
      .from("scores")
      .select("*")
      .eq("analysis_id", latestAnalysis.id);
    latestScores = data || [];
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-black text-white uppercase">Progress</h1>

      <MilestoneBadges totalSessions={analyses?.length || 0} />

      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold text-white uppercase mb-4">
          Score Over Time
        </h2>
        <TrendChart data={trendData} />
      </div>

      {latestScores.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-white uppercase mb-4">
            Latest Dimension Breakdown
          </h2>
          <DimensionChart scores={latestScores} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/progress/ src/components/progress/
git commit -m "feat: add progress page with trend charts and milestone badges"
```

---

### Task 21: Landing Page

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/landing/hero.tsx`
- Create: `src/components/landing/how-it-works.tsx`

- [ ] **Step 1: Create hero component**

Create `src/components/landing/hero.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="text-center py-24 px-4">
      <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight mb-4">
        AI-Powered
        <br />
        <span className="text-accent">Combat Sports</span>
        <br />
        Coaching
      </h1>
      <p className="text-xl text-muted max-w-2xl mx-auto mb-8">
        Upload your training footage. Get instant, coach-quality feedback
        on your boxing and BJJ technique.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/signup">
          <Button className="bg-accent hover:bg-accent-hover text-white font-bold uppercase px-8 py-6 text-lg">
            Get Started Free
          </Button>
        </Link>
        <Link href="/login">
          <Button
            variant="outline"
            className="border-border text-white hover:bg-surface px-8 py-6 text-lg"
          >
            Sign In
          </Button>
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create how-it-works component**

Create `src/components/landing/how-it-works.tsx`:

```tsx
export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Upload",
      description:
        "Record your sparring, rolling, or training on your phone and upload the video.",
    },
    {
      number: "02",
      title: "AI Analyzes",
      description:
        "Our AI extracts key frames and analyzes your technique across 8 dimensions.",
    },
    {
      number: "03",
      title: "Get Better",
      description:
        "Get scored feedback, drill recommendations, and chat with your AI coach.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-surface">
      <h2 className="text-3xl font-black text-white uppercase text-center mb-12">
        How It Works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((step) => (
          <div key={step.number} className="text-center">
            <div className="text-4xl font-black text-accent mb-4">
              {step.number}
            </div>
            <h3 className="text-xl font-bold text-white uppercase mb-2">
              {step.title}
            </h3>
            <p className="text-muted">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create landing page**

Replace `src/app/page.tsx`:

```tsx
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-xl font-black text-accent uppercase tracking-tight">
          FIGHTLENS AI
        </span>
      </header>
      <Hero />
      <HowItWorks />
      <footer className="text-center py-8 text-muted text-sm border-t border-border">
        FightLens AI — Built for fighters, by fighters.
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/landing/
git commit -m "feat: add landing page with hero and how-it-works sections"
```

---

### Task 22: Final Wiring & Configuration

**Files:**
- Create: `inngest.config.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Create Inngest config**

Create `inngest.config.ts`:

```ts
export { inngest } from "@/lib/inngest/client";
export { analyzeVideo } from "@/lib/inngest/functions/analyze-video";
```

- [ ] **Step 2: Update next.config.ts for large uploads**

Update `next.config.ts` to increase body size limit for video uploads:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Add .gitignore entry for superpowers brainstorm files**

Append to `.gitignore`:

```
.superpowers/
```

- [ ] **Step 4: Final commit**

```bash
git add inngest.config.ts next.config.ts .gitignore
git commit -m "feat: add Inngest config and Next.js upload config"
```
