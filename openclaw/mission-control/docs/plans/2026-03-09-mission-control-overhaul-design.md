# Mission Control Overhaul — Design Document

**Goal:** Rebuild the Mission Control war room so agents visually reflect their real status, move between task-based buildings, and can be communicated with via both the web UI and Telegram per-agent commands.

**Date:** 2026-03-09

---

## Problems Being Solved

1. Agents are stationary at buildings regardless of actual state — can't tell who's working
2. Chat interface throws errors (NVIDIA timeouts, no retry logic)
3. No way to communicate with individual agents via Telegram
4. Idle agents look the same as working agents
5. Sentinel's enforcement behavior is invisible
6. Agent tasks don't map to what's displayed on screen

---

## 1. Buildings & Map Layout

Six task-based buildings arranged in a military compound with dirt path network:

| Building | Purpose | Agents That Go Here |
|----------|---------|---------------------|
| **Barracks** | Idle/sleeping — the penalty box | Any agent with nothing to do |
| **Outreach HQ** | Emails, DMs, follow-ups | Claw (outreach jobs), Bloom (DM outreach) |
| **Content Lab** | Blog posts, SEO, social content | Bloom (content), Claw (content jobs) |
| **Comms Tower** | Telegram, reply checking, inbox | Claw (reply checks, inbox forward) |
| **Intel Room** | Lead discovery, enrichment, research | Claw (lead jobs), Bloom (competitor analysis) |
| **War Room** | Board meetings, strategy, reports | Board (synthesis), Claw (data gather, expert analysis), Sentinel (reports) |

**Visual indicators per building:**
- Lights on = someone inside working
- Dark/quiet = empty
- Red warning light = error occurred in that building

**Layout:** Buildings connected by dirt path network. Barracks off to one side. War Room center-prominent. Paths form a graph so agents can walk realistic routes between any two buildings.

---

## 2. Agent Movement & Animations

### Three States Per Agent

**Idle:** Agent at Barracks. Slow idle animation (breathing/blinking). Muted sprite colors.

**Walking:** Agent moves pixel-by-pixel along dirt paths between buildings. Left/right directional sprites. When a new task starts, agent walks from current position to target building. Consistent walking speed across all agents.

**Working:** Agent at a building, playing a unique working animation:
- **Claw** — Typing rapidly at a terminal
- **Bloom** — Painting/designing on a canvas
- **Board** — Reading/writing at a conference table
- **Forge** — Hammering/building at a workbench
- **Sentinel** — Scanning with binoculars, patrol stance

### Sentinel Yell Interaction

When Sentinel detects an idle agent at Barracks:
1. Sentinel walks to Barracks
2. Speech bubble appears ("MOVE IT!" / "GET TO WORK!")
3. Idle agent starts walking to their assigned building

Visual only — no notification needed (Telegram alerts already exist).

### Pathfinding

Waypoint graph system. Each building has a coordinate position. Paths connect buildings as edges. Agents follow path nodes at consistent speed. No complex A* — just follow road segments between connected nodes.

### Job-to-Building Mapping

```
outreach-send, follow-up-send, dm-outreach     → Outreach HQ
content-creation                                → Content Lab
reply-check-*, inbox-forward                    → Comms Tower
lead-discovery, lead-enrichment, weekly-lead-*  → Intel Room
board-*, weekly-strategy-*, weekly-report, self-improvement → War Room
enforcer-*                                      → Sentinel patrols between buildings
No active job                                   → Barracks
```

---

## 3. Status Detection

### Priority-Ordered Check (replaces current 15-min window logic)

1. **Running right now:** Cron job has `runningAtMs` set, or Sentinel dispatched < 5 min ago with no completion → WORKING at mapped building
2. **Recently completed:** Job finished in last 2 minutes → Brief walk-back-to-barracks animation, checkmark over head
3. **Error state:** `lastRunStatus` is error or `consecutiveErrors > 0` → Agent at the building where they failed, red exclamation mark overhead. Stays until next success.
4. **Truly idle:** No running job, no recent dispatch, no errors → Barracks

### Connection Indicator
- Green dot = SSE stream live
- Red dot = disconnected
- "Last updated X seconds ago" timestamp

---

## 4. Telegram Per-Agent Commands

### Command Routing

Messages to the existing OpenClaw Telegram bot with agent prefix:

```
/claw send 5 more cold emails to verified leads
/bloom check SEO rankings for injectseo.com
/sentinel status report
/board run tonight's meeting early
/forge check for broken cron jobs
```

### Implementation

Gateway-level message preprocessor:
1. Check if message starts with `/claw`, `/bloom`, `/sentinel`, `/board`, `/forge`
2. Strip prefix, route remaining text to that agent via gateway chat API
3. Return agent response to same Telegram chat
4. No prefix = route to `main` (Claw) — preserves current behavior

### Response Format

```
CLAW: Done. Sent 5 emails to verified leads:
- Glow Med Spa (Austin) — angle A
- Pure Skin (Miami) — angle B
```

Agent name prepended so you know who's talking.

### Quick Commands

- `/status` — All agents' current state in one message
- `/idle` — Lists which agents are idle right now

---

## 5. Web Chat Fix

### Current Problems
- NVIDIA free tier timeouts return generic errors
- No retry logic, no loading indicator
- Chat history localStorage only (200 message limit)

### Fixes

1. **Loading state** — Spinner with elapsed time: "Claw is thinking... (12s)"
2. **Error handling** — Show actual error, auto-retry once with fallback model
3. **Agent selector** — Dropdown with color accents (Claw = green, Bloom = pink, etc.)
4. **Session keys** — Proper session key per conversation for context continuity
5. **History limit** — Bump from 200 to 500 messages, still localStorage

---

## Architecture Summary

| Layer | What Changes |
|-------|-------------|
| **Canvas renderer** | New building sprites, path network, waypoint movement system, per-agent working animations, speech bubbles |
| **Map data** | 6 buildings with positions, path graph, job-to-building mapping |
| **Sprites** | New/updated sprites for each agent (idle, walking L/R, working unique), building states (lit/dark/error) |
| **SSE stream** | Tighter status detection (2-min window), enforcer dispatch awareness, connection indicator |
| **Gateway API** | Fix chat endpoint error handling, add retry with fallback model |
| **Telegram plugin** | Add command prefix router for per-agent messaging |
| **Chat UI** | Loading states, error messages, agent selector, session keys |

---

## Tech Stack (unchanged)

- Next.js 16 + React 19
- Canvas 2D for war room rendering
- TailwindCSS 4 + shadcn/ui
- SSE polling (5-second interval)
- OpenClaw gateway API (localhost:18790)
- File-based state (jobs.json, state.json)
