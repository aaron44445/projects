# Tracker Redesign: Notion Grid

**Date:** 2026-03-05
**Status:** Approved

---

## Problem

The tracker's 34px cells with solid gold fills feel oversized and loud. Not minimalistic. Need Notion-style compact grid with tiny filled squares.

## Solution

Shrink all tracker cells to 18px, use subtle category-tinted fills for done states, tighten all spacing. Keep full month view, keep category progress bars.

---

## Cell Grid

| Element | Current | New |
|---------|---------|-----|
| Cell size | 34px | 18px |
| Cell border-radius | 2px | 2px |
| Done state | Solid gold + pop animation | Category color at 15-20% opacity |
| Empty state | Transparent + hover border | Transparent, no hover |
| Past + missed | Faint white tint | Tiny 3px dot center |
| Today column | Gold box-shadow | Subtle gold header only |
| Number inputs | 28x24px | 16px wide, 8px font |

## Habit Rows

| Element | Current | New |
|---------|---------|-----|
| Label width | 140px | 120px |
| Label font | 12px | 11px |
| Row height | ~34px | ~20px |
| Left border | 3px category color | Keep |
| Alternating bg | surface/surface2 | Keep, tighter padding |

## Day Headers

| Element | Current | New |
|---------|---------|-----|
| Font size | 10px | 8px |
| Width | 34px | 18px |
| Today | Gold + bold + border | Gold + bold only |

## Category Sections

- Header: dot + name + percentage (keep)
- Progress bar: 3px, category color (keep)
- margin-top: 12px -> 8px

## Stat Columns

| Element | Current | New |
|---------|---------|-----|
| Width | 48px | 36px |
| Font | 11px/10px | 9px |

## Mobile (< 500px)

- Label: 90px
- Cells: 16px
- Headers: 7px
- Horizontal scroll kept

## Done Cell Color Logic

Each done cell uses its parent category color at low opacity:
- MONEY habits: rgba(200,169,81,.15)
- BODY habits: rgba(107,203,119,.15)
- MIND habits: rgba(123,140,222,.15)
- SPIRIT habits: rgba(199,125,186,.15)

No checkmark character. No animation. Just a quiet tinted square.
