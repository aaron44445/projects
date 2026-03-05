# Goal Tracker — Design Specification

## Overview

A single-database goal management system that connects quarterly, monthly, and weekly goals through Notion relations and rollups. Users set big quarterly goals, break them into monthly milestones, then into weekly actions. Progress flows upward automatically — completing weekly goals updates monthly progress, which updates quarterly progress.

**For:** Anyone who sets goals but loses track of them. Especially useful for people who want the structure of OKRs without the corporate overhead.

---

## Database Schema

### Main Database: "Goals"

| Property Name | Type | Details |
|--------------|------|---------|
| Goal | Title | The goal name/description. This is the default title property. |
| Level | Select | Options: `Quarterly`, `Monthly`, `Weekly` |
| Quarter | Select | Options: `Q1 2025`, `Q2 2025`, `Q3 2025`, `Q4 2025`, `Q1 2026`, `Q2 2026`, `Q3 2026`, `Q4 2026` |
| Month | Select | Options: `January`, `February`, `March`, `April`, `May`, `June`, `July`, `August`, `September`, `October`, `November`, `December` |
| Status | Select | Options: `Not Started` (gray), `In Progress` (blue), `Done` (green) |
| Progress | Number | Format: Percent. Manually entered for weekly goals (0 or 100). For monthly/quarterly, use the rollup-based formula below. |
| Category | Select | Options: `Health` (green), `Career` (blue), `Finance` (yellow), `Personal` (purple), `Learning` (orange) |
| Deadline | Date | Target completion date for this goal. |
| Notes | Text | Freeform text for context, action items, blockers, etc. |
| Parent Goal | Relation | Self-relation to the same "Goals" database. Links a weekly goal to its parent monthly goal, or a monthly goal to its parent quarterly goal. **Relation settings:** Relates to "Goals" database. Show on both sides. Name the reverse relation "Sub-Goals". |
| Sub-Goals | Relation | Automatically created reverse relation from "Parent Goal". Shows all child goals linked to this goal. |
| Sub-Goal Progress | Rollup | **Relation:** Sub-Goals. **Property:** Progress. **Calculate:** Average. This gives the average progress of all child goals. |
| Calculated Progress | Formula | See formula below. Uses Sub-Goal Progress for parent goals, or manual Progress for leaf goals. |

### Formula: Calculated Progress

This formula checks if a goal has sub-goals (via the rollup). If the rollup has a value, it uses that average. Otherwise, it falls back to the manual Progress property.

```
if(empty(prop("Sub-Goal Progress")), prop("Progress"), prop("Sub-Goal Progress"))
```

**How it works:**
- **Weekly goals** (leaf nodes): User manually sets Progress to 0% or 100% (or anything in between).
- **Monthly goals**: Their Sub-Goal Progress rollup averages all linked weekly goals' Progress values.
- **Quarterly goals**: Their Sub-Goal Progress rollup averages all linked monthly goals' Calculated Progress values.

> **Important:** The rollup on quarterly goals should reference the "Calculated Progress" formula property of linked monthly goals if possible. However, Notion does not allow rollups on formula properties directly. **Workaround:** For quarterly goals, users should either (a) manually update the Progress field to match, or (b) accept that the rollup will average the manual Progress field of monthly goals. Recommend option (a) with a note in the template instructions explaining this.

**Revised simpler approach (recommended for build):**

Since Notion rollups cannot aggregate formula fields, use this strategy:
1. Weekly goals: Set Progress manually (0% or 100%).
2. Monthly goals: The "Sub-Goal Progress" rollup averages child weekly goals' "Progress" field. Copy this value into the "Progress" field manually, or instruct users to reference the rollup.
3. Quarterly goals: The "Sub-Goal Progress" rollup averages child monthly goals' "Progress" field.

The formula becomes:

```
if(empty(prop("Sub-Goals")), prop("Progress"), prop("Sub-Goal Progress"))
```

This checks if the goal has any sub-goals. If yes, show the rollup average. If no (it's a leaf goal), show the manual progress.

---

## Views

### 1. Board by Status

| Setting | Value |
|---------|-------|
| **View name** | Status Board |
| **View type** | Board |
| **Group by** | Status |
| **Sub-group** | None |
| **Filter** | None (show all goals) |
| **Sort** | Deadline — Ascending |
| **Visible properties** | Level, Category, Progress, Deadline |
| **Card preview** | None |
| **Card size** | Small |

**Column order:** Not Started, In Progress, Done

### 2. Quarterly Goals Table

| Setting | Value |
|---------|-------|
| **View name** | Quarterly View |
| **View type** | Table |
| **Filter** | Level = `Quarterly` |
| **Sort** | Quarter — Ascending, then Category — Ascending |
| **Visible properties** | Goal, Quarter, Status, Progress, Sub-Goal Progress, Category, Deadline |
| **Property widths** | Goal: 250px, others: auto |

### 3. Monthly Goals Table

| Setting | Value |
|---------|-------|
| **View name** | Monthly View |
| **View type** | Table |
| **Filter** | Level = `Monthly` |
| **Sort** | Month — Ascending, then Category — Ascending |
| **Visible properties** | Goal, Month, Quarter, Status, Progress, Sub-Goal Progress, Category, Parent Goal, Deadline |

### 4. Weekly Goals Table

| Setting | Value |
|---------|-------|
| **View name** | Weekly View |
| **View type** | Table |
| **Filter** | Level = `Weekly` |
| **Sort** | Deadline — Ascending |
| **Visible properties** | Goal, Status, Progress, Category, Parent Goal, Deadline |

### 5. Timeline View

| Setting | Value |
|---------|-------|
| **View name** | Timeline |
| **View type** | Timeline |
| **Timeline by** | Deadline (start and end same property, or use a separate Start Date if added) |
| **Filter** | Level is not `Weekly` (show only quarterly and monthly) |
| **Sort** | None |
| **Visible properties** | Goal, Status, Category, Progress |
| **Table on left** | Show, with Goal and Status columns |

### 6. By Category

| Setting | Value |
|---------|-------|
| **View name** | By Category |
| **View type** | Board |
| **Group by** | Category |
| **Filter** | Level = `Quarterly` |
| **Sort** | Status — Ascending |
| **Visible properties** | Goal, Status, Progress, Deadline |

---

## Template Buttons

### 1. "+ Quarterly Goal"

| Setting | Value |
|---------|-------|
| **Button name** | + Quarterly Goal |
| **Action** | Add new page to "Goals" database |
| **Pre-filled properties** | Level: `Quarterly`, Status: `Not Started`, Progress: `0` |

### 2. "+ Monthly Goal"

| Setting | Value |
|---------|-------|
| **Button name** | + Monthly Goal |
| **Action** | Add new page to "Goals" database |
| **Pre-filled properties** | Level: `Monthly`, Status: `Not Started`, Progress: `0` |

### 3. "+ Weekly Goal"

| Setting | Value |
|---------|-------|
| **Button name** | + Weekly Goal |
| **Action** | Add new page to "Goals" database |
| **Pre-filled properties** | Level: `Weekly`, Status: `Not Started`, Progress: `0` |

---

## Page Layout

The Goal Tracker is a single Notion page with the following structure from top to bottom:

### Row 1: Header
- **Icon:** Target emoji (direct hit / bullseye)
- **Cover:** A minimal gradient cover (any of Notion's built-in solid color covers — use the blue/purple gradient)
- **Title:** "Goal Tracker"

### Row 2: Instructions Callout
- **Block type:** Callout (light bulb emoji)
- **Content:**
  ```
  How to use this tracker:
  1. Set 2-3 Quarterly Goals for the quarter ahead.
  2. Break each into 2-4 Monthly Goals and link them with the "Parent Goal" relation.
  3. Break each monthly goal into Weekly Goals.
  4. Mark weekly goals as Done and update Progress to 100% — your monthly and quarterly progress updates automatically.
  ```

### Row 3: Quick-Add Buttons
- **Layout:** 3 columns, equal width
- Column 1: `+ Quarterly Goal` button
- Column 2: `+ Monthly Goal` button
- Column 3: `+ Weekly Goal` button

### Row 4: Divider
- Horizontal divider line

### Row 5: Main Database
- **Block type:** Linked view of "Goals" database (or the inline database itself)
- **Default view:** Status Board
- **All views available via tabs:** Status Board, Quarterly View, Monthly View, Weekly View, Timeline, By Category

---

## Example Data

### Quarterly Goals

| Goal | Level | Quarter | Month | Status | Progress | Category | Deadline |
|------|-------|---------|-------|--------|----------|----------|----------|
| Get to 12% body fat | Quarterly | Q1 2025 | — | In Progress | 33% | Health | Mar 31, 2025 |
| Launch freelance portfolio site | Quarterly | Q1 2025 | — | In Progress | 50% | Career | Mar 31, 2025 |
| Save $3,000 emergency fund | Quarterly | Q1 2025 | — | Not Started | 0% | Finance | Mar 31, 2025 |

### Monthly Goals (linked to quarterly via Parent Goal)

| Goal | Level | Quarter | Month | Status | Progress | Category | Parent Goal | Deadline |
|------|-------|---------|-------|--------|----------|----------|-------------|----------|
| Lose 4 lbs | Monthly | Q1 2025 | January | Done | 100% | Health | Get to 12% body fat | Jan 31, 2025 |
| Lose 4 lbs | Monthly | Q1 2025 | February | In Progress | 50% | Health | Get to 12% body fat | Feb 28, 2025 |
| Design portfolio homepage | Monthly | Q1 2025 | January | Done | 100% | Career | Launch freelance portfolio site | Jan 31, 2025 |
| Build and deploy portfolio | Monthly | Q1 2025 | February | In Progress | 50% | Career | Launch freelance portfolio site | Feb 28, 2025 |

### Weekly Goals (linked to monthly via Parent Goal)

| Goal | Level | Status | Progress | Category | Parent Goal | Deadline |
|------|-------|--------|----------|----------|-------------|----------|
| Work out 4x this week | Weekly | Done | 100% | Health | Lose 4 lbs (Feb) | Feb 7, 2025 |
| Meal prep Sunday | Weekly | Done | 100% | Health | Lose 4 lbs (Feb) | Feb 7, 2025 |
| Work out 4x this week | Weekly | In Progress | 0% | Health | Lose 4 lbs (Feb) | Feb 14, 2025 |
| Finish About page design | Weekly | Done | 100% | Career | Build and deploy portfolio | Feb 7, 2025 |
| Set up hosting and deploy | Weekly | Not Started | 0% | Career | Build and deploy portfolio | Feb 14, 2025 |
