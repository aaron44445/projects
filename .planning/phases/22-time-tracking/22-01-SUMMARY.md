---
phase: 22-time-tracking
plan: 01
subsystem: staff-portal
tags: [time-tracking, api, database, prisma]
dependencies:
  requires: [21-availability-time-off]
  provides: [time-entry-model, time-clock-api]
  affects: [22-02-time-clock-ui]
tech-stack:
  added: [date-fns-tz]
  patterns: [timezone-aware-storage, concurrency-protection]
key-files:
  created:
    - packages/database/prisma/schema.prisma (TimeEntry model)
  modified:
    - apps/api/src/routes/staffPortal.ts (time clock endpoints)
    - apps/api/package.json (date-fns-tz)
    - apps/web/package.json (date-fns-tz)
decisions:
  - id: time-entry-timezone-capture
    summary: Capture location timezone at clock-in time
    rationale: Prevents timezone changes from affecting historical records
    impact: Stored timezone provides audit trail for when/where work occurred
  - id: application-level-concurrency
    summary: Use application-level check for double clock-in prevention
    rationale: Prisma doesn't support partial unique indexes directly in schema
    impact: Active entry check happens before create; future migration could add database constraint
  - id: duration-calculation-client-side
    summary: Calculate duration in minutes using date-fns differenceInMinutes
    rationale: Simple, accurate, doesn't require database computed columns
    impact: Duration calculated on-demand in API responses
metrics:
  duration: 5 minutes
  completed: 2026-01-29
---

# Phase 22 Plan 01: Time Entry Model & API Summary

**One-liner:** TimeEntry model with timezone capture and time clock API endpoints for staff portal clock in/out operations.

## What Was Built

### Database Layer
- **TimeEntry model** in Prisma schema with:
  - Core fields: staffId, salonId, locationId, clockIn, clockOut (nullable), timezone
  - Audit fields: notes, createdAt, updatedAt
  - Relations: User (staff), Salon, Location
  - Indexes: (staffId, clockIn), (salonId, clockIn), (locationId, clockIn)

### API Layer
- **GET /staff-portal/time-clock/status**
  - Returns clock status (isClockedIn, canClockIn)
  - Includes active entry details with location name

- **POST /staff-portal/time-clock/clock-in**
  - Validates staff assigned to location via StaffLocation
  - Checks for existing active entry (prevents double clock-in)
  - Captures timezone from location.timezone || salon.timezone || 'UTC'
  - Creates TimeEntry with current timestamp

- **POST /staff-portal/time-clock/clock-out/:entryId**
  - Verifies entry ownership
  - Prevents double clock-out
  - Updates clockOut timestamp
  - Returns calculated durationMinutes

- **GET /staff-portal/time-clock/history**
  - Date range filtering (defaults to last 30 days)
  - Returns entries with: id, timestamps, location, timezone, duration, isActive
  - Ordered by clockIn desc

### Dependencies
- Installed **date-fns-tz@3.x** in both api and web packages
  - For timezone-aware formatting in future UI work
  - Compatible with existing date-fns@3.2.0

## Technical Decisions

### Timezone Capture Strategy
Timezone is captured at clock-in time from location settings (with fallbacks: location.timezone → salon.timezone → 'UTC'). This creates an immutable audit trail - even if location timezone settings change later, historical records preserve the timezone that was active when work occurred.

### Concurrency Protection
Application-level check prevents double clock-in by querying for active entries (clockOut: null) before creating new entry. While Prisma doesn't support partial unique indexes in schema, this approach is sufficient for the use case. A database-level constraint could be added via raw SQL migration if stricter enforcement is needed.

### Duration Calculation
Duration calculated on-demand using date-fns `differenceInMinutes()` rather than storing as database field. This keeps data normalized and ensures accuracy without maintaining computed columns.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All success criteria met:
- ✅ TimeEntry model exists in Prisma schema with all required fields
- ✅ Database migration applied successfully (prisma db push)
- ✅ GET /status endpoint returns clock status
- ✅ POST /clock-in endpoint creates entry with location verification
- ✅ POST /clock-out/:id endpoint updates entry with duration
- ✅ GET /history endpoint returns entries with date filtering
- ✅ Double clock-in returns 400 error with ALREADY_CLOCKED_IN code
- ✅ date-fns-tz installed in both packages

## Next Phase Readiness

**Ready for 22-02 (Time Clock UI)**
- API endpoints fully functional
- Error codes defined for UI error handling
- Timezone data available for client-side formatting
- date-fns-tz installed in web package

**Considerations:**
- UI will need timezone formatting using `formatInTimeZone` from date-fns-tz
- History view should display local time based on stored timezone
- Active clock-in state should be prominent in UI

## Testing Notes

Endpoints tested via curl:
- Status endpoint returns correct active/inactive state
- Clock-in validates location assignment
- Clock-out calculates duration correctly
- History filtering works with custom date ranges
- Error codes (ALREADY_CLOCKED_IN, ALREADY_CLOCKED_OUT, NOT_ASSIGNED) return appropriate messages

## Commits

1. **7ecc1d0** - feat(22-01): add TimeEntry model to Prisma schema
   - TimeEntry model with all fields and relations
   - Indexes for efficient querying
   - Database schema updated

2. **50c60e8** - feat(22-01): add time clock API endpoints
   - 4 endpoints: status, clock-in, clock-out, history
   - Location verification and concurrency checks
   - Duration calculation with date-fns

3. **9c4a8a7** - chore(22-01): install date-fns-tz for timezone formatting
   - Added to api and web packages
   - Ready for UI timezone formatting

---
*Completed: 2026-01-29*
*Duration: 5 minutes*
