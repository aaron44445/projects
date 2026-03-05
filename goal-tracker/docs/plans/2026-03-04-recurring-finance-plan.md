# Recurring Finance Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add recurring income/expense support so users define items once and they auto-populate every month, with per-month overrides for exceptions and separate one-time items.

**Architecture:** Single HTML file (`index.html`), inline CSS + JS. Add `recurringIncome`, `recurringExpenses`, and `overrides` to `state.finances`. Merge recurring + one-time at render time. Override logic: per-month amount exceptions keyed by item name. All backward-compatible via `ensureDefaults()`.

**Tech Stack:** Vanilla JS, CSS3, Supabase JSONB state sync.

---

### Task 1: Add Recurring State + Migration

**Files:**
- Modify: `C:\projects\goal-tracker\index.html`

**What changes:** Add `recurringIncome`, `recurringExpenses`, and `overrides` fields to state. Update `ensureDefaults()` to init them. Update `handleSignUp()` to include them for new users.

**Step 1: Update ensureDefaults()**

In `ensureDefaults()`, after the existing finance migrations (after `if (state.finMonth === undefined) state.finMonth = TODAY_M;`), add:

```javascript
if (!state.finances.recurringIncome) state.finances.recurringIncome = [];
if (!state.finances.recurringExpenses) state.finances.recurringExpenses = [];
if (!state.finances.overrides) state.finances.overrides = {};
```

**Step 2: Update handleSignUp()**

In `handleSignUp()`, update the finance init to include new fields:

```javascript
state.finances = { income: Array(12).fill(0), expenses: Array(12).fill(0), savingsGoal: 5000, savingsCurrent: 0, netWorth: Array(12).fill(0), streams: [], incomeItems: {}, expenseItems: {}, recurringIncome: [], recurringExpenses: [], overrides: {} };
```

**Step 3: Update recalcFinances() to merge recurring + one-time**

Replace the current `recalcFinances()`:

```javascript
function recalcFinances() {
  for (var m = 0; m < 12; m++) {
    var monthOverrides = state.finances.overrides[m] || {};
    var incOverrides = monthOverrides.income || {};
    var expOverrides = monthOverrides.expense || {};

    var recurInc = 0;
    state.finances.recurringIncome.forEach(function(item) {
      var amt = incOverrides[item.name] !== undefined ? incOverrides[item.name] : item.amount;
      recurInc += (parseFloat(amt) || 0);
    });

    var recurExp = 0;
    state.finances.recurringExpenses.forEach(function(item) {
      var amt = expOverrides[item.name] !== undefined ? expOverrides[item.name] : item.amount;
      recurExp += (parseFloat(amt) || 0);
    });

    state.finances.income[m] = recurInc + calcMonthTotal(state.finances.incomeItems, m);
    state.finances.expenses[m] = recurExp + calcMonthTotal(state.finances.expenseItems, m);
  }
}
```

**Step 4: Validate JS syntax**

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('C:/projects/goal-tracker/index.html','utf8');const m=html.match(/<script>([\s\S]*?)<\/script>/);if(m){try{new Function(m[1]);console.log('OK')}catch(e){console.log('ERROR:',e.message)}}"
```

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add recurring finance state + merge logic in recalcFinances"
```

---

### Task 2: Add Recurring Management Functions

**Files:**
- Modify: `C:\projects\goal-tracker\index.html`

**What changes:** Add functions to add, remove, rename, update amount, and override recurring items.

**Step 1: Add recurring item management functions**

After `removeFinItem()`, add:

```javascript
function addRecurringItem(type) {
  var arr = type === "income" ? state.finances.recurringIncome : state.finances.recurringExpenses;
  arr.push({ name: "", amount: 0 });
  recalcFinances();
  save();
  renderFinances();
}

function updateRecurringItem(type, idx, field, val) {
  var arr = type === "income" ? state.finances.recurringIncome : state.finances.recurringExpenses;
  if (!arr[idx]) return;
  if (field === "name") {
    // If renaming, move any overrides from old name to new name
    var oldName = arr[idx].name;
    var newName = val;
    if (oldName !== newName) {
      Object.keys(state.finances.overrides).forEach(function(m) {
        var oType = type === "income" ? "income" : "expense";
        if (state.finances.overrides[m][oType] && state.finances.overrides[m][oType][oldName] !== undefined) {
          state.finances.overrides[m][oType][newName] = state.finances.overrides[m][oType][oldName];
          delete state.finances.overrides[m][oType][oldName];
        }
      });
    }
    arr[idx].name = newName;
  } else {
    arr[idx].amount = parseFloat(val) || 0;
  }
  recalcFinances();
  save();
}

function removeRecurringItem(type, idx) {
  var arr = type === "income" ? state.finances.recurringIncome : state.finances.recurringExpenses;
  if (!arr[idx]) return;
  var name = arr[idx].name;
  arr.splice(idx, 1);
  // Clean up any overrides for this item
  var oType = type === "income" ? "income" : "expense";
  Object.keys(state.finances.overrides).forEach(function(m) {
    if (state.finances.overrides[m][oType]) {
      delete state.finances.overrides[m][oType][name];
    }
  });
  recalcFinances();
  save();
  renderFinances();
}

function overrideRecurringItem(type, name, val) {
  var fm = state.finMonth;
  if (!state.finances.overrides[fm]) state.finances.overrides[fm] = {};
  var oType = type === "income" ? "income" : "expense";
  if (!state.finances.overrides[fm][oType]) state.finances.overrides[fm][oType] = {};
  var parsed = parseFloat(val);
  if (isNaN(parsed)) {
    // Remove override — revert to recurring amount
    delete state.finances.overrides[fm][oType][name];
  } else {
    state.finances.overrides[fm][oType][name] = parsed;
  }
  recalcFinances();
  save();
}

function clearOverride(type, name) {
  var fm = state.finMonth;
  var oType = type === "income" ? "income" : "expense";
  if (state.finances.overrides[fm] && state.finances.overrides[fm][oType]) {
    delete state.finances.overrides[fm][oType][name];
  }
  recalcFinances();
  save();
  renderFinances();
}
```

**Step 2: Validate JS syntax**

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('C:/projects/goal-tracker/index.html','utf8');const m=html.match(/<script>([\s\S]*?)<\/script>/);if(m){try{new Function(m[1]);console.log('OK')}catch(e){console.log('ERROR:',e.message)}}"
```

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: recurring item management functions — add, remove, rename, override"
```

---

### Task 3: Update renderFinances() UI

**Files:**
- Modify: `C:\projects\goal-tracker\index.html`

**What changes:** Rewrite the income and expense card sections to show recurring items at top with override support, then one-time items below. Add CSS for recurring badge and override indicator.

**Step 1: Add CSS for recurring items**

After the existing `/* FINANCES */` CSS block, add:

```css
.recurring-badge{font-size:8px;letter-spacing:1px;padding:2px 5px;border-radius:3px;background:rgba(200,169,81,.12);color:var(--gold);font-family:'DM Mono',monospace;white-space:nowrap}
.override-indicator{font-size:9px;color:var(--text3);text-decoration:line-through;margin-right:4px;font-family:'DM Mono',monospace}
.recurring-section{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dashed var(--border)}
```

**Step 2: Rewrite income card in renderFinances()**

Replace the income items section with:

```javascript
// Recurring income
var monthOverrides = fin.overrides[fm] || {};
var incOverrides = (monthOverrides.income || {});

html += '<div class="card"><span class="section-label">INCOME &#183; ' + MONTHS[fm] + '</span>';

if (fin.recurringIncome.length > 0) {
  html += '<div class="recurring-section" style="margin-top:14px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
    '<span style="font-size:9px;color:var(--text3);letter-spacing:1px">RECURRING</span></div>';
  fin.recurringIncome.forEach(function(item, i) {
    var hasOverride = incOverrides[item.name] !== undefined;
    var displayAmt = hasOverride ? incOverrides[item.name] : item.amount;
    html += '<div class="stream-row">' +
      '<input class="stream-name" value="' + esc(item.name) + '" placeholder="Income source..." oninput="updateRecurringItem(\'income\',' + i + ',\'name\',this.value)">' +
      (hasOverride ? '<span class="override-indicator">$' + item.amount + '</span>' : '') +
      '<span style="color:var(--text3);font-size:12px">$</span>' +
      '<input type="number" class="stream-amount" value="' + (displayAmt || "") + '" placeholder="0" oninput="overrideRecurringItem(\'income\',\'' + esc(item.name) + '\',this.value)">' +
      (hasOverride ? '<button class="habit-del" onclick="clearOverride(\'income\',\'' + esc(item.name) + '\')" title="Reset to recurring amount" style="color:var(--gold);opacity:.6">&#8634;</button>' : '') +
      '<button class="habit-del" onclick="removeRecurringItem(\'income\',' + i + ')">&times;</button>' +
      '</div>';
  });
  html += '<button class="habit-add-btn" onclick="addRecurringItem(\'income\')">+ Add recurring income</button></div>';
}

// One-time income
html += '<div style="margin-top:' + (fin.recurringIncome.length > 0 ? '0' : '14px') + '">';
if (incItems.length > 0 || fin.recurringIncome.length > 0) {
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
    '<span style="font-size:9px;color:var(--text3);letter-spacing:1px">ONE-TIME</span></div>';
}
incItems.forEach(function(item, i) {
  html += '<div class="stream-row">' +
    '<input class="stream-name" value="' + esc(item.name) + '" placeholder="Income source..." oninput="updateFinItem(\'income\',' + i + ',\'name\',this.value)">' +
    '<span style="color:var(--text3);font-size:12px">$</span>' +
    '<input type="number" class="stream-amount" value="' + (item.amount || "") + '" placeholder="0" oninput="updateFinItem(\'income\',' + i + ',\'amount\',this.value)">' +
    '<button class="habit-del" onclick="removeFinItem(\'income\',' + i + ')">&times;</button>' +
    '</div>';
});
html += '<button class="habit-add-btn" onclick="addFinItem(\'income\')">+ Add one-time income</button></div>';

// Total
html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">' +
  '<span style="color:var(--text2);font-size:12px">Total</span>' +
  '<span class="mono" style="color:var(--greenT);font-size:14px">$' + monthIncome.toLocaleString() + '</span>' +
  '</div></div>';
```

**Step 3: Rewrite expense card in renderFinances()**

Same pattern as income — recurring expenses section at top with override support, one-time below:

```javascript
var expOverrides = (monthOverrides.expense || {});

html += '<div class="card"><span class="section-label">EXPENSES &#183; ' + MONTHS[fm] + '</span>';

if (fin.recurringExpenses.length > 0) {
  html += '<div class="recurring-section" style="margin-top:14px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
    '<span style="font-size:9px;color:var(--text3);letter-spacing:1px">RECURRING</span></div>';
  fin.recurringExpenses.forEach(function(item, i) {
    var hasOverride = expOverrides[item.name] !== undefined;
    var displayAmt = hasOverride ? expOverrides[item.name] : item.amount;
    html += '<div class="stream-row">' +
      '<input class="stream-name" value="' + esc(item.name) + '" placeholder="Expense name..." oninput="updateRecurringItem(\'expense\',' + i + ',\'name\',this.value)">' +
      (hasOverride ? '<span class="override-indicator">$' + item.amount + '</span>' : '') +
      '<span style="color:var(--text3);font-size:12px">$</span>' +
      '<input type="number" class="stream-amount" style="color:var(--redT)" value="' + (displayAmt || "") + '" placeholder="0" oninput="overrideRecurringItem(\'expense\',\'' + esc(item.name) + '\',this.value)">' +
      (hasOverride ? '<button class="habit-del" onclick="clearOverride(\'expense\',\'' + esc(item.name) + '\')" title="Reset to recurring amount" style="color:var(--gold);opacity:.6">&#8634;</button>' : '') +
      '<button class="habit-del" onclick="removeRecurringItem(\'expense\',' + i + ')">&times;</button>' +
      '</div>';
  });
  html += '<button class="habit-add-btn" onclick="addRecurringItem(\'expense\')">+ Add recurring expense</button></div>';
}

// One-time expenses
html += '<div style="margin-top:' + (fin.recurringExpenses.length > 0 ? '0' : '14px') + '">';
if (expItems.length > 0 || fin.recurringExpenses.length > 0) {
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
    '<span style="font-size:9px;color:var(--text3);letter-spacing:1px">ONE-TIME</span></div>';
}
expItems.forEach(function(item, i) {
  html += '<div class="stream-row">' +
    '<input class="stream-name" value="' + esc(item.name) + '" placeholder="Expense name..." oninput="updateFinItem(\'expense\',' + i + ',\'name\',this.value)">' +
    '<span style="color:var(--text3);font-size:12px">$</span>' +
    '<input type="number" class="stream-amount" style="color:var(--redT)" value="' + (item.amount || "") + '" placeholder="0" oninput="updateFinItem(\'expense\',' + i + ',\'amount\',this.value)">' +
    '<button class="habit-del" onclick="removeFinItem(\'expense\',' + i + ')">&times;</button>' +
    '</div>';
});
html += '<button class="habit-add-btn" onclick="addFinItem(\'expense\')">+ Add one-time expense</button></div>';

// Total
html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">' +
  '<span style="color:var(--text2);font-size:12px">Total</span>' +
  '<span class="mono" style="color:var(--redT);font-size:14px">$' + monthExpense.toLocaleString() + '</span>' +
  '</div></div>';
```

**Step 4: Add "+ Add recurring" buttons when lists are empty**

If `recurringIncome` is empty, show the add button above the one-time section so users discover the feature:

After the section label in the income card (when `recurringIncome.length === 0`):
```javascript
if (fin.recurringIncome.length === 0) {
  html += '<div style="margin-top:14px"><button class="habit-add-btn" onclick="addRecurringItem(\'income\')" style="border-color:var(--gold);color:var(--gold);opacity:.5">+ Add recurring income</button></div>';
}
```

Same for expenses.

**Step 5: Validate JS syntax**

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('C:/projects/goal-tracker/index.html','utf8');const m=html.match(/<script>([\s\S]*?)<\/script>/);if(m){try{new Function(m[1]);console.log('OK')}catch(e){console.log('ERROR:',e.message)}}"
```

**Step 6: Commit**

```bash
git add index.html
git commit -m "feat: recurring finance UI — recurring sections with overrides in income and expense cards"
```

---

### Task 4: Final Polish & Deploy

**Files:**
- Modify: `C:\projects\goal-tracker\index.html`

**Step 1: Verify ensureDefaults() handles all migrations**

Confirm:
- `recurringIncome` inits to `[]` if missing
- `recurringExpenses` inits to `[]` if missing
- `overrides` inits to `{}` if missing
- Existing `incomeItems`/`expenseItems` still work (backward compatible)

**Step 2: Validate JS syntax**

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('C:/projects/goal-tracker/index.html','utf8');const m=html.match(/<script>([\s\S]*?)<\/script>/);if(m){try{new Function(m[1]);console.log('OK')}catch(e){console.log('ERROR:',e.message)}}"
```

**Step 3: Deploy**

```bash
cd C:/projects/goal-tracker && npx vercel --prod --yes
```

**Step 4: Verify in browser**

1. Finances page loads without errors
2. Add a recurring income item (e.g., "Salary $4000") — appears in all months
3. Switch to a different month — recurring item is there
4. Change the amount in one month — override indicator appears
5. Add a one-time expense — only appears in current month
6. Totals correctly combine recurring + one-time
7. Year overview chart reflects combined totals

**Step 5: Commit**

```bash
git add index.html
git commit -m "polish: recurring finance deploy with state migration"
```
