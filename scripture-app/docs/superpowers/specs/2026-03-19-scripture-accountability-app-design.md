# Scripture Study & Accountability App — Design Spec

**Date:** 2026-03-19
**Author:** Aaron McBride + Claude
**Status:** Draft

## Overview

A personal, mobile-first Progressive Web App for consistent LDS scripture study and masturbation accountability. Deployed to Vercel, powered by Gemini AI, backed by Supabase. Single user (Aaron), protected by PIN lock.

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

- **Study** — Today's reading assignment, guided reflection prompt, mark complete
- **Journal** — Life struggles input, temptation journaling, AI responses
- **Streak** — Clean days counter, emergency button, calendar view
- **Dashboard** — Progress overview, stats, check-in history

### PIN Lock

- 4-digit PIN displayed on app open before any content is accessible
- PIN stored as a hash in Supabase `user_config` table
- Set on first use, can be changed in settings

### PWA

- Service worker for offline caching of scripture data and recent readings
- Web app manifest for add-to-home-screen with no browser chrome
- App icon and splash screen with spiritual/calm branding

## Feature: Scripture Study System

### Reading Plan Engine

- All 4 LDS standard works (Book of Mormon, Bible KJV, Doctrine & Covenants, Pearl of Great Price) broken into chapter-based daily assignments
- Default pace: 1-2 chapters per day
- Sequential order: Book of Mormon → Bible → D&C → Pearl of Great Price
- Each day displays: book name, chapter, and a "Mark Complete" button
- Study streak tracked (consecutive days with a completed reading)

### AI-Adjusted Reading Plan

- Journal entries are analyzed by Gemini for **recurring themes and big-picture patterns**
- The AI does NOT react to one-off bad days or minor events
- When a significant recurring theme is detected (e.g., repeated entries about feeling purposeless, relationship struggles, anger, temptation patterns), the AI swaps the next 3-5 daily readings to scriptures that speak directly to that theme
- After the themed detour, the plan returns to the sequential position where the user left off
- A note is displayed explaining the adjustment: "Based on what you've been going through, these chapters may speak to you right now"
- Adjustments are logged in the `ai_adjustments` table with detected theme, reasoning, and selected scriptures

### Guided Prompts

- After marking a reading complete, Gemini generates a reflection question tied to the chapter content
- The user can write a short response or skip
- Responses are saved in `journal_entries` with type `reflection`

## Feature: Accountability System

### Clean Streak Counter

- Prominent display of current clean days count
- Shows all-time longest streak
- "Reset" button to restart at Day 0 after a slip — no judgment, just a reset
- Calendar heatmap view showing clean days vs. reset days over time

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
- Scriptures drawn from a curated list of ~50 emergency scriptures
- Gemini can personalize the selection based on recent journal history
- No journaling required — instant spiritual reinforcement
- Different scripture each time (tracks recently shown to avoid repeats)

## Database Schema (Supabase)

### `user_config`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Single row for single user |
| pin_hash | text | Hashed 4-digit PIN |
| current_book | text | Current book in reading plan |
| current_chapter | int | Current chapter position |
| study_streak | int | Current consecutive study days |
| longest_study_streak | int | All-time best study streak |
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
| type | text | `struggle`, `reflection`, `trigger`, `checkin_morning`, `checkin_evening` |
| content | text | User's written entry |
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
| days | int | Streak length |
| is_current | boolean | Whether this is the active streak |
| created_at | timestamptz | |

### `ai_adjustments`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| detected_theme | text | What pattern the AI identified |
| reasoning | text | Why it adjusted the plan |
| scriptures | jsonb | Array of adjusted readings |
| original_position | jsonb | Where the user was in the sequential plan |
| created_at | timestamptz | |

## Security

- Gemini API key stored as Vercel environment variable (`GEMINI_API_KEY`), never exposed to client
- All AI calls routed through Next.js API routes (`/api/ai/*`)
- PIN hashed before storage (bcrypt or similar)
- Supabase connection via server-side only (service role key in env vars)
- No public Supabase access — all DB operations through API routes

## Scripture Data

- Static JSON files shipped with the app in `/data/scriptures/`
- One file per book (e.g., `1-nephi.json`, `genesis.json`, `dc.json`)
- Each file contains chapter count and chapter metadata
- No external scripture API dependency — fully self-contained

## UI/UX Notes

- Dark theme with calm, spiritual aesthetic (deep blues, muted golds)
- Large, tappable elements — designed for thumb navigation
- Emergency button is visually distinct (larger, different color) and always accessible
- Full-screen scripture display for emergency mode — nothing else on screen
- Minimal text input required — mood selectors, toggles, and buttons where possible
- Journal text input with generous sizing for mobile keyboards
