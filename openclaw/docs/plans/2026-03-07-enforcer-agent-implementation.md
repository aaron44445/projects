# Enforcer Agent (Sentinel) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a new OpenCLAW agent called Sentinel that patrols every 10 minutes, detects idle agents, and dispatches revenue-prioritized work to eliminate idle time.

**Architecture:** New `enforcer` agent registered in openclaw.json with its own workspace. Three cron jobs: a patrol loop every 10 min that reads agent state and dispatches tasks via the gateway chat API, plus morning and evening Telegram reports. The enforcer reads cron/jobs.json and workspace files to classify agents as WORKING/SCHEDULED/IDLE/STUCK/COOLDOWN, then sends specific task messages to idle agents.

**Tech Stack:** OpenCLAW agent config (JSON), cron jobs, gateway chat API (`/v1/chat/completions`), Telegram delivery

**Design doc:** `docs/plans/2026-03-07-enforcer-agent-design.md`

---

### Task 1: Create Enforcer Workspace and Identity Files

**Files:**
- Create: `C:\Users\aaron\.openclaw\workspace-enforcer\IDENTITY.md`
- Create: `C:\Users\aaron\.openclaw\workspace-enforcer\PRIORITIES.md`
- Create: `C:\Users\aaron\.openclaw\workspace-enforcer\state.json`

**Step 1: Create workspace directory**

Run:
```bash
mkdir -p "C:\Users\aaron\.openclaw\workspace-enforcer\patrols"
mkdir -p "C:\Users\aaron\.openclaw\workspace-enforcer\reports"
```

**Step 2: Create IDENTITY.md**

Write to `C:\Users\aaron\.openclaw\workspace-enforcer\IDENTITY.md`:

```markdown
# Sentinel - The Enforcer

You are Sentinel, the operations commander for InjectSEO's agent fleet. Your job is simple: **zero idle time**. Every agent works 24/7 toward the $5K MRR goal.

## Your Agents

| Agent | ID | Role | You Manage? |
|-------|-----|------|-------------|
| Claw | main | Lead gen, outreach, email, follow-ups, content | YES |
| Bloom | marketer | Marketing, SEO, social media, content calendar | YES |
| Forge | builder | Code, tools, scripts, automation | YES |
| The Board | board-moderator | Nightly advisory board | NO - exempt |

## Your Rules

1. **Never do the work yourself.** You dispatch, you don't execute.
2. **Never dispatch to a working agent.** Check status before sending.
3. **Never touch The Board.** It runs on its own schedule.
4. **Revenue first, always.** Follow PRIORITIES.md waterfall.
5. **Be specific.** Every dispatch includes real data, file paths, and clear instructions.
6. **Time-aware.** Outreach 7AM-9PM ET only. Research/building overnight.
7. **Log everything.** Write patrol results to patrols/ directory.

## How You Dispatch

Send tasks to agents via the gateway. Your message should follow this format:

```
ENFORCER DISPATCH: [Specific situation with real numbers]. [Exact task]. [File paths to read/write]. [What to do when done].
```

## How You Detect Agent State

Read C:\Users\aaron\.openclaw\cron\jobs.json and check each agent's jobs:

- **WORKING**: lastRunAtMs within last 15 minutes AND (lastRunStatus is not set OR running)
- **SCHEDULED**: nextRunAtMs is within next 20 minutes
- **IDLE**: No recent activity, nothing coming soon
- **STUCK**: consecutiveErrors >= 3 OR lastRunStatus is "error" for last 2+ runs
- **COOLDOWN**: You dispatched to them in the last patrol tick (check state.json)

## Key File Paths

- Cron state: C:\Users\aaron\.openclaw\cron\jobs.json
- Pipeline: C:\Users\aaron\.openclaw\workspace\pipeline.json
- Performance: C:\Users\aaron\.openclaw\workspace\performance.json
- Outreach framework: C:\projects\medseo\OUTREACH-FRAMEWORK.md
- Board reports: C:\Users\aaron\.openclaw\workspace-board\history\
- Your state: C:\Users\aaron\.openclaw\workspace-enforcer\state.json
- Your patrol logs: C:\Users\aaron\.openclaw\workspace-enforcer\patrols\
```

**Step 3: Create PRIORITIES.md**

Write to `C:\Users\aaron\.openclaw\workspace-enforcer\PRIORITIES.md`:

```markdown
# Task Priority Waterfall

Revenue first, always. Work down the list. Assign the highest-priority unfinished work.

## Priority 1 - URGENT REVENUE (assign immediately)

| Condition | Assign To | Task |
|-----------|-----------|------|
| Unread replies in inbox (check Resend API) | Claw | Check inbox, match to pipeline, alert Aaron on hot leads |
| Verified leads ready + daily email quota not hit | Claw | Send outreach emails up to quota. Read OUTREACH-FRAMEWORK.md. |
| Follow-ups overdue (3+ days since email1, no follow-up) | Claw | Send follow-up emails per OUTREACH-FRAMEWORK.md sequence |
| Bounce rate above 3% | Claw | Investigate deliverability, pause bad addresses, report |

## Priority 2 - PIPELINE FUEL (keep the machine fed)

| Condition | Assign To | Task |
|-----------|-----------|------|
| Fewer than 30 verified leads in pipeline | Claw | Discover new leads in 3-4 cities, score, enrich, verify emails |
| Leads stuck at "new" stage (not enriched) | Claw | Enrich all "new" leads: find owner names, verify emails |
| DM quota not hit for today | Claw | Instagram DM outreach to leads with handles |
| Marketing content calendar has gaps | Bloom | Plan and draft content for upcoming gaps |

## Priority 3 - GROWTH & OPTIMIZATION

| Condition | Assign To | Task |
|-----------|-----------|------|
| SEO rankings not checked in 3+ days | Bloom | Check rankings for target keywords, save to workspace |
| Competitor analysis older than 7 days | Bloom | Research competitors in top 5 cities |
| Outreach angles with 0 replies after 15+ sends | Claw | A/B test new angles, retire underperformers |
| No blog content drafted in 5+ days | Bloom or Claw | Write a blog post targeting uncovered keyword |

## Priority 4 - SELF-IMPROVEMENT (only when P1-P3 are covered)

| Condition | Assign To | Task |
|-----------|-----------|------|
| No performance analysis in 2+ days | Claw | Analyze reply rates by angle, city, day. Save insights. |
| Automation scripts have errors | Forge | Fix broken scripts, test, commit |
| New tool/script could save time | Forge | Build it. Keep it simple. |
| New lead sources or niches to explore | Bloom | Research adjacent niches (dermatology, plastic surgery, etc.) |

## Time Rules

- **7 AM - 9 PM ET**: Outreach, emails, DMs, direct revenue work
- **10 PM - 6 AM ET**: Research, analysis, content writing, tool building. NO outreach sends.
- **Weekends**: Lighter outreach (content, research, tool building prioritized). Some email OK.
```

**Step 4: Create initial state.json**

Write to `C:\Users\aaron\.openclaw\workspace-enforcer\state.json`:

```json
{
  "lastPatrolAtMs": 0,
  "dispatches": [],
  "agentStates": {
    "main": { "status": "unknown", "lastDispatchAtMs": 0, "lastDispatchTask": "" },
    "marketer": { "status": "unknown", "lastDispatchAtMs": 0, "lastDispatchTask": "" },
    "builder": { "status": "unknown", "lastDispatchAtMs": 0, "lastDispatchTask": "" }
  },
  "todayStats": {
    "date": "",
    "patrols": 0,
    "dispatches": 0,
    "idleMinutes": { "main": 0, "marketer": 0, "builder": 0 },
    "productiveMinutes": { "main": 0, "marketer": 0, "builder": 0 },
    "errors": 0
  }
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: create enforcer (Sentinel) workspace and identity files"
```

---

### Task 2: Register Enforcer Agent in openclaw.json

**Files:**
- Modify: `C:\Users\aaron\.openclaw\openclaw.json` (agents.list array)

**Step 1: Add enforcer to agents.list**

In `C:\Users\aaron\.openclaw\openclaw.json`, add to the `agents.list` array after the `builder` entry:

```json
{
  "id": "enforcer",
  "workspace": "C:\\Users\\aaron\\.openclaw\\workspace-enforcer",
  "model": {
    "primary": "nvidia/moonshotai/kimi-k2.5",
    "fallbacks": ["nvidia/deepseek-ai/deepseek-v3.2"]
  }
}
```

**Step 2: Verify gateway picks up the new agent**

Run:
```bash
curl -s -H "Authorization: Bearer 9858dab072302642841e54b511cfc83186292501464e7f47" http://127.0.0.1:18790/
```

Expected: Response includes health info. The gateway hot-reloads config changes.

**Step 3: Test that we can chat with the enforcer**

Run:
```bash
curl -s -X POST http://127.0.0.1:18790/v1/chat/completions \
  -H "Authorization: Bearer 9858dab072302642841e54b511cfc83186292501464e7f47" \
  -H "Content-Type: application/json" \
  -H "x-openclaw-agent-id: enforcer" \
  -H "x-openclaw-session-key: test:enforcer-registration" \
  -d '{"model":"openclaw:enforcer","messages":[{"role":"user","content":"Confirm you are online. Reply with: SENTINEL ONLINE."}],"stream":false}'
```

Expected: Response containing "SENTINEL ONLINE" or similar acknowledgment.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: register enforcer agent in openclaw.json"
```

---

### Task 3: Create Patrol Cron Job

**Files:**
- Modify: `C:\Users\aaron\.openclaw\cron\jobs.json` (add patrol job)

**Step 1: Add the enforcer-patrol cron job**

Add to the `jobs` array in `C:\Users\aaron\.openclaw\cron\jobs.json`:

```json
{
  "id": "enforcer-patrol",
  "agentId": "enforcer",
  "name": "enforcer-patrol",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "*/10 * * * *",
    "tz": "America/New_York"
  },
  "sessionTarget": "isolated",
  "wakeMode": "now",
  "payload": {
    "kind": "agentTurn",
    "message": "PATROL TICK. You are Sentinel, the Enforcer. Read your IDENTITY.md and PRIORITIES.md first.\n\nSTEP 1: Read C:\\Users\\aaron\\.openclaw\\cron\\jobs.json. For each agent (main, marketer, builder - NOT board-moderator), check:\n- lastRunAtMs vs now (within 15 min = WORKING)\n- nextRunAtMs vs now (within 20 min = SCHEDULED)\n- consecutiveErrors >= 3 = STUCK\n- Otherwise = IDLE\n\nSTEP 2: Read C:\\Users\\aaron\\.openclaw\\workspace-enforcer\\state.json. Any agent dispatched in last 15 minutes = COOLDOWN. Do not re-dispatch.\n\nSTEP 3: For each IDLE agent, read C:\\Users\\aaron\\.openclaw\\workspace\\pipeline.json and C:\\Users\\aaron\\.openclaw\\workspace\\performance.json. Determine the highest-priority task from PRIORITIES.md.\n\nSTEP 4: Check the time. If 10PM-6AM ET, only assign research/analysis/content/building tasks. No outreach sends.\n\nSTEP 5: For each IDLE agent, send a specific ENFORCER DISPATCH message. Use exec to call:\ncurl -s -X POST http://127.0.0.1:18790/v1/chat/completions -H \"Authorization: Bearer 9858dab072302642841e54b511cfc83186292501464e7f47\" -H \"Content-Type: application/json\" -H \"x-openclaw-agent-id: [AGENT_ID]\" -H \"x-openclaw-session-key: enforcer:dispatch:[AGENT_ID]:[TIMESTAMP]\" -d '{\"model\":\"openclaw:[AGENT_ID]\",\"messages\":[{\"role\":\"user\",\"content\":\"[YOUR DISPATCH MESSAGE]\"}],\"stream\":false}'\n\nSTEP 6: For STUCK agents (3+ consecutive errors), send Aaron a Telegram alert describing the error and which agent is stuck.\n\nSTEP 7: Update state.json with this patrol's results: timestamp, each agent's status, any dispatches sent. Increment todayStats counters. If todayStats.date is not today, reset daily stats.\n\nSTEP 8: Append one JSONL line to C:\\Users\\aaron\\.openclaw\\workspace-enforcer\\patrols\\YYYY-MM-DD.jsonl with: {timestamp, agents: {main: status, marketer: status, builder: status}, dispatched: [{agentId, task}], errors: []}.\n\nBe fast. Be decisive. No agent sits idle on your watch.",
    "timeoutSeconds": 120
  },
  "delivery": {
    "mode": "announce"
  }
}
```

**Step 2: Verify job appears in cron list**

Run:
```bash
curl -s -H "Authorization: Bearer 9858dab072302642841e54b511cfc83186292501464e7f47" http://127.0.0.1:18790/ | findstr -i "cron"
```

Or simply wait for the next 10-minute mark and check the patrol log.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add enforcer patrol cron job (every 10 min)"
```

---

### Task 4: Create Morning Report Cron Job

**Files:**
- Modify: `C:\Users\aaron\.openclaw\cron\jobs.json` (add morning report job)

**Step 1: Add the enforcer-morning-report cron job**

Add to the `jobs` array:

```json
{
  "id": "enforcer-morning-report",
  "agentId": "enforcer",
  "name": "enforcer-morning-report",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "0 6 * * *",
    "tz": "America/New_York"
  },
  "sessionTarget": "isolated",
  "wakeMode": "now",
  "payload": {
    "kind": "agentTurn",
    "message": "MORNING REPORT. You are Sentinel. Compile overnight activity into a Telegram report.\n\nSTEP 1: Read C:\\Users\\aaron\\.openclaw\\workspace-enforcer\\state.json for todayStats.\n\nSTEP 2: Read yesterday's patrol log from C:\\Users\\aaron\\.openclaw\\workspace-enforcer\\patrols\\YYYY-MM-DD.jsonl (use yesterday's date). Count: total patrols, dispatches per agent, idle minutes per agent, errors.\n\nSTEP 3: Read C:\\Users\\aaron\\.openclaw\\workspace\\pipeline.json and C:\\Users\\aaron\\.openclaw\\workspace\\performance.json for pipeline readiness.\n\nSTEP 4: Format the report EXACTLY like this:\n\nSENTINEL OVERNIGHT REPORT [date]\n\nHOURS PRODUCTIVE: Claw [X]/8h | Bloom [X]/8h | Forge [X]/8h\nTASKS DISPATCHED: [N] (Claw: [N], Bloom: [N], Forge: [N])\n\nOVERNIGHT OUTPUT:\n- Claw: [summary of what Claw did]\n- Bloom: [summary of what Bloom did]\n- Forge: [summary of what Forge did]\n\nERRORS: [N] ([details if any])\nIDLE TIME: [X] min total across all agents\n\nREADY FOR TODAY: [N] verified leads | Quota: [N] emails, [N] DMs\n\nSTEP 5: Save report to C:\\Users\\aaron\\.openclaw\\workspace-enforcer\\reports\\morning-YYYY-MM-DD.md\n\nKeep it under 20 lines. Numbers, not words.",
    "timeoutSeconds": 120
  },
  "delivery": {
    "mode": "announce",
    "channel": "telegram",
    "to": "7301884726"
  }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add enforcer morning report cron job (6 AM ET)"
```

---

### Task 5: Create Evening Report Cron Job

**Files:**
- Modify: `C:\Users\aaron\.openclaw\cron\jobs.json` (add evening report job)

**Step 1: Add the enforcer-evening-report cron job**

Add to the `jobs` array:

```json
{
  "id": "enforcer-evening-report",
  "agentId": "enforcer",
  "name": "enforcer-evening-report",
  "enabled": true,
  "schedule": {
    "kind": "cron",
    "expr": "0 21 * * *",
    "tz": "America/New_York"
  },
  "sessionTarget": "isolated",
  "wakeMode": "now",
  "payload": {
    "kind": "agentTurn",
    "message": "EVENING REPORT. You are Sentinel. Compile today's full activity into a Telegram report.\n\nSTEP 1: Read C:\\Users\\aaron\\.openclaw\\workspace-enforcer\\state.json for todayStats.\n\nSTEP 2: Read today's patrol log from C:\\Users\\aaron\\.openclaw\\workspace-enforcer\\patrols\\YYYY-MM-DD.jsonl. Count: total patrols, dispatches per agent, idle minutes per agent, errors, interventions.\n\nSTEP 3: Read C:\\Users\\aaron\\.openclaw\\workspace\\pipeline.json and C:\\Users\\aaron\\.openclaw\\workspace\\performance.json for today's output numbers.\n\nSTEP 4: Format the report EXACTLY like this:\n\nSENTINEL DAY REPORT [date]\n\nHOURS PRODUCTIVE: Claw [X]/14h | Bloom [X]/14h | Forge [X]/14h\nTASKS DISPATCHED: [N] (Claw: [N], Bloom: [N], Forge: [N])\n\nTODAY'S REVENUE WORK:\n- Emails sent: [N]/[quota]\n- DMs sent: [N]/[quota]\n- Follow-ups: [N]\n- Replies: [N] new ([details of hot leads])\n\nENFORCER INTERVENTIONS: [N]\n- [time]: [agent] idle - dispatched to [task]\n(list each intervention)\n\nPIPELINE: [total] | [verified] | [emailed] | [replied]\nIDLE TIME: [X] min total across all agents\n\nSTEP 5: Save report to C:\\Users\\aaron\\.openclaw\\workspace-enforcer\\reports\\evening-YYYY-MM-DD.md\n\nSTEP 6: Reset todayStats in state.json for tomorrow.\n\nKeep it under 25 lines. Numbers, not words.",
    "timeoutSeconds": 120
  },
  "delivery": {
    "mode": "announce",
    "channel": "telegram",
    "to": "7301884726"
  }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add enforcer evening report cron job (9 PM ET)"
```

---

### Task 6: Update Mission Control to Show Enforcer Agent

**Files:**
- Modify: `C:\projects\openclaw\mission-control\src\lib\gateway.ts` (add enforcer to agentDefs)
- Modify: `C:\projects\openclaw\mission-control\src\app\api\deploy-all\route.ts` (exclude enforcer from DEPLOY ALL)
- Modify: `C:\projects\openclaw\mission-control\src\components\command-center\agent-status-sidebar.tsx` (add Sentinel display)
- Modify: `C:\projects\openclaw\mission-control\src\components\command-center\war-room-map.tsx` (add Sentinel sprite)

**Step 1: Add enforcer to gateway agentDefs**

In `gateway.ts` line ~138, add to the `agentDefs` object:

```typescript
enforcer: { label: "SENTINEL" },
```

**Step 2: Add enforcer to SCHEDULED_AGENTS set**

In `gateway.ts` line ~184, the enforcer should NOT be in SCHEDULED_AGENTS (it's always running, never shows as "scheduled"). No change needed here - it will correctly show as active/idle based on cron state.

**Step 3: Exclude enforcer from DEPLOY ALL**

The enforcer manages itself - it should not receive DEPLOY ALL messages. In `deploy-all/route.ts`, the AGENTS array already only includes main, marketer, builder. No change needed.

**Step 4: Add Sentinel to war-room-map.tsx and agent-status-sidebar.tsx**

Read both files to understand the sprite and sidebar patterns, then add Sentinel as a new agent with a distinct position on the map and an entry in the sidebar. Use a unique color (e.g., amber/gold) to distinguish the enforcer from other agents.

Find the agent definitions/config arrays in both files and add:

```typescript
// In the agent config/definitions:
{ id: "enforcer", label: "SENTINEL", codename: "Sentinel", color: "#F59E0B" }
```

Position Sentinel at the center/top of the map - overseeing all other agents.

**Step 5: Verify Mission Control renders correctly**

Run:
```bash
cd C:\projects\openclaw\mission-control && npm run dev
```

Check http://localhost:3000 - Sentinel should appear on the map and sidebar.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Sentinel to Mission Control war room and sidebar"
```

---

### Task 7: Verify End-to-End Patrol Cycle

**Step 1: Trigger a manual patrol run**

Run:
```bash
curl -s -X POST http://127.0.0.1:18790/v1/chat/completions \
  -H "Authorization: Bearer 9858dab072302642841e54b511cfc83186292501464e7f47" \
  -H "Content-Type: application/json" \
  -H "x-openclaw-agent-id: enforcer" \
  -H "x-openclaw-session-key: test:first-patrol" \
  -d '{"model":"openclaw:enforcer","messages":[{"role":"user","content":"PATROL TICK. You are Sentinel, the Enforcer. Read your IDENTITY.md and PRIORITIES.md. Then read cron/jobs.json and classify all agents. Report their statuses. If any are IDLE, dispatch them. This is your first live patrol."}],"stream":false}'
```

**Step 2: Check patrol log was created**

Run:
```bash
type "C:\Users\aaron\.openclaw\workspace-enforcer\patrols\2026-03-07.jsonl"
```

Expected: At least one JSONL line with agent statuses.

**Step 3: Check state.json was updated**

Run:
```bash
type "C:\Users\aaron\.openclaw\workspace-enforcer\state.json"
```

Expected: Updated lastPatrolAtMs and agent states.

**Step 4: Verify idle agents received dispatches**

Check the gateway logs or agent session files to confirm dispatch messages were sent to any idle agents.

**Step 5: Commit verification notes**

```bash
git add -A
git commit -m "test: verify enforcer first patrol cycle works end-to-end"
```

---

### Task 8: Update Memory and Documentation

**Files:**
- Modify: `C:\Users\aaron\.claude\projects\C--projects\memory\MEMORY.md` (add enforcer agent info)

**Step 1: Add enforcer to project memory**

Add to the OpenCLAW Agents section:

```markdown
- **enforcer** (Sentinel): Operations commander ensuring zero agent idle time, added 2026-03-07
  - Workspace: `C:\Users\aaron\.openclaw\workspace-enforcer\`
  - Model: nvidia/moonshotai/kimi-k2.5
  - 3 cron jobs: patrol every 10 min (24/7), morning report (6 AM ET), evening report (9 PM ET)
  - Manages: Claw, Bloom, Forge (NOT The Board)
  - Priority: Revenue > Pipeline > Growth > Self-improvement
  - Dispatches tasks via gateway chat API to idle agents
  - Reports via Telegram morning + evening, critical alerts anytime
```

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: add enforcer agent to project memory"
```
