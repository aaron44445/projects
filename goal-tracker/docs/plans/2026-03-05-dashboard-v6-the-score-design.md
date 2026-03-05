# Dashboard V6: "The Score" — Typography-First Redesign

**Date:** 2026-03-05
**Status:** Approved

---

## Problem

Three attempts at illustrated progress metaphors (City Skyline, Geometric Tree, Living Data Tree) all failed on every dimension: looked amateurish, too cluttered, didn't match the dark luxury aesthetic, and the Canvas rendering couldn't achieve the quality needed. The tree alone was 320px of visual noise + ~380 lines of rendering code.

## Solution

Delete all illustrated metaphors. Make the life score number itself the hero. Pure typography, gold on black, zero Canvas rendering for the hero zone. Think luxury watch face crossed with premium banking app.

**Core principle:** If it doesn't earn its spot on the dashboard, it's gone. The dashboard is the product's money shot for Instagram marketing screenshots.

---

## Full Dashboard Layout (Top to Bottom)

### 1. Header Line
```
Hey, Aaron · Mar 5                    [tiny quote snippet]
```
- Left: greeting + date, 17px DM Sans, weight 400
- Right: truncated quote preview (teaser for full quote at bottom)
- Same as current

### 2. The Score (HERO ZONE)
```
                    92
                 LOCKED IN
```
- **Score number:** 100px, DM Mono, weight 300, gold (#C8A951)
- **Glow effect:** `text-shadow: 0 0 40px rgba(200,169,81,0.25)`
- **At 80+ score:** glow intensifies to `0 0 60px rgba(200,169,81,0.35)`
- **Count-up animation:** starts at 0, counts to actual score over ~1.2s on page load
- **Status label:** 11px, letter-spacing 4px, all caps, directly below score
  - 80-100: LOCKED IN (gold)
  - 60-79: ON FIRE (gold dim)
  - 40-59: BUILDING (#777)
  - 20-39: WARMING UP (#555)
  - 0-19: JUST STARTING (#444)
- **Vertical spacing:** score-zone padding 28px top, 12px bottom

### 3. Category Scores Row
```
     MONEY    BODY     MIND    SPIRIT
      88%      95%      82%      91%
```
- **Layout:** 4 columns, centered, even spacing
- **Category name:** 8px, letter-spacing 2px, all caps, color #444
- **Score number:** 26px, DM Mono, weight 400, in category color
  - MONEY: #C8A951, BODY: #6BCB77, MIND: #7B8CDE, SPIRIT: #C77DBA
- **No cards, no boxes, no rings** — just colored numbers on #0A0A0A
- Gap below: 12px

### 4. Stat Pills
```
    8/12 TODAY  ·  14 STREAK  ·  8/10 MOOD
```
- Same horizontal pill strip as current
- DM Mono, 10px, subtle borders
- Centered

### 5. Goals Row
```
GOALS  ●●●○○   3 done · 2 active
```
- Section label left, dots + count right
- Colored dots: green = done, gold = in progress, dark = not started
- Compact single line

### 6. Last 7 Days (IMPROVED)
```
LAST 7 DAYS                              72% avg
  85%  70%  90%  65%  80%  75%  ██%
  ███  ███  ███  ███  ███  ███  ███
  Sun  Mon  Tue  Wed  Thu  Fri  Sat
```
**Changes from current:**
- **Height increased:** bar area from ~52px to ~80px (more visual amplitude)
- **Bar width:** slightly wider (flex:1 with 8px gap instead of 6px)
- **Today's bar:** gold gradient + subtle glow (`box-shadow: 0 0 8px rgba(200,169,81,0.3)`)
- **Premium feel:** bars use `border-radius: 4px` at top, clean bottom edge

### 7. Life Trajectory (SIGNIFICANTLY IMPROVED)
```
LIFE TRAJECTORY                          30 DAYS
95 ─────────────────────────────────────────
                    ╱╲        ╱╲
        ╱╲    ╱╲  ╱  ╲  ╱╲  ╱  ╲  ╱╲
   ╱╲  ╱  ╲  ╱  ╲╱    ╲╱  ╲╱    ╲╱  ╲╱
  ╱  ╲╱    ╲╱
55 ─────────────────────────────────────────
```
**Changes from current:**
- **Height: 220px** (up from 150px) — dramatically more room for ups and downs
- **Auto-scaled Y axis:** Instead of fixed 0-100, dynamically calculates min/max of actual data with 10% padding. If scores range 55-95, the chart fills the full height with that range. This makes small changes visually significant.
- **Smooth curves:** Use quadraticCurveTo for bezier interpolation between points instead of straight lineTo. Creates flowing organic curves.
- **Gold gradient fill** under the curve (same as current, but more visible in taller chart)
- **Endpoint glow:** Latest data point gets a gold dot with subtle radial glow
- **Grid lines:** at auto-calculated intervals (not fixed 25/50/75)
- **Y-axis labels:** show actual values from the auto-scaled range

### 8. Finance Inline
```
$8,450 in · $3,280 out · +$5,170 net
```
- Single line, colored values (green/red/gold)
- Same as current — compact, informative

### 9. Quote (UPGRADED)
```
"You're one satisfying meal away from being back on track.
 You're one hard workout away from feeling like yourself again."
                                         — Alex Hormozi
```
- **Full width, readable** — no truncation
- DM Mono italic, 11px, #444 color
- Attribution in gold, right-aligned
- Padding: 16px top, 24px bottom

---

## Quote Bank (40+ Curated Quotes)

Replace the current 8 generic quotes with a curated bank. Heavy on grind/discipline energy. Include attribution.

**Format:** `{ text: "...", author: "Name" }`

**Rotation:** One quote per day based on `Math.floor(Date.now() / 86400000) % QUOTES.length`

**Source mix:**
- ~15 Alex Hormozi (primary voice)
- ~8 David Goggins
- ~5 Jocko Willink
- ~5 Naval Ravikant
- ~5-7 others (Andrew Huberman, Marcus Aurelius, Gary Vee, etc.)

Note: Quotes will be common motivational paraphrases and original formulations inspired by these voices, not direct reproductions. Attribution indicates the spirit/philosophy being channeled.

---

## Technical Changes

### Remove
- `drawTreeOfLife()` function (~280 lines)
- `computeTreeData()` function (~100 lines)
- `.tree-wrap` CSS and `.tree-canvas` CSS
- Tree canvas HTML in renderDashboard
- All tree-related demo data overrides

### Modify
- `renderDashboard()` — rebuild hero zone HTML (score number, status, category row)
- `drawLifeChart()` — auto-scaled Y axis, smooth curves, taller canvas, endpoint glow
- `QUOTES` array — replace with 40+ curated quotes with author attribution
- Quote rendering — full display at bottom with attribution
- Weekly chart CSS — taller bars, glow on today

### Add
- CSS for new hero zone (`.score-hero`, `.score-num`, `.score-status`, `.cat-scores-row`)
- CSS for score glow effect and count-up animation
- JS count-up animation function for life score
- Auto-scale logic in drawLifeChart (compute data min/max, map to chart coords)
- Bezier curve smoothing in drawLifeChart

### No Changes
- State structure (no data changes)
- Nav, auth, onboarding
- Tracker view, Goals view, Finances view
- All data computation functions (catPct, etc.)
- DEMO mode toggle (stays for screenshots)

---

## Design Palette (Unchanged)
- Background: #0A0A0A
- Surface: #111111
- Gold: #C8A951
- Text: #E8E8E8
- Text dim: #777
- Text muted: #444
- Category colors: gold, green (#6BCB77), blue (#7B8CDE), purple (#C77DBA)
- Fonts: DM Sans (body), DM Mono (numbers, code)
