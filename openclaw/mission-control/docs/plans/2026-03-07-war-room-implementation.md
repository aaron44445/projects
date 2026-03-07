# War Room Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Mission Control Command Center into a pixel-art war room with retro RPG agent sprites, a top-down map showing projects as bases, live agent activity streaming, and a military ops mission statement.

**Architecture:** Canvas-based pixel art map rendered at low native resolution (320x240) and scaled up with `image-rendering: pixelated`. Sprite data defined as TypeScript arrays (no image files). New SSE event type `agent-activity` for live task streaming. Slide-out panels for agent/project detail. Press Start 2P pixel font for headers.

**Tech Stack:** Next.js 16, React 19, HTML Canvas 2D, Tailwind CSS 4, Press Start 2P (Google Fonts), existing shadcn/ui components, SSE via EventSource.

---

### Task 1: Add Press Start 2P Font and Update Color Palette

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: Add Press Start 2P font import to root layout**

In `src/app/layout.tsx`, add the pixel font alongside existing fonts:

```tsx
import { Inter, JetBrains_Mono, Press_Start_2P } from "next/font/google";

const pressStart2P = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});
```

Add the variable to the body className:
```tsx
<body className={`${inter.variable} ${jetbrainsMono.variable} ${pressStart2P.variable} font-sans antialiased`}>
```

**Step 2: Update CSS variables for war room palette**

In `src/app/globals.css`, add the new font variable to the `@theme inline` block:
```css
--font-pixel: var(--font-pixel);
```

Update the `:root` and `.dark` CSS variable blocks to use the war room palette:
```css
--background: #0a0a0f;
--foreground: #e0e0e0;
--card: #141420;
--card-foreground: #e0e0e0;
--primary: #00ff41;
--primary-foreground: #0a0a0f;
--secondary: #1a1a2e;
--secondary-foreground: #e0e0e0;
--muted: #1a1a2e;
--muted-foreground: #666680;
--border: #2a2a3e;
--accent: #00ff41;
--accent-foreground: #0a0a0f;
--destructive: #ff2d2d;
```

Add war-room-specific custom properties:
```css
--color-terminal-green: #00ff41;
--color-mission-red: #ff2d2d;
--color-mission-amber: #ffa500;
--color-map-ground: #12121a;
--color-map-grid: #1a1a2e;
```

Update the body background to use a darker grid pattern with green traces instead of blue:
```css
body {
  @apply bg-background text-foreground;
  background-image:
    linear-gradient(rgba(0, 255, 65, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 65, 0.02) 1px, transparent 1px);
  background-size: 32px 32px;
}
```

**Step 3: Verify the dev server still builds**

Run: `cd C:/projects/openclaw/mission-control && npm run dev`
Expected: No build errors, pages render with updated colors.

**Step 4: Commit**
```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: add Press Start 2P font and war room color palette"
```

---

### Task 2: Create Pixel Sprite Data System

**Files:**
- Create: `src/lib/sprites.ts`

**Step 1: Create the sprite type system and all 4 agent sprite definitions**

Create `src/lib/sprites.ts` with:

```typescript
// Sprite frame: 16x16 grid where each cell is a palette color index (0 = transparent)
export type SpriteFrame = number[][];

export interface SpriteSheet {
  name: string;
  palette: string[]; // index 0 is always transparent
  idle: SpriteFrame[];
  working: SpriteFrame[];
  walkRight: SpriteFrame[];
  walkLeft: SpriteFrame[];
  size: number; // native pixel size (16)
}

export interface AgentSprite {
  agentId: string;
  label: string;
  sheet: SpriteSheet;
}
```

Then define the actual pixel art for each agent as hardcoded arrays. Each sprite is a 16x16 grid. Use 2-frame idle animations, 2-frame work animations, and 2-frame walk cycles.

**Claw** - Hooded figure, green eyes:
- Palette: transparent, #1a1a2a (dark cloak), #2d2d3d (cloak highlight), #00ff41 (green glow), #0a3a0a (dark green), #3a3a4a (hood shadow), #141414 (deep shadow)
- Idle frame 1: Standard pose
- Idle frame 2: Shift 1px up (breathing)
- Working: Arm extended to floating terminal
- Walk: 2-frame leg alternation

**Bloom** - Flower character, pink accents:
- Palette: transparent, #ff69b4 (pink), #ff1493 (deep pink), #90ee90 (light green), #ffd700 (gold), #4a4a5a (body), #2a2a3a (shadow)
- Flower headpiece sways between frames

**The Board** - Robed judge figure, purple/gold:
- Palette: transparent, #6a0dad (purple), #9b59b6 (light purple), #ffd700 (gold), #2a2a3a (shadow), #4a4a5a (robe body), #e0e0e0 (white accent)
- Silhouette behind main figure

**Forge** - Stocky blacksmith, orange:
- Palette: transparent, #ff6600 (orange), #cc3300 (dark red), #888888 (iron), #ffcc00 (spark), #4a3a2a (apron), #2a2a3a (shadow)
- Working: Hammer strike with spark particles

Each sprite is approximately 80-120 lines of pixel data. The full file will be ~500-600 lines.

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**
```bash
git add src/lib/sprites.ts
git commit -m "feat: add pixel sprite data for all 4 agents"
```

---

### Task 3: Create Project Base Definitions and Map Data

**Files:**
- Create: `src/lib/map-data.ts`

**Step 1: Define project base types and map layout**

```typescript
export type BaseStyle = "comms-tower" | "server-rack" | "beacon-tower" | "forge-station";

export interface ProjectBase {
  projectId: string;
  name: string;
  style: BaseStyle;
  x: number; // grid position (in 16px tiles)
  y: number;
  status: "active" | "idle" | "error";
  palette: string[];
  frames: number[][][]; // pixel art frames for the building
}

export interface MapConfig {
  width: number;   // in tiles
  height: number;  // in tiles
  tileSize: number; // 16
  bases: ProjectBase[];
  homePosition: { x: number; y: number }; // where idle agents go
  paths: Array<{ from: string; to: string; waypoints: Array<{ x: number; y: number }> }>;
}
```

Define the 4 bases with pixel art:
- **InjectSEO** (comms-tower): Position top-left area. Radar dish building, ~16x24 pixels
- **MedSEO** (server-rack): Position top-right area. Server building with blinking lights
- **Goal Tracker** (beacon-tower): Position bottom-left. Tower with flag/beacon
- **Forge Station** (forge-station): Position bottom-right. Workshop with anvil

Define paths between bases (arrays of waypoints for agent walking).

Define the `getDefaultMapConfig()` function that returns the full map configuration.

**Step 2: Commit**
```bash
git add src/lib/map-data.ts
git commit -m "feat: add project base definitions and map layout data"
```

---

### Task 4: Build the Canvas Map Renderer

**Files:**
- Create: `src/components/command-center/war-room-map.tsx`

**Step 1: Create the canvas component with terrain rendering**

Build a React component that:
1. Creates a `<canvas>` element
2. Renders at a low native resolution (e.g., 480x320) for pixel art crispness
3. Scales up to fill the container with `image-rendering: pixelated` CSS
4. Uses `requestAnimationFrame` for the render loop (throttled to ~8 FPS)

The renderer draws in layers:
1. **Ground layer**: Fill with `#12121a`, draw subtle grid lines in `#1a1a2e`
2. **Circuit traces**: Lines connecting bases in `#1a1a2e` with occasional bright green dots
3. **Base buildings**: Draw each project base's pixel art at its grid position
4. **Status glows**: Semi-transparent colored circles beneath bases (green/amber/red)
5. **Labels**: Project names above bases in pixel font (rendered as bitmap text on canvas)
6. **Agent sprites**: Drawn at their current position with current animation frame

```tsx
"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { getDefaultMapConfig, type MapConfig, type ProjectBase } from "@/lib/map-data";
import type { SpriteSheet } from "@/lib/sprites";

interface AgentPosition {
  agentId: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: "idle" | "working" | "walking";
  currentProject?: string;
  frame: number;
}

interface WarRoomMapProps {
  agentPositions: AgentPosition[];
  onBaseClick?: (projectId: string) => void;
  onAgentClick?: (agentId: string) => void;
}

export function WarRoomMap({ agentPositions, onBaseClick, onAgentClick }: WarRoomMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapConfig = getDefaultMapConfig();

  // Native canvas resolution
  const NATIVE_W = mapConfig.width * mapConfig.tileSize;
  const NATIVE_H = mapConfig.height * mapConfig.tileSize;

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    let frameCount = 0;
    let lastTime = 0;
    const FPS = 8;
    const frameInterval = 1000 / FPS;

    function render(time: number) {
      if (time - lastTime < frameInterval) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastTime = time;
      frameCount++;

      // Clear
      ctx!.fillStyle = "#0a0a0f";
      ctx!.fillRect(0, 0, NATIVE_W, NATIVE_H);

      // Draw ground grid
      drawGround(ctx!, mapConfig, frameCount);

      // Draw circuit traces between bases
      drawCircuitTraces(ctx!, mapConfig, frameCount);

      // Draw bases
      for (const base of mapConfig.bases) {
        drawBase(ctx!, base, frameCount);
      }

      // Draw agents
      for (const agent of agentPositions) {
        drawAgent(ctx!, agent, frameCount);
      }

      animId = requestAnimationFrame(render);
    }

    let animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [agentPositions, mapConfig, NATIVE_W, NATIVE_H]);

  // Click handling - translate screen coords to native coords
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = NATIVE_W / rect.width;
    const scaleY = NATIVE_H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if click hit a base
    for (const base of mapConfig.bases) {
      const bx = base.x * mapConfig.tileSize;
      const by = base.y * mapConfig.tileSize;
      if (x >= bx && x <= bx + 48 && y >= by && y <= by + 48) {
        onBaseClick?.(base.projectId);
        return;
      }
    }

    // Check if click hit an agent
    for (const agent of agentPositions) {
      if (x >= agent.x - 8 && x <= agent.x + 24 && y >= agent.y - 8 && y <= agent.y + 24) {
        onAgentClick?.(agent.agentId);
        return;
      }
    }
  }, [mapConfig, agentPositions, NATIVE_W, NATIVE_H, onBaseClick, onAgentClick]);

  return (
    <canvas
      ref={canvasRef}
      width={NATIVE_W}
      height={NATIVE_H}
      onClick={handleClick}
      className="w-full h-full cursor-pointer"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
```

The helper functions `drawGround`, `drawCircuitTraces`, `drawBase`, `drawAgent` implement the actual pixel drawing using `ctx.fillRect` for individual pixels.

**Step 2: Commit**
```bash
git add src/components/command-center/war-room-map.tsx
git commit -m "feat: add canvas-based war room map renderer"
```

---

### Task 5: Build the Mission Statement Banner

**Files:**
- Create: `src/components/command-center/mission-banner.tsx`

**Step 1: Create the banner component**

```tsx
"use client";

export function MissionBanner() {
  return (
    <div className="relative overflow-hidden border-b-2 border-[#ff2d2d]/30 bg-[#0a0a0f]">
      {/* Scan-line overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)",
          backgroundSize: "100% 2px",
        }}
      />

      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-4">
          <span className="font-[family-name:var(--font-pixel)] text-[10px] text-[#ff2d2d] tracking-wider">
            MISSION CONTROL
          </span>
          <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#00ff41]/80">
            NEVER STOP. NEVER SLEEP.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#ffa500]/80">
            ACCOMPLISH THE MISSION. 24/7. BY ANY MEANS NECESSARY.
          </span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#ff2d2d] animate-pulse shadow-[0_0_6px_rgba(255,45,45,0.6)]" />
            <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#ff2d2d]">
              LIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

The banner uses the pixel font, red accent colors, a CRT scan-line overlay via CSS background-image, and a pulsing LIVE indicator.

**Step 2: Commit**
```bash
git add src/components/command-center/mission-banner.tsx
git commit -m "feat: add war room mission statement banner"
```

---

### Task 6: Build the Activity Ticker

**Files:**
- Create: `src/components/command-center/activity-ticker.tsx`

**Step 1: Create the military comms-style scrolling ticker**

```tsx
"use client";

import { useRef, useEffect } from "react";

export interface TickerEntry {
  agentId: string;
  agentLabel: string;
  project?: string;
  description: string;
  timestamp: number;
  status: "working" | "completed" | "error" | "idle";
}

interface ActivityTickerProps {
  entries: TickerEntry[];
}

export function ActivityTicker({ entries }: ActivityTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const statusSymbol = (s: string) => {
    switch (s) {
      case "working": return "\u25B8"; // right triangle
      case "completed": return "\u2713"; // checkmark
      case "error": return "\u2717"; // X
      default: return "\u2022"; // bullet
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "working": return "text-[#00ff41]";
      case "completed": return "text-[#00ff41]/60";
      case "error": return "text-[#ff2d2d]";
      default: return "text-[#666680]";
    }
  };

  return (
    <div className="border-t border-[#2a2a3e] bg-[#0a0a0f]/90">
      <div
        ref={scrollRef}
        className="h-[88px] overflow-y-auto px-4 py-2 space-y-0.5 scrollbar-thin"
      >
        {entries.length === 0 ? (
          <div className="flex items-center h-full">
            <span className="font-mono text-[11px] text-[#666680]">
              Awaiting agent activity...
            </span>
          </div>
        ) : (
          entries.map((entry, i) => (
            <div key={`${entry.timestamp}-${i}`} className="flex items-center gap-2 font-mono text-[11px] leading-tight">
              <span className={statusColor(entry.status)}>
                {statusSymbol(entry.status)}
              </span>
              <span className="text-[#ffa500] uppercase font-bold shrink-0">
                {entry.agentLabel}
              </span>
              {entry.project && (
                <>
                  <span className="text-[#666680]">&gt;</span>
                  <span className="text-[#00ff41]/70 shrink-0">
                    {entry.project}
                  </span>
                </>
              )}
              <span className="text-[#666680]">::</span>
              <span className="text-[#e0e0e0]/80 truncate">
                {entry.description}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/components/command-center/activity-ticker.tsx
git commit -m "feat: add military comms activity ticker"
```

---

### Task 7: Add Agent Activity SSE Events

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/app/api/stream/route.ts`
- Modify: `src/hooks/use-sse.ts`
- Modify: `src/components/providers/sse-provider.tsx`

**Step 1: Add agent activity types to types.ts**

Add to `src/lib/types.ts`:
```typescript
export interface AgentActivity {
  agentId: string;
  agentLabel: string;
  action: "working" | "idle" | "completed" | "error";
  project?: string;
  description: string;
  timestamp: number;
}
```

**Step 2: Update the SSE stream route to emit agent activity**

In `src/app/api/stream/route.ts`, add a `pollAgentActivity()` function that:
1. Reads each agent's session directory for recent session files
2. Reads today's memory files for context
3. Checks cron job states for running jobs
4. Constructs `AgentActivity` events from this data

Add to the poll cycle:
```typescript
const activity = await pollAgentActivity();
if (activity.length > 0) {
  send("agent-activity", { activities: activity });
}
```

Add new gateway helper in `src/lib/gateway.ts`:
```typescript
export async function getAgentActivity(): Promise<AgentActivity[]> {
  // Read session files, memory files, cron state
  // Return recent activity entries
}
```

**Step 3: Update the SSE hook to handle agent-activity events**

In `src/hooks/use-sse.ts`, add `agentActivities: AgentActivity[]` to the state and add listener:
```typescript
es.addEventListener("agent-activity", (e) => {
  const data = JSON.parse(e.data);
  setState((prev) => ({
    ...prev,
    agentActivities: [
      ...prev.agentActivities,
      ...data.activities,
    ].slice(-50), // keep last 50
    lastUpdate: Date.now(),
  }));
});
```

**Step 4: Update SSE provider to expose agent activities**

In `src/components/providers/sse-provider.tsx`, add `agentActivities` to the context value type and default.

**Step 5: Commit**
```bash
git add src/lib/types.ts src/app/api/stream/route.ts src/hooks/use-sse.ts src/components/providers/sse-provider.tsx src/lib/gateway.ts
git commit -m "feat: add agent activity SSE events for live task streaming"
```

---

### Task 8: Build Agent Detail Slide-Out Panel

**Files:**
- Create: `src/components/command-center/agent-panel.tsx`

**Step 1: Create the slide-out panel component**

A right-side panel that opens when clicking an agent sprite on the map. Shows:
- Agent pixel sprite rendered large (64x64 or 96x96)
- Agent name, ID, status
- Current task description
- Recent activity log (last 10 entries)
- Model info (primary + fallback)
- Link to full agent chat interface

Uses shadcn Sheet component for the slide-out behavior.

```tsx
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useSSEContext } from "@/components/providers/sse-provider";
import type { AgentActivity } from "@/lib/types";

interface AgentPanelProps {
  agentId: string | null;
  onClose: () => void;
}

export function AgentPanel({ agentId, onClose }: AgentPanelProps) {
  // ... implementation
}
```

The panel renders the agent's sprite on a small canvas element at 4x scale, with animation playing.

**Step 2: Commit**
```bash
git add src/components/command-center/agent-panel.tsx
git commit -m "feat: add agent detail slide-out panel with pixel sprite"
```

---

### Task 9: Build Project Detail Slide-Out Panel

**Files:**
- Create: `src/components/command-center/project-panel.tsx`

**Step 1: Create the project slide-out panel**

Similar to agent panel but for projects. Shows:
- Project name, description, status
- Assigned agents (with mini sprites)
- Active cron jobs related to this project
- Recent activity for this project only
- Link to full project detail page

```tsx
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface ProjectPanelProps {
  projectId: string | null;
  onClose: () => void;
}

export function ProjectPanel({ projectId, onClose }: ProjectPanelProps) {
  // ... implementation
}
```

**Step 2: Commit**
```bash
git add src/components/command-center/project-panel.tsx
git commit -m "feat: add project detail slide-out panel"
```

---

### Task 10: Assemble the New Command Center Page

**Files:**
- Modify: `src/app/(dashboard)/page.tsx`

**Step 1: Replace the Command Center page with the war room layout**

The new page composes:
1. `MissionBanner` at top
2. `WarRoomMap` filling the main content area
3. `ActivityTicker` at bottom
4. `AgentPanel` (conditionally rendered on agent click)
5. `ProjectPanel` (conditionally rendered on base click)

```tsx
"use client";

import { useState, useMemo } from "react";
import { MissionBanner } from "@/components/command-center/mission-banner";
import { WarRoomMap } from "@/components/command-center/war-room-map";
import { ActivityTicker, type TickerEntry } from "@/components/command-center/activity-ticker";
import { AgentPanel } from "@/components/command-center/agent-panel";
import { ProjectPanel } from "@/components/command-center/project-panel";
import { useSSEContext } from "@/components/providers/sse-provider";

export default function CommandCenter() {
  const { agentActivities } = useSSEContext();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Convert agent activities to ticker entries
  const tickerEntries: TickerEntry[] = useMemo(() => {
    return (agentActivities ?? []).map((a) => ({
      agentId: a.agentId,
      agentLabel: a.agentLabel,
      project: a.project,
      description: a.description,
      timestamp: a.timestamp,
      status: a.action,
    }));
  }, [agentActivities]);

  // Compute agent positions from activities
  const agentPositions = useMemo(() => {
    // ... derive positions from latest activity per agent
  }, [agentActivities]);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <MissionBanner />
      <div className="flex-1 relative overflow-hidden">
        <WarRoomMap
          agentPositions={agentPositions}
          onBaseClick={setSelectedProject}
          onAgentClick={setSelectedAgent}
        />
      </div>
      <ActivityTicker entries={tickerEntries} />
      <AgentPanel agentId={selectedAgent} onClose={() => setSelectedAgent(null)} />
      <ProjectPanel projectId={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
```

**Step 2: Verify the page renders**

Run dev server, navigate to `/`. The war room map should display with bases and the mission banner.

**Step 3: Commit**
```bash
git add src/app/(dashboard)/page.tsx
git commit -m "feat: assemble war room command center page"
```

---

### Task 11: Restyle the Sidebar

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

**Step 1: Update sidebar with pixel art styling**

- Replace Lucide icons with small pixel-art-style icons (can use very small CSS shapes or keep Lucide but style them differently)
- Use Press Start 2P font for the "Mission Control" title
- Add green left-border glow for active state
- Add CRT text flicker effect on hover
- Update the version text at bottom
- Change "MC" logo to use pixel font

Key style changes:
```tsx
// Logo area
<span className="font-[family-name:var(--font-pixel)] text-[#00ff41] text-[8px] font-bold">MC</span>
<span className="font-[family-name:var(--font-pixel)] text-[9px]">MISSION CTRL</span>

// Active link
className={active
  ? "border-l-2 border-[#00ff41] bg-[#00ff41]/5 text-[#00ff41] shadow-[inset_0_0_20px_rgba(0,255,65,0.05)]"
  : "text-[#666680] hover:text-[#e0e0e0] hover:bg-[#1a1a2e]/50"
}

// Version
<p className="font-[family-name:var(--font-pixel)] text-[6px] text-[#666680]/50">
  MISSION CONTROL v2.0
</p>
```

**Step 2: Commit**
```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: restyle sidebar with pixel art war room aesthetic"
```

---

### Task 12: Restyle the TopBar

**Files:**
- Modify: `src/components/layout/topbar.tsx`

**Step 1: Update topbar with war room styling**

- Use pixel font for status labels
- Green terminal color for "Gateway online"
- Red for error states
- Add subtle scan-line background

**Step 2: Commit**
```bash
git add src/components/layout/topbar.tsx
git commit -m "feat: restyle topbar with war room aesthetic"
```

---

### Task 13: Update Agent Detail Cards with All 4 Agents

**Files:**
- Modify: `src/components/agents/agent-detail-card.tsx`
- Modify: `src/components/dashboard/agent-cards.tsx`

**Step 1: Add Forge to the AGENTS array in agent-detail-card.tsx**

```typescript
{
  id: "builder",
  label: "Forge",
  model: "openai-codex/gpt-5.3-codex",
  fallbacks: ["anthropic/claude-sonnet-4-6"],
  workspace: "C:\\Users\\aaron\\.openclaw\\workspace-builder",
  description: "Dedicated coding sub-agent — builds, PRs, refactoring",
},
```

**Step 2: Update agent-cards.tsx dashboard component to include all 4 agents**

Add Bloom and Forge to the AGENTS array in `agent-cards.tsx`.

**Step 3: Restyle agent cards with war room colors**

Update the card styling to use terminal green for online status, pixel font for labels, darker backgrounds.

**Step 4: Commit**
```bash
git add src/components/agents/agent-detail-card.tsx src/components/dashboard/agent-cards.tsx
git commit -m "feat: add Forge agent and restyle agent cards for war room"
```

---

### Task 14: Global Style Polish Pass

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/layout/app-shell.tsx`

**Step 1: Add utility classes for war room effects**

Add to globals.css:
```css
/* CRT scan-line overlay */
.crt-overlay {
  background-image: repeating-linear-gradient(
    0deg, transparent, transparent 1px,
    rgba(255,255,255,0.03) 1px, rgba(255,255,255,0.03) 2px
  );
  background-size: 100% 2px;
  pointer-events: none;
}

/* Terminal text glow */
.text-glow-green {
  text-shadow: 0 0 8px rgba(0, 255, 65, 0.4);
}

/* Pixel font helper */
.font-pixel {
  font-family: var(--font-pixel), monospace;
}

/* Custom scrollbar for ticker */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #2a2a3e;
  border-radius: 2px;
}
```

**Step 2: Update other pages' headers to use pixel font**

The Cron, Projects, Agents, Board, and Settings pages should use the pixel font for their main `<h1>` headings while keeping body text in JetBrains Mono.

**Step 3: Commit**
```bash
git add src/app/globals.css src/components/layout/app-shell.tsx
git commit -m "feat: add war room utility classes and global style polish"
```

---

### Task 15: Install shadcn Sheet Component (if not already present)

**Files:**
- Potentially create: `src/components/ui/sheet.tsx`

**Step 1: Check if sheet component exists**

```bash
ls src/components/ui/sheet.tsx
```

If not present, install it:
```bash
cd C:/projects/openclaw/mission-control && npx shadcn@latest add sheet
```

**Step 2: Commit if new file was created**
```bash
git add src/components/ui/
git commit -m "feat: add shadcn sheet component for slide-out panels"
```

---

### Task 16: Final Integration Testing and Polish

**Step 1: Run the dev server and verify all pages**

```bash
cd C:/projects/openclaw/mission-control && npm run dev
```

Check:
- [ ] Command Center page shows the war room map with mission banner
- [ ] Agent sprites render at their base positions
- [ ] Activity ticker shows at the bottom
- [ ] Clicking a base opens the project panel
- [ ] Clicking an agent opens the agent panel
- [ ] Sidebar has war room styling with pixel font
- [ ] Other pages (Cron, Agents, Projects, Board, Settings) render with updated colors
- [ ] No console errors
- [ ] Build succeeds: `npm run build`

**Step 2: Fix any rendering issues found during testing**

**Step 3: Final commit**
```bash
git add -A
git commit -m "feat: complete war room redesign - pixel art command center with live agent activity"
```

---

## Implementation Order Summary

| # | Task | Dependencies |
|---|------|-------------|
| 1 | Font + Color Palette | None |
| 2 | Sprite Data System | None |
| 3 | Map Data + Bases | None |
| 4 | Canvas Map Renderer | 2, 3 |
| 5 | Mission Banner | 1 |
| 6 | Activity Ticker | None |
| 7 | Agent Activity SSE | None |
| 8 | Agent Detail Panel | 15 (sheet) |
| 9 | Project Detail Panel | 15 (sheet) |
| 10 | Assemble Command Center | 4, 5, 6, 7, 8, 9 |
| 11 | Restyle Sidebar | 1 |
| 12 | Restyle TopBar | 1 |
| 13 | Update Agent Cards | 1 |
| 14 | Global Style Polish | 1 |
| 15 | Install Sheet Component | None |
| 16 | Integration Testing | All |

**Parallelizable groups:**
- Tasks 1, 2, 3, 15 can run in parallel (no dependencies)
- Tasks 5, 6, 7, 11, 12, 13, 14 can run after Task 1
- Task 4 after 2 and 3
- Tasks 8, 9 after 15
- Task 10 after 4, 5, 6, 7, 8, 9
- Task 16 after everything
