# Phase 4: Payment Processing - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Stripe payment integration that works reliably with proper webhook handling. Payments occur at booking time as deposits. Webhook handling ensures payment status stays synchronized. Error recovery handles declines gracefully. Refunds process correctly for canceled appointments.

</domain>

<decisions>
## Implementation Decisions

### Payment Flow UX
- Deposit required at booking (not full payment, not pay-at-service)
- Client pays deposit to hold slot, balance collected at service time
- Client can retry payment on same page if card is declined
- Booking and payment should be atomic — slot not reserved until payment succeeds

### Webhook Handling
- Real-time updates: calendar/appointment view updates immediately when payment status changes
- In-app notification when payments fail (no email alert for this phase)
- Idempotent webhook processing — duplicate events must not cause issues

### Error Recovery
- Client can retry immediately on same page after decline
- Clear, helpful decline messages without being alarming
- Owner should have ability to manually accept booking and collect payment in person (flexibility)

### Refund Behavior
- Refunds supported for canceled appointments
- When spa cancels (their fault), automatic full refund
- Client cancellation policy: Claude to implement reasonable time-based policy

### Claude's Discretion
- Deposit percentage configuration approach (fixed percentage recommended)
- Exact decline message wording
- Retry attempt limits (prevent abuse while being user-friendly)
- Payment history detail level on appointments
- Webhook failure handling strategy (ensure no payments lost)
- Refund permission roles (financial actions require appropriate authority)
- Partial refund support
- Confirmation display format (receipt-style vs simple)

</decisions>

<specifics>
## Specific Ideas

- Deposit model chosen over full-payment-at-booking — reduces friction while protecting the spa from no-shows
- Real-time updates important for owner experience — they shouldn't have to refresh to see payment changes
- Flexibility for owner to override when payment fails — not every situation fits the automated flow

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-payment-processing*
*Context gathered: 2026-01-25*
