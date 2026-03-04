# LOCKED IN — Product Build Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a sellable single-page web app "LOCKED IN" — a personal command center with Dashboard, Tracker, Goals, and Finances views, plus first-run onboarding. Dark theme, gold accents, cinematic aesthetic. All data in localStorage, deployed on Vercel.

**Architecture:** Single `index.html` file in `C:\projects\goal-tracker\`. No frameworks, no build tools — pure HTML/CSS/JS. State managed via a global `state` object persisted to localStorage. Views rendered via JS template strings into container divs. Onboarding overlay shown on first visit (no `userName` in state). Dynamic dates via `new Date()`.

**Tech Stack:** Vanilla HTML/CSS/JS, Google Fonts (DM Sans + DM Mono), localStorage, Vercel static hosting.

**Existing reference:** `locked-in-tracker.html` contains a working personal tracker with the same design language. Use its CSS patterns (variables, card styles, grid layout) as a starting point but rebuild from scratch for the product version.

---

## Task 1: Foundation — HTML Shell, CSS, Nav, State Layer

**Files:**
- Create: `C:\projects\goal-tracker\index.html`

**What this builds:** The empty shell of the app — HTML structure, all CSS, navigation bar, state management (load/save), view switching, and utility functions. No view content yet — just the scaffolding everything plugs into.

**Step 1: Create `index.html` with complete HTML head, CSS, nav, empty view containers, and JS foundation**

The file should contain:

**HTML structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- charset, viewport (user-scalable=no), apple-mobile-web-app-capable, theme-color #0A0A0A -->
  <title>LOCKED IN</title>
  <!-- Google Fonts: DM Sans (300-700) + DM Mono (300-500) -->
  <style>/* all CSS here */</style>
</head>
<body>
  <div id="onboarding" style="display:none"><!-- onboarding overlay --></div>
  <nav>
    <span class="nav-brand">LOCKED IN</span>
    <button class="nav-btn active" data-view="dashboard">DASHBOARD</button>
    <button class="nav-btn" data-view="tracker">TRACKER</button>
    <button class="nav-btn" data-view="goals">GOALS</button>
    <button class="nav-btn" data-view="finances">FINANCES</button>
  </nav>
  <div class="container">
    <div id="v-dashboard"></div>
    <div id="v-tracker" style="display:none"></div>
    <div id="v-goals" style="display:none"></div>
    <div id="v-finances" style="display:none"></div>
  </div>
  <script>/* all JS here */</script>
</body>
</html>
```

**CSS variables (`:root`):**
```
--bg: #0A0A0A
--surface: #111111
--surface2: #161616
--border: #1E1E1E
--gold: #C8A951
--gold-dim: rgba(200,169,81,.15)
--text: #E8E8E8
--text2: #777
--text3: #444
--green: #2D5A2D
--greenT: #6BCB77
--red: #5A2D2D
--redT: #CB6B6B
```

**CSS must include styles for:**
- Reset (`*` box-sizing, margin, padding, tap-highlight)
- Body (bg, font, scrollbar, min-height 100dvh)
- `.mono` helper
- Nav (sticky, 52px height, brand left, buttons right with active gold underline)
- `.container` (max-width 900px, centered, padding)
- `.card` (surface bg, border, 8px radius, 24px padding, 16px margin-bottom)
- `.section-label` (11px, letter-spacing 2px, uppercase feel)
- `.progress-track` / `.progress-fill` (6px bar, gold fill, transition width .5s)
- `.quote` (text3 color, 12px italic mono)
- All responsive breakpoints from existing tracker (max-width 500px)
- Onboarding overlay (fixed full-screen, z-index 100, centered card, backdrop blur)
- Smooth transitions on all interactive elements

**JS foundation:**
```javascript
// Dynamic date
const NOW = new Date();
const YEAR = NOW.getFullYear();
const TODAY_M = NOW.getMonth(); // 0-indexed
const TODAY_D = NOW.getDate();
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Habit definitions — 4 categories, generic (not personal)
const CATEGORIES = [
  { id: "money", name: "MONEY", icon: "💰", color: "var(--gold)" },
  { id: "body", name: "BODY", icon: "🏋️", color: "var(--greenT)" },
  { id: "mind", name: "MIND", icon: "🧠", color: "#7B8CDE" },
  { id: "spirit", name: "SPIRIT", icon: "✨", color: "#C77DBA" }
];

const HABITS = [
  // Money
  { id: 1, cat: "money", name: "Side Hustle Work", icon: "💼", type: "check" },
  { id: 2, cat: "money", name: "Learning / Skill", icon: "📚", type: "check" },
  { id: 3, cat: "money", name: "Networking", icon: "🤝", type: "check" },
  // Body
  { id: 4, cat: "body", name: "Workout", icon: "🏋️", type: "check" },
  { id: 5, cat: "body", name: "Sleep 7+ hrs", icon: "😴", type: "check" },
  { id: 6, cat: "body", name: "Clean Eating", icon: "🥗", type: "check" },
  // Mind
  { id: 7, cat: "mind", name: "Reading", icon: "📖", type: "check" },
  { id: 8, cat: "mind", name: "Deep Work (hrs)", icon: "🎯", type: "number" },
  { id: 9, cat: "mind", name: "No Doomscroll", icon: "📵", type: "check" },
  // Spirit
  { id: 10, cat: "spirit", name: "Journal", icon: "📝", type: "check" },
  { id: 11, cat: "spirit", name: "Gratitude", icon: "🙏", type: "check" },
  { id: 12, cat: "spirit", name: "Meditation / Faith", icon: "🧘", type: "check" }
];

// Default goals (shown on first setup, user can edit)
const GOALS_DEFAULT = [
  { cat: "💰 MONEY", items: [
    { t: "Start a side income stream", d: "Q2", s: "Not Started" },
    { t: "Save $1,000 emergency fund", d: "Q3", s: "Not Started" },
    { t: "Learn a marketable skill", d: "Q2", s: "Not Started" }
  ]},
  { cat: "🏋️ BODY", items: [
    { t: "Work out 4x/week consistently", d: "Ongoing", s: "Not Started" },
    { t: "Hit a fitness milestone", d: "Q3", s: "Not Started" }
  ]},
  { cat: "🧠 MIND", items: [
    { t: "Read 12 books this year", d: "Q4", s: "Not Started" },
    { t: "Build a deep work habit", d: "Ongoing", s: "Not Started" }
  ]},
  { cat: "✨ SPIRIT", items: [
    { t: "Daily journal streak", d: "Ongoing", s: "Not Started" },
    { t: "Weekly reflection practice", d: "Ongoing", s: "Not Started" }
  ]}
];

// State
let state = {
  userName: "",        // empty = show onboarding
  entries: {},         // "month-day-habitId" -> "✓" or number string
  goals: null,         // null = use GOALS_DEFAULT
  finances: {
    income: Array(12).fill(0),
    expenses: Array(12).fill(0),
    savingsGoal: 5000,
    savingsCurrent: 0,
    netWorth: Array(12).fill(0),
    streams: []        // [{name:"", amount:0}]
  },
  currentMonth: TODAY_M
};

function load() {
  try {
    const d = localStorage.getItem("lockedin_state");
    if (d) { const p = JSON.parse(d); state = { ...state, ...p }; }
  } catch(e) {}
  if (!state.goals) state.goals = JSON.parse(JSON.stringify(GOALS_DEFAULT));
  if (!state.finances.streams || !state.finances.streams.length) {
    state.finances.streams = Array(4).fill(null).map(() => ({ name: "", amount: 0 }));
  }
}

function save() {
  try { localStorage.setItem("lockedin_state", JSON.stringify(state)); } catch(e) {}
}

// Utility functions
function daysInMonth(m) { return new Date(YEAR, m + 1, 0).getDate(); }
function isPast(m, d) { return m < TODAY_M || (m === TODAY_M && d < TODAY_D); }
function isToday(m, d) { return m === TODAY_M && d === TODAY_D; }
function eKey(m, d, hid) { return `${m}-${d}-${hid}`; }
function getEntry(m, d, hid) { return state.entries[eKey(m, d, hid)] || ""; }
function setEntry(m, d, hid, v) { state.entries[eKey(m, d, hid)] = v; save(); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

// View switching
function switchView(id) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === id);
  });
  ['dashboard','tracker','goals','finances'].forEach(v => {
    document.getElementById('v-' + v).style.display = v === id ? 'block' : 'none';
  });
  if (id === 'dashboard') renderDashboard();
  if (id === 'tracker') renderTracker();
  if (id === 'goals') renderGoals();
  if (id === 'finances') renderFinances();
}

// Nav click handlers
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
```

**Step 2: Verify the shell loads**

Open `index.html` in browser. Should see:
- Dark background
- Gold "LOCKED IN" brand text in sticky nav
- 4 nav buttons (DASHBOARD active with gold underline)
- Empty content area below nav

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add LOCKED IN product shell — HTML, CSS, nav, state layer"
```

---

## Task 2: Onboarding Flow

**Files:**
- Modify: `C:\projects\goal-tracker\index.html` (onboarding overlay + init logic)

**What this builds:** A full-screen overlay shown on first visit. User enters their name and clicks "Lock In" to dismiss it. Sets `state.userName` and drops them into the dashboard.

**Step 1: Add onboarding overlay HTML**

Inside `<div id="onboarding">`:
```html
<div class="ob-backdrop">
  <div class="ob-card">
    <div class="ob-brand">LOCKED IN</div>
    <p class="ob-tagline">Track everything. Waste nothing.</p>
    <div class="ob-divider"></div>
    <label class="ob-label">WHAT'S YOUR NAME?</label>
    <input id="ob-name" class="ob-input" type="text" placeholder="Enter your name" maxlength="20" autofocus>
    <button id="ob-submit" class="ob-btn" disabled>LOCK IN →</button>
    <p class="ob-footer">Your data stays on this device. No account needed.</p>
  </div>
</div>
```

**Step 2: Add onboarding CSS**

```css
/* ONBOARDING */
.ob-backdrop{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.85);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:24px}
.ob-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:48px 40px;max-width:400px;width:100%;text-align:center;animation:fadeUp .5s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.ob-brand{color:var(--gold);font-family:'DM Mono',monospace;font-size:18px;font-weight:700;letter-spacing:4px;margin-bottom:8px}
.ob-tagline{color:var(--text2);font-size:13px;margin-bottom:24px}
.ob-divider{height:1px;background:var(--border);margin:0 auto 24px;width:60px}
.ob-label{display:block;color:var(--text2);font-size:10px;letter-spacing:2px;font-weight:500;margin-bottom:12px;text-align:left}
.ob-input{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:14px 16px;color:var(--text);font-size:15px;margin-bottom:20px;transition:border-color .2s}
.ob-input:focus{border-color:var(--gold)}
.ob-btn{width:100%;background:var(--gold);color:#0A0A0A;border:none;border-radius:8px;padding:14px;font-size:13px;font-weight:600;letter-spacing:2px;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.ob-btn:disabled{opacity:.3;cursor:default}
.ob-btn:not(:disabled):hover{filter:brightness(1.1)}
.ob-footer{color:var(--text3);font-size:11px;margin-top:16px}
```

**Step 3: Add onboarding JS logic**

```javascript
// Onboarding
function initOnboarding() {
  if (state.userName) {
    document.getElementById('onboarding').style.display = 'none';
    return;
  }
  document.getElementById('onboarding').style.display = 'block';
  const nameInput = document.getElementById('ob-name');
  const submitBtn = document.getElementById('ob-submit');

  nameInput.addEventListener('input', () => {
    submitBtn.disabled = !nameInput.value.trim();
  });
  submitBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) return;
    state.userName = name;
    save();
    document.getElementById('onboarding').style.display = 'none';
    renderDashboard();
  });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && nameInput.value.trim()) submitBtn.click();
  });
}
```

Call `initOnboarding()` at the end of the init section (after `load()`).

**Step 4: Verify**

- Clear localStorage, reload — should see blurred backdrop with centered card
- Type a name — button enables
- Click "LOCK IN" — overlay disappears, name saved
- Reload — overlay does NOT appear (name persists)

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add onboarding flow with name input"
```

---

## Task 3: Dashboard View

**Files:**
- Modify: `C:\projects\goal-tracker\index.html` (renderDashboard function + dashboard-specific CSS)

**What this builds:** The main "wow" screen — personalized greeting, Life Score (animated 0-100), 4 category stat cards, 7-day completion chart, and current streak counter.

**Step 1: Add dashboard-specific CSS**

```css
/* LIFE SCORE */
.life-score-wrap{text-align:center;padding:32px 0}
.life-score-num{font-size:72px;font-weight:300;font-family:'DM Mono',monospace;color:var(--gold);line-height:1;transition:all .5s}
.life-score-label{font-size:11px;color:var(--text2);letter-spacing:3px;margin-top:8px}
.life-score-ring{width:160px;height:160px;margin:0 auto;position:relative;display:flex;align-items:center;justify-content:center}
.life-score-ring svg{position:absolute;transform:rotate(-90deg)}
.life-score-ring circle{fill:none;stroke-width:4;stroke-linecap:round}
.life-score-ring .ring-bg{stroke:var(--border)}
.life-score-ring .ring-fill{stroke:var(--gold);transition:stroke-dashoffset .8s ease}

/* CATEGORY CARDS */
.cat-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
@media(max-width:500px){.cat-grid{grid-template-columns:1fr}}
.cat-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:20px;transition:border-color .2s;cursor:pointer}
.cat-card:hover{border-color:rgba(200,169,81,.2)}
.cat-card-header{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.cat-card-icon{font-size:18px}
.cat-card-name{font-size:10px;letter-spacing:2px;font-weight:500}
.cat-card-pct{font-size:28px;font-weight:300;font-family:'DM Mono',monospace}
.cat-card-sub{font-size:11px;color:var(--text3);margin-top:4px}

/* WEEKLY CHART */
.week-chart{display:flex;gap:6px;align-items:flex-end;height:60px;margin-top:12px}
.week-bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.week-bar-fill{width:100%;border-radius:3px;transition:height .3s;min-height:2px}
.week-bar-label{font-size:9px;font-family:'DM Mono',monospace;color:var(--text3)}
.week-bar-label.today{color:var(--gold);font-weight:600}

/* STREAK */
.streak-wrap{display:flex;align-items:center;gap:12px;margin-top:16px}
.streak-num{font-size:32px;font-weight:300;font-family:'DM Mono',monospace;color:var(--gold)}
.streak-text{font-size:12px;color:var(--text2)}
.streak-fire{font-size:24px}
```

**Step 2: Implement `renderDashboard()`**

```javascript
function renderDashboard() {
  // Calculate Life Score — average check completion % across all check habits for current month
  const checkHabits = HABITS.filter(h => h.type === "check");
  const m = TODAY_M;
  const daysThisMonth = daysInMonth(m);
  let totalPct = 0;
  checkHabits.forEach(h => {
    let done = 0;
    for (let d = 1; d <= Math.min(TODAY_D, daysThisMonth); d++) {
      if (getEntry(m, d, h.id) === "✓") done++;
    }
    totalPct += (TODAY_D > 0 ? done / TODAY_D : 0);
  });
  const lifeScore = checkHabits.length ? Math.round((totalPct / checkHabits.length) * 100) : 0;

  // Category percentages
  function catPct(catId) {
    const habits = HABITS.filter(h => h.cat === catId && h.type === "check");
    if (!habits.length) return 0;
    let total = 0;
    habits.forEach(h => {
      let done = 0;
      for (let d = 1; d <= Math.min(TODAY_D, daysThisMonth); d++) {
        if (getEntry(m, d, h.id) === "✓") done++;
      }
      total += (TODAY_D > 0 ? done / TODAY_D : 0);
    });
    return Math.round((total / habits.length) * 100);
  }

  // Weekly completion (last 7 days)
  const weekDays = [];
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(YEAR, TODAY_M, TODAY_D - i);
    const dm = dt.getMonth();
    const dd = dt.getDate();
    let done = 0, total = 0;
    checkHabits.forEach(h => {
      total++;
      if (getEntry(dm, dd, h.id) === "✓") done++;
    });
    weekDays.push({
      label: dayNames[dt.getDay()],
      pct: total ? done / total : 0,
      isToday: i === 0
    });
  }

  // Streak calculation — consecutive days (going backwards from yesterday) with >=80% completion
  let streak = 0;
  for (let i = 1; i < 365; i++) {
    const dt = new Date(YEAR, TODAY_M, TODAY_D - i);
    const dm = dt.getMonth();
    const dd = dt.getDate();
    if (dt.getFullYear() < YEAR) break;
    let done = 0, total = 0;
    checkHabits.forEach(h => { total++; if (getEntry(dm, dd, h.id) === "✓") done++; });
    if (total && (done / total) >= 0.8) streak++;
    else break;
  }

  // SVG ring
  const circumference = 2 * Math.PI * 72;
  const offset = circumference - (lifeScore / 100) * circumference;

  // Quotes array
  const quotes = [
    "Discipline is choosing between what you want now and what you want most.",
    "You don't rise to the level of your goals. You fall to the level of your systems.",
    "The only way to do great work is to love what you do.",
    "Small daily improvements are the key to staggering long-term results.",
    "Focus on being productive instead of busy.",
    "Success is the sum of small efforts repeated day in and day out.",
    "Your future is created by what you do today, not tomorrow.",
    "Champions keep playing until they get it right."
  ];
  const quoteIndex = Math.floor((NOW.getTime() / 86400000)) % quotes.length;

  let html = `
  <div style="margin-bottom:32px">
    <h1>Hey, ${esc(state.userName)} <span>· ${MONTHS[TODAY_M]} ${TODAY_D}</span></h1>
    <p class="quote">"${quotes[quoteIndex]}"</p>
  </div>

  <div class="card">
    <div class="life-score-wrap">
      <div class="life-score-ring">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle class="ring-bg" cx="80" cy="80" r="72"/>
          <circle class="ring-fill" cx="80" cy="80" r="72"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"/>
        </svg>
        <div>
          <div class="life-score-num">${lifeScore}</div>
          <div class="life-score-label">LIFE SCORE</div>
        </div>
      </div>
    </div>
  </div>

  <div class="cat-grid">`;

  CATEGORIES.forEach(cat => {
    const pct = catPct(cat.id);
    const pctColor = pct >= 80 ? 'var(--greenT)' : (pct >= 50 ? 'var(--gold)' : 'var(--text3)');
    const habitCount = HABITS.filter(h => h.cat === cat.id).length;
    html += `
    <div class="cat-card" onclick="switchView('tracker')">
      <div class="cat-card-header">
        <span class="cat-card-icon">${cat.icon}</span>
        <span class="cat-card-name" style="color:${cat.color}">${cat.name}</span>
      </div>
      <div class="cat-card-pct" style="color:${pctColor}">${pct}%</div>
      <div class="cat-card-sub">${habitCount} habits tracked</div>
      <div class="progress-track" style="margin-top:8px"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  });

  html += `</div>

  <div class="card">
    <span class="section-label">LAST 7 DAYS</span>
    <div class="week-chart">`;

  weekDays.forEach(d => {
    const h = Math.max(2, d.pct * 50);
    const bg = d.pct > 0 ? 'var(--gold)' : '#1A1A1A';
    html += `
    <div class="week-bar">
      <div class="week-bar-fill" style="height:${h}px;background:${bg}"></div>
      <span class="week-bar-label${d.isToday ? ' today' : ''}">${d.label}</span>
    </div>`;
  });

  html += `</div></div>

  <div class="card">
    <div class="streak-wrap">
      <span class="streak-fire">${streak > 0 ? '🔥' : '💤'}</span>
      <div>
        <div class="streak-num">${streak}</div>
        <div class="streak-text">${streak === 1 ? 'day' : 'days'} streak (80%+ completion)</div>
      </div>
    </div>
  </div>`;

  document.getElementById('v-dashboard').innerHTML = html;
}
```

**Step 3: Verify**

- Reload page, complete onboarding
- Dashboard shows: greeting with name + date, Life Score ring (0 initially), 4 category cards at 0%, empty weekly chart, 0 streak
- Click a category card — switches to tracker view

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add dashboard with Life Score, category cards, weekly chart, streak"
```

---

## Task 4: Tracker View

**Files:**
- Modify: `C:\projects\goal-tracker\index.html` (renderTracker function)

**What this builds:** Monthly habit tracking grid organized by category. Same grid pattern as existing tracker but with category headers, all 12 habits, month pills, and per-habit stats.

**Step 1: Add tracker-specific CSS**

Reuse these styles from the existing tracker (already in the CSS from Task 1):
- `.month-pills`, `.month-pill`, `.month-pill.active`
- `.tracker-wrap`, `.habit-row`, `.habit-label`
- `.day-header`, `.day-cell`, `.day-cell.done`, `.num-input`
- `.stat-cell`, `.pct-badge`, `.pct-high`, `.pct-mid`, `.pct-low`

Add new:
```css
/* CATEGORY HEADER in tracker */
.cat-header-row{display:flex;align-items:center;gap:8px;padding:10px 10px 6px;margin-top:12px}
.cat-header-row:first-child{margin-top:0}
.cat-header-dot{width:8px;height:8px;border-radius:50%}
.cat-header-text{font-size:10px;letter-spacing:2px;font-weight:500}
```

**Step 2: Implement `renderTracker()`**

```javascript
function renderTracker() {
  const m = state.currentMonth;
  const days = daysInMonth(m);

  let html = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px">
    <h1>${MONTHS[m]} <span>${YEAR}</span></h1>
    <div class="month-pills">`;

  MONTHS.forEach((mn, i) => {
    const active = i === m ? ' active' : '';
    const past = i < TODAY_M ? ' archived' : '';
    html += `<button class="month-pill${active}${past}" onclick="state.currentMonth=${i};save();renderTracker()">${mn}</button>`;
  });

  html += `</div></div><div class="tracker-wrap"><div style="min-width:600px">`;

  // Day headers row
  html += `<div style="display:flex;margin-bottom:2px"><div class="habit-label"></div>`;
  for (let d = 1; d <= days; d++) {
    const cls = isToday(m, d) ? 'today' : (isPast(m, d) ? 'past' : '');
    html += `<div class="day-header ${cls}">${d}</div>`;
  }
  html += `<div class="stat-cell" style="font-size:9px;color:var(--text3);letter-spacing:1px">TOT</div>`;
  html += `<div class="stat-cell" style="font-size:9px;color:var(--text3);letter-spacing:1px">%</div></div>`;

  // Render by category
  CATEGORIES.forEach(cat => {
    html += `<div class="cat-header-row">
      <div class="cat-header-dot" style="background:${cat.color}"></div>
      <span class="cat-header-text" style="color:${cat.color}">${cat.name}</span>
    </div>`;

    HABITS.filter(h => h.cat === cat.id).forEach(hab => {
      // Stats
      let count = 0;
      for (let d = 1; d <= days; d++) {
        const v = getEntry(m, d, hab.id);
        if (hab.type === "check") { if (v === "✓") count++; }
        else { count += parseFloat(v) || 0; }
      }
      const pct = hab.type === "check" ? (days ? count / days : 0) : count / days;
      const pctCls = pct >= .8 ? 'pct-high' : (pct >= .5 ? 'pct-mid' : 'pct-low');

      html += `<div class="habit-row"><div class="habit-label" style="background:inherit"><span class="icon">${hab.icon}</span><span class="name">${hab.name}</span></div>`;

      for (let d = 1; d <= days; d++) {
        const v = getEntry(m, d, hab.id);
        const past = isPast(m, d);
        const today = isToday(m, d);

        if (hab.type === "check") {
          const done = v === "✓";
          const cls = `day-cell${done ? ' done' : ''}${past && !done ? ' past-empty' : ''}${today ? ' today-border' : ''}`;
          html += `<div class="${cls}" onclick="toggleCheck(${m},${d},${hab.id})">`;
          if (done) html += `<span class="check">✓</span>`;
          else if (past) html += `<span style="color:var(--red);font-size:10px">·</span>`;
          html += `</div>`;
        } else {
          const cls = v ? 'num-input has-val' : 'num-input';
          const opSt = past && !v ? 'opacity:.35' : '';
          html += `<div class="day-cell${today ? ' today-border' : ''}" style="${opSt}"><input class="${cls}" value="${v}" oninput="setNum(${m},${d},${hab.id},this.value)" inputmode="decimal"></div>`;
        }
      }

      html += `<div class="stat-cell">${hab.type === "check" ? count : (count || "—")}</div>`;
      html += `<div class="stat-cell"><span class="pct-badge ${pctCls}">${hab.type === "check" ? Math.round(pct * 100) + "%" : count.toFixed(1)}</span></div>`;
      html += `</div>`;
    });
  });

  html += `</div></div>`;
  document.getElementById('v-tracker').innerHTML = html;
}

function toggleCheck(m, d, hid) {
  const k = eKey(m, d, hid);
  state.entries[k] = state.entries[k] === "✓" ? "" : "✓";
  save();
  renderTracker();
}

function setNum(m, d, hid, v) {
  setEntry(m, d, hid, v);
}
```

**Step 3: Verify**

- Click TRACKER nav — see month pills, category headers with colored dots, 12 habit rows
- Click cells to toggle checkmarks — green fill appears with ✓
- Enter numbers in Deep Work row
- Switch months — data persists per month
- Stats columns update in real time

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add tracker view with categorized habit grid"
```

---

## Task 5: Goals View

**Files:**
- Modify: `C:\projects\goal-tracker\index.html` (renderGoals function + add/edit goal capability)

**What this builds:** Goal tracking organized by category with status dropdowns, editable goal text, add/remove goals, and visual progress indicators.

**Step 1: Add goals-specific CSS**

```css
/* GOALS */
.goal-cat{font-size:11px;letter-spacing:2px;font-weight:500;margin-bottom:10px;margin-top:24px;display:flex;align-items:center;justify-content:space-between}
.goal-cat:first-child{margin-top:0}
.goal-row{display:flex;align-items:center;padding:10px 14px;border-radius:6px;margin-bottom:2px;gap:10px}
.goal-row:nth-child(odd){background:var(--surface)}
.goal-row:nth-child(even){background:var(--surface2)}
.goal-text-input{flex:1;background:transparent;border:none;color:var(--text);font-size:13px;font-family:'DM Sans',sans-serif}
.goal-text-input::placeholder{color:var(--text3)}
.goal-target-input{width:60px;background:transparent;border:1px solid var(--border);border-radius:4px;color:var(--text3);font-size:10px;font-family:'DM Mono',monospace;text-align:center;padding:4px}
.goal-select{background:var(--surface2);border:1px solid var(--border);border-radius:4px;font-size:11px;padding:5px 8px;font-family:'DM Mono',monospace;cursor:pointer;min-width:95px;color:var(--text)}
.goal-add-btn{background:transparent;border:1px dashed var(--border);border-radius:6px;padding:8px;color:var(--text3);font-size:12px;cursor:pointer;width:100%;margin-top:4px;transition:all .2s}
.goal-add-btn:hover{border-color:var(--gold);color:var(--gold)}
.goal-del{background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;padding:4px;opacity:.4;transition:opacity .2s}
.goal-del:hover{opacity:1;color:var(--redT)}
.goal-progress-bar{display:flex;gap:4px;margin-top:16px;margin-bottom:4px}
.goal-progress-segment{height:4px;border-radius:2px;flex:1}
```

**Step 2: Implement `renderGoals()`**

```javascript
function renderGoals() {
  let html = `<h1 style="margin-bottom:28px">Goals <span>${YEAR}</span></h1>`;

  state.goals.forEach((sec, si) => {
    // Count statuses for progress bar
    const done = sec.items.filter(g => g.s === 'Done').length;
    const inProg = sec.items.filter(g => g.s === 'In Progress').length;
    const notStarted = sec.items.filter(g => g.s === 'Not Started').length;

    html += `<div class="goal-cat"><span style="color:var(--gold)">${sec.cat.toUpperCase()}</span>
      <span class="mono" style="font-size:10px;color:var(--text3)">${done}/${sec.items.length} done</span></div>`;

    // Progress bar
    if (sec.items.length > 0) {
      html += `<div class="goal-progress-bar">`;
      sec.items.forEach(g => {
        const color = g.s === 'Done' ? 'var(--greenT)' : (g.s === 'In Progress' ? 'var(--gold)' : 'var(--border)');
        html += `<div class="goal-progress-segment" style="background:${color}"></div>`;
      });
      html += `</div>`;
    }

    sec.items.forEach((g, gi) => {
      const sc = g.s === 'Done' ? 'var(--greenT)' : (g.s === 'In Progress' ? 'var(--gold)' : 'var(--text3)');
      html += `<div class="goal-row">
        <input class="goal-text-input" value="${esc(g.t)}" placeholder="Enter a goal..."
          oninput="updGoalText(${si},${gi},this.value)">
        <input class="goal-target-input" value="${esc(g.d)}" placeholder="Q1"
          oninput="updGoalDate(${si},${gi},this.value)">
        <select class="goal-select" style="color:${sc}" onchange="updGoalStatus(${si},${gi},this.value)">
          <option${g.s === 'Not Started' ? ' selected' : ''}>Not Started</option>
          <option${g.s === 'In Progress' ? ' selected' : ''}>In Progress</option>
          <option${g.s === 'Done' ? ' selected' : ''}>Done</option>
        </select>
        <button class="goal-del" onclick="delGoal(${si},${gi})" title="Remove">×</button>
      </div>`;
    });

    html += `<button class="goal-add-btn" onclick="addGoal(${si})">+ Add Goal</button>`;
  });

  document.getElementById('v-goals').innerHTML = html;
}

function updGoalText(si, gi, v) { state.goals[si].items[gi].t = v; save(); }
function updGoalDate(si, gi, v) { state.goals[si].items[gi].d = v; save(); }
function updGoalStatus(si, gi, v) { state.goals[si].items[gi].s = v; save(); renderGoals(); }
function addGoal(si) { state.goals[si].items.push({ t: "", d: "Q2", s: "Not Started" }); save(); renderGoals(); }
function delGoal(si, gi) { state.goals[si].items.splice(gi, 1); save(); renderGoals(); }
```

**Step 3: Verify**

- Click GOALS nav — see 4 category sections with default goals
- Edit goal text inline — saves automatically
- Change status dropdown — color changes, progress bar updates
- Click "+" to add goals, "×" to remove
- Reload — all changes persist

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add goals view with editable goals, status tracking, progress bars"
```

---

## Task 6: Finances View

**Files:**
- Modify: `C:\projects\goal-tracker\index.html` (renderFinances function + finance-specific CSS)

**What this builds:** Simple money tracking dashboard — monthly income/expenses with a visual chart, savings goal progress, net worth tracker, and income stream list.

**Step 1: Add finance-specific CSS**

```css
/* FINANCES */
.fin-summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px}
@media(max-width:500px){.fin-summary{grid-template-columns:1fr}}
.fin-stat{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px;text-align:center}
.fin-stat-value{font-size:28px;font-weight:300;font-family:'DM Mono',monospace;margin-bottom:4px}
.fin-stat-label{font-size:10px;color:var(--text2);letter-spacing:1.5px}
.fin-month-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:14px}
@media(max-width:500px){.fin-month-grid{grid-template-columns:repeat(3,1fr)}}
.fin-month-cell{text-align:center}
.fin-month-label{font-size:9px;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:4px}
.fin-month-input{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:4px;font-size:11px;font-family:'DM Mono',monospace;text-align:center;padding:6px 2px}
.fin-month-input.income{color:var(--greenT)}
.fin-month-input.expense{color:var(--redT)}
.fin-month-input.networth{color:var(--gold)}
.stream-row{display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)}
.stream-row:last-child{border-bottom:none}
.stream-name{flex:1;background:transparent;border:none;color:var(--text);font-size:13px}
.stream-name::placeholder{color:var(--text3)}
.stream-amount{width:80px;background:transparent;border:none;color:var(--gold);font-family:'DM Mono',monospace;font-size:13px;text-align:right}
.stream-amount::placeholder{color:var(--text3)}
.savings-bar-track{background:#1A1A1A;border-radius:6px;height:10px;overflow:hidden;margin:12px 0}
.savings-bar-fill{background:linear-gradient(90deg,var(--gold),var(--greenT));height:100%;border-radius:6px;transition:width .5s}
```

**Step 2: Implement `renderFinances()`**

```javascript
function renderFinances() {
  const fin = state.finances;
  const thisMonthIncome = fin.income[TODAY_M] || 0;
  const thisMonthExpense = fin.expenses[TODAY_M] || 0;
  const net = thisMonthIncome - thisMonthExpense;
  const savingsPct = fin.savingsGoal ? Math.min(100, Math.round((fin.savingsCurrent / fin.savingsGoal) * 100)) : 0;
  const totalStreams = fin.streams.reduce((s, st) => s + (parseFloat(st.amount) || 0), 0);

  let html = `
  <h1 style="margin-bottom:24px">Finances <span>${MONTHS[TODAY_M]} ${YEAR}</span></h1>

  <div class="fin-summary">
    <div class="fin-stat">
      <div class="fin-stat-value" style="color:var(--greenT)">$${thisMonthIncome.toLocaleString()}</div>
      <div class="fin-stat-label">INCOME</div>
    </div>
    <div class="fin-stat">
      <div class="fin-stat-value" style="color:var(--redT)">$${thisMonthExpense.toLocaleString()}</div>
      <div class="fin-stat-label">EXPENSES</div>
    </div>
    <div class="fin-stat">
      <div class="fin-stat-value" style="color:${net >= 0 ? 'var(--greenT)' : 'var(--redT)'}">$${Math.abs(net).toLocaleString()}</div>
      <div class="fin-stat-label">${net >= 0 ? 'SURPLUS' : 'DEFICIT'}</div>
    </div>
  </div>

  <div class="card">
    <span class="section-label">SAVINGS GOAL</span>
    <div style="display:flex;align-items:baseline;gap:12px;margin-top:12px">
      <span style="color:var(--text2);font-size:12px">$</span>
      <input type="number" class="fin-month-input networth" style="width:100px;font-size:16px;padding:8px"
        value="${fin.savingsCurrent || ''}" placeholder="0"
        oninput="state.finances.savingsCurrent=parseFloat(this.value)||0;save();renderFinances()">
      <span style="color:var(--text3);font-size:13px">of $${fin.savingsGoal.toLocaleString()}</span>
      <span class="mono" style="color:var(--gold);font-size:12px;margin-left:auto">${savingsPct}%</span>
    </div>
    <div class="savings-bar-track"><div class="savings-bar-fill" style="width:${savingsPct}%"></div></div>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
      <span style="color:var(--text3);font-size:11px">Goal: $</span>
      <input type="number" class="fin-month-input networth" style="width:80px"
        value="${fin.savingsGoal || ''}" placeholder="5000"
        oninput="state.finances.savingsGoal=parseFloat(this.value)||0;save();renderFinances()">
    </div>
  </div>

  <div class="card">
    <span class="section-label">INCOME STREAMS</span>
    <div style="margin-top:14px">`;

  fin.streams.forEach((s, i) => {
    html += `<div class="stream-row">
      <span class="mono" style="color:var(--text3);font-size:11px;width:20px">${String(i + 1).padStart(2, '0')}</span>
      <input class="stream-name" value="${esc(s.name)}" placeholder="Income source..."
        oninput="state.finances.streams[${i}].name=this.value;save()">
      <span style="color:var(--text3);font-size:12px">$</span>
      <input type="number" class="stream-amount" value="${s.amount || ''}" placeholder="0"
        oninput="state.finances.streams[${i}].amount=parseFloat(this.value)||0;save()">
    </div>`;
  });

  html += `</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <span style="color:var(--text2);font-size:12px">Total monthly</span>
      <span class="mono" style="color:var(--gold);font-size:16px">$${totalStreams.toLocaleString()}</span>
    </div>
  </div>

  <div class="card">
    <span class="section-label">MONTHLY INCOME</span>
    <div class="fin-month-grid">`;

  MONTHS.forEach((mn, i) => {
    html += `<div class="fin-month-cell">
      <div class="fin-month-label">${mn}</div>
      <input type="number" class="fin-month-input income" value="${fin.income[i] || ''}" placeholder="—"
        oninput="state.finances.income[${i}]=parseFloat(this.value)||0;save()">
    </div>`;
  });

  html += `</div></div>

  <div class="card">
    <span class="section-label">MONTHLY EXPENSES</span>
    <div class="fin-month-grid">`;

  MONTHS.forEach((mn, i) => {
    html += `<div class="fin-month-cell">
      <div class="fin-month-label">${mn}</div>
      <input type="number" class="fin-month-input expense" value="${fin.expenses[i] || ''}" placeholder="—"
        oninput="state.finances.expenses[${i}]=parseFloat(this.value)||0;save()">
    </div>`;
  });

  html += `</div></div>

  <div class="card">
    <span class="section-label">NET WORTH</span>
    <div class="fin-month-grid">`;

  MONTHS.forEach((mn, i) => {
    html += `<div class="fin-month-cell">
      <div class="fin-month-label">${mn}</div>
      <input type="number" class="fin-month-input networth" value="${fin.netWorth[i] || ''}" placeholder="—"
        oninput="state.finances.netWorth[${i}]=parseFloat(this.value)||0;save()">
    </div>`;
  });

  html += `</div></div>`;

  document.getElementById('v-finances').innerHTML = html;
}
```

**Step 3: Verify**

- Click FINANCES nav — see 3 summary stat cards (all $0), savings bar, income streams, monthly grids
- Enter income/expense amounts — summary updates on reload (or re-navigate)
- Fill in income streams — total calculates
- Adjust savings current/goal — bar animates
- Reload — all data persists

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add finances view with income, expenses, savings, net worth"
```

---

## Task 7: Polish & Animations

**Files:**
- Modify: `C:\projects\goal-tracker\index.html`

**What this builds:** Cinematic polish — view transition animations, hover effects, number count-up animations on dashboard, smooth interactions. This is what makes the product look expensive in screen recordings.

**Step 1: Add animation CSS**

```css
/* VIEW TRANSITIONS */
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.container > div[style*="block"]{animation:fadeIn .3s ease}

/* CARD HOVER */
.card{transition:border-color .2s,transform .15s}
.card:hover{border-color:rgba(200,169,81,.12)}

/* HABIT CELL ANIMATIONS */
.day-cell{transition:all .12s}
.day-cell.done{animation:pop .2s ease}
@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}

/* NAV TRANSITION */
.nav-btn{transition:all .2s}

/* GOLD GLOW on focus for inputs */
input:focus{box-shadow:0 0 0 1px rgba(200,169,81,.15)}

/* SMOOTH SCROLLBAR */
*{scroll-behavior:smooth}
```

**Step 2: Add number count-up for Life Score**

After rendering dashboard, add a small script that animates the Life Score from 0 to its value:

```javascript
// At the end of renderDashboard(), after setting innerHTML:
setTimeout(() => {
  const scoreEl = document.querySelector('.life-score-num');
  if (!scoreEl) return;
  const target = lifeScore;
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    scoreEl.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 20);
}, 100);
```

**Step 3: Add click ripple effect on day cells**

```css
.day-cell{position:relative;overflow:hidden}
.day-cell::after{content:'';position:absolute;inset:0;background:rgba(200,169,81,.15);opacity:0;transition:opacity .2s}
.day-cell:active::after{opacity:1}
```

**Step 4: Verify**

- Navigate between views — content fades in smoothly
- Dashboard Life Score counts up from 0
- Clicking habit cells has a satisfying pop animation
- Cards have subtle border glow on hover
- Inputs get a gold glow on focus
- Overall feel: smooth, satisfying, premium

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add cinematic animations — view transitions, score count-up, hover effects"
```

---

## Task 8: Init Logic & Edge Cases

**Files:**
- Modify: `C:\projects\goal-tracker\index.html`

**What this builds:** The initialization flow that ties everything together, plus edge case handling.

**Step 1: Write the init block at the bottom of the script**

```javascript
// INIT
load();
initOnboarding();
if (state.userName) {
  renderDashboard();
}
```

**Step 2: Handle edge case — finances state migration**

In the `load()` function, ensure backwards compatibility if someone has partial state:
```javascript
// In load(), after merging state:
if (!state.finances) state.finances = { income: Array(12).fill(0), expenses: Array(12).fill(0), savingsGoal: 5000, savingsCurrent: 0, netWorth: Array(12).fill(0), streams: [] };
if (!state.finances.streams || !state.finances.streams.length) {
  state.finances.streams = Array(4).fill(null).map(() => ({ name: "", amount: 0 }));
}
if (!state.goals) state.goals = JSON.parse(JSON.stringify(GOALS_DEFAULT));
```

**Step 3: Verify complete flow**

1. Clear localStorage → reload → onboarding appears
2. Enter name → "LOCK IN" → dashboard renders with greeting
3. Navigate all 4 views — all render without errors
4. Enter data in tracker, goals, finances → reload → data persists
5. Life Score reflects tracker completion
6. Category cards reflect per-category stats
7. Mobile responsive — test at 375px width

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: complete init flow and edge case handling"
```

---

## Task 9: Deploy to Vercel

**Files:**
- No file changes — deployment only

**Step 1: Deploy**

```bash
cd C:\projects\goal-tracker
vercel --prod
```

**Step 2: Verify live site**

Open the Vercel URL in browser:
- Onboarding works
- All 4 views render
- Data persists in localStorage
- Mobile responsive
- Animations smooth

**Step 3: Commit any deploy config changes**

```bash
git add -A
git commit -m "chore: deploy LOCKED IN product to Vercel"
```

---

## Summary

| Task | What | Commit Message |
|------|------|---------------|
| 1 | Foundation — shell, CSS, nav, state | `feat: add LOCKED IN product shell` |
| 2 | Onboarding overlay | `feat: add onboarding flow` |
| 3 | Dashboard — Life Score, cards, chart, streak | `feat: add dashboard` |
| 4 | Tracker — categorized habit grid | `feat: add tracker view` |
| 5 | Goals — editable goals with status | `feat: add goals view` |
| 6 | Finances — income, expenses, savings, net worth | `feat: add finances view` |
| 7 | Polish — animations, transitions | `feat: add cinematic animations` |
| 8 | Init logic & edge cases | `feat: complete init flow` |
| 9 | Deploy to Vercel | `chore: deploy to Vercel` |
