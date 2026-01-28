# Phase 13: Security Hardening - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Application validates critical environment variables at startup and enforces secure file access patterns. This covers:
- Startup validation for ENCRYPTION_KEY and JWT_SECRET
- File DELETE ownership verification
- Password complexity requirements

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User delegated all implementation decisions to Claude. Apply standard security patterns:

**Startup validation:**
- Fail fast with clear error message identifying missing variable
- Exit code 1 for validation failure
- Log to stderr (not structured logger — app hasn't started yet)
- Check in production mode only (allow empty in development for flexibility)

**File ownership verification:**
- Database lookup to verify file belongs to requesting user's salon
- Return 404 (not 403) to avoid leaking file existence
- Log suspicious attempts at warn level with userId and attempted fileId

**Password policy:**
- Minimum 8 characters
- At least one uppercase, one lowercase, one number, one special character
- Real-time validation feedback in UI (character requirements checklist)
- Apply to: registration, password change, password reset
- Clear error message listing unmet requirements

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

Security patterns follow OWASP guidelines and defense-in-depth principles established in v1.0.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-security-hardening*
*Context gathered: 2026-01-28*
