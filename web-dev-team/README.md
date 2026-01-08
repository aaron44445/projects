# Web Development Team System

A complete, coordinated AI development team for building world-class web projects.

## Quick Start

### 1. Fill Out the Project Brief

Copy and fill out `project-templates/PROJECT_BRIEF.md` with your project details.

### 2. Start the Orchestrator

Tell Claude to read the orchestrator skill and begin:

```
Read web-dev-team/orchestrator/SKILL.md and start my project.

Here's my brief: [paste filled brief]
```

### 3. Follow the Workflow

The orchestrator will:
- Analyze your requirements
- Engage specialist agents in the right order
- Coordinate handoffs between agents
- Track progress and handle blockers
- Deliver your completed project

---

## Team Structure

```
                    ┌─────────────────┐
                    │   ORCHESTRATOR  │
                    │   (Tech Lead)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  UI DESIGNER  │   │   FRONTEND    │   │   BACKEND     │
│  Visual/UX    │   │   React/CSS   │   │   API/Logic   │
└───────────────┘   └───────────────┘   └───────────────┘
        │                    │                    │
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   DATABASE    │   │   TESTING     │   │    DEVOPS     │
│  Schema/Query │   │   QA/E2E      │   │   Deploy/CI   │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## Directory Structure

```
web-dev-team/
├── orchestrator/
│   └── SKILL.md              # Team coordinator
├── agents/
│   ├── ui-designer/
│   │   └── SKILL.md          # Visual design specialist
│   ├── frontend/
│   │   └── SKILL.md          # Frontend implementation
│   ├── backend/
│   │   └── SKILL.md          # API & server logic
│   ├── database/
│   │   └── SKILL.md          # Data modeling & queries
│   ├── testing/
│   │   └── SKILL.md          # QA & testing
│   └── devops/
│       └── SKILL.md          # Deployment & infrastructure
├── project-templates/
│   └── PROJECT_BRIEF.md      # Your project brief template
├── assets/
│   ├── ui-templates/
│   │   └── LAYOUTS.md        # Layout patterns for UI designer
│   └── component-examples/
│       └── COMPONENTS.md     # Component patterns for reference
└── README.md                 # This file
```

---

## How It Works

### Phase Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Phase 1: DESIGN                                             │
│  UI Designer creates design system, wireframes, mockups      │
│  → Checkpoint: User approves design                          │
├──────────────────────────────────────────────────────────────┤
│  Phase 2: ARCHITECTURE                                       │
│  Backend + Database plan data models and API contracts       │
│  → Checkpoint: Architecture review                           │
├──────────────────────────────────────────────────────────────┤
│  Phase 3: DEVELOPMENT (Parallel)                             │
│  Frontend builds UI │ Backend builds API │ Database schemas  │
├──────────────────────────────────────────────────────────────┤
│  Phase 4: INTEGRATION                                        │
│  Connect frontend to backend, error handling, edge cases     │
│  → Checkpoint: Feature complete review                       │
├──────────────────────────────────────────────────────────────┤
│  Phase 5: QUALITY ASSURANCE                                  │
│  Testing agent: unit, integration, E2E, accessibility, perf  │
├──────────────────────────────────────────────────────────────┤
│  Phase 6: DEPLOYMENT                                         │
│  DevOps agent: CI/CD, environments, monitoring, launch       │
└──────────────────────────────────────────────────────────────┘
```

### Agent Handoffs

Agents pass work with structured handoffs:

```
HANDOFF: UI Designer → Frontend
═══════════════════════════════════════

Context:
Design system and mockups complete

Deliverables:
- Design tokens, component specs, interactive mockups

Dependencies:
- Google Fonts loaded, Lucide icons

Next Steps:
- Implement Button, Input, Card components first
```

---

## Using the Team

### Option A: Full Project

For complete projects, start with the orchestrator:

```
Please read web-dev-team/orchestrator/SKILL.md and help me build:
[paste your project brief]
```

### Option B: Single Specialist

For focused tasks, call a specific agent:

```
Please read web-dev-team/agents/frontend/SKILL.md and help me:
Build a responsive navigation component with these requirements...
```

### Option C: Design First

For exploration before committing:

```
Please read web-dev-team/agents/ui-designer/SKILL.md and create:
A design system and mockups for a fitness tracking dashboard
```

---

## Project Brief Essentials

### Minimum Viable Brief

```
Project: [Name]
Type: [Landing/App/Dashboard/etc.]
Goal: [What it must accomplish]

Must Have:
1. [Feature]
2. [Feature]
3. [Feature]

Style: [Aesthetic direction]
Reference: [URL of site you like]
```

### Better Brief Includes

- Target users and their goals
- Technical preferences or constraints
- Brand assets (colors, fonts, logo)
- Multiple reference sites with notes on what you like
- Content/pages list
- Primary user flow

### Best Briefs

Include everything in `PROJECT_BRIEF.md`

---

## Tips for Best Results

### Be Specific About Design

```
❌ "Make it look professional"
✅ "Editorial aesthetic like Stripe's site - clean typography,
    generous whitespace, subtle animations"
```

### Provide References

```
❌ "I want something modern"
✅ "Linear.app's dark theme, Vercel's typography,
    Notion's subtle interactions"
```

### Define Success

```
❌ "Build me a dashboard"
✅ "Dashboard where sales managers can see daily revenue,
    compare to targets, and drill into regional performance"
```

### Trust the Process

- Let design finish before coding
- Review checkpoints carefully
- Ask questions when something's unclear
- Provide feedback early and often

---

## Customization

### Adding Your Own Conventions

Edit agent `SKILL.md` files to include:
- Your coding standards
- Preferred libraries/frameworks
- Company design patterns
- Deployment targets
- Testing requirements

### Adding New Agents

Create new agents in `agents/[name]/SKILL.md` following the same format:
- YAML frontmatter with name and description
- Clear responsibilities
- Specific workflows
- Handoff formats

### Project-Specific Additions

For individual projects, you can provide:
- Additional reference files
- Existing code to follow
- API documentation
- Brand guidelines

---

## Troubleshooting

**Agent seems confused:**
Re-state which agent should be active and what phase you're in.

**Output doesn't match expectations:**
Review the project brief - missing context usually causes issues.

**Design is generic:**
Provide more specific aesthetic direction and reference sites.

**Integration issues:**
Check handoff documents between agents for missing context.

---

## Agent Quick Reference

| Agent | Skill File | Use For |
|-------|------------|---------|
| Orchestrator | `orchestrator/SKILL.md` | Full project coordination |
| UI Designer | `agents/ui-designer/SKILL.md` | Design systems, mockups |
| Frontend | `agents/frontend/SKILL.md` | React, CSS, components |
| Backend | `agents/backend/SKILL.md` | APIs, auth, server logic |
| Database | `agents/database/SKILL.md` | Data models, queries |
| Testing | `agents/testing/SKILL.md` | Unit, E2E, accessibility |
| DevOps | `agents/devops/SKILL.md` | CI/CD, deployment |

---

Built for exceptional web development. Happy building!
