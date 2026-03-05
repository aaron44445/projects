/**
 * Locked In Wallpapers — Generator
 *
 * Generates 25 dark-mode productivity wallpapers:
 *   5 themes x 5 sizes = 25 PNGs
 *
 * Themes: Locked In, Deep Focus, Night Grind, Clean Slate, Flow State
 * Sizes:  Desktop HD, Desktop 2K, Desktop 4K, Phone (iPhone 15 Pro), Tablet (iPad)
 */

const { createCanvas, createImageData } = require("canvas");
const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) — deterministic output every run
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------
const SIZES = [
  { name: "1920x1080", w: 1920, h: 1080 },
  { name: "2560x1440", w: 2560, h: 1440 },
  { name: "3840x2160", w: 3840, h: 2160 },
  { name: "1290x2796", w: 1290, h: 2796 },
  { name: "2048x2732", w: 2048, h: 2732 },
];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Scale factor relative to 1920x1080 (by total pixel area) */
function scaleFactor(w, h) {
  return Math.sqrt((w * h) / (1920 * 1080));
}

/** Hex colour to {r,g,b} */
function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Linearly interpolate between two hex colours */
function lerpColor(hex1, hex2, t) {
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}

// ---------------------------------------------------------------------------
// Theme 1: Locked In
//   Near-black bg with geometric grid. Thin lines, glowing cyan intersections.
// ---------------------------------------------------------------------------
function renderLockedIn(ctx, w, h, rand) {
  const sf = scaleFactor(w, h);

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);

  // Grid spacing scales with resolution
  const spacing = Math.round(60 * sf);
  const cols = Math.ceil(w / spacing);
  const rows = Math.ceil(h / spacing);

  // Draw grid lines — very subtle
  ctx.strokeStyle = "rgba(30, 30, 30, 0.5)";
  ctx.lineWidth = Math.max(1, 0.5 * sf);

  for (let c = 0; c <= cols; c++) {
    const x = c * spacing;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = r * spacing;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Secondary finer grid (half-spacing) — even more subtle
  ctx.strokeStyle = "rgba(22, 22, 22, 0.3)";
  ctx.lineWidth = Math.max(0.5, 0.3 * sf);
  const halfSpacing = spacing / 2;
  for (let c = 0; c <= cols * 2; c++) {
    const x = c * halfSpacing;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let r = 0; r <= rows * 2; r++) {
    const y = r * halfSpacing;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Glowing cyan intersection points
  const glowCount = Math.round(8 + 6 * sf);
  for (let i = 0; i < glowCount; i++) {
    const col = Math.floor(rand() * cols);
    const row = Math.floor(rand() * rows);
    const x = col * spacing;
    const y = row * spacing;
    const intensity = 0.3 + rand() * 0.5;
    const radius = (8 + rand() * 16) * sf;

    // Outer glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, `rgba(0, 212, 255, ${intensity * 0.8})`);
    grad.addColorStop(0.3, `rgba(0, 212, 255, ${intensity * 0.3})`);
    grad.addColorStop(1, "rgba(0, 212, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

    // Bright core dot
    const coreR = Math.max(1, 1.5 * sf);
    ctx.beginPath();
    ctx.arc(x, y, coreR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 212, 255, ${Math.min(1, intensity + 0.3)})`;
    ctx.fill();
  }

  // A few extra dim dots at random grid intersections for texture
  const dimDotCount = Math.round(20 * sf);
  for (let i = 0; i < dimDotCount; i++) {
    const col = Math.floor(rand() * cols);
    const row = Math.floor(rand() * rows);
    const x = col * spacing;
    const y = row * spacing;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, 0.8 * sf), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 212, 255, ${0.05 + rand() * 0.12})`;
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Theme 2: Deep Focus
//   Solid dark bg with a single centred focal circle — subtle glow ring.
// ---------------------------------------------------------------------------
function renderDeepFocus(ctx, w, h, rand) {
  const sf = scaleFactor(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const minDim = Math.min(w, h);

  // Background
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, w, h);

  // Very subtle radial vignette from centre
  const vigR = minDim * 0.8;
  const vig = ctx.createRadialGradient(cx, cy, 0, cx, cy, vigR);
  vig.addColorStop(0, "rgba(18, 18, 22, 0.6)");
  vig.addColorStop(1, "rgba(13, 13, 13, 0)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Main circle — subtle gradient fill
  const circleR = minDim * 0.22;
  const circGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, circleR);
  circGrad.addColorStop(0, "rgba(22, 24, 30, 1)");
  circGrad.addColorStop(0.7, "rgba(16, 17, 22, 1)");
  circGrad.addColorStop(1, "rgba(13, 13, 15, 0.9)");
  ctx.beginPath();
  ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
  ctx.fillStyle = circGrad;
  ctx.fill();

  // Inner ring glow
  const ringWidth = Math.max(1, 1.2 * sf);
  ctx.beginPath();
  ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(90, 110, 140, 0.15)";
  ctx.lineWidth = ringWidth * 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(90, 110, 140, 0.3)";
  ctx.lineWidth = ringWidth;
  ctx.stroke();

  // Outer glow ring
  const outerR = circleR + 20 * sf;
  const outerGlow = ctx.createRadialGradient(cx, cy, circleR - 5 * sf, cx, cy, outerR);
  outerGlow.addColorStop(0, "rgba(70, 90, 130, 0)");
  outerGlow.addColorStop(0.5, "rgba(70, 90, 130, 0.04)");
  outerGlow.addColorStop(1, "rgba(70, 90, 130, 0)");
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = outerGlow;
  ctx.fill();

  // Second concentric ring — larger, dimmer
  const ring2R = circleR * 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, ring2R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(70, 90, 130, 0.06)";
  ctx.lineWidth = Math.max(0.5, 0.7 * sf);
  ctx.stroke();

  // Third concentric ring — even larger, barely visible
  const ring3R = circleR * 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, ring3R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(70, 90, 130, 0.03)";
  ctx.lineWidth = Math.max(0.5, 0.5 * sf);
  ctx.stroke();

  // Centre dot — bright focal point
  const dotR = Math.max(2, 3 * sf);
  const dotGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, dotR * 6);
  dotGlow.addColorStop(0, "rgba(120, 150, 200, 0.3)");
  dotGlow.addColorStop(1, "rgba(120, 150, 200, 0)");
  ctx.fillStyle = dotGlow;
  ctx.fillRect(cx - dotR * 6, cy - dotR * 6, dotR * 12, dotR * 12);

  ctx.beginPath();
  ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(120, 150, 200, 0.5)";
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Theme 3: Night Grind
//   Dark blue-purple gradient with constellation-like scattered dots.
// ---------------------------------------------------------------------------
function renderNightGrind(ctx, w, h, rand) {
  const sf = scaleFactor(w, h);

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
  grad.addColorStop(0, "#0a0a1a");
  grad.addColorStop(0.5, "#0f0a20");
  grad.addColorStop(1, "#1a0a2a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle radial highlight in upper area
  const highlightR = Math.max(w, h) * 0.5;
  const hx = w * 0.7;
  const hy = h * 0.25;
  const highlight = ctx.createRadialGradient(hx, hy, 0, hx, hy, highlightR);
  highlight.addColorStop(0, "rgba(20, 12, 40, 0.4)");
  highlight.addColorStop(1, "rgba(10, 10, 26, 0)");
  ctx.fillStyle = highlight;
  ctx.fillRect(0, 0, w, h);

  // Star dots — small constellation-like points
  const starCount = Math.round(120 * sf * sf); // scale with area
  for (let i = 0; i < starCount; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const opacity = 0.08 + rand() * 0.5;
    const radius = (0.4 + rand() * 1.2) * sf;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
  }

  // Brighter feature stars
  const brightCount = Math.round(8 + 5 * sf);
  for (let i = 0; i < brightCount; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const opacity = 0.5 + rand() * 0.35;
    const radius = (1.5 + rand() * 2.5) * sf;

    // Glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 5);
    glow.addColorStop(0, `rgba(200, 210, 255, ${opacity * 0.3})`);
    glow.addColorStop(1, "rgba(200, 210, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius * 5, y - radius * 5, radius * 10, radius * 10);

    // Core
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220, 225, 255, ${opacity})`;
    ctx.fill();
  }

  // Subtle constellation lines connecting some bright stars
  const lineStars = [];
  for (let i = 0; i < Math.round(6 + 3 * sf); i++) {
    lineStars.push({ x: rand() * w, y: rand() * h });
  }
  ctx.strokeStyle = "rgba(140, 150, 200, 0.04)";
  ctx.lineWidth = Math.max(0.5, 0.5 * sf);
  for (let i = 0; i < lineStars.length - 1; i++) {
    const dist = Math.hypot(
      lineStars[i + 1].x - lineStars[i].x,
      lineStars[i + 1].y - lineStars[i].y
    );
    if (dist < Math.min(w, h) * 0.4) {
      ctx.beginPath();
      ctx.moveTo(lineStars[i].x, lineStars[i].y);
      ctx.lineTo(lineStars[i + 1].x, lineStars[i + 1].y);
      ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Theme 4: Clean Slate
//   Almost pure black with subtle noise/grain texture. Most minimal.
// ---------------------------------------------------------------------------
function renderCleanSlate(ctx, w, h, rand) {
  // Solid background
  ctx.fillStyle = "#080808";
  ctx.fillRect(0, 0, w, h);

  // Very subtle gradient — barely perceptible warmth in centre
  const cx = w / 2;
  const cy = h / 2;
  const gR = Math.max(w, h) * 0.7;
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, gR);
  grd.addColorStop(0, "rgba(12, 11, 10, 0.4)");
  grd.addColorStop(1, "rgba(8, 8, 8, 0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  // Noise/grain overlay — pixel-level manipulation
  // For performance at 4K, we work in blocks
  const blockSize = 2; // each "grain" pixel covers 2x2 real pixels
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  for (let by = 0; by < h; by += blockSize) {
    for (let bx = 0; bx < w; bx += blockSize) {
      // Deterministic noise value
      const noiseVal = (rand() - 0.5) * 12; // range -6 to +6

      for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
          const idx = ((by + dy) * w + (bx + dx)) * 4;
          data[idx] = Math.max(0, Math.min(255, data[idx] + noiseVal));
          data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + noiseVal));
          data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + noiseVal));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Extremely subtle vignette — darken edges
  const vigR = Math.max(w, h) * 0.9;
  const vig = ctx.createRadialGradient(cx, cy, vigR * 0.3, cx, cy, vigR);
  vig.addColorStop(0, "rgba(0, 0, 0, 0)");
  vig.addColorStop(1, "rgba(0, 0, 0, 0.3)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

// ---------------------------------------------------------------------------
// Theme 5: Flow State
//   Dark bg with smooth flowing wave lines in muted tones.
// ---------------------------------------------------------------------------
function renderFlowState(ctx, w, h, rand) {
  const sf = scaleFactor(w, h);

  // Background
  ctx.fillStyle = "#0b0b0f";
  ctx.fillRect(0, 0, w, h);

  // Subtle gradient undertone
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, "rgba(10, 14, 18, 0.5)");
  bgGrad.addColorStop(1, "rgba(12, 10, 16, 0.5)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Wave configurations
  const waves = [
    { color: "rgba(0, 80, 90, 0.18)", yOffset: 0.28, amplitude: 0.035, freq: 1.8, phase: 0, lineW: 2.0 },
    { color: "rgba(40, 50, 70, 0.22)", yOffset: 0.40, amplitude: 0.04, freq: 1.2, phase: 1.0, lineW: 2.2 },
    { color: "rgba(0, 100, 110, 0.14)", yOffset: 0.52, amplitude: 0.03, freq: 2.2, phase: 2.5, lineW: 1.8 },
    { color: "rgba(30, 40, 80, 0.20)", yOffset: 0.65, amplitude: 0.045, freq: 0.9, phase: 4.0, lineW: 2.5 },
    { color: "rgba(0, 70, 100, 0.12)", yOffset: 0.78, amplitude: 0.025, freq: 2.8, phase: 5.5, lineW: 1.5 },
  ];

  for (const wave of waves) {
    ctx.beginPath();
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = wave.lineW * sf;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const baseY = h * wave.yOffset;
    const amp = h * wave.amplitude;
    const steps = Math.ceil(w / 2); // one point every 2px

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const t = (i / steps) * Math.PI * 2 * wave.freq + wave.phase;
      // Composite sine wave for organic feel
      const y =
        baseY +
        amp * Math.sin(t) +
        amp * 0.4 * Math.sin(t * 2.3 + 1.0) +
        amp * 0.2 * Math.sin(t * 3.7 + 2.5);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Glow pass — same wave, wider and more transparent
    ctx.beginPath();
    ctx.strokeStyle = wave.color.replace(/[\d.]+\)$/, (m) => {
      return (parseFloat(m) * 0.3).toFixed(2) + ")";
    });
    ctx.lineWidth = wave.lineW * sf * 4;

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const t = (i / steps) * Math.PI * 2 * wave.freq + wave.phase;
      const y =
        baseY +
        amp * Math.sin(t) +
        amp * 0.4 * Math.sin(t * 2.3 + 1.0) +
        amp * 0.2 * Math.sin(t * 3.7 + 2.5);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Theme registry
// ---------------------------------------------------------------------------
const THEMES = [
  { slug: "locked-in", render: renderLockedIn, seed: 42 },
  { slug: "deep-focus", render: renderDeepFocus, seed: 137 },
  { slug: "night-grind", render: renderNightGrind, seed: 256 },
  { slug: "clean-slate", render: renderCleanSlate, seed: 512 },
  { slug: "flow-state", render: renderFlowState, seed: 777 },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const outDir = path.join(__dirname, "output");
  let totalGenerated = 0;

  console.log("=== Locked In Wallpapers — Generator ===\n");
  console.log(`Themes: ${THEMES.length}`);
  console.log(`Sizes:  ${SIZES.length}`);
  console.log(`Total:  ${THEMES.length * SIZES.length} wallpapers\n`);

  for (const theme of THEMES) {
    const themeDir = path.join(outDir, theme.slug);
    fs.mkdirSync(themeDir, { recursive: true });
    console.log(`[${theme.slug}]`);

    for (const size of SIZES) {
      const { w, h } = size;
      const filename = `${theme.slug}-${size.name}.png`;
      const filepath = path.join(themeDir, filename);

      // Seeded PRNG — same seed + size = same output every time
      const rand = mulberry32(theme.seed + w * 10000 + h);

      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext("2d");

      // Render theme
      theme.render(ctx, w, h, rand);

      // Write PNG
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(filepath, buffer);

      const sizeKB = (buffer.length / 1024).toFixed(0);
      console.log(`  ${filename} — ${sizeKB} KB`);
      totalGenerated++;
    }

    console.log();
  }

  console.log(`Done! Generated ${totalGenerated} wallpapers in output/`);
}

main().catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});
