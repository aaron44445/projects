# Booking Widget Design

> **For Claude:** Use superpowers:subagent-driven-development to implement this design.

**Goal:** Create an embeddable booking widget that salon owners can add to their website with one line of code.

**Architecture:** JavaScript widget script loads a booking modal (iframe) that calls public API endpoints using the salon's slug.

---

## User Experience

### For Salon Owners

In Settings → Online Booking:
1. Toggle to enable/disable online booking
2. Copy embed code: `<script src="https://peacase.com/book.js" data-salon="slug"></script>`
3. Customize button text, color, position
4. Follow platform-specific instructions (WordPress, Squarespace, Wix, Shopify, HTML)

### For Clients Booking

5-step modal flow:
1. **Select Service** - grouped by category, shows duration/price
2. **Select Staff** - "Any available" or specific person
3. **Pick Date & Time** - calendar + time slot pills
4. **Your Details** - name, email, phone, optional notes
5. **Confirmation** - summary + add to calendar buttons

---

## Technical Implementation

### Public API Endpoints (no auth required)

All endpoints use salon slug for identification:

```
GET  /api/v1/public/:slug/salon        - salon name, logo, colors
GET  /api/v1/public/:slug/services     - active services
GET  /api/v1/public/:slug/staff        - bookable staff with services
GET  /api/v1/public/:slug/availability - time slots for date/service/staff
POST /api/v1/public/:slug/book         - create appointment + client
```

### Widget Script (book.js)

- ~2KB loader script
- Reads data attributes: `data-salon`, `data-text`, `data-color`, `data-position`
- Creates styled button where script is placed
- On click: opens iframe modal with booking flow
- Communicates with modal via postMessage

### Booking Modal (iframe)

- Hosted at `/embed/:slug`
- Fetches salon branding on load
- 5-step booking flow
- Mobile responsive
- Sends confirmation email/SMS on completion

### Settings Page Addition

New "Online Booking" tab in Settings with:
- Enable/disable toggle
- Embed code with copy button
- Live preview of button
- Customization options (text, color, position)
- Tabbed instructions for each platform

---

## Files to Create/Modify

### New Files
- `apps/api/src/routes/public.ts` - public API endpoints
- `apps/web/public/book.js` - widget loader script
- `apps/web/src/app/embed/[slug]/page.tsx` - booking modal page

### Modified Files
- `apps/api/src/index.ts` - register public routes
- `apps/web/src/app/settings/page.tsx` - add Online Booking tab

---

## Data Flow

```
User's Website
     │
     ▼
book.js script (reads data-salon attribute)
     │
     ▼
Creates "Book Now" button
     │
     ▼ (click)
Opens iframe modal → /embed/{slug}
     │
     ▼
Modal fetches: salon info, services, staff
     │
     ▼
User selects: service → staff → date/time → enters details
     │
     ▼
POST /api/v1/public/{slug}/book
     │
     ▼
API creates client (if new) + appointment
     │
     ▼
Sends confirmation email/SMS
     │
     ▼
Shows confirmation screen with calendar links
```

---

## Customization Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-salon` | required | Salon slug |
| `data-text` | "Book Now" | Button text |
| `data-color` | salon's primary | Button background color |
| `data-position` | "inline" | "inline" or "floating" |

Example with all options:
```html
<script
  src="https://peacase.com/book.js"
  data-salon="bliss-hair-studio"
  data-text="Schedule Appointment"
  data-color="#7C9A82"
  data-position="floating">
</script>
```

---

## Platform Instructions

### WordPress
1. Go to Appearance → Widgets
2. Add "Custom HTML" widget
3. Paste embed code, Save

### Squarespace
1. Edit page → Add Section
2. Choose "Code" block
3. Paste embed code, Save

### Wix
1. Add → Embed → Custom HTML
2. Paste embed code
3. Adjust size, Apply

### Shopify
1. Online Store → Themes → Edit
2. Add custom Liquid section
3. Paste embed code, Save

### Generic HTML
1. Open your website's HTML
2. Paste code before `</body>`
3. Save and upload
