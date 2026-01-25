# Domain Pitfalls: Spa/Salon Booking Software

**Domain:** Multi-tenant spa/salon SaaS
**Researched:** 2026-01-25

## Critical Pitfalls

Mistakes that cause data loss, security breaches, or require rewrites.

### Pitfall 1: Double-Booking Race Conditions
**What goes wrong:** Two clients simultaneously book the same staff member for overlapping times. Checking availability and creating appointments are separate operations, allowing concurrent requests to both see the same slot as available.

**Why it happens:**
- Availability check and appointment creation not wrapped in transaction
- No row-level locking on time slots during booking
- Async nature of booking requests creates timing windows

**Consequences:**
- Staff double-booked (two clients, same time)
- Customer trust destroyed
- Manual intervention required to reschedule
- Business loses revenue if client cancels due to frustration

**Prevention:**
- Wrap availability check + appointment creation in database transaction
- Use `SELECT...FOR UPDATE` on availability window to lock rows
- Implement optimistic locking with version numbers on appointment slots
- For high traffic: Use distributed locking (Redis) across API instances

**Detection:**
- Integration test: Launch 100 concurrent booking requests for same slot, verify only 1 succeeds
- Monitor for appointments with overlapping staff assignments
- Log when availability check passes but creation fails (race condition indicator)

**References:**
- [How to Solve Race Conditions in a Booking System](https://hackernoon.com/how-to-solve-race-conditions-in-a-booking-system)
- [Concurrency Conundrum in Booking Systems](https://medium.com/@abhishekranjandev/concurrency-conundrum-in-booking-systems-2e53dc717e8c)

---

### Pitfall 2: Multi-Tenant Data Leakage via Missing tenant_id Filter
**What goes wrong:** Database queries forget to filter by `salonId` or `tenant_id`, exposing data across business boundaries. A manager at Salon A sees appointments/clients/revenue from Salon B.

**Why it happens:**
- Queries written without tenant scoping (copy-paste without tenant filter)
- Cache keys don't include tenant_id prefix (shared Redis cache leaks data)
- Global state in async systems (Node.js) stores tenant_id in shared variables
- SQL joins that don't scope by tenant
- Client-supplied organization IDs trusted without verification

**Consequences:**
- CRITICAL: One business sees another's confidential client data
- Legal liability (privacy violations, GDPR breach)
- Competitive intelligence leak (pricing, services offered)
- Complete platform trust destruction

**Prevention:**
- **Code review rule:** EVERY database query must filter by salonId
- Prisma middleware that enforces tenant filtering on all queries
- Cache keys MUST be prefixed: `salon_{salonId}:dashboard_stats`
- Use async context storage (AsyncLocalStorage in Node.js) for tenant scoping, not global variables
- Database-level Row Level Security (RLS) as safety net, NOT primary defense
- Never trust client-supplied tenant identifiers for authorization

**Detection:**
- Automated test: Create data for Salon A and Salon B, verify Salon A manager cannot access Salon B endpoints
- Code scanning: Flag Prisma queries without `where: { salonId }`
- Log analysis: Monitor for queries returning zero results (possible wrong tenant filter)
- Penetration test: Modify request tenant_id and verify 403 responses

**References:**
- [Multi-Tenant Leakage: When Row-Level Security Fails in SaaS](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c)
- [Multi-Tenant Security: Definition, Risks and Best Practices](https://qrvey.com/blog/multi-tenant-security/)

---

### Pitfall 3: Timezone Mismatches Cause Wrong Appointment Times
**What goes wrong:** Business operates in Eastern Time but appointments display in UTC or customer's local timezone. Customer books "2:00 PM" in their timezone, shows as "7:00 PM" on salon calendar.

**Why it happens:**
- Storing times without timezone metadata (naive datetime vs aware datetime)
- Converting between UTC and local time inconsistently
- Client and server disagree on which timezone to use
- Daylight Saving Time transitions handled incorrectly
- Mixing `Date` objects with timestamp integers without timezone context

**Consequences:**
- Customers arrive at wrong time (missed appointments)
- Staff schedules scrambled across timezone boundaries
- Double-bookings when DST transition changes hour offsets
- International customers cannot book reliably

**Prevention:**
- Store ALL times in UTC in database, convert to display timezone only in UI
- Attach timezone metadata to business/location (store as IANA timezone, e.g., "America/New_York")
- Force booking widget to display slots in business timezone (not customer's)
- Use `luxon` or `date-fns-tz` libraries, avoid manual timezone math
- Test DST transitions explicitly (spring forward, fall back)
- Lock business timezone on booking page to prevent customer confusion

**Detection:**
- Manual test: Book appointment with browser set to different timezone, verify salon sees correct time
- Automated test: Create appointment at "2:00 PM Eastern", verify database stores correct UTC equivalent
- Monitor for appointments booked outside business hours (sign of timezone bug)
- Check for appointment clusters at DST transition hours

**References:**
- [Time zone error in Bookings meetings](https://support.lesley.edu/support/solutions/articles/4000215566-time-zone-discrepancies-with-microsoft-bookings)
- [Double Booking Scheduling Issues: How to Handle & Avoid It](https://www.housecallpro.com/resources/how-to-avoid-double-booking/)

---

### Pitfall 4: Payment Webhook Processing Failures
**What goes wrong:** Stripe sends payment confirmation webhook but API doesn't process it (timeout, crash, duplicate). Appointment marked unpaid even though customer was charged, or charged twice.

**Why it happens:**
- Webhooks not idempotent (processing same webhook twice creates duplicate state)
- Signature verification skipped or implemented incorrectly
- Webhook handler crashes mid-processing, leaving partial state
- Webhooks arrive out-of-order (charge succeeds before charge.created arrives)
- No retry mechanism for failed webhook processing

**Consequences:**
- Customer charged but appointment not confirmed (revenue lost, customer angry)
- Double-charging customers (refund required, trust destroyed)
- Financial reconciliation nightmare (payments vs appointments mismatch)
- Stripe disputes increase if customers see "unpaid" status after payment

**Prevention:**
- Verify webhook signature BEFORE any processing
- Use `event.id` as idempotency key (store in database, reject duplicates)
- Wrap webhook processing in database transaction (all-or-nothing)
- Handle out-of-order events gracefully (check final state, not event order)
- Retry failed webhooks with exponential backoff
- Log ALL webhook events for audit trail

**Detection:**
- Monitor for webhook retries (Stripe retries failed webhooks)
- Compare Stripe payment records vs appointment payment status daily
- Test webhook handler with Stripe CLI (`stripe listen --forward-to localhost`)
- Simulate failures: Kill process mid-webhook, verify state cleanup

**References:**
- [Payment Gateway Integration Guide 2026](https://neontri.com/blog/payment-gateway-integration/)
- [Common Payment Gateway Integration Mistakes to Avoid](https://www.enkash.com/resources/blog/common-payment-gateway-integration-mistakes-to-avoid)

---

### Pitfall 5: Email/SMS Reminder Delivery Failures
**What goes wrong:** Appointment reminders never reach customers. Emails land in spam, SMS fails due to carrier blocks, or service credentials expired.

**Why it happens:**
- Email authentication missing (SPF, DKIM, DMARC not configured)
- Sending from generic domain (noreply@yourdomain.com flagged as spam)
- SMS carrier blocks messages with shortened URLs or certain keywords
- API credentials rotated but not updated in app
- Network timeout on email service, request fails silently
- Phone number formatting incorrect (international numbers, missing country code)

**Consequences:**
- Customers miss appointments (no-shows increase)
- Business loses revenue from missed slots
- Customer satisfaction drops ("I never got a reminder")
- Churn increases if reminders unreliable

**Prevention:**
- Configure email authentication (SPF, DKIM, DMARC) before going live
- Use dedicated sending domain (calendar@peacase.com, not noreply@)
- Validate phone numbers with `libphonenumber-js` before saving
- Queue failed sends for retry with exponential backoff
- Store sent reminders in database (track delivery status)
- Monitor delivery rates: Alert if success rate drops below 90%
- Send both email AND SMS for critical reminders (redundancy)

**Detection:**
- Track delivery reports from Twilio/SendGrid (delivered, failed, bounced)
- Monitor for spikes in failed sends (credential issue, service outage)
- Customer reports: "I never got a reminder" is a red flag
- Integration test: Send to test phone/email, verify delivery within 30 seconds

**References:**
- [Email vs SMS Appointment Reminders: Which Works Better?](https://smartsmssolutions.com/resources/blog/business/appointment-reminder-email-examples)
- [Why Do Emails Get Bounced in 2026?](https://www.mailwarm.com/blog/emails-bounced-delivery-rules)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or require workarounds.

### Pitfall 6: Buffer Time Not Calculated in Availability
**What goes wrong:** System shows slot as available but doesn't account for buffer/cleanup time between appointments. Customer books 2:00 PM slot, but staff has appointment ending at 2:00 PM (needs 15 min cleanup).

**Why it happens:**
- Availability calculation checks only appointment start/end, ignoring buffers
- Buffer time configured per service but not enforced in booking logic
- Complex math with overlapping buffers (appointment ends 2:00, buffer 15min, next starts 2:00)

**Consequences:**
- Staff overbooked (no time to prepare between clients)
- Service quality drops (rushing between appointments)
- Customer experience suffers (staff flustered, room not ready)

**Prevention:**
- Include buffer time in availability window calculation
- When checking slot 2:00-3:00, verify no appointments in 1:45-3:15 (with buffers)
- Configure buffer separately for pre-appointment and post-appointment
- Test edge case: Book back-to-back appointments with buffers, verify system blocks overlaps

**Detection:**
- Manual test: Book appointment at 2:00 PM, try to book next appointment at 3:00 PM with 15-min buffer configured
- Log when appointments are within buffer window (warning sign)

**References:**
- [Appointment availability troubleshooting](https://help.acuityscheduling.com/hc/en-us/articles/16676931784333-Appointment-availability-troubleshooting)

---

### Pitfall 7: Calendar Sync Conflicts (Staff Double-Booked Across Systems)
**What goes wrong:** Staff has personal Google Calendar synced to booking system. Client books during time marked "free" in salon calendar, but staff actually has personal appointment.

**Why it happens:**
- External calendar events marked as "free" instead of "busy"
- Sync delay between Google Calendar and booking system (eventual consistency)
- Sync only one-way (booking system doesn't update Google Calendar)
- Staff edits availability in one system, not reflected in other

**Consequences:**
- Staff double-booked (personal appointment conflicts with salon booking)
- Manual rescheduling required
- Staff frustrated with unreliable system

**Prevention:**
- Sync calendar bi-directionally (booking system ↔ Google Calendar)
- Respect "busy" status from external calendars (block those slots)
- Real-time sync with webhooks (Google Calendar Push Notifications)
- Add manual override: Staff can mark slots unavailable regardless of calendar
- Test sync delay: Update Google Calendar, verify booking system updates within 1 minute

**Detection:**
- Monitor for appointments created then quickly rescheduled (sign of conflict)
- Staff feedback: "I was already booked at that time"

**References:**
- [How Calendar Syncing Prevents Double Bookings](https://cal.com/blog/how-calendar-syncing-prevents-double-bookings-and-scheduling-conflicts)

---

### Pitfall 8: Settings Changes Don't Apply Immediately
**What goes wrong:** Salon owner changes business hours to 9 AM - 5 PM, but booking widget still shows 8 AM - 6 PM for hours. Cache not invalidated.

**Why it happens:**
- Settings cached aggressively (cache invalidation forgotten)
- Frontend caches API responses (SWR, React Query) without revalidation
- Multiple API instances with in-memory caches (updated on one instance, stale on others)
- Database update succeeds but cache update fails silently

**Consequences:**
- Customers book outside business hours (appointments invalid)
- Pricing changes not reflected (charge wrong amount)
- Staff availability changes ignored (double-bookings)
- Owner loses trust in settings interface

**Prevention:**
- Invalidate cache on ALL settings updates
- Use cache versioning (cache key includes settings version)
- For multi-instance deploys: Use shared cache (Redis) instead of in-memory
- Show "Updated successfully" message only AFTER cache invalidation confirms
- Add settings version number to API responses (frontend detects stale cache)

**Detection:**
- Manual test: Update setting, immediately refresh booking widget, verify change appears
- Monitor cache hit/miss rates (sudden spike in misses after settings update is good)
- Log cache invalidation events

**References:**
- [Common Salon Booking Software Mistakes And How To Fix Them](https://wellyx.com/blog/salon-booking-software-mistakes-and-how-to-fix-them/)

---

### Pitfall 9: Incorrect API Credentials in Production
**What goes wrong:** API keys for Stripe, Twilio, SendGrid are sandbox/test keys instead of production keys. Payments fail, emails/SMS don't send.

**Why it happens:**
- Forgot to switch from test keys to live keys before launch
- Environment variables not updated in production deployment
- Copy-paste error (test key accidentally deployed)
- KYC documentation incomplete (live API access blocked)

**Consequences:**
- Payments fail in production (revenue loss)
- Customers cannot book (API errors)
- No email/SMS sent (communication breakdown)
- Urgent hotfix required (stressful deployment)

**Prevention:**
- Use different environment variable names for test vs live (`STRIPE_TEST_KEY`, `STRIPE_LIVE_KEY`)
- Validate credentials on startup (make test API call, fail fast if invalid)
- Deployment checklist: Verify all API keys before going live
- Monitor for "invalid credentials" errors in production logs

**Detection:**
- Startup validation: API calls Stripe with credentials, logs error if test mode in production
- Monitor for API error spikes (sudden increase in 401/403 responses)

**References:**
- [Payment Gateway Integration Guide 2026](https://neontri.com/blog/payment-gateway-integration/)

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major issues.

### Pitfall 10: Phone Number Formatting Inconsistencies
**What goes wrong:** Customer enters phone as "(555) 123-4567", system stores as "5551234567", SMS sends to "+1 555 123 4567". Formatting inconsistencies cause lookups to fail.

**Why it happens:**
- No normalization on phone number input
- Different parts of codebase format differently
- International numbers not handled (country code assumptions)

**Consequences:**
- Duplicate client records (same person, different phone formats)
- SMS delivery failures (invalid format for Twilio)
- Search/lookup fails (searching "(555) 123-4567" doesn't match "5551234567")

**Prevention:**
- Use `libphonenumber-js` for validation and normalization
- Store in E.164 format (`+15551234567`)
- Display formatted version in UI, but always normalize for storage/comparison

**Detection:**
- Test with various formats: (555) 123-4567, 555-123-4567, 5551234567, +1 555 123 4567
- Monitor SMS delivery failures by country code

**References:**
- [Twilio Phone Number Formatting](https://www.twilio.com/en-us/use-cases/appointment-reminders)

---

### Pitfall 11: Business Hours Edge Cases (Overnight, Holidays)
**What goes wrong:** Salon open 9 AM - 11 PM shows as closed after midnight. Holiday hours override not implemented. Weekend hours different but not configurable.

**Why it happens:**
- Business hours model assumes single daily window (can't represent 11 PM - 2 AM)
- No holiday exception support
- Day-of-week hours hardcoded

**Consequences:**
- Cannot book during valid business hours
- Owner manually blocks/unblocks holidays (tedious)
- Weekend-only salons cannot configure properly

**Prevention:**
- Support multiple hour ranges per day
- Add holiday exceptions table (date, open/closed, hours override)
- Configurable hours per day of week

**Detection:**
- Test booking at 12:30 AM for 24-hour salon
- Test holiday booking with override configured

**References:**
- [Common Salon Booking Software Mistakes](https://wellyx.com/blog/salon-booking-software-mistakes-and-how-to-fix-them/)

---

### Pitfall 12: No-Show Handling Missing
**What goes wrong:** Customer books appointment, never shows up, slot wasted. No mechanism to track no-shows or charge no-show fees.

**Why it happens:**
- Feature not implemented (complex policies vary by business)
- Requires payment authorization upfront (holds not implemented)
- Unclear when appointment should be marked "no-show" vs "late"

**Consequences:**
- Revenue loss from wasted slots
- Staff idle time
- No accountability for repeat no-shows

**Prevention:**
- Add appointment status: scheduled, confirmed, completed, no-show, cancelled
- Implement no-show fee policy (charge card on file if no-show)
- Track no-show rate per client (flag repeat offenders)

**Detection:**
- Owner reports: "Customer didn't show up, how do I mark this?"

---

## Phase-Specific Warnings

Warnings for areas that will need deeper research during specific roadmap phases.

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| **Online Booking Stabilization** | Race conditions on concurrent bookings | Transaction-wrapped booking, pessimistic locking |
| **Staff Management** | Multi-location permission boundaries unclear | Explicit role + location permission tests |
| **Multi-Location Support** | Tenant isolation gaps in location queries | Audit all queries for salonId + locationId filters |
| **Payment Processing** | Webhook idempotency and retry logic | Stripe webhook testing with replay simulation |
| **Appointment Reminders** | Email deliverability (spam filters) | SPF/DKIM/DMARC configuration before launch |
| **SMS Notifications** | Phone number formatting edge cases | Use libphonenumber-js for validation |
| **Settings Management** | Cache invalidation across multiple instances | Redis-backed cache or cache versioning |
| **Dashboard Accuracy** | N+1 queries on appointment aggregations | Prisma includes or raw SQL aggregations |

---

## Confidence Assessment

| Area | Confidence | Source |
|------|-----------|---------|
| Double-booking race conditions | HIGH | Multiple technical articles on booking system concurrency |
| Multi-tenant data leakage | HIGH | Recent 2026 article on RLS failures, security best practices |
| Timezone handling | HIGH | Official documentation and community troubleshooting guides |
| Payment webhooks | MEDIUM | Stripe documentation patterns, general integration guides |
| Email/SMS delivery | MEDIUM | Service provider best practices, 2026 deliverability updates |
| Buffer time calculations | MEDIUM | Booking system documentation on availability logic |
| Calendar sync conflicts | MEDIUM | Calendar service documentation |
| Settings cache invalidation | LOW | Inferred from general caching patterns, not spa-specific |

---

## Sources

**Multi-Tenant Security:**
- [Multi-Tenant Leakage: When Row-Level Security Fails in SaaS](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c)
- [Multi-Tenant Security: Definition, Risks and Best Practices](https://qrvey.com/blog/multi-tenant-security/)

**Booking System Concurrency:**
- [How to Solve Race Conditions in a Booking System](https://hackernoon.com/how-to-solve-race-conditions-in-a-booking-system)
- [Concurrency Conundrum in Booking Systems](https://medium.com/@abhishekranjandev/concurrency-conundrum-in-booking-systems-2e53dc717e8c)
- [Handling the Double-Booking Problem in Databases](https://adamdjellouli.com/articles/databases_notes/07_concurrency_control/04_double_booking_problem)

**Timezone Issues:**
- [Double Booking Scheduling Issues: How to Handle & Avoid It](https://www.housecallpro.com/resources/how-to-avoid-double-booking/)
- [Time zone error in Bookings meetings](https://support.lesley.edu/support/solutions/articles/4000215566-time-zone-discrepancies-with-microsoft-bookings)
- [How Calendar Syncing Prevents Double Bookings and Scheduling Conflicts](https://cal.com/blog/how-calendar-syncing-prevents-double-bookings-and-scheduling-conflicts)

**Payment Integration:**
- [Payment Gateway Integration Guide 2026](https://neontri.com/blog/payment-gateway-integration/)
- [Common Payment Gateway Integration Mistakes to Avoid](https://www.enkash.com/resources/blog/common-payment-gateway-integration-mistakes-to-avoid)
- [Online Payment Failure: Reasons & How to Handle Them in 2026](https://razorpay.com/blog/online-payments-failure-reasons/)

**Email/SMS Delivery:**
- [Email vs SMS Appointment Reminders: Which Works Better?](https://smartsmssolutions.com/resources/blog/business/appointment-reminder-email-examples)
- [Why Do Emails Get Bounced in 2026?](https://www.mailwarm.com/blog/emails-bounced-delivery-rules)

**Booking Availability:**
- [Appointment availability troubleshooting](https://help.acuityscheduling.com/hc/en-us/articles/16676931784333-Appointment-availability-troubleshooting)
- [Common Salon Booking Software Mistakes And How To Fix Them](https://wellyx.com/blog/salon-booking-software-mistakes-and-how-to-fix-them/)

**Calendar Scheduling:**
- [Scheduling conflicts: meaning, causes & prevention](https://koalendar.com/blog/scheduling-conflicts-meaning-causes-prevention)
- [Scheduling Conflicts: Top Causes & Proven Ways to Prevent Them](https://www.booking-wp-plugin.com/blog/scheduling-conflicts-top-causes-proven-ways-to-prevent-them/)
