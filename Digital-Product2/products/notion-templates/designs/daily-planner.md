# Daily Planner — Design Specification

## Overview

A time-blocked daily planning system that helps users plan their day around energy levels and priorities. Tasks are organized into Morning, Afternoon, and Evening blocks with a P1/P2/P3 priority system. Includes a linked Evening Reflection section for end-of-day review.

**For:** Anyone who wants more structure in their day than a simple to-do list, especially people who want to match their hardest tasks to their highest energy windows.

---

## Database Schema

### Database 1: "Daily Tasks"

| Property Name | Type | Details |
|--------------|------|---------|
| Task | Title | What needs to be done. This is the default title property. |
| Date | Date | The date this task is scheduled for. Format: date only, no end date. |
| Time Block | Select | Options: `Morning` (yellow), `Afternoon` (blue), `Evening` (purple) |
| Priority | Select | Options: `P1 — Must Do` (red), `P2 — Should Do` (orange), `P3 — Nice to Do` (gray) |
| Status | Select | Options: `Todo` (gray), `Doing` (blue), `Done` (green), `Moved` (yellow) |
| Energy Level | Select | Options: `High Energy` (red), `Medium Energy` (orange), `Low Energy` (green) |
| Estimated Time | Select | Options: `15 min`, `30 min`, `1 hour`, `2 hours`, `3+ hours` |
| Category | Select | Options: `Work` (blue), `Personal` (purple), `Health` (green), `Admin` (gray), `Creative` (orange) |
| Notes | Text | Additional context, links, subtasks. |
| Completed | Checkbox | Quick way to mark done (alternative to changing Status). |
| Reflection Link | Relation | Links to "Daily Reflections" database. Connects tasks to the day's reflection entry. |

### Database 2: "Daily Reflections"

| Property Name | Type | Details |
|--------------|------|---------|
| Date | Title | The date in readable format (e.g., "Feb 10, 2025 — Monday"). This is the default title property. |
| Reflection Date | Date | The actual date (for filtering/sorting). |
| Energy Today | Select | Options: `High` (green), `Medium` (yellow), `Low` (red) |
| Top Win | Text | What went best today? |
| What Didn't Work | Text | What would you change about today? |
| Tomorrow's Priority | Text | The single most important thing for tomorrow. |
| Mood | Select | Options: `Great` (green), `Good` (blue), `Okay` (yellow), `Rough` (red) |
| Gratitude | Text | One thing you're grateful for today. |
| Tasks Completed | Rollup | **Relation:** (reverse of Reflection Link from Daily Tasks). **Property:** Completed. **Calculate:** Count checked. Shows how many tasks were completed. |
| Total Tasks | Rollup | **Relation:** (reverse of Reflection Link from Daily Tasks). **Property:** Task (title). **Calculate:** Count all. Shows total tasks planned. |
| Completion Rate | Formula | See formula below. |

### Formula: Completion Rate (Daily Reflections)

```
if(prop("Total Tasks") > 0, round(prop("Tasks Completed") / prop("Total Tasks") * 100), 0)
```

**Returns:** A number representing the percentage of planned tasks completed (e.g., 75 means 75%).

---

## Views

### Daily Tasks — Views

#### 1. Today (Default View)

| Setting | Value |
|---------|-------|
| **View name** | Today |
| **View type** | Table |
| **Filter** | Date = Today (relative date filter) |
| **Sort** | Time Block custom order (Morning, Afternoon, Evening), then Priority custom order (P1, P2, P3) |
| **Group by** | Time Block |
| **Visible properties** | Task, Priority, Status, Energy Level, Estimated Time, Category, Completed |
| **Collapsed groups** | None (all expanded) |

**Result:** Tasks grouped into Morning, Afternoon, Evening blocks, sorted by priority within each block.

> **Sort note:** Notion sorts Select properties alphabetically by default. To get the correct order (Morning > Afternoon > Evening and P1 > P2 > P3), you may need to reorder the select options in the property settings. Notion sorts by the order options appear in the dropdown, not alphabetically, when you sort by a Select property. So set the option order as:
> - Time Block: Morning, Afternoon, Evening
> - Priority: P1 — Must Do, P2 — Should Do, P3 — Nice to Do

#### 2. Status Board

| Setting | Value |
|---------|-------|
| **View name** | Status Board |
| **View type** | Board |
| **Group by** | Status |
| **Filter** | Date = Today |
| **Sort** | Priority custom order |
| **Visible properties** | Task, Time Block, Priority, Energy Level, Estimated Time |
| **Card size** | Small |

**Column order:** Todo, Doing, Done, Moved

#### 3. Calendar

| Setting | Value |
|---------|-------|
| **View name** | Calendar |
| **View type** | Calendar |
| **Date property** | Date |
| **Filter** | None (show all dates) |
| **Visible properties** | Task, Priority, Status |

#### 4. This Week

| Setting | Value |
|---------|-------|
| **View name** | This Week |
| **View type** | Table |
| **Filter** | Date is within "This week" |
| **Sort** | Date — Ascending, then Time Block custom order, then Priority custom order |
| **Group by** | Date |
| **Visible properties** | Task, Time Block, Priority, Status, Category, Completed |

#### 5. Upcoming

| Setting | Value |
|---------|-------|
| **View name** | Upcoming |
| **View type** | List |
| **Filter** | Date is on or after Today AND Status is not `Done` |
| **Sort** | Date — Ascending, then Priority custom order |
| **Visible properties** | Task, Date, Priority, Time Block, Status |

### Daily Reflections — Views

#### 1. Journal (Default)

| Setting | Value |
|---------|-------|
| **View name** | Journal |
| **View type** | Gallery |
| **Filter** | None |
| **Sort** | Reflection Date — Descending |
| **Card preview** | Page content |
| **Card size** | Medium |
| **Visible properties** | Date, Energy Today, Mood, Completion Rate |

#### 2. Reflection Table

| Setting | Value |
|---------|-------|
| **View name** | All Reflections |
| **View type** | Table |
| **Filter** | None |
| **Sort** | Reflection Date — Descending |
| **Visible properties** | Date, Reflection Date, Energy Today, Mood, Tasks Completed, Total Tasks, Completion Rate, Top Win |

---

## Template Buttons

### 1. "Plan Tomorrow"

| Setting | Value |
|---------|-------|
| **Button name** | Plan Tomorrow |
| **Actions** | Creates 6 new pages in "Daily Tasks" database with the following pre-filled values: |

**Entry 1:**
- Task: "Morning Routine"
- Date: (user sets to tomorrow)
- Time Block: Morning
- Priority: P1 — Must Do
- Status: Todo
- Energy Level: High Energy

**Entry 2:**
- Task: "Deep Work Block"
- Date: (same)
- Time Block: Morning
- Priority: P1 — Must Do
- Status: Todo
- Energy Level: High Energy
- Estimated Time: 2 hours

**Entry 3:**
- Task: "Emails + Messages"
- Date: (same)
- Time Block: Afternoon
- Priority: P2 — Should Do
- Status: Todo
- Energy Level: Medium Energy
- Estimated Time: 30 min

**Entry 4:**
- Task: "Afternoon Task"
- Date: (same)
- Time Block: Afternoon
- Priority: P2 — Should Do
- Status: Todo
- Energy Level: Medium Energy

**Entry 5:**
- Task: "Wind Down / Light Work"
- Date: (same)
- Time Block: Evening
- Priority: P3 — Nice to Do
- Status: Todo
- Energy Level: Low Energy

**Entry 6:**
- Task: "Evening Reflection"
- Date: (same)
- Time Block: Evening
- Priority: P1 — Must Do
- Status: Todo
- Energy Level: Low Energy
- Estimated Time: 15 min

> **Build note:** After creating the button, the user should edit it to customize the default tasks to match their actual daily routine. The 6 entries above are starting templates.

### 2. "Evening Reflection"

| Setting | Value |
|---------|-------|
| **Button name** | Evening Reflection |
| **Action** | Add new page to "Daily Reflections" database |
| **Pre-filled properties** | Reflection Date: today |
| **Page content template** | See below |

**Pre-filled page body (inside the new reflection page):**

```
## What went well today?
(Write your top win here)

## What didn't go as planned?
(What would you do differently?)

## One thing I'm grateful for:
(Even something small counts)

## Tomorrow's #1 priority:
(If you could only do ONE thing tomorrow, what would it be?)
```

---

## Page Layout

### Row 1: Header
- **Icon:** Calendar emoji (spiral calendar)
- **Cover:** Notion built-in solid color cover (warm yellow or light orange)
- **Title:** "Daily Planner"

### Row 2: Today's Focus Callout
- **Block type:** Callout (target emoji)
- **Content:**
  ```
  Today's Focus: What's your #1 priority today? Write it here each morning as a commitment to yourself.
  ```
- **Editable:** Yes — user replaces the text daily with their actual focus.

### Row 3: Quick Actions
- **Layout:** 2 columns
- Column 1: `Plan Tomorrow` button
- Column 2: `Evening Reflection` button

### Row 4: Divider
- Horizontal divider line

### Row 5: Heading
- **Block type:** H2 heading
- **Text:** "Today's Plan"

### Row 6: Daily Tasks Database (Linked View)
- **Block type:** Linked view of "Daily Tasks" database
- **Default view:** Today
- **All views as tabs:** Today, Status Board, This Week, Calendar, Upcoming

### Row 7: Divider
- Horizontal divider line

### Row 8: Heading
- **Block type:** H2 heading
- **Text:** "Reflections"

### Row 9: Daily Reflections Database (Linked View)
- **Block type:** Linked view of "Daily Reflections" database
- **Default view:** Journal (Gallery)
- **All views as tabs:** Journal, All Reflections

---

## Example Data

### Daily Tasks — Feb 10, 2025

| Task | Date | Time Block | Priority | Status | Energy Level | Estimated Time | Category |
|------|------|------------|----------|--------|-------------|----------------|----------|
| Morning run — 3 miles | Feb 10, 2025 | Morning | P1 — Must Do | Done | High Energy | 30 min | Health |
| Write blog post draft | Feb 10, 2025 | Morning | P1 — Must Do | Done | High Energy | 2 hours | Creative |
| Client call at 1pm | Feb 10, 2025 | Afternoon | P1 — Must Do | Done | Medium Energy | 1 hour | Work |
| Review and respond to emails | Feb 10, 2025 | Afternoon | P2 — Should Do | Done | Medium Energy | 30 min | Admin |
| Research competitors | Feb 10, 2025 | Afternoon | P2 — Should Do | Moved | Medium Energy | 1 hour | Work |
| Read 20 pages | Feb 10, 2025 | Evening | P3 — Nice to Do | Todo | Low Energy | 30 min | Personal |
| Evening Reflection | Feb 10, 2025 | Evening | P1 — Must Do | Done | Low Energy | 15 min | Personal |

### Daily Tasks — Feb 11, 2025

| Task | Date | Time Block | Priority | Status | Energy Level | Estimated Time | Category |
|------|------|------------|----------|--------|-------------|----------------|----------|
| Morning routine + gym | Feb 11, 2025 | Morning | P1 — Must Do | Todo | High Energy | 1 hour | Health |
| Research competitors (moved from yesterday) | Feb 11, 2025 | Morning | P1 — Must Do | Todo | High Energy | 1 hour | Work |
| Edit blog post | Feb 11, 2025 | Afternoon | P2 — Should Do | Todo | Medium Energy | 1 hour | Creative |
| Grocery shopping | Feb 11, 2025 | Evening | P3 — Nice to Do | Todo | Low Energy | 1 hour | Personal |

### Daily Reflections

| Date | Reflection Date | Energy Today | Top Win | What Didn't Work | Tomorrow's Priority | Mood | Gratitude | Completion Rate |
|------|----------------|-------------|---------|-------------------|--------------------|----|-----------|----------------|
| Feb 10, 2025 — Monday | Feb 10, 2025 | Medium | Finished the blog draft in one sitting | Didn't get to competitor research — meeting ran long | Finish competitor research first thing | Good | Had a great morning run in the cold air | 71 |
| Feb 9, 2025 — Sunday | Feb 9, 2025 | High | Full rest day, recharged completely | Spent too long on social media in the afternoon | Write blog post draft | Great | Cooked a new recipe and it turned out amazing | 100 |
