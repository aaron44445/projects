# Mission Control - Design Document

**Date:** 2026-03-06
**Status:** Approved
**Author:** Aaron McBride + Claude

---

## Overview

Mission Control is a custom command center for Aaron's OpenCLAW ecosystem. It provides full visibility into agent activity, cron job health, project metrics, and pipeline data - plus hands-on control to trigger jobs, chat with agents, and manage configurations. It's a multi-project platform designed to grow as new projects are added beyond InjectSEO.

## Goals

1. **Full visibility** - see what agents are doing, which cron jobs are failing, pipeline health, and project metrics at a glance
2. **Hands-on control** - trigger cron jobs, chat with agents, manage configurations without touching CLI or JSON files
3. **Multi-project** - manage multiple projects (InjectSEO, Treatment Desk, future projects) with customizable dashboards per project
4. **Deployed & accessible** - available from any device via Vercel + Cloudflare Tunnel
5. **Dark tactical UI** - data-dense, dark theme command center aesthetic

## Architecture

```
[Browser (any device)]
        |
  [Vercel - Next.js App]
        |
  [Cloudflare Tunnel]
        |
  [Aaron's PC - OpenCLAW Gateway :18790]
        |
  ┌─────┼─────────────────────┐
  |     |                     |
[Cron] [Agents]         [Workspace Files]
jobs.json  main          pipeline.json
           board-mod     performance.json
                         memory/
```

### Key Decisions

- **Next.js API routes** as secure proxy - gateway token never reaches browser
- **SSE (Server-Sent Events)** for real-time updates (2-5s server-side polling, pushed to browser)
- **Cloudflare Tunnel** connects Vercel to local gateway (free, reliable, stable URL)
- **Cloudflare Access** for zero-trust auth (devices pre-authorized, everyone else blocked)
- **No separate database** - all data lives in OpenCLAW (cron jobs, pipeline, performance, agent state)
- **Read-heavy, write-light** - mostly displaying state, occasionally triggering actions

### Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (dark theme)
- Server-Sent Events for real-time
- Cloudflare Tunnel + Access
- Vercel deployment

## Pages & Features

### 1. Command Center (Home)

The main screen. Everything at a glance.

**Top Bar:**
- Gateway health indicator (green/red dot)
- Last updated timestamp
- Agent status pills (main: online, board-moderator: idle)
- Project switcher dropdown (All Projects / InjectSEO / Treatment Desk / etc.)

**System Health Column:**
- Gateway uptime & connection status
- Agent cards: model, last activity, current state
- Cron job health grid: 16+ jobs as color-coded tiles (green=OK, red=error, yellow=running)

**Activity Feed Column:**
- Real-time reverse-chronological feed
- Color-coded by type: outreach, replies, board reports, errors
- Filterable by agent, job, project

**Project Quick Stats Column:**
- Configurable widgets showing key metrics for the selected project
- For InjectSEO: emails sent/quota, DMs sent/quota, replies, $5K MRR progress
- For other projects: whatever metrics are configured

### 2. Projects

Multi-project management hub.

**Project List View:**
- Cards for each project with name, status (active/paused/archived), agent count, cron job count
- Key metrics preview per project
- Add Project button

**Project Detail View:**
- Configurable widget dashboard (see Widget System below)
- Project-specific cron jobs
- Project-specific activity feed

**Add Project Flow:**
- Name and description
- Link to workspace/data files
- Choose dashboard template (Sales Pipeline, Content Project, Client Work, Blank)
- Configure widgets

### 3. Cron Control

Full cron job management.

- All 16+ jobs listed with: name, schedule (human-readable), last run status, duration, next run, error count
- Grouped by project (with "System" group for cross-project jobs like board reports)
- Quick actions per job: Run Now, Enable/Disable, View Last Output
- Execution history timeline per job
- Error highlighting for failing jobs
- Job creation/editing UI

### 4. Agents

Agent overview and interaction.

- Agent cards: main (Claw), board-moderator (The Board), future agents
- Per-agent: model info, current session, recent activity, performance stats
- Chat interface: send messages to agents via gateway
- Model selector for chat
- Session management (new/continue)
- Agent assignment to projects

### 5. Board Reports

Nightly advisory board output.

- Latest board synthesis report prominently displayed
- Historical reports browsable by date
- Expert analysis breakdown (7 expert roles)
- Data snapshot viewer
- Action items with status tracking

### 6. Settings

System configuration.

- Gateway configuration viewer
- Tunnel/connection status and health
- Channel status (Telegram: connected, WhatsApp: disabled)
- Environment variables (masked display)
- Project management (add/edit/archive)
- Dashboard customization

## Widget System

Each project gets a customizable dashboard built from widgets.

### Available Widget Types

| Widget | Description | Use Case |
|--------|-------------|----------|
| **KPI Cards** | Big number + trend arrow | Any metric from any JSON file |
| **Pipeline Funnel** | Stage-based funnel visualization | Sales pipelines |
| **Cron Status Grid** | Job tiles with health colors | Monitoring scheduled tasks |
| **Activity Feed** | Real-time agent activity log | Agent monitoring |
| **Chart** | Line/bar/pie from JSON data | Trend tracking |
| **File Viewer** | Live view of a workspace file | Logs, reports |
| **Markdown Viewer** | Rendered .md file | Board reports, docs |
| **Quick Actions** | Buttons triggering cron jobs or agent messages | Manual controls |
| **Table** | Sortable data table from JSON | Leads, contacts, records |
| **Progress Bar** | Goal tracker with target | Revenue, milestones |
| **Health Monitor** | System/gateway metrics | System health |

### Configuration

Each project stores a `dashboard.json`:

```json
{
  "project": "InjectSEO",
  "layout": [
    { "widget": "kpi-cards", "row": 1, "data": "performance.json", "metrics": ["emailsSentToday", "dmsSentToday", "repliesTotal"] },
    { "widget": "pipeline-funnel", "row": 2, "data": "pipeline.json", "stageField": "stage" },
    { "widget": "cron-grid", "row": 2, "filter": "project:injectseo" },
    { "widget": "activity-feed", "row": 3, "agents": ["main"] }
  ]
}
```

### Dashboard Templates

- **Sales Pipeline** - funnel + KPIs + outreach metrics + lead table
- **Content Project** - content calendar + SEO rankings + draft list
- **Client Work** - task board + timeline + deliverables
- **Blank** - empty canvas to build from scratch

## Design System

### Colors

- Background: `#0a0a0f` (near-black) with subtle grid pattern
- Card background: `#141420` with thin border accents
- Status green: `#22c55e`
- Status red: `#ef4444`
- Status amber: `#f59e0b`
- Status blue: `#3b82f6`
- Accent: `#3b82f6` (electric blue)

### Typography

- Body text: Inter
- Data/numbers/code: JetBrains Mono
- Dense layout, no wasted space

### UI Principles

- Status indicator lights with subtle glow effects
- Data-dense like a trading terminal
- Every pixel earns its place
- Responsive but desktop-first (this is a command center)
- Loading skeletons for async data
- Error boundaries per widget (one failing widget doesn't crash the page)

## Data Sources

All data comes through the OpenCLAW gateway:

| Data | Source | Update Frequency |
|------|--------|-----------------|
| Agent status | Gateway WebSocket/RPC | 2-5s |
| Cron jobs | `~/.openclaw/cron/jobs.json` via gateway | 5s |
| Cron run history | `~/.openclaw/cron/runs/*.jsonl` via gateway | On demand |
| Pipeline | `workspace/pipeline.json` via gateway | 5s |
| Performance | `workspace/performance.json` via gateway | 5s |
| Board reports | `workspace-board/sessions/` via gateway | On demand |
| Agent sessions | Gateway session API | On demand |
| Memory files | `workspace/memory/` via gateway | On demand |

## Security

- **Cloudflare Access** provides zero-trust auth layer in front of the tunnel
- **Gateway token** stored as Vercel environment variable, never exposed to browser
- **API routes** proxy all gateway communication server-side
- **No sensitive data in URLs** - all communication via POST bodies
- **Environment variables** displayed masked in Settings UI

## Non-Goals (for v1)

- Mobile app (responsive web is sufficient)
- Multi-user access control (single user: Aaron)
- Real-time collaborative editing
- Custom widget code (config-driven only)
- Direct file editing of workspace files (read-only display)

## OpenCLAW Gateway Integration Points

The Next.js API routes will use these gateway capabilities:

1. **RPC calls** via WebSocket for agent status, session management
2. **HTTP API** for chat completions (`/v1/chat/completions`)
3. **File system access** via exec tool (`tools/invoke` with file read commands)
4. **Cron management** via CLI subprocess or gateway RPC
5. **Health endpoint** for gateway status

## Success Criteria

- Dashboard loads in < 2 seconds
- Real-time updates within 5 seconds of changes
- All 16 cron jobs visible with current status
- Pipeline data displayed accurately
- Can trigger a cron job from the UI
- Can chat with agents from the UI
- Can add a new project and configure its dashboard
- Accessible from phone via Vercel URL
- Auth prevents unauthorized access
