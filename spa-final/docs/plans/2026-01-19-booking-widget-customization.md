# Booking Widget Customization Design

## Overview

Redesign the online booking widget for Peacase to be fully embeddable on client websites with customizable appearance. No redirects to peacase.com, no Peacase branding - fully white-label.

## Requirements

- **Embed method:** Iframe only (simple, works everywhere)
- **Customization level:** Standard (colors, button style, font)
- **Customization location:** Settings → Online Booking section
- **Branding:** None - fully white-label

## Database Changes

Add fields to Salon model:

```prisma
model Salon {
  // ... existing fields

  // Widget customization
  widgetPrimaryColor  String   @default("#7C9A82")
  widgetAccentColor   String   @default("#B5A8D5")
  widgetButtonStyle   String   @default("rounded")  // rounded | square
  widgetFontFamily    String   @default("system")   // system | modern | classic
}
```

## API Changes

### Update: GET /api/v1/public/:slug/salon

Return actual widget settings from database:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Jane's Spa",
    "widget": {
      "primaryColor": "#7C9A82",
      "accentColor": "#B5A8D5",
      "buttonStyle": "rounded",
      "fontFamily": "system"
    }
  }
}
```

### New: PATCH /api/v1/salons/:id/widget-settings

Save widget customization (authenticated):

```json
{
  "primaryColor": "#FF6B6B",
  "accentColor": "#4ECDC4",
  "buttonStyle": "square",
  "fontFamily": "modern"
}
```

## Settings UI

Location: Settings → Online Booking

### Sections:

1. **Customize Appearance**
   - Primary Color picker (buttons, progress bar, selected states)
   - Accent Color picker (links, category headers)
   - Button Style dropdown (Rounded / Square)
   - Font Style radio (System / Modern / Classic)

2. **Live Preview**
   - Mini widget preview showing actual styling
   - Updates in real-time as settings change

3. **Embed Code**
   - Generated iframe code
   - Copy button
   - No direct link shown

4. **Installation Instructions**
   - Platform tabs: WordPress, Squarespace, Wix, Shopify, HTML

## Embed Page Changes

### CSS Variables

Apply customization via CSS variables:

```css
:root {
  --widget-primary: #7C9A82;
  --widget-accent: #B5A8D5;
  --widget-radius: 12px;
  --widget-font: system-ui, -apple-system, sans-serif;
}
```

### Font Mapping

| Setting | CSS Value |
|---------|-----------|
| system | `system-ui, -apple-system, sans-serif` |
| modern | `'Plus Jakarta Sans', sans-serif` |
| classic | `Georgia, 'Times New Roman', serif` |

### Button Style Mapping

| Setting | Border Radius |
|---------|---------------|
| rounded | 12px |
| square | 4px |

### Elements Styled

- All buttons (primary color background)
- Progress bar (primary color)
- Selected date/time/staff states (primary color)
- Links (accent color)
- Service category headers (accent color)
- All text (font family)

### Remove

- Any "Powered by Peacase" text
- Peacase logo
- External links to peacase.com

## Data Flow

### Customization Flow
```
Settings UI
  → PATCH /api/v1/salons/:id/widget-settings
  → Database updated
```

### Widget Load Flow
```
Client website (janes-spa.com)
  → <iframe src="peacase.com/embed/janes-spa">
  → GET /api/v1/public/janes-spa/salon
  → Returns widget settings
  → Apply CSS variables
  → Render branded widget
```

### Booking Flow
```
Widget form submission
  → POST /api/v1/public/janes-spa/book
  → Create/find Client
  → Create Appointment (source: 'online_booking')
  → Send confirmation email/SMS
  → Show confirmation in widget (no redirect)
```

## Implementation Steps

1. **Database migration** - Add widget fields to Salon model
2. **API updates** - Return widget settings, add PATCH endpoint
3. **Settings UI** - Build customization interface with live preview
4. **Embed page** - Apply CSS variables from settings, remove branding
5. **Testing** - Verify customization works end-to-end

## Success Criteria

- Salon owner can customize colors, button style, font in settings
- Live preview shows changes immediately
- Embed code generates working iframe
- Widget on client site shows customized styling
- Booking creates appointment in Peacase
- No Peacase branding visible anywhere in widget
- Customer never sees peacase.com URL
