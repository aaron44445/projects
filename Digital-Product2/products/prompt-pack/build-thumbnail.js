const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function buildThumbnail() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 600px;
    height: 600px;
    background: #060608;
    font-family: 'Syne', sans-serif;
    color: #f0ece4;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .bg-glow {
    position: absolute;
    top: -100px;
    right: -60px;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(228,255,84,0.1) 0%, transparent 70%);
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
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, #e4ff54, transparent 80%);
  }

  .content {
    position: relative;
    z-index: 1;
  }

  .label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #8a8680;
    margin-bottom: 28px;
  }

  .title-the {
    font-size: 20px;
    font-weight: 700;
    color: #8a8680;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .title-main {
    font-size: 72px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
    color: #f0ece4;
  }

  .title-vault {
    font-size: 72px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
    color: #e4ff54;
    margin-bottom: 28px;
  }

  .divider {
    width: 50px;
    height: 3px;
    background: #e4ff54;
    margin: 0 auto 28px;
    border-radius: 2px;
  }

  .stat-row {
    display: flex;
    gap: 32px;
    justify-content: center;
  }

  .stat {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .stat-num {
    font-size: 24px;
    font-weight: 800;
    color: #f0ece4;
  }

  .stat-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #4a4844;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
</style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="bg-grid"></div>
  <div class="top-line"></div>

  <div class="content">
    <div class="label">Life Transformation Edition</div>
    <div class="title-the">THE AI</div>
    <div class="title-main">PROMPT</div>
    <div class="title-vault">VAULT</div>
    <div class="divider"></div>
    <div class="stat-row">
      <div class="stat">
        <div class="stat-num">20</div>
        <div class="stat-label">Prompts</div>
      </div>
      <div class="stat">
        <div class="stat-num">5</div>
        <div class="stat-label">Categories</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 600, height: 600 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

  const thumbPath = path.join(outputDir, 'gumroad-thumbnail.png');
  await page.screenshot({ path: thumbPath, type: 'png' });
  console.log(`Thumbnail saved: ${thumbPath}`);

  await browser.close();
}

buildThumbnail().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
