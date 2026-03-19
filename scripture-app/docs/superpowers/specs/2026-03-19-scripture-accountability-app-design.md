# Scripture Study & Accountability App — Design Spec

**Date:** 2026-03-19
**Author:** Aaron McBride + Claude
**Status:** Draft

## Overview

A personal, mobile-first Progressive Web App for consistent LDS scripture study and masturbation accountability. Deployed to Vercel, powered by Gemini AI, backed by Supabase. Single user (Aaron), protected by PIN privacy lock.

## Goals

1. Build a daily scripture study habit with AI-personalized reading plans
2. Provide accountability tools for quitting masturbation — streaks, journaling, emergency support
3. Feel like a native app on mobile (PWA, add-to-home-screen)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS (dark theme, calm aesthetic) |
| AI | Google Gemini API |
| Database | Supabase (Postgres) |
| Hosting | Vercel |
| Scripture Data | Static JSON files shipped with the app |

## App Structure

### Navigation

Bottom tab bar with 4 tabs:

- **Study** — Today's reading assignment, study streak display, guided reflection prompt, mark complete
- **Journal** — Life struggles input, temptation journaling, AI responses
- **Streak** — Clean days counter, emergency button, calendar view
- **Dashboard** — Progress overview (both streaks), stats, check-in history, gear icon for settings

### Settings

Accessible via a gear icon on the Dashboard tab. Contains:
- Change PIN
- Reset reading plan progress
- No other settings needed for a single-user personal app

### PIN Privacy Lock

- 4-digit PIN displayed on app open before any content is accessible
- PIN stored as a hash in Supabase `user_config` table
- Set on first use, can be changed in settings
- **Note:** A 4-digit PIN is a casual privacy lock, not a security boundary. It prevents casual access if someone picks up the phone. The Supabase database is only accessible server-side, which is the real security layer.

### Session Management

- After entering the correct PIN, a session token is stored in localStorage with a 24-hour expiry
- Reopening the app within 24 hours skips the PIN screen
- After 24 hours of inactivity, the PIN is required again
- Clearing browser data requires re-entering the PIN

### PWA

- Service worker for offline caching of scripture data and recent readings
- Web app manifest for add-to-home-screen with no browser chrome
- App icon and splash screen with spiritual/calm branding
- **Notifications:** Deferred to a future iteration. For v1, the app relies on the user's own discipline to open it. Push notifications can be added later via the Web Push API if needed.

## Feature: Scripture Study System

### Reading Plan Engine

- All 4 LDS standard works (Book of Mormon, Bible KJV, Doctrine & Covenants, Pearl of Great Price) broken into chapter-based daily assignments
- Default pace: 1-2 chapters per day
- Sequential order: Book of Mormon → Bible → D&C → Pearl of Great Price
- Each day displays: book name, chapter, and a "Mark Complete" button
- Study streak tracked (consecutive days with a completed reading) — displayed on both the Study tab and the Dashboard
- **Completion behavior:** When all 4 standard works are finished, the plan restarts from 1 Nephi 1. A "Completed Full Cycle" badge is shown on the Dashboard.

### AI-Adjusted Reading Plan

- Journal entries are analyzed by Gemini for **recurring themes and big-picture patterns**
- The AI does NOT react to one-off bad days or minor events
- **Trigger threshold:** At least 3 journal entries touching a similar theme within 14 days before the AI considers adjusting the plan. The Gemini prompt enforces this heuristic.
- When a significant recurring theme is detected (e.g., repeated entries about feeling purposeless, relationship struggles, anger, temptation patterns), the AI swaps the next 3-5 daily readings to scriptures that speak directly to that theme
- After the themed detour, the plan returns to the sequential position where the user left off
- A note is displayed explaining the adjustment: "Based on what you've been going through, these chapters may speak to you right now"
- Adjustments are logged in the `ai_adjustments` table with detected theme, reasoning, and selected scriptures

### Guided Prompts

- After marking a reading complete, Gemini generates a reflection question tied to the chapter content
- The user can write a short response or skip
- Both the AI-generated question and the user's response are saved in `journal_entries` with type `reflection`

## Feature: Accountability System

### Clean Streak Counter

- Prominent display of current clean days count
- Shows all-time longest streak
- "Reset" button to restart at Day 0 after a slip — no judgment, just a reset
- Calendar heatmap view showing clean days vs. reset days over time
- **Missing check-in days:** Days with no evening check-in are displayed as gray/neutral on the calendar — not counted as clean or unclean

### Daily Check-ins

- **Morning check-in:** "How are you feeling today?" — mood selector (1-5 scale) + optional text note
- **Evening check-in:** "How did today go?" — log clean/not clean status, mood, optional note
- AI responds to each check-in with brief encouragement and a relevant scripture
- Check-ins stored in `journal_entries` with type `checkin_morning` or `checkin_evening`

### Trigger Journaling

- Accessible from the Journal tab via an "I'm struggling" button
- User writes what they're feeling in the moment
- Gemini responds with:
  - Empathetic acknowledgment
  - A relevant scripture
  - A practical redirect suggestion (go for a walk, call someone, pray, do push-ups, etc.)
- These entries are tagged `trigger` and feed into the reading plan's theme detection
- Recurring temptation patterns cause the AI to lean the reading plan toward scriptures about strength, self-mastery, and the Atonement

### Emergency Button

- Always visible on the Streak tab — distinct, easy to tap
- One tap displays a full-screen scripture about strength, resisting temptation, or Christ's love
- Scriptures drawn from a curated list of ~50 emergency scriptures stored in `/data/emergency-scriptures.json`
- Gemini can personalize the selection based on recent journal history
- No journaling required — instant spiritual reinforcement
- Different scripture each time — recently shown scriptures tracked in `emergency_log` table to avoid repeats

## Database Schema (Supabase)

### `user_config`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Single row for single user |
| pin_hash | text | Hashed 4-digit PIN (privacy lock) |
| current_book | text | Current book in reading plan |
| current_chapter | int | Current chapter position |
| study_streak | int | Current consecutive study days |
| longest_study_streak | int | All-time best study streak |
| cycles_completed | int | How many times all 4 works have been read through |
| created_at | timestamptz | Account creation |
| updated_at | timestamptz | Last update |

### `reading_log`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| date | date | Reading date |
| book | text | Scripture book name |
| chapter | int | Chapter number |
| completed | boolean | Whether marked complete |
| is_ai_adjusted | boolean | Whether this was an AI-adjusted reading |
| created_at | timestamptz | |

### `journal_entries`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| type | text | `reflection`, `trigger`, `checkin_morning`, `checkin_evening` |
| reading_log_id | uuid (FK, nullable) | Links reflections back to the specific reading |
| content | text | User's written entry |
| ai_prompt | text | AI-generated question (for reflections) |
| mood | int | 1-5 mood scale (for check-ins) |
| clean_today | boolean | For evening check-ins |
| ai_response | text | Gemini's response |
| created_at | timestamptz | |

### `clean_streak`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| start_date | date | When current streak began |
| end_date | date | Null if active, set on reset |
| is_current | boolean | Whether this is the active streak |
| created_at | timestamptz | |

**Note:** `days` is computed at read time as the difference between `start_date` and now (if active) or `start_date` and `end_date` (if ended). Not stored as a column.

### `ai_adjustments`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| detected_theme | text | What pattern the AI identified |
| reasoning | text | Why it adjusted the plan |
| scriptures | jsonb | Array of adjusted readings |
| original_position | jsonb | Where the user was in the sequential plan |
| created_at | timestamptz | |

### `emergency_log`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| scripture_ref | text | Reference to the scripture shown (e.g., "alma-36:3") |
| shown_at | timestamptz | When it was displayed |

## Security

- Gemini API key stored as Vercel environment variable (`GEMINI_API_KEY`), never exposed to client
- All AI calls routed through Next.js API routes (`/api/ai/*`)
- PIN hashed before storage (simple hash — this is a privacy lock, not a security boundary)
- Supabase connection via server-side only (service role key in env vars)
- No public Supabase access — all DB operations through API routes

## Scripture Data

- Static JSON files shipped with the app in `/data/scriptures/`
- One file per book (e.g., `1-nephi.json`, `genesis.json`, `dc.json`)
- Each file contains: book name, total chapter count, and an ordered chapter list with chapter numbers
- These are **reading plan metadata only** — not full scripture text. The app tells the user what to read; the user reads from their own scriptures (physical or Gospel Library app).
- Source: Chapter counts and book order derived from publicly available LDS scripture indexes
- Emergency scriptures (`/data/emergency-scriptures.json`): ~50 curated references with the verse text included, since these need to display immediately in-app
- No external scripture API dependency — fully self-contained

## UI/UX Notes

- Dark theme with calm, spiritual aesthetic (deep blues, muted golds)
- Large, tappable elements — designed for thumb navigation
- Emergency button is visually distinct (larger, different color) and always accessible
- Full-screen scripture display for emergency mode — nothing else on screen
- Minimal text input required — mood selectors, toggles, and buttons where possible
- Journal text input with generous sizing for mobile keyboards
