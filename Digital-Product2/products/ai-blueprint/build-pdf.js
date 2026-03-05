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
  textMuted: '#b0b0b0',
  textDim: '#707070',
  accent: '#00d4ff',
  accentDark: '#0099bb',
  tip: '#ff9f1c',
  insight: '#7b68ee',
  action: '#00e676',
  warning: '#ff5252',
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_BOTTOM = PAGE_HEIGHT - 60; // leave room for footer

// ============================================================
// Markdown parser — extracts chapters from .md files
// ============================================================
function parseChapter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  let title = '';
  const sections = [];
  let currentSection = null;
  let bodyLines = [];

  function flushBody() {
    if (currentSection && bodyLines.length > 0) {
      currentSection.body = bodyLines.join('\n').trim();
      bodyLines = [];
    }
  }

  for (const line of lines) {
    // Chapter title (# heading)
    if (line.startsWith('# ') && !line.startsWith('## ') && !line.startsWith('### ')) {
      title = line.replace('# ', '').trim();
      continue;
    }

    // Section heading (## heading)
    if (line.startsWith('## ')) {
      flushBody();
      if (currentSection) sections.push(currentSection);
      currentSection = { heading: line.replace('## ', '').trim(), body: '' };
      continue;
    }

    // Accumulate body
    if (currentSection) {
      bodyLines.push(line);
    }
  }

  flushBody();
  if (currentSection) sections.push(currentSection);

  return { title, sections };
}

// ============================================================
// Text rendering utilities
// ============================================================

/**
 * Parse body text into structured blocks for rendering.
 * Supports: paragraphs, ### sub-headings, bullet lists, numbered lists,
 *           tables (| ... |), bold (**text**), horizontal rules (---),
 *           and callout blocks (> **KEY INSIGHT:** ... etc.)
 */
function parseBody(bodyText) {
  const lines = bodyText.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Sub-heading (###)
    if (line.startsWith('### ')) {
      blocks.push({ type: 'subheading', text: line.replace('### ', '').trim() });
      i++;
      continue;
    }

    // Table (collect all | lines)
    if (line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const tl = lines[i].trim();
        // skip separator rows like |---|---|
        if (!/^\|[\s\-:|]+\|$/.test(tl)) {
          const cells = tl.split('|').filter(c => c.trim() !== '').map(c => c.trim());
          tableLines.push(cells);
        }
        i++;
      }
      blocks.push({ type: 'table', rows: tableLines });
      continue;
    }

    // Bullet list (- item or * item)
    if (/^[\-\*]\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[\-\*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[\-\*]\s/, ''));
        i++;
      }
      blocks.push({ type: 'bullets', items });
      continue;
    }

    // Numbered list (1. item)
    if (/^\d+\.\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push({ type: 'numbered', items });
      continue;
    }

    // Callout block (> lines) — treated as callout/tip box
    if (line.startsWith('> ')) {
      const calloutLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        calloutLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'callout', text: calloutLines.join('\n').trim() });
      continue;
    }

    // Regular paragraph — collect until blank line or special line
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('## ') &&
      !lines[i].startsWith('### ') &&
      !lines[i].startsWith('> ') &&
      !lines[i].trim().startsWith('|') &&
      !/^[\-\*]\s/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      lines[i].trim() !== '---'
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ').trim() });
    }
  }

  return blocks;
}

// ============================================================
// PDF Builder
// ============================================================
class BlueprintPDF {
  constructor() {
    this.doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      autoFirstPage: false,
      bufferPages: true,
    });
    this.pageNum = 0;
    this.chapters = [];
    this.y = MARGIN;
  }

  drawPageBg() {
    this.doc
      .save()
      .rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
      .fill(COLORS.bg)
      .restore();
  }

  drawFooter(label) {
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
      .text(label || 'The AI Business Blueprint', MARGIN, y, {
        width: CONTENT_WIDTH / 2,
        align: 'left',
      })
      .text(`${this.pageNum}`, PAGE_WIDTH / 2, y, {
        width: CONTENT_WIDTH / 2,
        align: 'right',
      });
  }

  addPage(withFooter = true, footerLabel) {
    this.doc.addPage();
    this.pageNum++;
    this.drawPageBg();
    this.y = MARGIN;
    if (withFooter) this.drawFooter(footerLabel);
  }

  ensureSpace(needed) {
    if (this.y + needed > BODY_BOTTOM) {
      this.addPage(true);
      this.y = MARGIN;
    }
  }

  // --------------------------------------------------------
  // Inline bold rendering — handles **bold** within text
  // --------------------------------------------------------
  renderRichText(text, x, y, opts = {}) {
    const {
      font = 'Helvetica',
      boldFont = 'Helvetica-Bold',
      fontSize = 10.5,
      color = COLORS.textMuted,
      boldColor = COLORS.text,
      width = CONTENT_WIDTH,
      lineGap = 4,
    } = opts;

    // Split text by **bold** markers
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    const richParts = parts
      .filter(p => p.length > 0)
      .map(p => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return { text: p.slice(2, -2), bold: true };
        }
        return { text: p, bold: false };
      });

    // Build a single formatted text block
    this.doc.font(font).fontSize(fontSize).fillColor(color);

    // Use simple approach: render the whole thing as one text block
    // PDFKit doesn't support mixed inline fonts easily, so we render
    // bold text by rendering the full text with bold segments marked
    const fullText = richParts.map(p => p.text).join('');
    this.doc.text(fullText, x, y, { width, lineGap });
    return this.doc.y;
  }

  // Simpler version that just renders plain text with stripped bold markers
  renderText(text, x, opts = {}) {
    const {
      font = 'Helvetica',
      fontSize = 10.5,
      color = COLORS.textMuted,
      width = CONTENT_WIDTH,
      lineGap = 4,
      indent = 0,
    } = opts;

    // Strip bold markers for plain text rendering
    const clean = text.replace(/\*\*/g, '');

    this.doc.font(font).fontSize(fontSize).fillColor(color);
    this.doc.text(clean, x + indent, this.y, { width: width - indent, lineGap });
    this.y = this.doc.y;
  }

  // --------------------------------------------------------
  // Cover page
  // --------------------------------------------------------
  buildCover() {
    this.doc.addPage();
    this.pageNum = 0; // cover doesn't count
    this.drawPageBg();

    // Top accent bar
    this.doc.save().rect(0, 0, PAGE_WIDTH, 6).fill(COLORS.accent).restore();

    const cx = PAGE_WIDTH / 2;

    // Decorative top line
    this.doc
      .save()
      .moveTo(cx - 140, 190)
      .lineTo(cx + 140, 190)
      .strokeColor(COLORS.accent)
      .lineWidth(2)
      .stroke()
      .restore();

    // "THE AI" line
    this.doc
      .font('Helvetica-Bold')
      .fontSize(38)
      .fillColor(COLORS.accent)
      .text('THE AI', 0, 215, { width: PAGE_WIDTH, align: 'center' });

    // "BUSINESS" line
    this.doc
      .font('Helvetica-Bold')
      .fontSize(52)
      .fillColor(COLORS.text)
      .text('BUSINESS', 0, 258, { width: PAGE_WIDTH, align: 'center' });

    // "BLUEPRINT" line
    this.doc
      .font('Helvetica-Bold')
      .fontSize(52)
      .fillColor(COLORS.text)
      .text('BLUEPRINT', 0, 314, { width: PAGE_WIDTH, align: 'center' });

    // Decorative bottom line
    this.doc
      .save()
      .moveTo(cx - 140, 382)
      .lineTo(cx + 140, 382)
      .strokeColor(COLORS.accent)
      .lineWidth(2)
      .stroke()
      .restore();

    // Subtitle
    this.doc
      .font('Helvetica')
      .fontSize(16)
      .fillColor(COLORS.textMuted)
      .text('How to Run Your Business with AI Agents', 0, 405, {
        width: PAGE_WIDTH,
        align: 'center',
      });

    // Chapter badges
    const chapters = [
      'The Unfair Advantage',
      'Your AI Stack',
      'Automating the Repetitive',
      'AI Agents That Run Your Business',
      'Workflows That Print Money',
      'Scaling Without Hiring',
    ];
    const badgeY = 470;

    chapters.forEach((ch, i) => {
      const y = badgeY + i * 28;
      const badgeW = 260;
      const badgeX = cx - badgeW / 2;

      this.doc
        .save()
        .roundedRect(badgeX, y - 4, badgeW, 22, 4)
        .fillAndStroke(COLORS.bgCard, COLORS.bgCardBorder)
        .restore();

      this.doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(COLORS.accent)
        .text(`${i + 1}. ${ch}`, badgeX, y, { width: badgeW, align: 'center' });
    });

    // Bottom tagline
    this.doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.textDim)
      .text('A practical guide for solo founders, indie hackers, and solopreneurs', 0, 660, {
        width: PAGE_WIDTH,
        align: 'center',
      });

    // Bottom accent bar
    this.doc
      .save()
      .rect(0, PAGE_HEIGHT - 6, PAGE_WIDTH, 6)
      .fill(COLORS.accent)
      .restore();
  }

  // --------------------------------------------------------
  // Table of contents
  // --------------------------------------------------------
  buildTOC() {
    this.addPage();

    this.doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(COLORS.accent)
      .text('TABLE OF CONTENTS', MARGIN, MARGIN + 20);

    this.doc
      .save()
      .moveTo(MARGIN, MARGIN + 58)
      .lineTo(MARGIN + 220, MARGIN + 58)
      .strokeColor(COLORS.accent)
      .lineWidth(2)
      .stroke()
      .restore();

    let y = MARGIN + 80;

    this.chapters.forEach((ch, idx) => {
      // Chapter number + title
      this.doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(COLORS.text)
        .text(`Chapter ${idx + 1}`, MARGIN, y);

      y += 20;

      this.doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor(COLORS.accent)
        .text(ch.title, MARGIN + 20, y);

      y += 22;

      // Section listings
      ch.sections.forEach((sec) => {
        this.doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(COLORS.textMuted)
          .text(sec.heading, MARGIN + 30, y, { width: CONTENT_WIDTH - 30 });
        y += 18;
      });

      y += 10;
    });
  }

  // --------------------------------------------------------
  // Chapter divider page
  // --------------------------------------------------------
  buildChapterDivider(chapter, number) {
    this.addPage();

    const cx = PAGE_WIDTH / 2;

    // Large faded chapter number
    this.doc
      .font('Helvetica-Bold')
      .fontSize(140)
      .fillColor(COLORS.bgLight)
      .text(`0${number}`, 0, 160, { width: PAGE_WIDTH, align: 'center' });

    // Chapter label
    this.doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor(COLORS.accent)
      .text(`CHAPTER ${number}`, 0, 310, { width: PAGE_WIDTH, align: 'center' });

    // Chapter title
    this.doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(COLORS.text)
      .text(chapter.title, 0, 338, { width: PAGE_WIDTH, align: 'center' });

    // Accent line
    this.doc
      .save()
      .moveTo(cx - 80, 380)
      .lineTo(cx + 80, 380)
      .strokeColor(COLORS.accent)
      .lineWidth(3)
      .stroke()
      .restore();

    // Section count
    this.doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor(COLORS.textMuted)
      .text(`${chapter.sections.length} sections`, 0, 400, {
        width: PAGE_WIDTH,
        align: 'center',
      });
  }

  // --------------------------------------------------------
  // Render a table
  // --------------------------------------------------------
  renderTable(rows) {
    if (rows.length === 0) return;

    const numCols = rows[0].length;
    const colWidth = CONTENT_WIDTH / numCols;
    const rowHeight = 24;
    const headerHeight = 28;
    const totalHeight = headerHeight + (rows.length - 1) * rowHeight + 8;

    this.ensureSpace(totalHeight);

    const startX = MARGIN;
    let y = this.y;

    // Header row
    if (rows.length > 0) {
      // Header background
      this.doc
        .save()
        .rect(startX, y, CONTENT_WIDTH, headerHeight)
        .fill(COLORS.bgCard)
        .restore();

      // Header border bottom
      this.doc
        .save()
        .moveTo(startX, y + headerHeight)
        .lineTo(startX + CONTENT_WIDTH, y + headerHeight)
        .strokeColor(COLORS.accent)
        .lineWidth(1)
        .stroke()
        .restore();

      rows[0].forEach((cell, colIdx) => {
        this.doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(COLORS.accent)
          .text(cell, startX + colIdx * colWidth + 6, y + 8, {
            width: colWidth - 12,
            align: 'left',
          });
      });

      y += headerHeight;
    }

    // Data rows
    for (let r = 1; r < rows.length; r++) {
      // Alternate row bg
      if (r % 2 === 0) {
        this.doc
          .save()
          .rect(startX, y, CONTENT_WIDTH, rowHeight)
          .fill(COLORS.bgCard)
          .restore();
      }

      rows[r].forEach((cell, colIdx) => {
        this.doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(COLORS.textMuted)
          .text(cell, startX + colIdx * colWidth + 6, y + 6, {
            width: colWidth - 12,
            align: 'left',
          });
      });

      y += rowHeight;
    }

    // Bottom border
    this.doc
      .save()
      .moveTo(startX, y)
      .lineTo(startX + CONTENT_WIDTH, y)
      .strokeColor(COLORS.bgCardBorder)
      .lineWidth(0.5)
      .stroke()
      .restore();

    this.y = y + 12;
  }

  // --------------------------------------------------------
  // Render a callout box
  // --------------------------------------------------------
  renderCallout(text) {
    const clean = text.replace(/\*\*/g, '');
    const textH = this.doc
      .font('Helvetica')
      .fontSize(10)
      .heightOfString(clean, { width: CONTENT_WIDTH - 40 });

    const boxH = textH + 24;
    this.ensureSpace(boxH + 8);

    // Box background
    this.doc
      .save()
      .roundedRect(MARGIN, this.y, CONTENT_WIDTH, boxH, 4)
      .fill(COLORS.bgCard)
      .restore();

    // Left accent bar
    this.doc
      .save()
      .roundedRect(MARGIN, this.y, 4, boxH, 2)
      .fill(COLORS.insight)
      .restore();

    // Border
    this.doc
      .save()
      .roundedRect(MARGIN, this.y, CONTENT_WIDTH, boxH, 4)
      .strokeColor(COLORS.bgCardBorder)
      .lineWidth(1)
      .stroke()
      .restore();

    // Text
    this.doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.textMuted)
      .text(clean, MARGIN + 18, this.y + 12, {
        width: CONTENT_WIDTH - 40,
        lineGap: 3,
      });

    this.y = this.y + boxH + 12;
  }

  // --------------------------------------------------------
  // Render a horizontal rule
  // --------------------------------------------------------
  renderHR() {
    this.ensureSpace(20);
    const cx = PAGE_WIDTH / 2;
    this.doc
      .save()
      .moveTo(cx - 60, this.y + 6)
      .lineTo(cx + 60, this.y + 6)
      .strokeColor(COLORS.bgCardBorder)
      .lineWidth(1)
      .stroke()
      .restore();
    this.y += 20;
  }

  // --------------------------------------------------------
  // Render chapter body content
  // --------------------------------------------------------
  renderChapterContent(chapter, chapterNum) {
    chapter.sections.forEach((section) => {
      // Section heading
      this.ensureSpace(50);

      // Small accent line before heading
      this.doc
        .save()
        .moveTo(MARGIN, this.y)
        .lineTo(MARGIN + 40, this.y)
        .strokeColor(COLORS.accent)
        .lineWidth(2)
        .stroke()
        .restore();
      this.y += 10;

      this.doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor(COLORS.text)
        .text(section.heading, MARGIN, this.y, { width: CONTENT_WIDTH });
      this.y = this.doc.y + 14;

      // Parse and render body blocks
      const blocks = parseBody(section.body);

      for (const block of blocks) {
        switch (block.type) {
          case 'paragraph':
            this.ensureSpace(30);
            this.renderText(block.text, MARGIN, {
              font: 'Helvetica',
              fontSize: 10.5,
              color: COLORS.textMuted,
              lineGap: 4,
            });
            this.y += 8;
            break;

          case 'subheading':
            this.ensureSpace(36);
            this.doc
              .font('Helvetica-Bold')
              .fontSize(13)
              .fillColor(COLORS.accent)
              .text(block.text, MARGIN, this.y, { width: CONTENT_WIDTH });
            this.y = this.doc.y + 10;
            break;

          case 'bullets':
            for (const item of block.items) {
              this.ensureSpace(20);
              const clean = item.replace(/\*\*/g, '');

              // Check if item has bold label pattern "Label — description" or "Label: description"
              const labelMatch = clean.match(/^([^:—]+)[—:]\s*(.*)/);
              if (labelMatch) {
                this.doc
                  .font('Helvetica-Bold')
                  .fontSize(10)
                  .fillColor(COLORS.accent)
                  .text('\u2022', MARGIN, this.y, { continued: false });

                this.doc
                  .font('Helvetica-Bold')
                  .fontSize(10)
                  .fillColor(COLORS.text)
                  .text(labelMatch[1].trim(), MARGIN + 14, this.y - this.doc.currentLineHeight(), {
                    width: CONTENT_WIDTH - 14,
                    continued: false,
                  });

                if (labelMatch[2].trim()) {
                  this.y = this.doc.y;
                  this.doc
                    .font('Helvetica')
                    .fontSize(10)
                    .fillColor(COLORS.textMuted)
                    .text(labelMatch[2].trim(), MARGIN + 14, this.y, {
                      width: CONTENT_WIDTH - 14,
                    });
                }
              } else {
                this.doc
                  .font('Helvetica')
                  .fontSize(10)
                  .fillColor(COLORS.textMuted);

                // Bullet character
                this.doc.text('\u2022  ' + clean, MARGIN + 8, this.y, {
                  width: CONTENT_WIDTH - 16,
                  lineGap: 3,
                });
              }
              this.y = this.doc.y + 4;
            }
            this.y += 6;
            break;

          case 'numbered':
            block.items.forEach((item, idx) => {
              this.ensureSpace(20);
              const clean = item.replace(/\*\*/g, '');

              // Number badge
              const numText = `${idx + 1}.`;
              this.doc
                .font('Helvetica-Bold')
                .fontSize(10)
                .fillColor(COLORS.accent)
                .text(numText, MARGIN + 4, this.y);

              this.doc
                .font('Helvetica')
                .fontSize(10)
                .fillColor(COLORS.textMuted)
                .text(clean, MARGIN + 24, this.y - this.doc.currentLineHeight(), {
                  width: CONTENT_WIDTH - 28,
                  lineGap: 3,
                });

              this.y = this.doc.y + 4;
            });
            this.y += 6;
            break;

          case 'table':
            this.renderTable(block.rows);
            break;

          case 'callout':
            this.renderCallout(block.text);
            break;

          case 'hr':
            this.renderHR();
            break;

          default:
            break;
        }
      }

      this.y += 6;
    });
  }

  // --------------------------------------------------------
  // Closing page
  // --------------------------------------------------------
  buildClosing() {
    this.addPage(false);

    const cx = PAGE_WIDTH / 2;

    // Top accent bar
    this.doc.save().rect(0, 0, PAGE_WIDTH, 6).fill(COLORS.accent).restore();

    this.doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(COLORS.text)
      .text('Build the', 0, 220, { width: PAGE_WIDTH, align: 'center' });

    this.doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(COLORS.accent)
      .text('Business.', 0, 258, { width: PAGE_WIDTH, align: 'center' });

    this.doc
      .save()
      .moveTo(cx - 60, 302)
      .lineTo(cx + 60, 302)
      .strokeColor(COLORS.accent)
      .lineWidth(2)
      .stroke()
      .restore();

    this.doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor(COLORS.textMuted)
      .text(
        'Pick one workflow. Set up the tools.\nStart this week. Iterate from there.',
        0,
        325,
        { width: PAGE_WIDTH, align: 'center', lineGap: 6 }
      );

    // Action steps box
    const boxW = 340;
    const boxX = cx - boxW / 2;
    const boxY = 400;
    const boxH = 160;

    this.doc
      .save()
      .roundedRect(boxX, boxY, boxW, boxH, 6)
      .fillAndStroke(COLORS.bgCard, COLORS.bgCardBorder)
      .restore();

    // Left accent bar
    this.doc
      .save()
      .roundedRect(boxX, boxY, 4, boxH, 2)
      .fill(COLORS.action)
      .restore();

    this.doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(COLORS.action)
      .text('YOUR NEXT STEPS', boxX + 18, boxY + 14, { width: boxW - 36 });

    const steps = [
      'Choose one workflow from Chapter 5',
      'Set up your AI stack (Chapter 2)',
      'Automate your first task (Chapter 3)',
      'Build your first agent (Chapter 4)',
      'Scale when it works (Chapter 6)',
    ];

    let stepY = boxY + 36;
    steps.forEach((step, i) => {
      this.doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(COLORS.accent)
        .text(`${i + 1}.`, boxX + 18, stepY);

      this.doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(COLORS.textMuted)
        .text(step, boxX + 38, stepY, { width: boxW - 56 });

      stepY += 22;
    });

    // Bottom text
    this.doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(COLORS.textDim)
      .text('The AI Business Blueprint', 0, 610, { width: PAGE_WIDTH, align: 'center' });

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
    const chaptersDir = path.join(__dirname, 'chapters');
    const outputDir = path.join(__dirname, 'output');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'ai-business-blueprint.pdf');
    const writeStream = fs.createWriteStream(outputPath);
    this.doc.pipe(writeStream);

    // Load all chapters
    const chapterFiles = [
      '01-intro.md',
      '02-ai-stack.md',
      '03-automation.md',
      '04-agents.md',
      '05-workflows.md',
      '06-scaling.md',
    ];

    let totalWords = 0;

    for (const file of chapterFiles) {
      const filePath = path.join(chaptersDir, file);
      const chapter = parseChapter(filePath);
      this.chapters.push(chapter);

      // Count words
      const raw = fs.readFileSync(filePath, 'utf-8');
      totalWords += raw.split(/\s+/).filter(w => w.length > 0).length;
    }

    console.log(`Loaded ${this.chapters.length} chapters (~${totalWords} words)`);

    // Build pages
    this.buildCover();
    this.buildTOC();

    this.chapters.forEach((chapter, idx) => {
      this.buildChapterDivider(chapter, idx + 1);
      this.addPage();
      this.y = MARGIN;
      this.renderChapterContent(chapter, idx + 1);
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
        console.log(`  Words: ~${totalWords}`);
        resolve({ pages: this.pageNum, words: totalWords, sizeMB });
      });
      writeStream.on('error', reject);
    });
  }
}

// ============================================================
// Run
// ============================================================
const builder = new BlueprintPDF();
builder.build().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
