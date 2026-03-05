const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ============================================================
// Parse single self-improvement markdown into categories
// ============================================================
function parseSelfImprovementFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  const categories = [];
  let currentCat = null;
  let currentPrompt = null;
  let section = null;
  let promptLines = [];

  function flushPromptLines() {
    if (currentPrompt && promptLines.length > 0) {
      const text = promptLines.join('\n').trim();
      if (section === 'prompt') currentPrompt.prompt = text;
      promptLines = [];
    }
  }

  // Clean category title: "Category 1 -- Self Awareness" -> "Self Awareness"
  function cleanCategoryTitle(raw) {
    const dashMatch = raw.match(/--\s*(.+)/);
    if (dashMatch) return dashMatch[1].trim();
    return raw.replace(/^Category\s*\d+\s*/, '').trim();
  }

  for (const line of lines) {
    // Skip the top-level title and "How to Use" section
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      continue;
    }
    if (line.startsWith('## How to Use')) {
      // Stop parsing — everything after is closing content
      break;
    }

    // ## headers are category names
    const catMatch = line.match(/^## ([^#].+)/);
    if (catMatch && !line.match(/^## \d+\./)) {
      flushPromptLines();
      if (currentPrompt && currentCat) currentCat.prompts.push(currentPrompt);
      currentPrompt = null;
      if (currentCat) categories.push(currentCat);
      currentCat = { categoryTitle: cleanCategoryTitle(catMatch[1].trim()), prompts: [] };
      section = null;
      continue;
    }

    // ### headers are prompt titles
    const titleMatch = line.match(/^### \d+\.\s+(.+)/);
    if (titleMatch) {
      flushPromptLines();
      if (currentPrompt && currentCat) currentCat.prompts.push(currentPrompt);
      currentPrompt = { title: titleMatch[1].trim(), prompt: '', purpose: '', whyItWorks: '', exampleUse: '' };
      section = null;
      continue;
    }

    if (line.startsWith('**Purpose:**')) {
      flushPromptLines();
      const inline = line.replace('**Purpose:**', '').trim();
      if (inline && currentPrompt) currentPrompt.purpose = inline;
      section = null;
      continue;
    }
    if (line.startsWith('**The Prompt:**')) {
      flushPromptLines();
      section = 'prompt';
      continue;
    }
    if (line.startsWith('**Why this works:**')) {
      flushPromptLines();
      const inline = line.replace('**Why this works:**', '').trim();
      if (inline && currentPrompt) currentPrompt.whyItWorks = inline;
      section = null;
      continue;
    }
    if (line.startsWith('**Example use case:**')) {
      flushPromptLines();
      const inline = line.replace('**Example use case:**', '').trim();
      if (inline && currentPrompt) currentPrompt.exampleUse = inline;
      section = null;
      continue;
    }

    if (line.trim() === '---') {
      flushPromptLines();
      section = null;
      continue;
    }

    if (section && currentPrompt) {
      promptLines.push(line);
    }
  }

  flushPromptLines();
  if (currentPrompt && currentCat) currentCat.prompts.push(currentPrompt);
  if (currentCat) categories.push(currentCat);

  return categories;
}

function cleanPromptText(text) {
  return text
    .split('\n')
    .map(l => l.replace(/^>\s?/, ''))
    .join('\n')
    .trim();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\[([^\]]+)\]/g, '<span class="placeholder">[$1]</span>');
}

// ============================================================
// Build HTML
// ============================================================
function buildHTML(categories) {
  const totalPrompts = categories.reduce((sum, c) => sum + c.prompts.length, 0);

  const categoryColors = [
    { accent: '#e4ff54', accentDim: 'rgba(228,255,84,0.12)', label: 'lime' },
    { accent: '#ff6b6b', accentDim: 'rgba(255,107,107,0.12)', label: 'coral' },
    { accent: '#54b8ff', accentDim: 'rgba(84,184,255,0.12)', label: 'blue' },
    { accent: '#c084fc', accentDim: 'rgba(192,132,252,0.12)', label: 'violet' },
    { accent: '#fb923c', accentDim: 'rgba(251,146,60,0.12)', label: 'orange' },
  ];

  let promptsHTML = '';

  categories.forEach((cat, catIdx) => {
    const color = categoryColors[catIdx];

    // Chapter divider page
    promptsHTML += `
      <div class="page chapter-page">
        <div class="chapter-number" style="color: ${color.accent}15">0${catIdx + 1}</div>
        <div class="chapter-content">
          <div class="chapter-label" style="color: ${color.accent}">Chapter ${catIdx + 1}</div>
          <h2 class="chapter-title">${cat.categoryTitle}</h2>
          <div class="chapter-line" style="background: ${color.accent}"></div>
          <div class="chapter-count">${cat.prompts.length} Prompts</div>
        </div>
      </div>
    `;

    // Individual prompt pages
    cat.prompts.forEach((prompt, pIdx) => {
      const promptText = escapeHtml(cleanPromptText(prompt.prompt));
      const promptFormatted = promptText
        .split('\n')
        .filter(l => l.trim())
        .map(l => {
          if (/^\d+\./.test(l.trim())) return `<div class="prompt-list-item">${l.trim()}</div>`;
          if (/^\*\*/.test(l.trim())) return `<div class="prompt-bold">${l.trim().replace(/\*\*/g, '')}</div>`;
          return `<div>${l}</div>`;
        })
        .join('');

      promptsHTML += `
        <div class="page prompt-page">
          <div class="prompt-header">
            <span class="prompt-cat" style="color: ${color.accent}">${cat.categoryTitle.toUpperCase()}</span>
            <span class="prompt-num">${String(pIdx + 1).padStart(2, '0')}</span>
          </div>

          <h3 class="prompt-title">${prompt.title}</h3>

          <div class="prompt-card" style="border-left-color: ${color.accent}; background: ${color.accentDim}">
            <div class="prompt-text">${promptFormatted}</div>
          </div>

          ${prompt.purpose ? `
          <div class="prompt-purpose">${escapeHtml(prompt.purpose)}</div>
          ` : ''}

          <div class="prompt-meta">
            ${prompt.whyItWorks ? `
              <div class="meta-block">
                <span class="meta-label tip-label">Why it works</span>
                <span class="meta-text">${escapeHtml(prompt.whyItWorks)}</span>
              </div>
            ` : ''}
            ${prompt.exampleUse ? `
              <div class="meta-block">
                <span class="meta-label example-label">Example</span>
                <span class="meta-text">${escapeHtml(prompt.exampleUse)}</span>
              </div>
            ` : ''}
          </div>

          <div class="page-footer">
            <span>The AI Prompt Vault</span>
            <span>${cat.categoryTitle} / Prompt ${pIdx + 1}</span>
          </div>
        </div>
      `;
    });
  });

  // Table of contents
  let tocHTML = '';
  categories.forEach((cat, catIdx) => {
    const color = categoryColors[catIdx];
    tocHTML += `
      <div class="toc-category">
        <div class="toc-cat-header">
          <span class="toc-dot" style="background: ${color.accent}"></span>
          <span class="toc-cat-title">${cat.categoryTitle}</span>
          <span class="toc-cat-count">${cat.prompts.length}</span>
        </div>
        <div class="toc-prompts">
          ${cat.prompts.map((p, i) => `
            <div class="toc-prompt">
              <span class="toc-prompt-num">${String(i + 1).padStart(2, '0')}</span>
              <span class="toc-prompt-title">${p.title}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg: #060608;
    --bg-surface: #0e0e12;
    --bg-raised: #16161c;
    --text: #f0ece4;
    --text-dim: #8a8680;
    --text-faint: #4a4844;
    --accent: #e4ff54;
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }

  .page {
    width: 8.5in;
    min-height: 11in;
    padding: 0.7in 0.8in;
    page-break-after: always;
    position: relative;
    background: var(--bg);
    display: flex;
    flex-direction: column;
  }

  /* ---- Cover ---- */
  .cover-page {
    justify-content: center;
    align-items: center;
    text-align: center;
    background: var(--bg);
    overflow: hidden;
  }

  .cover-page::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(228,255,84,0.08) 0%, transparent 70%);
    border-radius: 50%;
  }

  .cover-page::after {
    content: '';
    position: absolute;
    bottom: -100px;
    left: -100px;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255,107,60,0.05) 0%, transparent 70%);
    border-radius: 50%;
  }

  .cover-top-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), transparent);
  }

  .cover-bottom-line {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, var(--accent));
  }

  .cover-label {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 40px;
    position: relative;
  }

  .cover-title-the {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 400;
    color: var(--text-dim);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 8px;
    position: relative;
  }

  .cover-title-main {
    font-family: var(--font-display);
    font-size: 56px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
    color: var(--text);
    position: relative;
    margin-bottom: 8px;
  }

  .cover-title-vault {
    font-family: var(--font-display);
    font-size: 56px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
    color: var(--accent);
    position: relative;
    margin-bottom: 40px;
  }

  .cover-divider {
    width: 80px;
    height: 2px;
    background: var(--accent);
    margin: 0 auto 40px;
    position: relative;
  }

  .cover-subtitle {
    font-size: 16px;
    color: var(--text-dim);
    line-height: 1.6;
    max-width: 350px;
    margin: 0 auto 50px;
    position: relative;
  }

  .cover-stats {
    display: flex;
    gap: 40px;
    justify-content: center;
    position: relative;
  }

  .cover-stat {
    text-align: center;
  }

  .cover-stat-num {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 800;
    color: var(--text);
  }

  .cover-stat-label {
    font-size: 11px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 4px;
  }

  /* ---- TOC ---- */
  .toc-page {
    padding-top: 1in;
  }

  .toc-heading {
    font-family: var(--font-display);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 40px;
  }

  .toc-category {
    margin-bottom: 28px;
  }

  .toc-cat-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .toc-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .toc-cat-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
  }

  .toc-cat-count {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-faint);
    margin-left: auto;
  }

  .toc-prompts {
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .toc-prompt {
    display: flex;
    align-items: baseline;
    gap: 12px;
    line-height: 1.6;
  }

  .toc-prompt-num {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-faint);
    flex-shrink: 0;
    width: 18px;
  }

  .toc-prompt-title {
    font-size: 12px;
    color: var(--text-dim);
  }

  /* ---- Chapter Page ---- */
  .chapter-page {
    justify-content: center;
    align-items: center;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .chapter-number {
    position: absolute;
    font-family: var(--font-display);
    font-size: 300px;
    font-weight: 800;
    line-height: 1;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    user-select: none;
  }

  .chapter-content {
    position: relative;
    z-index: 1;
  }

  .chapter-label {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .chapter-title {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 20px;
  }

  .chapter-line {
    width: 60px;
    height: 3px;
    margin: 0 auto 16px;
    border-radius: 2px;
  }

  .chapter-count {
    font-size: 14px;
    color: var(--text-dim);
  }

  /* ---- Prompt Page ---- */
  .prompt-page {
    gap: 0;
  }

  .prompt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .prompt-cat {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.15em;
    font-weight: 500;
  }

  .prompt-num {
    font-family: var(--font-mono);
    font-size: 28px;
    font-weight: 500;
    color: var(--text-faint);
  }

  .prompt-title {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.2;
    margin-bottom: 24px;
  }

  .prompt-card {
    border-left: 3px solid;
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 24px;
    flex-grow: 1;
  }

  .prompt-text {
    font-family: var(--font-body);
    font-size: 12px;
    line-height: 1.75;
    color: var(--text);
  }

  .prompt-text .placeholder {
    color: var(--accent);
    font-weight: 600;
  }

  .prompt-text .prompt-list-item {
    padding-left: 8px;
    margin: 4px 0;
  }

  .prompt-text .prompt-bold {
    font-weight: 600;
    margin-top: 10px;
    margin-bottom: 4px;
    color: var(--text);
  }

  .prompt-meta {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: auto;
  }

  .meta-block {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .meta-label {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .prompt-purpose {
    font-size: 13px;
    color: var(--text-dim);
    line-height: 1.6;
    margin-bottom: 16px;
    font-style: italic;
  }

  .tip-label {
    background: rgba(124,58,237,0.2);
    color: #a78bfa;
  }

  .example-label {
    background: rgba(251,146,60,0.2);
    color: #fb923c;
  }

  .meta-text {
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-dim);
  }

  .page-footer {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: var(--text-faint);
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 12px;
    margin-top: 20px;
  }

  /* ---- Closing Page ---- */
  .closing-page {
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .closing-title {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 800;
    color: var(--text);
    line-height: 1.2;
    margin-bottom: 8px;
  }

  .closing-accent {
    color: var(--accent);
  }

  .closing-divider {
    width: 60px;
    height: 2px;
    background: var(--accent);
    margin: 24px auto;
  }

  .closing-text {
    font-size: 14px;
    color: var(--text-dim);
    line-height: 1.8;
    max-width: 380px;
    margin: 0 auto;
  }

  .closing-brand {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-faint);
    letter-spacing: 0.15em;
    margin-top: 50px;
  }
</style>
</head>
<body>

  <!-- Cover -->
  <div class="page cover-page">
    <div class="cover-top-line"></div>
    <div class="cover-bottom-line"></div>
    <div class="cover-label">A Premium Prompt Collection</div>
    <div class="cover-title-the">THE AI</div>
    <div class="cover-title-main">PROMPT</div>
    <div class="cover-title-vault">VAULT</div>
    <div class="cover-divider"></div>
    <div class="cover-subtitle">${totalPrompts} prompts that turn any AI into a world-class life strategist. Diagnose what's holding you back, build systems that stick, and execute a plan that actually changes things.</div>
    <div class="cover-stats">
      <div class="cover-stat">
        <div class="cover-stat-num">${totalPrompts}</div>
        <div class="cover-stat-label">Prompts</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-num">${categories.length}</div>
        <div class="cover-stat-label">Categories</div>
      </div>
    </div>
  </div>

  <!-- TOC -->
  <div class="page toc-page">
    <div class="toc-heading">Table of Contents</div>
    ${tocHTML}
  </div>

  <!-- Prompts -->
  ${promptsHTML}

  <!-- Closing -->
  <div class="page closing-page">
    <div class="closing-title">Stop Avoiding.</div>
    <div class="closing-title closing-accent">Start Asking.</div>
    <div class="closing-divider"></div>
    <div class="closing-text">
      Pick the prompt that matches what you're avoiding thinking about.<br>
      Copy it. Fill in the bracket. Be honest.<br>
      The discomfort means it's working.
    </div>
    <div class="closing-brand">THE AI PROMPT VAULT</div>
  </div>

</body>
</html>`;
}

// ============================================================
// Generate PDF from HTML via Puppeteer
// ============================================================
async function main() {
  const promptsDir = path.join(__dirname, 'prompts');
  const outputDir = path.join(__dirname, 'output');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load categories from single self-improvement file
  const categories = parseSelfImprovementFile(path.join(promptsDir, 'self-improvement.md'));
  let totalPrompts = categories.reduce((sum, c) => sum + c.prompts.length, 0);

  console.log(`Loaded ${categories.length} categories with ${totalPrompts} prompts`);

  // Build HTML
  const html = buildHTML(categories);

  // Save HTML for debugging
  fs.writeFileSync(path.join(outputDir, 'preview.html'), html);
  console.log('HTML preview saved to output/preview.html');

  // Launch Puppeteer and generate PDF
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfPath = path.join(outputDir, 'ai-prompt-vault.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();

  const stats = fs.statSync(pdfPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\nPDF generated successfully!`);
  console.log(`  Output: ${pdfPath}`);
  console.log(`  Size: ${sizeMB} MB`);
  console.log(`  Prompts: ${totalPrompts}`);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
