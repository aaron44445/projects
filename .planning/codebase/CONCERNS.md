# Codebase Concerns

**Analysis Date:** 2026-01-25

## Tech Debt

**Route File Size - Monolithic API Endpoints:**
- Issue: Several API route files exceed 1500+ lines (staffPortal.ts: 1623, public.ts: 1136, gdpr.ts: 1026), combining multiple logical concerns in single files
- Files: `apps/api/src/routes/staffPortal.ts`, `apps/api/src/routes/public.ts`, `apps/api/src/routes/gdpr.ts`, `apps/api/src/routes/reports.ts` (868 lines), `apps/api/src/routes/auth.ts` (861 lines)
- Impact: Difficult to navigate, test, and maintain. Hard to locate specific functionality. Increases merge conflict risk
- Fix approach: Decompose into feature-based service modules. Extract core business logic from routes into `services/` directory. Keep routes thin (validation + response handling only). Example: `staffPortal.ts` should split into `services/staffAuth.ts`, `services/staffSchedule.ts`, `services/staffTimeOff.ts`

**Type-loosening with `any` Types:**
- Issue: Multiple instances of `any` types bypass TypeScript safety in critical paths
- Files: `apps/api/src/routes/clientPortal.ts:101` (statusFilter), `apps/api/src/routes/appointments.ts:26,34` (filters), `apps/api/src/routes/clients.ts:19,127` (where clauses), `apps/api/src/routes/gdpr.ts:341,967` (where/update data), `apps/api/src/middleware/rateLimit.ts:31` (rate limit options)
- Impact: Loses IDE autocomplete, allows invalid data structures, catches bugs at runtime instead of compile time
- Fix approach: Replace `any` with proper Zod schemas or TypeScript interfaces. For Prisma where clauses, use type-safe query builders. Example: `const statusFilter: typeof Appointment.status[] = []` instead of `any`

**Error Swallowing in Services:**
- Issue: Email and SMS services return false on error but don't guarantee retry or alerting
- Files: `apps/api/src/services/email.ts:61-64` (catches all errors, logs, returns false), `apps/api/src/services/sms.ts:78-81` (similar pattern)
- Impact: Silent failures in critical communications (appointment confirmations, password resets). Users don't know if messages reached them
- Fix approach: Implement exponential backoff retry logic. Store failed sends in database queue. Add Sentry error reporting for infrastructure issues. Consider idempotency keys to prevent duplicates

**Encryption Error Handling:**
- Issue: `safeEncrypt()` and `safeDecrypt()` in `apps/api/src/lib/encryption.ts` silently return null on failure, losing information about why encryption failed
- Files: `apps/api/src/lib/encryption.ts:95-120`
- Impact: Cannot distinguish between "string was null" vs "encryption key missing" vs "corrupted data", making debugging impossible
- Fix approach: Log specific error reasons. Consider throwing on encryption key issues vs graceful null on data issues. Add metrics tracking failed encrypt/decrypt operations

**Unvalidated Rate Limit Multiplier:**
- Issue: `DEV_MULTIPLIER` in rate limit middleware is applied automatically and inflates limits massively in development (100x multiplier)
- Files: `apps/api/src/middleware/rateLimit.ts:11,79,93,108,123,138,152`
- Impact: Development-only configuration that silently changes behavior between environments. Easy to forget rate limits protect against abuse
- Fix approach: Make DEV_MULTIPLIER configurable via explicit env var. Document what each rate limit protects against. Consider lower multiplier (5-10x) for more realistic testing

## Known Bugs

**Missing Tenant Isolation on Location Filtering:**
- Symptoms: Location filters in `appointments.ts` and `public.ts` use complex OR logic that might expose unassigned appointments across salons
- Files: `apps/api/src/routes/appointments.ts:74-91`, `apps/api/src/routes/public.ts:varies`
- Trigger: Create multi-location salon, assign manager to location A, query with location=null parameter
- Workaround: Ensure all queries include `salonId` filter in WHERE clause alongside location filters
- Severity: Critical - potential data leak across tenants

**Authentication Token Refresh Race Condition:**
- Symptoms: Multiple simultaneous requests with expiring tokens could trigger multiple token refresh attempts
- Files: `apps/web/src/lib/api.ts:83-101` (token refresh deduplication logic)
- Trigger: Rapid API calls when access token is within 5-minute expiry window
- Workaround: Deduplication logic in place but untested with high concurrency
- Severity: High - could cause auth state inconsistency

**Email Service No Fallback on SMTP2GO Failure:**
- Symptoms: If SMTP2GO API is down, sendEmail() returns false and never attempts SendGrid fallback
- Files: `apps/api/src/services/email.ts:21-65` (SMTP2GO) vs `apps/api/src/services/email.ts:68-90` (SendGrid fallback)
- Trigger: SMTP2GO API outage while SendGrid is configured
- Workaround: Configure SendGrid as primary instead of fallback, or use middleware to retry with different provider
- Severity: Medium - critical emails don't send during SMTP2GO outage

**Phone Number Formatting Edge Cases:**
- Symptoms: `formatPhoneNumber()` in `apps/api/src/services/sms.ts:30-63` may incorrectly format numbers with unusual country codes
- Files: `apps/api/src/services/sms.ts:30-63`
- Trigger: User enters international number outside common formats (e.g., +886 Taiwan: 12 digits, +1-345 Cayman: 10 digits)
- Workaround: Validate phone numbers with libphonenumber-js before sending SMS
- Severity: Low - SMS fails silently for edge case numbers, doesn't break the app

## Security Considerations

**JWT Signature Verification Only on Backend:**
- Risk: Frontend decodes JWT payload without verification in `decodeJwtPayload()` function. While safe (not used for authorization), sends wrong message about token trust
- Files: `apps/web/src/lib/api.ts:21-30`
- Current mitigation: Only used to check expiry locally, all actual authorization happens server-side with verified token
- Recommendations: Rename function to `decodeJwtPayloadUnsafe()` to signal it's not for security decisions. Add comment explaining why frontend can safely decode (no secrets in payload)

**API Key Storage in Database:**
- Risk: SendGrid and Twilio API keys stored encrypted in database (`sendgrid_api_key_encrypted`, `twilio_account_sid_encrypted` in schema.prisma)
- Files: `packages/database/prisma/schema.prisma:50-58`, `apps/api/src/lib/encryption.ts` (encryption implementation)
- Current mitigation: Keys are encrypted at rest with AES-256-GCM. Accessed only by API backend
- Recommendations: Consider moving to vault service (HashiCorp Vault, AWS Secrets Manager) for better key rotation and audit trails. Current approach limits deployment flexibility

**GDPR Deletion Grace Period Enforcement:**
- Risk: 30-day grace period before deletion is enforced by database query timing, not by explicit status field. If cron job fails, deletion never happens
- Files: `apps/api/src/routes/gdpr.ts:10-11,150-200` (grace period constant and deletion scheduling logic)
- Current mitigation: GDPR deletion records stored with `scheduledDeletion` timestamp. Cron job checks this timestamp
- Recommendations: Add explicit `deletionScheduledAt` status field to track state. Implement retry mechanism for failed cron executions. Add monitoring/alerting for deletion backlog

**Client Portal Data Access:**
- Risk: Client portal endpoints allow authenticated clients to access their own data, but permission boundaries not systematically tested
- Files: `apps/api/src/routes/clientPortal.ts`, `apps/api/src/middleware/clientAuth.ts`
- Current mitigation: clientAuth middleware verifies client is authenticated. Routes check clientId matches authenticated user
- Recommendations: Add permission tests for each endpoint verifying clients can't access other clients' data. Test appointment filters with data from different salons

## Performance Bottlenecks

**N+1 Query Problem in Appointment Listing:**
- Problem: `public.ts` booking endpoint performs `findMany()` on appointments without include relations, potentially followed by individual service/staff lookups
- Files: `apps/api/src/routes/public.ts:527,743,894,944` (findFirst calls for conflicts)
- Cause: Multiple sequential `findFirst()` calls in loops checking for appointment conflicts instead of single query with aggregation
- Improvement path: Use Prisma aggregation or change algorithm to batch conflict checking. Pre-load staff/service/location data before appointment loop

**Unindexed Location Filtering:**
- Problem: Location-based queries in appointments endpoint use complex OR logic without ensuring database indexes on locationId
- Files: `apps/api/src/routes/appointments.ts:74-91`
- Cause: Complex Prisma where clause may not optimize well across salon + location filtering
- Improvement path: Add compound index on (salonId, locationId). Monitor slow query logs. Consider caching location membership for managers

**Bulk SMS Sends Sequential:**
- Problem: `sendBulkSms()` sends messages one-by-one with await, not in parallel
- Files: `apps/api/src/services/sms.ts:84-97`
- Cause: Awaits each `sendSms()` call in loop instead of Promise.all()
- Improvement path: Use Promise.allSettled() to send in parallel while capturing errors individually. Add configurable concurrency limit (e.g., 10 parallel)

**Email Service Fetches on Every Request:**
- Problem: SendGrid module dynamically imported on every email send (not just initialization)
- Files: `apps/api/src/services/email.ts:74`
- Cause: `await import('@sendgrid/mail')` inside sendViaSendGrid() function
- Improvement path: Import at module top level if SendGrid is used. Use lazy loading pattern only if SendGrid is optional

**Cron Job Full Table Scan:**
- Problem: Appointment reminder cron scans entire appointments table for reminders to send, not filtered by date window
- Files: `apps/api/src/cron/appointmentReminders.ts`
- Cause: Relies on reminderLog table to track sent reminders, but no index on startTime for efficient windowing
- Improvement path: Add index on (startTime, salonId). Add timeframe filter to remind query to scan only upcoming appointments

## Fragile Areas

**Monolithic Appointment Validation in Public Booking:**
- Files: `apps/api/src/routes/public.ts` (850+ lines covering booking, availability, validation)
- Why fragile: Single endpoint validates service existence, staff availability, time conflicts, client data, and creates appointment. Heavy coupling between validation and creation
- Safe modification: Extract validation into service layer (`services/appointmentValidation.ts`). Return validation errors before any database writes. Add comprehensive unit tests for each validation step
- Test coverage: Booking path has tests but validation edge cases (weekend hours, location-specific availability) not isolated and testable

**Staff Schedule + Location Assignment Sync:**
- Files: `apps/api/src/routes/staff.ts` (577 lines), `packages/database/prisma/schema.prisma` (StaffLocation relation)
- Why fragile: Staff availability stored in StaffAvailability, location assignment in StaffLocation, but no transaction enforcing consistency. A staff member could be assigned to location but have no availability there
- Safe modification: Wrap staff creation/location assignment in database transaction. Add constraint validation: if staff assigned to location, must have availability for that location
- Test coverage: Missing integration test verifying staff + availability + location consistency

**Email Template String Injection Risk:**
- Files: `apps/api/src/routes/gdpr.ts:17-82` (gdprDeletionRequestEmail), similar patterns in other email templates
- Why fragile: Email templates use template literals with user-controlled data (client names, salon names) without escaping HTML entities. If malicious salon name is stored, HTML could be injected
- Safe modification: Use email template library with built-in escaping. Sanitize all user inputs in templates with `escapeHtml()` utility
- Test coverage: No tests for email template injection with special characters

**Multi-Location Permission Boundaries:**
- Files: `apps/api/src/middleware/permissions.ts` (permission checking logic), `apps/api/src/routes/appointments.ts` (location filtering)
- Why fragile: Manager location access determined by StaffLocation records. If records are deleted but user remains manager, permission resolution ambiguous
- Safe modification: Add explicit role+location permission check with fallback to role hierarchy. Test all CRUD operations with managers having no location access
- Test coverage: Limited tests for manager restrictions across multiple locations

## Scaling Limits

**Rate Limit Store - In-Memory Only:**
- Current capacity: Works for single-instance deployment. Loses state on restart
- Limit: Cannot scale horizontally. Two API instances = two independent rate limit counters. User can hammer endpoint twice as hard
- Scaling path: Migrate to Redis-based rate limiting (redis package + redis store for express-rate-limit). Enables multiple instances to share limits

**Email Queue - No Persistence:**
- Current capacity: Emails sent synchronously, none queued or retried
- Limit: One failed email blocks request. Mass email operations timeout. If sender crashes, pending emails lost
- Scaling path: Add job queue (Bull with Redis, or database-backed queue). Implement worker process to send async. Handle retries and dead letter queue

**Cron Jobs - Single Instance Only:**
- Current capacity: Appointment reminders, gift card expirations run on single API instance
- Limit: If instance restarts during cron execution, jobs may duplicate or be skipped. No distributed locking
- Scaling path: Use distributed cron system (node-cron with Redis lock, or separate cron service). Add job status tracking and recovery mechanism

**Database Connection Pool:**
- Current capacity: Prisma manages connection pool from `DATABASE_URL`
- Limit: Render hobby instance has limited DB connections (approx 20). High concurrency = connection exhausted, request queue timeout
- Scaling path: Move to production DB with larger connection pool. Add Prisma connection pooling optimization. Monitor active connections in production

**Media Upload Storage - Local Filesystem:**
- Current capacity: Uploads stored in local directory, works while on single server
- Limit: Cannot scale to multiple instances. Uploaded files not visible across instances
- Scaling path: Migrate to S3 or similar object storage. Remove local file cleanup logic

## Dependencies at Risk

**Express.js + Manual Middleware Stacking:**
- Risk: Hand-rolled auth middleware, rate limiting, error handling. Not using established Express frameworks (Fastify, Nest.js) with battle-tested patterns
- Impact: Security bugs in custom middleware (auth bypass, CORS misconfiguration). Manual header parsing error-prone
- Migration plan: If critical security issues arise, consider Nest.js for dependency injection, pipes, guards. For now, add comprehensive middleware tests

**Manual JWT Implementation:**
- Risk: Token generation, refresh, and verification done by hand in staffPortal.ts and auth.ts. Potential for clock skew issues, leaked secrets
- Impact: Subtle auth bugs (tokens valid after expiry, refresh tokens not invalidated)
- Migration plan: Use `jsonwebtoken` library (already used). Centralize token generation in single `tokenService.ts`. Add jwt.decode() verification checks

**Twilio Phone Number Formatting:**
- Risk: Custom `formatPhoneNumber()` function attempts to guess country codes. Doesn't use libphonenumber-js library
- Impact: SMS fails for non-standard numbers. No validation that formatted number is valid
- Migration plan: Add `libphonenumber-js` package. Replace custom formatting. Validate all input phone numbers on client creation

**Prisma Schema String Serialization:**
- Risk: Features stored as JSON strings in database (featuresEnabled, business_hours, notification_settings in schema.prisma). Not typed
- Impact: Easy to store invalid JSON, bugs at parse time, no type safety
- Migration plan: Create proper database tables for features/settings. Use enums for notification preferences instead of JSON strings

## Missing Critical Features

**Appointment Double-Booking Prevention - Not Transactional:**
- Problem: Availability checking and appointment creation are separate operations. Race condition allows overlapping appointments
- Blocks: Cannot guarantee appointment slots are held during booking. Concurrent bookings can overfill staff schedule
- Fix approach: Wrap in database transaction. Use SELECT...FOR UPDATE on availability window. Add integration test with parallel bookings

**Audit Logging:**
- Problem: No system tracking who changed what, when. Changes to pricing, staff access, client data not logged
- Blocks: Cannot investigate data loss or unauthorized changes. GDPR compliance issues
- Fix approach: Add audit_log table. Intercept Prisma operations and log mutations with user context. Add audit filtering and export to reports

**API Versioning Strategy:**
- Problem: Single `/api/v1/` path. No backwards compatibility for breaking changes. Upgrading frontend requires API to support both versions simultaneously
- Blocks: Cannot iterate on API design without breaking clients
- Fix approach: Implement request header-based versioning or separate /api/v2 paths. Document deprecation policy (6-month support window)

**Cascading Permission Revocation:**
- Problem: If salon admin revokes manager's location access, existing appointments for that manager at that location not reassigned
- Blocks: Orphaned appointments with invalid staff assignments
- Fix approach: Add cleanup job when location assignment deleted. Reassign appointments to available staff or mark for review

## Test Coverage Gaps

**Email Delivery - Not Tested:**
- What's not tested: Actual email sending via SMTP2GO/SendGrid. Only mocked in tests
- Files: `apps/api/src/__tests__/` (email tests mock sendEmail)
- Risk: Email content formatting bugs (links, HTML), attachment handling, header validation not caught until production
- Priority: Medium - manual testing in staging reveals issues quickly, but failure modes not well understood

**Multi-Location Permission Boundaries:**
- What's not tested: Manager at location A trying to access location B resources. Complex permission cascades across staff + locations
- Files: Missing tests in `apps/api/src/__tests__/`
- Risk: Permission bypass allowing manager access to unauthorized salon data
- Priority: High - security-critical path

**Concurrent Appointment Booking:**
- What's not tested: Two clients simultaneously booking same staff member for overlapping time
- Files: Missing integration test for race condition
- Risk: Double-booked appointments in production
- Priority: High - core feature reliability

**Payment Webhook Handling:**
- What's not tested: Stripe webhook signature verification. Webhook replay attacks. Out-of-order webhook processing
- Files: `apps/api/src/services/subscriptions.ts` (webhook handlers not shown, need verification)
- Risk: Payment state inconsistency from webhook manipulation
- Priority: High - security + financial impact

**GDPR Data Deletion:**
- What's not tested: Verify all personal data actually deleted (nested relations, encrypted fields). Grace period cancellation flow. Deletion logging
- Files: `apps/api/src/routes/gdpr.ts` (deletion routes)
- Risk: Regulatory non-compliance, data residency issues
- Priority: Critical - legal liability

**Client Portal Access Control:**
- What's not tested: Client trying to view other client appointments/notes. Cross-salon access attempts
- Files: `apps/api/src/routes/clientPortal.ts`, `apps/api/src/middleware/clientAuth.ts`
- Risk: Data leak between clients
- Priority: Critical - multi-tenant data isolation

---

*Concerns audit: 2026-01-25*
