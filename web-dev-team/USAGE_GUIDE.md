# Token-Optimized Usage Guide

This guide helps you get maximum value while minimizing token usage.

---

## Golden Rules for Token Efficiency

1. **Load only what you need** - Never load all agents at once
2. **Use the lite orchestrator** - For partial projects, skip the full orchestrator
3. **Pass summaries, not full context** - Between agents, summarize don't copy
4. **One agent at a time** - Complete one phase before starting the next
5. **Scope narrowly** - "Fix the nav component" not "improve the whole app"

---

## Quick Decision Tree

```
What do you need?

├─ Starting from scratch?
│  └─ Use: Full Orchestrator (orchestrator/SKILL.md)
│
├─ Have existing code, need improvements?
│  └─ Use: Lite Orchestrator (orchestrator/LITE.md)
│     └─ Specify which agents you need
│
├─ Just one specific task?
│  └─ Use: Single Agent directly
│     └─ Skip orchestrator entirely
│
└─ Design audit only?
   └─ Use: UI Designer agent alone
```

---

## Common Scenarios

### Scenario A: Existing App, Needs UI Polish (Your Case)

**What you have:** Working SPA with functionality complete
**What you need:** Better design, improved UX

**Optimal approach:**
```
Read web-dev-team/agents/ui-designer/SKILL.md

I have an existing SPA at [path]. Please:
1. Review the current UI/UX
2. Create an improved design system
3. Provide specific component-by-component improvements

Focus on: [list 2-3 priority areas like "navigation", "forms", "dashboard"]
```

**Token savings:** ~70% vs full orchestrator

**Then, if needed:**
```
Read web-dev-team/agents/frontend/SKILL.md

Here's the design system from the UI review: [paste summary only]
Implement these changes in priority order:
1. [specific component]
2. [specific component]
```

---

### Scenario B: Need Tests for Existing Code

```
Read web-dev-team/agents/testing/SKILL.md

Add tests to my existing SPA at [path]. Focus on:
- Unit tests for [specific utilities/hooks]
- E2E tests for [specific user flows]

Don't test: [things to skip]
```

---

### Scenario C: Need Deployment Setup Only

```
Read web-dev-team/agents/devops/SKILL.md

Set up CI/CD for my existing project:
- Framework: [React/Vue/etc]
- Hosting preference: [Vercel/Railway/etc]
- Database: [if any]
```

---

### Scenario D: Multiple Agents, But Not All

Use the Lite Orchestrator:
```
Read web-dev-team/orchestrator/LITE.md

Project: [name]
Location: [path to existing code]

I need ONLY these agents:
- UI Designer: Audit current design
- Frontend: Implement design improvements
- Testing: Add E2E tests for main flows

Skip: Backend, Database, DevOps (already done)

Start with: UI Designer
```

---

## Agent Loading Costs (Approximate)

| What You Load | Token Cost | When to Use |
|---------------|------------|-------------|
| Single agent | ~2-3K | Focused single task |
| Lite orchestrator + 2 agents | ~5-7K | Partial improvements |
| Full orchestrator + all agents | ~15-20K | Greenfield project |

---

## Passing Context Efficiently

### Bad (Wastes Tokens)
```
Here's the full output from the UI Designer:
[pastes 2000 lines of design system]
```

### Good (Token Efficient)
```
UI Designer completed. Key decisions:
- Colors: Primary #3b82f6, Gray scale, Error #ef4444
- Typography: Inter font, 16px base
- Components needed: Button, Input, Card, Modal

Priority changes for this phase:
1. Refactor Button component (see Button spec in docs/DESIGN_SYSTEM.md)
2. Update form inputs to match new style
```

---

## For Your SPA Software Specifically

Based on what you described, here's your optimal path:

### Step 1: UI Audit (Start Here)
```
Read web-dev-team/agents/ui-designer/SKILL.md

I have a SPA for spa/salon management software at spa-software/

Please audit the current UI and create:
1. A design system based on what's there (improve, don't reinvent)
2. Specific improvement recommendations by priority
3. Component-by-component change list

Current pages to review: [list your main pages]
Style direction: [modern/minimal/friendly/etc]
```

### Step 2: Implement Design (If Needed)
After UI audit, only if you want help implementing:
```
Read web-dev-team/agents/frontend/SKILL.md

Implement these UI improvements from the design audit:
[paste just the priority list, not full design system]

Start with: [most important component]
```

### Step 3: Add Tests (Optional)
```
Read web-dev-team/agents/testing/SKILL.md

Add E2E tests for these critical flows:
1. [booking flow]
2. [checkout flow]
3. [etc]
```

---

## Anti-Patterns to Avoid

| Don't Do This | Do This Instead |
|---------------|-----------------|
| Load orchestrator for one task | Load single agent |
| Paste full file contents in prompts | Reference file paths |
| Ask agent to review "everything" | Specify exact scope |
| Load all agents "just in case" | Load as needed |
| Repeat context each message | Say "continue from above" |

---

## Template for Existing Projects

Copy and customize:

```
Read web-dev-team/agents/[AGENT]/SKILL.md

Project: [Name]
Location: [path]
Framework: [React/Vue/etc]

Current state:
- [What's working]
- [What needs improvement]

This session, focus ONLY on:
1. [Specific task 1]
2. [Specific task 2]

Do NOT:
- [Things to skip]
- [Areas that are fine]

Start with: [First priority]
```
