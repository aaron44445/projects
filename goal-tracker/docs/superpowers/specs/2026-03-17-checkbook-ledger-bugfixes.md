# Checkbook Ledger Redesign + Bug Fixes

## Goal

Redesign the FORGED finances section (income & expenses) into a checkbook-style ledger register with selectable dates on one-time items, and fix two UI bugs (expense row spacing, tracker checkbox sizing).

## Scope

1. Ledger layout for income and expenses
2. Date field on one-time income/expense items
3. Bug fix: expense/income row spacing
4. Bug fix: tracker checkbox size inconsistency across months

All changes are in `index.html` (single-file PWA).

---

## 1. Ledger Register Layout

### Current State

Income and expense items use `.stream-row` — a flex row with two inline inputs (name + amount) and a delete button. No date field. No column headers.

### Target State

Replace `.stream-row` with a CSS Grid-based ledger register with column headers:

```
DATE       | DESCRIPTION          | AMOUNT   | x
```

**Grid definition:** `grid-template-columns: 85px 1fr 90px 28px`

**Column headers:** Rendered once at the top of each card (income card, expense card) as a thin header row with `DATE`, `DESCRIPTION`, `AMOUNT` labels in `DM Mono` at 9px, color `var(--text3)`, with a bottom border separator.

**Recurring items section:**
- DATE column: displays "\u2014" (em dash) in `var(--text3)` — recurring items don't have individual dates
- DESCRIPTION column: `<input>` for the name
- AMOUNT column: `$` prefix + `<input type="number">`. If an override exists for this month, show the override indicator *inline before the `$`* within the same grid cell (e.g., `<span class="override-indicator">$5000</span> $ <input>`). The reset button replaces the delete button position when override is active.
- Delete column: `x` button. When an override exists, this column holds the reset (`↴`) button instead, and `x` is hidden. This avoids needing a 5th column. **Behavior change:** currently both reset and delete are visible simultaneously. In the new layout, users must first reset the override before deleting the recurring item.

**One-time items section:**
- DATE column: `<input type="date">` styled to match the dark theme
  - Constrained to the currently selected finance month (`min`/`max` set to first/last day of `state.finMonth`)
  - Default value when adding new item: `YEAR + '-' + String(fm+1).padStart(2,'0') + '-' + String(TODAY_D).padStart(2,'0')` if `finMonth === TODAY_M`, else `YEAR + '-' + String(fm+1).padStart(2,'0') + '-01'` (matches existing codebase `.padStart` pattern)
  - Format display: browser native
- DESCRIPTION column: `<input>` for name
- AMOUNT column: `$` prefix + `<input type="number">`
- Delete column: `x` button

**Sorting:** One-time items sorted by `date` ascending for display. To avoid index mismatch bugs, create a sorted index array before rendering:

```js
var sortedIndices = incItems.map(function(item, i) { return i; });
sortedIndices.sort(function(a, b) {
  return (incItems[a].date || '').localeCompare(incItems[b].date || '');
});
sortedIndices.forEach(function(origIdx) {
  var item = incItems[origIdx];
  // Use origIdx in oninput/onclick handlers, NOT the display position
});
```

This ensures `updateFinItem` and `removeFinItem` always reference the correct item in the data array regardless of display order.

**Total row:** Unchanged — flex row at bottom with "Total" label and colored amount.

**Add buttons:** "Add recurring income/expense" and "Add one-time income/expense" buttons remain at the bottom of their respective sections (same `.habit-add-btn` class).

### New CSS

Add ledger classes. Use JS-based alternating row color (pass even/odd index) since CSS `:nth-child(odd)` counts all siblings including headers and labels, which breaks the stripe pattern:

```css
.ledger-hdr{display:grid;grid-template-columns:85px 1fr 90px 28px;gap:6px;padding:4px 8px;border-bottom:1px solid var(--border);margin-bottom:4px}
.ledger-hdr span{font-size:9px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:1px}
.ledger-row{display:grid;grid-template-columns:85px 1fr 90px 28px;gap:6px;align-items:center;padding:4px 8px;border-radius:4px;margin-bottom:1px}
.ledger-row.alt{background:rgba(255,255,255,.02)}
.ledger-date{font-size:11px;color:var(--text3);font-family:'DM Mono',monospace}
.ledger-date input[type="date"]{background:transparent;border:none;border-bottom:1px dashed rgba(200,169,81,.3);color:var(--gold);font-size:11px;font-family:'DM Mono',monospace;padding:2px 0;width:100%;outline:none}
.ledger-date input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(.7);cursor:pointer}
```

Alternating rows: in the JS forEach loop, add class `alt` to every other row:

```js
html += '<div class="ledger-row' + (displayIdx % 2 === 1 ? ' alt' : '') + '">';
```

### CSS Cleanup

Remove these CSS classes — they are only used in `renderFinances()` and will be replaced:
- `.stream-row` (line ~186)
- `.stream-name` (line ~187)
- `.stream-amount` (line ~189)
- `.recurring-section` (line ~196) — only used at lines 2169 and 2214

### Mobile Responsive

On mobile (<=600px), the 85px date column may be tight for native date inputs. Add a media query to reduce the date column:

```css
@media(max-width:500px){
  .ledger-hdr,.ledger-row{grid-template-columns:70px 1fr 75px 24px;gap:4px;padding:4px 4px}
  .ledger-date input[type="date"]{font-size:10px}
}
```

---

## 2. Data Model Change

### One-time income/expense items

**Before:**
```js
{ name: "Freelance", amount: 1200 }
```

**After:**
```js
{ name: "Freelance", amount: 1200, date: "2026-03-07" }
```

- `date` is an ISO date string (`YYYY-MM-DD`)
- Field is optional for backward compatibility — existing items without `date` render with an empty date input
- `addFinItem()` sets default date using the formula described in Section 1

### Recurring items

No change. Recurring items keep `{ name, amount }`.

### Functions to modify

- `addFinItem(type)` — add `date` field with default value
- `updateFinItem(type, idx, field, val)` — already handles arbitrary fields via `items[fm][idx][field] = val` (the ternary only special-cases `"amount"` for parseFloat). No code change needed for date support, but the `oninput` handler in the rendered HTML must pass `'date'` as the field name.
- `renderFinances()` — complete rewrite of income/expense card rendering to use ledger layout
- `recalcFinances()` — no change (doesn't use dates)

---

## 3. Bug Fix: Expense/Income Row Spacing

### Problem

In `renderFinances()`, the income and expense sections use nested `<div>` wrappers with conditional inline `margin-top` styles (lines 2190, 2235: `margin-top:0` vs `margin-top:8px` depending on whether recurring items exist). Combined with section label divs that add their own spacing, this creates inconsistent vertical gaps when adding multiple expense or income rows.

### Fix

The new ledger layout eliminates this entirely. Ledger rows (`.ledger-row`) are flat siblings within the `.card` div — no nested wrappers, no conditional margins. Section labels (`RECURRING`, `ONE-TIME`) are rendered as simple label divs between groups of ledger rows with consistent spacing (`margin: 8px 0 4px; font-size:9px; color:var(--text3); letter-spacing:1px`).

---

## 4. Bug Fix: Tracker Checkbox Size Inconsistency

### Problem

On mobile (<=600px), the tracker shows a weekly view with 7-day navigation. Cell CSS:

```css
.trk-cell { width:auto; flex:1; height:auto; aspect-ratio:1; }
```

At month boundaries, fewer than 7 days may be visible (e.g., a month starting on Thursday shows only 4 days in week 1). With `flex:1`, fewer cells = larger cells, causing checkbox sizes to vary between weeks and months.

March 2026 starts on Sunday, so most of its weeks have 7 full days — the user says March looks correct.

### Fix

Always render 7 cell slots per week. For days outside the current month's range, render invisible placeholder divs that take up flex space but aren't visible or interactive.

### Code change

`renderTracker()` — the mobile weekly view section (lines ~1618-1640):

Change the visibleDays loop to always push 7 entries, marking out-of-range days as null:

```js
for (var wd = 0; wd < 7; wd++) {
  var dayNum = startOfWeek + wd;
  visibleDays.push((dayNum >= 1 && dayNum <= days) ? dayNum : null);
}
```

**Week label computation** — must filter out null entries:

```js
var validDays = visibleDays.filter(function(d) { return d !== null; });
var wStart = validDays[0];
var wEnd = validDays[validDays.length - 1];
```

**Day header rendering** — check for null:

```js
visibleDays.forEach(function(d) {
  if (d === null) {
    html += '<div class="trk-day" style="visibility:hidden">&nbsp;</div>';
    return;
  }
  // existing day header rendering
});
```

**Cell rendering** — check for null:

```js
visibleDays.forEach(function(d) {
  if (d === null) {
    html += '<div class="trk-cell" style="visibility:hidden"></div>';
    return;
  }
  // existing cell rendering
});
```

The `canPrev`/`canNext` navigation logic (lines 1630-1631) remains unchanged — it uses `startOfWeek` not `visibleDays`.

---

## Testing

- Add one-time income with date, verify it saves and persists across page reload
- Add one-time income with no date (backward compat) — verify empty date input renders
- Add multiple one-time expenses, verify no spacing gaps between rows
- Add recurring income with override, verify override indicator and reset button fit in ledger grid
- Switch between months on finances, verify date inputs constrain min/max to selected month
- Verify one-time items display sorted by date
- Verify adding/removing items by clicking `x` removes the correct item (not wrong index)
- Mobile: verify date input fits within the 70px column on small screens
- Mobile tracker: navigate to first/last week of February (28 days), April (30 days) — verify checkboxes same size as mid-month weeks
- Mobile tracker: verify week label shows correct date range (no "null")
- Desktop tracker: verify no visual changes (desktop uses fixed 14px cells, not flex:1)

## Out of Scope

- Date field on recurring items
- Any changes to savings goal, net worth, or year overview sections
