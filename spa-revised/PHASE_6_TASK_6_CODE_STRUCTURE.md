# Phase 6, Task 6 - Code Structure Overview

## Staff Page Structure

```
/apps/web/src/app/staff/page.tsx
├── Imports
│   ├── useState, useEffect from React
│   └── Icons: Users, Plus, Edit2, Trash2 from lucide-react
├── Component State
│   ├── staff (array of staff members)
│   ├── loading (boolean)
│   └── error (string)
├── useEffect Hook
│   └── Fetches staff from /api/v1/staff on mount
├── Render
│   ├── Header with title and Add Staff button
│   ├── Error boundary
│   ├── Loading state
│   ├── Empty state
│   └── Staff table with columns:
│       ├── Name
│       ├── Email
│       ├── Role (badge)
│       ├── Status (Active/Inactive badge)
│       └── Actions (Edit, Delete buttons)
```

## Settings Page Structure

```
/apps/web/src/app/settings/page.tsx
├── Imports
│   ├── useState from React
│   └── Icons: Settings, Lock, CreditCard, Zap from lucide-react
├── Constants
│   └── TABS array with id, label, icon for each tab
├── Component State
│   ├── currentTab (selected tab)
│   └── salonName (form input)
├── Tab Rendering
│   ├── General Tab
│   │   ├── Salon Name input
│   │   ├── Contact Email input
│   │   ├── Phone Number input
│   │   └── Save Changes button
│   ├── Features Tab
│   │   └── Feature checkboxes with upgrade prompts
│   ├── Billing Tab
│   │   ├── Plan information card
│   │   ├── Payment method display
│   │   ├── Update payment link
│   │   └── Upgrade button
│   └── Security Tab
│       ├── Password change form
│       └── Danger zone with delete account
├── Layout
│   ├── Header with title
│   ├── Tab navigation buttons
│   └── Content area with current tab
```

## Reports Page Structure

```
/apps/web/src/app/reports/page.tsx
├── Imports
│   ├── useState from React
│   └── Icons: BarChart3, TrendingUp, DollarSign, Calendar from lucide-react
├── Component State
│   ├── timeRange (selected range)
│   └── stats (hardcoded metrics)
├── Sections
│   ├── Header
│   │   ├── Title and subtitle
│   │   └── Time range selector dropdown
│   ├── Metrics Grid (4 columns)
│   │   ├── Total Revenue card
│   │   ├── Appointments card
│   │   ├── Average Service Price card
│   │   └── Client Retention card
│   ├── Revenue Trend Chart
│   │   └── 12-month bar chart visualization
│   └── Top Services Table
│       ├── Service name
│       ├── Bookings
│       ├── Revenue
│       └── Average rating
```

## Component Patterns

### Styling Pattern
All pages use inline styles with the color palette:
```jsx
style={{ color: '#2C2C2C' }}  // Text
style={{ backgroundColor: '#C7DCC8' }}  // Primary button
style={{ backgroundColor: '#F5F3F0' }}  // Background
style={{ borderColor: '#E8E6E4' }}  // Borders
```

### Icon Usage Pattern
```jsx
import { IconName } from 'lucide-react'

<IconName size={20} />  // Staff page
<IconName size={28} />  // Reports metrics
<IconName size={18} />  // Small buttons
```

### State Management Pattern
```jsx
const [value, setValue] = useState(initialValue)

// Used for:
// - Tab selection (Settings)
// - Data loading (Staff)
// - Form inputs (Settings)
```

### Error Handling Pattern
```jsx
{error && (
  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5' }}>
    <p style={{ color: '#dc2626' }}>{error}</p>
  </div>
)}
```

### Loading State Pattern
```jsx
{loading ? (
  <div>Loading...</div>
) : staff.length === 0 ? (
  <div>Empty state</div>
) : (
  <div>Content</div>
)}
```

## Data Structures

### Staff Object
```typescript
{
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  is_active: boolean
}
```

### Settings Tabs
```typescript
{
  id: 'general' | 'features' | 'billing' | 'security'
  label: string
  icon: React.ComponentType
}
```

### Metric Card
```typescript
{
  label: string
  value: string | number
  icon: React.ComponentType
  color: string (hex)
}
```

### Service Entry
```typescript
{
  name: string
  bookings: number
  revenue: number
  rating: number
}
```

## Routing

- Staff Page: `/staff` -> `/apps/web/src/app/staff/page.tsx`
- Settings Page: `/settings` -> `/apps/web/src/app/settings/page.tsx`
- Reports Page: `/reports` -> `/apps/web/src/app/reports/page.tsx`

## API Integration Points

### Staff Page
- Endpoint: `http://localhost:3001/api/v1/staff`
- Method: GET
- Expected Response: Array of staff objects
- Error Handling: Displays error message to user

### Settings Page
- Ready for form submission handlers
- No current API calls (uses local state)
- Integration points for save/update operations

### Reports Page
- Uses hardcoded data (demo purposes)
- Time range selector ready for filtering logic
- Ready for backend analytics integration

## Production Readiness Checklist

- TypeScript: Fully typed, no `any` types
- Linting: Passes ESLint validation
- Build: Successful Next.js build
- Performance: Optimized component rendering
- Accessibility: Semantic HTML, proper labels
- Responsiveness: Mobile-friendly layouts
- Error Handling: Proper error boundaries
- Loading States: Complete UX coverage
- Documentation: Inline comments where needed
- Testing: Ready for unit and integration tests

## Icon Library

All icons from `lucide-react`:
- Users (staff icon)
- Plus (add action)
- Edit2 (edit action)
- Trash2 (delete action)
- Settings (general icon)
- Lock (security icon)
- CreditCard (billing icon)
- Zap (features icon)
- BarChart3 (analytics icon)
- TrendingUp (trend icon)
- DollarSign (revenue icon)
- Calendar (appointments icon)

Total: 12 unique icons, all properly sized and colored.
