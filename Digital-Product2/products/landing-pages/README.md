# Landing Page Templates

3 premium, dark-mode landing page templates built with pure HTML, CSS, and minimal JS. No frameworks, no build tools, no dependencies. Download, edit the text, and deploy.

---

## What's Included

### 1. Starter — Simple Product Landing Page
**Best for:** SaaS products, services, apps, simple digital products.

A clean, modern landing page with plenty of whitespace and smooth hover effects. Sections: Hero, Features (4 cards), Social Proof (3 testimonials), Pricing (2 tiers), FAQ (5 collapsible items), Footer.

- **Files:** `templates/starter/index.html`, `templates/starter/styles.css`
- **Accent color:** Cyan (`#00d4ff`)

### 2. Creator — Digital Product Sales Page
**Best for:** Selling courses, ebooks, templates, guides, toolkits, digital downloads.

A bold, conversion-focused sales page designed to sell digital products. Includes a product mockup placeholder, problem/solution narrative flow, "What's Inside" breakdown with value stacking, creator bio section, and a single pricing card with crossed-out original price.

- **Files:** `templates/creator/index.html`, `templates/creator/styles.css`
- **Accent color:** Amber (`#f5a623`)

### 3. SaaS — Software/App Landing Page
**Best for:** SaaS products, web apps, developer tools, B2B software.

The most feature-rich template. Includes a sticky nav, product screenshot placeholder, logo strip, alternating image/text feature rows, 3-tier pricing table, testimonials, FAQ accordion, CTA banner, and a multi-column footer. Comes with a small JS file for mobile menu, FAQ toggle, and scroll-reveal animations.

- **Files:** `templates/saas/index.html`, `templates/saas/styles.css`, `templates/saas/script.js`
- **Accent color:** Blue (`#3b82f6`)

---

## Quick Start

1. **Download** the template folder you want (e.g., `templates/starter/`)
2. **Open** `index.html` in your code editor
3. **Edit** the text — look for `<!-- CUSTOMIZE: ... -->` comments throughout the HTML
4. **Change colors** — open `styles.css` and update the CSS variables at the top
5. **Replace placeholders** — swap gradient boxes with your actual images/screenshots
6. **Deploy** — drag the folder to Netlify, Vercel, or any static host

That's it. No `npm install`, no build step, no terminal commands.

---

## Customization Guide

### Changing Colors

Every template uses CSS custom properties (variables) at the top of `styles.css`. To change the accent color, update these lines:

```css
:root {
  --accent: #3b82f6;           /* Main accent color */
  --accent-hover: #2563eb;     /* Hover state */
  --accent-glow: rgba(59, 130, 246, 0.15);  /* Glow effects */
  --accent-subtle: rgba(59, 130, 246, 0.08); /* Subtle backgrounds */
}
```

**Popular color combos:**
| Color | Hex | Use case |
|-------|-----|----------|
| Blue | `#3b82f6` | SaaS, tech, trust |
| Cyan | `#00d4ff` | Modern, clean, tech |
| Amber | `#f5a623` | Warm, creator, sales |
| Purple | `#8b5cf6` | Creative, premium |
| Green | `#22c55e` | Finance, health, growth |
| Red | `#ef4444` | Urgency, bold |
| Pink | `#ec4899` | Creative, lifestyle |

### Changing Fonts

All templates use the system font stack by default (no external font files needed). To use a custom font:

1. Download your font files (`.woff2` preferred)
2. Add a `@font-face` rule at the top of `styles.css`
3. Update the `--font` variable

```css
@font-face {
  font-family: 'YourFont';
  src: url('YourFont.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  --font: 'YourFont', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Changing Content

Every piece of text in the HTML is marked with `<!-- CUSTOMIZE: ... -->` comments explaining what to change. Search for `CUSTOMIZE` in your editor to find them all.

### Adding Images

Replace placeholder `<div>` elements with actual `<img>` tags. Comments in the HTML show you exactly where:

```html
<!-- CUSTOMIZE: Replace with your photo:
     <img src="photo.jpg" alt="Your Name" class="creator-img"> -->
```

### Changing Backgrounds

Update the `--bg` variable for a different base color:

```css
:root {
  --bg: #0a0a0a;        /* Near-black (default) */
  --bg-raised: #111111;  /* Card backgrounds */
  --bg-elevated: #191919; /* Hover/active states */
}
```

---

## Deployment Options

All templates are static HTML files. Deploy anywhere that serves static files:

| Platform | How |
|----------|-----|
| **Netlify** | Drag & drop the template folder onto [app.netlify.com/drop](https://app.netlify.com/drop) |
| **Vercel** | Push to GitHub, connect the repo on [vercel.com](https://vercel.com) |
| **GitHub Pages** | Push to a repo, enable Pages in repo settings |
| **Cloudflare Pages** | Connect your repo on the Cloudflare dashboard |
| **Any web host** | Upload the files via FTP/SFTP |

---

## Template Details

### Starter Template Sections
1. **Hero** — Badge, headline, subheadline, two CTA buttons, trust text
2. **Features** — 4 feature cards with inline SVG icons in a 2x2 grid
3. **Social Proof** — 3 testimonial cards with star ratings and avatar placeholders
4. **Pricing** — 2-tier pricing (Starter + Pro) with featured card highlight
5. **FAQ** — 5 collapsible items using native `<details>/<summary>` (no JS needed)
6. **Footer** — Brand, nav links, social icons, copyright

### Creator Template Sections
1. **Hero** — Social proof eyebrow, bold headline, CTA, product mockup placeholder
2. **Problem/Solution** — Pain points with X icons, divider, solution intro
3. **What's Inside** — 6 content cards with numbered items and value pricing
4. **Creator Bio** — Photo placeholder, bio, 3 credibility stats
5. **Pricing** — Single card with crossed-out price, includes list, guarantee badge
6. **FAQ** — 5 collapsible items
7. **Final CTA** — Full-width closing section with CTA

### SaaS Template Sections
1. **Nav** — Sticky nav with logo, 4 section links, sign-in link, CTA button, mobile menu
2. **Hero** — Version badge, headline, subheadline, 2 CTAs, product screenshot placeholder
3. **Logos** — "Trusted by" strip with 6 logo placeholders
4. **Features** — 3 alternating image/text rows with feature lists
5. **Pricing** — 3-tier table (Free/Pro/Enterprise) with included/not-included indicators
6. **Testimonials** — 3 quote cards with avatars
7. **FAQ** — 6 accordion items with smooth JS toggle
8. **CTA Banner** — Full-width card with gradient glow and 2 buttons
9. **Footer** — 4-column grid (brand, product, company, legal)

---

## Technical Notes

- **No external dependencies** — Everything is self-contained. No CDN links, no npm packages.
- **Mobile-first responsive** — All templates look great on phones, tablets, and desktops.
- **Dark mode by default** — Dark backgrounds (#0a0a0a) with light text.
- **Accessible** — Semantic HTML, proper heading hierarchy, ARIA labels, keyboard-navigable.
- **Inline SVG icons** — No icon fonts or external icon libraries needed.
- **CSS-only FAQ** — Starter and Creator templates use `<details>/<summary>` for FAQ (no JS).
- **Minimal JS** — Only the SaaS template includes JS (for mobile menu, FAQ accordion, and scroll-reveal). The page works without JS.

---

## File Structure

```
landing-pages/
  README.md
  templates/
    starter/
      index.html
      styles.css
    creator/
      index.html
      styles.css
    saas/
      index.html
      styles.css
      script.js
```

---

## License

These templates are sold as a digital product. The buyer receives a license to use, modify, and deploy the templates for their own projects. Redistribution or resale of the templates themselves is not permitted.
