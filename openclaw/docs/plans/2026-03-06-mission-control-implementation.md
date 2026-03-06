# Mission Control Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a custom multi-project command center for OpenCLAW with real-time monitoring, cron control, agent chat, configurable widget dashboards, and dark tactical UI — deployed on Vercel and connected to local gateway via Cloudflare Tunnel.

**Architecture:** Next.js 15 App Router serves as a secure proxy between the browser and OpenCLAW gateway. API routes communicate with the gateway via HTTP (POST to `/tools/invoke` for file reads, GET for health, POST to `/v1/chat/completions` for agent chat). SSE endpoint polls the gateway every 2-5 seconds and pushes updates to the browser. Project/widget configuration stored as JSON files managed through the API. Cloudflare Tunnel exposes the local gateway to Vercel.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Server-Sent Events, Cloudflare Tunnel

**Design Doc:** `docs/plans/2026-03-06-mission-control-design.md`

**Gateway Details:**
- URL: `http://127.0.0.1:18790` (local), exposed via Cloudflare Tunnel in production
- Auth: Bearer token `Authorization: Bearer <OPENCLAW_TOKEN>`
- RPC: POST to `/tools/invoke` with tool name and arguments
- Chat: POST to `/v1/chat/completions` (OpenAI-compatible, needs enabling in config)
- Health: GET on gateway port
- Response envelope: `result.content[0].text` contains actual data

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `.env.local`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Create Next.js app with TypeScript and Tailwind**

```bash
cd C:\projects\openclaw
npx create-next-app@latest mission-control --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Accept defaults. This creates the `mission-control/` subdirectory.

**Step 2: Install shadcn/ui and dependencies**

```bash
cd C:\projects\openclaw\mission-control
npx shadcn@latest init -d
```

Select: New York style, Zinc base color, CSS variables.

Then install core components:

```bash
npx shadcn@latest add button card badge separator scroll-area tabs skeleton tooltip dropdown-menu dialog input textarea select sheet
```

**Step 3: Install additional dependencies**

```bash
npm install lucide-react croner date-fns react-markdown clsx
```

- `lucide-react`: Icon library (already included with shadcn)
- `croner`: Parse cron expressions to human-readable schedules
- `date-fns`: Date formatting and relative time
- `react-markdown`: Render board reports
- `clsx`: Conditional classnames (already included with shadcn)

**Step 4: Configure environment variables**

Create `.env.local`:

```env
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18790
OPENCLAW_TOKEN=9858dab072302642841e54b511cfc83186292501464e7f47
```

Create `.env.example`:

```env
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18790
OPENCLAW_TOKEN=your-gateway-token-here
```

**Step 5: Set up .gitignore**

Ensure `.gitignore` includes:
```
node_modules
.next
.env.local
```

**Step 6: Commit**

```bash
git add mission-control/
git commit -m "feat: scaffold Mission Control Next.js app with shadcn/ui"
```

---

## Task 2: Dark Tactical Design System

**Files:**
- Modify: `mission-control/src/app/globals.css`
- Modify: `mission-control/tailwind.config.ts`
- Create: `mission-control/src/lib/fonts.ts`
- Modify: `mission-control/src/app/layout.tsx`

**Step 1: Configure dark tactical color palette**

Update `globals.css` to set the dark theme as default. Override shadcn's CSS variables:

```css
@layer base {
  :root {
    --background: 233 50% 3%;        /* #0a0a0f */
    --foreground: 0 0% 90%;
    --card: 240 25% 10%;             /* #141420 */
    --card-foreground: 0 0% 90%;
    --popover: 240 25% 10%;
    --popover-foreground: 0 0% 90%;
    --primary: 217 91% 60%;          /* #3b82f6 electric blue */
    --primary-foreground: 0 0% 100%;
    --secondary: 240 10% 15%;
    --secondary-foreground: 0 0% 90%;
    --muted: 240 10% 15%;
    --muted-foreground: 0 0% 55%;
    --accent: 217 91% 60%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;       /* #ef4444 */
    --destructive-foreground: 0 0% 100%;
    --border: 240 15% 18%;
    --input: 240 15% 18%;
    --ring: 217 91% 60%;
    --radius: 0.5rem;

    /* Custom status colors */
    --status-green: 142 71% 45%;     /* #22c55e */
    --status-red: 0 84% 60%;        /* #ef4444 */
    --status-amber: 38 92% 50%;     /* #f59e0b */
    --status-blue: 217 91% 60%;     /* #3b82f6 */
  }
}

body {
  background-color: hsl(var(--background));
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
}
```

**Step 2: Add JetBrains Mono font for data/numbers**

Create `src/lib/fonts.ts`:

```typescript
import { Inter, JetBrains_Mono } from "next/font/google";

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
```

**Step 3: Update root layout with fonts and dark mode**

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { inter, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mission Control",
  description: "OpenCLAW Command Center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 4: Verify dark theme renders**

```bash
cd C:\projects\openclaw\mission-control
npm run dev
```

Open http://localhost:3000 - should see near-black background with subtle blue grid.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: dark tactical design system with custom colors and fonts"
```

---

## Task 3: Gateway Client Library

**Files:**
- Create: `mission-control/src/lib/gateway.ts`
- Create: `mission-control/src/lib/types.ts`

**Step 1: Define TypeScript types for all data structures**

Create `src/lib/types.ts` with interfaces for:

```typescript
// Gateway connection
export interface GatewayConfig {
  url: string;
  token: string;
}

// Cron job (matches ~/.openclaw/cron/jobs.json structure)
export interface CronJob {
  id: string;
  agentId: string;
  name: string;
  enabled: boolean;
  createdAtMs?: number;
  updatedAtMs?: number;
  schedule: {
    kind: "cron" | "at" | "every";
    expr: string;
    tz?: string;
    staggerMs?: number;
  };
  sessionTarget: "isolated" | "main";
  wakeMode: "now" | "next-heartbeat";
  payload: {
    kind: "agentTurn" | "systemEvent";
    message?: string;
    text?: string;
    timeoutSeconds?: number;
  };
  delivery?: {
    mode: "announce" | "webhook" | "none";
    channel?: string;
    to?: string;
  };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastRunStatus?: "ok" | "error" | "timeout";
    lastStatus?: "ok" | "error" | "timeout";
    lastDurationMs?: number;
    lastDelivered?: boolean;
    lastDeliveryStatus?: string;
    consecutiveErrors?: number;
    lastError?: string;
  };
}

// Agent
export interface Agent {
  id: string;
  workspace?: string;
  model?: {
    primary: string;
    fallbacks?: string[];
  };
}

// Pipeline lead
export interface Lead {
  id: string;
  business: string;
  city: string;
  website?: string;
  instagram?: string;
  ownerName?: string;
  ownerEmail?: string;
  emailConfidence?: string;
  googleRating?: number;
  reviewCount?: number;
  topService?: string;
  seoIssues?: string;
  competitor?: string;
  score?: number;
  stage: string;
  stageHistory?: Array<{
    stage: string;
    date: string;
    resendId?: string;
    subject?: string;
    angle?: string;
  }>;
  replied?: boolean;
  replyDate?: string;
  callBooked?: boolean;
  outcome?: string;
}

// Pipeline data
export interface PipelineData {
  version: number;
  lastUpdated: string;
  leads: Lead[];
  metrics: Record<string, number>;
  nextLeadId: number;
}

// Performance data
export interface PerformanceData {
  version: number;
  lastUpdated: string;
  startDate: string;
  currentDay: number;
  currentLimits: {
    emailDailyMax: number;
    dmDailyMax: number;
  };
  deliverability: {
    totalSent: number;
    totalBounced: number;
    bounceRate: number;
  };
  email: {
    totalSent: number;
    totalReplies: number;
    replyRate: number;
    callsBooked: number;
  };
  dm: {
    totalSent: number;
    totalReplies: number;
    successRate: number;
  };
  dailyHistory: Record<string, {
    emailsSent: number;
    dmsSent: number;
    replies: number;
  }>;
}

// Project configuration
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "archived";
  workspace?: string;
  agents?: string[];
  cronJobs?: string[];
  dataFiles?: Record<string, string>;
  dashboard: DashboardConfig;
  createdAt: string;
  updatedAt: string;
}

// Widget configuration
export interface WidgetConfig {
  id: string;
  type: "kpi-cards" | "pipeline-funnel" | "cron-grid" | "activity-feed" | "chart" | "file-viewer" | "markdown-viewer" | "quick-actions" | "table" | "progress-bar" | "health-monitor";
  row: number;
  col?: number;
  width?: number;
  title?: string;
  data?: string;
  config?: Record<string, unknown>;
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
  template?: string;
}

// Gateway health
export interface GatewayHealth {
  status: "online" | "offline" | "degraded";
  uptime?: number;
  agents: Array<{
    id: string;
    status: string;
    model: string;
  }>;
  timestamp: number;
}

// SSE event types
export type SSEEventType = "health" | "cron" | "pipeline" | "performance" | "activity";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: number;
}
```

**Step 2: Build the gateway client**

Create `src/lib/gateway.ts`:

```typescript
import type { CronJob, GatewayHealth } from "./types";

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL!;
const GATEWAY_TOKEN = process.env.OPENCLAW_TOKEN!;

async function gatewayFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = `${GATEWAY_URL}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

// Invoke a tool via the gateway
async function invokeTool(toolName: string, args: Record<string, unknown>): Promise<string> {
  const res = await gatewayFetch("/tools/invoke", {
    method: "POST",
    body: JSON.stringify({ tool: toolName, arguments: args }),
  });
  if (!res.ok) {
    throw new Error(`Gateway tool invoke failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  // Response envelope: result.content[0].text
  return json?.result?.content?.[0]?.text ?? JSON.stringify(json);
}

// Read a file from the gateway host filesystem
export async function readFile(filePath: string): Promise<string> {
  return invokeTool("exec", {
    command: `cat "${filePath.replace(/\\/g, "/")}"`,
  });
}

// Read and parse a JSON file
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath);
  return JSON.parse(content);
}

// Get gateway health status
export async function getHealth(): Promise<GatewayHealth> {
  try {
    const res = await gatewayFetch("/", { method: "GET" });
    return {
      status: res.ok ? "online" : "degraded",
      timestamp: Date.now(),
      agents: [],
    };
  } catch {
    return {
      status: "offline",
      timestamp: Date.now(),
      agents: [],
    };
  }
}

// Get cron jobs
export async function getCronJobs(): Promise<CronJob[]> {
  const data = await readJsonFile<{ jobs: CronJob[] }>(
    "C:/Users/aaron/.openclaw/cron/jobs.json"
  );
  return data.jobs;
}

// Trigger a cron job to run now
export async function runCronJob(jobId: string): Promise<string> {
  return invokeTool("exec", {
    command: `openclaw cron run ${jobId}`,
  });
}

// Toggle a cron job enabled/disabled
export async function toggleCronJob(jobId: string, enabled: boolean): Promise<string> {
  return invokeTool("exec", {
    command: `openclaw cron edit ${jobId} --enabled ${enabled}`,
  });
}

// Get OpenCLAW config
export async function getConfig(): Promise<Record<string, unknown>> {
  return readJsonFile("C:/Users/aaron/.openclaw/openclaw.json");
}

// List files in a directory
export async function listFiles(dirPath: string): Promise<string[]> {
  const output = await invokeTool("exec", {
    command: `ls "${dirPath.replace(/\\/g, "/")}"`,
  });
  return output.split("\n").filter(Boolean);
}

// Send a message to an agent via chat completions
export async function chatWithAgent(
  agentId: string,
  message: string,
  sessionKey?: string
): Promise<string> {
  const res = await gatewayFetch("/v1/chat/completions", {
    method: "POST",
    headers: {
      "x-openclaw-agent-id": agentId,
      ...(sessionKey ? { "x-openclaw-session-key": sessionKey } : {}),
    },
    body: JSON.stringify({
      model: `openclaw:${agentId}`,
      messages: [{ role: "user", content: message }],
      stream: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`Chat failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

export const gateway = {
  getHealth,
  getCronJobs,
  runCronJob,
  toggleCronJob,
  getConfig,
  readFile,
  readJsonFile,
  listFiles,
  chatWithAgent,
};
```

**Step 3: Verify TypeScript compiles**

```bash
cd C:\projects\openclaw\mission-control
npx tsc --noEmit
```

Fix any type errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: gateway client library with types for all data structures"
```

---

## Task 4: App Shell & Navigation

**Files:**
- Create: `mission-control/src/components/layout/sidebar.tsx`
- Create: `mission-control/src/components/layout/topbar.tsx`
- Create: `mission-control/src/components/layout/app-shell.tsx`
- Create: `mission-control/src/components/ui/status-dot.tsx`
- Modify: `mission-control/src/app/layout.tsx`
- Create: `mission-control/src/app/(dashboard)/layout.tsx`
- Create: `mission-control/src/app/(dashboard)/page.tsx`
- Create: `mission-control/src/app/(dashboard)/cron/page.tsx`
- Create: `mission-control/src/app/(dashboard)/projects/page.tsx`
- Create: `mission-control/src/app/(dashboard)/agents/page.tsx`
- Create: `mission-control/src/app/(dashboard)/board/page.tsx`
- Create: `mission-control/src/app/(dashboard)/settings/page.tsx`

**Step 1: Create StatusDot component**

```tsx
// src/components/ui/status-dot.tsx
interface StatusDotProps {
  status: "online" | "offline" | "error" | "warning" | "running";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

const colors = {
  online: "bg-green-500 shadow-green-500/50",
  offline: "bg-gray-500",
  error: "bg-red-500 shadow-red-500/50",
  warning: "bg-amber-500 shadow-amber-500/50",
  running: "bg-blue-500 shadow-blue-500/50",
};

const sizes = { sm: "h-2 w-2", md: "h-3 w-3", lg: "h-4 w-4" };

export function StatusDot({ status, size = "md", pulse = true }: StatusDotProps) {
  return (
    <span className="relative inline-flex">
      <span className={`inline-block rounded-full ${sizes[size]} ${colors[status]} shadow-sm`} />
      {pulse && status !== "offline" && (
        <span className={`absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-75 animate-ping`} />
      )}
    </span>
  );
}
```

**Step 2: Create Sidebar**

```tsx
// src/components/layout/sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, FolderKanban, Bot, FileText, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/cron", label: "Cron Control", icon: Clock },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/board", label: "Board Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-56 border-r border-border/50 bg-card/80 backdrop-blur-sm flex flex-col">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border/50">
        <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
          <span className="font-mono text-primary text-sm font-bold">MC</span>
        </div>
        <span className="font-semibold text-sm">Mission Control</span>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Step 3: Create TopBar**

```tsx
// src/components/layout/topbar.tsx
import { StatusDot } from "@/components/ui/status-dot";

interface TopBarProps {
  gatewayStatus: "online" | "offline" | "degraded";
}

export function TopBar({ gatewayStatus }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 h-12 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <StatusDot status={gatewayStatus === "online" ? "online" : "error"} size="sm" />
          <span className="font-mono text-muted-foreground">
            Gateway {gatewayStatus}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground">
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </header>
  );
}
```

**Step 4: Create AppShell and dashboard layout**

```tsx
// src/components/layout/app-shell.tsx
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-56">
        <TopBar gatewayStatus="online" />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

Create `src/app/(dashboard)/layout.tsx`:

```tsx
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

**Step 5: Create placeholder pages**

Create placeholder pages for each route (`page.tsx` in each folder) with:

```tsx
export default function PageName() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Page Title</h1>
      <p className="text-muted-foreground">Coming soon.</p>
    </div>
  );
}
```

**Step 6: Remove the default root page and redirect**

Move the original `src/app/page.tsx` to `src/app/(dashboard)/page.tsx` to serve the command center at `/`.

**Step 7: Verify navigation works**

```bash
npm run dev
```

Navigate through all pages. Sidebar should highlight the active page. TopBar should show gateway status.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: app shell with sidebar navigation and dark tactical layout"
```

---

## Task 5: API Routes — Gateway Proxy

**Files:**
- Create: `mission-control/src/app/api/health/route.ts`
- Create: `mission-control/src/app/api/cron/route.ts`
- Create: `mission-control/src/app/api/cron/[jobId]/run/route.ts`
- Create: `mission-control/src/app/api/cron/[jobId]/toggle/route.ts`
- Create: `mission-control/src/app/api/files/route.ts`
- Create: `mission-control/src/app/api/config/route.ts`

**Step 1: Health endpoint**

```typescript
// src/app/api/health/route.ts
import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const health = await gateway.getHealth();
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      { status: "offline", error: String(error), timestamp: Date.now(), agents: [] },
      { status: 503 }
    );
  }
}
```

**Step 2: Cron jobs endpoint**

```typescript
// src/app/api/cron/route.ts
import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const jobs = await gateway.getCronJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

**Step 3: Run cron job endpoint**

```typescript
// src/app/api/cron/[jobId]/run/route.ts
import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const result = await gateway.runCronJob(jobId);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

**Step 4: Toggle cron job endpoint**

```typescript
// src/app/api/cron/[jobId]/toggle/route.ts
import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { enabled } = await request.json();
    const result = await gateway.toggleCronJob(jobId, enabled);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

**Step 5: File reader endpoint**

```typescript
// src/app/api/files/route.ts
import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    if (!path) {
      return NextResponse.json({ error: "path parameter required" }, { status: 400 });
    }
    // Security: only allow reading from openclaw directories
    const allowed = ["C:/Users/aaron/.openclaw/", "C:\\Users\\aaron\\.openclaw\\"];
    if (!allowed.some(prefix => path.startsWith(prefix))) {
      return NextResponse.json({ error: "path not allowed" }, { status: 403 });
    }
    const content = await gateway.readFile(path);
    const isJson = path.endsWith(".json");
    if (isJson) {
      return NextResponse.json(JSON.parse(content));
    }
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

**Step 6: Config endpoint**

```typescript
// src/app/api/config/route.ts
import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = await gateway.getConfig();
    // Mask sensitive values
    const masked = JSON.parse(JSON.stringify(config));
    if (masked.env?.vars) {
      for (const key of Object.keys(masked.env.vars)) {
        masked.env.vars[key] = "****";
      }
    }
    if (masked.gateway?.auth?.token) masked.gateway.auth.token = "****";
    if (masked.channels?.telegram?.botToken) masked.channels.telegram.botToken = "****";
    if (masked.hooks?.token) masked.hooks.token = "****";
    return NextResponse.json(masked);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: API routes for gateway health, cron, files, and config"
```

---

## Task 6: SSE Real-Time Endpoint

**Files:**
- Create: `mission-control/src/app/api/stream/route.ts`
- Create: `mission-control/src/hooks/use-sse.ts`

**Step 1: SSE endpoint that polls gateway and pushes updates**

```typescript
// src/app/api/stream/route.ts
import { gateway } from "@/lib/gateway";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Poll loop
      const poll = async () => {
        try {
          const [health, cron] = await Promise.allSettled([
            gateway.getHealth(),
            gateway.getCronJobs(),
          ]);

          if (health.status === "fulfilled") send("health", health.value);
          if (cron.status === "fulfilled") send("cron", { jobs: cron.value });

          send("heartbeat", { timestamp: Date.now() });
        } catch {
          send("error", { message: "Poll failed", timestamp: Date.now() });
        }
      };

      // Initial send
      await poll();

      // Poll every 5 seconds
      const interval = setInterval(poll, 5000);

      // Cleanup on close (controller.close called externally or client disconnect)
      const cleanup = () => clearInterval(interval);

      // Store cleanup so we can call it if needed
      (controller as unknown as Record<string, unknown>).__cleanup = cleanup;
    },
    cancel() {
      // Client disconnected
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

**Step 2: Client-side SSE hook**

```typescript
// src/hooks/use-sse.ts
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { CronJob, GatewayHealth } from "@/lib/types";

interface SSEState {
  health: GatewayHealth | null;
  cronJobs: CronJob[];
  connected: boolean;
  lastUpdate: number | null;
}

export function useSSE() {
  const [state, setState] = useState<SSEState>({
    health: null,
    cronJobs: [],
    connected: false,
    lastUpdate: null,
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/stream");
    eventSourceRef.current = es;

    es.onopen = () => {
      setState((prev) => ({ ...prev, connected: true }));
    };

    es.addEventListener("health", (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({ ...prev, health: data, lastUpdate: Date.now() }));
    });

    es.addEventListener("cron", (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({ ...prev, cronJobs: data.jobs, lastUpdate: Date.now() }));
    });

    es.addEventListener("heartbeat", () => {
      setState((prev) => ({ ...prev, lastUpdate: Date.now() }));
    });

    es.onerror = () => {
      setState((prev) => ({ ...prev, connected: false }));
      // Auto-reconnect after 3 seconds
      setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return state;
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: SSE real-time endpoint with client-side hook"
```

---

## Task 7: Command Center (Home Page)

**Files:**
- Modify: `mission-control/src/app/(dashboard)/page.tsx`
- Create: `mission-control/src/components/dashboard/gateway-health.tsx`
- Create: `mission-control/src/components/dashboard/agent-cards.tsx`
- Create: `mission-control/src/components/dashboard/cron-grid.tsx`
- Create: `mission-control/src/components/dashboard/activity-feed.tsx`
- Create: `mission-control/src/components/providers/sse-provider.tsx`

**Step 1: Create SSE context provider**

```tsx
// src/components/providers/sse-provider.tsx
"use client";
import { createContext, useContext } from "react";
import { useSSE } from "@/hooks/use-sse";
import type { CronJob, GatewayHealth } from "@/lib/types";

interface SSEContextValue {
  health: GatewayHealth | null;
  cronJobs: CronJob[];
  connected: boolean;
  lastUpdate: number | null;
}

const SSEContext = createContext<SSEContextValue>({
  health: null,
  cronJobs: [],
  connected: false,
  lastUpdate: null,
});

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const sse = useSSE();
  return <SSEContext.Provider value={sse}>{children}</SSEContext.Provider>;
}

export function useSSEContext() {
  return useContext(SSEContext);
}
```

Wrap the dashboard layout in `SSEProvider`.

**Step 2: Build Gateway Health card**

Shows connection status, uptime, last update time. Uses `StatusDot` component.

**Step 3: Build Agent Cards**

Two cards side by side for `main` (Claw) and `board-moderator` (The Board). Shows model, last activity, status. Agent data comes from the config (static for now, enriched via SSE later).

**Step 4: Build Cron Grid**

16+ tiles in a responsive grid. Each tile shows job name, colored by status:
- Green: `lastRunStatus === "ok"` and `enabled`
- Red: `lastRunStatus === "error"` or `consecutiveErrors > 0`
- Yellow: currently running (based on timing)
- Gray: disabled

Uses `cronJobs` from SSE context. Click a tile to navigate to `/cron` with that job highlighted.

**Step 5: Build Activity Feed**

For v1, this shows cron job run history as a timeline. Each entry shows:
- Job name
- Time (relative)
- Status (ok/error)
- Duration

Data comes from cron jobs' `state` field via SSE.

**Step 6: Compose the Command Center page**

Three-column layout on desktop:
- Left: Gateway Health + Agent Cards (stacked)
- Center: Cron Grid (takes most space)
- Right: Activity Feed (scrollable)

**Step 7: Verify everything renders**

```bash
npm run dev
```

The command center should show cards with loading skeletons that populate once SSE connects (will show "offline" until gateway tunnel is configured).

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: command center home page with health, agents, cron grid, and feed"
```

---

## Task 8: Cron Control Page

**Files:**
- Modify: `mission-control/src/app/(dashboard)/cron/page.tsx`
- Create: `mission-control/src/components/cron/cron-job-row.tsx`
- Create: `mission-control/src/components/cron/cron-job-detail.tsx`
- Create: `mission-control/src/lib/cron-utils.ts`

**Step 1: Cron utility functions**

```typescript
// src/lib/cron-utils.ts
import { Cron } from "croner";
import { formatDistanceToNow, format } from "date-fns";

export function cronToHuman(expr: string, tz?: string): string {
  // Basic human-readable mapping for common patterns
  const patterns: Record<string, string> = {
    "30 6 * * *": "Daily at 6:30 AM",
    "0 7 * * 1-5": "Weekdays at 7:00 AM",
    "0 8 * * 1-5": "Weekdays at 8:00 AM",
    "30 9 * * 1-5": "Weekdays at 9:30 AM",
    "0 11 * * 1-5": "Weekdays at 11:00 AM",
    "0 13 * * 1-5": "Weekdays at 1:00 PM",
    "0 15 * * *": "Daily at 3:00 PM",
    "0 18 * * *": "Daily at 6:00 PM",
    "0 22 * * 1,3,5": "Mon/Wed/Fri at 10:00 PM",
    "0 1 * * *": "Daily at 1:00 AM",
    "0 8 * * 1": "Mondays at 8:00 AM",
    "0 10 * * 5": "Fridays at 10:00 AM",
    "0 18 * * 0": "Sundays at 6:00 PM",
    "30 23 * * *": "Daily at 11:30 PM",
    "0 0 * * *": "Daily at midnight",
    "15 0 * * *": "Daily at 12:15 AM",
  };
  if (patterns[expr]) return `${patterns[expr]}${tz ? ` (${tz.split("/")[1]})` : ""}`;
  return expr;
}

export function getNextRun(nextRunAtMs?: number): string {
  if (!nextRunAtMs) return "Unknown";
  return formatDistanceToNow(new Date(nextRunAtMs), { addSuffix: true });
}

export function getLastRun(lastRunAtMs?: number): string {
  if (!lastRunAtMs) return "Never";
  return formatDistanceToNow(new Date(lastRunAtMs), { addSuffix: true });
}

export function formatDuration(ms?: number): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function getJobStatusColor(job: { enabled: boolean; state?: { lastRunStatus?: string; consecutiveErrors?: number } }): string {
  if (!job.enabled) return "gray";
  if (!job.state) return "blue";
  if (job.state.consecutiveErrors && job.state.consecutiveErrors > 0) return "red";
  if (job.state.lastRunStatus === "error") return "red";
  if (job.state.lastRunStatus === "ok") return "green";
  return "amber";
}
```

**Step 2: Build CronJobRow component**

A table row showing: name, schedule (human-readable), agent, last run status, duration, next run, error count. Includes action buttons: Run Now, Enable/Disable toggle.

**Step 3: Build CronJobDetail dialog**

A slide-out panel showing full job details: payload message, delivery config, full execution history, error messages. Triggered by clicking a job row.

**Step 4: Build the Cron Control page**

Full-page table of all cron jobs. Grouped by agent (main / board-moderator / system). Color-coded status indicators. Sortable columns. Error jobs highlighted at the top.

Action handlers call the API routes:
```typescript
const handleRunNow = async (jobId: string) => {
  await fetch(`/api/cron/${jobId}/run`, { method: "POST" });
};
```

**Step 5: Verify cron page works**

```bash
npm run dev
```

Navigate to `/cron`. Should show all 16+ jobs with status info (mock data until gateway connected).

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: cron control page with job list, run now, and toggle actions"
```

---

## Task 9: Projects System — Data Layer

**Files:**
- Create: `mission-control/src/lib/projects.ts`
- Create: `mission-control/src/app/api/projects/route.ts`
- Create: `mission-control/src/app/api/projects/[projectId]/route.ts`
- Create: `mission-control/data/projects.json`

**Step 1: Project storage**

Projects are stored in a local JSON file at `mission-control/data/projects.json`. This file is committed to the repo (no secrets). API routes read/write to it.

```typescript
// src/lib/projects.ts
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { Project } from "./types";

const DATA_PATH = join(process.cwd(), "data", "projects.json");

export function getProjects(): Project[] {
  if (!existsSync(DATA_PATH)) return [];
  const raw = readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

export function getProject(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function saveProjects(projects: Project[]): void {
  writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2));
}

export function createProject(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
  const projects = getProjects();
  const newProject: Project = {
    ...project,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.push(newProject);
  saveProjects(projects);
  return newProject;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
  saveProjects(projects);
  return projects[idx];
}

export function deleteProject(id: string): boolean {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  saveProjects(filtered);
  return true;
}
```

**Step 2: Seed with InjectSEO project**

Create `data/projects.json`:

```json
[
  {
    "id": "injectseo",
    "name": "InjectSEO",
    "description": "Med spa SEO outreach and lead generation pipeline",
    "status": "active",
    "workspace": "C:\\Users\\aaron\\.openclaw\\workspace",
    "agents": ["main"],
    "cronJobs": ["lead-discovery", "lead-enrichment", "outreach-send", "follow-up-send", "dm-outreach", "reply-check-afternoon", "reply-check-evening", "inbox-forward", "content-creation"],
    "dataFiles": {
      "pipeline": "C:\\Users\\aaron\\.openclaw\\workspace\\pipeline.json",
      "performance": "C:\\Users\\aaron\\.openclaw\\workspace\\performance.json"
    },
    "dashboard": {
      "widgets": [
        { "id": "w1", "type": "kpi-cards", "row": 1, "title": "Today's Numbers", "data": "performance", "config": { "metrics": ["emailsSentToday", "dmsSentToday", "repliesTotal"] } },
        { "id": "w2", "type": "pipeline-funnel", "row": 2, "title": "Pipeline", "data": "pipeline" },
        { "id": "w3", "type": "cron-grid", "row": 2, "title": "Cron Jobs", "config": { "filter": "injectseo" } },
        { "id": "w4", "type": "progress-bar", "row": 3, "title": "$5K MRR Target", "config": { "current": 0, "target": 5000, "unit": "$" } }
      ]
    },
    "createdAt": "2026-03-06T00:00:00.000Z",
    "updatedAt": "2026-03-06T00:00:00.000Z"
  }
]
```

**Step 3: API routes for projects CRUD**

```typescript
// src/app/api/projects/route.ts - GET (list) and POST (create)
// src/app/api/projects/[projectId]/route.ts - GET, PUT, DELETE
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: projects data layer with CRUD API and InjectSEO seed data"
```

---

## Task 10: Projects Page — List & Detail

**Files:**
- Modify: `mission-control/src/app/(dashboard)/projects/page.tsx`
- Create: `mission-control/src/app/(dashboard)/projects/[projectId]/page.tsx`
- Create: `mission-control/src/components/projects/project-card.tsx`
- Create: `mission-control/src/components/projects/add-project-dialog.tsx`

**Step 1: Project card component**

Shows project name, status badge, description, agent count, cron job count. Links to detail page.

**Step 2: Projects list page**

Grid of project cards + "Add Project" button. Fetches from `/api/projects`.

**Step 3: Add Project dialog**

Form with: name, description, workspace path, template selector (Sales Pipeline, Content Project, Client Work, Blank).

**Step 4: Project detail page**

Shows the widget dashboard for the selected project. Placeholder widgets for now (widget rendering in Task 11).

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: projects list and detail pages with add project flow"
```

---

## Task 11: Widget System — Core Widgets

**Files:**
- Create: `mission-control/src/components/widgets/widget-renderer.tsx`
- Create: `mission-control/src/components/widgets/kpi-cards.tsx`
- Create: `mission-control/src/components/widgets/pipeline-funnel.tsx`
- Create: `mission-control/src/components/widgets/cron-grid-widget.tsx`
- Create: `mission-control/src/components/widgets/progress-bar-widget.tsx`
- Create: `mission-control/src/components/widgets/table-widget.tsx`
- Create: `mission-control/src/components/widgets/markdown-viewer.tsx`
- Create: `mission-control/src/components/widgets/quick-actions.tsx`

**Step 1: Widget renderer**

A component that takes a `WidgetConfig` and renders the appropriate widget. Wraps each in a card with error boundary:

```tsx
export function WidgetRenderer({ widget }: { widget: WidgetConfig }) {
  const Component = widgetMap[widget.type];
  if (!Component) return <UnknownWidget type={widget.type} />;
  return (
    <ErrorBoundary fallback={<WidgetError widget={widget} />}>
      <Card className="border-border/50">
        {widget.title && <CardHeader><CardTitle className="text-sm">{widget.title}</CardTitle></CardHeader>}
        <CardContent>
          <Component config={widget} />
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
```

**Step 2: KPI Cards widget**

Fetches data from configured JSON file via `/api/files?path=...`. Displays big numbers with labels. Uses `font-mono` for numbers.

**Step 3: Pipeline Funnel widget**

Reads pipeline.json, counts leads per stage, renders as horizontal bars (widest at top, narrowing). Each bar labeled with stage name and count.

**Step 4: Cron Grid widget**

Miniature version of the cron grid from the command center. Filters by project's assigned cron jobs.

**Step 5: Progress Bar widget**

Shows a goal tracker (e.g., $0 / $5,000 MRR). Configurable current value, target, and unit. Animated fill bar.

**Step 6: Table widget**

Renders JSON array data as a sortable table. Configurable columns. Used for lead lists, etc.

**Step 7: Markdown Viewer widget**

Fetches a `.md` file and renders with `react-markdown`. Used for board reports.

**Step 8: Quick Actions widget**

Renders buttons that trigger cron jobs or send messages to agents. Each button calls the appropriate API route.

**Step 9: Wire widgets into project detail page**

The project detail page reads the project's `dashboard.widgets` config and renders each through `WidgetRenderer` in a responsive grid layout.

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: widget system with KPI, funnel, cron grid, progress, table, markdown, and actions"
```

---

## Task 12: Agents Page & Chat

**Files:**
- Modify: `mission-control/src/app/(dashboard)/agents/page.tsx`
- Create: `mission-control/src/components/agents/agent-detail-card.tsx`
- Create: `mission-control/src/components/agents/chat-interface.tsx`
- Create: `mission-control/src/app/api/chat/route.ts`

**Step 1: Chat API route**

```typescript
// src/app/api/chat/route.ts
import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { agentId, message, sessionKey } = await request.json();
    const response = await gateway.chatWithAgent(agentId, message, sessionKey);
    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
```

**Step 2: Agent detail cards**

Shows each agent: ID, name (from IDENTITY.md), model, workspace path, heartbeat interval, last session activity. Data from config + SSE.

**Step 3: Chat interface**

Chat UI with:
- Agent selector dropdown (main, board-moderator)
- Message input with send button
- Chat history display (current session only)
- Model indicator
- Loading state while agent responds

Uses `/api/chat` endpoint. Messages stored in React state (not persisted — the gateway handles persistence).

**Step 4: Agents page layout**

Top: Agent cards in a row
Bottom: Chat interface (full width)

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: agents page with detail cards and chat interface"
```

---

## Task 13: Board Reports Page

**Files:**
- Modify: `mission-control/src/app/(dashboard)/board/page.tsx`
- Create: `mission-control/src/components/board/report-viewer.tsx`
- Create: `mission-control/src/components/board/report-list.tsx`
- Create: `mission-control/src/app/api/board/route.ts`
- Create: `mission-control/src/app/api/board/[date]/route.ts`

**Step 1: Board API routes**

```typescript
// src/app/api/board/route.ts - Lists available report dates
// GET: reads C:\Users\aaron\.openclaw\workspace-board\history\ via gateway.listFiles()
// Returns: array of { date, filename } sorted newest first

// src/app/api/board/[date]/route.ts - Gets a specific report
// GET: reads the board report markdown file via gateway.readFile()
// Returns: { content: "markdown string", date: "2026-03-05" }
```

**Step 2: Report list sidebar**

Scrollable list of report dates. Click one to load it. Current/latest highlighted.

**Step 3: Report viewer**

Renders the board report markdown with `react-markdown`. Styled to match the tactical theme. Sections get visual treatment:
- "WHAT WE DID TODAY" → green accent border
- "WHAT WE COULD'VE DONE BETTER" → amber accent border
- "TOMORROW'S PLAN" → blue accent border

**Step 4: Board page layout**

Left sidebar: report date list
Right: full report viewer

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: board reports page with date navigation and markdown viewer"
```

---

## Task 14: Settings Page

**Files:**
- Modify: `mission-control/src/app/(dashboard)/settings/page.tsx`
- Create: `mission-control/src/components/settings/gateway-config.tsx`
- Create: `mission-control/src/components/settings/channel-status.tsx`
- Create: `mission-control/src/components/settings/env-vars.tsx`

**Step 1: Gateway config viewer**

Fetches from `/api/config`. Displays the OpenCLAW config as formatted JSON in a code block. Sensitive values are already masked by the API route.

**Step 2: Channel status**

Shows each channel (Telegram, WhatsApp, etc.) with enabled/disabled status. Green dot for enabled, gray for disabled. Shows key config like bot username for Telegram.

**Step 3: Environment variables**

Lists env vars with masked values. Each shows the key name and `****` for the value. No edit capability (security).

**Step 4: Settings page layout**

Tabbed interface: Gateway | Channels | Environment | Connection

Connection tab shows: gateway URL, tunnel status, last SSE heartbeat.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: settings page with config viewer, channel status, and env vars"
```

---

## Task 15: Cloudflare Tunnel Setup

**Files:**
- Create: `mission-control/docs/tunnel-setup.md`

**Step 1: Install cloudflared on Aaron's machine**

```bash
# Windows (via winget)
winget install Cloudflare.cloudflared

# Or download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

**Step 2: Authenticate with Cloudflare**

```bash
cloudflared tunnel login
```

This opens a browser. Select the domain to use (e.g., injectseo.com or a subdomain).

**Step 3: Create the tunnel**

```bash
cloudflared tunnel create openclaw-gateway
```

Note the tunnel ID output.

**Step 4: Configure the tunnel**

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\aaron\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: gateway.injectseo.com
    service: http://localhost:18790
  - service: http_status:404
```

**Step 5: Route DNS**

```bash
cloudflared tunnel route dns openclaw-gateway gateway.injectseo.com
```

**Step 6: Run the tunnel**

```bash
cloudflared tunnel run openclaw-gateway
```

For persistence, install as a Windows service:

```bash
cloudflared service install
```

**Step 7: Update environment variables**

In Vercel (or `.env.local` for dev):

```
OPENCLAW_GATEWAY_URL=https://gateway.injectseo.com
```

**Step 8: Document the setup**

Write setup instructions to `mission-control/docs/tunnel-setup.md`.

**Step 9: Commit**

```bash
git add -A
git commit -m "docs: Cloudflare Tunnel setup instructions"
```

---

## Task 16: Vercel Deployment

**Files:**
- Create: `mission-control/vercel.json`

**Step 1: Configure Vercel**

Create `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

**Step 2: Deploy to Vercel**

```bash
cd C:\projects\openclaw\mission-control
npx vercel --prod
```

Follow the prompts. Link to Vercel account, select project settings.

**Step 3: Set environment variables in Vercel**

```bash
npx vercel env add OPENCLAW_GATEWAY_URL production
# Enter: https://gateway.injectseo.com

npx vercel env add OPENCLAW_TOKEN production
# Enter: the gateway token
```

**Step 4: Verify deployment**

Open the Vercel URL. Should see Mission Control with the dark tactical theme. Gateway health should show "online" if the Cloudflare Tunnel is running.

**Step 5: Commit vercel.json**

```bash
git add vercel.json
git commit -m "feat: Vercel deployment configuration"
```

---

## Task 17: Cloudflare Access (Auth)

**Step 1: Set up Cloudflare Access application**

In Cloudflare Zero Trust dashboard:
1. Go to Access > Applications
2. Create Application > Self-hosted
3. Application name: "Mission Control"
4. Application domain: the Vercel deployment URL
5. Add policy: Allow — email matches `aaronmcbride57@gmail.com`

**Step 2: Configure identity provider**

Use "One-Time PIN" (email-based). Aaron gets an email with a code to log in. No passwords to manage.

**Step 3: Test access**

1. Open Mission Control URL in incognito
2. Should redirect to Cloudflare Access login
3. Enter email, receive code, enter code
4. Should see Mission Control

**Step 4: Document auth setup**

Add auth section to `docs/tunnel-setup.md`.

---

## Task 18: Enable OpenAI-Compatible API on Gateway

The agent chat feature requires the `/v1/chat/completions` endpoint to be enabled on the gateway.

**Step 1: Update OpenCLAW config**

Add to `openclaw.json`:

```json
{
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  }
}
```

This can be done via:
```bash
openclaw config set gateway.http.endpoints.chatCompletions.enabled true
```

**Step 2: Verify endpoint works**

```bash
curl -X POST http://127.0.0.1:18790/v1/chat/completions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"model":"openclaw:main","messages":[{"role":"user","content":"ping"}]}'
```

Should return a chat completion response.

**Step 3: Commit config change note**

```bash
git add -A
git commit -m "docs: note about enabling chat completions endpoint on gateway"
```

---

## Task 19: End-to-End Smoke Test

**Step 1: Verify all pages load**

Navigate through every page:
- `/` — Command Center shows health, agents, cron grid
- `/cron` — All 16+ jobs listed with status
- `/projects` — InjectSEO project card visible
- `/projects/injectseo` — Widget dashboard renders
- `/agents` — Agent cards + chat interface
- `/board` — Report list + latest report rendered
- `/settings` — Config, channels, env vars shown

**Step 2: Verify real-time updates**

1. Open Command Center
2. Watch for SSE updates (check browser DevTools > Network > EventStream)
3. Cron job status should update when jobs run

**Step 3: Verify actions work**

1. Go to Cron Control
2. Click "Run Now" on a job
3. Toggle a job's enabled state
4. Go to Agents, send a chat message

**Step 4: Verify mobile responsiveness**

Open on phone-sized viewport. Sidebar should collapse. Content should be readable.

**Step 5: Fix any issues found**

Address bugs, layout issues, or broken API calls.

**Step 6: Final commit**

```bash
git add -A
git commit -m "fix: smoke test fixes and polish"
```

---

## Summary

| Task | What It Builds | Key Files |
|------|---------------|-----------|
| 1 | Next.js scaffold + shadcn/ui | `mission-control/` project |
| 2 | Dark tactical theme | globals.css, fonts |
| 3 | Gateway client library | `lib/gateway.ts`, `lib/types.ts` |
| 4 | App shell + navigation | Sidebar, topbar, route structure |
| 5 | API routes (gateway proxy) | `api/health`, `api/cron`, `api/files` |
| 6 | SSE real-time updates | `api/stream`, `hooks/use-sse.ts` |
| 7 | Command Center (home) | Dashboard with health, agents, cron, feed |
| 8 | Cron Control page | Job list, run now, toggle, detail |
| 9 | Projects data layer | CRUD API, JSON storage, InjectSEO seed |
| 10 | Projects UI | List, detail, add project dialog |
| 11 | Widget system | 8 widget types + renderer |
| 12 | Agents + Chat | Agent cards, chat interface |
| 13 | Board Reports | Report list, markdown viewer |
| 14 | Settings | Config viewer, channels, env vars |
| 15 | Cloudflare Tunnel | Tunnel setup + docs |
| 16 | Vercel Deployment | Deploy + env vars |
| 17 | Cloudflare Access | Zero-trust auth |
| 18 | Enable Chat API | Gateway config change |
| 19 | Smoke Test | E2E verification |

**Dependencies:** Tasks 1-6 are sequential (each builds on the previous). Tasks 7-14 can be parallelized after Task 6. Tasks 15-18 can run in parallel. Task 19 is last.
