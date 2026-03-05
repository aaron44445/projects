# Recurring Finance Tracking Design

## Problem
The current finance system requires manually adding every income and expense item to each month. Recurring items like salary, rent, Netflix need to be re-entered 12 times. There's no distinction between predictable recurring costs and one-time purchases.

## Design

### Data Model

**New state fields added to `state.finances`:**
- `recurringIncome` — array of `{ name, amount }` master recurring income items
- `recurringExpenses` — array of `{ name, amount }` master recurring expense items
- `overrides` — object keyed by month index, containing per-item amount overrides: `{ "3": { income: { "Salary": 4500 }, expense: { "Netflix": 0 } } }`

**Existing fields kept:**
- `incomeItems[month]` — per-month one-time income items
- `expenseItems[month]` — per-month one-time expense items
- All other finance state unchanged

### Merge Logic

When rendering a month, `recalcFinances()` computes totals as:
1. Sum recurring income (applying any overrides for that month)
2. Add one-time income items for that month
3. Sum recurring expenses (applying any overrides for that month)
4. Add one-time expense items for that month

### UI Layout Per Month

**Income card:**
- RECURRING INCOME section at top — master list items with name, amount, override indicator
- ONE-TIME INCOME section below — current per-month items
- Total combines both sections

**Expense card:**
- RECURRING EXPENSES section at top — master list items with name, amount, override indicator
- ONE-TIME EXPENSES section below — current per-month items
- Total combines both sections

### Override Behavior

- Editing a recurring item's amount in a specific month creates an override for ONLY that month
- The master recurring value stays unchanged
- A visual indicator (strikethrough or small original amount) shows when overridden
- Editing the master recurring item (from its name field) updates it everywhere
- Setting an override to $0 effectively skips the item for that month

### What Stays
- Summary cards (income / expenses / surplus|deficit)
- Savings goal + progress bar
- Year overview bar chart (now reflects recurring + one-time combined)
- Net worth tracking per month
- Month pills navigation
