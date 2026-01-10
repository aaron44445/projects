# Pecase Tailwind Configuration

Shared Tailwind CSS configuration preset for all Pecase applications.

## Design System Tokens

This preset includes all design tokens from the Pecase design system:

### Colors

**Primary Colors (Soft, Calming):**
- **Sage Green**: `#C7DCC8` - Primary action, accents, button background
- **Cream**: `#FAF8F3` - Main page background
- **Charcoal**: `#2C2C2C` - Dark sidebar, text, headings
- **Warm Taupe**: `#D4B5A0` - Secondary actions, hover states

**Soft Accent Palette (Decorative):**
- **Soft Peach**: `#F4D9C8` - Stat card background variant
- **Soft Lavender**: `#E8DDF0` - Stat card background variant
- **Soft Mint**: `#D9E8DC` - Stat card background variant
- **Soft Rose**: `#F0D9E8` - Stat card background variant

**Status Colors:**
- **Success (Confirmed)**: `#8FA98C` - Green status
- **Pending**: `#D4A574` - Gold/warm status
- **Cancelled**: `#C97C7C` - Red status
- **No-show**: `#999999` - Gray status

### Typography

**Font Family:**
- Primary: Inter
- Secondary: Outfit
- Fallback: system-ui sans-serif

**Type Scale:**
- Display: 32px
- Section Headers: 24px
- Subsection Headers: 18px
- Body: 14px
- Small: 12px

### Spacing

**Base Unit: 8px**

All spacing values are multiples of 8px:
- 0 = 0px
- 1 = 2px
- 2 = 4px
- 3 = 8px
- 4 = 12px
- 5 = 16px
- 6 = 20px
- 7 = 24px
- 8 = 32px
- 9 = 40px
- 10 = 48px
- ... and so on

### Border Radius

- Button/Input: 8px (`rounded-button`)
- Card: 12px (`rounded-card`)
- Large: 16px (`rounded-lg`)

### Box Shadows

- Card: `0px 2px 8px rgba(0,0,0,0.08)`
- Hover: `0px 4px 12px rgba(0,0,0,0.12)`
- Modal: `0px 20px 60px rgba(0,0,0,0.15)`

### Animations

- **Fade In**: 300ms, ease-in-out
- **Slide Up**: 300ms, cubic-bezier(0.4, 0, 0.2, 1)
- **Pulse**: 2s, infinite
- **Spin**: 1s, linear infinite

## Usage

### In Next.js App

```tsx
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss'
import defaultConfig from '@pecase/tailwind-config'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  presets: [defaultConfig],
  theme: {
    extend: {
      // App-specific theme overrides
    },
  },
}

export default config
```

### Using Design Tokens

```tsx
// Using Tailwind classes directly
<div className="bg-sage-300 text-charcoal-600 px-4 py-3 rounded-card shadow-card">
  Content with design tokens
</div>

// With responsive breakpoints
<div className="bg-cream-100 md:bg-white lg:bg-peach-light">
  Responsive backgrounds
</div>

// Color variants
<button className="bg-sage-300 hover:bg-sage-400 text-white rounded-button h-11 px-6">
  Primary Button
</button>
```

## Customization

Each app can extend the preset with project-specific tokens:

```tsx
// apps/booking/tailwind.config.ts
const config: Config = {
  presets: [defaultConfig],
  theme: {
    extend: {
      colors: {
        custom: '#ABC123', // Custom color for booking app only
      },
      spacing: {
        'booking-gutter': '48px', // Custom spacing
      },
    },
  },
}
```

## Color Palette Reference

### Sage Green Scale
```
sage-50:   #F5F8F6
sage-100:  #EBF1ED
sage-200:  #D7E5DA
sage-300:  #C7DCC8 (Primary)
sage-400:  #A8CFAA
sage-500:  #8FA98C
sage-600:  #5A8C52
sage-700:  #3D6335
```

### Charcoal Scale
```
charcoal-50:   #F8F8F8
charcoal-100:  #E5E5E5
charcoal-200:  #CCCCCC
charcoal-300:  #999999
charcoal-400:  #666666
charcoal-500:  #444444
charcoal-600:  #2C2C2C (Dark/Default)
```

## Implementation Notes

1. **Color Naming**: Use semantic color names (sage, cream) rather than traditional color names (blue, gray)
2. **Consistency**: All applications extend the same preset for UI consistency
3. **Accessibility**: Color contrasts meet WCAG AA standards
4. **Design Philosophy**: Soft, calm aesthetic with generous whitespace
5. **Pea Motif**: Brand element incorporated as decorative 20-40px illustration

## Future Considerations

- Dark mode theme (Phase 3) - requires inverted palette logic
- Advanced animations and interactions (Phase 2)
- Custom animations for specific features
- Theme switching infrastructure

## Support

For questions about design tokens or implementation, refer to:
- PRD Section 2: Complete Design System
- Component library documentation
- Figma design specifications
