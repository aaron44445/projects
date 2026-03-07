# Enforcer Agent (Sentinel) - Design Document

**Date:** 2026-03-07
**Status:** Approved

## Overview

A new OpenCLAW agent called **Sentinel** (id: `enforcer`) that patrols every 10 minutes, detects idle agents, and dispatches revenue-prioritized work to them. Goal: zero idle time across all agents, 24/7.

## Agent Identity

- **ID:** `enforcer`
- **Codename:** Sentinel
- **Model:** `nvidia/moonshotai/kimi-k2.5` (cheap, fast decision-making)
- **Workspace:** `C:\Users\aaron\.openclaw\workspace-enforcer\`
- **Manages:** Claw (main), Bloom (marketer), Forge (builder)
- **Exempt:** The Board (board-moderator) - runs on its own nightly schedule, never touched

## Patrol Loop

**Frequency:** Every 10 minutes, 24/7 (`*/10 * * * *`)
**Timeout:** 120 seconds per tick

Each tick:

1. **Read the battlefield** - Check `cron/jobs.json` for all agents' last run times, statuses, next scheduled runs. Read workspace files for recent output.

2. **Classify each agent:**
   - **WORKING** - Cron job running or completed in last 15 min. Leave alone.
   - **SCHEDULED** - Cron job coming in next 20 min. Leave alone.
   - **IDLE** - No recent activity, nothing coming soon. Needs a task.
   - **STUCK** - Last run errored or 3+ consecutive errors. Needs intervention.
   - **COOLDOWN** - Given an enforcer task in the last patrol cycle. Let it finish.

3. **Assign tasks** to IDLE agents using priority waterfall.

4. **Dispatch** via gateway chat API (`/v1/chat/completions` with agent header), session key: `enforcer:dispatch:{agentId}:{timestamp}`.

5. **Log** to `workspace-enforcer/patrols/YYYY-MM-DD.jsonl`.

6. **STUCK agents** - Re-dispatch on transient errors. Alert Telegram on 3+ consecutive errors.

**Key constraint:** Never dispatch to an agent already working. Check before sending.

## Priority Waterfall

Revenue first, always.

### Priority 1 - URGENT REVENUE
- Unread replies in inbox
- Verified leads ready, daily email quota not hit
- Follow-ups overdue (3+ days since email1)
- Bounce/deliverability issues

### Priority 2 - PIPELINE FUEL
- Fewer than 30 verified leads in pipeline
- Leads stuck at "new" (not enriched)
- DM quota not hit
- Marketing content calendar gaps

### Priority 3 - GROWTH & OPTIMIZATION
- SEO rankings stale
- Competitor analysis outdated (7+ days)
- Template A/B testing
- Blog content drafts needed

### Priority 4 - SELF-IMPROVEMENT (only when P1-P3 covered)
- Outreach angle analysis
- Automation script improvements
- Deliverability optimization
- New lead source research

### Time Awareness
- **7 AM - 9 PM ET:** Outreach, emails, DMs, direct revenue work
- **10 PM - 6 AM ET:** Research, analysis, content, tool-building. No outreach sends.

## Dispatch Messages

Every dispatch is specific and actionable with real data:

**Example (Claw idle, 14 unsent verified leads):**
> ENFORCER DISPATCH: You have 14 verified leads at email_verified with no email1 sent. Daily quota is 20. Send outreach to all 14 now. Read OUTREACH-FRAMEWORK.md for templates. Update pipeline.json after each send. Report count when done.

**Example (Bloom idle, no content in 5 days):**
> ENFORCER DISPATCH: Last blog post draft was 5 days ago. Research a high-value keyword from TOOLS.md that hasn't been covered. Write a 1500-word post targeting med spa owners. Save to workspace-marketer/content-drafts/. Go.

**Example (Forge idle, script errors):**
> ENFORCER DISPATCH: send-email.js has caused 3 cron timeouts this week. Investigate, fix, and test. Log what you changed.

Principles:
- Include specific data that triggered the dispatch
- Tell agent exactly what to do and where to put output
- End with clear completion expectation

## Reporting

### Morning Report (6:00 AM ET, Telegram)
- Hours productive per agent (overnight)
- Tasks dispatched count
- Overnight output summary per agent
- Errors and recoveries
- Total idle time
- Pipeline readiness for the day

### Evening Report (9:00 PM ET, Telegram)
- Hours productive per agent (daytime)
- Tasks dispatched count
- Revenue work output (emails, DMs, follow-ups, replies)
- Enforcer interventions list with timestamps
- Pipeline status
- Total idle time

### Critical Alerts (anytime, Telegram)
- Agent stuck with 3+ consecutive errors
- Outreach quota not on pace by 2 PM
- Zero verified leads in pipeline
- Agent unresponsive 20+ min after dispatch

## Workspace Structure

```
workspace-enforcer/
  patrols/           - JSONL logs of every tick
  reports/           - Morning/evening report archives
  state.json         - Tracks dispatches (who, what, when)
  IDENTITY.md        - Enforcer personality and rules
  PRIORITIES.md      - Priority waterfall reference
```

## Configuration

**openclaw.json agent entry:**
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

**Single cron job:**
- ID: `enforcer-patrol`
- Schedule: `*/10 * * * *` (every 10 min, 24/7)
- Timeout: 120 seconds
- Session target: isolated
- No delivery (silent unless critical alert)

**Two reporting cron jobs:**
- `enforcer-morning-report`: `0 6 * * *` ET, deliver to Telegram
- `enforcer-evening-report`: `0 21 * * *` ET, deliver to Telegram

## What the Enforcer Does NOT Do

- Does not manage The Board (exempt)
- Does not override active cron jobs
- Does not execute business tasks itself (dispatch only)
- Does not send outreach or contact leads directly
- Does not modify other agents' cron schedules
- Does not do deep reasoning (fast reads, quick decisions, dispatch)

## Cost

~144 ticks/day on Kimi K2.5 via NVIDIA. Each tick reads a few JSON files and sends 0-3 short messages. Negligible cost compared to other agents.
