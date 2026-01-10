# Pecase UI Component Library

Modern, minimal component library for the Pecase salon and spa management platform. Built with React, TypeScript, and Tailwind CSS following the Pecase design system.

## Features

- **8 Core Components**: Button, Card, Input, Modal, Table, Badge, StatCard, Sidebar
- **Design Tokens**: Complete color palette, typography scale, spacing system
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **TypeScript Support**: Full type definitions for all components
- **Accessibility**: WCAG AA compliance, keyboard navigation, ARIA labels
- **Soft Aesthetic**: Calming pastel colors, generous spacing, minimal visual noise

## Installation

```bash
npm install @pecase/ui
```

## Components

### Button
Versatile button component with 4 variants (primary, secondary, danger, ghost).

```tsx
import { Button } from '@pecase/ui'

<Button variant="primary" size="lg">Click me</Button>
<Button variant="danger" isLoading>Deleting...</Button>
```

### Card
Container component for content with optional decorative pea motif.

```tsx
import { Card } from '@pecase/ui'

<Card variant="default" showPeaMotif>
  <Card.Header>
    <Card.Title>Card Title</Card.Title>
  </Card.Header>
  <Card.Body>Content here</Card.Body>
  <Card.Footer>Footer content</Card.Footer>
</Card>
```

### Input & Form Controls
Text, email, password inputs with validation states and error messaging.

```tsx
import { Input, Textarea, Select } from '@pecase/ui'

<Input
  type="email"
  label="Email"
  placeholder="you@example.com"
  error={errors.email}
/>
<Textarea label="Notes" rows={4} />
<Select
  label="Service"
  options={[
    { value: 'haircut', label: 'Haircut' },
    { value: 'color', label: 'Color' },
  ]}
/>
```

### Modal
Centered overlay dialog with fade-in and slide-up animations.

```tsx
import { Modal } from '@pecase/ui'

<Modal isOpen={isOpen} onClose={handleClose}>
  <Modal.Header onClose={handleClose}>
    <Modal.Title>Confirm Action</Modal.Title>
  </Modal.Header>
  <Modal.Body>Are you sure?</Modal.Body>
  <Modal.Footer>
    <Button onClick={handleClose}>Cancel</Button>
    <Button variant="danger">Confirm</Button>
  </Modal.Footer>
</Modal>
```

### Table
Data table with striped rows, hover effects, and sortable headers.

```tsx
import { Table } from '@pecase/ui'

<Table striped>
  <Table.Header>
    <Table.Row>
      <Table.Head>Name</Table.Head>
      <Table.Head>Email</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>John Doe</Table.Cell>
      <Table.Cell>john@example.com</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>
```

### Badge & Status Indicators
Status badges with predefined appointment statuses and custom styling.

```tsx
import { Badge, AppointmentStatusBadge } from '@pecase/ui'

<Badge status="confirmed">Confirmed</Badge>
<AppointmentStatusBadge status="pending" />
<Badge color="sage" variant="soft">Active</Badge>
```

### StatCard
Dashboard metric card with decorative colors and trend indicators.

```tsx
import { StatCard, StatCardGrid } from '@pecase/ui'

<StatCard
  label="Total Revenue"
  value="$12,450"
  colorIndex={0}
  showPeaMotif
  trend={{ value: 12, direction: 'up' }}
/>

<StatCardGrid
  columns={4}
  cards={[
    { label: 'Revenue', value: '$12,450', colorIndex: 0, showPeaMotif: true },
    { label: 'Appointments', value: '24', colorIndex: 1 },
  ]}
/>
```

### Sidebar Navigation
Dark-themed navigation sidebar with active states and badges.

```tsx
import { Sidebar } from '@pecase/ui'

<Sidebar>
  <Sidebar.Header>
    <Sidebar.Logo>Pecase</Sidebar.Logo>
  </Sidebar.Header>
  <Sidebar.Nav>
    <Sidebar.Item active href="/dashboard">Dashboard</Sidebar.Item>
    <Sidebar.Item href="/clients">Clients</Sidebar.Item>
    <Sidebar.Item href="/appointments" badge={3}>Appointments</Sidebar.Item>
  </Sidebar.Nav>
  <Sidebar.Footer>
    <Button variant="ghost">Logout</Button>
  </Sidebar.Footer>
</Sidebar>
```

## Design Tokens

### Colors
- **Sage**: `#C7DCC8` - Primary actions and accents
- **Cream**: `#FAF8F3` - Main backgrounds
- **Charcoal**: `#2C2C2C` - Text and dark sidebar
- **Taupe**: `#D4B5A0` - Secondary actions
- **Soft Palette**: Peach, Lavender, Mint, Rose, Gray

### Typography
- **Display**: 32px, 600 weight
- **Section**: 24px, 600 weight
- **Subsection**: 18px, 600 weight
- **Body**: 14px, 400 weight
- **Small**: 12px, 400 weight

### Spacing
Base unit: 8px - All spacing in multiples of 8

### Border Radius
- **Button/Input**: 8px
- **Card**: 12px
- **Large**: 16px

### Shadows
- **Card**: `0px 2px 8px rgba(0,0,0,0.08)`
- **Modal**: `0px 20px 60px rgba(0,0,0,0.15)`
- **Hover**: `0px 4px 12px rgba(0,0,0,0.12)`

## Utilities

### cn() - Class Name Merger
Merge Tailwind classes, removing duplicates.

```tsx
import { cn } from '@pecase/ui'

const classes = cn('px-4 py-2', isActive && 'bg-sage-300')
```

### Color Variants
Get predefined color and size variants for buttons.

```tsx
import { colorVariants, sizeVariants } from '@pecase/ui'

const buttonClasses = colorVariants.sage + ' ' + sizeVariants.lg
```

### Status Helpers
Get color classes for appointment statuses.

```tsx
import { statusColorVariants } from '@pecase/ui'

const className = statusColorVariants.confirmed
```

## Tailwind Configuration

The library exports a shared Tailwind preset that all apps should extend:

```tsx
// apps/web/tailwind.config.ts
import defaultConfig from '@pecase/tailwind-config'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  presets: [defaultConfig],
  theme: {
    extend: {
      // App-specific overrides
    },
  },
}
```

## Pea Motif

The Pecase brand incorporates a subtle pea pod illustration as decorative elements:
- Appears in corners of Cards and StatCards
- Can be toggled with `showPeaMotif` prop
- Uses soft green color at 10% opacity
- 20-40px size, minimal line art style

## Responsive Design

All components are mobile-first with Tailwind breakpoints:
- **Mobile**: <480px (single column, full-width)
- **Tablet**: 480px-1024px (2 columns, adjusted padding)
- **Desktop**: >1024px (3+ columns, full layout)

## Animation & Transitions

- **Quick interactions**: 150ms (hover, focus)
- **Transitions**: 300ms (open/close modals, drawers)
- **Animations**: 400ms (page transitions, loading)
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1) (material design standard)

## Accessibility

- WCAG AA compliance
- Keyboard navigation support
- ARIA labels and roles
- Focus states on all interactive elements
- Color contrast ratios meet standards
- Error message associations with inputs

## TypeScript

Full TypeScript support with exported types:

```tsx
import type { ButtonProps, CardProps, InputProps } from '@pecase/ui'

interface MyComponentProps extends ButtonProps {
  customProp?: string
}
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

When adding new components:
1. Create component file in `src/components/`
2. Add TypeScript types with JSDoc comments
3. Export from `src/components/index.ts`
4. Update this README with usage examples
5. Ensure Tailwind classes use design tokens
6. Add unit tests if applicable

## License

MIT © Pecase Team
