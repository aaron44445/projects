# Phase 17: Code Quality - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Codebase is strictly typed with no implicit any and uses structured logging. This phase fixes internal code quality issues — it does not add user-facing features. All changes must maintain existing behavior while improving type safety and observability.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User delegated all implementation choices. The following decisions reflect best practices for a production spa management API:

**Logging Format:**
- JSON structured logging for production (machine-parseable by log aggregators)
- Include context: salonId, userId, requestId, timestamp, level
- Standard levels: error, warn, info, debug
- Human-readable format option for development (pretty-printed)
- Use established library (pino or winston) rather than custom

**Filter Utility Design:**
- Simple utility function: `withSalonId(salonId: string)` returns Prisma where clause
- Explicit, not magical — developers see what's being filtered
- Composable with other filters via spread: `{ ...withSalonId(salonId), status: 'active' }`
- Located in shared utils, imported by all route files
- Type-safe: returns properly typed Prisma filter object

**TypeScript Strictness:**
- Enable `noImplicitAny: true` as required
- Fix all resulting type errors before enabling
- Do NOT enable additional strict flags in this phase (scope creep)
- Focus on explicit types for Prisma filters and API handlers

**Migration Approach:**
- Incremental, file-by-file
- Fix types in route files first (where Prisma filters live)
- Ensure build passes after each file
- Commit atomic changes per route or logical group
- Replace console.log calls during same pass through each file

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The requirements are clear and technical:
- CODE-01: Explicit types on Prisma filters
- CODE-02: noImplicitAny builds successfully
- CODE-03: Shared salonId utility
- CODE-04: Structured logger

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-code-quality*
*Context gathered: 2026-01-29*
