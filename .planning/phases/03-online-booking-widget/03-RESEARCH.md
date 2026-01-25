# Phase 3: Online Booking Widget - Research

**Researched:** 2026-01-25
**Domain:** Online booking system reliability, concurrent transaction handling, double-booking prevention
**Confidence:** HIGH

## Summary

Preventing double-bookings in a booking widget requires a layered approach combining database transactions, locking strategies, availability calculation accuracy, and load testing. The research reveals that **pessimistic locking with `SELECT FOR UPDATE SKIP LOCKED`** combined with **Serializable or RepeatableRead transaction isolation levels** provides the strongest guarantee against double-bookings under high concurrency.

For a spa/salon booking system expecting moderate concurrency (under 100 concurrent requests), the recommended approach is:
1. Use Prisma interactive transactions with RepeatableRead isolation level
2. Implement availability checks that account for all blocking factors (business hours, staff availability, existing appointments, time off)
3. Use raw SQL with `SELECT FOR UPDATE SKIP LOCKED` within transactions for the final booking operation
4. Build retry logic to handle P2034 (serialization) errors
5. Test with load testing tools (k6 or Artillery) at 10x expected load

**Primary recommendation:** Use interactive transactions with RepeatableRead isolation + raw SQL row locking for the booking endpoint. Implement optimistic checks for availability display, but pessimistic locking for final booking confirmation.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | Latest (5.x+) | Database ORM with transaction support | De facto Node.js ORM with mature transaction API, supports interactive transactions with isolation levels |
| PostgreSQL | 14+ | Database with robust locking | Industry standard for ACID compliance, supports all isolation levels including Serializable |
| Node.js | 18+ LTS | Runtime environment | Current LTS with stable async/transaction handling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| k6 | Latest | Load testing concurrent requests | Testing double-booking prevention under 100+ concurrent requests |
| Artillery | Latest | Alternative load testing | Simpler syntax if k6 is overkill, good for CI/CD integration |
| vitest | Latest | Unit/integration testing | Already in project, suitable for testing availability calculations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma transactions | TypeORM with QueryRunner | TypeORM has more verbose transaction API, Prisma is simpler for this use case |
| PostgreSQL | MySQL | MySQL's Serializable isolation has different semantics (gap locking), PostgreSQL is better documented for booking systems |
| k6/Artillery | JMeter | JMeter has steeper learning curve and GUI overhead, k6/Artillery better for modern API testing |

**Installation:**
```bash
# Already installed (Prisma, PostgreSQL, vitest)
# Add for load testing:
npm install --save-dev k6
# OR
npm install --save-dev artillery
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── routes/
│   └── public.ts              # Booking endpoints (already exists)
├── services/
│   ├── availability.ts        # Availability calculation logic
│   └── booking.ts             # Booking creation with transaction handling
├── lib/
│   └── prismaExtensions.ts    # Custom Prisma methods with locking
└── __tests__/
    └── booking-concurrency.test.ts  # Load tests for double-booking
```

### Pattern 1: Pessimistic Locking for Booking Confirmation
**What:** Use row-level locking with `SELECT FOR UPDATE SKIP LOCKED` within a transaction when creating a booking
**When to use:** At the final booking confirmation step, after user has selected time slot
**Example:**
```typescript
// Source: Prisma raw SQL documentation + PostgreSQL explicit locking docs
// https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries
// https://www.postgresql.org/docs/current/explicit-locking.html

import { prisma } from '@peacase/database';

async function createBooking(bookingData) {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          // Lock the time slot to prevent concurrent bookings
          // SKIP LOCKED ensures we don't wait for other transactions
          const conflictCheck = await tx.$queryRaw`
            SELECT id FROM appointments
            WHERE staff_id = ${bookingData.staffId}
              AND status != 'cancelled'
              AND (
                (start_time <= ${bookingData.startTime} AND end_time > ${bookingData.startTime})
                OR (start_time < ${bookingData.endTime} AND end_time >= ${bookingData.endTime})
                OR (start_time >= ${bookingData.startTime} AND end_time <= ${bookingData.endTime})
              )
            FOR UPDATE SKIP LOCKED
          `;

          if (conflictCheck.length > 0) {
            throw new Error('TIME_CONFLICT');
          }

          // Create the appointment
          const appointment = await tx.appointment.create({
            data: {
              salonId: bookingData.salonId,
              clientId: bookingData.clientId,
              staffId: bookingData.staffId,
              serviceId: bookingData.serviceId,
              startTime: bookingData.startTime,
              endTime: bookingData.endTime,
              status: 'confirmed',
              source: 'online_booking',
            },
          });

          return appointment;
        },
        {
          isolationLevel: 'RepeatableRead',
          maxWait: 5000,   // Max time to wait for transaction to start (ms)
          timeout: 10000,  // Max time for transaction to complete (ms)
        }
      );
    } catch (error) {
      // Handle serialization errors with retry
      if (error.code === 'P2034') {
        retries++;
        if (retries >= maxRetries) {
          throw new Error('BOOKING_UNAVAILABLE');
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
        continue;
      }
      throw error;
    }
  }
}
```

### Pattern 2: Optimistic Availability Calculation
**What:** Calculate available slots by checking business hours, staff availability, existing appointments, and time off without locking
**When to use:** When displaying available time slots to users (read-only operation)
**Example:**
```typescript
// Source: Existing public.ts implementation + availability best practices
// apps/api/src/routes/public.ts lines 342-646

async function calculateAvailability(date: string, serviceId: string, staffId?: string) {
  // 1. Get service details (duration, buffer)
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  const totalDuration = service.durationMinutes + (service.bufferMinutes || 0);

  // 2. Get business hours for the day
  const dayOfWeek = new Date(date).getDay();
  const businessHours = await prisma.locationHours.findUnique({
    where: { locationId_dayOfWeek: { locationId, dayOfWeek } }
  });

  // 3. Get staff members who can perform service
  const staff = await prisma.user.findMany({
    where: {
      salonId,
      isActive: true,
      onlineBookingEnabled: true,
      staffServices: {
        some: { serviceId, isAvailable: true }
      }
    },
    include: {
      staffAvailability: { where: { dayOfWeek } },
      timeOff: {
        where: {
          startDate: { lte: new Date(date + 'T23:59:59') },
          endDate: { gte: new Date(date + 'T00:00:00') }
        }
      }
    }
  });

  // 4. Get existing appointments for the day
  const appointments = await prisma.appointment.findMany({
    where: {
      staffId: { in: staff.map(s => s.id) },
      startTime: { gte: new Date(date + 'T00:00:00') },
      endTime: { lte: new Date(date + 'T23:59:59') },
      status: { notIn: ['cancelled'] }
    }
  });

  // 5. Generate slots and check availability
  const slots = [];
  // Iterate through business hours in slotInterval increments
  // For each slot:
  //   - Check if within business hours
  //   - Check if staff member is working (staffAvailability)
  //   - Check if staff member is not on time off
  //   - Check if no conflicting appointments
  //   - Add to available slots if all checks pass

  return slots;
}
```

### Pattern 3: Idempotent Booking with Request ID
**What:** Accept an optional `requestId` to allow safe retries without duplicate bookings
**When to use:** When client-side retries are needed (network failures, timeouts)
**Example:**
```typescript
// Source: Booking.com API error handling patterns
// https://developers.booking.com/metasearch/connect-api/development-guide/error-handling

async function createBookingIdempotent(bookingData, requestId?: string) {
  // Check if booking already exists with this requestId
  if (requestId) {
    const existing = await prisma.appointment.findFirst({
      where: {
        notes: { contains: `requestId:${requestId}` }, // Or use metadata JSON field
        clientId: bookingData.clientId,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      }
    });

    if (existing) {
      return existing; // Return existing booking instead of creating duplicate
    }
  }

  // Proceed with normal booking creation
  return createBooking({
    ...bookingData,
    notes: requestId ? `requestId:${requestId}\n${bookingData.notes || ''}` : bookingData.notes
  });
}
```

### Anti-Patterns to Avoid
- **Read-then-write without transaction:** Reading availability and then creating appointment in separate queries creates a race condition window
- **Using default ReadCommitted isolation:** Allows phantom reads where another transaction inserts a conflicting appointment between your read and write
- **No retry logic for serialization errors:** With Serializable/RepeatableRead isolation, you MUST handle P2034 errors and retry
- **Checking availability only on frontend:** Always verify availability server-side at booking time; client data may be stale
- **Using `SELECT FOR UPDATE` without SKIP LOCKED:** Causes cascading delays as transactions wait for each other; use SKIP LOCKED to fail fast

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Transaction retry logic | Custom exponential backoff with hardcoded delays | Prisma's built-in transaction API with isolation levels + standard retry pattern | Serialization errors (P2034) require retry; Prisma handles transaction boundaries correctly, rolling back on error |
| Calendar date/time calculations | String parsing and manual timezone conversion | `date-fns` or `luxon` for date math, respect salon.timezone field | Edge cases like DST transitions, leap seconds, month boundaries are complex and error-prone |
| Concurrent request testing | Manual curl scripts or Postman runner | k6 or Artillery for load testing | These tools are designed for concurrent request scenarios, provide metrics, and integrate with CI/CD |
| Request idempotency | Custom duplicate detection logic | Standard requestId pattern with database lookup | Industry standard approach, easier to reason about than custom logic |

**Key insight:** Double-booking prevention is fundamentally a database-level concern. Custom application logic for locking or conflict detection will always have edge cases. Use database transactions and row locking instead.

## Common Pitfalls

### Pitfall 1: Not Handling Serialization Errors
**What goes wrong:** Application crashes when two bookings attempt to reserve the same slot at the exact same time
**Why it happens:** With RepeatableRead or Serializable isolation, PostgreSQL will abort one transaction with a serialization error (P2034 in Prisma)
**How to avoid:** Wrap booking transaction in retry loop with 5 attempts and exponential backoff
**Warning signs:** Intermittent "booking failed" errors under load, P2034 error codes in logs

### Pitfall 2: Forgetting Buffer Time in Availability Calculation
**What goes wrong:** Widget shows time slot as available, but booking fails because appointment + buffer overlaps with next appointment
**Why it happens:** Service duration calculation only includes `durationMinutes`, not `bufferMinutes`
**How to avoid:** Always use `totalDuration = service.durationMinutes + (service.bufferMinutes || 0)` for overlap checks
**Warning signs:** Bookings succeed but staff has back-to-back appointments with no cleanup time

### Pitfall 3: Time Zone Confusion
**What goes wrong:** Appointments created in wrong timezone, especially for salons and clients in different timezones
**Why it happens:** JavaScript Date objects use local timezone, database stores UTC timestamps
**How to avoid:** Always convert to salon's timezone using `salon.timezone` field when displaying/accepting times. Store UTC in database.
**Warning signs:** Appointments appear 1-8 hours off, daylight saving time changes cause issues

### Pitfall 4: Not Excluding Cancelled Appointments
**What goes wrong:** Availability calculation shows slots as unavailable even though conflicting appointment was cancelled
**Why it happens:** Query includes `status: 'cancelled'` appointments in conflict check
**How to avoid:** Always filter by `status: { notIn: ['cancelled'] }` when checking conflicts
**Warning signs:** Phantom unavailable slots that don't correspond to any visible appointments

### Pitfall 5: Treating "Any Available" Staff Selection as Simple Query
**What goes wrong:** System picks first staff member without checking actual availability, leading to conflicts
**Why it happens:** Assuming any staff can do any service without checking staffServices, staffAvailability, and timeOff
**How to avoid:** When staffId is null, iterate through eligible staff and check availability for each before assigning
**Warning signs:** Bookings assigned to staff who are off or don't perform that service

### Pitfall 6: No Load Testing Before Production
**What goes wrong:** Double-bookings occur in production despite passing unit tests
**Why it happens:** Race conditions only appear under concurrent load; sequential tests pass
**How to avoid:** Test with k6 or Artillery simulating 100+ concurrent booking attempts for the same slot. Expect 1 success, 99 conflicts.
**Warning signs:** Reports of double-bookings from real users, no way to reproduce locally

## Code Examples

Verified patterns from official sources:

### Prisma Transaction with Isolation Level
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
import { Prisma } from '@prisma/client';

const result = await prisma.$transaction(
  async (tx) => {
    // All queries here use RepeatableRead isolation
    const data = await tx.user.findMany();
    return data;
  },
  {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    maxWait: 5000,   // 5s max wait to start transaction
    timeout: 10000,  // 10s max transaction duration
  }
);
```

### Handling Serialization Errors
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
// Pattern for retry logic with P2034 errors

const maxRetries = 5;
let retries = 0;

while (retries < maxRetries) {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Transaction logic here
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
    return result; // Success - exit loop
  } catch (error) {
    if (error.code === 'P2034') {
      retries++;
      if (retries >= maxRetries) {
        throw new Error('Transaction failed after retries');
      }
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
      continue;
    }
    throw error; // Re-throw non-serialization errors
  }
}
```

### SELECT FOR UPDATE with Raw SQL
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries
// https://www.postgresql.org/docs/current/explicit-locking.html

await prisma.$transaction(async (tx) => {
  // Lock rows to prevent concurrent modification
  const [seat] = await tx.$queryRaw`
    SELECT * FROM seats
    WHERE seat_number = ${seatNumber}
      AND flight_id = ${flightId}
      AND status = 'available'
    FOR UPDATE SKIP LOCKED
  `;

  if (!seat) {
    throw new Error('Seat not available');
  }

  // Update seat status
  await tx.$executeRaw`
    UPDATE seats
    SET status = 'booked', customer_id = ${customerId}
    WHERE id = ${seat.id}
  `;
});
```

### k6 Load Test for Double-Booking
```javascript
// Source: https://k6.io/docs/
// apps/api/__tests__/booking-load.test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    double_booking_test: {
      executor: 'shared-iterations',
      vus: 100,          // 100 virtual users
      iterations: 100,   // 100 total requests
      maxDuration: '30s',
    },
  },
};

export default function () {
  const payload = JSON.stringify({
    serviceId: 'test-service-id',
    staffId: 'test-staff-id',
    startTime: '2026-02-01T10:00:00Z',
    firstName: 'Test',
    lastName: 'User',
    email: `test-${__VU}@example.com`, // Unique per VU
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('http://localhost:3001/api/v1/public/demo/book', payload, params);

  check(res, {
    'booking succeeded': (r) => r.status === 201,
    'booking conflicted': (r) => r.status === 400 && r.json('error.code') === 'TIME_CONFLICT',
  });
}

// Expected result: 1 success (201), 99 conflicts (400 with TIME_CONFLICT)
```

### Availability Conflict Check
```typescript
// Source: Existing codebase (apps/api/src/routes/public.ts lines 550-562)
// Improved version with explicit buffer time

function hasConflict(
  staffId: string,
  slotStart: Date,
  slotEnd: Date,
  existingAppointments: Array<{ staffId: string; startTime: Date; endTime: Date }>
): boolean {
  return existingAppointments.some((apt) => {
    if (apt.staffId !== staffId) return false;
    const aptStart = new Date(apt.startTime);
    const aptEnd = new Date(apt.endTime);

    // Check for any overlap
    return (
      (slotStart >= aptStart && slotStart < aptEnd) ||      // Slot starts during appointment
      (slotEnd > aptStart && slotEnd <= aptEnd) ||          // Slot ends during appointment
      (slotStart <= aptStart && slotEnd >= aptEnd)          // Slot completely contains appointment
    );
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Application-level locking with in-memory flags | Database-level locking with SELECT FOR UPDATE | PostgreSQL 9.5+ (2016) with SKIP LOCKED | Better scalability across multiple API instances, no shared memory required |
| ReadCommitted isolation (default) | RepeatableRead or Serializable for booking operations | Prisma 4.7.0 (Dec 2022) with isolation level support | Prevents phantom reads and double-bookings in high concurrency |
| Manual retry logic with arbitrary delays | Structured retry pattern for P2034 errors with exponential backoff | Industry best practice (2020+) | More reliable under load, prevents thundering herd |
| Synchronous availability checks | Optimistic display with pessimistic confirmation | Modern booking UX patterns (2023+) | Faster perceived performance, conflicts handled gracefully |

**Deprecated/outdated:**
- `SELECT FOR UPDATE` without `SKIP LOCKED`: Causes lock queuing and poor performance. Use `SKIP LOCKED` to fail fast (PostgreSQL 9.5+)
- Using Prisma `update()` for conditional updates without version field: Leads to lost updates. Use interactive transactions with explicit conflict checks instead
- Single-step booking (check + create in one query): Race condition window. Use transaction with row locking for atomicity

## Open Questions

1. **Load Testing Threshold**
   - What we know: Should test at 10x expected concurrent load. Industry standard for booking systems.
   - What's unclear: What is Peacase's expected concurrent load? Depends on number of locations, marketing campaigns, peak hours.
   - Recommendation: Start with 100 concurrent requests as baseline. Monitor production metrics and adjust.

2. **Transaction Timeout Tuning**
   - What we know: Prisma default is 5s maxWait, 10s timeout. Booking.com recommends 60s for external dependencies.
   - What's unclear: What's appropriate for Peacase's booking flow (no external dependencies for booking itself)?
   - Recommendation: Use 5s maxWait, 10s timeout for booking transaction. If Stripe payment is added later, increase to 30s.

3. **Retry Strategy for Serialization Errors**
   - What we know: Need exponential backoff to prevent thundering herd. 5 retries is common.
   - What's unclear: Should we retry on client-side or server-side?
   - Recommendation: Server-side retry (transparent to client). Return TIME_CONFLICT error only after all retries exhausted.

4. **Alternative Slot Suggestions on Conflict**
   - What we know: User decided to show alternative slots when conflict occurs. Need same service + same staff (if specified).
   - What's unclear: How many alternatives to show? How far forward to search?
   - Recommendation: Show 3 alternative slots within same day, then next 3 slots within 7 days. Falls within Claude's discretion per CONTEXT.md.

## Sources

### Primary (HIGH confidence)
- [Prisma Transactions Documentation](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) - Interactive transactions, isolation levels, retry patterns
- [Prisma Raw SQL Documentation](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries) - Using $queryRaw and $executeRaw in transactions
- [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html) - SELECT FOR UPDATE, SKIP LOCKED semantics
- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html) - Serializable, RepeatableRead, ReadCommitted behavior
- [k6 Documentation](https://k6.io/docs/) - Load testing concurrent requests

### Secondary (MEDIUM confidence)
- [Prisma Isolation Level Discussion](https://github.com/prisma/prisma/discussions/9002) - Community discussion on RepeatableRead vs Serializable
- [Prisma Row Locking Feature Request](https://github.com/prisma/prisma/issues/5983) - Status of native SELECT FOR UPDATE support (not yet implemented)
- [How to Build High-Concurrency Ticket Booking with Prisma](https://dev.to/zenstack/how-to-build-a-high-concurrency-ticket-booking-system-with-prisma-184n) - Practical example of booking system with Prisma
- [Optimistic vs Pessimistic Locking in Spring Boot](https://medium.com/@jpssasadara1995/optimistic-vs-e21af7c31de3) - Comparison in booking context (language-agnostic principles)
- [Testing Double Booking at Scale (Medium, Nov 2025)](https://medium.com/@niarsdet/testing-double-booking-at-scale-how-qa-ensures-reservation-consistency-on-high-traffic-systems-77580d94049c) - QA perspective on double-booking prevention
- [Load Testing Your API: k6 vs Artillery vs Locust (Medium, Jan 2026)](https://medium.com/@sohail_saifi/load-testing-your-api-k6-vs-artillery-vs-locust-66a8d7f575bd) - Recent comparison of load testing tools

### Tertiary (LOW confidence)
- [Booking.com Error Handling](https://developers.booking.com/metasearch/connect-api/development-guide/error-handling) - Industry patterns for booking APIs (different domain but transferable)
- [Minimizing Lock Contention (Medium, Jan 2026)](https://medium.com/@captain-uchiha/minimizing-lock-contention-optimistic-vs-pessimistic-locking-explained-clearly-0d3f6da9464a) - General explanation of locking strategies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Prisma + PostgreSQL + k6 are well-documented and widely used for this exact use case
- Architecture: HIGH - Transaction patterns verified in official Prisma docs, SELECT FOR UPDATE is standard PostgreSQL
- Pitfalls: HIGH - Based on real issues reported in Prisma GitHub, PostgreSQL docs warnings, and industry blog posts
- Load testing: MEDIUM - Best practices verified but specific thresholds (100 concurrent, 10x rule) are industry heuristics not hard requirements

**Research date:** 2026-01-25
**Valid until:** 2026-03-25 (60 days - stable domain, but Prisma may add native row locking support)

---

## Research Notes

### Current Codebase Assessment

The existing booking endpoint (`apps/api/src/routes/public.ts` lines 785-1134) has some good patterns but lacks critical double-booking protections:

**What's Working:**
- Availability calculation considers business hours, staff availability, time off, and existing appointments
- Conflict detection logic checks for appointment overlaps correctly (lines 552-561)
- Separate availability endpoint for display vs. booking confirmation

**What's Missing:**
- No transaction wrapping for booking creation
- No row-level locking to prevent concurrent bookings
- No retry logic for database errors
- Conflict check (lines 894-920, 944-980) happens outside a transaction, creating race condition window

**Priority Fixes:**
1. Wrap booking creation in Prisma transaction with RepeatableRead isolation
2. Add `SELECT FOR UPDATE SKIP LOCKED` for final conflict check within transaction
3. Implement retry logic for P2034 errors
4. Add load test to verify 0% double-bookings under concurrent load

### Testing Strategy

Based on research, the following testing approach is recommended:

1. **Unit Tests** (vitest): Test availability calculation logic, conflict detection, buffer time calculations
2. **Integration Tests** (vitest + test database): Test booking flow with mocked concurrent requests
3. **Load Tests** (k6): Test with 100 concurrent booking attempts for same slot, verify exactly 1 succeeds
4. **Chaos Tests**: Inject random delays, network errors, database restarts during booking flow

### Performance Considerations

- RepeatableRead isolation is sufficient for booking systems (Serializable is overkill and slower)
- SKIP LOCKED prevents lock queuing and provides faster failure (better UX than waiting)
- With 100 concurrent users, expect ~99% to receive TIME_CONFLICT immediately (< 100ms response)
- The 1 successful booking should complete in < 500ms with proper indexing on appointments table

### Alternative Approaches Considered

1. **Optimistic Concurrency Control (version field)**: Would work but requires schema change and is better for frequent updates to same record. Booking is insert-once operation.
2. **Pessimistic locking without SKIP LOCKED**: Would work but causes cascading waits. SKIP LOCKED is strictly better UX.
3. **Redis distributed lock**: Adds complexity and another service. Database-level locking is sufficient for spa/salon scale.
4. **Queue-based booking**: Overengineered for this use case. Interactive transactions are simpler and fast enough.
