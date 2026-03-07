# Mission Control: The War Room Redesign

**Date:** 2026-03-07
**Status:** Approved

## Overview

Redesign the Mission Control Command Center into a pixel-art war room with live agent activity tracking. Each agent gets a retro RPG-style pixel sprite character. The main dashboard becomes a top-down command center map showing projects as bases with agents working at them in real-time.

## Mission Statement

**Tone:** War room / military ops
**Text:** "NEVER STOP. NEVER SLEEP. ACCOMPLISH THE MISSION. 24/7. BY ANY MEANS NECESSARY."

Displayed as a permanent top banner with pixel font, red accents, CRT scan-line effect, and pulsing LIVE indicator.

## Projects (Active)

| Project | Description | Building Style |
|---------|-------------|----------------|
| InjectSEO | Main business - outreach, lead gen, pipeline | Radar dish / comms tower |
| MedSEO | InjectSEO website (hand in hand with InjectSEO) | Server rack building |
| Goal Tracker | Mostly done, feature additions & marketing | Flag / beacon tower |

Plus a special **Forge Station** (workshop with anvil) for the builder agent.

## Agents

### Claw (main)
- **Role:** Primary autonomous agent - strategy, communication, business ops
- **Sprite:** Hooded figure with glowing green eyes, dark cloak, tactical
- **Palette:** Dark greens, black, bright green eye glow
- **Animations:** Idle (breathing + eye pulse), Working (typing at hologram terminal), Moving (2-frame walk)

### Bloom (marketer)
- **Role:** Digital marketing agent for InjectSEO
- **Sprite:** Character with flower/leaf headpiece, carries megaphone/scroll
- **Palette:** Pinks, magentas, soft greens, gold accents
- **Animations:** Idle (flower sways), Working (writing/scrolling + sparkles), Moving (bouncy walk)

### The Board (board-moderator)
- **Role:** Nightly advisory board synthesizer
- **Sprite:** Stern figure in long coat/robe, gavel, silhouettes of 8 experts behind
- **Palette:** Deep purples, golds, white accents
- **Animations:** Idle (arms crossed, coat flutter), Working (gavel strike + papers fly), Moving (slow stride)

### Forge (builder)
- **Role:** Dedicated coding sub-agent
- **Sprite:** Stocky blacksmith with apron, hammer, goggles on forehead
- **Palette:** Oranges, deep reds, iron grey, spark yellows
- **Animations:** Idle (polishing hammer), Working (hammer strikes + sparks + code symbols float), Moving (heavy walk)

## Architecture

### Command Center Map (Canvas)

The main dashboard page renders a full-width HTML Canvas element:
- **Native resolution:** 320x240 pixel grid, scaled up with `image-rendering: pixelated`
- **Tile system:** 16x16 pixel tiles for ground/terrain
- **Terrain:** Dark ground with circuit-board trace patterns connecting bases, blinking lights
- **Project bases:** Pixel art buildings (8-16px tall native) with labels, status glow (green/amber/red)
- **Agent sprites:** 16x16 pixel characters positioned at their active project base
- **Interactions:** Click base to open project detail panel, click agent to open agent detail panel
- **Animation loop:** requestAnimationFrame at ~8 FPS for retro feel

### Sprite System

All sprites defined as pixel arrays in TypeScript (no external image files):
```typescript
type SpriteFrame = number[][] // 16x16 grid, each value is a palette index
type SpriteSheet = {
  idle: SpriteFrame[]
  working: SpriteFrame[]
  walking: SpriteFrame[]
  palette: string[]          // hex colors
}
```

Agent positioning logic:
- Agent placed at the project base they're currently working on
- No active task = idle at "home" position
- Task on different project = walk animation to new base
- Multiple agents at same base = offset positions

### Live Activity System

**New SSE events** from `/api/stream`:

```typescript
type AgentActivityEvent = {
  type: 'agent-activity'
  data: {
    agentId: string
    action: 'working' | 'idle' | 'completed' | 'error'
    project?: string
    description: string
    timestamp: number
  }
}
```

**Data sources polled by stream route:**
1. Cron job execution status
2. Agent session logs (`~/.openclaw/agents/<id>/sessions/`)
3. Today's memory files (`memory/YYYY-MM-DD.md`)
4. Git activity in project repos

**Bottom ticker:** Military comms-style scrolling feed:
- Monospace pixel font, green text on dark
- Format: `> AGENT > Project :: Description...`
- Auto-scrolls, most recent at bottom
- Click to open details

### Agent Detail Panel (Slide-out)

Click any agent sprite to open a right-side panel:
- Large pixel sprite render
- Current task + project assignment
- Recent activity log (last 10 actions)
- Model info (primary + fallback)
- Chat interface (existing, restyled to match war room aesthetic)

### Project Detail Panel (Slide-out)

Click any project base to open:
- Project name, description, status
- Assigned agents (with mini sprites)
- Active cron jobs
- Recent activity for that project
- Widget dashboard (existing functionality)

## Visual Design

### Color Palette
```
Background:     #0a0a0f (near-black, blue undertone)
Map ground:     #12121a (dark tile base)
Grid lines:     #1a1a2e (subtle circuit traces)
Primary text:   #00ff41 (terminal green)
Accent red:     #ff2d2d (mission critical / errors)
Accent amber:   #ffa500 (warnings / pending)
Card bg:        #141420 (panels and overlays)
Border:         #2a2a3e (subtle edges)
```

### Typography
- **Headers / Mission statement:** "Press Start 2P" (Google Fonts pixel font)
- **Body / Activity text:** "JetBrains Mono" (already in use)
- **Labels / Badges:** "Press Start 2P" at small sizes

### Effects
- CRT scan-line overlay on mission statement banner
- Text flicker on sidebar hover states
- Status glow halos around project bases
- Spark particles from Forge when building
- Pulse animation on LIVE indicator

### Sidebar
- Keep 6 navigation items, restyle with pixel-art icons (drawn in CSS/SVG)
- Active state: bright green left border + glow
- Hover: brief text flicker (CRT effect)

### Other Pages
Agents, Cron, Projects, Board, Settings keep current functionality but get:
- New color palette applied
- Pixel fonts for headers
- War room styling (stencil labels, green/amber status indicators)
- Map only appears on Command Center page

## Data Flow

```
OpenCLAW Gateway
  ├── /v1/health → Gateway status
  ├── cron/jobs.json → Cron job state
  ├── agents/<id>/sessions/ → Agent session logs
  └── workspace/memory/ → Agent memory files
         │
         ▼
  /api/stream (SSE)
  ├── health events (existing)
  ├── cron events (existing)
  ├── agent-activity events (NEW)
  └── heartbeat events (existing)
         │
         ▼
  SSE Provider (React Context)
         │
    ┌────┴────────────┐
    ▼                 ▼
  Map Canvas     Activity Ticker
  (sprites,      (scrolling feed)
   bases,
   positions)
```

## Scope

### In Scope
- Command Center page redesign with canvas map
- 4 agent pixel sprites with animation states
- 3 project bases + Forge Station
- Live activity SSE events
- Activity ticker
- Agent/project detail slide-out panels
- Mission statement banner
- Color palette + typography update across all pages
- Sidebar pixel-art restyle

### Out of Scope
- Sound effects (can add later)
- Mobile-specific map interactions
- Multi-user support
- Map editor / customization UI
