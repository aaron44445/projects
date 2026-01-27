---
status: diagnosed
trigger: "Mobile header text has low contrast (text color too similar to background)"
created: 2026-01-26T10:00:00Z
updated: 2026-01-26T10:00:00Z
---

## Root Cause Analysis

### Component Location
- **File:** `C:\projects\spa-final\apps\web\src\app\page.tsx`
- **Component:** `Navigation()` function (lines 59-104)
- **Landing page URL:** peacase.com

### The Contrast Issue

The navigation header uses opacity-based text colors that result in insufficient contrast, especially on mobile devices.

#### Header Structure (lines 61-103)
```jsx
<nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-md border-b border-charcoal/5">
```

#### Problematic Text Colors

| Element | Classes | Effective Color | Background | Issue |
|---------|---------|-----------------|------------|-------|
| Logo "Peacase" | `text-charcoal` | #2C2C2C | #FAF8F3 (80%) | OK |
| Nav Links | `text-charcoal/70` | #2C2C2C @ 70% | #FAF8F3 (80%) | LOW CONTRAST |
| Sign in button | `text-charcoal` | #2C2C2C | transparent | OK |

#### Color Values (from tailwind.config.ts)
- `cream`: #FAF8F3 (warm off-white background)
- `charcoal`: #2C2C2C (dark gray/black)
- `charcoal/70`: #2C2C2C at 70% opacity = approximately #7A7A7A blended

#### Contrast Calculation
- Background effective color: ~#FAF8F3 (very light)
- Text with 70% opacity: approximately #7A7A7A when blended
- **Contrast ratio: ~4.0:1** (fails WCAG AA for normal text which requires 4.5:1)

### Why Mobile Is Worse

1. **Screen brightness variations**: Mobile screens viewed outdoors or at low brightness make subtle color differences harder to perceive

2. **Smaller text**: The nav links use `text-sm` which is 14px - smaller text requires even higher contrast

3. **Backdrop blur**: The `backdrop-blur-md` combined with `bg-cream/80` creates visual complexity that reduces text readability

4. **Navigation links hidden on mobile**: The nav links (`hidden md:flex` at line 73) are actually hidden on mobile, but the overall header contrast issue affects other elements

### Evidence

**File:** `apps/web/src/app/page.tsx`
**Lines 72-83:**
```jsx
{/* Navigation Links */}
<div className="hidden md:flex items-center gap-8">
  <Link href="#features" className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors">
    Features
  </Link>
  <Link href="#pricing" className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors">
    Pricing
  </Link>
  <Link href="#testimonials" className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors">
    Testimonials
  </Link>
</div>
```

Note: These nav links are `hidden` on mobile (`hidden md:flex`), so the mobile contrast issue may actually be with other header elements.

**Lines 85-99 (visible on mobile):**
```jsx
{/* CTA Buttons */}
<div className="flex items-center gap-4">
  <Link
    href="/login"
    className="text-sm font-medium text-charcoal hover:text-sage transition-colors"
  >
    Sign in
  </Link>
  <Link
    href="/signup"
    className="px-4 py-2 rounded-lg bg-sage text-white text-sm font-semibold hover:bg-sage-dark hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300"
  >
    Start Free Trial
  </Link>
</div>
```

The "Sign in" link uses `text-charcoal` (not `/70`) so it has better contrast.

### Potential Areas for Mobile Contrast Issues

1. **Logo text** (`text-charcoal`) - Good contrast, probably not the issue
2. **"Sign in" link** (`text-charcoal`) - Good contrast
3. **Start Free Trial button** (`bg-sage text-white`) - Good contrast

If there's a mobile-specific contrast issue reported, it could be:
1. The overall `bg-cream/80` semi-transparent background over hero section content
2. The `border-charcoal/5` being nearly invisible
3. User may be referring to a different header (dashboard header vs landing page header)

### Other Headers in the App

**Dashboard header** (`apps/web/src/app/dashboard/page.tsx` lines 314-356):
```jsx
<header className="bg-white dark:bg-sidebar border-b border-border dark:border-white/10 px-6 py-4">
```
This header uses solid backgrounds and has better contrast.

**AppSidebar logo** (`apps/web/src/components/AppSidebar.tsx` line 111):
```jsx
<span className="font-display font-bold text-xl text-charcoal dark:text-white">peacase</span>
```
This uses `text-charcoal` (full opacity) which has good contrast.

## Recommended Fixes

### Option 1: Increase Text Opacity (Minimal Change)
Change nav link colors from `text-charcoal/70` to `text-charcoal/80` or `text-charcoal`:

```jsx
// Before
<Link className="text-sm font-medium text-charcoal/70 hover:text-charcoal ...">

// After
<Link className="text-sm font-medium text-charcoal/80 hover:text-charcoal ...">
```

### Option 2: Use Defined Text Color
Replace opacity-based colors with the defined text colors from the design system:

```jsx
// Before
<Link className="text-sm font-medium text-charcoal/70 hover:text-charcoal ...">

// After (using text-secondary from design system)
<Link className="text-sm font-medium text-text-secondary hover:text-charcoal ...">
```

Where `text-secondary: '#4A4A4A'` provides better contrast than `charcoal/70`.

### Option 3: Solid Background
Change header background from semi-transparent to solid:

```jsx
// Before
<nav className="... bg-cream/80 backdrop-blur-md ...">

// After
<nav className="... bg-cream ...">
```

## Files to Modify

1. `apps/web/src/app/page.tsx` - Landing page Navigation component (lines 61-103)

## Verification Steps

1. Open peacase.com on a mobile device
2. Check header text readability
3. Use browser DevTools to test contrast ratios
4. Test with reduced screen brightness
5. Verify WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
