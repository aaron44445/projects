# Sigil Progress Visual — Design Spec

## Overview

A sacred geometry SVG visualization at the top of the FORGED dashboard that shows rolling 7-day progress across all 4 habit categories (Money, Body, Mind, Spirit). Built as pure inline SVG with CSS transitions. Tappable quadrants reveal category detail panels.

## Placement

- Top of dashboard page, above existing content (life score, week float, cards)
- Centered in the container, ~180px tall on mobile, ~200px on desktop
- No card wrapper — sits directly on the background like the tracker hero card

## The Geometry

SVG uses `viewBox="0 0 200 200"` with center at (100, 100).

| Element | Coordinates / Dimensions |
|---------|-------------------------|
| Outer circle | center (100,100), r=85 |
| Inner circles | r=45, offset 30px from center along each axis |
| Inner circle — Money (top) | center (100, 70) |
| Inner circle — Body (right) | center (130, 100) |
| Inner circle — Mind (bottom) | center (100, 130) |
| Inner circle — Spirit (left) | center (70, 100) |
| Node dots | Money (100,45), Body (155,100), Mind (100,155), Spirit (45,100) |
| Center diamond | vertices at the 4 inner-circle intersection points |
| Center dot | (100, 100) |

The sigil is composed of layered SVG elements:

1. **Outer circle** — always visible at low opacity (0.15), represents completeness
2. **4 overlapping inner circles** — forming vesica piscis intersections. Each maps to a category using the app's actual `CATEGORIES` colors:
   - Top: Money (`#C8A951` / `var(--gold)`)
   - Right: Body (`#6BCB77` / `var(--greenT)`)
   - Bottom: Mind (`#7B8CDE`)
   - Left: Spirit (`#C77DBA`)
3. **Center diamond** — formed by connecting the 4 intersection points. Represents overall balance.
4. **4 quadrant lines** — connect adjacent nodes through diamond vertices. Each colored per its category.
5. **4 node dots** — at each cardinal point. Size and glow scale with category progress.
6. **Center dot** — overall progress indicator, opacity scales with average of all 4 categories.
7. **Category labels** — tiny DM Mono text at each cardinal point (MONEY/BODY/MIND/SPIRIT), muted color matching its category.

## Progress-to-Visual Mapping

Each category has a percentage calculated from the rolling 7-day window:

```
category_pct = (habits_done_in_last_7_days) / (total_possible_in_last_7_days)
overall_pct = average of all 4 category percentages (only counting active categories)
```

The percentage drives these SVG properties via inline styles set by JS:

| Element | Property | 0% value | 100% value |
|---------|----------|----------|------------|
| Inner circle (per category) | stroke-opacity | 0.08 | 0.5 |
| Inner circle (per category) | stroke-dashoffset | full length (hidden) | 0 (fully drawn) |
| Quadrant line (per category) | opacity | 0.1 | 0.7 |
| Node dot (per category) | r (radius) | 2px | 5px |
| Node dot (per category) | fill-opacity | 0.3 | 1.0 |
| Center diamond | fill-opacity | 0.02 | 0.12 |
| Center dot | r (radius) | 1px | 3px |
| Center dot | fill-opacity | 0.2 | 0.8 |

Instead of transitioning `stroke-dasharray` (which doesn't interpolate smoothly), use `stroke-dasharray` set to the circle's circumference and animate `stroke-dashoffset` from the full circumference (invisible) to 0 (fully drawn). This produces a smooth "drawing" effect via CSS transitions.

All elements have `transition: all 0.6s ease` so changes animate smoothly.

## Data Calculation

### Inputs
- `state.habits` — array of habit objects, each with `cat` property (not `category`) and `type`
- `state.entries` — object keyed by `{month}-{day}-{habitId}` via the existing `eKey(m, d, hid)` helper. Values are `"✓"` for completed check-type habits, or numbers for numeric habits.
- Only check-type habits count (type `"check"`). Numeric habits are excluded.
- Respect `isCatActive()` — disabled categories are excluded from the sigil entirely (quadrant hidden).

### Algorithm

This is a NEW calculation function (`calcSigilData()`), independent of the existing `catPct()` which only handles the current month. The sigil calculation must handle month-boundary rollover.

```
today = new Date()
results = { money: {done:0, total:0}, body: {...}, mind: {...}, spirit: {...} }

for dayOffset = 0 to 6:
  d = new Date(today)
  d.setDate(d.getDate() - dayOffset)
  month = d.getMonth()    // 0-indexed
  day = d.getDate()       // 1-indexed

  for each check-type habit where isCatActive(habit.cat):
    key = eKey(month, day, habit.id)
    results[habit.cat].total++
    if getEntry(month, day, habit.id) === "✓":
      results[habit.cat].done++

for each active category:
  category_pct[cat] = done / total  (0 if total is 0)

overall_pct = mean of active category percentages
```

### Edge cases
- Category with 0 habits: quadrant hidden (not shown at 0%)
- Disabled category (`isCatActive()` returns false): quadrant hidden entirely, geometry adjusts
- No data yet (new user): all quadrants at minimum — sigil is a faint outline
- Habit added mid-week: counted for all 7 days (no `createdAt` field exists in the data model, so the denominator always assumes the habit existed for all 7 days)
- Month boundary: handled by creating a Date object and using `getMonth()`/`getDate()` for each day in the window

## Tap Interaction

### Trigger
- Tap/click on a node dot or its surrounding region (invisible larger SVG circle for hit target, ~20px radius)

### Detail Panel
- Slides down below the sigil (pushes content down, not an overlay)
- Shows for the tapped category:
  - Category name + color dot + 7-day percentage (e.g., "BODY — 85%")
  - Mini 7-column bar chart showing daily completion for each of the last 7 days
  - List of habits in that category with individual 7-day completion rate (denominator is always 7)
- Styled to match existing app aesthetic: DM Mono for numbers, DM Sans for labels, muted colors, no borders

### Dismiss
- Tap the same node again to close
- Tap a different node to switch to that category
- Panel has a CSS transition for open/close (slide + fade, 0.3s ease)

## Animation Behavior

- **On page load**: Sigil elements fade in with staggered delays (outer circle first, then inner circles, then lines, then nodes). Total duration ~1s.
- **On data change** (habit checked off): All affected elements transition to new values over 0.6s. The node dot briefly scales up 1.2x then settles (CSS keyframe pulse).
- **No continuous animation** — everything is static between interactions. No render loops, no requestAnimationFrame.

## DOM Persistence

The sigil SVG must NOT be regenerated on every `renderDashboard()` call, or CSS transitions will never fire (new DOM nodes don't transition). Instead:

- `renderSigil()` checks if the sigil container already exists in the DOM
- If it exists: **update** inline styles on existing SVG elements (opacity, r, stroke-dashoffset, fill-opacity) — these will animate via CSS transitions
- If it doesn't exist: create and insert the full SVG markup, then apply initial styles

This means the sigil container (`#sigil-wrap`) is created once and mutated on subsequent updates, while the rest of the dashboard can still re-render around it.

## Responsive

- **Mobile (<600px)**: SVG viewBox stays `0 0 200 200`, container is `width:100%; max-width:240px; margin:0 auto`. Labels use 7px font. Detail panel is full-width.
- **Desktop**: Container max-width 280px. Labels use 7px font. Detail panel is constrained to container width.

## Files Modified

- `index.html` — CSS for sigil container, detail panel, and animations. JS functions: `calcSigilData()` for the 7-day rolling calculation, `renderSigil()` for DOM creation/update, called from `renderDashboard()`. SVG markup generated by JS.
- `sw.js` — bump cache version

## Non-Goals

- No 3D effects or WebGL
- No particle systems
- No continuous ambient animation (pulse/breathing)
- No sharing/export of sigil state
- No historical sigil views (past weeks)
- No accessibility enhancements (ARIA labels, keyboard nav) in v1
