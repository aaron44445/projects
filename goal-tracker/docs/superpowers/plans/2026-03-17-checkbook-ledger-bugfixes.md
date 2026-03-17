# Checkbook Ledger Redesign + Bug Fixes — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the FORGED finances section into a checkbook-style ledger register with selectable dates, and fix the expense row spacing bug and tracker checkbox sizing inconsistency.

**Architecture:** Replace the existing `.stream-row` flex layout in `renderFinances()` with a CSS Grid-based `.ledger-row` layout (Date | Description | Amount | Action columns). Add a `date` field to one-time income/expense data items. Fix mobile tracker to always render 7 cell slots per week for consistent checkbox sizing.

**Tech Stack:** Vanilla JS (ES5), CSS Grid, HTML5 date inputs, single-file PWA (`index.html`)

**Spec:** `docs/superpowers/specs/2026-03-17-checkbook-ledger-bugfixes.md`

---

## Chunk 1: CSS Changes

### Task 1: Add Ledger CSS Classes

**Files:**
- Modify: `index.html:186-191` (remove `.stream-row`, `.stream-name`, `.stream-amount` CSS)
- Modify: `index.html:196` (remove `.recurring-section` CSS)
- Note: Lines 192-195 (`.savings-bar-track`, `.savings-bar-fill`, `.recurring-badge`, `.override-indicator`) are PRESERVED. `.recurring-badge` is dead CSS but harmless. `.override-indicator` is actively used by the new ledger rendering.

- [ ] **Step 1: Read the CSS section to confirm exact lines**

Run: Read `index.html` lines 186-196. Verify:
- Lines 186-191: `.stream-row`, `.stream-row:last-child`, `.stream-name`, `.stream-name::placeholder`, `.stream-amount`, `.stream-amount::placeholder` — DELETE these
- Lines 192-195: `.savings-bar-track`, `.savings-bar-fill`, `.recurring-badge`, `.override-indicator` — KEEP these
- Line 196: `.recurring-section` — DELETE this

- [ ] **Step 2: Replace stream CSS with ledger CSS**

Delete lines 186-191 and line 196, then insert the new ledger CSS in their place (before `.savings-bar-track`):

```css
.ledger-hdr{display:grid;grid-template-columns:85px 1fr 90px 28px;gap:6px;padding:4px 8px;border-bottom:1px solid var(--border);margin-bottom:4px}
.ledger-hdr span{font-size:9px;color:var(--text3);font-family:'DM Mono',monospace;letter-spacing:1px}
.ledger-row{display:grid;grid-template-columns:85px 1fr 90px 28px;gap:6px;align-items:center;padding:4px 8px;border-radius:4px;margin-bottom:1px}
.ledger-row.alt{background:rgba(255,255,255,.02)}
.ledger-date{font-size:11px;color:var(--text3);font-family:'DM Mono',monospace}
.ledger-date input[type="date"]{background:transparent;border:none;border-bottom:1px dashed rgba(200,169,81,.3);color:var(--gold);font-size:11px;font-family:'DM Mono',monospace;padding:2px 0;width:100%;outline:none}
.ledger-date input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(.7);cursor:pointer}
.ledger-name{background:transparent;border:none;color:var(--text);font-size:12px;width:100%;min-width:0;outline:none}
.ledger-name::placeholder{color:var(--text3)}
.ledger-amt{display:flex;align-items:center;gap:2px;justify-content:flex-end}
.ledger-amt input{width:60px;background:transparent;border:none;font-family:'DM Mono',monospace;font-size:12px;text-align:right;outline:none}
.ledger-amt input.income{color:var(--greenT)}
.ledger-amt input.expense{color:var(--redT)}
.ledger-label{font-size:9px;color:var(--text3);letter-spacing:1px;padding:8px 8px 4px}
```

- [ ] **Step 3: Add mobile responsive override for ledger**

Add a new `@media(max-width:500px)` block after the existing one at line ~174 (do NOT merge into the existing single-line block — add a separate block):

```css
@media(max-width:500px){
.ledger-hdr,.ledger-row{grid-template-columns:70px 1fr 75px 24px;gap:4px;padding:4px 4px}
.ledger-date input[type="date"]{font-size:10px}
.ledger-name{font-size:11px}
.ledger-amt input{width:50px;font-size:11px}
}
```

- [ ] **Step 4: Commit CSS changes**

```bash
git add index.html
git commit -m "style: replace stream-row CSS with ledger grid layout"
```

---

## Chunk 2: Data Model + Functions

### Task 2: Update addFinItem to Include Date

**Files:**
- Modify: `index.html:2020-2028` (`addFinItem` function)

- [ ] **Step 1: Update addFinItem to set default date**

Replace the function at lines 2020-2028:

```js
function addFinItem(type) {
  var fm = state.finMonth;
  var items = type === "income" ? state.finances.incomeItems : state.finances.expenseItems;
  if (!items[fm]) items[fm] = [];
  var defaultDate = fm === TODAY_M
    ? YEAR + '-' + String(fm + 1).padStart(2, '0') + '-' + String(TODAY_D).padStart(2, '0')
    : YEAR + '-' + String(fm + 1).padStart(2, '0') + '-01';
  items[fm].push({ name: "", amount: 0, date: defaultDate });
  recalcFinances();
  save();
  renderFinances();
}
```

- [ ] **Step 2: Verify updateFinItem handles date field already**

Read `updateFinItem` at lines 2030-2037. Confirm line 2034 uses the generic path for non-"amount" fields:
```js
items[fm][idx][field] = field === "amount" ? (parseFloat(val) || 0) : val;
```
This already stores string values for `field === 'date'`. No code change needed.

- [ ] **Step 3: Commit data model change**

```bash
git add index.html
git commit -m "feat: add date field to one-time finance items"
```

---

## Chunk 3: Ledger Rendering — Income Card

### Task 3: Rewrite Income Card in renderFinances

**Intentional behavior change:** The current code shows both the reset (↴) and delete (x) buttons simultaneously when a recurring item has an override. The new ledger grid only has 4 columns, so these are now mutually exclusive — reset shows when override exists, delete shows otherwise. Users must reset the override before deleting.

**Files:**
- Modify: `index.html:2161-2208` (income card rendering in `renderFinances()`)

- [ ] **Step 1: Replace the income card rendering**

Replace lines 2161-2208 (from `// Income card` through the income total `</div></div>`) with the new ledger layout:

```js
  // Income card
  var monthOverrides = fin.overrides[fm] || {};
  var incOverrides = monthOverrides.income || {};

  html += '<div class="card"><span class="section-label">INCOME &#183; ' + MONTHS[fm] + '</span>';

  // Column headers
  html += '<div class="ledger-hdr" style="margin-top:14px"><span>DATE</span><span>DESCRIPTION</span><span style="text-align:right">AMOUNT</span><span></span></div>';

  // Recurring income
  var rowIdx = 0;
  if (fin.recurringIncome.length > 0) {
    html += '<div class="ledger-label">RECURRING</div>';
    fin.recurringIncome.forEach(function(item, i) {
      var hasOverride = incOverrides[item.name] !== undefined;
      var displayAmt = hasOverride ? incOverrides[item.name] : item.amount;
      html += '<div class="ledger-row' + (rowIdx % 2 === 1 ? ' alt' : '') + '">' +
        '<div class="ledger-date">&mdash;</div>' +
        '<input class="ledger-name" value="' + esc(item.name) + '" placeholder="Income source..." oninput="updateRecurringItem(\'income\',' + i + ',\'name\',this.value)">' +
        '<div class="ledger-amt">' +
        (hasOverride ? '<span class="override-indicator">$' + item.amount + '</span>' : '') +
        '<span style="color:var(--text3);font-size:11px">$</span>' +
        '<input type="number" class="income" value="' + (displayAmt || '') + '" placeholder="0" oninput="overrideRecurringItem(\'income\',\'' + esc(item.name).replace(/'/g, "\\'") + '\',this.value)">' +
        '</div>' +
        (hasOverride
          ? '<button class="habit-del" onclick="clearOverride(\'income\',\'' + esc(item.name).replace(/'/g, "\\'") + '\')" title="Reset" style="color:var(--gold);opacity:.6">&#8634;</button>'
          : '<button class="habit-del" onclick="removeRecurringItem(\'income\',' + i + ')">&times;</button>') +
        '</div>';
      rowIdx++;
    });
    html += '<button class="habit-add-btn" onclick="addRecurringItem(\'income\')">+ Add recurring income</button>';
  } else {
    html += '<div style="margin-top:8px"><button class="habit-add-btn" onclick="addRecurringItem(\'income\')" style="border-color:rgba(200,169,81,.3);color:var(--gold);opacity:.5">+ Add recurring income</button></div>';
  }

  // One-time income (sorted by date)
  if (incItems.length > 0 || fin.recurringIncome.length > 0) {
    html += '<div class="ledger-label">ONE-TIME</div>';
  }
  var incSorted = incItems.map(function(item, i) { return i; });
  incSorted.sort(function(a, b) { return (incItems[a].date || '').localeCompare(incItems[b].date || ''); });
  incSorted.forEach(function(origIdx) {
    var item = incItems[origIdx];
    var minDate = YEAR + '-' + String(fm + 1).padStart(2, '0') + '-01';
    var maxDate = YEAR + '-' + String(fm + 1).padStart(2, '0') + '-' + String(daysInMonth(fm)).padStart(2, '0');
    html += '<div class="ledger-row' + (rowIdx % 2 === 1 ? ' alt' : '') + '">' +
      '<div class="ledger-date"><input type="date" value="' + (item.date || '') + '" min="' + minDate + '" max="' + maxDate + '" oninput="updateFinItem(\'income\',' + origIdx + ',\'date\',this.value)"></div>' +
      '<input class="ledger-name" value="' + esc(item.name) + '" placeholder="Income source..." oninput="updateFinItem(\'income\',' + origIdx + ',\'name\',this.value)">' +
      '<div class="ledger-amt"><span style="color:var(--text3);font-size:11px">$</span>' +
      '<input type="number" class="income" value="' + (item.amount || '') + '" placeholder="0" oninput="updateFinItem(\'income\',' + origIdx + ',\'amount\',this.value)"></div>' +
      '<button class="habit-del" onclick="removeFinItem(\'income\',' + origIdx + ')">&times;</button>' +
      '</div>';
    rowIdx++;
  });
  html += '<button class="habit-add-btn" onclick="addFinItem(\'income\')">+ Add one-time income</button>';

  // Income total
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">' +
    '<span style="color:var(--text2);font-size:12px">Total</span>' +
    '<span class="mono" style="color:var(--greenT);font-size:14px">$' + monthIncome.toLocaleString() + '</span>' +
    '</div></div>';
```

- [ ] **Step 2: Verify the income card renders correctly**

Open the app in a browser, navigate to the Finances view, and check:
- Column headers (DATE / DESCRIPTION / AMOUNT) appear
- Recurring items show em dash in date column
- One-time items show date picker
- Add buttons work
- Override indicator appears correctly on recurring items
- Total row displays correctly

- [ ] **Step 3: Commit income card rewrite**

```bash
git add index.html
git commit -m "feat: rewrite income card as checkbook ledger with date column"
```

---

### Task 4: Rewrite Expense Card in renderFinances

**Files:**
- Modify: `index.html:2210-2253` (expense card rendering — line numbers will have shifted after Task 3, find by `// Expense card` comment)

- [ ] **Step 1: Replace the expense card rendering**

Find `// Expense card` in `renderFinances()` and replace through the expense total `</div></div>` with the matching ledger layout:

```js
  // Expense card
  html += '<div class="card"><span class="section-label">EXPENSES &#183; ' + MONTHS[fm] + '</span>';

  // Column headers
  html += '<div class="ledger-hdr" style="margin-top:14px"><span>DATE</span><span>DESCRIPTION</span><span style="text-align:right">AMOUNT</span><span></span></div>';

  // Recurring expenses
  var expRowIdx = 0;
  if (fin.recurringExpenses.length > 0) {
    html += '<div class="ledger-label">RECURRING</div>';
    fin.recurringExpenses.forEach(function(item, i) {
      var hasOverride = expOverrides[item.name] !== undefined;
      var displayAmt = hasOverride ? expOverrides[item.name] : item.amount;
      html += '<div class="ledger-row' + (expRowIdx % 2 === 1 ? ' alt' : '') + '">' +
        '<div class="ledger-date">&mdash;</div>' +
        '<input class="ledger-name" value="' + esc(item.name) + '" placeholder="Expense name..." oninput="updateRecurringItem(\'expense\',' + i + ',\'name\',this.value)">' +
        '<div class="ledger-amt">' +
        (hasOverride ? '<span class="override-indicator">$' + item.amount + '</span>' : '') +
        '<span style="color:var(--text3);font-size:11px">$</span>' +
        '<input type="number" class="expense" value="' + (displayAmt || '') + '" placeholder="0" oninput="overrideRecurringItem(\'expense\',\'' + esc(item.name).replace(/'/g, "\\'") + '\',this.value)">' +
        '</div>' +
        (hasOverride
          ? '<button class="habit-del" onclick="clearOverride(\'expense\',\'' + esc(item.name).replace(/'/g, "\\'") + '\')" title="Reset" style="color:var(--gold);opacity:.6">&#8634;</button>'
          : '<button class="habit-del" onclick="removeRecurringItem(\'expense\',' + i + ')">&times;</button>') +
        '</div>';
      expRowIdx++;
    });
    html += '<button class="habit-add-btn" onclick="addRecurringItem(\'expense\')">+ Add recurring expense</button>';
  } else {
    html += '<div style="margin-top:8px"><button class="habit-add-btn" onclick="addRecurringItem(\'expense\')" style="border-color:rgba(200,169,81,.3);color:var(--gold);opacity:.5">+ Add recurring expense</button></div>';
  }

  // One-time expenses (sorted by date)
  if (expItems.length > 0 || fin.recurringExpenses.length > 0) {
    html += '<div class="ledger-label">ONE-TIME</div>';
  }
  var expSorted = expItems.map(function(item, i) { return i; });
  expSorted.sort(function(a, b) { return (expItems[a].date || '').localeCompare(expItems[b].date || ''); });
  expSorted.forEach(function(origIdx) {
    var item = expItems[origIdx];
    var minDate = YEAR + '-' + String(fm + 1).padStart(2, '0') + '-01';
    var maxDate = YEAR + '-' + String(fm + 1).padStart(2, '0') + '-' + String(daysInMonth(fm)).padStart(2, '0');
    html += '<div class="ledger-row' + (expRowIdx % 2 === 1 ? ' alt' : '') + '">' +
      '<div class="ledger-date"><input type="date" value="' + (item.date || '') + '" min="' + minDate + '" max="' + maxDate + '" oninput="updateFinItem(\'expense\',' + origIdx + ',\'date\',this.value)"></div>' +
      '<input class="ledger-name" value="' + esc(item.name) + '" placeholder="Expense name..." oninput="updateFinItem(\'expense\',' + origIdx + ',\'name\',this.value)">' +
      '<div class="ledger-amt"><span style="color:var(--text3);font-size:11px">$</span>' +
      '<input type="number" class="expense" value="' + (item.amount || '') + '" placeholder="0" oninput="updateFinItem(\'expense\',' + origIdx + ',\'amount\',this.value)"></div>' +
      '<button class="habit-del" onclick="removeFinItem(\'expense\',' + origIdx + ')">&times;</button>' +
      '</div>';
    expRowIdx++;
  });
  html += '<button class="habit-add-btn" onclick="addFinItem(\'expense\')">+ Add one-time expense</button>';

  // Expense total
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">' +
    '<span style="color:var(--text2);font-size:12px">Total</span>' +
    '<span class="mono" style="color:var(--redT);font-size:14px">$' + monthExpense.toLocaleString() + '</span>' +
    '</div></div>';
```

- [ ] **Step 2: Verify the expense card renders correctly**

Open the app, navigate to Finances, check:
- Expense card matches income card structure
- Red-colored amounts
- Multiple one-time expenses have no spacing gaps (original bug fixed)
- Date pickers work and constrain to selected month

- [ ] **Step 3: Commit expense card rewrite**

```bash
git add index.html
git commit -m "feat: rewrite expense card as checkbook ledger with date column"
```

---

## Chunk 3: Tracker Checkbox Fix

### Task 5: Fix Mobile Tracker Checkbox Sizing

**Files:**
- Modify: `index.html:1618-1640` (mobile weekly view in `renderTracker()`)
- Modify: `index.html:1645-1657` (day header rendering)
- Modify: `index.html:1696-1720` (cell rendering loop)

- [ ] **Step 1: Update visibleDays to always push 7 entries**

Find the mobile weekly loop in `renderTracker()` (around line 1626). Replace:

```js
    for (var wd = 0; wd < 7; wd++) {
      var dayNum = startOfWeek + wd;
      if (dayNum >= 1 && dayNum <= days) visibleDays.push(dayNum);
    }
```

With:

```js
    for (var wd = 0; wd < 7; wd++) {
      var dayNum = startOfWeek + wd;
      visibleDays.push((dayNum >= 1 && dayNum <= days) ? dayNum : null);
    }
```

- [ ] **Step 2: Update week label to filter null entries**

Find the week label lines (around 1632-1633). Replace:

```js
    var wStart = visibleDays[0];
    var wEnd = visibleDays[visibleDays.length - 1];
```

With:

```js
    var validDays = visibleDays.filter(function(d) { return d !== null; });
    var wStart = validDays[0];
    var wEnd = validDays[validDays.length - 1];
```

- [ ] **Step 3: Update day header rendering to handle null**

Find the day headers forEach (around line 1646). Replace:

```js
  visibleDays.forEach(function(d) {
    var dlabel = d;
    if (isMobile) {
      var ddow = new Date(YEAR, m, d).getDay();
      dlabel = '<span class="trk-day-letter">' + dayLetters[ddow] + '</span>' + d;
    }
    html += '<div class="trk-day' + (isToday(m, d) ? ' today' : '') + '">' + dlabel + '</div>';
  });
```

With:

```js
  visibleDays.forEach(function(d) {
    if (d === null) {
      html += '<div class="trk-day" style="visibility:hidden">&nbsp;</div>';
      return;
    }
    var dlabel = d;
    if (isMobile) {
      var ddow = new Date(YEAR, m, d).getDay();
      dlabel = '<span class="trk-day-letter">' + dayLetters[ddow] + '</span>' + d;
    }
    html += '<div class="trk-day' + (isToday(m, d) ? ' today' : '') + '">' + dlabel + '</div>';
  });
```

- [ ] **Step 4: Update cell rendering to handle null**

Find the cell rendering forEach inside each habit (around line 1696). The loop starts with `visibleDays.forEach(function(d) {`. Add a null check at the top of the callback:

After `visibleDays.forEach(function(d) {`, add:

```js
        if (d === null) {
          html += '<div class="trk-cell" style="visibility:hidden"></div>';
          return;
        }
```

This must be added before the existing `var v = getEntry(m, d, hab.id);` line.

- [ ] **Step 5: Verify tracker checkboxes are consistent**

Open the app on mobile (or resize to <=600px), navigate to the Tracker:
- Go to February — first and last weeks should have same-size checkboxes as mid-month weeks
- Go to April — same consistency
- Go to March — should look identical to before (mostly full weeks)
- Verify week navigation arrows still work
- Verify week label shows correct date range (no "null")

- [ ] **Step 6: Commit tracker fix**

```bash
git add index.html
git commit -m "fix: consistent mobile tracker checkbox sizes across all months"
```

---

## Chunk 4: Service Worker Cache Bump

### Task 6: Bump Service Worker Cache Version

**Files:**
- Modify: `sw.js:1` (cache version)

- [ ] **Step 1: Bump the cache version**

In `sw.js`, find the cache version string (currently `v9` or similar) and increment it to `v10`.

- [ ] **Step 2: Commit cache bump**

```bash
git add sw.js
git commit -m "chore: bump service worker cache to v10 for ledger feature"
```

---

## Chunk 5: Manual Verification

### Task 7: End-to-End Verification

- [ ] **Step 1: Test income ledger**
  - Add a recurring income item → verify em dash in date column, green amount
  - Add a one-time income item → verify date picker defaults to today, green amount
  - Change the date → verify it saves (reload page)
  - Add 3+ one-time items with different dates → verify they sort by date
  - Delete an item → verify the correct item is removed (not wrong index)

- [ ] **Step 2: Test expense ledger**
  - Add multiple one-time expenses → verify NO spacing gaps between rows (original bug)
  - Verify red amounts
  - Verify date picker constrains to selected month

- [ ] **Step 3: Test backward compatibility**
  - If any existing data exists without `date` field, verify it renders with empty date input
  - Switch months → verify data persists per-month

- [ ] **Step 4: Test override behavior**
  - Add recurring income, switch to a different month, override the amount
  - Verify override indicator and reset button appear (delete button hidden)
  - Reset override → verify delete button returns

- [ ] **Step 5: Test mobile tracker**
  - Resize browser to <=600px
  - Navigate to Feb, check first/last week checkbox sizes
  - Navigate to Apr, same check
  - Verify March unchanged
