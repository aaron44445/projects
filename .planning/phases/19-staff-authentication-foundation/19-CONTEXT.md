# Phase 19: Staff Authentication Foundation - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Secure staff login with portal-specific JWT tokens. Owners invite staff via magic link, staff set passwords and log in at /staff/login. Staff tokens cannot access owner routes. Staff can opt to stay logged in and log out from any page.

</domain>

<decisions>
## Implementation Decisions

### Magic Link Invite Flow
- Both auto-send on staff creation + manual resend from staff list
- Magic links expire after 72 hours (reasonable window for checking email)
- Link click lands on /staff/setup page with token in URL
- Invalid/expired links show clear message with "Request new invite" option
- Owner sees invite status on staff list (Invited/Active/Expired)

### Password Setup Experience
- Minimum 8 characters, at least one letter and one number
- Real-time validation feedback as user types
- Show/hide password toggle for verification
- Single password field with confirmation (not two fields)
- Success redirects to /staff/login with "Password set" toast

### Remember Device Behavior
- Checkbox on login: "Stay logged in on this device"
- Unchecked (default): 24-hour session, cleared on browser close
- Checked: 30-day refresh token, survives browser close
- No explicit "trusted devices" management UI (keep simple)
- Logout clears all tokens for that device

### Login Page Design
- Clean, minimal design at /staff/login
- Salon logo/name at top (from salon branding)
- Email and password fields
- "Remember me" checkbox
- "Forgot password?" link triggers password reset email
- Error states: "Invalid credentials" (generic, no user enumeration)
- Link to owner login: "Are you an owner? Log in here"

### Portal-Specific JWT Tokens
- Staff tokens include `role: "staff"` and `portalType: "staff"` claims
- Middleware rejects staff tokens on /api/owner/* routes with 401
- Staff tokens include staffId and salonId for multi-tenant filtering
- Token expiry: 15 minutes for access token, 30 days for refresh (when remembered)

### Logout Behavior
- Logout button visible in staff portal header/sidebar
- Clears access token, refresh token, and any local storage
- Redirects to /staff/login with "Logged out" confirmation
- Works from any page in portal

### Claude's Discretion
- Exact email template design for magic link invite
- Loading states during authentication
- Password strength meter implementation details
- Rate limiting specifics for login attempts

</decisions>

<specifics>
## Specific Ideas

- Staff portal is a separate experience from owner dashboard — different routes, different tokens
- Keep the login flow simple and familiar (email/password, not phone or social)
- Security over convenience: short access tokens, longer refresh only when opted in

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-staff-authentication-foundation*
*Context gathered: 2026-01-29*
