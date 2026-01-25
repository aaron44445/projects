# Project Research Summary

**Project:** Peacase - Spa/Salon SaaS Stabilization
**Domain:** Multi-tenant booking and management system for spas/salons
**Researched:** 2026-01-25
**Confidence:** HIGH

## Executive Summary

Peacase is in the "feature-complete but unreliable" stage that kills SaaS businesses. The app has the right features (online booking, payments, reminders, calendar management) but they fail randomly in production, breaking owner trust instantly. Research shows spa/salon owners have zero tolerance for unreliability—if booking fails once, they revert to pen and paper. If reminders don't send, clients no-show and revenue is lost. If staff schedules are wrong, the business can't operate.

The recommended approach is systematic **audit-driven stabilization**, not more feature building. Follow data flows end-to-end (Appointment creation → storage → retrieval → display → modification → deletion), validating multi-tenant isolation at every layer. Use Playwright for critical user flows, Vitest + Supertest for API/integration testing, and structured logging to catch production issues. The developer can't manually QA like a spa owner, so automated testing that simulates real workflows is essential.

Critical risks center on multi-tenant data leakage (missing `salonId` filters exposing cross-business data), race conditions causing double-bookings, and silent failures in reminders/payments. Every one of these destroys trust permanently. The mitigation is: audit database queries for tenant isolation, wrap booking operations in transactions with locking, and monitor delivery confirmations for all communications. Test the broken features (SMS, email reminders, settings persistence, online booking reliability) before building anything new.

## Key Findings

### Recommended Stack

Testing and debugging tools for stabilization, not building new features. The developer doesn't own a spa and can't QA like a real user, so we need automated testing to simulate real workflows and catch bugs systematically.

**Core technologies:**
- **Playwright (^1.49.0)**: E2E testing with codegen to record real user workflows, native parallelization (15 workers), multi-browser coverage including Safari, API testing without browser overhead—critical for reproducing bugs systematically
- **Vitest (^3.0.0)**: Test runner 10-20x faster than Jest, native ESM support (Peacase uses ESM), built-in TypeScript—essential for fast debugging feedback loop
- **Supertest (^7.0.0)**: HTTP API testing for Express, chainable assertions, automatic server lifecycle—industry standard for testing API routes and authentication
- **Winston**: Structured production logging with tenant context—your eyes into what users experience when you can't manually QA
- **Prisma testing strategy**: prisma-mock for fast unit tests, real database for integration tests to verify tenant isolation actually works

**Critical version requirements:**
- Node.js inspector for remote production debugging (use cautiously)
- Stripe CLI for local webhook testing (`stripe trigger payment_intent.succeeded`)
- Twilio test credentials for SMS testing without charges (magic numbers like +15005550006)

### Expected Features

**Must have (table stakes):**
- **Online Booking (24/7)**: 78% of clients prefer online, 30% book outside business hours—broken = owners leave immediately
- **Calendar/Scheduling**: Checked 50+ times/day, core of operations—slow or allowing double-bookings breaks trust permanently
- **Payment Processing**: Must work every time with zero tolerance for errors—random failures or duplicate charges kill credibility
- **Automated Reminders**: Reduces no-shows by 70%, owners expect 98% delivery—silent failures cost thousands in lost revenue
- **Client Database/CRM**: 97% of clients expect personalization, need visit history and notes—incomplete profiles or missing data frustrates staff
- **Staff Management**: 90% of salons are multi-staff, need assignment and availability tracking—broken = can't operate business
- **Service Menu**: Foundation for bookings with pricing and duration—wrong prices or missing services in widget = lost bookings
- **No-Show Prevention**: 5-15% no-show rate costs thousands/month—need deposits and waitlist auto-fill

**Critical workflows that must work:**
1. **First online booking** (within 24h of setup)—if it fails, owner cancels during trial
2. **Busy morning rush** (Saturday 9am)—if calendar lags during chaos, owner writes on paper forever
3. **Payment processing** (client checkout)—embarrassment with client present destroys relationships
4. **No-show with reminder check**—if can't prove reminder sent, can't charge fee, lose trust in system
5. **Staff payroll dispute**—if numbers don't match manual count, staff doesn't trust software

**Should have (competitive):**
- Smart waitlist auto-fill (scans every 5 min, auto-texts clients when slot opens)
- Pre-booking at checkout (30-40% higher retention when clients book next visit before leaving)
- Client self-rescheduling online (reduces admin burden)
- Formula/client notes auto-showing at check-in

**Defer (v2+):**
- Marketing automation
- Loyalty/membership programs
- Advanced reporting beyond basics
- Inventory tracking

### Architecture Approach

Peacase follows standard multi-tenant SaaS patterns: Next.js 14 frontend (Vercel), Express.js API (Render), Prisma ORM with PostgreSQL (Supabase). The critical architectural requirement is **tenant isolation at every layer**—database queries must filter by `salonId`, API endpoints must verify ownership, frontend hooks must include auth headers. A single missing tenant filter creates data leakage.

**Major components:**
1. **Authentication Layer** (JWT with salonId)—foundation for all tenant isolation, if broken everything fails
2. **Database Schema** (Prisma with tenant columns)—every model needs `salonId` or foreign key chain, indexes on tenant columns, cascade deletes configured
3. **API Routes** (Express with middleware)—extract tenant from auth, filter all queries by `salonId`, validate ownership before mutations, handle errors without data leakage
4. **Frontend Data Flow** (Next.js with hooks)—include auth headers, show loading/error states, invalidate cache on mutations, handle 401 redirects
5. **Third-Party Integrations** (Stripe, Twilio, SendGrid)—webhook signature verification, idempotent processing, delivery confirmation monitoring

**Audit methodology:**
- Follow data flows end-to-end: Appointment → create → store → retrieve → display → update → delete
- Validate tenant isolation at each step (can Salon A access Salon B's data?)
- Test critical paths with Playwright: registration → onboarding → first appointment → payment
- Use multi-tenant isolation tests: create data for two salons, verify cross-tenant access returns 403/404

### Critical Pitfalls

1. **Multi-tenant data leakage via missing salonId filter**—One business sees another's confidential client data. Legal liability, complete platform trust destruction. EVERY database query must filter by `salonId`, use Prisma middleware to enforce, cache keys must include tenant prefix, automated testing with two test salons.

2. **Double-booking race conditions**—Two clients book same slot simultaneously because availability check and creation are separate operations. Staff double-booked, customer trust destroyed. Wrap in database transaction with `SELECT...FOR UPDATE` locking, test with 100 concurrent requests for same slot.

3. **Timezone mismatches cause wrong appointment times**—Customer books "2:00 PM" in their timezone, shows as "7:00 PM" on salon calendar. Customers arrive at wrong time, missed appointments. Store ALL times in UTC in database, attach timezone to business/location, force booking widget to display in business timezone, test DST transitions.

4. **Payment webhook processing failures**—Stripe webhook not processed (timeout, crash, duplicate). Customer charged but appointment unpaid, or double-charged. Verify webhook signature first, use event.id as idempotency key, wrap in transaction, handle out-of-order events, log all webhooks.

5. **Email/SMS reminder delivery failures**—Reminders never reach customers (spam filters, carrier blocks, expired credentials). No-shows increase, revenue lost. Configure SPF/DKIM/DMARC, use dedicated sending domain, validate phone numbers with libphonenumber-js, queue failed sends for retry, monitor delivery rates.

**Moderate pitfalls:**
- Buffer time not calculated (staff overbooked without cleanup time)
- Settings changes don't apply immediately (cache not invalidated)
- Calendar sync conflicts across systems (Google Calendar vs booking system)
- Incorrect API credentials in production (test keys instead of live keys)

**Minor pitfalls:**
- Phone number formatting inconsistencies
- Business hours edge cases (overnight, holidays)
- No-show handling missing

## Implications for Roadmap

Based on research, suggested phase structure for stabilization:

### Phase 1: Authentication & Multi-Tenant Isolation Audit
**Rationale:** Foundation must work first. If auth is broken, all tenant isolation fails. This is the highest-risk area and gates everything else.
**Delivers:** Verified authentication flow, confirmed tenant isolation at database/API/frontend layers, multi-tenant test suite
**Addresses:** Multi-tenant data leakage pitfall (Critical #1)
**What must work:**
- Registration creates Salon + User atomically
- Login tokens include correct salonId
- Token refresh maintains salonId
- Session persists across page refresh
- Two-salon test: Salon A cannot access Salon B data via any endpoint
- All database queries verified to include salonId filter

**Research flag:** Standard patterns, skip deep research. Use multi-tenant isolation testing framework.

### Phase 2: Core Data Flow Validation (Appointments, Clients, Services)
**Rationale:** These are the entities owners interact with 50+ times daily. Data flow bugs here break daily operations.
**Delivers:** End-to-end tests for appointment lifecycle, verified tenant filtering on all queries, structured logging for debugging
**Addresses:** Calendar/scheduling reliability (table stakes feature #1)
**What must work:**
- Create appointment → appears in calendar within 60 seconds
- Update appointment → reflects changes immediately
- Delete appointment → removes from list and frees slot
- Concurrent booking attempts → only one succeeds (no double-booking)
- Appointment queries filtered by salonId + locationId (multi-location)

**Research flag:** May need deeper research on race condition testing patterns.

### Phase 3: Online Booking Widget Stabilization
**Rationale:** Revenue driver and first impression for clients. 78% prefer online booking. If this fails once, owner loses trust.
**Delivers:** Reliable booking widget with availability verification, conflict detection, immediate confirmation
**Addresses:** Double-booking race conditions (Critical #2), first online booking critical moment
**What must work:**
- Widget loads in <3 seconds on mobile 4G
- Shows only available slots (respects business hours, staff availability, existing appointments)
- Creates appointment without double-booking (even with concurrent requests)
- Sends confirmation email/SMS immediately
- Handles errors gracefully with useful messages

**Research flag:** Need research on transaction isolation levels and locking strategies.

### Phase 4: Payment Processing Verification
**Rationale:** Zero tolerance for errors. Payment failures with clients present cause embarrassment and relationship damage.
**Delivers:** Verified Stripe integration, webhook idempotency, error handling, payment-appointment linkage
**Addresses:** Payment webhook failures (Critical #4), payment processing critical moment
**What must work:**
- Card charges successfully on first attempt
- Receipt generated immediately
- Payment linked to appointment automatically
- Webhook signature verification before processing
- Idempotent webhook handling (duplicate events don't double-charge)
- Clear error messages if card declined

**Research flag:** Need research on Stripe webhook best practices and testing with Stripe CLI.

### Phase 5: Reminder System Reliability (SMS + Email)
**Rationale:** Directly protects revenue (reduces no-shows by 70%). Silent failures cost thousands monthly. Owner must trust reminders sent.
**Delivers:** Verified Twilio/SendGrid integration, delivery confirmation logging, retry logic, owner alerts on failures
**Addresses:** Email/SMS delivery failures (Critical #5), no-show prevention
**What must work:**
- Reminder sends 24h before appointment automatically
- SMS delivery confirmed (99%+ for valid numbers)
- Email lands in inbox (not spam)
- Logs every reminder with timestamp and delivery status
- Alerts owner if reminder fails
- Phone numbers validated and normalized (libphonenumber-js)

**Research flag:** Need research on email deliverability (SPF/DKIM/DMARC configuration).

### Phase 6: Settings & Configuration Persistence
**Rationale:** Owners report settings don't apply. Cache invalidation failures cause bookings outside business hours.
**Delivers:** Verified settings persistence, cache invalidation, immediate application of changes
**Addresses:** Settings persistence (moderate pitfall), business hours edge cases
**What must work:**
- Business hours change → booking widget updates immediately
- Staff availability change → reflected in next booking
- Service pricing update → correct amount charged
- Multi-instance cache invalidation (Redis or versioning)
- Settings version number in API responses

**Research flag:** Standard caching patterns, skip deep research.

### Phase 7: Edge Cases & Error Scenarios
**Rationale:** With foundation stable, handle the unusual cases that cause frustration.
**Delivers:** Graceful error handling, timezone edge cases, buffer time calculations, concurrent update handling
**Addresses:** Timezone pitfall (Critical #3), buffer time calculation, calendar sync conflicts
**What must work:**
- Appointments at DST boundaries display correctly
- Buffer time between appointments enforced
- Concurrent appointment updates handled (last write wins with warning)
- Network failures show user-friendly errors
- Invalid state transitions blocked (cancel already-completed appointment)

**Research flag:** Need research on timezone handling libraries (luxon vs date-fns-tz).

### Phase Ordering Rationale

- **Auth first**: Foundation for all security. If this is broken, everything else fails. Gates all subsequent work.
- **Data flows second**: Core operations must work before testing integrations. Can't verify booking widget until appointment creation is reliable.
- **Booking widget third**: Depends on stable data flows. Revenue driver that creates appointments, so appointment CRUD must work first.
- **Payments fourth**: Depends on appointments existing. Can test payment-appointment linkage once appointments stable.
- **Reminders fifth**: Depends on appointments + clients existing. Tests notification delivery without affecting core operations.
- **Settings sixth**: Affects all other features, but lower risk than data corruption. Can audit after core flows verified.
- **Edge cases last**: Foundation working, now handle unusual scenarios. Can't test timezone edge cases until basic scheduling works.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Booking)**: Race condition testing, transaction isolation levels, locking strategies for concurrent bookings
- **Phase 4 (Payments)**: Stripe webhook testing patterns, idempotency strategies, webhook signature verification
- **Phase 5 (Reminders)**: Email deliverability configuration (SPF/DKIM/DMARC), Twilio best practices, delivery monitoring
- **Phase 7 (Edge Cases)**: Timezone handling library comparison, DST transition testing

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Auth)**: Multi-tenant isolation testing is well-documented, use established patterns
- **Phase 2 (Data Flows)**: Standard CRUD with tenant filtering, Playwright E2E testing patterns
- **Phase 6 (Settings)**: Standard cache invalidation patterns, Redis or versioning approaches documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official 2026 comparison articles, proven testing tools for this use case, ESM compatibility verified |
| Features | HIGH | Multiple spa/salon software reviews, owner pain points well-documented, daily workflow research solid |
| Architecture | HIGH | Multi-tenant SaaS patterns well-established, audit methodology from 2026 security best practices, data flow testing documented |
| Pitfalls | HIGH | Race conditions and multi-tenant leakage heavily documented with recent 2026 articles, timezone issues verified in multiple sources |

**Overall confidence:** HIGH

All four research areas have strong, recent (2025-2026) sources. Multi-tenant SaaS security is particularly well-researched due to recent high-profile data leakage incidents. Testing tools have official documentation and comparison studies. Spa/salon domain knowledge verified across business-focused sources (owner workflows) and technical sources (booking system patterns).

### Gaps to Address

**During implementation:**

1. **Peacase-specific bugs**: Research identifies general pitfalls, but specific bugs (SMS broken, settings not applying) need root cause analysis. Use data flow tracing methodology from ARCHITECTURE.md to follow broken features end-to-end.

2. **Production credential validation**: Research flags test vs live API keys, but need to verify Peacase has correct production credentials for Twilio, SendGrid, Stripe. Check on startup with validation calls.

3. **Current cache implementation**: Research recommends Redis for multi-instance caching, but need to verify if Peacase uses in-memory (resets on deploy) or shared cache. Affects settings invalidation strategy.

4. **Existing test coverage**: Research provides testing recommendations, but need to audit existing tests (if any) for gaps. May have partial coverage that can be expanded rather than starting from scratch.

5. **Time zone configuration**: Need to verify how Peacase currently stores appointment times (UTC vs naive datetime) and whether locations have timezone configured. Research assumes UTC storage, but implementation may differ.

**Validation checkpoints during stabilization:**

- **After Phase 1**: Run two-salon isolation test suite, verify zero cross-tenant data access
- **After Phase 3**: Load test booking widget with concurrent requests, measure double-booking rate (must be 0%)
- **After Phase 4**: Replay Stripe webhook events, verify idempotency (same event processed twice = same result)
- **After Phase 5**: Check SendGrid/Twilio delivery rates over 7 days, must be >90%
- **After Phase 7**: Test appointment creation at DST transition boundaries (spring forward, fall back)

## Sources

### Primary (HIGH confidence)

**Testing Stack:**
- [Cypress vs Playwright: I Ran 500 E2E Tests in Both](https://medium.com/lets-code-future/cypress-vs-playwright-i-ran-500-e2e-tests-in-both-heres-what-broke-2afc448470ee) (Medium, Jan 2026)
- [Playwright vs Cypress: The 2026 Enterprise Testing Guide](https://devin-rosario.medium.com/playwright-vs-cypress-the-2026-enterprise-testing-guide-ade8b56d3478) (Medium, Dec 2025)
- [Testing in 2026: Jest, React Testing Library, and Full Stack Testing Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies) (Nucamp)
- [The Ultimate Guide to Testing with Prisma](https://www.prisma.io/blog/testing-series-1-8eRB5p0Y8o) (Prisma Official)
- [Supertest: How to Test APIs Like a Pro](https://www.testim.io/blog/supertest-how-to-test-apis-like-a-pro/) (Testim)

**Spa/Salon Domain:**
- [9 Best Salon Software 2026: The Ultimate Guide](https://thesalonbusiness.com/best-salon-software/)
- [The 4 Biggest Software Pains for Salon and Spa Staff](https://zenoti.com/blogs/the-4-biggest-software-pains-for-salon-and-spa-staff)
- [Morning Rituals of Successful Salon Owners](https://getvish.com/morning-rituals-of-salon-owners/)
- [10 Must-Have Salon Software Features for 2026](https://www.barbnow.com/blog/10-must-have-salon-software-features-for-2026)
- [The #1 Way to Cut Salon No-Shows by Up to 70%](https://shortcutssoftware.com/the-1-way-to-cut-salon-no-shows-by-up-to-70/)

**Multi-Tenant Security:**
- [Multi-Tenant Leakage: When Row-Level Security Fails in SaaS](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c) (Medium, 2026)
- [Implementing Secure Multi-Tenancy in SaaS Applications](https://dzone.com/articles/secure-multi-tenancy-saas-developer-checklist) (DZone)
- [SaaS Security Audit Checklist & Best Practices](https://ardas-it.com/saas-security-audit-checklist-best-practices-and-principles) (Ardas IT)

**Critical Pitfalls:**
- [How to Solve Race Conditions in a Booking System](https://hackernoon.com/how-to-solve-race-conditions-in-a-booking-system) (HackerNoon)
- [Concurrency Conundrum in Booking Systems](https://medium.com/@abhishekranjandev/concurrency-conundrum-in-booking-systems-2e53dc717e8c) (Medium)
- [Best practices for testing Stripe webhook event processing](https://launchdarkly.com/blog/best-practices-for-testing-stripe-webhook-event-processing/) (LaunchDarkly)

### Secondary (MEDIUM confidence)

**Testing Methodologies:**
- [Data Flow Testing: A Comprehensive Guide](https://www.stickyminds.com/article/data-flow-testing-comprehensive-guide) (StickyMinds)
- [SaaS Testing Guide and Tools in 2025](https://bugbug.io/blog/software-testing/saas-testing-guide-and-tools/) (BugBug)
- [10 debugging techniques we rely on (2026)](https://wearebrain.com/blog/10-effective-debugging-techniques-for-developers/) (WeAreBrain)

**Third-Party Integration:**
- [Test your SMS Application](https://www.twilio.com/docs/messaging/tutorials/automate-testing) (Twilio Official)
- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks) (Stripe Official)
- [Why Do Emails Get Bounced in 2026?](https://www.mailwarm.com/blog/emails-bounced-delivery-rules) (MailWarm)

**Architecture Patterns:**
- [How to Audit SaaS: A Step-by-Step Guide](https://www.hubifi.com/blog/saas-audit-guide) (HubiFi)
- [Multitenancy Checklist on Azure](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/checklist) (Microsoft)

---

*Research completed: 2026-01-25*
*Ready for roadmap: yes*
