# Pecase UI Redesign Guide
## Premium Modern Aesthetic (Fresha/MngoMint Style)

**Status:** Landing page (Hero, Features, Pricing, CTA) + Login redesigned
**Next Priority:** Signup → Dashboard → Remaining pages

---

## Design System Specifications

### Typography
```
Display Font: Sohne (fallback: system-ui)
Body Font: DM Sans (fallback: system-ui)

Display Large (56px): Hero headlines
Display (48px): Major section headers
Display Small (40px): Section headers
Section XL (32px): Subsection headers
Section (28px): Card titles
Section SM (24px): Form labels
Body LG (16px): Important body text
Body (15px): Standard text
Small (14px): Supporting text
XS (13px): Metadata
```

### Color Palette
```
Primary: Sage Green (#C7DCC8)
Background: Cream (#FAF8F3)
Text: Charcoal (#2C2C2C)

Soft Accents:
- Peach: #F4D9C8
- Lavender: #E8DDF0
- Mint: #D9E8DC
- Rose: #F0D9E8
- Gray: #E5E5E5
```

### Spacing (8px grid)
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
3xl: 48px
4xl: 64px
```

### Shadow System
```
card-sm: 0px 2px 4px rgba(0,0,0,0.05)
card: 0px 4px 12px rgba(0,0,0,0.08)
card-lg: 0px 8px 24px rgba(0,0,0,0.12)
card-xl: 0px 12px 32px rgba(0,0,0,0.15)
hover: 0px 6px 16px rgba(0,0,0,0.1)
hover-lg: 0px 12px 32px rgba(0,0,0,0.15)
```

### Border Radius
```
xs: 4px (small elements)
sm: 8px (inputs, buttons)
md: 12px (cards)
lg: 16px (larger cards)
xl: 20px (extra large)
```

### Animations
```
fade-in: 0.5s ease-in-out
slide-up: 0.6s ease-out
slide-in: 0.5s ease-out
float: 6s ease-in-out infinite
pulse-soft: 2s ease-in-out infinite
```

---

## Page Redesign Specifications

### 1. SIGNUP FORM PAGE (NEXT PRIORITY)
**File:** `apps/web/src/app/signup/page.tsx`

**Layout:**
- Hero background (cream) with decorative gradient blobs
- Center card (white) with shadow
- Max width: 432px

**Form Structure:**
```
Header:
  - Icon in box (sage/10 background)
  - Title: "Create your salon account"
  - Subtitle: "Get started with your 14-day free trial"

Form Fields (6 total):
  1. Salon Name
  2. Email Address
  3. Phone Number
  4. Timezone (select dropdown)
  5. Password
  6. Confirm Password

Each field:
  - Label: text-small font-medium text-charcoal
  - Input: rounded-lg border-charcoal/10 bg-white/50 backdrop-blur-sm
  - Focus state: ring-2 ring-sage/50 focus:border-sage
  - Placeholder: text-charcoal/40

Validation:
  - Red border on error: border-red-300
  - Red error message below field
  - Check icon on valid field

CTA Button:
  - Full width
  - bg-sage text-white
  - Hover: shadow-hover hover:-translate-y-1
  - Icon: Plus or ArrowRight

Footer:
  - Divider line
  - "Already have an account? Sign in" link
  - Trust indicators with Check icons
```

**Key Features:**
- Real-time validation feedback
- Smooth field transitions
- Professional error messages
- Trust indicators (14-day free, cancel anytime, no card required)

---

### 2. DASHBOARD PAGE (SECOND PRIORITY)
**File:** `apps/web/src/app/dashboard/page.tsx`

**Layout:**
- Left sidebar navigation (collapsible on mobile)
- Top header with search + user menu
- Main content area (flexible grid)

**Sections:**

#### Header Bar (sticky top)
```
Left: Logo + "Dashboard" title
Center: Search bar (rounded-lg, placeholder: "Search appointments, clients...")
Right: User menu (avatar + dropdown)
```

#### Sidebar Navigation
```
Logo at top
Menu items with icons:
  - Dashboard (home icon)
  - Appointments (calendar icon)
  - Clients (users icon)
  - Staff (users icon)
  - Reports (chart icon)
  - Settings (gear icon)
  - Support (question icon)

Styling:
  - Active: bg-sage/10 border-l-2 border-sage
  - Hover: bg-sage/5
  - Icons from lucide-react
```

#### Metrics Cards (6 cards in 2x3 or 3x2 grid)
```
Each card:
  - p-6 lg:p-8 rounded-xl lg:rounded-2xl
  - bg-white shadow-card hover:shadow-card-lg
  - Hover: -translate-y-1 transition-all

Structure:
  - Top row: Icon + Label
  - Large number: text-section-xl font-bold text-charcoal
  - Trend: "↑ 12% from last month" (text-small text-charcoal/60)
  - Background gradient: from accent color /10 to accent color /5

6 Metrics:
  1. Total Clients (Users icon, soft-peach background)
  2. Appointments (Calendar icon, soft-lavender background)
  3. Revenue (DollarSign icon, soft-mint background)
  4. No-Shows (AlertCircle icon, soft-rose background)
  5. Growth % (TrendingUp icon, soft-peach background)
  6. Client Satisfaction (Star icon, soft-lavender background)
```

#### Day Schedule Section
```
Title: "Today's Schedule"
Grid layout: Hourly slots from 9 AM to 5 PM
Each slot:
  - Time on left (8:30 AM, 9:00 AM, etc.)
  - Appointments as cards on right
  - Card background: Service color (sage, peach, lavender, etc.)
  - Card: Service name + client name + duration
  - Small avatar + initials
  - Hover: shadow-hover
```

#### Upcoming Appointments (Right sidebar, desktop only)
```
Title: "Upcoming Appointments"
List of 5-6 upcoming appointments:
  - Client avatar (initials circle)
  - Client name + service name
  - Time: "2:30 PM - 3:00 PM"
  - Status badge (Confirmed, Pending, etc.)
  - Quick action buttons (Check, X icons)
```

#### Revenue Analytics Chart
```
Title: "Revenue Trend"
Chart type: Line or bar chart
Time range selector (Week/Month/Year)
X-axis: Days or dates
Y-axis: Revenue $
Legend with service colors
Tooltip on hover showing exact values
```

**Key Features:**
- Real-time data refresh (30 seconds)
- Responsive grid layout
- Color-coded services and staff
- Smooth loading states
- Error fallbacks

---

### 3. REMAINING PAGES (BATCH REDESIGN)

#### SIGNUP CONFIRMATION (pages/app/confirm/page.tsx)
- Success screen with checkmark
- Next steps (onboarding link)
- Email verification prompt

#### ONBOARDING WIZARD (apps/web/src/app/onboarding/page.tsx)
- 5 steps with progress bar
- Each step in white card
- Step title + step number
- Forward/back buttons
- Step indicator dots

#### STAFF MANAGEMENT (apps/web/src/app/staff/page.tsx)
- Table with staff members
- Column headers: Name, Email, Role, Status, Actions
- Add Staff button (top right)
- Row hover: shadow-hover
- Action buttons: Edit, Delete (lucide icons)
- Status badge: green (active), gray (inactive)

#### SETTINGS (apps/web/src/app/settings/page.tsx)
- Left sidebar with settings sections
- 4 tabs: General, Features, Billing, Security
- Tab selector: border-b border-sage/30 on active
- Form sections with dividers
- Save buttons per section
- Danger zone at bottom (red background)

#### REPORTS (apps/web/src/app/reports/page.tsx)
- Top filters: date range selector, export button
- 4 stat cards (revenue, appointments, avg price, retention)
- Charts section
- Data table with sortable columns
- Pagination controls at bottom

---

## Implementation Checklist for Each Page

For EVERY page redesign:

✅ **Colors**
- Use cream (#FAF8F3) for backgrounds
- Sage (#C7DCC8) for primary actions
- White for cards
- Charcoal (#2C2C2C) for text

✅ **Typography**
- Headlines: font-display font-bold
- Labels: text-small font-medium
- Body: text-body text-charcoal/70
- Proper hierarchy with font sizes

✅ **Cards & Containers**
- rounded-lg or rounded-2xl (consistent)
- bg-white with shadow-card
- Hover: shadow-card-lg hover:-translate-y-1
- border: border-white/60 or border-charcoal/10

✅ **Forms**
- Rounded inputs with border-charcoal/10
- Focus: ring-2 ring-sage/50 focus:border-sage
- Labels above inputs
- Error states: red border + message
- Success states: green check icon

✅ **Buttons**
- Sage green primary buttons
- Secondary: border + no fill
- Hover: shadow-hover -translate-y-1
- Active: scale-95
- Disabled: opacity-50 cursor-not-allowed

✅ **Spacing**
- 8px grid system throughout
- Consistent padding (p-6, p-8, p-10)
- Margin between sections (mb-16, mb-20)
- Gap between items (gap-6, gap-8)

✅ **Animations**
- Fade-in on page load
- Slide-up on scroll
- Smooth transitions (300ms)
- Hover effects (lift up slightly)

✅ **Icons**
- lucide-react only (NO emojis)
- Consistent size (20-24px for buttons, 28-32px for headers)
- Color: sage for primary, soft accent colors for cards

✅ **Mobile Responsive**
- Responsive classes (sm:, md:, lg:)
- Stack vertically on mobile
- Hamburger menu on mobile
- Touch-friendly button sizes (min 48px)

---

## Code Patterns to Use

### Card Component Pattern
```tsx
<div className="p-6 lg:p-8 rounded-lg lg:rounded-2xl bg-white border border-white/60 shadow-card hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300">
  {content}
</div>
```

### Button Pattern
```tsx
<button className="px-6 py-3 rounded-lg bg-sage text-white font-semibold transition-all duration-300 hover:shadow-hover hover:-translate-y-1 active:scale-95">
  Button Text
</button>
```

### Input Field Pattern
```tsx
<input
  type="text"
  placeholder="Placeholder text"
  className="w-full px-4 py-3 rounded-lg border border-charcoal/10 bg-white/50 backdrop-blur-sm text-charcoal placeholder:text-charcoal/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage"
/>
```

### Section Header Pattern
```tsx
<div className="mb-16 lg:mb-20">
  <h2 className="text-section-xl lg:text-display-sm font-display font-bold text-charcoal mb-4">
    Section Title
  </h2>
  <p className="text-body-lg text-charcoal/60 max-w-2xl">
    Section description
  </p>
</div>
```

---

## Priority Order for Completion

1. ✅ **Done:** Landing page (Hero, Features, Pricing, CTA)
2. ✅ **Done:** Login page
3. **Next:** Signup page (same card style as login)
4. **Next:** Dashboard (most used page, show full aesthetic)
5. Staff management (simpler, table-based)
6. Settings (form-based, clear hierarchy)
7. Reports (chart-based)
8. Onboarding (multi-step wizard)

---

## Testing Checklist

After redesigning each page:
- [ ] Page loads without errors
- [ ] All colors render correctly
- [ ] Typography displays as specified
- [ ] Buttons have hover effects
- [ ] Forms have proper focus states
- [ ] Cards have proper shadows
- [ ] Mobile responsive (test on phone)
- [ ] No emojis anywhere
- [ ] All icons from lucide-react
- [ ] Smooth animations present

---

## Quick Command Reference

```bash
# Start dev server
cd apps/web
pnpm dev -p 3333

# Build for production
pnpm build

# Check for errors
pnpm tsc --noEmit

# Format code
pnpm format
```

---

## Resources Referenced

- **Fresha.com**: Modern salon management platform
- **MngoMint.com**: Salon booking system
- Color scheme: Pecase brand guidelines
- Typography: Sohne + DM Sans

This guide ensures consistent premium design across all pages matching the Fresha/MngoMint aesthetic while maintaining Pecase's unique color identity.
