# Design System: Spa Management Dashboard

## Brand Personality

Clean, professional, and calming - reflecting the spa industry's focus on wellness and relaxation. The interface prioritizes clarity and efficiency for staff managing daily operations, with a modern aesthetic that feels premium but approachable.

---

## Color Palette

### Light Mode

#### Primary Colors
- `--color-primary`: `#6366F1` (Indigo) - Primary actions, active states
- `--color-primary-hover`: `#4F46E5` - Hover states
- `--color-primary-light`: `#EEF2FF` - Light backgrounds, highlights

#### Neutral Colors
- `--color-gray-900`: `#111827` - Primary text
- `--color-gray-700`: `#374151` - Secondary text
- `--color-gray-500`: `#6B7280` - Placeholder, muted text
- `--color-gray-400`: `#9CA3AF` - Icons, borders
- `--color-gray-300`: `#D1D5DB` - Borders, dividers
- `--color-gray-200`: `#E5E7EB` - Light borders
- `--color-gray-100`: `#F3F4F6` - Background, hover states
- `--color-gray-50`: `#F9FAFB` - Page background
- `--color-white`: `#FFFFFF` - Cards, surfaces

#### Semantic Colors
- `--color-success`: `#10B981` - Positive metrics, available status
- `--color-success-light`: `#D1FAE5` - Success backgrounds
- `--color-warning`: `#F59E0B` - Warnings, pending status
- `--color-warning-light`: `#FEF3C7` - Warning backgrounds
- `--color-error`: `#EF4444` - Errors, negative metrics, unavailable
- `--color-error-light`: `#FEE2E2` - Error backgrounds
- `--color-info`: `#3B82F6` - Information, links

#### Chart Colors
- `--color-chart-primary`: `#6366F1` - Primary line
- `--color-chart-secondary`: `#F59E0B` - Secondary line

### Dark Mode

#### Surface Colors
- `--color-bg-dark`: `#0F172A` - Page background
- `--color-surface-dark`: `#1E293B` - Cards, elevated surfaces
- `--color-surface-dark-hover`: `#334155` - Hover states
- `--color-border-dark`: `#334155` - Borders

#### Text Colors (Dark Mode)
- `--color-text-dark-primary`: `#F1F5F9` - Primary text
- `--color-text-dark-secondary`: `#94A3B8` - Secondary text
- `--color-text-dark-muted`: `#64748B` - Muted text

---

## Typography

### Font Stack
- **Primary**: `'Inter', system-ui, -apple-system, sans-serif`
- **Numeric**: `'Inter', tabular-nums` (for numbers in stats)

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| stat-large | 32px | 700 | 1.2 | Large metric numbers |
| stat-medium | 24px | 700 | 1.2 | Medium metric numbers |
| h1 | 24px | 600 | 1.3 | Page titles ("Welcome back, Alice") |
| h2 | 18px | 600 | 1.4 | Section headers |
| h3 | 16px | 600 | 1.4 | Card titles, subsections |
| body | 14px | 400 | 1.5 | Default text |
| small | 13px | 400 | 1.5 | Secondary info, table cells |
| tiny | 12px | 500 | 1.4 | Labels, badges, captions |
| micro | 11px | 500 | 1.3 | Small badges, chart labels |

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight gaps, icon padding |
| --space-2 | 8px | Related elements, badge padding |
| --space-3 | 12px | Default gaps between items |
| --space-4 | 16px | Card padding (horizontal) |
| --space-5 | 20px | Card padding (vertical) |
| --space-6 | 24px | Section gaps |
| --space-8 | 32px | Major section gaps |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| --radius-sm | 6px | Buttons, inputs, badges |
| --radius-md | 8px | Small cards, dropdowns |
| --radius-lg | 12px | Main cards, modals |
| --radius-xl | 16px | Large containers |
| --radius-full | 9999px | Pills, avatars, toggles |

---

## Shadows

```css
/* Light Mode */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Dark Mode */
--shadow-dark-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-dark-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
```

---

## Component Specifications

### Sidebar Navigation

**Dimensions:**
- Width: 240px (expanded)
- Logo area height: 64px
- Nav item height: 44px
- Icon size: 20px
- Bottom user section: 72px

**Colors (Light):**
- Background: `#FFFFFF`
- Active item bg: `--color-primary-light`
- Active item text: `--color-primary`
- Inactive text: `--color-gray-600`
- Hover bg: `--color-gray-100`

**Colors (Dark):**
- Background: `--color-surface-dark`
- Active item bg: `rgba(99, 102, 241, 0.1)`
- Active item text: `#818CF8`
- Inactive text: `--color-text-dark-secondary`

**Badge (notifications):**
- Size: 20px circle
- Background: `--color-primary`
- Text: white, 11px, bold

---

### Stat Card

**Dimensions:**
- Min width: 200px
- Padding: 20px
- Border radius: 12px

**Layout:**
```
┌─────────────────────────────────┐
│ Label                      •••  │  <- 13px, gray-500
│                                 │
│ 276 ↓ 5.2%                      │  <- 32px bold + 12px badge
│                                 │
│ -24 Decreased vs last week      │  <- 12px, gray-500
└─────────────────────────────────┘
```

**Percentage Badge:**
- Positive: Green text, up arrow (↗)
- Negative: Red text, down arrow (↘)
- Size: 12px, medium weight

---

### Staff/Schedule Card

**Staff List Item:**
```
┌────────────────────────────────────┐
│ [Avatar]  Name                     │
│           Role          [Status]   │
└────────────────────────────────────┘
```

**Avatar:** 40px circle
**Status Badge:**
- Available: Green bg (#D1FAE5), green text (#059669)
- Unavailable: Red bg (#FEE2E2), red text (#DC2626)
- Size: padding 6px 10px, radius-full, 11px font

---

### Data Table

**Header:**
- Background: transparent
- Text: 12px, gray-500, uppercase, letter-spacing 0.05em
- Padding: 12px 16px

**Row:**
- Height: 64px
- Border-bottom: 1px solid gray-200
- Hover: gray-50 background

**Cell with Avatar:**
```
[Avatar 36px]  Primary Text
               Secondary Text (gray-500)
```

**Status Badges:**
- Confirmed: Green outline, green text
- Pending: Yellow outline, yellow text
- Completed: Gray outline, gray text
- Cancelled: Red outline, red text

---

### Theme Toggle

**Dimensions:**
- Track: 44px × 24px
- Knob: 18px circle
- Icons: 14px (sun/moon)

**States:**
- Light mode: Gray track, left position, sun icon
- Dark mode: Primary track, right position, moon icon

**Animation:**
- Duration: 200ms
- Easing: ease-out
- Knob slides, icon fades/switches

---

## Layout Grid

### Main Layout
```
┌──────────┬────────────────────────────────────────────────┐
│          │                                                │
│  Sidebar │              Main Content                      │
│  240px   │              flex: 1                           │
│          │              padding: 24px                     │
│          │                                                │
└──────────┴────────────────────────────────────────────────┘
```

### Dashboard Grid
```
┌────────────────────────────────────────────────────────────┐
│  Header: Welcome + Actions                                 │
├────────────────────────────────────────────────────────────┤
│  Alert Banner (if any)                                     │
├────────────────────┬───────────────────┬───────────────────┤
│     Stat Card 1    │    Stat Card 2    │   Top Services    │
├────────────────────┼───────────────────┤   (spans 2 rows)  │
│     Stat Card 3    │    Stat Card 4    │                   │
├────────────────────┴───────────────────┼───────────────────┤
│                                        │                   │
│         Chart Section                  │  Staff Schedule   │
│                                        │                   │
├────────────────────────────────────────┴───────────────────┤
│                                                            │
│                  Appointments Table                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Animations

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Theme toggle | all | 200ms | ease-out |
| Card hover | box-shadow, transform | 150ms | ease-out |
| Sidebar item hover | background | 150ms | ease |
| Badge count | transform | 300ms | spring |
| Chart line | stroke-dashoffset | 1000ms | ease-out |
| Table row hover | background | 100ms | ease |

### Theme Transition
```css
* {
  transition: background-color 200ms ease,
              border-color 200ms ease,
              color 200ms ease;
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop | ≥1280px | Full layout as designed |
| Laptop | 1024-1279px | Narrower cards, smaller gaps |
| Tablet | 768-1023px | Sidebar collapses to icons |
| Mobile | <768px | Sidebar hidden, hamburger menu |

---

## Icon Set

**Library:** Lucide React (`lucide-react`)

**Sidebar Icons:**
- Dashboard: `LayoutDashboard`
- Clients: `Users`
- Appointments: `Calendar`
- Services: `Sparkles`
- Staff: `UserCog`
- Products: `Package`
- Reports: `BarChart3`
- Messages: `MessageSquare`
- Settings: `Settings`
- Help: `HelpCircle`

**UI Icons:**
- Menu dots: `MoreHorizontal`
- Search: `Search`
- Export: `Download`
- Filter: `SlidersHorizontal`
- Up arrow: `TrendingUp`
- Down arrow: `TrendingDown`
- Sun: `Sun`
- Moon: `Moon`
- Bell: `Bell`

---

## Accessibility

- Color contrast: All text meets WCAG AA (4.5:1 minimum)
- Focus states: 2px solid primary with 2px offset
- Interactive elements: Minimum 44px touch target
- Icons: Always paired with text or aria-label
- Theme toggle: Includes aria-label for screen readers
