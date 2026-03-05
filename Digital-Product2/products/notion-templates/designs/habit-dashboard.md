# Habit Dashboard — Design Specification

## Overview

A weekly habit tracking system that lets users check off daily habits and automatically calculates completion scores and streaks. Each row is one habit for one week, with a checkbox for every day. The template surfaces which habits are sticking and which are falling off through calculated scores and visual card layouts.

**For:** People building daily routines who want a simple, visual way to track consistency without a separate app.

---

## Database Schema

### Main Database: "Habits"

| Property Name | Type | Details |
|--------------|------|---------|
| Habit | Title | The habit name (e.g., "Meditate 10 min"). This is the default title property. |
| Week of | Date | The Monday of the tracking week. Format: date only, no end date. |
| Mon | Checkbox | Did you complete this habit on Monday? |
| Tue | Checkbox | Did you complete this habit on Tuesday? |
| Wed | Checkbox | Did you complete this habit on Wednesday? |
| Thu | Checkbox | Did you complete this habit on Thursday? |
| Fri | Checkbox | Did you complete this habit on Friday? |
| Sat | Checkbox | Did you complete this habit on Saturday? |
| Sun | Checkbox | Did you complete this habit on Sunday? |
| Days Completed | Formula | Counts how many day-checkboxes are checked. See formula below. |
| Score | Formula | Completion percentage for the week. See formula below. |
| Streak | Number | Current streak in weeks. Manually updated (see streak tracking notes below). Format: Number, no decimal. |
| Category | Select | Options: `Health` (green), `Mindset` (purple), `Productivity` (blue), `Learning` (orange), `Self-Care` (pink) |
| Target Days | Number | How many days per week this habit should be done (e.g., 7 for daily, 5 for weekdays). Default: 7. Format: Number, no decimal. |
| Notes | Text | Optional notes for the week (e.g., "Skipped Thursday due to travel"). |

### Formula: Days Completed

Counts the number of checked day-checkboxes:

```
(if(prop("Mon"), 1, 0) + if(prop("Tue"), 1, 0) + if(prop("Wed"), 1, 0) + if(prop("Thu"), 1, 0) + if(prop("Fri"), 1, 0) + if(prop("Sat"), 1, 0) + if(prop("Sun"), 1, 0))
```

**Returns:** A number from 0 to 7.

### Formula: Score

Calculates completion percentage based on Target Days:

```
if(prop("Target Days") > 0, round(prop("Days Completed") / prop("Target Days") * 100), 0)
```

**Returns:** A number representing percentage (e.g., 86 for 6/7 days). Displayed as a plain number — users can interpret it as a percentage.

> **Note:** Notion formulas return numbers, not formatted percentages. The value "86" means 86%. You could alternatively use: `format(round(prop("Days Completed") / prop("Target Days") * 100)) + "%"` to return a string like "86%", but this makes sorting by score work on text rather than numbers. Recommend keeping it as a number.

### Streak Tracking Notes

Notion does not have a native way to automatically calculate streaks across multiple rows (each row is an independent entry). Two approaches:

**Approach A — Manual Streak (Recommended for simplicity):**
- The "Streak" property is a plain number.
- At the end of each week, if Score >= Target Days, increment Streak by 1.
- If Score < Target Days, reset Streak to 0.
- Include these instructions in the template callout.

**Approach B — Formula-Assisted Streak (Advanced):**
- Add a "Previous Week" relation property that links to the same database (self-relation).
- Add a "Previous Streak" rollup on that relation, reading the "Streak" property.
- Use a formula:
  ```
  if(prop("Days Completed") >= prop("Target Days"), prop("Previous Streak") + 1, 0)
  ```
- This requires users to link each week's entry to the previous week's entry for the same habit.
- More overhead but automates streak counting.

**Build recommendation:** Use Approach A (manual) for the shipped template. It's simpler and less error-prone. Mention Approach B in the template instructions as an "advanced" option.

---

## Views

### 1. This Week (Default View)

| Setting | Value |
|---------|-------|
| **View name** | This Week |
| **View type** | Gallery |
| **Filter** | Week of = this week (relative date filter: "Week of" is within "This week") |
| **Sort** | Category — Ascending |
| **Card preview** | None (page content) |
| **Card size** | Medium |
| **Visible properties** | Habit, Mon, Tue, Wed, Thu, Fri, Sat, Sun, Days Completed, Score |
| **Fit image** | Off |

**Result:** One card per habit showing the week's checkboxes and score. Users check off days directly from the card.

### 2. Month View

| Setting | Value |
|---------|-------|
| **View name** | Month View |
| **View type** | Table |
| **Filter** | Week of is within "This month" (relative date filter) |
| **Sort** | Habit — Ascending, then Week of — Ascending |
| **Visible properties** | Habit, Week of, Mon, Tue, Wed, Thu, Fri, Sat, Sun, Days Completed, Score, Streak |

**Result:** A table showing all habits for all weeks this month. Good for spotting weekly patterns.

### 3. Stats View

| Setting | Value |
|---------|-------|
| **View name** | Stats |
| **View type** | Table |
| **Filter** | Week of is within "Past month" (last 30 days) |
| **Sort** | Streak — Descending, then Score — Descending |
| **Visible properties** | Habit, Week of, Score, Streak, Days Completed, Target Days, Category |

**Result:** Shows which habits have the longest streaks and highest scores. Good for weekly review.

### 4. By Category

| Setting | Value |
|---------|-------|
| **View name** | By Category |
| **View type** | Board |
| **Group by** | Category |
| **Filter** | Week of is within "This week" |
| **Sort** | Score — Descending |
| **Visible properties** | Habit, Score, Days Completed |
| **Card size** | Small |

### 5. All Habits

| Setting | Value |
|---------|-------|
| **View name** | All Habits |
| **View type** | Table |
| **Filter** | None |
| **Sort** | Week of — Descending, then Habit — Ascending |
| **Visible properties** | Habit, Week of, Days Completed, Score, Streak, Category |

**Result:** Historical archive of all habit tracking data.

---

## Template Buttons

### 1. "+ New Week"

| Setting | Value |
|---------|-------|
| **Button name** | + New Week |
| **Action** | Add new page to "Habits" database |
| **Pre-filled properties** | Week of: today's date (user adjusts to Monday), all checkboxes unchecked, Streak: `0` |

**Usage note:** Ideally, the user creates one entry per habit per week. The button creates a single entry — user duplicates it and changes the habit name for each habit they're tracking.

### 2. "Setup: Create This Week's Habits"

This is a multi-action button (Notion supports buttons that create multiple pages):

| Setting | Value |
|---------|-------|
| **Button name** | Start New Week |
| **Actions** | Create 5 new pages in "Habits" database (one per example habit). Each has: Week of set to a Monday date, all checkboxes unchecked. |
| **Pre-filled per entry** | Habit names from the user's habit list (in the example data: "Meditate 10 min", "Exercise 30 min", "Read 20 pages", "No social media before noon", "Journal before bed") |

> **Build note:** Notion template buttons can create multiple database entries. Set up 5 actions on one button, each creating a page with a different habit name and the same Week of date. Users can edit the button to add/remove habits from their weekly set.

---

## Page Layout

### Row 1: Header
- **Icon:** Check mark emoji (white heavy check mark)
- **Cover:** Notion built-in gradient cover (green/teal gradient)
- **Title:** "Habit Dashboard"

### Row 2: Stats Callout
- **Block type:** Callout (fire emoji)
- **Content:**
  ```
  Quick Stats: Check the "Stats" view to see your longest streaks and highest scores.
  Tip: Update your Streak count at the end of each week. If you hit your target days, add 1 to last week's streak. If you missed it, reset to 0.
  ```

### Row 3: Instructions Toggle
- **Block type:** Toggle heading (H3)
- **Toggle title:** "How to Use This Dashboard"
- **Toggle content:**
  ```
  1. At the start of each week, click "Start New Week" to create entries for all your habits.
  2. Each day, check off the habits you completed.
  3. At the end of the week, review your scores in the "Stats" view.
  4. Update the Streak count: hit your target = last week's streak + 1. Missed it = reset to 0.
  5. To add a new habit: edit the "Start New Week" button and add another action, or manually create entries.
  6. To remove a habit: edit the button and delete that action.
  ```

### Row 4: Buttons Row
- **Layout:** 2 columns
- Column 1: `+ New Week` button (single entry)
- Column 2: `Start New Week` button (creates all habits)

### Row 5: Divider
- Horizontal divider line

### Row 6: Main Database
- **Block type:** Inline database "Habits"
- **Default view:** This Week (Gallery)
- **All views as tabs:** This Week, Month View, Stats, By Category, All Habits

---

## Example Data

### Week of Feb 3, 2025

| Habit | Week of | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Days Completed | Score | Streak | Category | Target Days |
|-------|---------|-----|-----|-----|-----|-----|-----|-----|----------------|-------|--------|----------|-------------|
| Meditate 10 min | Feb 3, 2025 | Yes | Yes | Yes | No | Yes | Yes | Yes | 6 | 86 | 4 | Mindset | 7 |
| Exercise 30 min | Feb 3, 2025 | Yes | No | Yes | Yes | No | Yes | No | 4 | 80 | 2 | Health | 5 |
| Read 20 pages | Feb 3, 2025 | Yes | Yes | Yes | Yes | Yes | No | Yes | 6 | 86 | 6 | Learning | 7 |
| No social media before noon | Feb 3, 2025 | Yes | Yes | No | Yes | Yes | Yes | Yes | 6 | 86 | 3 | Productivity | 7 |
| Journal before bed | Feb 3, 2025 | No | Yes | Yes | Yes | Yes | No | No | 4 | 57 | 0 | Mindset | 7 |

### Week of Feb 10, 2025

| Habit | Week of | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Days Completed | Score | Streak | Category | Target Days |
|-------|---------|-----|-----|-----|-----|-----|-----|-----|----------------|-------|--------|----------|-------------|
| Meditate 10 min | Feb 10, 2025 | Yes | Yes | Yes | Yes | Yes | Yes | Yes | 7 | 100 | 5 | Mindset | 7 |
| Exercise 30 min | Feb 10, 2025 | Yes | Yes | No | Yes | Yes | Yes | No | 5 | 100 | 3 | Health | 5 |
| Read 20 pages | Feb 10, 2025 | Yes | Yes | Yes | Yes | No | Yes | Yes | 6 | 86 | 7 | Learning | 7 |
| No social media before noon | Feb 10, 2025 | Yes | Yes | Yes | Yes | Yes | No | Yes | 6 | 86 | 4 | Productivity | 7 |
| Journal before bed | Feb 10, 2025 | Yes | Yes | Yes | Yes | Yes | Yes | No | 6 | 86 | 1 | Mindset | 7 |
