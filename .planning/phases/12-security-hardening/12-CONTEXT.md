# Phase 12: Security Hardening

## Goal

Complete AUTH-01 requirement by fixing all documented security gaps from Phase 9 findings.

## Gap Closure

From v1-MILESTONE-AUDIT-2.md tech_debt:

**CRITICAL (Blocking AUTH-01):**
1. C1: 14 Prisma update/delete queries missing salonId in WHERE clause
2. C2: Twilio SMS webhook missing signature validation
3. C3: Subscription webhook missing cross-tenant validation
4. C4: Invoice webhook without subscription verification
5. C5: Gift card webhook trusts user-provided salonId
6. C7: ownerNotifications routes filter by userId only

**HIGH (Additional hardening):**
- H4: Client portal dashboard missing salonId
- H5: Direct fetch calls bypassing API client (defer - not security critical)
- H6: Inconsistent token key names (defer - not security critical)

## Success Criteria

1. All Prisma update/delete queries include salonId in WHERE clause
2. Twilio SMS webhook validates signature using twilio.validateRequest()
3. Subscription webhooks verify salonId from metadata before updates
4. Invoice webhooks verify subscription ownership
5. Gift card webhooks don't trust user-provided salonId
6. ownerNotifications routes include salonId filter
7. AUTH-01 moves from PARTIAL to SATISFIED

## Requirements Addressed

- AUTH-01: Multi-tenant isolation (gap closure)

## Scope

**In scope:**
- Prisma query fixes (C1)
- Webhook security (C2, C3, C4, C5)
- Route filtering (C7)
- Client portal salonId (H4)

**Out of scope (defer to v1.1):**
- Direct fetch calls (H5) - works, just inconsistent
- Token key names (H6) - works, just inconsistent
- Cron reminders - works, just not logged
- Booking widget styling - works, just ugly
- Settings add-on persistence - frontend only
- Branding upload - needs investigation
- Multi-location CRUD UI - feature incomplete

## Reference Documents

- `.planning/phases/09-authentication-tenant-isolation/09-FINDINGS.md` - Detailed finding locations
- `.planning/v1-MILESTONE-AUDIT-2.md` - Gap summary

## Plans

- [ ] 12-01: Add salonId to all Prisma update/delete WHERE clauses
- [ ] 12-02: Add Twilio signature validation to SMS webhook
- [ ] 12-03: Fix webhook tenant validation (subscription, invoice, gift card)
- [ ] 12-04: Add salonId to ownerNotifications and clientPortal routes

---
*Created: 2026-01-28*
*Source: v1-MILESTONE-AUDIT-2.md tech debt*
