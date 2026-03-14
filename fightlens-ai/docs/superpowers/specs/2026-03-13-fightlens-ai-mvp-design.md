# FightLens AI — MVP Design Spec

## Overview

FightLens AI is a web-based platform that uses multimodal AI and computer vision to analyze combat sports training footage and provide instant, coach-quality feedback. Users upload videos of their boxing or BJJ training, and receive a structured breakdown of technique, positioning, tactical decisions, and areas for improvement — plus a conversational AI coach for follow-up questions.

## Goals

- Deliver AI-powered video analysis that feels like getting feedback from a real coach
- Support Boxing and BJJ at launch with architecture that makes adding sports trivial
- Free tier only at launch — validate product-market fit before monetizing
- Keep per-analysis costs under $0.16 for sustainable unit economics at scale

## Non-Goals (MVP)

- Native mobile apps (future phase)
- Payment processing / subscription tiers
- Wrestling, MMA, Muay Thai sport modes (post-launch additions via new prompt templates)
- MediaPipe / pose estimation (Phase 3 enhancement)
- Gym/Team multi-user dashboards
- In-app video recording

---

## Architecture

### System Overview

```
User's Browser (Next.js on Vercel)
    ↓ upload video (file picker from camera roll)
Next.js API Route
    ↓ streams video to Cloudflare R2
    ↓ creates job in Inngest queue
    ↓ returns "processing" status to user

Background Worker (Inngest function on Railway)
    ↓ downloads video from R2
    ↓ FFmpeg extracts key frames (1 per 2 seconds)
    ↓ smart frame selection — top 40-60 most action-relevant frames
    ↓ sends frames + sport-specific prompt to AI (model-agnostic layer)
    ↓ parses structured response (scores, feedback, drills)
    ↓ saves analysis + scores to Supabase/PostgreSQL
    ↓ marks job complete

User's Browser (Supabase Realtime subscription)
    → receives notification that analysis is ready
    → displays scores, feedback, drill recommendations
    → opens AI coach chat thread for follow-up questions
```

### Why This Architecture

Video analysis takes 60-90 seconds (frame extraction + sending 40-60 images to a vision API). This exceeds Vercel's API route timeout limits. A background job queue (Inngest) handles this cleanly:

- User uploads and gets an immediate response ("we're analyzing your footage")
- Processing happens async in a Railway-hosted worker with no timeout constraints
- Supabase Realtime notifies the browser when analysis is complete
- Inngest provides built-in retries, observability, and failure handling

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 15 (App Router) | SSR, file-based routing, API routes, React Server Components |
| Styling | Tailwind CSS | Utility-first, dark theme support, rapid iteration |
| Components | shadcn/ui | Accessible, composable, matches dark aesthetic |
| Charts | Recharts | Progress line charts, radar/spider charts for dimension scores |
| Background Jobs | Inngest | Serverless queue, no Redis needed, built-in retries, free tier |
| Video Processing | FFmpeg | Frame extraction, transcoding, industry standard |
| AI Analysis | Model-agnostic layer | Swap between Claude, GPT-4o, Gemini via config |
| Video Storage | Cloudflare R2 | S3-compatible, no egress fees, $0.015/GB/month |
| Database | Supabase (PostgreSQL) | User data, analyses, scores, chat history, realtime subscriptions |
| Auth | Supabase Auth | Email/password + Google OAuth, built into Supabase |
| Frontend Hosting | Vercel | Free tier, automatic deployments, edge network |
| Worker Hosting | Railway | Long-running process support for Inngest worker |
| Language | TypeScript | Type safety across frontend and backend |
| Package Manager | pnpm | Fast, disk-efficient |

---

## Data Model

### Users
| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | Supabase Auth user ID |
| email | text | User email |
| name | text | Display name |
| avatar_url | text | Profile image URL |
| sport_preferences | text[] | Selected sports (boxing, bjj) |
| experience_level | text | beginner, intermediate, advanced |
| created_at | timestamptz | Account creation |

### Videos
| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | |
| user_id | uuid (FK → Users) | |
| storage_url | text | R2 object key |
| sport_mode | text | boxing or bjj |
| duration_seconds | integer | Video length |
| status | text | uploading → processing → completed → failed |
| notes | text | Optional user notes ("focused on guard passing") |
| thumbnail_url | text | Auto-generated thumbnail |
| file_size_bytes | bigint | Original file size |
| uploaded_at | timestamptz | |

### Analyses
| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | |
| video_id | uuid (FK → Videos) | |
| user_id | uuid (FK → Users) | |
| sport_mode | text | boxing or bjj |
| overall_score | numeric(3,1) | 1.0–10.0 |
| summary | text | Main AI feedback narrative |
| strengths | jsonb | Array of strength descriptions |
| weaknesses | jsonb | Array of weakness descriptions |
| drill_recommendations | jsonb | Array of {name, description, target_weakness} |
| raw_ai_response | jsonb | Full AI response for debugging |
| model_used | text | Which AI model generated this |
| frame_count | integer | Number of frames sent to AI |
| processing_time_ms | integer | Total processing duration |
| created_at | timestamptz | |

### Scores
| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | |
| analysis_id | uuid (FK → Analyses) | |
| user_id | uuid (FK → Users) | For easy querying of trends |
| sport_mode | text | |
| dimension | text | e.g. guard_discipline, footwork |
| score | numeric(3,1) | 1.0–10.0 |
| feedback | text | Dimension-specific AI comment |

### Chat Messages
| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | |
| analysis_id | uuid (FK → Analyses) | |
| user_id | uuid (FK → Users) | |
| role | text | user or assistant |
| content | text | Message text |
| token_count | integer | For cost tracking |
| created_at | timestamptz | |

### Frames
| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | |
| video_id | uuid (FK → Videos) | |
| timestamp_seconds | numeric(6,2) | Position in video |
| storage_url | text | R2 object key |
| sequence_number | integer | Order in sequence |

### Scoring Dimensions by Sport

**Boxing:** guard_discipline, footwork, punch_selection, punch_mechanics, defensive_movement, ring_positioning, combinations, distance_management

**BJJ:** guard_retention, sweeps, submission_attempts, posture, positional_hierarchy, escapes, transitions, grip_fighting

---

## Pages & User Flow

### Landing Page (`/`)
- Hero section: "AI-Powered Combat Sports Coaching"
- How it works: 3 steps (Upload → AI Analyzes → Get Better)
- Sport modes showcase (Boxing, BJJ)
- CTA → Sign up

### Auth (`/login`, `/signup`)
- Supabase Auth: email/password + Google OAuth
- After signup → onboarding

### Onboarding (`/onboarding`)
- Pick sport(s): Boxing, BJJ, or both
- Experience level: Beginner / Intermediate / Advanced
- Redirect to dashboard

### Dashboard (`/dashboard`)
- Prominent upload button
- Last 5 analyses (cards with sport, date, overall score)
- Progress summary: overall score trend line
- Strengths/weaknesses spider chart (aggregated from recent analyses)
- Training streak counter
- Quick stats: total sessions, average score, strongest dimension

### Upload (`/upload`)
- File picker (accepts .mp4, .mov, .webm, .avi — max 500MB, max 10 min)
- Sport mode selector (Boxing or BJJ)
- Optional notes field
- Upload progress bar
- Client-side validation: file size, duration, format
- Redirect to processing screen on success

### Processing (`/analysis/[id]/processing`)
- Animated progress indicator
- Status updates ("Extracting frames...", "Analyzing technique...", "Generating feedback...")
- Estimated time remaining
- Auto-redirect to analysis view when Supabase Realtime signals completion

### Analysis View (`/analysis/[id]`)
- Video player (uploaded footage)
- Overall score (large, prominent)
- Dimension scores (bar chart or radar chart)
- Summary feedback (main AI narrative)
- Strengths section (bulleted, with detail)
- Weaknesses section (bulleted, with detail)
- Drill recommendations (name + description + which weakness it targets)
- "Chat with AI Coach" button

### AI Coach Chat (`/analysis/[id]/chat`)
- Chat interface anchored to this specific analysis
- AI pre-loaded with: original frames (subset), analysis results, sport mode, user experience level
- Suggested starter questions ("What should I do when he takes my back?", "Why did my jab keep getting countered?")
- Full conversational back-and-forth
- Streaming responses

### History (`/history`)
- All past analyses in a list/grid
- Filter by sport mode
- Sort by date or score
- Click any to view full analysis

### Progress (`/progress`)
- Score trends over time (line chart, one line per dimension)
- Spider/radar chart comparing all dimensions
- Milestone badges (first analysis, 10 sessions, 50 sessions, etc.)
- Sport-specific toggle (view boxing or BJJ separately)

---

## AI Analysis Engine

### Frame Extraction Pipeline

1. **Input validation**: Accept .mp4, .mov, .webm, .avi. Max 500MB, max 10 minutes.
2. **Transcoding**: Normalize to mp4 via FFmpeg if needed.
3. **Frame extraction**: FFmpeg extracts 1 frame per 2 seconds. A 3-minute video yields ~90 frames.
4. **Resize**: Scale frames to 720p max width (maintains quality, reduces API token cost).
5. **Smart selection**: Score frames for "action" content (motion, position changes between consecutive frames). Select top 40-60 most relevant frames. Discard rest periods, resets, and static moments.

### Sport-Specific Prompts

Each sport mode has a structured system prompt that instructs the AI to:

- Analyze all provided frames as a sequence of a combat sports training session
- Score each dimension on a 1-10 scale with specific feedback
- Identify top 3 strengths and top 3 weaknesses
- Provide an overall narrative summary
- Recommend specific drills targeting identified weaknesses
- Return response in a strict JSON schema

The prompt includes dimension definitions, common mistakes to flag, and scoring rubrics specific to each sport.

### Model-Agnostic Provider Layer

```
analyzeVideo(frames: Buffer[], sportMode: string, provider?: string): AnalysisResult

providers/
  ├── claude.ts    → Anthropic Messages API with vision
  ├── openai.ts    → GPT-4o Chat Completions with vision
  └── gemini.ts    → Gemini Pro Vision

Each implements:
  sendFrames(frames: Buffer[], systemPrompt: string): RawResponse
  parseResponse(raw: RawResponse): AnalysisResult

Config selects default provider. Can A/B test across providers.
Fallback chain: if primary fails after 3 retries, try next provider.
```

### AI Coach Chat Context

When a user opens chat for an analysis, the AI receives:
- A representative subset of the original frames (10-15 key frames)
- The complete analysis results (scores, feedback, strengths, weaknesses)
- The sport mode and user's experience level
- Full chat history for this analysis thread

This enables contextual responses like referencing specific moments in the video.

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Video too large (>500MB) | Client-side check, show file size limit |
| Video too long (>10 min) | Client-side duration check via video element |
| Unsupported format | Accept .mp4/.mov/.webm/.avi, transcode to mp4 via FFmpeg |
| Upload fails mid-way | Chunked/resumable upload, retry from last chunk |
| AI API call fails | Retry 3x with exponential backoff, then fallback to next provider |
| AI returns invalid response | Validate against JSON schema, retry with stricter prompt |
| Frame extraction fails | Mark as failed, show "couldn't process video" with retry button |
| Non-combat-sports video | AI prompt flags irrelevant content, returns appropriate message |
| All AI providers fail | Mark analysis as failed, show retry button, log for investigation |

---

## Visual Identity

- **Theme**: Dark & aggressive
- **Background**: Near-black (#0a0a0a, #111111)
- **Primary accent**: Red (#ff3b30)
- **Text**: White (#ffffff) and muted gray (#a3a3a3)
- **Typography**: Bold, uppercase for headings. Modern sans-serif (Inter or similar).
- **Cards/surfaces**: Dark gray (#1a1a1a) with subtle borders
- **Sport mode badges**: Red-filled for selected, outlined for available
- **Scores**: Red for low (1-4), yellow for mid (5-7), green for high (8-10)
- **Overall feel**: Fight night broadcast energy. Confident, intense, no-nonsense.

---

## Constraints & Limits

| Constraint | Value |
|-----------|-------|
| Max video file size | 500 MB |
| Max video duration | 10 minutes |
| Accepted formats | .mp4, .mov, .webm, .avi |
| Frames sent to AI | 40-60 per analysis |
| Frame resolution | 720p max width |
| Expected analysis time | 60-90 seconds |
| AI response format | Strict JSON schema |
| Score range | 1.0 – 10.0 |
| Chat context | 10-15 key frames + analysis + history |
| Cost per analysis | $0.05 – $0.16 |

---

## Future Enhancements (Post-MVP)

- Additional sport modes: Wrestling, MMA, Muay Thai (new prompt templates)
- Payment tiers: Free / Fighter ($14.99) / Pro ($29.99) / Gym ($99-249) via Stripe
- Native mobile apps (React Native)
- MediaPipe pose estimation for biomechanical data
- Side-by-side video comparison
- Gym/Team multi-user dashboards with coach features
- Drill video library with instructional content
- Export analysis reports as PDF
- In-app video recording
