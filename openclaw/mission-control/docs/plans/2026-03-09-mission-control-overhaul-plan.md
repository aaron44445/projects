# Mission Control Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild Mission Control so agents visually reflect real status, walk between task-based buildings, and can be communicated with via web chat and Telegram per-agent commands.

**Architecture:** Canvas-based war room with 6 task-based buildings connected by a waypoint path graph. Agents move between buildings based on real-time cron/enforcer status. Sentinel patrols and yells at idle agents. Web chat gets error handling + retry. Telegram gets per-agent command routing.

**Tech Stack:** Next.js 16, React 19, Canvas 2D, TailwindCSS 4, SSE, OpenClaw Gateway API

---

### Task 1: Add Job-to-Building Mapping & Update Types

**Files:**
- Create: `src/lib/job-building-map.ts`
- Modify: `src/lib/types.ts`

**Step 1: Create the job-to-building mapping file**

```typescript
// src/lib/job-building-map.ts

export type BuildingId = "barracks" | "outreach-hq" | "content-lab" | "comms-tower" | "intel-room" | "war-room";

export const JOB_TO_BUILDING: Record<string, BuildingId> = {
  // Outreach HQ — emails, DMs, follow-ups
  "outreach-send": "outreach-hq",
  "follow-up-send": "outreach-hq",
  "dm-outreach": "outreach-hq",

  // Content Lab — blog, SEO, social
  "content-creation": "content-lab",

  // Comms Tower — replies, inbox, Telegram
  "reply-check-afternoon": "comms-tower",
  "reply-check-evening": "comms-tower",
  "inbox-forward": "comms-tower",
  "ig-reply-monitor": "comms-tower",

  // Intel Room — leads, research, enrichment
  "lead-discovery": "intel-room",
  "lead-enrichment": "intel-room",
  "weekly-lead-refresh": "intel-room",

  // War Room — board, strategy, reports
  "board-data-gather": "war-room",
  "board-expert-analysis": "war-room",
  "board-moderator-synthesis": "war-room",
  "weekly-strategy-review": "war-room",
  "weekly-report": "war-room",
  "self-improvement": "war-room",
  "morning-briefing": "war-room",

  // Enforcer — patrols (special case, no fixed building)
  "enforcer-patrol": "war-room",
  "enforcer-morning-report": "war-room",
  "enforcer-evening-report": "war-room",
};

export function getBuildingForJob(jobId: string): BuildingId {
  // Normalize: strip UUID-style IDs, match by prefix
  for (const [key, building] of Object.entries(JOB_TO_BUILDING)) {
    if (jobId === key || jobId.startsWith(key)) return building;
  }
  // Check partial matches for dynamic IDs
  if (jobId.includes("reply") || jobId.includes("inbox") || jobId.includes("forward")) return "comms-tower";
  if (jobId.includes("lead") || jobId.includes("enrich") || jobId.includes("discover")) return "intel-room";
  if (jobId.includes("outreach") || jobId.includes("email") || jobId.includes("dm")) return "outreach-hq";
  if (jobId.includes("content") || jobId.includes("blog") || jobId.includes("seo")) return "content-lab";
  if (jobId.includes("board") || jobId.includes("strategy") || jobId.includes("report")) return "war-room";
  return "barracks";
}
```

**Step 2: Update types.ts — add building field to AgentActivity**

In `src/lib/types.ts`, update the `AgentActivity` interface (lines 205-212) to:

```typescript
export interface AgentActivity {
  agentId: string;
  agentLabel: string;
  action: "working" | "idle" | "completed" | "error";
  project?: string;
  description: string;
  timestamp: number;
  buildingId?: string; // Which building the agent should be at
  jobId?: string;      // Which cron job triggered this activity
}
```

**Step 3: Verify build**

Run: `cd C:/projects/openclaw/mission-control && pnpm build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/lib/job-building-map.ts src/lib/types.ts
git commit -m "feat: add job-to-building mapping and update AgentActivity type"
```

---

### Task 2: Redesign Map Layout with 6 Task-Based Buildings

**Files:**
- Modify: `src/lib/map-data.ts`

This is the largest single file change. Replace the current 5 buildings with 6 task-based buildings. Keep the same pixel art style but redesign the layout.

**Step 1: Replace building definitions and layout**

Rewrite `getDefaultMapConfig()` in `src/lib/map-data.ts`. The map is 30×20 tiles (480×320 logical pixels, 16px per tile).

New building layout (grid positions):
- **War Room** (center-top): (12, 2) — largest building, gold accents, strategy table inside
- **Outreach HQ** (left): (2, 8) — radio tower on roof, green accents
- **Intel Room** (right): (22, 8) — satellite dish, blue monitors
- **Content Lab** (bottom-left): (2, 15) — paint splatter accents, pink highlights
- **Comms Tower** (bottom-right): (22, 15) — tall antenna, blinking red light
- **Barracks** (center-bottom): (12, 15) — dull gray, minimal, the "penalty box"

Each building needs:
- 2 animation frames (lights on/off or active indicator)
- `agentDockPoints`: 3-4 positions where agents can stand while working
- `status` field: driven by whether any agent is working there
- A unique palette that distinguishes it from others

Path network connecting all buildings:
- War Room ↔ Outreach HQ (top-left diagonal)
- War Room ↔ Intel Room (top-right diagonal)
- Outreach HQ ↔ Content Lab (left vertical)
- Intel Room ↔ Comms Tower (right vertical)
- Content Lab ↔ Barracks (bottom-left horizontal)
- Comms Tower ↔ Barracks (bottom-right horizontal)
- War Room ↔ Barracks (center vertical — main road)
- Outreach HQ ↔ Intel Room (horizontal through center)

Keep existing decorations (tank, jeep, sandbags, flag) repositioned to fit new layout.

Building pixel art frames: Each building is approximately 18-24px wide, 20-28px tall. Use the same palette-indexed approach as existing code. Every building gets:
- Frame 1: Normal state (some windows lit)
- Frame 2: Alternate state (different windows lit, or indicator blinks)

Add a new `BuildingId` field to `ProjectBase` interface matching the `BuildingId` type from job-building-map.ts.

**Step 2: Update homePosition**

Set `homePosition` to the Barracks center coordinates — this is where idle agents rally.

**Step 3: Verify build**

Run: `cd C:/projects/openclaw/mission-control && pnpm build`

**Step 4: Commit**

```bash
git add src/lib/map-data.ts
git commit -m "feat: redesign map with 6 task-based buildings and path network"
```

---

### Task 3: Fix Status Detection in Gateway

**Files:**
- Modify: `src/lib/gateway.ts` (lines 144-250, the `getAgentActivity()` function)

**Step 1: Rewrite getAgentActivity() with tighter windows and building assignment**

Replace the entire `getAgentActivity()` function. New logic:

```typescript
import { getBuildingForJob, type BuildingId } from "./job-building-map";

export async function getAgentActivity(): Promise<AgentActivity[]> {
  const agents = [
    { id: "main", label: "Claw" },
    { id: "marketer", label: "Bloom" },
    { id: "board-moderator", label: "Board" },
    { id: "builder", label: "Forge" },
    { id: "enforcer", label: "Sentinel" },
  ];

  const activities: AgentActivity[] = [];
  const agentsWithActivity = new Set<string>();
  const now = Date.now();
  const TWO_MINUTES = 2 * 60 * 1000;
  const FIVE_MINUTES = 5 * 60 * 1000;

  // Source 1: Cron jobs (highest priority)
  try {
    const jobs = await getCronJobs();
    for (const job of jobs) {
      if (!job.state) continue;
      const agent = agents.find((a) => a.id === job.agentId);
      if (!agent) continue;

      const lastRun = job.state.lastRunAtMs || 0;
      const timeSinceRun = now - lastRun;
      const isRunning = job.state.runningAtMs != null;
      const buildingId = getBuildingForJob(job.id || job.name);

      // Currently running
      if (isRunning) {
        activities.push({
          agentId: agent.id,
          agentLabel: agent.label,
          action: "working",
          description: job.name,
          timestamp: now,
          buildingId,
          jobId: job.id || job.name,
        });
        agentsWithActivity.add(agent.id);
        continue;
      }

      // Completed or errored within 2 minutes
      if (timeSinceRun < TWO_MINUTES) {
        const action = job.state.lastRunStatus === "error" ? "error"
          : job.state.lastRunStatus === "ok" ? "completed"
          : "working";
        activities.push({
          agentId: agent.id,
          agentLabel: agent.label,
          action,
          description: job.name,
          timestamp: lastRun,
          buildingId: action === "error" ? buildingId : "barracks",
          jobId: job.id || job.name,
        });
        agentsWithActivity.add(agent.id);
      }
    }
  } catch (e) {
    console.error("Failed to read cron jobs:", e);
  }

  // Source 2: Enforcer dispatch state
  try {
    const stateFile = "C:/Users/aaron/.openclaw/workspace-enforcer/state.json";
    const state = await readJsonFile<any>(stateFile);
    if (state?.agentStates) {
      for (const [agentId, agentState] of Object.entries(state.agentStates) as [string, any][]) {
        if (agentsWithActivity.has(agentId)) continue;
        if (!["DISPATCHED", "COOLDOWN", "WORKING"].includes(agentState?.status)) continue;

        const dispatchedAt = agentState.dispatchedAtMs || 0;
        if (now - dispatchedAt > FIVE_MINUTES) continue;

        const agent = agents.find((a) => a.id === agentId);
        if (!agent) continue;

        const taskDesc = agentState.lastDispatch?.task || "Enforcer dispatch";
        // Try to guess building from task description
        let buildingId: BuildingId = "outreach-hq"; // Default for enforcer dispatches (usually outreach)
        if (taskDesc.toLowerCase().includes("email") || taskDesc.toLowerCase().includes("outreach")) buildingId = "outreach-hq";
        else if (taskDesc.toLowerCase().includes("content") || taskDesc.toLowerCase().includes("blog")) buildingId = "content-lab";
        else if (taskDesc.toLowerCase().includes("lead") || taskDesc.toLowerCase().includes("enrich")) buildingId = "intel-room";
        else if (taskDesc.toLowerCase().includes("reply") || taskDesc.toLowerCase().includes("inbox")) buildingId = "comms-tower";

        activities.push({
          agentId: agent.id,
          agentLabel: agent.label,
          action: "working",
          description: taskDesc,
          timestamp: dispatchedAt,
          buildingId,
        });
        agentsWithActivity.add(agentId);
      }
    }
  } catch (e) {
    // Enforcer state file may not exist
  }

  // Source 3: Fill idle agents
  for (const agent of agents) {
    if (agentsWithActivity.has(agent.id)) continue;
    activities.push({
      agentId: agent.id,
      agentLabel: agent.label,
      action: "idle",
      description: agent.id === "board-moderator" ? "Next board: tonight" : "Standing by",
      timestamp: now,
      buildingId: "barracks",
    });
  }

  return activities;
}
```

**Step 2: Verify build**

Run: `cd C:/projects/openclaw/mission-control && pnpm build`

**Step 3: Commit**

```bash
git add src/lib/gateway.ts
git commit -m "fix: tighten status detection to 2-min window with building assignment"
```

---

### Task 4: Add Pathfinding & Agent Movement System

**Files:**
- Create: `src/lib/pathfinding.ts`

**Step 1: Create the pathfinding module**

```typescript
// src/lib/pathfinding.ts
import type { BuildingId } from "./job-building-map";

export interface PathNode {
  id: BuildingId | string;
  x: number; // logical pixel position
  y: number;
}

export interface PathEdge {
  from: string;
  to: string;
  waypoints: { x: number; y: number }[]; // intermediate points along the path
}

export interface PathGraph {
  nodes: PathNode[];
  edges: PathEdge[];
}

// Building center positions (logical pixels) — must match map-data.ts layout
export const BUILDING_POSITIONS: Record<BuildingId, { x: number; y: number }> = {
  "war-room": { x: 224, y: 56 },
  "outreach-hq": { x: 56, y: 144 },
  "intel-room": { x: 384, y: 144 },
  "content-lab": { x: 56, y: 260 },
  "comms-tower": { x: 384, y: 260 },
  "barracks": { x: 224, y: 260 },
};

// Simple adjacency for BFS pathfinding
const ADJACENCY: Record<BuildingId, BuildingId[]> = {
  "war-room": ["outreach-hq", "intel-room", "barracks"],
  "outreach-hq": ["war-room", "content-lab", "intel-room"],
  "intel-room": ["war-room", "comms-tower", "outreach-hq"],
  "content-lab": ["outreach-hq", "barracks"],
  "comms-tower": ["intel-room", "barracks"],
  "barracks": ["war-room", "content-lab", "comms-tower"],
};

// BFS to find shortest building path
export function findPath(from: BuildingId, to: BuildingId): BuildingId[] {
  if (from === to) return [from];

  const queue: BuildingId[][] = [[from]];
  const visited = new Set<BuildingId>([from]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    for (const neighbor of ADJACENCY[current] || []) {
      if (neighbor === to) return [...path, neighbor];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return [from, to]; // fallback direct
}

// Convert building path to pixel waypoints for smooth walking
export function getWaypoints(from: BuildingId, to: BuildingId): { x: number; y: number }[] {
  const buildingPath = findPath(from, to);
  return buildingPath.map((id) => BUILDING_POSITIONS[id]);
}

// Movement speed (pixels per frame at 8 FPS)
export const WALK_SPEED = 4;

// Calculate next position given current pos, target pos, and speed
export function moveToward(
  x: number, y: number,
  targetX: number, targetY: number,
  speed: number
): { x: number; y: number; arrived: boolean } {
  const dx = targetX - x;
  const dy = targetY - y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= speed) {
    return { x: targetX, y: targetY, arrived: true };
  }

  return {
    x: x + (dx / dist) * speed,
    y: y + (dy / dist) * speed,
    arrived: false,
  };
}
```

**Step 2: Verify build**

Run: `cd C:/projects/openclaw/mission-control && pnpm build`

**Step 3: Commit**

```bash
git add src/lib/pathfinding.ts
git commit -m "feat: add pathfinding system with BFS and waypoint movement"
```

---

### Task 5: Rewrite War Room Map Renderer

**Files:**
- Modify: `src/components/command-center/war-room-map.tsx`

This is the core visual rewrite. The existing file is 464 lines. The new version will:

**Step 1: Update AgentPosition to support walking waypoints**

Replace the `AgentPosition` interface:

```typescript
export interface AgentPosition {
  agentId: string;
  x: number;          // current logical pixel position
  y: number;
  state: "idle" | "working" | "walking" | "yelled-at";
  buildingId: string;  // target building
  waypoints: { x: number; y: number }[];  // remaining waypoints to walk
  waypointIndex: number;
  frame: number;       // animation frame counter
}
```

**Step 2: Add agent position management with walking logic**

In the main `WarRoomMap` component, manage agent positions as a ref that updates each frame:

- On each animation tick, for each agent:
  - If `state === "walking"` and has waypoints remaining:
    - Call `moveToward()` to advance position
    - If arrived at current waypoint, advance to next
    - If all waypoints done, set state to "working" or "idle" based on target building
  - If `state === "idle"` and `buildingId !== "barracks"`:
    - Generate waypoints to new building, set state to "walking"
  - If `state === "working"` and activity changed to idle:
    - Generate waypoints to barracks, set state to "walking"

- On receiving new agentActivities from SSE:
  - Compare each agent's current buildingId with the new one from activity
  - If different: generate waypoints, set state to "walking"
  - If same: keep current animation

**Step 3: Add speech bubble rendering**

```typescript
function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  const S = DS; // scale factor
  const bubbleW = text.length * 5 * S;
  const bubbleH = 10 * S;
  const bx = x * S - bubbleW / 2;
  const by = y * S - 40 * S;

  // White bubble
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(bx, by, bubbleW, bubbleH, 4);
  ctx.fill();

  // Black border
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Tail triangle
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(x * S - 4, by + bubbleH);
  ctx.lineTo(x * S, by + bubbleH + 6);
  ctx.lineTo(x * S + 4, by + bubbleH);
  ctx.fill();

  // Text
  ctx.fillStyle = "#000000";
  ctx.font = `${6 * S}px "Press Start 2P", monospace`;
  ctx.textAlign = "center";
  ctx.fillText(text, x * S, by + 7 * S);
}
```

**Step 4: Add building state indicators**

Update `drawBase()` to show three visual states:
- **Active (someone working)**: Bright glow, windows fully lit, green pulse
- **Empty**: Dim, windows dark, no glow
- **Error**: Red glow, warning light flashing

Determine building state from the current agentPositions — if any agent has that buildingId and state "working", it's active. If any agent has an error there, it's error. Otherwise empty.

**Step 5: Update the main render loop**

The render loop order:
1. `drawTerrain()` — keep existing
2. `drawDirtPaths()` — update paths to match new building positions
3. Draw buildings with state indicators
4. `drawDecorations()` — reposition to fit new layout
5. Draw agents at their current positions with correct animation state
6. Draw speech bubbles (if any agent is in "yelled-at" state)

**Step 6: Verify by running dev server**

Run: `cd C:/projects/openclaw/mission-control && pnpm dev`
Open: `http://localhost:3002`
Expected: See 6 buildings, agents at correct positions based on cron state, agents walking between buildings when state changes.

**Step 7: Commit**

```bash
git add src/components/command-center/war-room-map.tsx
git commit -m "feat: rewrite war room renderer with walking agents and building states"
```

---

### Task 6: Sentinel Yell Interaction

**Files:**
- Modify: `src/components/command-center/war-room-map.tsx` (add to existing Task 5 code)

**Step 1: Add Sentinel yell logic to the animation loop**

In the agent position update logic, add a special check for Sentinel:

```typescript
// Every N frames (about every 10 seconds at 8fps), check for idle agents
if (frameCount % 80 === 0) {
  const sentinel = agentPositions.find(a => a.agentId === "enforcer");
  const idleAgents = agentPositions.filter(a =>
    a.agentId !== "enforcer" &&
    a.state === "idle" &&
    a.buildingId === "barracks"
  );

  if (sentinel && idleAgents.length > 0 && sentinel.state !== "walking") {
    // Pick first idle agent
    const target = idleAgents[0];

    // Sentinel walks to barracks
    const sentinelWaypoints = getWaypoints(sentinel.buildingId as BuildingId, "barracks");
    sentinel.waypoints = sentinelWaypoints;
    sentinel.waypointIndex = 0;
    sentinel.state = "walking";

    // After sentinel arrives (tracked by a timer/flag):
    // 1. Show speech bubble "MOVE IT!" for ~2 seconds (16 frames)
    // 2. Target agent starts walking to a default building
    // Store yell state: { targetAgentId, bubbleFramesLeft: 16 }
  }
}
```

**Step 2: Add yell state tracking**

```typescript
interface YellEvent {
  sentinelArrivedAt: number; // frame when sentinel reached barracks
  targetAgentId: string;
  bubbleText: string;
  bubbleFramesLeft: number;
}
```

Cycle through yell phrases: "MOVE IT!", "GET TO WORK!", "NO SLACKING!", "DOUBLE TIME!"

**Step 3: In the render loop, draw the speech bubble when active**

If a YellEvent exists and `bubbleFramesLeft > 0`:
- Draw speech bubble above Sentinel
- Decrement bubbleFramesLeft each frame
- When bubble expires, set the target idle agent's waypoints to walk to a default building (outreach-hq as fallback)

**Step 4: Verify visually**

Run dev server, wait for an idle agent to appear at barracks. Sentinel should walk over and yell.

**Step 5: Commit**

```bash
git add src/components/command-center/war-room-map.tsx
git commit -m "feat: add Sentinel yell interaction for idle agents"
```

---

### Task 7: Update Agent Status Sidebar

**Files:**
- Modify: `src/components/command-center/agent-status-sidebar.tsx`

**Step 1: Update status display to include building info**

Update the sidebar to show which building each agent is at, using the `buildingId` from AgentActivity:

- "ACTIVE @ Outreach HQ" instead of just "ACTIVE"
- "IDLE @ Barracks" for idle agents
- "ERROR @ Intel Room" for errors
- Color the building name to match the building's accent

**Step 2: Update AGENTS metadata**

Replace the static `idleLabel` with dynamic descriptions from the activity data. Remove the hardcoded project references.

**Step 3: Add building icons**

Small emoji or icon next to building name: Outreach HQ gets a mail icon, Content Lab gets a paint icon, etc. Use Lucide icons.

**Step 4: Verify build**

Run: `cd C:/projects/openclaw/mission-control && pnpm build`

**Step 5: Commit**

```bash
git add src/components/command-center/agent-status-sidebar.tsx
git commit -m "feat: update sidebar with building locations and dynamic status"
```

---

### Task 8: Fix Web Chat Interface

**Files:**
- Modify: `src/components/agents/chat-interface.tsx`
- Modify: `src/app/api/chat/route.ts`

**Step 1: Update the API route with retry logic**

```typescript
// src/app/api/chat/route.ts
import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { agentId, message, sessionKey } = await request.json();

  // Try primary request
  try {
    const response = await gateway.chatWithAgent(agentId, message, sessionKey);
    return NextResponse.json({ response });
  } catch (firstError: any) {
    // If timeout or model error, retry once
    console.error(`Chat attempt 1 failed for ${agentId}:`, firstError.message);

    try {
      const response = await gateway.chatWithAgent(agentId, message, sessionKey);
      return NextResponse.json({ response, retried: true });
    } catch (retryError: any) {
      console.error(`Chat retry failed for ${agentId}:`, retryError.message);
      const errorMsg = retryError.message?.includes("abort")
        ? "Agent timed out after 120s — NVIDIA free tier may be slow. Try again in a minute."
        : `Failed to reach ${agentId}: ${retryError.message}`;
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  }
}
```

**Step 2: Update chat interface with loading states and better errors**

In `src/components/agents/chat-interface.tsx`:

- Add elapsed time counter during loading:
  ```typescript
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Start interval when isLoading becomes true
  // Show: "Claw is thinking... (12s)"
  ```

- Replace generic error handling with user-friendly messages:
  ```typescript
  if (data.error) {
    // Show the actual error message from the API
    appendMessage({
      role: "agent",
      content: `Error: ${data.error}`,
      isError: true,
    });
  }
  if (data.retried) {
    // Show a subtle note that it took a retry
    appendMessage({
      role: "system",
      content: "Response received after retry.",
    });
  }
  ```

- Add `isError` flag to ChatMessage type for red styling

- Bump storage limit from 200 to 500 messages

- Add agent color accent to the chat header matching AGENT_COLORS

**Step 3: Add proper session key generation**

```typescript
const sessionKey = `mc:chat:${selectedAgentId}:${Date.now()}`;
// Reuse same session key for the conversation (store in state)
// Only generate new one when switching agents
```

**Step 4: Verify by testing chat**

Run dev server, open agents page, select an agent, send a message. Verify:
- Loading spinner shows with elapsed time
- Timeout shows friendly error message
- Retry works automatically

**Step 5: Commit**

```bash
git add src/components/agents/chat-interface.tsx src/app/api/chat/route.ts
git commit -m "fix: web chat with retry logic, loading states, and friendly errors"
```

---

### Task 9: Add Connection Status Indicator

**Files:**
- Modify: `src/hooks/use-sse.ts`
- Modify: `src/components/command-center/war-room-map.tsx` or layout component

**Step 1: Add lastUpdate tracking to SSE hook**

The `useSSE` hook already tracks `lastUpdate` timestamp and `connected` boolean. Expose both through the SSE context.

**Step 2: Add connection indicator component**

Create a small overlay in the war room (top-right corner):

```tsx
function ConnectionIndicator({ connected, lastUpdate }: { connected: boolean; lastUpdate: number | null }) {
  const secondsAgo = lastUpdate ? Math.floor((Date.now() - lastUpdate) / 1000) : null;

  return (
    <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
      <div className={cn(
        "w-2 h-2 rounded-full",
        connected ? "bg-[#00ff41] shadow-[0_0_6px_#00ff41]" : "bg-[#ff2d2d] shadow-[0_0_6px_#ff2d2d]"
      )} />
      <span className="text-[10px] font-mono text-white/60">
        {connected
          ? secondsAgo !== null ? `${secondsAgo}s ago` : "Connected"
          : "Disconnected"
        }
      </span>
    </div>
  );
}
```

**Step 3: Add to the war room page layout**

Position it as an overlay on the canvas container.

**Step 4: Verify**

Run dev server, check green dot appears. Kill gateway, verify red dot appears.

**Step 5: Commit**

```bash
git add src/hooks/use-sse.ts src/components/command-center/war-room-map.tsx
git commit -m "feat: add connection status indicator with green/red dot"
```

---

### Task 10: Telegram Per-Agent Command Routing

**Files:**
- Create: `src/app/api/telegram-route/route.ts` (webhook handler concept)

**Note:** This task modifies the gateway behavior, not the Mission Control UI. The OpenClaw gateway's Telegram plugin receives messages. We need to add a preprocessing layer.

**Step 1: Create a Telegram command router script**

Since the OpenClaw gateway handles Telegram natively, the cleanest approach is to create a hook that intercepts incoming Telegram messages before they reach the default agent.

Create: `C:/Users/aaron/.openclaw/workspace/scripts/telegram-router.js`

```javascript
// telegram-router.js
// Called by OpenClaw gateway when a Telegram message arrives
// Routes /agent commands to the correct agent

const AGENT_PREFIXES = {
  "/claw": "main",
  "/bloom": "marketer",
  "/sentinel": "enforcer",
  "/board": "board-moderator",
  "/forge": "builder",
};

const QUICK_COMMANDS = {
  "/status": "STATUS_REQUEST",
  "/idle": "IDLE_REQUEST",
};

function routeMessage(text) {
  const trimmed = text.trim();

  // Check quick commands
  for (const [cmd, type] of Object.entries(QUICK_COMMANDS)) {
    if (trimmed.toLowerCase().startsWith(cmd)) {
      return { type, agentId: null, message: trimmed };
    }
  }

  // Check agent prefixes
  for (const [prefix, agentId] of Object.entries(AGENT_PREFIXES)) {
    if (trimmed.toLowerCase().startsWith(prefix)) {
      const message = trimmed.slice(prefix.length).trim();
      return { type: "AGENT_MESSAGE", agentId, message };
    }
  }

  // Default to main agent
  return { type: "AGENT_MESSAGE", agentId: "main", message: trimmed };
}

module.exports = { routeMessage, AGENT_PREFIXES, QUICK_COMMANDS };
```

**Step 2: Create a gateway hook for Telegram routing**

The OpenClaw gateway supports hooks. Add a hook mapping in `openclaw.json` that intercepts Telegram messages and routes them through the command router.

In `C:/Users/aaron/.openclaw/openclaw.json`, update the channels.telegram section to add command awareness:

The actual implementation depends on how the OpenClaw Telegram plugin processes incoming messages. The router script needs to be called before the message hits the default agent session. If the gateway doesn't support message preprocessing natively, an alternative is:

- Create a small Express middleware that:
  1. Receives Telegram webhook
  2. Parses the command prefix
  3. Forwards to the correct agent via gateway `/v1/chat/completions` API
  4. Returns the response back to Telegram

This may require updating the Telegram bot webhook URL to point to this middleware instead of directly to the gateway.

**Step 3: Test routing**

Send `/claw check inbox` in Telegram. Verify Claw responds.
Send `/bloom check SEO` in Telegram. Verify Bloom responds.
Send `/status` in Telegram. Verify all agent statuses returned.

**Step 4: Commit**

```bash
git add C:/Users/aaron/.openclaw/workspace/scripts/telegram-router.js
git commit -m "feat: add Telegram per-agent command routing"
```

---

### Task 11: Update Activity Ticker

**Files:**
- Modify: `src/components/command-center/activity-ticker.tsx`

**Step 1: Add building info to ticker entries**

Update the ticker to show which building the activity is at:

Format: `[STATUS] AGENT @ BUILDING :: description`

Example: `▸ CLAW @ Outreach HQ :: outreach-send`

**Step 2: Add Sentinel yell events to ticker**

When Sentinel yells at an idle agent, add a ticker entry:
`! SENTINEL → CLAW :: GET TO WORK!`

**Step 3: Verify build**

Run: `cd C:/projects/openclaw/mission-control && pnpm build`

**Step 4: Commit**

```bash
git add src/components/command-center/activity-ticker.tsx
git commit -m "feat: update ticker with building locations and sentinel events"
```

---

### Task 12: Integration Test & Deploy

**Step 1: Full build verification**

Run: `cd C:/projects/openclaw/mission-control && pnpm build`
Expected: Clean build, no errors

**Step 2: Visual verification checklist**

Run: `cd C:/projects/openclaw/mission-control && pnpm dev`

Verify each feature:
- [ ] 6 buildings visible on map with correct labels
- [ ] Agents at correct buildings based on current cron state
- [ ] Idle agents at Barracks
- [ ] Working agents at task buildings with working animation
- [ ] Agents walk along paths when changing tasks (no teleporting)
- [ ] Buildings glow when occupied, dim when empty
- [ ] Sentinel walks to Barracks and yells at idle agents
- [ ] Speech bubble appears and disappears
- [ ] Sidebar shows building location per agent
- [ ] Activity ticker shows building info
- [ ] Connection indicator green when gateway up
- [ ] Chat sends messages without errors
- [ ] Chat shows loading state with timer
- [ ] Chat retries on timeout

**Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: Mission Control overhaul — complete integration"
```

**Step 4: Push**

```bash
git push origin feature/platform-build
```
