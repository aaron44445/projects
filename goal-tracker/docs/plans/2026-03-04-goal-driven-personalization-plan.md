# Goal-Driven Personalization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make everything in LOCKED IN personalized and connected to the user's goals — habits link to goals, journal becomes a guided daily check-in, and day ratings feed into the life trajectory chart.

**Architecture:** Single HTML file (`index.html`), inline CSS + JS, Supabase for auth/data. Three main changes: (1) add `goalLink` field to habits + goal selector in edit mode + completion ring on goals page, (2) replace JOURNAL with CHECK-IN — 3-step daily flow, (3) feed day rating into life trajectory chart. All state changes backward-compatible via `ensureDefaults()`.

**Tech Stack:** Vanilla JS, CSS3, HTML5 Canvas, Supabase JS SDK v2, DM Sans + DM Mono fonts.

---

### Task 1: Add Goal Linking to Habits

**Files:**
- Modify: `C:\projects\goal-tracker\index.html`

**What changes:** Each habit gets an optional `goalLink` property (a string like `"0-1"` meaning section 0, goal item 1, or `""` for no link). The tracker edit mode shows a goal dropdown per habit. The goals page shows a completion ring per goal based on linked habits.

**Step 1: Update ensureDefaults() to init goalLink on habits**

At line ~395, after the habits seeding, add migration:

```javascript
// Inside ensureDefaults(), after the habits line:
state.habits.forEach(function(h) { if (h.goalLink === undefined) h.goalLink = ""; });
```

**Step 2: Build a flat goal list helper**

Add this utility function after `ensureDefaults()` (around line 398):

```javascript
function getGoalList() {
  var list = [];
  state.goals.forEach(function(sec, si) {
    sec.items.forEach(function(g, gi) {
      if (g.t.trim()) list.push({ key: si + "-" + gi, label: g.t, cat: sec.cat, si: si, gi: gi });
    });
  });
  return list;
}
```

**Step 3: Add goal selector to tracker edit mode**

In `renderTracker()`, inside the `editingHabits` block (line ~912), update each habit row to include a goal dropdown:

Replace the habit edit row HTML with:

```javascript
state.habits.filter(function(h) { return h.cat === cat.id; }).forEach(function(hab) {
  var goals = getGoalList();
  var goalOpts = '<option value="">No goal</option>';
  goals.forEach(function(g) {
    goalOpts += '<option value="' + g.key + '"' + (hab.goalLink === g.key ? ' selected' : '') + '>' + esc(g.label).substring(0, 25) + '</option>';
  });
  html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;margin-bottom:2px;background:var(--surface);border-radius:4px">' +
    '<input class="habit-name-input" value="' + esc(hab.name) + '" oninput="renameHabit(' + hab.id + ',this.value)">' +
    '<select class="goal-select" style="min-width:70px;font-size:9px;padding:3px 4px" onchange="linkHabitGoal(' + hab.id + ',this.value)">' + goalOpts + '</select>' +
    '<button class="habit-type-toggle" onclick="toggleHabitType(' + hab.id + ')">' + hab.type + '</button>' +
    '<button class="habit-del" onclick="removeHabit(' + hab.id + ')">&times;</button>' +
    '</div>';
});
```

**Step 4: Add linkHabitGoal function**

In the HABIT MANAGEMENT section (after `toggleHabitType`, around line 1022):

```javascript
function linkHabitGoal(habitId, goalKey) {
  var hab = state.habits.find(function(h) { return h.id === habitId; });
  if (hab) { hab.goalLink = goalKey; save(); }
}
```

**Step 5: Add goal completion % to renderGoals()**

In `renderGoals()`, for each goal item, calculate linked habit completion. After the goal category header and before rendering goal items, compute per-goal habit stats:

```javascript
sec.items.forEach(function(g, gi) {
  var goalKey = si + "-" + gi;
  var linked = state.habits.filter(function(h) { return h.goalLink === goalKey && h.type === "check"; });
  var habitPct = 0;
  if (linked.length > 0) {
    var totalDone = 0;
    linked.forEach(function(h) {
      var done = 0;
      for (var d = 1; d <= Math.min(TODAY_D, daysInMonth(TODAY_M)); d++) {
        if (getEntry(TODAY_M, d, h.id) === "\u2713") done++;
      }
      totalDone += (TODAY_D > 0 ? done / TODAY_D : 0);
    });
    habitPct = Math.round((totalDone / linked.length) * 100);
  }
  // ... existing goal row HTML, add habitPct display:
```

Add a small completion badge after the status select in each goal row:

```javascript
var habitBadge = linked.length > 0 ?
  '<span class="mono" style="font-size:9px;color:var(--gold);min-width:35px;text-align:center">' + habitPct + '%</span>' : '';
```

Insert `habitBadge` into the goal row HTML between the status select and the delete button.

**Step 6: Update addHabit to include goalLink**

In `addHabit()` (line ~999):

```javascript
state.habits.push({ id: maxId + 1, cat: catId, name: "New Habit", type: "check", goalLink: "" });
```

**Step 7: Commit**

```bash
git add index.html
git commit -m "feat: link habits to goals — goal selector in edit mode, completion % on goals page"
```

---

### Task 2: Replace Journal with Daily Check-In

**Files:**
- Modify: `C:\projects\goal-tracker\index.html`

**What changes:** The JOURNAL nav tab becomes CHECK-IN. The view container id stays `v-journal` (no HTML id change needed, just the nav label). The `state.journal` format changes from `{ "date": "text" }` to `{ "date": { rating: 7, reflection: "...", goalPulse: { "0-0": "On track", ... }, saved: true } }`. Old string entries are migrated.

**Step 1: Rename nav button**

Change line 251:
```html
<button class="nav-btn" data-view="journal">CHECK-IN</button>
```

**Step 2: Add check-in CSS**

Replace the `/* JOURNAL */` CSS block with:

```css
/* CHECK-IN */
.checkin-step{margin-bottom:24px}
.checkin-step-label{font-size:10px;letter-spacing:2px;font-weight:500;color:var(--text2);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.checkin-step-num{width:20px;height:20px;border-radius:50%;background:var(--surface2);border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-family:'DM Mono',monospace;color:var(--text3)}
.checkin-step-num.done{background:var(--gold);color:#0A0A0A;border-color:var(--gold)}
.rating-row{display:flex;gap:6px;flex-wrap:wrap}
.rating-btn{width:40px;height:40px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text2);font-size:14px;font-family:'DM Mono',monospace;cursor:pointer;transition:all .15s}
.rating-btn:hover{border-color:var(--gold);color:var(--gold)}
.rating-btn.active{background:var(--gold);color:#0A0A0A;border-color:var(--gold);font-weight:700}
.checkin-textarea{width:100%;min-height:120px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:14px;font-family:'DM Sans',sans-serif;line-height:1.8;padding:16px;resize:vertical}
.checkin-textarea:focus{outline:none;border-color:rgba(200,169,81,.3)}
.checkin-textarea::placeholder{color:var(--text3)}
.pulse-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:6px;margin-bottom:2px;background:var(--surface)}
.pulse-goal-name{flex:1;font-size:13px;color:var(--text)}
.pulse-select{background:var(--surface2);border:1px solid var(--border);border-radius:4px;font-size:10px;padding:5px 8px;font-family:'DM Mono',monospace;cursor:pointer;color:var(--text)}
.checkin-save{width:100%;background:var(--gold);color:#0A0A0A;border:none;border-radius:6px;padding:14px;font-size:12px;font-weight:600;letter-spacing:2px;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif;margin-top:8px}
.checkin-save:disabled{opacity:.3;cursor:default}
.checkin-save:not(:disabled):hover{filter:brightness(1.1)}
.past-checkin{cursor:pointer;margin-top:8px}
.past-checkin:hover{border-color:rgba(200,169,81,.15)}
.past-rating{font-size:24px;font-weight:300;font-family:'DM Mono',monospace;color:var(--gold)}
```

**Step 3: Add check-in prompts constant**

After the QUOTES array (line ~330):

```javascript
var CHECKIN_PROMPTS = [
  "What moved you closer to your goals today?",
  "What's one thing you'd do differently about today?",
  "What are you most grateful for right now?",
  "What challenged you today and how did you handle it?",
  "What's one small win you had today?",
  "How did your habits serve your goals today?",
  "What would make tomorrow even better?",
  "What did you learn about yourself today?"
];
```

**Step 4: Add check-in state migration in ensureDefaults()**

Replace `if (!state.journal) state.journal = {};` with:

```javascript
if (!state.checkins) state.checkins = {};
// Migrate old journal string entries to checkins
if (state.journal) {
  Object.keys(state.journal).forEach(function(k) {
    if (typeof state.journal[k] === "string" && state.journal[k].trim() && !state.checkins[k]) {
      state.checkins[k] = { rating: 0, reflection: state.journal[k], goalPulse: {}, saved: true };
    }
  });
}
```

**Step 5: Rewrite renderJournal() as renderCheckin()**

Replace the entire `// === JOURNAL ===` section with:

```javascript
// === CHECK-IN ===
var checkinDraft = { rating: 0, reflection: "", goalPulse: {} };

function renderCheckin() {
  var todayKey = YEAR + "-" + String(TODAY_M + 1).padStart(2, "0") + "-" + String(TODAY_D).padStart(2, "0");
  var existing = state.checkins[todayKey];
  var alreadySaved = existing && existing.saved;

  if (alreadySaved) {
    checkinDraft = { rating: existing.rating, reflection: existing.reflection, goalPulse: existing.goalPulse || {} };
  }

  var promptIndex = Math.floor((NOW.getTime() / 86400000)) % CHECKIN_PROMPTS.length;

  // Get active goals (not Done)
  var activeGoals = [];
  state.goals.forEach(function(sec, si) {
    sec.items.forEach(function(g, gi) {
      if (g.t.trim() && g.s !== "Done") {
        activeGoals.push({ key: si + "-" + gi, name: g.t, cat: sec.cat });
      }
    });
  });

  var html = '<h1 style="margin-bottom:24px">Check-in <span>' + MONTHS[TODAY_M] + ' ' + TODAY_D + '</span></h1>';

  if (alreadySaved) {
    html += '<div class="card" style="text-align:center;padding:32px">' +
      '<div class="past-rating" style="font-size:48px;margin-bottom:8px">' + existing.rating + '/10</div>' +
      '<div style="color:var(--text2);font-size:12px;margin-bottom:16px">Today\'s check-in saved</div>' +
      '<p style="color:var(--text);font-size:13px;line-height:1.6;text-align:left">' + esc(existing.reflection) + '</p></div>';
  } else {
    // Step 1: Rate
    html += '<div class="checkin-step"><div class="checkin-step-label">' +
      '<span class="checkin-step-num' + (checkinDraft.rating > 0 ? ' done' : '') + '">1</span> RATE YOUR DAY</div>' +
      '<div class="rating-row">';
    for (var r = 1; r <= 10; r++) {
      html += '<button class="rating-btn' + (checkinDraft.rating === r ? ' active' : '') + '" onclick="checkinDraft.rating=' + r + ';renderCheckin()">' + r + '</button>';
    }
    html += '</div></div>';

    // Step 2: Reflect
    html += '<div class="checkin-step"><div class="checkin-step-label">' +
      '<span class="checkin-step-num' + (checkinDraft.reflection.trim() ? ' done' : '') + '">2</span> REFLECT</div>' +
      '<textarea class="checkin-textarea" placeholder="' + CHECKIN_PROMPTS[promptIndex] + '" oninput="checkinDraft.reflection=this.value;updateCheckinBtn()">' + esc(checkinDraft.reflection) + '</textarea></div>';

    // Step 3: Goal pulse
    if (activeGoals.length > 0) {
      html += '<div class="checkin-step"><div class="checkin-step-label">' +
        '<span class="checkin-step-num' + (Object.keys(checkinDraft.goalPulse).length >= activeGoals.length ? ' done' : '') + '">3</span> GOAL PULSE</div>';
      activeGoals.forEach(function(g) {
        var val = checkinDraft.goalPulse[g.key] || "";
        html += '<div class="pulse-row">' +
          '<span class="pulse-goal-name">' + esc(g.name).substring(0, 40) + '</span>' +
          '<select class="pulse-select" onchange="checkinDraft.goalPulse[\'' + g.key + '\']=this.value;updateCheckinBtn()">' +
          '<option value=""' + (!val ? ' selected' : '') + '>--</option>' +
          '<option value="Crushing it"' + (val === "Crushing it" ? ' selected' : '') + '>Crushing it</option>' +
          '<option value="On track"' + (val === "On track" ? ' selected' : '') + '>On track</option>' +
          '<option value="Struggling"' + (val === "Struggling" ? ' selected' : '') + '>Struggling</option>' +
          '<option value="Stalled"' + (val === "Stalled" ? ' selected' : '') + '>Stalled</option>' +
          '</select></div>';
      });
      html += '</div>';
    }

    // Save button
    var canSave = checkinDraft.rating > 0 && checkinDraft.reflection.trim();
    html += '<button id="checkin-save-btn" class="checkin-save"' + (canSave ? '' : ' disabled') + ' onclick="saveCheckin()">SAVE CHECK-IN</button>';
  }

  // Past check-ins
  var pastKeys = Object.keys(state.checkins)
    .filter(function(k) { return k !== todayKey && state.checkins[k].saved; })
    .sort(function(a, b) { return b.localeCompare(a); });

  if (pastKeys.length > 0) {
    html += '<div style="margin-top:32px"><span class="section-label">PAST CHECK-INS</span></div>';
    pastKeys.forEach(function(key) {
      var ci = state.checkins[key];
      var dt = new Date(key + "T00:00:00");
      var dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dt.getDay()];
      var preview = ci.reflection ? (ci.reflection.length > 100 ? ci.reflection.substring(0, 100) + "..." : ci.reflection) : "";
      html += '<div class="card past-checkin" onclick="expandCheckin(\'' + key + '\')">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
        '<span class="past-rating">' + (ci.rating || "?") + '</span>' +
        '<span class="mono" style="font-size:10px;color:var(--gold)">' + dayName + ' ' + key + '</span>' +
        '</div>' +
        '<p style="font-size:13px;color:var(--text2);line-height:1.6" id="checkin-text-' + key + '">' + esc(preview) + '</p>' +
        '</div>';
    });
  }

  document.getElementById("v-journal").innerHTML = html;
}

function updateCheckinBtn() {
  var btn = document.getElementById("checkin-save-btn");
  if (btn) btn.disabled = !(checkinDraft.rating > 0 && checkinDraft.reflection.trim());
}

function saveCheckin() {
  var todayKey = YEAR + "-" + String(TODAY_M + 1).padStart(2, "0") + "-" + String(TODAY_D).padStart(2, "0");
  state.checkins[todayKey] = {
    rating: checkinDraft.rating,
    reflection: checkinDraft.reflection,
    goalPulse: checkinDraft.goalPulse,
    saved: true
  };
  save();
  renderCheckin();
}

function expandCheckin(key) {
  var el = document.getElementById("checkin-text-" + key);
  if (el && state.checkins[key]) el.textContent = state.checkins[key].reflection;
}
```

**Step 6: Update switchView()**

Change `if (id === "journal") renderJournal();` to:
```javascript
if (id === "journal") renderCheckin();
```

**Step 7: Update signOut() to clear checkins**

The sign-out function already clears `v-journal` innerHTML. No change needed there. But reset the draft:

Add after the state reset in `signOut()`:
```javascript
checkinDraft = { rating: 0, reflection: "", goalPulse: {} };
```

**Step 8: Commit**

```bash
git add index.html
git commit -m "feat: daily check-in flow — rate, reflect, goal pulse replaces journal"
```

---

### Task 3: Feed Day Rating into Life Trajectory Chart

**Files:**
- Modify: `C:\projects\goal-tracker\index.html`

**What changes:** The `drawLifeChart()` function now draws TWO lines when check-in ratings exist: the gold life score line (habit completion %) AND a second line for day ratings (1-10 scaled to 0-100). This shows both objective (habit %) and subjective (how you felt) data.

**Step 1: Update drawLifeChart() to include day ratings**

After gathering `points` (the life score points), gather rating points:

```javascript
var ratingPoints = [];
for (var i = 29; i >= 0; i--) {
  var dt = new Date(YEAR, TODAY_M, TODAY_D - i);
  var key = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
  var ci = state.checkins ? state.checkins[key] : null;
  if (ci && ci.rating) ratingPoints.push({ x: 29 - i, val: ci.rating * 10, date: key });
}
```

**Step 2: Draw second line for ratings**

After drawing the gold life score line, add:

```javascript
if (ratingPoints.length >= 2) {
  var rCoords = ratingPoints.map(function(p) {
    return {
      x: padL + (p.x / 29) * chartW,
      y: padT + chartH - (p.val / 100) * chartH,
      val: p.val
    };
  });

  ctx.beginPath();
  ctx.strokeStyle = "rgba(107,203,119,.5)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.lineJoin = "round";
  rCoords.forEach(function(c, i) {
    if (i === 0) ctx.moveTo(c.x, c.y);
    else ctx.lineTo(c.x, c.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  var rLast = rCoords[rCoords.length - 1];
  ctx.fillStyle = "rgba(107,203,119,.7)";
  ctx.font = "9px 'DM Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText(Math.round(rLast.val / 10) + "/10", rLast.x + 6, rLast.y + 3);
}
```

**Step 3: Update the "track 2+ days" message**

Change the empty state message to also mention check-ins:

```javascript
ctx.fillText("Track for 2+ days to see your trajectory", W / 2, H / 2);
```

No change needed — the message already works for both.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: day ratings on life trajectory chart — dashed green line alongside habit score"
```

---

### Task 4: Final Polish & Deploy

**Files:**
- Modify: `C:\projects\goal-tracker\index.html`

**Step 1: Ensure ensureDefaults() has all migrations**

Verify `ensureDefaults()` handles:
- `state.checkins` — init if missing
- `state.habits[].goalLink` — init to "" if missing
- Old `state.journal` string entries — migrate to `state.checkins`

**Step 2: Update handleSignUp() to init new fields**

In the sign-up handler, after state initialization, add:
```javascript
state.checkins = {};
```

**Step 3: Validate JS syntax**

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('C:/projects/goal-tracker/index.html','utf8');const m=html.match(/<script>([\\s\\S]*?)<\\/script>/);if(m){try{new Function(m[1]);console.log('OK')}catch(e){console.log('ERROR:',e.message)}}"
```

**Step 4: Deploy**

```bash
npx vercel --prod --yes
```

**Step 5: Verify in browser**

1. Dashboard — life trajectory chart still works
2. Tracker — EDIT mode shows goal dropdown per habit
3. Goals — linked habits show completion %
4. Check-in — 3-step flow (rate, reflect, goal pulse), SAVE button, past entries
5. Finances — unchanged, still works

**Step 6: Commit**

```bash
git add index.html
git commit -m "polish: state migration, deploy goal-driven personalization"
```
