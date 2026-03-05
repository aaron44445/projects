# Tree of Life V5: Living Data Visualization

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the decorative tree with a living data visualization where every element maps to real user data — habits, goals, and categories.

**Architecture:** Canvas-based tree rendered from a computed data structure. New `computeTreeData()` function builds a tree model from state, then `drawTreeOfLife()` renders it. Two calculation dimensions: 30-day rolling for growth (size), 7-day rolling for health (thickness/leaf size).

---

## Core Concept

The tree is a **1:1 mapping of your real data.** Nothing decorative — every branch, sub-branch, and leaf represents something real.

```
TRUNK (gold/amber) — overall 30-day completion
├── MONEY branch (#C8A951 gold)
│   ├── Goal "Save $10K" sub-branch
│   │   ├── "Side Hustle" habit leaf
│   │   └── "Networking" habit leaf
│   └── "Learning" habit leaf (no goal link → direct on branch)
├── BODY branch (#6BCB77 green)
│   ├── Goal "Run 5K" sub-branch
│   │   └── "Workout" habit leaf
│   └── "Sleep 7hrs" habit leaf (unlinked)
├── MIND branch (#7B8CDE blue)
│   └── ...
└── SPIRIT branch (#C77DBA purple)
    └── ...
```

---

## Two Dimensions

### Growth (Size) — 30-Day Rolling Window

Determines how BIG everything is. You start with a sprout and earn a full tree.

For each check-type habit:
```
habit30 = completions in last 30 days / 30
```

For each category:
```
cat30 = average of habit30 for all check habits in that category
```

Overall:
```
overall30 = average of all cat30 values
```

### Health (Vibrancy) — 7-Day Rolling Window

Determines how THICK and FULL things look. Miss days → things thin out.

For each check-type habit:
```
habit7 = completions in last 7 days / 7
```

---

## Visual Sizing Rules

### Trunk
- Height: `aboveH * (0.15 + overall30 * 0.60)` — always visible, tiny at 0%
- Base width: `4 + overall30 * 16`
- Top width: `2 + overall30 * 8`
- Color: warm gold/amber gradient
- Shape: organic bezier curves (quadraticCurveTo)

### Main Branches (4, one per category)
- 2 branches lean left, 2 lean right
- Angles: ~25-55 degrees upward from trunk top
- Length: `maxLen * (0.10 + cat30 * 0.90)` — always slightly visible
- Thickness: `1 + cat7Health * 3`
- Color: category color (gold, green, blue, purple)
- Shape: organic bezier curves

### Goal Sub-Branches
- Fork off parent category branch at intervals along its length
- One sub-branch per actual goal in that category
- Length: proportional to linked habits' 30-day average
- Thickness: proportional to linked habits' 7-day health
- Goals with status "Done": full length, thick
- Goals with "Not Started" and no linked habits: tiny nub

### Habit Leaves
- Small circles at tips of goal sub-branches
- One leaf per habit
- Size based on 7-day completion:

| Completion | Radius | Opacity |
|-----------|--------|---------|
| 7/7 (100%) | 5px | 100% |
| 5-6/7 (71-86%) | 4px | 80% |
| 3-4/7 (43-57%) | 2.5px | 50% |
| 1-2/7 (14-29%) | 1px | 30% |
| 0/7 (0%) | 0.5px | ~10% (ghost) |

- Color: parent category color
- Habits NOT linked to any goal: appear as leaves directly on the main category branch

### Roots (Cosmetic)
- Below ground line
- Spread proportional to overall30 score
- Gold color, organic bezier curves
- Not mapped to a specific category — visual foundation

---

## Layout

- Canvas: full width, ~280px tall
- Background: clean #0A0A0A (no stars, no gradient, no backdrop)
- Ground line at ~70% height (subtle gold line)
- Trunk centered, grows upward from ground
- Branches fan upward and outward from trunk top
- Subtle golden glow behind trunk at overall30 > 60%

### Branch Positioning (4 branches)

```
         SPIRIT    MIND    BODY    MONEY
           \        \       /       /
            \        \     /       /
             \        \   /       /
              \        trunk     /
               \        |      /
                ────────┴──────── ground
```

Left side: SPIRIT (55°), MIND (35°)
Right side: BODY (35°), MONEY (55°)

---

## Data Flow

### New Function: computeTreeData()

Builds tree model from state:

```javascript
{
  overall30: 0.72,           // 30-day overall completion
  overall7: 0.85,            // 7-day overall health
  branches: [
    {
      cat: "money",
      color: "#C8A951",
      growth30: 0.68,        // 30-day category completion
      health7: 0.80,         // 7-day category health
      side: 1,               // 1=right, -1=left
      angle: 55,             // degrees from vertical
      goals: [
        {
          name: "Save $10K",
          status: "In Progress",
          growth30: 0.72,    // avg of linked habits' 30-day
          health7: 0.85,     // avg of linked habits' 7-day
          habits: [
            { name: "Side Hustle", health7: 0.85, growth30: 0.70 },
            { name: "Networking", health7: 0.71, growth30: 0.65 }
          ]
        }
      ],
      unlinkedHabits: [      // habits with no goalLink
        { name: "Learning", health7: 1.0, growth30: 0.90 }
      ]
    },
    // ... 3 more branches
  ]
}
```

### 30-Day Calculation (crosses month boundaries)

```javascript
// For each day in the last 30 days:
for (var d = 0; d < 30; d++) {
  var dt = new Date(YEAR, TODAY_M, TODAY_D - d);
  var dm = dt.getMonth();
  var dd = dt.getDate();
  // Check if habit was completed on that date
  if (getEntry(dm, dd, habit.id) === "✓") count++;
}
habit30 = count / 30;
```

### 7-Day Calculation

Same pattern but d < 7 and divides by 7.

---

## Technical Notes

- All changes in `index.html` (single file)
- New function: `computeTreeData()` — pure data computation
- Rewritten function: `drawTreeOfLife(treeData)` — renders from computed data
- Canvas 2D API with bezier curves (quadraticCurveTo)
- Only check-type habits in calculations (consistent with existing catPct)
- Existing catPct() unchanged — ring charts still use month-to-date
- DEMO mode: override treeData with fake flourishing values
- No state structure changes needed
- No new dependencies

---

## What Stays Unchanged

- Dashboard HTML structure (tree canvas, score zone, rings, dots, bars, finance, trajectory)
- All other render functions
- catPct() — still used for ring charts
- State structure
- Nav, auth, data functions
