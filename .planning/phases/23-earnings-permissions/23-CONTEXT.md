# Phase 23: Earnings & Permissions - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can view transparent earnings breakdown (tips + commissions) for current and past pay periods, export to CSV, while owner controls what client information staff can see across the portal.

</domain>

<decisions>
## Implementation Decisions

### Earnings Display
- Summary card at top showing: total earnings, tips subtotal, commissions subtotal
- Service-level breakdown in table: date, service name, client (respecting visibility), price, tip, commission
- Current period = current calendar week (Sunday to Saturday) to match typical pay cycles
- Earnings page as new route in staff portal sidebar

### Pay Period Structure
- Weekly periods (Sunday-Saturday) as default — matches common spa payroll
- History shows past periods in reverse chronological order
- Period selector dropdown to switch between periods (last 12 weeks available)
- Each period shows date range and totals at a glance

### CSV Export
- Button on earnings page exports current selected period
- Columns: Date, Service, Client Name (if visible), Service Price, Tip, Commission, Total
- Filename: `earnings_{staffName}_{startDate}_to_{endDate}.csv`
- Respects client visibility settings (exports what staff can see)

### Client Visibility Controls
- New salon setting: `staffCanViewClientContact` (boolean, defaults to true per STATE.md)
- When true: staff sees full client name, phone, email on appointments
- When false: staff sees first name + last initial only (e.g., "Sarah M."), no phone/email
- Setting applies globally — no per-staff overrides (keeps it simple)
- Owner configures in Salon Settings > Staff Policies section

### Claude's Discretion
- Exact layout and spacing of earnings summary card
- Loading states and empty states for earnings
- How to handle periods with zero earnings (show empty or hide)
- Date formatting preferences

</decisions>

<specifics>
## Specific Ideas

- Earnings page should feel like a simple payroll summary, not an accounting dashboard
- Keep it read-only — staff views, doesn't edit
- CSV export for personal records or tax purposes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-earnings-permissions*
*Context gathered: 2026-01-29*
