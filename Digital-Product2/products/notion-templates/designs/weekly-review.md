# Weekly Review — Design Specification

## Overview

A structured weekly reflection system where users answer the same set of prompts every week and rate their energy and productivity on a 1-10 scale. Over time, this builds a personal dataset of wins, challenges, lessons, and scores that reveals patterns in productivity and well-being.

**For:** Anyone who wants to reflect consistently but never knows what to write. The prompts remove friction and the scoring system makes it easy to spot trends.

---

## Database Schema

### Main Database: "Weekly Reviews"

| Property Name | Type | Details |
|--------------|------|---------|
| Week | Title | Readable label, e.g., "Week of Feb 10, 2025". This is the default title property. |
| Week of | Date | The Monday of the week being reviewed. Format: date only. |
| Win 1 | Text | First major win of the week. |
| Win 2 | Text | Second win. |
| Win 3 | Text | Third win. |
| Biggest Challenge | Text | The hardest thing you dealt with this week. |
| Lessons Learned | Text | What did you learn? What would you do differently? |
| Energy Score | Number | Rate your average energy this week from 1 to 10. Format: Number, no decimal. |
| Productivity Score | Number | Rate your overall productivity from 1 to 10. Format: Number, no decimal. |
| Next Week Priority 1 | Text | Most important focus for next week. |
| Next Week Priority 2 | Text | Second priority for next week. |
| Next Week Priority 3 | Text | Third priority for next week. |
| Gratitude | Text | What are you grateful for this week? |
| Highlight | Text | If you had to pick ONE moment from this week, what was it? |
| Overall Mood | Select | Options: `Energized` (green), `Steady` (blue), `Tired` (yellow), `Stressed` (orange), `Burned Out` (red) |
| Combined Score | Formula | See formula below. |
| Month | Formula | See formula below. Extracts the month for grouping. |
| Quarter | Formula | See formula below. Extracts the quarter for grouping. |

### Formula: Combined Score

Averages Energy Score and Productivity Score for a single metric:

```
if(and(prop("Energy Score") > 0, prop("Productivity Score") > 0), round((prop("Energy Score") + prop("Productivity Score")) / 2 * 10) / 10, 0)
```

**Returns:** A number from 0 to 10 with one decimal place (e.g., 7.5). The `round(...* 10) / 10` pattern rounds to 1 decimal.

### Formula: Month

Extracts the month name from the "Week of" date:

```
formatDate(prop("Week of"), "MMMM YYYY")
```

**Returns:** A string like "February 2025". Used for grouping in the monthly summary view.

### Formula: Quarter

Determines the quarter from the "Week of" date:

```
if(month(prop("Week of")) < 3, "Q1", if(month(prop("Week of")) < 6, "Q2", if(month(prop("Week of")) < 9, "Q3", "Q4"))) + " " + formatDate(prop("Week of"), "YYYY")
```

**Returns:** A string like "Q1 2025".

> **Note on Notion's `month()` function:** In Notion, `month()` returns 0 for January, 1 for February, etc. So the correct thresholds are:
> - Q1: months 0, 1, 2 (Jan, Feb, Mar)
> - Q2: months 3, 4, 5 (Apr, May, Jun)
> - Q3: months 6, 7, 8 (Jul, Aug, Sep)
> - Q4: months 9, 10, 11 (Oct, Nov, Dec)

The formula above is correct because `month()` returns 0-indexed months.

---

## Views

### 1. Weekly Cards (Default View)

| Setting | Value |
|---------|-------|
| **View name** | Weekly Cards |
| **View type** | Gallery |
| **Filter** | None (show all) |
| **Sort** | Week of — Descending (newest first) |
| **Card preview** | Page content |
| **Card size** | Medium |
| **Visible properties** | Week, Week of, Energy Score, Productivity Score, Combined Score, Overall Mood |
| **Fit image** | Off |

**Result:** A scrollable gallery where each card is one week's review. The most recent week appears first. Users can click into any card to read the full reflection.

### 2. All Weeks Table

| Setting | Value |
|---------|-------|
| **View name** | All Weeks |
| **View type** | Table |
| **Filter** | None |
| **Sort** | Week of — Descending |
| **Visible properties** | Week, Week of, Win 1, Biggest Challenge, Energy Score, Productivity Score, Combined Score, Overall Mood |

**Result:** A spreadsheet-style view of all weeks for quick scanning.

### 3. Monthly Summary

| Setting | Value |
|---------|-------|
| **View name** | Monthly Summary |
| **View type** | Table |
| **Filter** | None |
| **Sort** | Week of — Descending |
| **Group by** | Month (formula property) |
| **Visible properties** | Week, Energy Score, Productivity Score, Combined Score, Overall Mood, Highlight |

**Result:** Weeks grouped by month. When collapsed, you can see month-by-month progression.

### 4. Quarterly Summary

| Setting | Value |
|---------|-------|
| **View name** | Quarterly Summary |
| **View type** | Table |
| **Filter** | None |
| **Sort** | Week of — Descending |
| **Group by** | Quarter (formula property) |
| **Visible properties** | Week, Energy Score, Productivity Score, Combined Score, Overall Mood |

### 5. Score Trends

| Setting | Value |
|---------|-------|
| **View name** | Score Trends |
| **View type** | Table |
| **Filter** | None |
| **Sort** | Week of — Ascending (oldest first to see progression) |
| **Visible properties** | Week, Week of, Energy Score, Productivity Score, Combined Score |

**Result:** Chronological view focused only on scores. Makes it easy to spot upward/downward trends over time.

### 6. By Mood

| Setting | Value |
|---------|-------|
| **View name** | By Mood |
| **View type** | Board |
| **Group by** | Overall Mood |
| **Filter** | None |
| **Sort** | Week of — Descending |
| **Visible properties** | Week, Combined Score, Highlight |
| **Card size** | Small |

**Column order:** Energized, Steady, Tired, Stressed, Burned Out

---

## Template Buttons

### 1. "New Weekly Review"

| Setting | Value |
|---------|-------|
| **Button name** | New Weekly Review |
| **Action** | Add new page to "Weekly Reviews" database |
| **Pre-filled properties** | Week of: today (user adjusts to Monday), Energy Score: 0, Productivity Score: 0 |
| **Page content template** | See below |

**Pre-filled page body (inside the new review page):**

```
# Weekly Review

## Top 3 Wins
What went well this week? What are you proud of?

1.
2.
3.

---

## Biggest Challenge
What was the hardest thing you dealt with? What made it hard?



---

## Lessons Learned
What would you do differently? What surprised you?



---

## Energy & Productivity
Rate your week on a scale of 1-10.
- **Energy:** (update the Energy Score property above)
- **Productivity:** (update the Productivity Score property above)

---

## Gratitude
What are you grateful for this week?



---

## Highlight of the Week
If you could only remember one moment from this week, what would it be?



---

## Next Week's Priorities
What are the top 3 things you want to focus on next week?

1.
2.
3.
```

> **Build note:** The page body serves as a guided journal. Users fill in the prompts within the page, then copy key answers into the database properties (Win 1, Win 2, Win 3, etc.) for structured tracking. Alternatively, users can skip the page body and fill in properties directly — both workflows work.

---

## Page Layout

### Row 1: Header
- **Icon:** Mirror/reflection emoji (or clipboard emoji)
- **Cover:** Notion built-in gradient cover (calm blue or purple gradient)
- **Title:** "Weekly Review"

### Row 2: Purpose Callout
- **Block type:** Callout (brain emoji)
- **Content:**
  ```
  Every week, take 15-20 minutes to reflect on what happened, what you learned, and what's next. Consistency matters more than depth — even a quick review is better than none.
  ```

### Row 3: Quick Stats (Optional — Advanced)
- **Block type:** Callout (bar chart emoji)
- **Content:**
  ```
  Check the "Score Trends" view to see your energy and productivity patterns over time. Look for:
  - Weeks where both scores are low — what happened?
  - Weeks where both are high — what made them great?
  - The gap between energy and productivity — are you working hard but burning out?
  ```

### Row 4: Button Row
- **Layout:** Single column, centered
- `New Weekly Review` button

### Row 5: Divider
- Horizontal divider line

### Row 6: Main Database
- **Block type:** Inline database "Weekly Reviews"
- **Default view:** Weekly Cards (Gallery)
- **All views as tabs:** Weekly Cards, All Weeks, Monthly Summary, Quarterly Summary, Score Trends, By Mood

---

## Example Data

### Entry 1: Week of Feb 3, 2025

| Property | Value |
|----------|-------|
| Week | Week of Feb 3, 2025 |
| Week of | Feb 3, 2025 |
| Win 1 | Shipped the landing page redesign on Wednesday |
| Win 2 | Ran 3x this week after a month off |
| Win 3 | Had a tough conversation with a client and it went well |
| Biggest Challenge | Scope creep on the client project — kept saying yes to "one more thing" |
| Lessons Learned | Need to set clearer boundaries in project kickoff. Also realized I do my best writing before 10am. |
| Energy Score | 7 |
| Productivity Score | 8 |
| Next Week Priority 1 | Finish client project revisions |
| Next Week Priority 2 | Run 4x this week |
| Next Week Priority 3 | Start outlining the new course |
| Gratitude | My co-working space crew — good conversations this week |
| Highlight | The moment I clicked "publish" on the redesign and felt that rush |
| Overall Mood | Energized |
| Combined Score | 7.5 |
| Month | February 2025 |
| Quarter | Q1 2025 |

### Entry 2: Week of Feb 10, 2025

| Property | Value |
|----------|-------|
| Week | Week of Feb 10, 2025 |
| Week of | Feb 10, 2025 |
| Win 1 | Client signed off on revisions — project officially done |
| Win 2 | Got 4 runs in as planned |
| Win 3 | Started the course outline and it's actually exciting |
| Biggest Challenge | Wednesday was a total write-off — couldn't focus at all |
| Lessons Learned | Bad sleep on Tuesday night wrecked Wednesday. Sleep is non-negotiable. Need a stricter wind-down routine. |
| Energy Score | 6 |
| Productivity Score | 7 |
| Next Week Priority 1 | Write course module 1 draft |
| Next Week Priority 2 | Set up automated invoicing |
| Next Week Priority 3 | Plan February content calendar |
| Gratitude | Good health — didn't get sick when everyone around me did |
| Highlight | The run on Saturday morning — cold air, sunrise, felt alive |
| Overall Mood | Steady |
| Combined Score | 6.5 |
| Month | February 2025 |
| Quarter | Q1 2025 |

### Entry 3: Week of Feb 17, 2025

| Property | Value |
|----------|-------|
| Week | Week of Feb 17, 2025 |
| Week of | Feb 17, 2025 |
| Win 1 | Wrote 3,000 words of course module 1 |
| Win 2 | Set up automated invoicing — no more manual follow-ups |
| Win 3 | Cooked all meals at home and saved ~$80 |
| Biggest Challenge | Felt isolated working from home all week. No social interaction for 3 days straight. |
| Lessons Learned | Need to schedule at least 2 "people" activities per week — co-working, gym class, coffee with a friend. Isolation tanks my mood. |
| Energy Score | 5 |
| Productivity Score | 8 |
| Next Week Priority 1 | Finish course module 1 |
| Next Week Priority 2 | Go to co-working space 3x |
| Next Week Priority 3 | Start February content calendar |
| Gratitude | The ability to work for myself, even when it's lonely |
| Highlight | Finishing the invoice automation — small win, huge time save |
| Overall Mood | Tired |
| Combined Score | 6.5 |
| Month | February 2025 |
| Quarter | Q1 2025 |

### Entry 4: Week of Jan 27, 2025

| Property | Value |
|----------|-------|
| Week | Week of Jan 27, 2025 |
| Week of | Jan 27, 2025 |
| Win 1 | Signed a new client for the landing page project |
| Win 2 | Hit 30-day meditation streak |
| Win 3 | Filed taxes early |
| Biggest Challenge | Juggling the new client onboarding with existing commitments |
| Lessons Learned | Calendar blocking is essential when taking on new work. Also, filing taxes early removed a huge mental load. |
| Energy Score | 8 |
| Productivity Score | 7 |
| Next Week Priority 1 | Start the landing page redesign |
| Next Week Priority 2 | Continue running streak |
| Next Week Priority 3 | Plan February goals |
| Gratitude | New clients who trust my work enough to pay upfront |
| Highlight | The look on the client's face during the kickoff call — they're excited |
| Overall Mood | Energized |
| Combined Score | 7.5 |
| Month | January 2025 |
| Quarter | Q1 2025 |
