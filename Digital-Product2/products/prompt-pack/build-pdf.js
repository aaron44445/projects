const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ============================================================
// Color scheme & constants
// ============================================================
const COLORS = {
  bg: '#0a0a0a',
  bgLight: '#141414',
  bgCard: '#1a1a1a',
  bgCardBorder: '#2a2a2a',
  text: '#ffffff',
  textMuted: '#a0a0a0',
  textDim: '#707070',
  accent: '#00d4ff',
  accentDark: '#0099bb',
  accentGlow: '#00e5ff',
  proTip: '#ff9f1c',
  whenToUse: '#7b68ee',
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ============================================================
// Markdown parser — extracts structured prompts from .md files
// ============================================================
function parseMarkdownFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  let categoryTitle = '';
  const prompts = [];
  let current = null;
  let section = null; // 'prompt' | 'whenToUse' | 'proTip'
  let promptLines = [];

  function flushPromptLines() {
    if (current && promptLines.length > 0) {
      const text = promptLines.join('\n').trim();
      if (section === 'prompt') current.prompt = text;
      else if (section === 'whenToUse') current.whenToUse = text;
      else if (section === 'proTip') current.proTip = text;
      promptLines = [];
    }
  }

  for (const line of lines) {
    // Category title
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      categoryTitle = line.replace('# ', '').trim();
      continue;
    }

    // Prompt title
    const titleMatch = line.match(/^## \d+\.\s+(.+)/);
    if (titleMatch) {
      flushPromptLines();
      if (current) prompts.push(current);
      current = { title: titleMatch[1].trim(), prompt: '', whenToUse: '', proTip: '' };
      section = null;
      continue;
    }

    // Section headers
    if (line.startsWith('**The Prompt:**')) {
      flushPromptLines();
      section = 'prompt';
      continue;
    }
    if (line.startsWith('**When to use it:**')) {
      flushPromptLines();
      section = 'whenToUse';
      const inline = line.replace('**When to use it:**', '').trim();
      if (inline) current.whenToUse = inline;
      continue;
    }
    if (line.startsWith('**Pro tip:**')) {
      flushPromptLines();
      section = 'proTip';
      const inline = line.replace('**Pro tip:**', '').trim();
      if (inline) current.proTip = inline;
      continue;
    }

    // Separator
    if (line.trim() === '---') {
      flushPromptLines();
      section = null;
      continue;
    }

    // Accumulate content for current section
    if (section && current) {
      promptLines.push(line);
    }
  }

  flushPromptLines();
  if (current) prompts.push(current);

  return { categoryTitle, prompts };
}

function cleanPromptText(text) {
  // Remove blockquote markers and clean up
  return text
    .split('\n')
    .map(l => l.replace(/^>\s?/, ''))
    .join('\n')
    .trim();
}

// ============================================================
// PDF Builder
// ============================================================
class PromptVaultPDF {
  constructor() {
    this.doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      autoFirstPage: false,
      bufferPages: true,
    });
    this.pageNum = 0;
    this.categories = [];
    this.tocEntries = [];
  }

  // Draws dark background on current page
  drawPageBg() {
    this.doc
      .save()
      .rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
      .fill(COLORS.bg)
      .restore();
  }

  // Footer on every content page
  drawFooter() {
    const y = PAGE_HEIGHT - 36;
    this.doc
      .save()
      .moveTo(MARGIN, y - 8)
      .lineTo(PAGE_WIDTH - MARGIN, y - 8)
      .strokeColor(COLORS.bgCardBorder)
      .lineWidth(0.5)
      .stroke()
      .restore();

    this.doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(COLORS.textDim)
      .text('The AI Prompt Vault', MARGIN, y, { width: CONTENT_WIDTH / 2, align: 'left' })
      .text(`${this.pageNum}`, PAGE_WIDTH / 2, y, { width: CONTENT_WIDTH / 2, align: 'right' });
  }

  addPage() {
    this.doc.addPage();
    this.pageNum++;
    this.drawPageBg();
  }

  // --------------------------------------------------------
  // Cover page
  // --------------------------------------------------------
  buildCover() {
    this.addPage();

    // Accent bar at top
    this.doc
      .save()
      .rect(0, 0, PAGE_WIDTH, 6)
      .fill(COLORS.accent)
      .restore();

    // Decorative line elements
    const cx = PAGE_WIDTH / 2;
    this.doc
      .save()
      .moveTo(cx - 120, 200)
      .lineTo(cx + 120, 200)
      .strokeColor(COLORS.accent)
      .lineWidth(2)
      .stroke()
      .restore();

    // Title
    this.doc
      .font('Helvetica-Bold')
      .fontSize(42)
      .fillColor(COLORS.accent)
      .text('THE AI', 0, 230, { width: PAGE_WIDTH, align: 'center' });

    this.doc
      .font('Helvetica-Bold')
      .fontSize(52)
      .fillColor(COLORS.text)
      .text('PROMPT VAULT', 0, 278, { width: PAGE_WIDTH, align: 'center' });

    // Decorative line
    this.doc
      .save()
      .moveTo(cx - 120, 345)
      .lineTo(cx + 120, 345)
      .strokeColor(COLORS.accent)
      .lineWidth(2)
      .stroke()
      .restore();

    // Subtitle
    this.doc
      .font('Helvetica')
      .fontSize(18)
      .fillColor(COLORS.textMuted)
      .text('50+ Prompts to 10x Your Output', 0, 370, { width: PAGE_WIDTH, align: 'center' });

    // Category badges
    const cats = ['Business Strategy', 'Content Creation', 'Coding Assistant', 'Productivity', 'Social Media'];
    const badgeY = 430;
    this.doc.font('Helvetica').fontSize(10).fillColor(COLORS.accent);

    cats.forEach((cat, i) => {
      const y = badgeY + i * 28;
      // Draw badge background
      const badgeW = 180;
      const badgeX = cx - badgeW / 2;
      this.doc
        .save()
        .roundedRect(badgeX, y - 4, badgeW, 22, 4)
        .fillAndStroke(COLORS.bgCard, COLORS.bgCardBorder)
        .restore();

      this.doc
        .fillColor(COLORS.accent)
        .text(cat, badgeX, y, { width: badgeW, align: 'center' });
    });

    // Bottom tagline
    this.doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.textDim)
      .text('Ready-to-use prompts for ChatGPT, Claude, and any AI assistant', 0, 620, {
        width: PAGE_WIDTH,
        align: 'center',
      });

    // Accent bar at bottom
    this.doc
      .save()
      .rect(0, PAGE_HEIGHT - 6, PAGE_WIDTH, 6)
      .fill(COLORS.accent)
      .restore();

    // Reset page number (cover doesn't count)
    this.pageNum = 0;
  }

  // --------------------------------------------------------
  // Table of contents
  // --------------------------------------------------------
  buildTOC() {
    this.addPage();
    this.drawFooter();

    this.doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(COLORS.accent)
      .text('TABLE OF CONTENTS', MARGIN, MARGIN + 20);

    // Decorative line
    this.doc
      .save()
      .moveTo(MARGIN, MARGIN + 58)
      .lineTo(MARGIN + 200, MARGIN + 58)
      .strokeColor(COLORS.accent)
      .lineWidth(2)
      .stroke()
      .restore();

    let y = MARGIN + 80;

    this.categories.forEach((cat, catIdx) => {
      // Category header
      this.doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(COLORS.accent)
        .text(`${catIdx + 1}. ${cat.categoryTitle}`, MARGIN, y);

      y += 24;

      cat.prompts.forEach((p, pIdx) => {
        this.doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(COLORS.textMuted)
          .text(`${pIdx + 1}. ${p.title}`, MARGIN + 20, y, { width: CONTENT_WIDTH - 20 });

        y += 18;
      });

      y += 12;
    });
  }

  // --------------------------------------------------------
  // Chapter header page
  // --------------------------------------------------------
  buildChapterHeader(title, number, promptCount) {
    this.addPage();
    this.drawFooter();

    // Large chapter number
    this.doc
      .font('Helvetica-Bold')
      .fontSize(120)
      .fillColor(COLORS.bgLight)
      .text(`0${number}`, 0, 180, { width: PAGE_WIDTH, align: 'center' });

    // Category name overlay
    this.doc
      .font('Helvetica-Bold')
      .fontSize(32)
      .fillColor(COLORS.text)
      .text(title.toUpperCase(), 0, 300, { width: PAGE_WIDTH, align: 'center' });

    // Accent underline
    const cx = PAGE_WIDTH / 2;
    this.doc
      .save()
      .moveTo(cx - 80, 345)
      .lineTo(cx + 80, 345)
      .strokeColor(COLORS.accent)
      .lineWidth(3)
      .stroke()
      .restore();

    // Prompt count
    this.doc
      .font('Helvetica')
      .fontSize(14)
      .fillColor(COLORS.textMuted)
      .text(`${promptCount} Prompts`, 0, 365, { width: PAGE_WIDTH, align: 'center' });
  }

  // --------------------------------------------------------
  // Individual prompt page(s)
  // --------------------------------------------------------
  buildPromptPages(prompt, promptNumber, categoryName) {
    this.addPage();
    this.drawFooter();

    let y = MARGIN;

    // Category + prompt number header
    this.doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.accent);
    this.doc.text(`${categoryName.toUpperCase()}  /  PROMPT ${promptNumber}`, MARGIN, y);
    y += 22;

    // Prompt title
    this.doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor(COLORS.text);
    this.doc.text(prompt.title, MARGIN, y, { width: CONTENT_WIDTH });
    y = this.doc.y + 16;

    // The prompt text in a styled card
    const promptText = cleanPromptText(prompt.prompt);

    // Measure the text height first
    const textHeight = this.doc
      .font('Helvetica')
      .fontSize(10)
      .heightOfString(promptText, { width: CONTENT_WIDTH - 36 });

    const cardHeight = textHeight + 32;
    const cardTop = y;

    // Check if card fits on this page
    if (cardTop + cardHeight > PAGE_HEIGHT - 100) {
      // Start a new page for the prompt text
      this.addPage();
      this.drawFooter();
      y = MARGIN;

      // Re-draw the header on new page
      this.doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(COLORS.accent);
      this.doc.text(`${categoryName.toUpperCase()}  /  PROMPT ${promptNumber} (continued)`, MARGIN, y);
      y += 22;
    }

    // Card background
    this.doc
      .save()
      .roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 6)
      .fill(COLORS.bgCard)
      .restore();

    // Left accent bar on card
    this.doc
      .save()
      .roundedRect(MARGIN, y, 4, cardHeight, 2)
      .fill(COLORS.accent)
      .restore();

    // Card border
    this.doc
      .save()
      .roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 6)
      .strokeColor(COLORS.bgCardBorder)
      .lineWidth(1)
      .stroke()
      .restore();

    // Prompt text inside card
    this.doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.textMuted);
    this.doc.text(promptText, MARGIN + 18, y + 16, {
      width: CONTENT_WIDTH - 36,
      lineGap: 3,
    });

    y = y + cardHeight + 20;

    // Check if we need a new page for when-to-use and pro-tip
    if (y > PAGE_HEIGHT - 140) {
      this.addPage();
      this.drawFooter();
      y = MARGIN;
    }

    // When to use it
    if (prompt.whenToUse) {
      // Icon-style label
      this.doc
        .save()
        .roundedRect(MARGIN, y, 110, 20, 3)
        .fill(COLORS.whenToUse)
        .restore();

      this.doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(COLORS.text)
        .text('WHEN TO USE', MARGIN + 8, y + 5);

      y += 28;

      this.doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(COLORS.textMuted)
        .text(prompt.whenToUse, MARGIN + 4, y, { width: CONTENT_WIDTH - 8 });

      y = this.doc.y + 16;
    }

    // Pro tip
    if (prompt.proTip) {
      // Icon-style label
      this.doc
        .save()
        .roundedRect(MARGIN, y, 70, 20, 3)
        .fill(COLORS.proTip)
        .restore();

      this.doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#000000')
        .text('PRO TIP', MARGIN + 8, y + 5);

      y += 28;

      this.doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(COLORS.textMuted)
        .text(prompt.proTip, MARGIN + 4, y, { width: CONTENT_WIDTH - 8 });
    }
  }

  // --------------------------------------------------------
  // Back cover / closing page
  // --------------------------------------------------------
  buildClosing() {
    this.addPage();

    const cx = PAGE_WIDTH / 2;

    // Accent bar
    this.doc
      .save()
      .rect(0, 0, PAGE_WIDTH, 6)
      .fill(COLORS.accent)
      .restore();

    this.doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(COLORS.text)
      .text('Start Prompting', 0, 250, { width: PAGE_WIDTH, align: 'center' });

    this.doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(COLORS.accent)
      .text('Like a Pro', 0, 285, { width: PAGE_WIDTH, align: 'center' });

    this.doc
      .save()
      .moveTo(cx - 60, 330)
      .lineTo(cx + 60, 330)
      .strokeColor(COLORS.accent)
      .lineWidth(2)
      .stroke()
      .restore();

    this.doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor(COLORS.textMuted)
      .text(
        'These prompts are your starting point, not your ceiling.\nCustomize them. Combine them. Make them yours.',
        0,
        355,
        { width: PAGE_WIDTH, align: 'center', lineGap: 6 }
      );

    this.doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(COLORS.textDim)
      .text('The AI Prompt Vault', 0, 440, { width: PAGE_WIDTH, align: 'center' });

    // Bottom accent bar
    this.doc
      .save()
      .rect(0, PAGE_HEIGHT - 6, PAGE_WIDTH, 6)
      .fill(COLORS.accent)
      .restore();
  }

  // --------------------------------------------------------
  // Build the full PDF
  // --------------------------------------------------------
  async build() {
    const promptsDir = path.join(__dirname, 'prompts');
    const outputDir = path.join(__dirname, 'output');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'ai-prompt-vault.pdf');
    const writeStream = fs.createWriteStream(outputPath);
    this.doc.pipe(writeStream);

    // Load all categories
    const files = [
      'business-strategy.md',
      'content-creation.md',
      'coding-assistant.md',
      'productivity.md',
      'social-media.md',
    ];

    let totalPrompts = 0;

    for (const file of files) {
      const filePath = path.join(promptsDir, file);
      const cat = parseMarkdownFile(filePath);
      this.categories.push(cat);
      totalPrompts += cat.prompts.length;
    }

    console.log(`Loaded ${this.categories.length} categories with ${totalPrompts} total prompts`);

    // Build pages
    this.buildCover();
    this.buildTOC();

    this.categories.forEach((cat, catIdx) => {
      this.buildChapterHeader(cat.categoryTitle, catIdx + 1, cat.prompts.length);

      cat.prompts.forEach((prompt, pIdx) => {
        this.buildPromptPages(prompt, pIdx + 1, cat.categoryTitle);
      });
    });

    this.buildClosing();

    // Finalize
    this.doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        const stats = fs.statSync(outputPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`\nPDF generated successfully!`);
        console.log(`  Output: ${outputPath}`);
        console.log(`  Pages: ${this.pageNum}`);
        console.log(`  Size: ${sizeMB} MB`);
        console.log(`  Prompts: ${totalPrompts}`);
        resolve();
      });
      writeStream.on('error', reject);
    });
  }
}

// ============================================================
// Run
// ============================================================
const builder = new PromptVaultPDF();
builder.build().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
