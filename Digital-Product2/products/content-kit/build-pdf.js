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
  tiktok: '#ff004f',
  twitter: '#1da1f2',
  instagram: '#e1306c',
  linkedin: '#0077b5',
  hookBadge: '#ff9f1c',
  calendarBadge: '#7b68ee',
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - 36;
const SAFE_BOTTOM = PAGE_HEIGHT - 72;

// ============================================================
// Markdown parsers — extract structured content from .md files
// ============================================================

function parseTikTokScripts(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const sections = raw.split(/\n---\n/).slice(1); // skip intro
  const scripts = [];

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const titleMatch = lines[0] && lines[0].match(/^## \d+\.\s+(.+)/);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    let hook = '', body = '', cta = '', caption = '';
    let current = '';
    const parts = { hook: [], body: [], cta: [], caption: [] };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('**Hook')) { current = 'hook'; continue; }
      if (line.startsWith('**Body')) { current = 'body'; continue; }
      if (line.startsWith('**CTA')) { current = 'cta'; continue; }
      if (line.startsWith('**Suggested caption')) { current = 'caption'; continue; }
      if (current && parts[current]) parts[current].push(line);
    }

    scripts.push({
      title,
      hook: parts.hook.join('\n').trim(),
      body: parts.body.join('\n').trim(),
      cta: parts.cta.join('\n').trim(),
      caption: parts.caption.join('\n').trim(),
    });
  }
  return scripts;
}

function parseTwitterThreads(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const sections = raw.split(/\n---\n/).slice(1);
  const threads = [];

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const titleMatch = lines[0] && lines[0].match(/^## \d+\.\s+(.+)/);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    let whenToPost = '';
    const tweets = [];
    let currentTweet = null;
    let tweetLines = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('**When to post:**')) {
        whenToPost = line.replace('**When to post:**', '').trim();
        continue;
      }

      const tweetMatch = line.match(/^\*\*Tweet \d+.*?\*\*:?/);
      if (tweetMatch) {
        if (currentTweet !== null) {
          tweets.push(tweetLines.join('\n').trim());
        }
        currentTweet = tweets.length;
        tweetLines = [];
        continue;
      }

      if (currentTweet !== null) {
        tweetLines.push(line);
      }
    }
    if (currentTweet !== null) tweets.push(tweetLines.join('\n').trim());

    threads.push({ title, whenToPost, tweets });
  }
  return threads;
}

function parseCarousels(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const sections = raw.split(/\n---\n/).slice(1);
  const carousels = [];

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const titleMatch = lines[0] && lines[0].match(/^## \d+\.\s+(.+)/);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    let platform = '';
    const slides = [];
    let currentSlide = null;
    let slideLines = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('**Platform:**')) {
        platform = line.replace('**Platform:**', '').trim();
        continue;
      }

      const slideMatch = line.match(/^\*\*Slide \d+.*?\*\*:?/);
      if (slideMatch) {
        if (currentSlide !== null) slides.push(slideLines.join('\n').trim());
        currentSlide = slides.length;
        slideLines = [];
        continue;
      }

      if (currentSlide !== null) slideLines.push(line);
    }
    if (currentSlide !== null) slides.push(slideLines.join('\n').trim());

    carousels.push({ title, platform, slides });
  }
  return carousels;
}

function parseCalendar(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');
  const rows = [];

  for (const line of lines) {
    const match = line.match(/^\|\s*(\d+)\s*\|(.+)\|$/);
    if (match) {
      const cols = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cols.length >= 6) {
        rows.push({
          day: cols[0],
          platform: cols[1],
          type: cols[2],
          template: cols[3],
          topic: cols[4],
          time: cols[5],
        });
      }
    }
  }
  return rows;
}

function parseHooks(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const sections = raw.split(/\n---\n/).slice(1);
  const hooks = [];

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const titleMatch = lines[0] && lines[0].match(/^## \d+\.\s+(.+)/);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    let formula = '', example = '', whyItWorks = '', bestFor = '';
    let current = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('**The formula:**')) { current = 'formula'; continue; }
      if (line.startsWith('**Example:**')) {
        example = line.replace('**Example:**', '').trim().replace(/^"/, '').replace(/"$/, '');
        current = '';
        continue;
      }
      if (line.startsWith('**Why it works:**')) {
        whyItWorks = line.replace('**Why it works:**', '').trim();
        current = '';
        continue;
      }
      if (line.startsWith('**Best for:**')) {
        bestFor = line.replace('**Best for:**', '').trim();
        current = '';
        continue;
      }
      if (current === 'formula' && line.trim()) {
        formula = line.trim().replace(/^"/, '').replace(/"$/, '');
        current = '';
      }
    }

    hooks.push({ title, formula, example, whyItWorks, bestFor });
  }
  return hooks;
}

// ============================================================
// Clean text for PDF rendering
// ============================================================
function cleanText(text) {
  return text
    .replace(/\*\[([^\]]+)\]\*/g, '$1')  // *[text]* -> text
    .replace(/\*([^*]+)\*/g, '$1')        // *text* -> text
    .replace(/\[([^\]]+)\]/g, '[$1]')     // keep [BLANKS] as-is
    .trim();
}

// ============================================================
// PDF Builder
// ============================================================
class ContentKitPDF {
  constructor() {
    this.doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      autoFirstPage: false,
      bufferPages: true,
    });
    this.pageNum = 0;
    this.tocEntries = [];
  }

  drawPageBg() {
    this.doc
      .save()
      .rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
      .fill(COLORS.bg)
      .restore();
  }

  drawFooter() {
    const y = FOOTER_Y;
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
      .text('The Build-in-Public Content Kit', MARGIN, y, {
        width: CONTENT_WIDTH / 2,
        align: 'left',
      })
      .text(`${this.pageNum}`, PAGE_WIDTH / 2, y, {
        width: CONTENT_WIDTH / 2,
        align: 'right',
      });
  }

  addPage() {
    this.doc.addPage();
    this.pageNum++;
    this.drawPageBg();
  }

  // Ensure enough space; add new page if needed. Returns current y.
  ensureSpace(y, needed) {
    if (y + needed > SAFE_BOTTOM) {
      this.addPage();
      this.drawFooter();
      return MARGIN;
    }
    return y;
  }

  // Draw a card (rounded rect with left accent bar)
  drawCard(x, y, w, h, accentColor) {
    accentColor = accentColor || COLORS.accent;
    this.doc
      .save()
      .roundedRect(x, y, w, h, 6)
      .fill(COLORS.bgCard)
      .restore();
    this.doc
      .save()
      .roundedRect(x, y, 4, h, 2)
      .fill(accentColor)
      .restore();
    this.doc
      .save()
      .roundedRect(x, y, w, h, 6)
      .strokeColor(COLORS.bgCardBorder)
      .lineWidth(1)
      .stroke()
      .restore();
  }

  // Draw a small badge label
  drawBadge(x, y, text, bgColor, textColor) {
    textColor = textColor || COLORS.text;
    const w = this.doc.font('Helvetica-Bold').fontSize(8).widthOfString(text) + 16;
    this.doc
      .save()
      .roundedRect(x, y, w, 18, 3)
      .fill(bgColor)
      .restore();
    this.doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(textColor)
      .text(text, x + 8, y + 4, { lineBreak: false });
    return w;
  }

  // ============================================================
  // Cover page
  // ============================================================
  buildCover() {
    this.addPage();

    // Top accent bar
    this.doc.save().rect(0, 0, PAGE_WIDTH, 6).fill(COLORS.accent).restore();

    const cx = PAGE_WIDTH / 2;

    // Decorative line
    this.doc.save()
      .moveTo(cx - 140, 190).lineTo(cx + 140, 190)
      .strokeColor(COLORS.accent).lineWidth(2).stroke().restore();

    // Title
    this.doc.font('Helvetica-Bold').fontSize(38).fillColor(COLORS.accent)
      .text('THE BUILD-IN-PUBLIC', 0, 210, { width: PAGE_WIDTH, align: 'center' });

    this.doc.font('Helvetica-Bold').fontSize(48).fillColor(COLORS.text)
      .text('CONTENT KIT', 0, 255, { width: PAGE_WIDTH, align: 'center' });

    // Decorative line
    this.doc.save()
      .moveTo(cx - 140, 318).lineTo(cx + 140, 318)
      .strokeColor(COLORS.accent).lineWidth(2).stroke().restore();

    // Subtitle
    this.doc.font('Helvetica').fontSize(16).fillColor(COLORS.textMuted)
      .text('Templates, Scripts, Threads, and Hooks', 0, 338, { width: PAGE_WIDTH, align: 'center' });
    this.doc.font('Helvetica').fontSize(14).fillColor(COLORS.textMuted)
      .text('for Creators Who Build in Public', 0, 362, { width: PAGE_WIDTH, align: 'center' });

    // Content badges
    const badges = [
      '15 TikTok Scripts',
      '10 Twitter Thread Templates',
      '8 Carousel Formats',
      '30-Day Content Calendar',
      '20 Hook Formulas',
    ];
    const badgeY = 420;
    badges.forEach((badge, i) => {
      const y = badgeY + i * 30;
      const badgeW = 220;
      const badgeX = cx - badgeW / 2;
      this.doc.save()
        .roundedRect(badgeX, y - 4, badgeW, 24, 4)
        .fillAndStroke(COLORS.bgCard, COLORS.bgCardBorder)
        .restore();
      this.doc.font('Helvetica').fontSize(11).fillColor(COLORS.accent)
        .text(badge, badgeX, y, { width: badgeW, align: 'center' });
    });

    // Bottom tagline
    this.doc.font('Helvetica').fontSize(10).fillColor(COLORS.textDim)
      .text('Fill in the blanks. Post. Grow.', 0, 620, { width: PAGE_WIDTH, align: 'center' });

    // Bottom accent bar
    this.doc.save().rect(0, PAGE_HEIGHT - 6, PAGE_WIDTH, 6).fill(COLORS.accent).restore();

    // Reset page count (cover doesn't count)
    this.pageNum = 0;
  }

  // ============================================================
  // Table of contents
  // ============================================================
  buildTOC() {
    this.addPage();
    this.drawFooter();

    this.doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.accent)
      .text('TABLE OF CONTENTS', MARGIN, MARGIN + 20);

    this.doc.save()
      .moveTo(MARGIN, MARGIN + 58).lineTo(MARGIN + 240, MARGIN + 58)
      .strokeColor(COLORS.accent).lineWidth(2).stroke().restore();

    let y = MARGIN + 78;
    const chapters = [
      { num: 1, title: 'TikTok Script Templates', count: '15 scripts' },
      { num: 2, title: 'Twitter/X Thread Templates', count: '10 threads' },
      { num: 3, title: 'Carousel Formats', count: '8 carousels' },
      { num: 4, title: '30-Day Content Calendar', count: '30 days mapped' },
      { num: 5, title: 'Hook Formula Guide', count: '20 formulas' },
    ];

    chapters.forEach(ch => {
      this.doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.text)
        .text(`${ch.num}.`, MARGIN, y, { continued: true })
        .fillColor(COLORS.accent)
        .text(`  ${ch.title}`);
      y = this.doc.y + 4;
      this.doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted)
        .text(ch.count, MARGIN + 24, y);
      y = this.doc.y + 20;
    });

    // How to use
    y += 10;
    this.doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.accent)
      .text('How to Use This Kit', MARGIN, y);
    y = this.doc.y + 12;

    const instructions = [
      'Pick a template that fits your content goal for the day.',
      'Fill in the [BLANKS] with your own project details, numbers, and stories.',
      'Follow the 30-day calendar for a complete posting schedule.',
      'Use the hook formulas to strengthen any piece of content.',
      'Adapt and remix — these are starting points, not rigid scripts.',
    ];

    instructions.forEach((inst, i) => {
      this.doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted)
        .text(`${i + 1}. ${inst}`, MARGIN + 4, y, { width: CONTENT_WIDTH - 8 });
      y = this.doc.y + 6;
    });
  }

  // ============================================================
  // Chapter header page
  // ============================================================
  buildChapterHeader(title, number, subtitle) {
    this.addPage();
    this.drawFooter();
    this.tocEntries.push({ title, page: this.pageNum });

    const cx = PAGE_WIDTH / 2;

    // Large faded chapter number
    this.doc.font('Helvetica-Bold').fontSize(140).fillColor(COLORS.bgLight)
      .text(`0${number}`, 0, 160, { width: PAGE_WIDTH, align: 'center' });

    // Title overlay
    this.doc.font('Helvetica-Bold').fontSize(30).fillColor(COLORS.text)
      .text(title.toUpperCase(), 0, 300, { width: PAGE_WIDTH, align: 'center' });

    // Accent underline
    this.doc.save()
      .moveTo(cx - 80, 342).lineTo(cx + 80, 342)
      .strokeColor(COLORS.accent).lineWidth(3).stroke().restore();

    // Subtitle
    this.doc.font('Helvetica').fontSize(14).fillColor(COLORS.textMuted)
      .text(subtitle, 0, 360, { width: PAGE_WIDTH, align: 'center' });
  }

  // ============================================================
  // TikTok scripts chapter
  // ============================================================
  buildTikTokChapter(scripts) {
    this.buildChapterHeader('TikTok Scripts', 1, `${scripts.length} Fill-in-the-Blank Video Scripts`);

    scripts.forEach((script, idx) => {
      this.addPage();
      this.drawFooter();
      let y = MARGIN;

      // Header
      this.doc.font('Helvetica').fontSize(9).fillColor(COLORS.accent)
        .text(`TIKTOK SCRIPTS  /  SCRIPT ${idx + 1}`, MARGIN, y);
      y += 22;

      // Title
      this.doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.text)
        .text(script.title, MARGIN, y, { width: CONTENT_WIDTH });
      y = this.doc.y + 14;

      // Hook section
      const hookBadgeW = this.drawBadge(MARGIN, y, 'HOOK', COLORS.tiktok);
      y += 26;

      const hookText = cleanText(script.hook);
      const hookH = this.doc.font('Helvetica').fontSize(10)
        .heightOfString(hookText, { width: CONTENT_WIDTH - 36 }) + 24;

      y = this.ensureSpace(y, hookH + 10);
      this.drawCard(MARGIN, y, CONTENT_WIDTH, hookH, COLORS.tiktok);
      this.doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted)
        .text(hookText, MARGIN + 16, y + 12, { width: CONTENT_WIDTH - 36, lineGap: 3 });
      y += hookH + 12;

      // Body section
      y = this.ensureSpace(y, 50);
      this.drawBadge(MARGIN, y, 'BODY', COLORS.accent);
      y += 26;

      const bodyText = cleanText(script.body);
      const bodyH = this.doc.font('Helvetica').fontSize(10)
        .heightOfString(bodyText, { width: CONTENT_WIDTH - 36 }) + 24;

      // Body can be long, might need page break
      if (y + bodyH > SAFE_BOTTOM) {
        this.addPage();
        this.drawFooter();
        y = MARGIN;
      }

      this.drawCard(MARGIN, y, CONTENT_WIDTH, Math.min(bodyH, SAFE_BOTTOM - y), COLORS.accent);
      this.doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted)
        .text(bodyText, MARGIN + 16, y + 12, { width: CONTENT_WIDTH - 36, lineGap: 3 });
      y = this.doc.y + 16;

      // CTA section
      y = this.ensureSpace(y, 80);
      this.drawBadge(MARGIN, y, 'CTA', COLORS.hookBadge, '#000000');
      y += 26;

      const ctaText = cleanText(script.cta);
      const ctaH = this.doc.font('Helvetica').fontSize(10)
        .heightOfString(ctaText, { width: CONTENT_WIDTH - 36 }) + 24;

      y = this.ensureSpace(y, ctaH + 10);
      this.drawCard(MARGIN, y, CONTENT_WIDTH, ctaH, COLORS.hookBadge);
      this.doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted)
        .text(ctaText, MARGIN + 16, y + 12, { width: CONTENT_WIDTH - 36, lineGap: 3 });
      y += ctaH + 12;

      // Caption
      y = this.ensureSpace(y, 60);
      if (script.caption) {
        this.drawBadge(MARGIN, y, 'CAPTION', COLORS.textDim);
        y += 24;
        this.doc.font('Helvetica').fontSize(9).fillColor(COLORS.textDim)
          .text(cleanText(script.caption), MARGIN + 4, y, { width: CONTENT_WIDTH - 8 });
      }
    });
  }

  // ============================================================
  // Twitter threads chapter
  // ============================================================
  buildTwitterChapter(threads) {
    this.buildChapterHeader('Twitter/X Threads', 2, `${threads.length} Thread Templates`);

    threads.forEach((thread, idx) => {
      this.addPage();
      this.drawFooter();
      let y = MARGIN;

      // Header
      this.doc.font('Helvetica').fontSize(9).fillColor(COLORS.accent)
        .text(`TWITTER/X THREADS  /  THREAD ${idx + 1}`, MARGIN, y);
      y += 22;

      // Title
      this.doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.text)
        .text(thread.title, MARGIN, y, { width: CONTENT_WIDTH });
      y = this.doc.y + 8;

      // When to post
      if (thread.whenToPost) {
        this.drawBadge(MARGIN, y, 'WHEN TO POST', COLORS.calendarBadge);
        y += 22;
        this.doc.font('Helvetica').fontSize(9).fillColor(COLORS.textMuted)
          .text(thread.whenToPost, MARGIN + 4, y, { width: CONTENT_WIDTH });
        y = this.doc.y + 12;
      }

      // Tweets
      thread.tweets.forEach((tweet, tIdx) => {
        const tweetText = cleanText(tweet);
        const tweetH = this.doc.font('Helvetica').fontSize(10)
          .heightOfString(tweetText, { width: CONTENT_WIDTH - 40 }) + 30;

        y = this.ensureSpace(y, Math.min(tweetH, 200) + 10);

        // Tweet number circle
        this.doc.save()
          .circle(MARGIN + 10, y + 10, 10)
          .fill(COLORS.twitter)
          .restore();
        this.doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.text)
          .text(`${tIdx + 1}`, MARGIN + 5, y + 6, { width: 12, align: 'center' });

        // Tweet card
        const cardH = tweetH;
        this.drawCard(MARGIN + 26, y, CONTENT_WIDTH - 26, cardH, COLORS.twitter);
        this.doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted)
          .text(tweetText, MARGIN + 40, y + 12, { width: CONTENT_WIDTH - 60, lineGap: 3 });

        y = this.doc.y + 16;
      });
    });
  }

  // ============================================================
  // Carousel chapter
  // ============================================================
  buildCarouselChapter(carousels) {
    this.buildChapterHeader('Carousel Formats', 3, `${carousels.length} Carousel Templates`);

    carousels.forEach((carousel, idx) => {
      this.addPage();
      this.drawFooter();
      let y = MARGIN;

      // Header
      this.doc.font('Helvetica').fontSize(9).fillColor(COLORS.accent)
        .text(`CAROUSEL FORMATS  /  CAROUSEL ${idx + 1}`, MARGIN, y);
      y += 22;

      // Title
      this.doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.text)
        .text(carousel.title, MARGIN, y, { width: CONTENT_WIDTH });
      y = this.doc.y + 8;

      // Platform badge
      if (carousel.platform) {
        const platColor = carousel.platform.toLowerCase().includes('linkedin')
          ? COLORS.linkedin : COLORS.instagram;
        this.drawBadge(MARGIN, y, carousel.platform.toUpperCase(), platColor);
        y += 26;
      }

      // Slides
      carousel.slides.forEach((slide, sIdx) => {
        const slideText = cleanText(slide);
        const slideH = this.doc.font('Helvetica').fontSize(10)
          .heightOfString(slideText, { width: CONTENT_WIDTH - 40 }) + 28;

        y = this.ensureSpace(y, Math.min(slideH, 180) + 10);

        // Slide number
        const label = sIdx === 0 ? 'COVER' : sIdx === carousel.slides.length - 1 ? 'CTA' : `SLIDE ${sIdx + 1}`;
        this.doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.accent)
          .text(label, MARGIN, y + 2);
        y += 16;

        // Slide card
        this.drawCard(MARGIN, y, CONTENT_WIDTH, slideH, COLORS.instagram);
        this.doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted)
          .text(slideText, MARGIN + 16, y + 12, { width: CONTENT_WIDTH - 36, lineGap: 3 });

        y = this.doc.y + 14;
      });
    });
  }

  // ============================================================
  // Calendar chapter
  // ============================================================
  buildCalendarChapter(rows) {
    this.buildChapterHeader('Content Calendar', 4, '30 Days of Content Mapped Out');

    // Split into pages of ~10 rows each
    const rowsPerPage = 10;

    for (let i = 0; i < rows.length; i += rowsPerPage) {
      this.addPage();
      this.drawFooter();
      let y = MARGIN;

      if (i === 0) {
        this.doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.accent)
          .text('YOUR 30-DAY POSTING SCHEDULE', MARGIN, y);
        y += 28;
      }

      // Table header
      const colWidths = [35, 75, 85, 65, 200, 55];
      const headers = ['Day', 'Platform', 'Type', 'Template', 'Topic', 'Time'];

      // Header row bg
      this.doc.save()
        .rect(MARGIN, y, CONTENT_WIDTH, 22)
        .fill(COLORS.bgCard)
        .restore();

      let x = MARGIN + 4;
      headers.forEach((h, hIdx) => {
        this.doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.accent)
          .text(h, x, y + 6, { width: colWidths[hIdx], align: 'left' });
        x += colWidths[hIdx];
      });
      y += 26;

      // Data rows
      const pageRows = rows.slice(i, i + rowsPerPage);
      pageRows.forEach((row, rIdx) => {
        const isRest = row.platform === '\u2014' || row.platform === '---' || row.platform === '-';
        const rowBg = rIdx % 2 === 0 ? COLORS.bg : COLORS.bgLight;

        this.doc.save()
          .rect(MARGIN, y, CONTENT_WIDTH, 38)
          .fill(rowBg)
          .restore();

        // Left accent for rest days
        if (isRest) {
          this.doc.save()
            .rect(MARGIN, y, 3, 38)
            .fill(COLORS.calendarBadge)
            .restore();
        }

        x = MARGIN + 4;
        const vals = [row.day, row.platform, row.type, row.template, row.topic, row.time];
        vals.forEach((val, vIdx) => {
          const color = vIdx === 0 ? COLORS.accent : COLORS.textMuted;
          this.doc.font('Helvetica').fontSize(8).fillColor(color)
            .text(val || '', x, y + 6, { width: colWidths[vIdx] - 4, height: 32 });
          x += colWidths[vIdx];
        });
        y += 40;
      });
    }
  }

  // ============================================================
  // Hooks chapter
  // ============================================================
  buildHooksChapter(hooks) {
    this.buildChapterHeader('Hook Formulas', 5, `${hooks.length} Proven Hook Formulas`);

    hooks.forEach((hook, idx) => {
      // Each hook gets its own section, but we can fit ~2-3 per page
      let y = this.doc.y || MARGIN;

      // Check if we need a new page (or if this is the first hook)
      if (idx === 0 || y > SAFE_BOTTOM - 200) {
        this.addPage();
        this.drawFooter();
        y = MARGIN;
      }

      // Hook number + title
      this.doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.accent)
        .text(`${idx + 1}.`, MARGIN, y, { continued: true })
        .fillColor(COLORS.text)
        .text(`  ${hook.title}`);
      y = this.doc.y + 8;

      // Formula card
      const formulaText = hook.formula || '';
      const formulaH = this.doc.font('Helvetica-Bold').fontSize(11)
        .heightOfString(formulaText, { width: CONTENT_WIDTH - 36 }) + 20;

      y = this.ensureSpace(y, formulaH + 80);
      this.drawCard(MARGIN, y, CONTENT_WIDTH, formulaH, COLORS.accent);
      this.doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.text)
        .text(formulaText, MARGIN + 16, y + 10, { width: CONTENT_WIDTH - 36 });
      y += formulaH + 10;

      // Example
      if (hook.example) {
        y = this.ensureSpace(y, 40);
        this.drawBadge(MARGIN, y, 'EXAMPLE', COLORS.hookBadge, '#000000');
        y += 22;
        this.doc.font('Helvetica').fontSize(10).fillColor(COLORS.textMuted)
          .text(`"${hook.example}"`, MARGIN + 4, y, { width: CONTENT_WIDTH - 8 });
        y = this.doc.y + 8;
      }

      // Why it works
      if (hook.whyItWorks) {
        y = this.ensureSpace(y, 40);
        this.drawBadge(MARGIN, y, 'WHY IT WORKS', COLORS.calendarBadge);
        y += 22;
        this.doc.font('Helvetica').fontSize(9).fillColor(COLORS.textMuted)
          .text(hook.whyItWorks, MARGIN + 4, y, { width: CONTENT_WIDTH - 8 });
        y = this.doc.y + 8;
      }

      // Best for
      if (hook.bestFor) {
        y = this.ensureSpace(y, 30);
        this.drawBadge(MARGIN, y, 'BEST FOR', COLORS.textDim);
        y += 22;
        this.doc.font('Helvetica').fontSize(9).fillColor(COLORS.textDim)
          .text(hook.bestFor, MARGIN + 4, y, { width: CONTENT_WIDTH - 8 });
        y = this.doc.y + 20;
      }

      // Separator line
      if (idx < hooks.length - 1 && y < SAFE_BOTTOM - 30) {
        this.doc.save()
          .moveTo(MARGIN + 40, y)
          .lineTo(PAGE_WIDTH - MARGIN - 40, y)
          .strokeColor(COLORS.bgCardBorder)
          .lineWidth(0.5)
          .stroke()
          .restore();
        y += 16;
      }

      // Store y position for next hook
      this.doc.y = y;
    });
  }

  // ============================================================
  // Closing page
  // ============================================================
  buildClosing() {
    this.addPage();
    const cx = PAGE_WIDTH / 2;

    this.doc.save().rect(0, 0, PAGE_WIDTH, 6).fill(COLORS.accent).restore();

    this.doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.text)
      .text('Start Creating', 0, 230, { width: PAGE_WIDTH, align: 'center' });
    this.doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.accent)
      .text('Start Growing', 0, 265, { width: PAGE_WIDTH, align: 'center' });

    this.doc.save()
      .moveTo(cx - 60, 310).lineTo(cx + 60, 310)
      .strokeColor(COLORS.accent).lineWidth(2).stroke().restore();

    this.doc.font('Helvetica').fontSize(13).fillColor(COLORS.textMuted)
      .text(
        'Every template in this kit is a starting point.\nFill in the blanks. Make them yours. Hit publish.\nThe audience is waiting for your story.',
        0, 335,
        { width: PAGE_WIDTH, align: 'center', lineGap: 6 }
      );

    this.doc.font('Helvetica').fontSize(11).fillColor(COLORS.textDim)
      .text('The Build-in-Public Content Kit', 0, 420, { width: PAGE_WIDTH, align: 'center' });

    this.doc.save().rect(0, PAGE_HEIGHT - 6, PAGE_WIDTH, 6).fill(COLORS.accent).restore();
  }

  // ============================================================
  // Build the full PDF
  // ============================================================
  async build() {
    const templatesDir = path.join(__dirname, 'templates');
    const outputDir = path.join(__dirname, 'output');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'build-in-public-content-kit.pdf');
    const writeStream = fs.createWriteStream(outputPath);
    this.doc.pipe(writeStream);

    // Parse all content
    console.log('Parsing content files...');
    const scripts = parseTikTokScripts(path.join(templatesDir, 'tiktok-scripts.md'));
    const threads = parseTwitterThreads(path.join(templatesDir, 'twitter-threads.md'));
    const carousels = parseCarousels(path.join(templatesDir, 'carousel-formats.md'));
    const calendar = parseCalendar(path.join(templatesDir, 'content-calendar.md'));
    const hooks = parseHooks(path.join(templatesDir, 'hook-formulas.md'));

    console.log(`  TikTok scripts: ${scripts.length}`);
    console.log(`  Twitter threads: ${threads.length}`);
    console.log(`  Carousels: ${carousels.length}`);
    console.log(`  Calendar days: ${calendar.length}`);
    console.log(`  Hook formulas: ${hooks.length}`);

    // Build pages
    console.log('\nBuilding PDF...');
    this.buildCover();
    this.buildTOC();
    this.buildTikTokChapter(scripts);
    this.buildTwitterChapter(threads);
    this.buildCarouselChapter(carousels);
    this.buildCalendarChapter(calendar);
    this.buildHooksChapter(hooks);
    this.buildClosing();

    // Finalize
    this.doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        const stats = fs.statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(0);
        console.log('\nPDF generated successfully!');
        console.log(`  Output: ${outputPath}`);
        console.log(`  Pages: ${this.pageNum}`);
        console.log(`  Size: ${sizeKB} KB`);
        console.log(`  Content: ${scripts.length} scripts, ${threads.length} threads, ${carousels.length} carousels, ${calendar.length} calendar days, ${hooks.length} hooks`);
        resolve();
      });
      writeStream.on('error', reject);
    });
  }
}

// ============================================================
// Run
// ============================================================
const builder = new ContentKitPDF();
builder.build().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
