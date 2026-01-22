# Booking Widget Real Business Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect booking widget to real business data instead of hardcoded demo, enabling live bookings.

**Architecture:** Widget reads `data-slug` attribute, fetches real business data via public API, creates real appointments. Demo mode only for `/embed/demo` URL or demo business.

**Tech Stack:** Next.js 14, Express.js, Prisma, PostgreSQL

---

## Task 1: Add onlineBookingEnabled Fields to Database Schema

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add field to Service model**

Find the Service model and add:
```prisma
model Service {
  // ... existing fields ...
  onlineBookingEnabled  Boolean  @default(true) @map("online_booking_enabled")
}
```

**Step 2: Add field to Staff model**

Find the Staff model and add:
```prisma
model Staff {
  // ... existing fields ...
  onlineBookingEnabled  Boolean  @default(true) @map("online_booking_enabled")
}
```

**Step 3: Generate Prisma client**

Run: `cd packages/database && npx prisma generate`

**Step 4: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat: add onlineBookingEnabled to Service and Staff models"
```

---

## Task 2: Update Public API to Filter by onlineBookingEnabled

**Files:**
- Modify: `apps/api/src/routes/public.ts`

**Step 1: Update GET /services to filter by onlineBookingEnabled**

In the services endpoint, add filter:
```typescript
where: {
  salonId: salon.id,
  isActive: true,
  onlineBookingEnabled: true,  // ADD THIS
}
```

**Step 2: Update GET /staff to filter by onlineBookingEnabled**

In the staff endpoint, add filter:
```typescript
where: {
  salonId: salon.id,
  isActive: true,
  onlineBookingEnabled: true,  // ADD THIS
}
```

**Step 3: Update GET /availability to check staff onlineBookingEnabled**

Ensure availability only returns slots for staff with onlineBookingEnabled = true.

**Step 4: Commit**

```bash
git add apps/api/src/routes/public.ts
git commit -m "feat: filter services and staff by onlineBookingEnabled in public API"
```

---

## Task 3: Fix Widget to Properly Connect to Real Business Data

**Files:**
- Modify: `apps/web/src/app/embed/[slug]/page.tsx`

**Step 1: Remove demo-first logic, use API-first**

The widget should:
1. If slug === 'demo' → use DEMO_SALON data (keep this for landing page demo)
2. Otherwise → fetch from API, show error if not found

**Step 2: Ensure fetchSalon handles "booking disabled" properly**

API returns `bookingEnabled: false` → show "Online booking not available" message.

**Step 3: Show proper empty states**

- No services with onlineBookingEnabled → "No services available for online booking"
- No staff with onlineBookingEnabled → "No staff available for online booking"

**Step 4: Remove hardcoded DEMO_CATEGORIES, DEMO_STAFF, DEMO_SLOTS from non-demo mode**

Keep these constants but ONLY use them when `isDemo === true`.

**Step 5: Commit**

```bash
git add apps/web/src/app/embed/[slug]/page.tsx
git commit -m "fix: widget fetches real business data, demo only for /embed/demo"
```

---

## Task 4: Create widget.js Embed Script

**Files:**
- Create: `apps/web/public/widget.js`

**Step 1: Create the embed script**

Script should:
1. Find container element with id="peacase-booking"
2. Read data-slug and data-location attributes
3. Create iframe pointing to /embed/{slug}
4. Handle resize messages from iframe

Note: Use safe DOM methods - createElement and appendChild, not innerHTML with user data.

**Step 2: Commit**

```bash
git add apps/web/public/widget.js
git commit -m "feat: add widget.js embed script for external websites"
```

---

## Task 5: Add Height Messaging to Widget

**Files:**
- Modify: `apps/web/src/app/embed/[slug]/page.tsx`

**Step 1: Add postMessage for height changes**

Add useEffect to send height to parent:
```typescript
useEffect(() => {
  const sendHeight = () => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'peacase-resize',
        height: document.body.scrollHeight
      }, '*');
    }
  };

  sendHeight();
  const observer = new ResizeObserver(sendHeight);
  observer.observe(document.body);

  return () => observer.disconnect();
}, [step]); // Re-send on step change
```

**Step 2: Commit**

```bash
git add apps/web/src/app/embed/[slug]/page.tsx
git commit -m "feat: widget sends height to parent for iframe auto-resize"
```

---

## Task 6: Update Settings Page with Online Booking Controls

**Files:**
- Modify: `apps/web/src/app/settings/page.tsx`

**Step 1: Add service online booking toggles**

In the Booking tab, add a section showing each service with a toggle for online booking.

**Step 2: Add staff online booking toggles**

Similar UI for staff members.

**Step 3: Add API calls to update these settings**

Create endpoints or use existing PATCH endpoints to update Service and Staff.

**Step 4: Show proper embed code**

Display the embed code using the salon's actual slug.

**Step 5: Commit**

```bash
git add apps/web/src/app/settings/page.tsx
git commit -m "feat: add online booking service/staff toggles in settings"
```

---

## Task 7: Create Demo Business in Database

**Files:**
- Create: `apps/api/src/scripts/seed-demo.ts`

**Step 1: Create a real "demo" salon in database**

Create salon with:
- slug: "demo"
- name: "Serenity Spa & Salon"
- Real services, staff, availability
- bookingEnabled: true

**Step 2: Seed sample data**

- 3 services (Haircut $50, Color $120, Massage $90)
- 2 staff members
- Business hours Mon-Sat 9am-6pm
- onlineBookingEnabled: true for all

**Step 3: Commit**

```bash
git add apps/api/src/scripts/seed-demo.ts
git commit -m "feat: add demo business seed script"
```

---

## Task 8: Add API Endpoints for Service/Staff Online Booking Toggle

**Files:**
- Modify: `apps/api/src/routes/services.ts`
- Modify: `apps/api/src/routes/staff.ts`

**Step 1: Add PATCH endpoint for service onlineBookingEnabled**

**Step 2: Add similar endpoint for staff**

**Step 3: Commit**

```bash
git add apps/api/src/routes/services.ts apps/api/src/routes/staff.ts
git commit -m "feat: add API endpoints to toggle online booking for services/staff"
```

---

## Task 9: End-to-End Testing

**Step 1: Test with real business**

1. Create a test salon via signup
2. Add services and staff
3. Go to Settings → Online Booking
4. Toggle some services on/off for online booking
5. Copy embed code
6. Open /embed/{slug} directly
7. Verify only enabled services show
8. Complete a booking
9. Verify appointment appears in Calendar

**Step 2: Test demo mode**

1. Go to /embed/demo
2. Verify demo data shows
3. Complete a demo booking

**Step 3: Test error states**

1. Go to /embed/nonexistent-slug → "Business not found"
2. Disable all services for online booking → "No services available"
3. Disable online booking for salon → "Online booking not available"

---

## Summary

| Task | Description | Complexity |
|------|-------------|------------|
| 1 | Add onlineBookingEnabled to schema | Low |
| 2 | Filter API by onlineBookingEnabled | Low |
| 3 | Fix widget to use real API data | Medium |
| 4 | Create widget.js embed script | Low |
| 5 | Add height messaging to widget | Low |
| 6 | Add settings UI for online booking | Medium |
| 7 | Create demo business in database | Low |
| 8 | Add API toggle endpoints | Low |
| 9 | End-to-end testing | Medium |

**Total estimated tasks: 9**
**Critical path: Tasks 1-3 (schema → API → widget)**
