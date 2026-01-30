# Phase 23: Earnings & Permissions - Research

**Researched:** 2026-01-29
**Domain:** Earnings transparency, pay period calculations, CSV export, client data visibility controls
**Confidence:** HIGH

## Summary

This phase builds on existing earnings infrastructure (CommissionRecord model, `/staff-portal/earnings` endpoint, and earnings page) to implement weekly pay period views with CSV export and client visibility controls. The codebase already has 90% of required data models and API patterns in place.

**Existing infrastructure:**
- CommissionRecord model tracks `serviceAmount`, `tipAmount`, `commissionAmount`, `commissionRate` per appointment
- `/staff-portal/earnings` endpoint returns records with client/service data, respects date ranges
- `apps/web/src/app/staff/earnings/page.tsx` displays summary cards and detailed table
- `staffCanViewClientContact` setting exists in Salon model, already used in staff dashboard to hide client phone conditionally

**Key gaps to fill:**
1. Current earnings page uses month-based date ranges; need weekly pay period calculation (Sunday-Saturday)
2. No CSV export functionality exists
3. Client name masking not implemented (only phone visibility is conditional)
4. No owner UI to toggle `staffCanViewClientContact` in Salon Settings

**Primary recommendation:** Extend existing earnings endpoint to calculate weekly pay periods using date-fns `startOfWeek/endOfWeek` with `weekStartsOn: 0`, add CSV stringification using fast-csv, implement client name masking logic in both API and frontend, and add a settings toggle in the Salon Settings > Staff Policies section.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | ^3.2.0 | Date calculations for pay periods | Already installed, industry standard for date math, ~200M weekly downloads |
| fast-csv | ^5.0.x | CSV generation | Comprehensive CSV library with streaming support, 940+ dependent projects |
| Prisma | 5.22.0 | Database ORM | Already in use, ensures type-safe queries |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns-tz | ^3.2.0 | Timezone handling | Already installed, when displaying dates in salon's timezone |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fast-csv | csv-stringify | csv-stringify is more lightweight (only stringification) but fast-csv offers both parsing and formatting in one package |
| fast-csv | json2csv | json2csv is simpler for basic cases but fast-csv has better streaming support for large datasets |
| Native select | Headless UI select | Native select works fine for simple period dropdown; custom component adds complexity without benefit |

**Installation:**
```bash
npm install fast-csv --workspace @peacase/api
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/routes/staffPortal.ts
├── GET /earnings              # Extend with period param
└── GET /earnings/export       # New CSV export endpoint

apps/web/src/app/staff/earnings/page.tsx
├── Period selector dropdown   # Weekly periods (last 12 weeks)
├── Summary cards              # Total, tips, commissions
├── Service breakdown table    # Masked client names
└── Export button              # Downloads CSV

apps/web/src/app/settings/page.tsx
└── Staff Policies section     # Add staffCanViewClientContact toggle
```

### Pattern 1: Weekly Pay Period Calculation
**What:** Calculate Sunday-to-Saturday pay periods using date-fns
**When to use:** Any date range query that needs weekly pay period boundaries
**Example:**
```typescript
// Source: date-fns documentation + STATE.md decision
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

// Current period (Sunday to Saturday)
const now = new Date();
const periodStart = startOfWeek(now, { weekStartsOn: 0 }); // 0 = Sunday
const periodEnd = endOfWeek(now, { weekStartsOn: 0 });

// Last 12 weeks for history
const periods = Array.from({ length: 12 }, (_, i) => {
  const weekDate = subWeeks(now, i);
  return {
    start: startOfWeek(weekDate, { weekStartsOn: 0 }),
    end: endOfWeek(weekDate, { weekStartsOn: 0 }),
    label: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  };
});
```

### Pattern 2: Client Name Masking
**What:** Conditional display of client information based on salon setting
**When to use:** Any API response or UI that shows client data to staff
**Example:**
```typescript
// Source: Existing staffCanViewClientContact pattern from Phase 20
// API layer (apps/api/src/routes/staffPortal.ts)
const salon = await prisma.salon.findUnique({
  where: { id: salonId },
  select: { staffCanViewClientContact: true }
});

const records = await prisma.commissionRecord.findMany({
  include: {
    appointment: {
      include: {
        service: { select: { name: true } },
        client: { select: { firstName: true, lastName: true } }
      }
    }
  }
});

// Transform client data based on visibility setting
const transformedRecords = records.map(r => ({
  ...r,
  appointment: {
    ...r.appointment,
    client: salon?.staffCanViewClientContact
      ? r.appointment.client
      : {
          firstName: r.appointment.client.firstName,
          lastName: r.appointment.client.lastName[0] // Only first initial
        }
  }
}));

// Frontend layer (apps/web/src/app/staff/earnings/page.tsx)
const clientName = staffCanViewClientContact
  ? `${client.firstName} ${client.lastName}`
  : `${client.firstName} ${client.lastName}.`; // "Sarah M."
```

### Pattern 3: CSV Export with Streaming
**What:** Generate CSV from earnings data respecting client visibility
**When to use:** Any data export feature
**Example:**
```typescript
// Source: fast-csv documentation
import { format } from '@fast-csv/format';

router.get('/earnings/export', authenticate, staffOnly, asyncHandler(async (req, res) => {
  const { startDate, endDate } = parseQueryDates(req.query);

  // Fetch records (same query as /earnings endpoint)
  const records = await fetchEarningsRecords(staffId, salonId, startDate, endDate);
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    select: { staffCanViewClientContact: true }
  });

  // Set CSV headers
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition',
    `attachment; filename=earnings_${staff.firstName}_${formatDate(startDate)}_to_${formatDate(endDate)}.csv`
  );

  // Stream CSV
  const csvStream = format({ headers: true });
  csvStream.pipe(res);

  records.forEach(record => {
    const clientName = salon?.staffCanViewClientContact
      ? `${record.client.firstName} ${record.client.lastName}`
      : `${record.client.firstName} ${record.client.lastName[0]}.`;

    csvStream.write({
      Date: formatDate(record.createdAt),
      Service: record.appointment.service.name,
      'Client Name': clientName,
      'Service Price': record.serviceAmount,
      Tip: record.tipAmount,
      Commission: record.commissionAmount,
      Total: record.commissionAmount + record.tipAmount
    });
  });

  csvStream.end();
}));
```

### Anti-Patterns to Avoid
- **Building periods client-side:** Don't calculate pay periods in frontend; API should return period boundaries to ensure consistency
- **Loading all records then filtering:** Use Prisma date queries (`createdAt: { gte, lte }`) instead of fetching everything
- **Forgetting to mask in both places:** Client visibility must be enforced in API (defense) AND frontend (UX)
- **Hardcoding date formats:** Use Intl.DateTimeFormat or date-fns format() for locale-aware formatting

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV generation | String concatenation with commas | fast-csv | Edge cases: escaped quotes, newlines in fields, special characters, RFC 4180 compliance |
| Date period math | Manual date arithmetic | date-fns startOfWeek/endOfWeek | Timezone bugs, DST transitions, month boundaries, leap years |
| Period dropdown UI | Custom select component | Native `<select>` with styling | Accessibility (keyboard nav, screen readers), mobile support, familiar UX |
| Client name masking | Multiple if/else in UI | Centralized helper function | Consistency across dashboard, schedule, earnings; single source of truth |

**Key insight:** CSV generation looks trivial until you handle quoted fields with commas, newlines, and Unicode. Date math breaks on timezone boundaries and DST transitions. Use battle-tested libraries.

## Common Pitfalls

### Pitfall 1: Week Calculation Off-by-One Errors
**What goes wrong:** Using incorrect weekStartsOn value or forgetting that JavaScript Date.getDay() returns 0 for Sunday
**Why it happens:** Default week start varies by locale (US = Sunday, Europe = Monday); easy to forget option
**How to avoid:** Always explicitly set `weekStartsOn: 0` for Sunday-based pay periods; add integration test with known Sunday/Saturday dates
**Warning signs:** Pay period boundaries fall on wrong days (e.g., Monday-Sunday instead of Sunday-Saturday)

### Pitfall 2: Client Visibility Bypass in CSV Export
**What goes wrong:** CSV export shows full client names even when staffCanViewClientContact is false
**Why it happens:** Developers forget to apply masking logic in export path, only implementing it in UI
**How to avoid:** Share masking logic between API responses (JSON and CSV); single formatClientName() helper
**Warning signs:** Staff can see client contact info by exporting CSV when UI hides it

### Pitfall 3: Current Period Always Shows $0
**What goes wrong:** Commission records have zero earnings for current week
**Why it happens:** CommissionRecords are created when appointments are COMPLETED and PAID, not when scheduled
**How to avoid:** Show clear messaging when period has no data; don't assume bug when $0 appears
**Warning signs:** Current period always empty even with completed appointments in dashboard

### Pitfall 4: Large CSV Crashes Server
**What goes wrong:** Loading all records into memory before stringifying causes out-of-memory errors
**Why it happens:** Fetching thousands of records without pagination or streaming
**How to avoid:** Use fast-csv streaming API with Prisma cursor-based pagination for large datasets
**Warning signs:** API timeout or memory spike when staff with many appointments exports full year

### Pitfall 5: Timezone Confusion in Period Boundaries
**What goes wrong:** Pay period start/end times shift based on server timezone vs salon timezone
**Why it happens:** Using `new Date()` on server returns UTC; salon operates in local timezone
**How to avoid:** Always use salon's timezone from Location/Salon model for period calculations; date-fns-tz for timezone-aware conversions
**Warning signs:** Period boundaries off by hours equal to UTC offset (e.g., 5 hours for EST)

## Code Examples

Verified patterns from official sources:

### Calculate Last 12 Weekly Pay Periods
```typescript
// Source: date-fns documentation + Phase 23 CONTEXT.md
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

function getLast12PayPeriods(referenceDate = new Date()): PayPeriod[] {
  return Array.from({ length: 12 }, (_, i) => {
    const weekDate = subWeeks(referenceDate, i);
    const start = startOfWeek(weekDate, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(weekDate, { weekStartsOn: 0 }); // Saturday

    return {
      start,
      end,
      label: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`,
      isCurrent: i === 0
    };
  });
}
```

### Format Client Name with Visibility Check
```typescript
// Source: Phase 20 staffCanViewClientContact pattern
function formatClientName(
  client: { firstName: string; lastName: string },
  canViewContact: boolean
): string {
  if (canViewContact) {
    return `${client.firstName} ${client.lastName}`;
  }
  // Show first name + last initial only
  return `${client.firstName} ${client.lastName.charAt(0)}.`;
}
```

### Stream CSV Export
```typescript
// Source: fast-csv documentation (https://www.npmjs.com/package/fast-csv)
import { format as csvFormat } from '@fast-csv/format';

async function exportEarningsCSV(
  res: Response,
  records: EarningsRecord[],
  staffName: string,
  period: { start: Date; end: Date },
  canViewClientContact: boolean
) {
  const filename = `earnings_${staffName}_${format(period.start, 'yyyy-MM-dd')}_to_${format(period.end, 'yyyy-MM-dd')}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const csvStream = csvFormat({ headers: true });
  csvStream.pipe(res);

  for (const record of records) {
    csvStream.write({
      Date: format(record.createdAt, 'MMM d, yyyy'),
      Service: record.appointment.service.name,
      'Client Name': formatClientName(record.appointment.client, canViewClientContact),
      'Service Price': record.serviceAmount.toFixed(2),
      Tip: record.tipAmount.toFixed(2),
      Commission: record.commissionAmount.toFixed(2),
      Total: (record.commissionAmount + record.tipAmount).toFixed(2)
    });
  }

  csvStream.end();
}
```

### Period Selector Dropdown (Native Select)
```typescript
// Source: Existing earnings page pattern + accessibility best practices
<select
  value={selectedPeriod}
  onChange={(e) => setSelectedPeriod(e.target.value)}
  className="px-4 py-2 border border-charcoal/20 rounded-xl text-charcoal bg-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
>
  {payPeriods.map((period, index) => (
    <option key={index} value={index}>
      {period.label} {period.isCurrent && '(Current)'}
    </option>
  ))}
</select>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Month-based pay periods | Weekly Sunday-Saturday periods | Phase 23 (2026-01-29) | Aligns with typical spa payroll cycles |
| Manual CSV generation | fast-csv streaming | Phase 23 (2026-01-29) | Handles edge cases, RFC 4180 compliant |
| Show all client data | Conditional visibility via staffCanViewClientContact | Phase 20 (2026-01-29) | Owner controls what staff can see |
| date-fns v2 | date-fns v3.2.0 | Already upgraded | Better TypeScript support, ESM modules |

**Deprecated/outdated:**
- Moment.js: No longer recommended (2020), use date-fns instead
- Manual week calculations: date-fns `startOfWeek` is the standard
- Papa Parse for server-side CSV: fast-csv is more Node.js-optimized

## Open Questions

1. **Should CSV export be limited to specific periods?**
   - What we know: UI shows last 12 weeks (84 days)
   - What's unclear: Can staff export older data? Full history?
   - Recommendation: Limit CSV export to selected period only (whatever is currently displayed); prevents accidental huge exports

2. **What happens if commission rate changes mid-period?**
   - What we know: CommissionRecord stores `commissionRate` per record (snapshot at time of payment)
   - What's unclear: Should summary show blended rate or ignore it?
   - Recommendation: Don't show commission rate in summary (it varies); only in per-service breakdown

3. **Should zero-earning periods be shown in dropdown?**
   - What we know: Some weeks may have no completed/paid appointments
   - What's unclear: Display empty periods or hide them?
   - Recommendation: Show all periods in dropdown (consistency), use EmptyState component when selected period has no data

4. **Does client visibility affect export filename?**
   - What we know: Filename includes staff name and date range
   - What's unclear: Should filename indicate "limited" export when visibility is restricted?
   - Recommendation: No indication in filename (doesn't add value, creates confusion); staff knows their permission level

## Sources

### Primary (HIGH confidence)
- date-fns v3.2.0 documentation - startOfWeek/endOfWeek with weekStartsOn options ([date-fns.org](https://date-fns.org/))
- fast-csv npm package v5.0.x - CSV stringification with streaming ([npmjs.com/package/fast-csv](https://www.npmjs.com/package/fast-csv))
- Existing codebase:
  - `packages/database/prisma/schema.prisma` - CommissionRecord model, staffCanViewClientContact field
  - `apps/api/src/routes/staffPortal.ts` - Existing /earnings endpoint, staffCanViewClientContact usage pattern
  - `apps/web/src/app/staff/earnings/page.tsx` - Current earnings UI structure
  - `apps/web/src/app/settings/page.tsx` - Salon Settings structure and patterns
  - `.planning/STATE.md` - Phase 23 decisions and context

### Secondary (MEDIUM confidence)
- [DigitalOcean CSV tutorial](https://www.digitalocean.com/community/tutorials/how-to-read-and-write-csv-files-in-node-js-using-node-csv) - Node.js CSV best practices (2026)
- [LogRocket React select libraries](https://blog.logrocket.com/best-react-select-component-libraries/) - When to use native vs custom selects
- [Medium: Building Accessible Dropdowns in React](https://medium.com/@katr.zaks/building-an-accessible-dropdown-combobox-in-react-a-step-by-step-guide-f6e0439c259c) - Accessibility patterns
- [Paychex 2026 Payroll Calendar](https://www.paychex.com/articles/payroll-taxes/payroll-calendar) - Weekly pay period conventions

### Tertiary (LOW confidence)
- WebSearch: "Node.js CSV export best libraries 2026" - Confirmed fast-csv and csv-stringify as top choices
- WebSearch: "React dropdown select component best practices accessible 2026" - Reinforced native select recommendation for simple cases

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed or well-documented with strong community support
- Architecture: HIGH - Extending existing patterns from Phase 20 (staffCanViewClientContact) and current earnings page
- Pitfalls: HIGH - Based on known date/timezone edge cases and existing codebase patterns

**Research date:** 2026-01-29
**Valid until:** 60 days (date-fns and fast-csv are mature, stable libraries)
