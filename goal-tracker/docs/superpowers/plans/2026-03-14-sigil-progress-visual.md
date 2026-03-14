# Sigil Progress Visual — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sacred geometry SVG sigil at the top of the dashboard that visualizes rolling 7-day habit progress across 4 categories, with tappable quadrant detail panels.

**Architecture:** Pure inline SVG with CSS transitions inside the existing single-file `index.html`. A new `calcSigilData()` function computes 7-day rolling stats per category. A new `renderSigil()` function creates the SVG once and mutates it on updates to preserve CSS transition capability. The sigil is inserted above the existing dashboard content.

**Tech Stack:** Vanilla HTML/CSS/JS, inline SVG, CSS transitions

---

## File Structure

All changes are in two existing files:

| File | Changes |
|------|---------|
| `index.html` | Add sigil CSS (~40 lines after line 127). Add `calcSigilData()` function (~40 lines before `renderDashboard`). Add `renderSigil()` function (~120 lines before `renderDashboard`). Modify `renderDashboard()` to call `renderSigil()` and preserve the sigil DOM node. |
| `sw.js` | Bump `forged-v7` → `forged-v8` |

## Chunk 1: CSS + Data Calculation

### Task 1: Add Sigil CSS

**Files:**
- Modify: `index.html:127` (insert after the mobile tracker hero CSS block, before `/* Mobile weekly tracker */` comment at line 128)

- [ ] **Step 1: Add sigil CSS block**

Insert this CSS after line 127 (after the `.trk-hero` mobile media query closing brace) and before the `/* Mobile weekly tracker */` comment:

```css
/* SIGIL */
.sigil-wrap{display:flex;flex-direction:column;align-items:center;padding:12px 0 8px;margin-bottom:4px}
.sigil-svg{max-width:280px;width:100%}
.sigil-svg *{transition:all .6s ease}
.sigil-node-hit{cursor:pointer;fill:transparent}
@keyframes sigil-pulse{0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
.sigil-pulse{animation:sigil-pulse .4s ease;transform-origin:center;transform-box:fill-box}
.sigil-detail{max-height:0;overflow:hidden;opacity:0;transition:max-height .3s ease,opacity .3s ease;width:100%;max-width:280px}
.sigil-detail.open{max-height:300px;opacity:1}
.sigil-detail-inner{padding:12px 0}
.sigil-detail-hdr{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.sigil-detail-dot{width:6px;height:6px;border-radius:50%}
.sigil-detail-name{font-size:9px;letter-spacing:2px;font-family:'DM Mono',monospace}
.sigil-detail-pct{font-size:9px;font-family:'DM Mono',monospace;color:var(--text2);margin-left:auto}
.sigil-detail-bars{display:flex;gap:3px;align-items:flex-end;height:32px;margin-bottom:10px}
.sigil-detail-bar{flex:1;background:rgba(255,255,255,.04);border-radius:2px;min-height:2px;transition:height .3s ease}
.sigil-detail-habits{display:flex;flex-direction:column;gap:4px}
.sigil-detail-habit{display:flex;justify-content:space-between;align-items:center;font-size:9px;color:var(--text3)}
.sigil-detail-habit-pct{font-family:'DM Mono',monospace;font-size:8px}
@media(max-width:600px){
.sigil-svg{max-width:240px}
.sigil-detail{max-width:100%}
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "style: add sigil CSS for sacred geometry visualization"
```

---

### Task 2: Add `calcSigilData()` Function

**Files:**
- Modify: `index.html:1082` (insert new function before `renderDashboard` at line 1084)

This function computes the rolling 7-day completion percentage for each active category, plus per-day and per-habit breakdowns for the detail panel.

- [ ] **Step 1: Add `calcSigilData()` before `renderDashboard()`**

Insert before line 1084 (`function renderDashboard() {`):

```javascript
function calcSigilData() {
  var today = new Date(YEAR, TODAY_M, TODAY_D);
  var cats = {};
  CATEGORIES.forEach(function(c) {
    if (!isCatActive(c.id)) return;
    cats[c.id] = { done: 0, total: 0, days: [], habits: [] };
    for (var i = 0; i < 7; i++) cats[c.id].days.push({ done: 0, total: 0 });
  });
  var checkHabits = state.habits.filter(function(h) { return h.type === "check" && cats[h.cat]; });
  // Per-habit tracking
  var habitStats = {};
  checkHabits.forEach(function(h) { habitStats[h.id] = { name: h.name, cat: h.cat, done: 0 }; });
  for (var i = 0; i < 7; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var m = d.getMonth();
    var dd = d.getDate();
    checkHabits.forEach(function(h) {
      cats[h.cat].total++;
      cats[h.cat].days[6 - i].total++;
      if (getEntry(m, dd, h.id) === "\u2713") {
        cats[h.cat].done++;
        cats[h.cat].days[6 - i].done++;
        habitStats[h.id].done++;
      }
    });
  }
  var activeCats = Object.keys(cats);
  var pcts = {};
  activeCats.forEach(function(id) {
    pcts[id] = cats[id].total > 0 ? cats[id].done / cats[id].total : 0;
  });
  var overall = 0;
  if (activeCats.length > 0) {
    activeCats.forEach(function(id) { overall += pcts[id]; });
    overall /= activeCats.length;
  }
  // Attach habit list per category
  activeCats.forEach(function(id) {
    cats[id].habits = checkHabits.filter(function(h) { return h.cat === id; }).map(function(h) {
      return { name: h.name, pct: habitStats[h.id].done / 7 };
    });
  });
  return { cats: cats, pcts: pcts, overall: overall, activeCats: activeCats };
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add calcSigilData() for 7-day rolling category stats"
```

---

## Chunk 2: SVG Rendering + DOM Persistence

### Task 3: Add `renderSigil()` Function

**Files:**
- Modify: `index.html` (insert after `calcSigilData`, before `renderDashboard`)

This function creates the sigil SVG on first call, then mutates existing elements on subsequent calls so CSS transitions fire.

- [ ] **Step 1: Add `renderSigil()` after `calcSigilData()`**

Insert after the `calcSigilData` function, before `renderDashboard`:

```javascript
var _sigilOpenCat = null;
var _sigilNode = null; // persistent DOM reference for re-attachment

function renderSigil(container) {
  var data = calcSigilData();
  var isFirstRender = !_sigilNode;

  // Category geometry: id -> {cx, cy, nx, ny, labelX, labelY, labelAnchor}
  var geo = {
    money:  { cx:100, cy:70,  nx:100, ny:45,  lx:100, ly:35,  la:"middle" },
    body:   { cx:130, cy:100, nx:155, ny:100, lx:168, ly:103, la:"start" },
    mind:   { cx:100, cy:130, nx:100, ny:155, lx:100, ly:170, la:"middle" },
    spirit: { cx:70,  cy:100, nx:45,  ny:100, lx:32,  ly:103, la:"end" }
  };
  var catColors = { money:"#C8A951", body:"#6BCB77", mind:"#7B8CDE", spirit:"#C77DBA" };
  var circumference = 2 * Math.PI * 45; // inner circle r=45

  if (isFirstRender) {
    // === FIRST RENDER: build full SVG ===
    _sigilNode = document.createElement("div");
    _sigilNode.id = "sigil-wrap";
    _sigilNode.className = "sigil-wrap";

    var svg = '<svg class="sigil-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">';
    // Outer circle
    svg += '<circle cx="100" cy="100" r="85" fill="none" stroke="#C8A951" stroke-width="0.5" opacity="0.15" data-sigil="outer"/>';
    // Inner circles
    data.activeCats.forEach(function(id) {
      var g = geo[id];
      svg += '<circle data-sigil-circle="' + id + '" cx="' + g.cx + '" cy="' + g.cy + '" r="45" fill="none" stroke="' + catColors[id] + '" stroke-width="0.8" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + circumference + '" stroke-opacity="0.08"/>';
    });
    // Center diamond — approximate intersections of adjacent inner circles
    var diamondPts = "100,62 138,100 100,138 62,100";
    svg += '<polygon data-sigil="diamond" points="' + diamondPts + '" fill="#C8A951" fill-opacity="0.02" stroke="#C8A951" stroke-width="0.5" stroke-opacity="0.1"/>';
    // Quadrant lines
    var lines = [
      { from: [100,62], to: [138,100], id: "money" },
      { from: [138,100], to: [100,138], id: "body" },
      { from: [100,138], to: [62,100], id: "mind" },
      { from: [62,100], to: [100,62], id: "spirit" }
    ];
    lines.forEach(function(l) {
      if (data.activeCats.indexOf(l.id) === -1) return;
      svg += '<line data-sigil-line="' + l.id + '" x1="' + l.from[0] + '" y1="' + l.from[1] + '" x2="' + l.to[0] + '" y2="' + l.to[1] + '" stroke="' + catColors[l.id] + '" stroke-width="1" opacity="0.1"/>';
    });
    // Node dots
    data.activeCats.forEach(function(id) {
      var g = geo[id];
      svg += '<circle data-sigil-node="' + id + '" cx="' + g.nx + '" cy="' + g.ny + '" r="2" fill="' + catColors[id] + '" fill-opacity="0.3"/>';
      // Hit target (invisible, larger)
      svg += '<circle class="sigil-node-hit" data-sigil-hit="' + id + '" cx="' + g.nx + '" cy="' + g.ny + '" r="20" onclick="toggleSigilDetail(\'' + id + '\')"/>';
    });
    // Center dot
    svg += '<circle data-sigil="center" cx="100" cy="100" r="1" fill="#C8A951" fill-opacity="0.2"/>';
    // Labels
    data.activeCats.forEach(function(id) {
      var g = geo[id];
      var catObj = CATEGORIES.find(function(c) { return c.id === id; });
      svg += '<text data-sigil-label="' + id + '" x="' + g.lx + '" y="' + g.ly + '" text-anchor="' + g.la + '" fill="' + catColors[id] + '" font-size="7" font-family="DM Mono, monospace" opacity="0.5">' + catObj.name + '</text>';
    });
    svg += '</svg>';
    // Detail panel
    svg += '<div class="sigil-detail" id="sigil-detail"><div class="sigil-detail-inner" id="sigil-detail-inner"></div></div>';
    _sigilNode.innerHTML = svg;
  }

  // Re-attach (whether first render or re-render after innerHTML wipe)
  container.prepend(_sigilNode);

  // === UPDATE: mutate existing SVG elements (transitions fire because DOM nodes persist) ===
  var updateDelay = isFirstRender ? 600 : 50;
  setTimeout(function() {
    data.activeCats.forEach(function(id) {
      var pct = data.pcts[id];
      var circle = _sigilNode.querySelector('[data-sigil-circle="' + id + '"]');
      if (circle) {
        circle.setAttribute("stroke-opacity", 0.08 + pct * 0.42);
        circle.setAttribute("stroke-dashoffset", circumference * (1 - pct));
      }
      var line = _sigilNode.querySelector('[data-sigil-line="' + id + '"]');
      if (line) line.setAttribute("opacity", 0.1 + pct * 0.6);
      var node = _sigilNode.querySelector('[data-sigil-node="' + id + '"]');
      if (node) {
        node.setAttribute("r", 2 + pct * 3);
        node.setAttribute("fill-opacity", 0.3 + pct * 0.7);
      }
    });
    var diamond = _sigilNode.querySelector('[data-sigil="diamond"]');
    if (diamond) diamond.setAttribute("fill-opacity", 0.02 + data.overall * 0.1);
    var center = _sigilNode.querySelector('[data-sigil="center"]');
    if (center) {
      center.setAttribute("r", 1 + data.overall * 2);
      center.setAttribute("fill-opacity", 0.2 + data.overall * 0.6);
    }
  }, updateDelay);

  // Update detail panel if open
  if (_sigilOpenCat && data.activeCats.indexOf(_sigilOpenCat) !== -1) {
    _renderSigilDetail(_sigilOpenCat, data);
  }
}

function toggleSigilDetail(catId) {
  var panel = document.getElementById("sigil-detail");
  if (!panel) return;
  if (_sigilOpenCat === catId) {
    panel.classList.remove("open");
    _sigilOpenCat = null;
    return;
  }
  _sigilOpenCat = catId;
  var data = calcSigilData();
  _renderSigilDetail(catId, data);
  panel.classList.add("open");
  // Pulse the node
  var node = document.querySelector('[data-sigil-node="' + catId + '"]');
  if (node) {
    node.classList.remove("sigil-pulse");
    void node.offsetWidth;
    node.classList.add("sigil-pulse");
  }
}

function _renderSigilDetail(catId, data) {
  var inner = document.getElementById("sigil-detail-inner");
  if (!inner) return;
  var catColors = { money:"#C8A951", body:"#6BCB77", mind:"#7B8CDE", spirit:"#C77DBA" };
  var catObj = CATEGORIES.find(function(c) { return c.id === catId; });
  var catData = data.cats[catId];
  if (!catData) return;
  var pct = Math.round(data.pcts[catId] * 100);
  var dayNames = ["M","T","W","T","F","S","S"];
  var today = new Date(YEAR, TODAY_M, TODAY_D);
  var html = '<div class="sigil-detail-hdr">' +
    '<span class="sigil-detail-dot" style="background:' + catColors[catId] + '"></span>' +
    '<span class="sigil-detail-name" style="color:' + catColors[catId] + '">' + catObj.name + '</span>' +
    '<span class="sigil-detail-pct">' + pct + '%</span></div>';
  // 7-day bars
  html += '<div class="sigil-detail-bars">';
  for (var i = 0; i < 7; i++) {
    var dayData = catData.days[i];
    var dayPct = dayData.total > 0 ? dayData.done / dayData.total : 0;
    var h = Math.max(2, dayPct * 30);
    var d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">' +
      '<div class="sigil-detail-bar" style="height:' + h + 'px;background:' + (dayPct > 0 ? catColors[catId] : 'rgba(255,255,255,.04)') + ';opacity:' + (dayPct > 0 ? '0.5' : '1') + ';width:100%"></div>' +
      '<span style="font-size:7px;font-family:DM Mono,monospace;color:var(--text3)">' + dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1] + '</span></div>';
  }
  html += '</div>';
  // Habit list
  html += '<div class="sigil-detail-habits">';
  catData.habits.forEach(function(h) {
    html += '<div class="sigil-detail-habit"><span>' + esc(h.name) + '</span><span class="sigil-detail-habit-pct" style="color:' + catColors[catId] + '">' + Math.round(h.pct * 100) + '%</span></div>';
  });
  html += '</div>';
  inner.innerHTML = html;
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add renderSigil() with SVG generation, DOM persistence, and detail panel"
```

---

### Task 4: Integrate Sigil into Dashboard Rendering

**Files:**
- Modify: `index.html:1311` (the `renderDashboard` innerHTML assignment and post-render logic)

The sigil must survive `renderDashboard()` re-renders. The `_sigilNode` variable holds a persistent reference to the sigil DOM node. Before overwriting innerHTML, detach it. After innerHTML is set, `renderSigil()` re-attaches the same node and updates its values — CSS transitions fire because the DOM nodes are the same objects.

- [ ] **Step 1: Modify `renderDashboard()` to preserve and call sigil**

Find this block at line 1311:

```javascript
  document.getElementById("v-dashboard").innerHTML = html;
```

Replace with:

```javascript
  var dashEl = document.getElementById("v-dashboard");
  if (_sigilNode && _sigilNode.parentNode) _sigilNode.remove();
  dashEl.innerHTML = html;
  renderSigil(dashEl);
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: integrate sigil into dashboard render cycle with DOM persistence"
```

---

## Chunk 3: Cache Bump + Cleanup

### Task 5: Bump Service Worker Cache

**Files:**
- Modify: `sw.js:1`

- [ ] **Step 1: Update cache version**

Change line 1 from:
```javascript
var CACHE_NAME = 'forged-v7';
```
To:
```javascript
var CACHE_NAME = 'forged-v8';
```

- [ ] **Step 2: Commit**

```bash
git add sw.js
git commit -m "chore: bump service worker cache to v8 for sigil feature"
```

---

### Task 6: Manual Verification

No code changes. Verify the feature works correctly.

- [ ] **Step 1: Verify desktop rendering**

Open the app in a browser at the deployed URL or localhost. Navigate to the dashboard. Confirm:
- The sigil appears at the top, centered
- Outer circle is faintly visible
- Inner circles draw proportionally to 7-day category completion
- Node dots are sized proportionally to category progress
- Category labels appear at cardinal points in correct colors

- [ ] **Step 2: Verify tap interaction**

Click/tap a node dot. Confirm:
- Detail panel slides open below the sigil
- Shows category name, color dot, percentage
- Shows 7-day bar chart
- Shows habit list with individual percentages
- Clicking same node closes the panel
- Clicking a different node switches to that category

- [ ] **Step 3: Verify mobile rendering**

Resize browser to <600px. Confirm:
- Sigil container shrinks to max-width 240px
- Detail panel is full-width
- Cells are not pushed off screen

- [ ] **Step 4: Verify animation**

Navigate to tracker, check off a habit, navigate back to dashboard. Confirm:
- Sigil elements transition smoothly to new values (not a jump)
- Node dot pulses briefly when detail panel is opened

- [ ] **Step 5: Verify disabled categories**

Go to Settings, disable a category. Return to dashboard. Confirm:
- Disabled category's quadrant (circle, line, node, label) is not shown
- Remaining categories still display correctly

- [ ] **Step 6: Deploy**

```bash
npx vercel --prod --yes
```
