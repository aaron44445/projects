---
status: diagnosed
trigger: "doesnt save when i select it then save then refresh the page it goes back to 24 hrs"
created: 2026-01-26T00:00:00Z
updated: 2026-01-26T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Frontend notifications section has no state management; UI elements are static HTML with no value bindings or API calls
test: Searched for API endpoint calls and hook usage
expecting: Found no integration between UI and API
next_action: Return root cause diagnosis

## Symptoms

expected: Navigate to salon settings, modify reminder timing (e.g., 48h instead of 24h), save, settings persist after refresh
actual: Settings revert to 24 hrs after refresh
errors: None reported
reproduction: Change notification timing, save, refresh page
started: Unknown - reported during UAT

## Eliminated

- hypothesis: API not persisting data to database
  evidence: API endpoint PUT /api/v1/salon/notification-settings correctly reads, merges, and writes notification_settings JSON to Salon model (salon.ts lines 342-397)
  timestamp: 2026-01-26T00:00:00Z

- hypothesis: Database field missing
  evidence: Prisma schema has notification_settings field on Salon model (schema.prisma line 57)
  timestamp: 2026-01-26T00:00:00Z

## Evidence

- timestamp: 2026-01-26T00:00:00Z
  checked: API routes in apps/api/src/routes/salon.ts
  found: GET/PUT endpoints for /notification-settings exist and function correctly. GET returns settings or defaults. PUT validates, merges, and persists JSON to database.
  implication: Backend is fully implemented and working

- timestamp: 2026-01-26T00:00:00Z
  checked: Frontend settings page apps/web/src/app/settings/page.tsx lines 2148-2154
  found: The reminder timing <select> element has NO value prop, NO onChange handler, and NO state variable. It's a static HTML select with defaultChecked (which doesn't even apply to selects). Similarly, all checkboxes in the notifications section use defaultChecked with no state bindings.
  implication: UI is purely cosmetic - changes have nowhere to go

- timestamp: 2026-01-26T00:00:00Z
  checked: Searched for hook or API call to /salon/notification-settings
  found: No hook exists for client notification settings. useNotifications.ts handles notification logs/history. useOwnerNotifications.ts handles owner email preferences. Neither handles salon notification settings.
  implication: No frontend code exists to load or save notification settings

- timestamp: 2026-01-26T00:00:00Z
  checked: Frontend imports and section definitions
  found: The 'notifications' section (id: 'notifications', name: 'Client Notifications') requires 'reminders' add-on but has no associated hook/state management
  implication: Section was built as UI mockup, never wired to backend

## Resolution

root_cause: The frontend notifications settings UI is static HTML with no state management - the <select> for reminder timing and all checkboxes lack value bindings and onChange handlers, and no hook exists to fetch from or save to the /salon/notification-settings API endpoint. The backend API is fully implemented but the frontend never calls it.
fix:
verification:
files_changed: []
