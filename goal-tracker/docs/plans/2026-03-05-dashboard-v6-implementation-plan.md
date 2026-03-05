# Dashboard V6 "The Score" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Tree of Life hero visualization with a typography-first dashboard where the life score number is the hero element, improve the Life Trajectory chart (taller, auto-scaled Y, smooth curves), improve weekly bars, and upgrade the quote bank to 40+ curated quotes with attribution.

**Architecture:** Single-file app (index.html, ~2200 lines). All changes are CSS modifications, HTML template changes in `renderDashboard()`, JS function rewrites for `drawLifeChart()`, and data changes to the `QUOTES` array. No state structure changes.

**Tech Stack:** Vanilla HTML/CSS/JS, Canvas 2D API, DM Sans + DM Mono fonts

---

## Task 1: Replace QUOTES Array with Curated Quote Bank

**Files:**
- Modify: `index.html:369-378` (QUOTES array)

**Step 1: Replace the QUOTES array**

Find the current array (line 369-378):
```javascript
var QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  ...
  "Champions keep playing until they get it right."
];
```

Replace with a 40+ entry array of `{ text, author }` objects:
```javascript
var QUOTES = [
  { text: "You're one satisfying meal away from being back on track. You're one hard workout away from feeling like yourself again.", author: "Alex Hormozi" },
  { text: "The reason you're not where you want to be is you're not willing to do what it takes to get there.", author: "Alex Hormozi" },
  { text: "Most people want to be successful. Few are willing to do the boring work that success requires.", author: "Alex Hormozi" },
  { text: "If you're not embarrassed by the first version, you've launched too late.", author: "Alex Hormozi" },
  { text: "The thing standing between you and the life you want is the story you keep telling yourself.", author: "Alex Hormozi" },
  { text: "Volume negates luck. Do more and eventually the odds work in your favor.", author: "Alex Hormozi" },
  { text: "If it were easy, everyone would do it. The difficulty is the point.", author: "Alex Hormozi" },
  { text: "Stop waiting for motivation. Discipline is doing it when you don't feel like it.", author: "Alex Hormozi" },
  { text: "The entrepreneur who can delay gratification longest wins.", author: "Alex Hormozi" },
  { text: "You don't need more information. You need more action.", author: "Alex Hormozi" },
  { text: "Most people overestimate what they can do in a day, and underestimate what they can do in a year.", author: "Alex Hormozi" },
  { text: "The goal isn't to be perfect. The goal is to be better than yesterday.", author: "Alex Hormozi" },
  { text: "Free is the most expensive thing you'll ever get. Invest in yourself.", author: "Alex Hormozi" },
  { text: "Revenue solves all known problems.", author: "Alex Hormozi" },
  { text: "The best time to start was yesterday. The second best time is now.", author: "Alex Hormozi" },
  { text: "You can't be afraid to go to war with yourself. That's where the growth is.", author: "David Goggins" },
  { text: "Suffering is the true test of life. The more you seek the uncomfortable, the more comfortable you'll become.", author: "David Goggins" },
  { text: "Nobody cares what you did yesterday. What have you done today to better yourself?", author: "David Goggins" },
  { text: "The only way you're going to get to the other side of this journey is by suffering. You can't grow without it.", author: "David Goggins" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "David Goggins" },
  { text: "We live in a world where mediocrity is rewarded. Don't settle for it.", author: "David Goggins" },
  { text: "You are in danger of living a life so comfortable and soft that you will die without ever realizing your potential.", author: "David Goggins" },
  { text: "The most important conversation you'll ever have is the one you have with yourself.", author: "David Goggins" },
  { text: "Discipline equals freedom.", author: "Jocko Willink" },
  { text: "Don't expect to be motivated every day. You won't be. Don't count on motivation. Count on discipline.", author: "Jocko Willink" },
  { text: "The moment you accept total responsibility for everything in your life is the moment you claim the power to change anything.", author: "Jocko Willink" },
  { text: "There is no shortcut. There is no hack. There is only the work.", author: "Jocko Willink" },
  { text: "Default aggressive. Take the initiative. Go.", author: "Jocko Willink" },
  { text: "Free yourself from the opinions of other people. It's the most powerful thing you can do.", author: "Naval Ravikant" },
  { text: "Desire is a contract you make with yourself to be unhappy until you get what you want.", author: "Naval Ravikant" },
  { text: "A fit body, a calm mind, a house full of love. These things cannot be bought — they must be earned.", author: "Naval Ravikant" },
  { text: "The most important skill for getting rich is becoming a perpetual learner.", author: "Naval Ravikant" },
  { text: "Spend more time making the big decisions. There are basically three: where you live, who you're with, and what you do.", author: "Naval Ravikant" },
  { text: "The obstacle is the way.", author: "Marcus Aurelius" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Your habits will determine your future. Choose them wisely.", author: "Andrew Huberman" },
  { text: "Dopamine is not about pleasure. It's about motivation and drive toward goals.", author: "Andrew Huberman" },
  { text: "Ideas are easy. Implementation is hard. Execution is everything.", author: "Gary Vaynerchuk" },
  { text: "Stop overthinking. Just do. The market will tell you if you're right.", author: "Gary Vaynerchuk" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "James Clear" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" }
];
```

**Step 2: Update quote rendering references**

There are two places that reference `QUOTES`:

1. The header snippet (line ~929): Change `QUOTES[quoteIndex].substring(0, 42)` to `QUOTES[quoteIndex].text.substring(0, 42)`

2. The bottom quote section: Currently rendered as (approximately line 1000+, at the end of the dashboard HTML):
   Find where the quote class is rendered and replace the simple text with attributed format:
   ```javascript
   // Quote at bottom with attribution
   html += '<div class="quote-block"><div class="quote-text">\u201C' + QUOTES[quoteIndex].text + '\u201D</div>' +
     '<div class="quote-author">\u2014 ' + QUOTES[quoteIndex].author + '</div></div>';
   ```

**Step 3: Add CSS for quote block**

Add after `.dash-section-label` (near line 257):
```css
.quote-block{padding:16px 0 24px;text-align:center}
.quote-text{color:#444;font-size:11px;font-style:italic;font-family:'DM Mono',monospace;line-height:1.7;max-width:500px;margin:0 auto 8px}
.quote-author{color:var(--gold);font-size:9px;letter-spacing:2px;font-family:'DM Mono',monospace}
```

**Step 4: Commit**
```
git add index.html
git commit -m "feat: upgrade quote bank to 40+ curated quotes with attribution"
```

---

## Task 2: Remove Tree of Life Code

**Files:**
- Modify: `index.html`

This task removes ~380 lines of dead code. Do it in one clean cut.

**Step 1: Remove tree CSS**

Delete lines 230-232:
```css
/* DASHBOARD V4 — TREE OF LIFE */
.tree-wrap{position:relative;width:100%;height:320px;margin-bottom:4px}
.tree-canvas{width:100%;height:100%;display:block}
```

**Step 2: Remove tree HTML from renderDashboard**

In `renderDashboard()`, find and delete the tree canvas line (~line 933):
```javascript
  html += '<div class="tree-wrap"><canvas id="tree-canvas" class="tree-canvas"></canvas></div>';
```

**Step 3: Remove tree drawing call and demo data**

In `renderDashboard()`, find and delete the block from line ~1028 to ~1068:
```javascript
  // Draw tree of life
  var treeData = computeTreeData();
  if (DEMO) {
    treeData = {
      overall30: 0.88, overall7: 0.92,
      branches: [
        ...all the demo branch data...
      ]
    };
  }
  setTimeout(function() {
    drawTreeOfLife(treeData);
  }, 30);
```

**Step 4: Remove computeTreeData function**

Delete the entire function from line ~1224 to ~1303:
```javascript
// === TREE DATA ===
function computeTreeData() {
  ...
}
```

**Step 5: Remove drawTreeOfLife function**

Delete the entire function from line ~1305 to ~1584:
```javascript
// === TREE OF LIFE ===
function drawTreeOfLife(treeData) {
  ...
}
```

**Step 6: Commit**
```
git add index.html
git commit -m "refactor: remove Tree of Life rendering code (~380 lines)"
```

---

## Task 3: Rebuild Hero Zone — The Score

**Files:**
- Modify: `index.html`

**Step 1: Replace dashboard CSS for hero zone**

Replace the old score/ring CSS block (lines ~233-244):
```css
.dash-score-zone{text-align:center;padding:10px 0 6px}
.dash-score-num{font-size:48px;font-weight:300;font-family:'DM Mono',monospace;color:var(--gold);line-height:1}
.dash-score-status{font-size:11px;letter-spacing:3px;font-weight:600;font-family:'DM Mono',monospace;margin-top:3px}
.stat-pills{display:flex;gap:6px;justify-content:center;margin-top:8px;flex-wrap:wrap}
.stat-pill{background:var(--surface2);border:1px solid var(--border);border-radius:16px;padding:5px 14px;font-size:10px;font-family:'DM Mono',monospace;color:var(--text2);display:flex;align-items:center;gap:5px}
.stat-pill strong{color:var(--gold);font-weight:600}
.cat-rings{display:flex;justify-content:space-around;padding:12px 0 6px}
.cat-ring-item{text-align:center;cursor:pointer}
.cat-ring-item:hover .cat-ring-label{color:var(--text)}
.cat-ring-svg{display:block;margin:0 auto 4px}
.cat-ring-pct{font-size:16px;font-weight:400;font-family:'DM Mono',monospace}
.cat-ring-label{font-size:9px;letter-spacing:1.5px;color:var(--text3);transition:color .2s}
```

With:
```css
.score-hero{text-align:center;padding:28px 0 12px}
.score-num{font-size:100px;font-weight:300;font-family:'DM Mono',monospace;color:var(--gold);line-height:1;text-shadow:0 0 40px rgba(200,169,81,0.25)}
.score-num.glow-high{text-shadow:0 0 60px rgba(200,169,81,0.35)}
.score-status{font-size:11px;letter-spacing:4px;font-weight:600;font-family:'DM Mono',monospace;margin-top:6px}
.cat-scores{display:flex;justify-content:space-around;padding:16px 0 12px}
.cat-score-item{text-align:center}
.cat-score-label{font-size:8px;letter-spacing:2px;color:#444;font-weight:500;margin-bottom:4px}
.cat-score-num{font-size:26px;font-weight:400;font-family:'DM Mono',monospace}
.stat-pills{display:flex;gap:6px;justify-content:center;margin-top:8px;flex-wrap:wrap}
.stat-pill{background:var(--surface2);border:1px solid var(--border);border-radius:16px;padding:5px 14px;font-size:10px;font-family:'DM Mono',monospace;color:var(--text2);display:flex;align-items:center;gap:5px}
.stat-pill strong{color:var(--gold);font-weight:600}
@media(max-width:500px){.score-num{font-size:72px}.cat-score-num{font-size:22px}}
```

**Step 2: Rebuild hero zone HTML in renderDashboard**

Find the current score zone + category rings HTML (lines ~935-962, from `// 3. Score + Status` through `html += '</div>';` after the category rings loop).

Replace it with:
```javascript
  // 2. The Score (Hero)
  var glowClass = lifeScore >= 80 ? ' glow-high' : '';
  html += '<div class="score-hero">' +
    '<div id="dash-score-num" class="score-num' + glowClass + '">0</div>' +
    '<div class="score-status" style="color:' + statusColor + '">' + statusLabel + '</div></div>';

  // 3. Category Scores
  html += '<div class="cat-scores">';
  CATEGORIES.forEach(function(cat) {
    var pct = catPct(cat.id);
    html += '<div class="cat-score-item">' +
      '<div class="cat-score-label">' + cat.name + '</div>' +
      '<div class="cat-score-num" style="color:' + cat.color + '">' + pct + '%</div></div>';
  });
  html += '</div>';

  // 4. Stat Pills
  html += '<div class="stat-pills">' +
    '<div class="stat-pill"><strong>' + todayDone + '/' + todayTotal + '</strong> TODAY</div>' +
    '<div class="stat-pill"><strong>' + streak + '</strong> STREAK</div>' +
    '<div class="stat-pill"><strong>' + todayMood + '</strong> MOOD</div>' +
    '</div>';
```

**Step 3: Verify the count-up animation still works**

The existing count-up code (lines ~1070-1082) references `document.getElementById("dash-score-num")` — the new HTML still uses this ID, so the animation should work without changes. Verify the target element exists.

**Step 4: Commit**
```
git add index.html
git commit -m "feat: rebuild dashboard hero zone with typography-first score display"
```

---

## Task 4: Improve Weekly Bars

**Files:**
- Modify: `index.html`

**Step 1: Update weekly bar CSS**

Find the current `.week-float` CSS (lines ~248-253):
```css
.week-float{display:flex;gap:5px;align-items:flex-end;height:72px;padding:4px 0}
.week-float-bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.week-float-pct{font-size:9px;font-family:'DM Mono',monospace;color:var(--text3);min-height:12px}
.week-float-fill{width:100%;border-radius:3px;transition:height .3s;min-height:2px}
.week-float-day{font-size:9px;font-family:'DM Mono',monospace;color:var(--text3)}
.week-float-day.today{color:var(--gold);font-weight:600}
```

Replace with:
```css
.week-float{display:flex;gap:8px;align-items:flex-end;height:80px;padding:4px 0}
.week-float-bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.week-float-pct{font-size:9px;font-family:'DM Mono',monospace;color:var(--text3);min-height:12px}
.week-float-fill{width:100%;border-radius:4px 4px 0 0;transition:height .3s;min-height:2px}
.week-float-fill.today-bar{box-shadow:0 0 8px rgba(200,169,81,0.3)}
.week-float-day{font-size:9px;font-family:'DM Mono',monospace;color:var(--text3)}
.week-float-day.today{color:var(--gold);font-weight:600}
```

**Step 2: Update weekly bar HTML generation**

In `renderDashboard()`, find the weekly bars generation loop (~line 984-990). Update the `week-float-fill` div to add a `today-bar` class when it's today:

Change:
```javascript
weekDays.forEach(function(wd) {
    var h = Math.max(2, wd.pct * 52);
    html += '<div class="week-float-bar">' +
      '<span class="week-float-pct">' + (wd.pct > 0 ? Math.round(wd.pct * 100) + '%' : '') + '</span>' +
      '<div class="week-float-fill" style="height:' + h + 'px;background:' + (wd.pct > 0 ? 'linear-gradient(to top,rgba(200,169,81,.45),var(--gold))' : '#1A1A1A') + '"></div>' +
      '<span class="week-float-day' + (wd.isToday ? ' today' : '') + '">' + wd.label + '</span></div>';
});
```

To:
```javascript
weekDays.forEach(function(wd) {
    var h = Math.max(2, wd.pct * 68);
    var todayCls = wd.isToday ? ' today-bar' : '';
    html += '<div class="week-float-bar">' +
      '<span class="week-float-pct">' + (wd.pct > 0 ? Math.round(wd.pct * 100) + '%' : '') + '</span>' +
      '<div class="week-float-fill' + todayCls + '" style="height:' + h + 'px;background:' + (wd.pct > 0 ? 'linear-gradient(to top,rgba(200,169,81,.45),var(--gold))' : '#1A1A1A') + '"></div>' +
      '<span class="week-float-day' + (wd.isToday ? ' today' : '') + '">' + wd.label + '</span></div>';
});
```

Key changes: height multiplier 52 -> 68 (taller bars), added `today-bar` class for glow effect.

**Step 3: Commit**
```
git add index.html
git commit -m "style: improve weekly bars — taller, wider gaps, glow on today"
```

---

## Task 5: Rewrite Life Trajectory Chart

**Files:**
- Modify: `index.html`

This is the most complex task. The `drawLifeChart()` function (~lines 1095-1222) gets rewritten for: auto-scaled Y axis, smooth bezier curves, taller canvas, endpoint glow.

**Step 1: Update the canvas height in renderDashboard**

Find the trajectory canvas HTML (~line 1002-1003):
```javascript
  html += '<div class="dash-divider"></div><span class="dash-section-label">LIFE TRAJECTORY</span>' +
    '<canvas id="life-chart" style="width:100%;height:150px;margin-top:4px"></canvas>';
```

Change height from 150px to 220px:
```javascript
  html += '<div class="dash-divider"></div><span class="dash-section-label">LIFE TRAJECTORY</span>' +
    '<canvas id="life-chart" style="width:100%;height:220px;margin-top:4px"></canvas>';
```

**Step 2: Rewrite drawLifeChart function**

Replace the entire `drawLifeChart()` function (lines ~1095-1222) with:

```javascript
function drawLifeChart() {
  var canvas = document.getElementById("life-chart");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  var W = rect.width;
  var H = rect.height;

  // Collect data points (life score + mood)
  var points = [];
  for (var i = 29; i >= 0; i--) {
    var dt = new Date(YEAR, TODAY_M, TODAY_D - i);
    var key = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
    var val = state.lifeScoreHistory[key];
    if (val !== undefined) points.push({ x: 29 - i, val: val, date: key });
  }

  if (points.length < 2) {
    ctx.fillStyle = "#333";
    ctx.font = "12px 'DM Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Track for 2+ days to see your trajectory", W / 2, H / 2);
    return;
  }

  var padL = 36, padR = 16, padT = 20, padB = 24;
  var chartW = W - padL - padR;
  var chartH = H - padT - padB;

  // Auto-scale Y axis: find data range with 10% padding
  var dataMin = 100, dataMax = 0;
  points.forEach(function(p) {
    if (p.val < dataMin) dataMin = p.val;
    if (p.val > dataMax) dataMax = p.val;
  });
  var range = dataMax - dataMin;
  if (range < 10) range = 10; // minimum range to avoid flat line
  var yPad = Math.max(5, Math.round(range * 0.15));
  var yMin = Math.max(0, dataMin - yPad);
  var yMax = Math.min(100, dataMax + yPad);
  var yRange = yMax - yMin;

  // Helper: map value to Y coordinate
  function valToY(v) {
    return padT + chartH - ((v - yMin) / yRange) * chartH;
  }

  // Grid lines at nice intervals
  var gridStep = yRange <= 20 ? 5 : (yRange <= 50 ? 10 : 25);
  var gridStart = Math.ceil(yMin / gridStep) * gridStep;
  for (var gv = gridStart; gv <= yMax; gv += gridStep) {
    var gy = valToY(gv);
    ctx.strokeStyle = "rgba(255,255,255,.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, gy);
    ctx.lineTo(W - padR, gy);
    ctx.stroke();
    ctx.fillStyle = "#333";
    ctx.font = "9px 'DM Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(gv, padL - 6, gy + 3);
  }

  // Map points to coordinates
  var maxIdx = Math.max(1, points.length - 1);
  var coords = points.map(function(p, i) {
    return { x: padL + (i / maxIdx) * chartW, y: valToY(p.val), val: p.val };
  });

  // Gradient fill under curve (using smooth path)
  function drawSmoothPath(pts) {
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
      return;
    }
    for (var si = 0; si < pts.length - 1; si++) {
      var p0 = pts[Math.max(0, si - 1)];
      var p1 = pts[si];
      var p2 = pts[si + 1];
      var p3 = pts[Math.min(pts.length - 1, si + 2)];
      // Catmull-Rom to cubic bezier control points
      var cp1x = p1.x + (p2.x - p0.x) / 6;
      var cp1y = p1.y + (p2.y - p0.y) / 6;
      var cp2x = p2.x - (p3.x - p1.x) / 6;
      var cp2y = p2.y - (p3.y - p1.y) / 6;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }

  // Fill area under curve
  var grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
  grad.addColorStop(0, "rgba(200,169,81,.18)");
  grad.addColorStop(1, "rgba(200,169,81,0)");
  ctx.beginPath();
  ctx.moveTo(coords[0].x, padT + chartH);
  ctx.lineTo(coords[0].x, coords[0].y);
  drawSmoothPath(coords);
  ctx.lineTo(coords[coords.length - 1].x, padT + chartH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw smooth line
  ctx.beginPath();
  ctx.strokeStyle = "#C8A951";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  drawSmoothPath(coords);
  ctx.stroke();

  // Data point dots (small)
  coords.forEach(function(c) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = "#C8A951";
    ctx.fill();
  });

  // Endpoint glow — larger dot with radial glow
  var last = coords[coords.length - 1];
  var glowGrad = ctx.createRadialGradient(last.x, last.y, 2, last.x, last.y, 12);
  glowGrad.addColorStop(0, "rgba(200,169,81,0.6)");
  glowGrad.addColorStop(1, "rgba(200,169,81,0)");
  ctx.beginPath();
  ctx.arc(last.x, last.y, 12, 0, Math.PI * 2);
  ctx.fillStyle = glowGrad;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#C8A951";
  ctx.fill();

  // Score label at endpoint
  ctx.fillStyle = "#C8A951";
  ctx.font = "bold 11px 'DM Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText(last.val + "%", last.x - 10, last.y - 10);

  // Day rating line (from check-ins) — dashed green line
  var ratingPoints = [];
  for (var ri = 29; ri >= 0; ri--) {
    var rdt = new Date(YEAR, TODAY_M, TODAY_D - ri);
    var rkey = rdt.getFullYear() + "-" + String(rdt.getMonth() + 1).padStart(2, "0") + "-" + String(rdt.getDate()).padStart(2, "0");
    var ci = state.checkins ? state.checkins[rkey] : null;
    if (ci && ci.rating) ratingPoints.push({ x: 29 - ri, val: ci.rating * 10, date: rkey });
  }

  if (ratingPoints.length >= 2) {
    var rMaxIdx = Math.max(1, ratingPoints.length - 1);
    var rCoords = ratingPoints.map(function(p, ri2) {
      return { x: padL + (ri2 / rMaxIdx) * chartW, y: valToY(p.val), val: p.val };
    });

    ctx.beginPath();
    ctx.strokeStyle = "rgba(107,203,119,.5)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.lineJoin = "round";
    drawSmoothPath(rCoords);
    ctx.stroke();
    ctx.setLineDash([]);

    var rLast = rCoords[rCoords.length - 1];
    ctx.fillStyle = "rgba(107,203,119,.7)";
    ctx.font = "9px 'DM Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(Math.round(rLast.val / 10) + "/10", rLast.x + 6, rLast.y + 3);
  }
}
```

Key improvements:
- **Auto-scaled Y axis** — `yMin`/`yMax` computed from data with padding, not fixed 0-100
- **Smooth curves** — Catmull-Rom spline converted to cubic bezier for organic flow
- **Dynamic grid lines** — step size adapts to data range (5, 10, or 25)
- **Endpoint glow** — radial gradient behind the last data point
- **Larger drawing area** — 220px canvas height (70px more than before)

**Step 3: Commit**
```
git add index.html
git commit -m "feat: rewrite Life Trajectory chart — auto-scaled Y, smooth curves, endpoint glow"
```

---

## Task 6: Update Quote Rendering at Bottom

**Files:**
- Modify: `index.html`

**Step 1: Find and update the bottom quote rendering**

In `renderDashboard()`, find the current quote at the bottom. Look for the `.quote` class usage. It's near the end of the HTML build. Replace the simple quote text with the new attributed format.

Find something like:
```javascript
  html += '<div class="quote">\u201C' + QUOTES[quoteIndex] + '\u201D</div>';
```

Replace with:
```javascript
  html += '<div class="quote-block"><div class="quote-text">\u201C' + QUOTES[quoteIndex].text + '\u201D</div>' +
    '<div class="quote-author">\u2014 ' + QUOTES[quoteIndex].author + '</div></div>';
```

Also remove or keep the old `.quote` CSS class — it can stay since it won't conflict.

**Step 2: Update header quote snippet**

In the header line HTML (line ~929), update the QUOTES reference to use the new object format:

Find:
```javascript
QUOTES[quoteIndex].substring(0, 42)
```

Replace with:
```javascript
QUOTES[quoteIndex].text.substring(0, 42)
```

**Step 3: Commit**
```
git add index.html
git commit -m "style: update quote rendering with full display and attribution"
```

---

## Task 7: Final Polish and Verification

**Files:**
- Modify: `index.html`

**Step 1: Verify all QUOTES references are updated**

Search the file for any remaining `QUOTES[` references that might not use the `.text` property. Fix any found.

**Step 2: Verify DEMO mode still works**

The DEMO mode overrides (lines ~786-797) use `catPct()` and `lifeScore` — these shouldn't be affected since we didn't change the computation logic. But verify the demo overrides are intact and the dashboard renders correctly in demo mode.

**Step 3: Verify the count-up animation target**

The count-up animation (lines ~1070-1082) targets `document.getElementById("dash-score-num")`. Our new hero HTML uses `id="dash-score-num"` on the score element. Verify these match.

**Step 4: Clean up any dead CSS**

Check if these CSS classes are still used anywhere in the rendered HTML. If not, remove them:
- `.cat-card`, `.cat-card-header`, `.cat-card-name`, `.cat-card-pct`, `.cat-card-sub` (if only used by old dashboard cards that were replaced in previous versions)
- `.life-score-wrap`, `.life-score-num`, `.life-score-label`, `.life-score-ring` (V1 remnants)

**Step 5: Commit**
```
git add index.html
git commit -m "polish: clean up dead CSS, verify DEMO mode and animations"
```

---

## Summary

| Task | What | Lines Changed (est.) |
|------|------|---------------------|
| 1 | Quote bank upgrade | +80, -10 |
| 2 | Remove Tree of Life code | -380 |
| 3 | Rebuild hero zone | +30, -30 |
| 4 | Improve weekly bars | +8, -6 |
| 5 | Rewrite Life Trajectory | +90, -80 |
| 6 | Update quote rendering | +5, -3 |
| 7 | Final polish | +0, -20 |

**Net effect:** ~300 fewer lines of code, dramatically simpler dashboard, premium typography-first aesthetic.
