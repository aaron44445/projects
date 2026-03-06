const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function buildCover() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1280px;
    height: 720px;
    background: #060608;
    font-family: 'DM Sans', sans-serif;
    color: #f0ece4;
    overflow: hidden;
    position: relative;
  }

  /* Background effects */
  .bg-glow-1 {
    position: absolute;
    top: -120px;
    right: -80px;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(228,255,84,0.1) 0%, transparent 70%);
    border-radius: 50%;
  }

  .bg-glow-2 {
    position: absolute;
    bottom: -150px;
    left: -100px;
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, rgba(228,255,84,0.05) 0%, transparent 70%);
    border-radius: 50%;
  }

  .bg-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(228,255,84,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(228,255,84,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .top-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #e4ff54, transparent 80%);
  }

  .bottom-line {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent 20%, #e4ff54);
  }

  /* Layout */
  .container {
    position: relative;
    z-index: 1;
    display: flex;
    height: 100%;
    padding: 60px 80px;
    gap: 60px;
  }

  /* Left side — title */
  .left {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #8a8680;
    margin-bottom: 24px;
  }

  .title-the {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 400;
    color: #8a8680;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .title-main {
    font-family: 'Syne', sans-serif;
    font-size: 64px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
    color: #f0ece4;
  }

  .title-vault {
    font-family: 'Syne', sans-serif;
    font-size: 64px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
    color: #e4ff54;
    margin-bottom: 24px;
  }

  .divider {
    width: 60px;
    height: 3px;
    background: #e4ff54;
    margin-bottom: 24px;
    border-radius: 2px;
  }

  .subtitle {
    font-size: 16px;
    color: #8a8680;
    line-height: 1.7;
    max-width: 400px;
  }

  .subtitle strong {
    color: #f0ece4;
    font-weight: 600;
  }

  /* Right side — categories */
  .right {
    width: 420px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
  }

  .category {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 20px;
    background: rgba(255,255,255,0.03);
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.06);
  }

  .cat-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .cat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cat-name {
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #f0ece4;
  }

  .cat-desc {
    font-size: 11px;
    color: #8a8680;
  }

  .cat-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #4a4844;
    margin-left: auto;
    flex-shrink: 0;
  }

  /* Stats bar */
  .stats {
    position: absolute;
    bottom: 60px;
    left: 80px;
    display: flex;
    gap: 40px;
    z-index: 2;
  }

  .stat {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .stat-num {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #f0ece4;
  }

  .stat-label {
    font-size: 12px;
    color: #4a4844;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
</style>
</head>
<body>

  <div class="bg-glow-1"></div>
  <div class="bg-glow-2"></div>
  <div class="bg-grid"></div>
  <div class="top-line"></div>
  <div class="bottom-line"></div>

  <div class="container">
    <div class="left">
      <div class="label">AI-Powered Self Improvement</div>
      <div class="title-the">THE AI</div>
      <div class="title-main">PROMPT</div>
      <div class="title-vault">VAULT</div>
      <div class="divider"></div>
      <div class="subtitle">
        <strong>20 prompts</strong> that turn ChatGPT into a world-class life strategist.
        Each one diagnoses your situation before giving advice &mdash;
        like a <strong>$500 coaching session</strong> for the price of a coffee.
      </div>
    </div>

    <div class="right">
      <div class="category">
        <div class="cat-icon" style="background: rgba(228,255,84,0.12)">&#x1F50D;</div>
        <div class="cat-info">
          <div class="cat-name">Self Awareness</div>
          <div class="cat-desc">Life analysis, SWOT, identity patterns</div>
        </div>
        <div class="cat-count">4</div>
      </div>

      <div class="category">
        <div class="cat-icon" style="background: rgba(84,184,255,0.12)">&#x1F9ED;</div>
        <div class="cat-info">
          <div class="cat-name">Life Direction</div>
          <div class="cat-desc">Purpose, vision, values, life design</div>
        </div>
        <div class="cat-count">4</div>
      </div>

      <div class="category">
        <div class="cat-icon" style="background: rgba(255,107,107,0.12)">&#x1F513;</div>
        <div class="cat-info">
          <div class="cat-name">Mental Barriers</div>
          <div class="cat-desc">Fear, procrastination, limiting beliefs</div>
        </div>
        <div class="cat-count">4</div>
      </div>

      <div class="category">
        <div class="cat-icon" style="background: rgba(192,132,252,0.12)">&#x2699;</div>
        <div class="cat-info">
          <div class="cat-name">Systems & Habits</div>
          <div class="cat-desc">Routines, productivity, weekly reviews</div>
        </div>
        <div class="cat-count">4</div>
      </div>

      <div class="category">
        <div class="cat-icon" style="background: rgba(251,146,60,0.12)">&#x1F3AF;</div>
        <div class="cat-info">
          <div class="cat-name">Execution & Results</div>
          <div class="cat-desc">90-day plans, goals, accountability</div>
        </div>
        <div class="cat-count">4</div>
      </div>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-num">20</div>
      <div class="stat-label">Prompts</div>
    </div>
    <div class="stat">
      <div class="stat-num">5</div>
      <div class="stat-label">Categories</div>
    </div>
    <div class="stat">
      <div class="stat-num">PDF</div>
      <div class="stat-label">Format</div>
    </div>
  </div>

</body>
</html>`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Cover image (1280x720)
  await page.setViewport({ width: 1280, height: 720 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const coverPath = path.join(outputDir, 'gumroad-cover.png');
  await page.screenshot({ path: coverPath, type: 'png' });
  console.log(`Cover image saved: ${coverPath}`);

  // Thumbnail (600x600 square crop)
  const thumbHtml = html
    .replace('width: 1280px;', 'width: 600px;')
    .replace('height: 720px;', 'height: 600px;')
    .replace('padding: 60px 80px;', 'padding: 40px 50px;')
    .replace('gap: 60px;', 'flex-direction: column; gap: 20px;')
    .replace('width: 420px;', 'width: 100%;')
    .replace('font-size: 64px;', 'font-size: 40px;')
    .replace('font-size: 64px;', 'font-size: 40px;')
    .replace('font-size: 22px;\n    font-weight: 400;', 'font-size: 16px;\n    font-weight: 400;')
    .replace('<div class="subtitle">', '<div class="subtitle" style="display:none">')
    .replace('<div class="stats">', '<div class="stats" style="display:none">')
    .replace('gap: 14px;\n  }\n\n  .category {', 'gap: 8px;\n  }\n\n  .category {')
    .replace('padding: 14px 20px;', 'padding: 10px 14px;');

  await page.setViewport({ width: 600, height: 600 });
  await page.setContent(thumbHtml, { waitUntil: 'networkidle0' });

  const thumbPath = path.join(outputDir, 'gumroad-thumbnail.png');
  await page.screenshot({ path: thumbPath, type: 'png' });
  console.log(`Thumbnail saved: ${thumbPath}`);

  await browser.close();
  console.log('\nDone! Upload these to Gumroad.');
}

buildCover().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
