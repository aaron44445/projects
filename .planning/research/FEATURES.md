# Feature Landscape: Spa/Salon SaaS

**Domain:** Multi-tenant spa/salon management software
**Researched:** 2026-01-25
**Updated:** 2026-01-28 (v1.1 Audit Remediation)
**Confidence:** HIGH

## Executive Summary

Spa and salon owners need software that **just works** - reliability trumps features. This research identifies what owners actually need daily, what behaviors define "working" for each feature, and what breaks their trust in software.

**Key Finding:** The gap between having features and having working features is massive in this space. 78% of clients now prefer online booking, but software that fails randomly (double bookings, settings not saving, no-shows not prevented) causes owners to revert to pen and paper. Trust is lost instantly and rarely regained.

**Critical Insight for Peacase Stabilization:** Focus on the 5 critical daily workflows - everything else is secondary. If booking fails once, owners lose trust. If reminders don't send, clients don't show up and owners lose revenue. If staff schedules are wrong, the business can't operate.

---

# PART 2: v1.1 Audit Remediation - Expected Outcomes

**Research Focus:** What does "done" look like after audit remediation?
**Researched:** 2026-01-28
**Confidence:** HIGH (based on official standards, industry benchmarks)

This section defines the expected behaviors and measurable success criteria for each audit remediation category.

---

## Remediation Table Stakes

Minimum acceptable standards after fixes. Failure to meet these = remediation incomplete.

### 1. Security Remediation

| Fix | Success Criteria | Measurement | Industry Standard |
|-----|-----------------|-------------|-------------------|
| Environment variables for secrets | Zero secrets in codebase; all sensitive values from env | `grep -r` for patterns like `password=`, API keys returns empty | OWASP Top 10 |
| CSRF protection with Redis store | All state-changing requests validate CSRF token; tokens persist across server restarts | Token survives API restart; cross-origin POST blocked | OWASP CSRF Prevention |
| File upload validation | MIME type + extension + size validated; ownership verified on access | Upload malformed files -> rejected; access others' files -> 403 | OWASP File Upload |
| Password complexity | Min 8 chars, uppercase, lowercase, number required | Weak passwords rejected with clear feedback | NIST 800-63B |
| Session security | HttpOnly, Secure, SameSite cookies; reasonable expiry | Cannot read token via JS; token rotates on privilege change | OWASP Session Mgmt |

**User/Developer Experience After Fix:**
- Developers can deploy without worrying about leaked secrets
- Users cannot execute CSRF attacks against other users
- Uploaded files cannot escape their tenant sandbox
- Weak passwords are rejected with helpful guidance
- Sessions cannot be hijacked via XSS

**Sources:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) (HIGH confidence)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) (HIGH confidence)

### 2. Performance Remediation

| Fix | Success Criteria | Measurement | Industry Standard |
|-----|-----------------|-------------|-------------------|
| Async email/SMS sending | Notification requests return immediately; sending happens in background | API response time < 200ms regardless of email count | BullMQ/Redis queue pattern |
| N+1 query elimination | No endpoints trigger > 5 DB queries for list views | Query logging shows single query with includes | Prisma best practices |
| Appropriate caching | Static assets cached; API responses cached where safe | Cache-Control headers present; repeat requests faster | HTTP caching RFC |
| Response compression | gzip/brotli for text responses | Response headers show encoding; payload size reduced 60-80% | Express compression |
| Lighthouse Performance >= 90 | Dashboard, booking widget pass performance audit | Lighthouse CI in mobile emulation | Google Web Vitals |

**Measurable Thresholds (from Google):**
- **LCP (Largest Contentful Paint):** < 2.5s mobile, < 1.2s desktop
- **FCP (First Contentful Paint):** < 1.8s
- **TBT (Total Blocking Time):** < 200ms
- **API Response Time:** P95 < 500ms for list endpoints
- **Background Job Processing:** Email queued -> sent within 30s

**User/Developer Experience After Fix:**
- Dashboard loads instantly, no "loading..." spinners for basic data
- Booking widget is snappy even on mobile networks
- Sending 50 notifications doesn't freeze the API
- Developers see clear query counts in logs

**Sources:**
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) (HIGH confidence)
- [BullMQ Documentation](https://bullmq.io/) (HIGH confidence)
- [Prisma Query Optimization](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance) (HIGH confidence)

### 3. SEO Remediation

| Fix | Success Criteria | Measurement | Industry Standard |
|-----|-----------------|-------------|-------------------|
| sitemap.xml | Auto-generated, includes all public pages, < 50k URLs per file | `/sitemap.xml` returns valid XML; GSC accepts it | Next.js sitemap.ts |
| robots.txt | Allows indexing of public pages; blocks admin/API routes | `/robots.txt` returns correct directives | Google Webmaster Guidelines |
| Canonical URLs | Every page has `<link rel="canonical">`; no duplicate content | Canonical matches actual URL; no self-referencing issues | SEO best practices |
| JSON-LD structured data | LocalBusiness/BeautySalon schema on public pages | Rich Results Test passes; shows business info | Schema.org / Google |
| Meta tags | Unique title/description per page; OG tags for sharing | SEO audit tools report no missing tags | Max 60 chars title, 160 chars description |

**Measurable Thresholds:**
- **Lighthouse SEO Score:** >= 90
- **Google Search Console:** Zero indexing errors after submission
- **Rich Results:** Business info appears in search previews (test with Rich Results Test)
- **Mobile-First:** All pages pass mobile usability test

**User/Developer Experience After Fix:**
- Business appears in Google with rich snippets (hours, location, ratings)
- Shared booking links show proper previews on social media
- No "duplicate content" warnings in Search Console
- New pages automatically added to sitemap

**Sources:**
- [Next.js Metadata Files: robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) (HIGH confidence)
- [Google LocalBusiness Structured Data](https://developers.google.com/search/docs/appearance/structured-data/local-business) (HIGH confidence)
- [Schema.org BeautySalon](https://schema.org/BeautySalon) (HIGH confidence)

### 4. Accessibility Remediation

| Fix | Success Criteria | Measurement | Industry Standard |
|-----|-----------------|-------------|-------------------|
| Modal focus traps | Focus stays inside modal; returns to trigger on close | Tab cycles within modal; Escape closes; focus returns | WCAG 2.4.3, WAI-ARIA APG |
| ARIA labels | All interactive elements have accessible names | axe-core reports zero "missing accessible name" | WCAG 4.1.2 |
| Skip navigation | "Skip to main content" link is first focusable element | Tab once from page load -> skip link focused | WCAG 2.4.1 |
| Color contrast | 4.5:1 for normal text; 3:1 for large text | Lighthouse accessibility audit passes | WCAG 1.4.3 |
| Keyboard navigation | All features usable without mouse | Tab through entire app; all actions possible | WCAG 2.1.1 |
| Form error identification | Errors announced, linked to fields | Invalid field + error message + focus management | WCAG 3.3.1 |

**Measurable Thresholds (Legal Requirement):**
- **WCAG 2.1 Level AA:** Full compliance (required by April 24, 2026 per ADA Title II)
- **Lighthouse Accessibility Score:** >= 90
- **axe-core automated scan:** Zero critical/serious issues
- **Keyboard-only navigation:** All user flows completable without mouse

**Critical WCAG 2.1 AA Requirements:**
| Criterion | Requirement | Threshold |
|-----------|-------------|-----------|
| 1.4.3 Contrast (Minimum) | Text contrast ratio | 4.5:1 normal, 3:1 large |
| 2.1.1 Keyboard | All functionality keyboard accessible | 100% of actions |
| 2.4.1 Bypass Blocks | Skip navigation mechanism | Present and functional |
| 2.4.7 Focus Visible | Focus indicator visible | All interactive elements |
| 3.3.1 Error Identification | Errors described in text | All form errors |
| 3.3.2 Labels or Instructions | Form fields have labels | All inputs labeled |

**User/Developer Experience After Fix:**
- Screen reader users can navigate the entire app
- Keyboard users aren't trapped in modals
- Low-vision users can read all text
- Form errors are clear and actionable

**Sources:**
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) (HIGH confidence)
- [W3C Dialog Modal Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (HIGH confidence)
- [WebAIM Skip Navigation Links](https://webaim.org/techniques/skipnav/) (HIGH confidence)
- [ADA Title II Web Accessibility Rule](https://www.ada.gov/resources/web-rule-first-steps/) (HIGH confidence)

### 5. Code Quality Remediation

| Fix | Success Criteria | Measurement | Industry Standard |
|-----|-----------------|-------------|-------------------|
| TypeScript strict mode | `noImplicitAny: true` in tsconfig; zero `any` usage | `grep -r ": any"` returns zero in type positions | TypeScript best practices |
| No implicit any | All parameters and returns typed | TypeScript compiles without warnings | Microsoft guidance |
| DRY violations fixed | No duplicate logic > 10 lines; shared utilities extracted | Code review; jscpd duplicate detection | Clean Code principles |
| Consistent error handling | All API errors return standard format; all thrown errors caught | No unhandled promise rejections; consistent error shape | Express error handling |
| ESLint clean | Zero errors; warnings addressed or justified | `npm run lint` exits 0 | Team lint rules |

**Measurable Thresholds:**
- **TypeScript Errors:** 0
- **ESLint Errors:** 0
- **Test Coverage:** >= 70% for critical paths
- **Cyclomatic Complexity:** < 10 per function
- **Duplicate Code:** < 3% (detected by tools like jscpd)

**TypeScript Strict Mode Checklist:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**User/Developer Experience After Fix:**
- Developers get type errors at compile time, not runtime
- Code is predictable - same patterns everywhere
- New developers can understand the codebase quickly
- Refactoring is safe because types catch mistakes

**Sources:**
- [TypeScript TSConfig Reference](https://www.typescriptlang.org/tsconfig/) (HIGH confidence)
- [TypeScript Strict Mode Guide](https://betterstack.com/community/guides/scaling-nodejs/typescript-strict-option/) (MEDIUM confidence)

### 6. UI/UX Remediation

| Fix | Success Criteria | Measurement | Industry Standard |
|-----|-----------------|-------------|-------------------|
| Modal standardization | All modals use same component; consistent close behavior | Visual audit; component usage grep | shadcn/ui Dialog |
| Button consistency | Primary/secondary/destructive variants; consistent sizing | All buttons use shared component | Design system |
| Status color system | Consistent colors for success/warning/error/info | Color tokens defined; no one-off colors | Semantic tokens |
| Empty states | All list views have meaningful empty states with CTAs | Navigate to empty data -> helpful message shown | UX best practices |
| Loading states | Skeleton loaders or spinners for all async content | No content flashing; smooth transitions | Avoid CLS |
| Error states | All failures show user-friendly messages with recovery actions | Trigger errors -> actionable feedback | Error UX patterns |

**Design Token Structure:**
```
Primitive tokens -> Semantic tokens -> Component tokens

Example hierarchy:
- gray-500 (primitive)
- color-text-secondary (semantic)
- button-secondary-text (component)
```

**Measurable Thresholds:**
- **Design Token Coverage:** 100% of colors/spacing/typography in tokens
- **Component Reuse:** < 5 one-off styled components
- **Empty State Coverage:** 100% of list views
- **Layout Shift:** CLS < 0.1

**User/Developer Experience After Fix:**
- App looks professional and consistent
- Users know what to do when things go wrong
- Empty states guide users to add their first item
- Loading states prevent confusion about app status

**Sources:**
- [Design Tokens Guide](https://www.contentful.com/blog/design-token-system/) (MEDIUM confidence)
- [Tailwind Design Token Patterns](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) (MEDIUM confidence)

---

## Remediation Differentiators

Above-average implementation that demonstrates quality commitment.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Real User Monitoring (RUM) | Track actual user performance, not just lab scores | Medium | Core Web Vitals field data |
| Automated a11y testing in CI | Catch regressions before deployment | Low | axe-core in test suite |
| JSON-LD for services/staff | Rich snippets showing services, pricing, staff | Medium | Service schema markup |
| Progressive enhancement | App works without JS for core viewing | High | Server components |
| Error tracking integration | Sentry/similar for production error monitoring | Low | Auto-capture with context |
| Performance budgets | CI fails if bundle size or LCP regresses | Low | Lighthouse CI thresholds |
| WCAG 2.2 compliance | Exceed minimum; include focus-visible, target size | Medium | Level AAA where practical |
| Automated visual regression | Catch unintended UI changes | Medium | Chromatic/Percy/Playwright |

---

## Remediation Anti-Features

Things to explicitly NOT do during remediation. Common mistakes that cause regressions.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Over-caching API responses | Stale data causes user confusion; hard to debug | Cache static assets only; use stale-while-revalidate for dynamic |
| Blocking main thread with sync operations | Freezes UI; terrible mobile experience | Always async; use web workers for heavy computation |
| Overly aggressive TypeScript types | `never` and complex generics hurt DX; slow compilation | Pragmatic typing; simple is better than clever |
| Modal-within-modal patterns | Accessibility nightmare; confusing UX | Single modal with multi-step content |
| ARIA overuse | Wrong ARIA is worse than no ARIA | Use semantic HTML first; ARIA only when needed |
| Hidden skip links that never show | Useless to sighted keyboard users | Show on focus with CSS |
| Generic error messages | "Something went wrong" is useless | Specific, actionable: "Email already exists. Try logging in." |
| Loading spinners everywhere | Feels slow even when fast | Skeleton loaders; optimistic updates |
| Fixing accessibility with overlays | Third-party overlay tools often break more than fix | Native implementation with proper ARIA |
| Hardcoded color values | Makes theming impossible; inconsistent appearance | Design tokens for all colors |
| Premature optimization | Complex caching/queuing for things that aren't slow | Measure first; optimize what matters |
| Breaking changes for quality | Users lose data or workflows during "improvements" | Backward compatible; migration paths |

---

## Edge Cases to Consider

### Security
- File uploads: What if user uploads executable disguised as image?
- CSRF: What about API-only clients (mobile apps)? Use token-based auth instead
- Sessions: What happens on clock skew between servers?
- Passwords: Handle Unicode properly in complexity checks

### Performance
- Large tenants: What if a salon has 10,000 appointments?
- Slow networks: 3G mobile in rural areas
- Cold starts: First request after deployment
- Memory pressure: Multiple concurrent background jobs

### SEO
- Dynamic routes: `/booking/:salonSlug` needs proper indexing
- Internationalization: If/when multi-language, hreflang tags
- Soft 404s: Pages that return 200 but show "not found"
- Pagination: Proper rel="next/prev" or single-page with lazy load

### Accessibility
- Screen reader + magnification combo users
- Voice control users (Dragon, Voice Control)
- Users with cognitive disabilities needing simple language
- Temporary disabilities (broken arm, bright sunlight)

### Code Quality
- Legacy code migration: Don't break what works
- Third-party types: Some libraries have poor/missing types
- Runtime vs compile time: Types don't prevent all bugs
- Team adoption: Strict mode is useless if everyone uses `// @ts-ignore`

### UI/UX
- Responsive design: Test at 320px, 768px, 1024px, 1440px
- Reduced motion users: `prefers-reduced-motion` support
- High contrast mode: Windows High Contrast Mode support
- Print styles: Appointment confirmations should print well

---

## Remediation Priority Order

Based on dependencies and impact:

1. **Security** - Foundation for everything else; legal/compliance risk
2. **Performance (async notifications)** - Currently blocking API; immediate UX impact
3. **Accessibility** - Legal deadline (April 2026); affects all features
4. **Code Quality** - Makes other fixes safer and maintainable
5. **SEO** - Additive; doesn't block other work
6. **UI/UX** - Polish layer; best done after functional fixes

**Rationale:**
- Security fixes prevent exploits that could affect all users
- Async notifications unblock the API performance bottleneck
- Accessibility has hard legal deadline and touches every component
- TypeScript strictness catches bugs in subsequent fixes
- SEO and UI/UX are additive improvements with lower risk

---

## Success Verification Checklist

After all fixes, these should pass:

### Automated Checks
```bash
# Performance
npx lighthouse --preset=desktop --only-categories=performance,seo,accessibility [URL]

# Security
npm audit --audit-level=moderate
grep -r "ENCRYPTION_KEY\|API_KEY\|PASSWORD" --include="*.ts" src/ # Should be empty

# Code Quality
npm run typecheck # Zero errors
npm run lint # Zero errors
npm run test # All pass

# Accessibility
npm run test:a11y # axe-core integration tests
```

### Manual Verification
- [ ] Keyboard navigate through booking flow start to finish
- [ ] Screen reader (NVDA/VoiceOver) announces all form labels
- [ ] Mobile Lighthouse scores all >= 90
- [ ] Google Search Console shows zero errors
- [ ] Load test with 50 concurrent bookings - no timeouts

---

## Authoritative Sources

### Official Standards
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) - W3C (HIGH confidence)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - OWASP Foundation (HIGH confidence)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) (HIGH confidence)
- [Google LocalBusiness Structured Data](https://developers.google.com/search/docs/appearance/structured-data/local-business) (HIGH confidence)
- [W3C Dialog Modal Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) (HIGH confidence)

### Industry Benchmarks
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) - Chrome DevRel (HIGH confidence)
- [DebugBear Lighthouse Metrics Guide](https://www.debugbear.com/docs/metrics/lighthouse-performance) (MEDIUM confidence)

### Implementation Guidance
- [Next.js SEO with Sitemap/Robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) - Vercel (HIGH confidence)
- [WebAIM Skip Navigation Links](https://webaim.org/techniques/skipnav/) (HIGH confidence)
- [BullMQ Background Jobs](https://bullmq.io/) (HIGH confidence)
- [Prisma Query Optimization](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance) (HIGH confidence)

### Regulatory
- [ADA Title II Web Accessibility Final Rule](https://www.ada.gov/resources/web-rule-first-steps/) - US DOJ (HIGH confidence)
- April 24, 2026 deadline for WCAG 2.1 AA compliance (entities >= 50k population)

### TypeScript
- [TypeScript TSConfig Reference](https://www.typescriptlang.org/tsconfig/) - Microsoft (HIGH confidence)
- [TypeScript Strict Mode Guide](https://betterstack.com/community/guides/scaling-nodejs/typescript-strict-option/) (MEDIUM confidence)

### Design Systems
- [Design Tokens Guide](https://www.contentful.com/blog/design-token-system/) - Contentful (MEDIUM confidence)
- [Tailwind Design Token Patterns](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) (MEDIUM confidence)

---

# PART 1: Original Spa/Salon Domain Research (v1.0)

*The following sections contain the original domain research from v1.0 milestone, preserved for reference.*

---

## Daily Workflows: What Owners Do Every Day

### Morning Routine (First 30 Minutes)

Owners arrive **at least 1 hour before opening** to prepare. Software must support:

1. **Check today's schedule**
   - **Working looks like:** Calendar loads instantly, shows all appointments with client names, services, staff, times
   - **Broken looks like:** Slow load, missing appointments, wrong times, appointments shown on wrong staff
   - **Trust break:** If appointment doesn't appear but client shows up (or vice versa)

2. **Review new online bookings overnight**
   - **Working looks like:** Overnight bookings visible immediately, client details complete, staff assigned correctly
   - **Broken looks like:** Bookings missing, partial data, no staff assigned, double bookings
   - **Trust break:** Client books online but owner doesn't see it - client shows up and slot is taken

3. **Check staff availability/time-off**
   - **Working looks like:** Today's staffing clear at a glance, time-off requests flagged
   - **Broken looks like:** Staff marked available but requested day off, schedule doesn't reflect approved changes
   - **Trust break:** Owner schedules client with staff who called out sick

4. **Prepare spaces/equipment**
   - **Working looks like:** Know what services are booked, what equipment to prepare
   - **Broken looks like:** Service details missing or wrong
   - **Trust break:** Wrong equipment prepared, delays client experience

### During Operating Hours

5. **Accept walk-ins and phone bookings**
   - **Working looks like:** Calendar shows real-time availability, can book instantly, no conflicts
   - **Broken looks like:** Calendar out of sync, shows available slot that's already booked
   - **Trust break:** Book walk-in, then discover slot was taken online 5 minutes ago

6. **Handle client check-in**
   - **Working looks like:** Find client quickly, see appointment details, confirm service
   - **Broken looks like:** Client not found, appointment missing, wrong service listed
   - **Trust break:** Client says "I booked online" but nothing in system

7. **Process payments**
   - **Working looks like:** Charge processes instantly, receipt generated, payment recorded to appointment
   - **Broken looks like:** Payment fails mysteriously, duplicate charges, no receipt, payment not linked to appointment
   - **Trust break:** Client charged twice, or payment succeeds but shows unpaid in system

8. **Manage client rescheduling/cancellations**
   - **Working looks like:** Cancel/reschedule updates calendar immediately, client notified, slot opens for booking
   - **Broken looks like:** Change doesn't reflect in calendar, client not notified, slot remains blocked
   - **Trust break:** Cancel appointment but slot doesn't free up, lose rebooking opportunity

### End of Day

9. **Review day's revenue**
   - **Working looks like:** All payments accounted for, tips recorded, total matches reality
   - **Broken looks like:** Missing payments, wrong totals, tips not recorded
   - **Trust break:** Cash drawer doesn't match system totals

10. **Check tomorrow's schedule**
    - **Working looks like:** Tomorrow fully loaded, can see staffing needs, preparation requirements
    - **Broken looks like:** Schedule incomplete, missing appointments, wrong staff assignments
    - **Trust break:** Unprepared for tomorrow's services

### Weekly/Monthly (Recurring)

11. **Staff payroll/commissions**
    - **Working looks like:** Accurate service counts, correct commission calculations, tip totals right
    - **Broken looks like:** Missing services, wrong percentages, tips not included
    - **Trust break:** Staff disputes earnings because numbers are wrong

12. **Review no-show patterns**
    - **Working looks like:** See which clients no-showed, how many reminders sent
    - **Broken looks like:** No-show data missing, reminder logs don't exist
    - **Trust break:** Can't tell if no-show was client fault or reminder not sent

---

## Table Stakes Features

Features clients EXPECT. Missing these = product feels incomplete. Broken = owners leave.

| Feature | Why Expected | What "Working" Looks Like | What "Broken" Looks Like | Complexity |
|---------|--------------|---------------------------|-------------------------|------------|
| **Online Booking (24/7)** | 78% of clients prefer online, 30% book outside business hours | Client books at 11pm Sunday, appears in Monday morning schedule, correct staff/time/service, no double booking | Booking succeeds but doesn't show up, wrong staff assigned, double books slot, requires login | MEDIUM |
| **Automated Reminders** | Reduces no-shows by 70%, owners expect 98% delivery rate | Reminder sent 24h before automatically, SMS delivered, client confirms, log shows delivery | Reminder not sent, wrong time/date in message, fails silently without error log | MEDIUM |
| **Calendar/Scheduling** | Core of business operations, checked 50+ times/day | Real-time sync, drag-drop works, no double bookings, shows staff availability correctly | Slow to load, changes don't save, allows double bookings, doesn't prevent scheduling during time-off | HIGH |
| **Client Database/CRM** | Personalization critical (97% of clients expect it), track client history | Instant search, shows visit history, notes from previous visits, preferences saved | Client profiles incomplete, notes don't save, can't find clients quickly, duplicate profiles | LOW |
| **Payment Processing** | Must work every time, no exceptions | Card charges successfully, receipt generated instantly, payment linked to appointment automatically | Random failures, no error messages, duplicate charges, payments not recorded | HIGH |
| **Staff Management** | Multi-staff salons (90% of market) need staff assignment | Assign staff to services, set availability, track who did what | Staff can't be assigned, availability doesn't affect booking, can't tell who did service | MEDIUM |
| **Service Menu** | Define what's offered, pricing, duration | Services show in booking widget, prices accurate, durations block correct time | Services missing from widget, wrong prices shown, duration doesn't match booking time | LOW |
| **No-Show Prevention** | 5-15% no-show rate costs thousands/month | Require deposit for high-value services, waitlist auto-fills cancellations, reminders sent reliably | Deposits not enforced, cancellations don't free slots, no waitlist | MEDIUM |
| **Multi-Location Support** | Growing businesses add locations, must centralize | Client can book any location, services sync or customize per location, centralized reporting | Each location operates separately, can't see cross-location data, client must re-register per location | HIGH |
| **Business Hours Management** | Prevents booking outside operating hours | Set hours per location, online booking respects hours, shows "closed" correctly | Allows booking when closed, hours don't apply to widget, saves but doesn't enforce | LOW |

**MVP Priority (stabilization):**
1. Calendar/Scheduling - most critical, highest complexity, most trust-breaking if broken
2. Online Booking - revenue driver, high client expectation
3. Payment Processing - zero tolerance for errors
4. Automated Reminders - prevents no-shows (direct revenue impact)
5. Client Database - needed for personalization
6. Staff Management - multi-staff operations requirement
7. Service Menu - foundation for bookings
8. No-Show Prevention - protects revenue
9. Multi-Location - growing businesses need this
10. Business Hours - basic expectation

---

## Differentiators

Features that set product apart. Not expected, but highly valued when present.

| Feature | Value Proposition | What "Working" Looks Like | Complexity |
|---------|-------------------|---------------------------|------------|
| **Smart Waitlist Auto-Fill** | Scans calendar every 5 minutes, auto-texts waitlist clients when slot opens | Cancellation happens -> waitlist client texted within 5 min -> client confirms -> slot filled | MEDIUM |
| **Pre-Booking at Checkout** | Clients who book next visit before leaving = 30-40% higher retention | Prompt to book next appointment during checkout, one-click scheduling | LOW |
| **Precision Scheduling** | Shows "best" time slots first based on staff availability, minimizes gaps | Client sees optimal times first, staff schedule stays compact, fewer gaps | MEDIUM |
| **Formula/Client Notes** | Track client formulas, preferences, allergies for personalization | Notes from last visit auto-show at check-in, searchable, staff can add quickly | LOW |
| **Automated Payroll** | Calculate commissions/tips automatically, save hours/month | End of pay period -> system calculates all commissions -> export to payroll | HIGH |
| **Real-time Inventory Tracking** | Know when products running low, never run out mid-service | Service uses product -> inventory decrements -> alert at reorder point | MEDIUM |
| **Client Self-Rescheduling** | Clients reschedule online without calling, saves front desk time | Client clicks reschedule link -> chooses new time -> calendar updates -> both notified | MEDIUM |
| **Marketing Automation** | Re-engagement for clients who haven't booked in X days | Auto-email clients 60 days after last visit with booking link | MEDIUM |
| **Loyalty/Membership Programs** | Recurring revenue, increases retention 10-20% | Client buys package -> services deduct automatically -> auto-renew option | HIGH |
| **Review Management** | Collect reviews automatically post-appointment | Appointment completes -> review request sent -> responses tracked | LOW |

**Post-Stabilization Priorities:**
- Smart Waitlist (high value, medium complexity)
- Pre-Booking Prompt (retention driver, low complexity)
- Client Self-Rescheduling (reduces admin burden)
- Formula/Client Notes (already partially built)

---

## Anti-Features

Features to explicitly NOT build (or build differently). Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Complex Multi-Step Booking Flow** | 65% of Gen Z abandon if too complex, users expect 1-page booking | Single-page booking: service -> staff -> time -> done. No login required. |
| **Forced User Registration for Booking** | Password-free booking is now standard, friction kills conversions | Allow guest booking with just name/phone/email. Account optional. |
| **Separate POS System** | Juggling systems = data silos, owners won't use multiple tools | Integrate payment into same system as booking/calendar. |
| **Overcomplicated Pricing Tiers** | Hidden fees for add-ons like SMS reminders breaks trust | Transparent pricing, core features included, clear upgrade path. |
| **Generic Marketing Templates** | Spa/salon clients expect personalized communication | Use client history to personalize (last service, preferred staff, etc.). |
| **Staff Portal as Afterthought** | Poor staff UX = they won't use it, revert to text messages | Mobile-first staff view, dead simple (clock in, view schedule, add notes). |
| **Too Many Customization Options** | "Jack of all trades, master of none" - complexity without usability | Opinionated defaults that work for 80% of salons, customize only what matters. |
| **Desktop-Only Design** | 30%+ of salon owners manage from phone, mobile is critical | Mobile-responsive everywhere, touch-friendly, fast on slow connections. |
| **Fake Scarcity ("only 2 slots left!")** | Users see through it, damages trust | Show real availability, let quality create urgency. |
| **Locking Data Behind Export Fees** | Owners need their data, charging for exports is hostile | Free CSV export anytime, encourage trust over lock-in. |

---

## Feature Dependencies

Understanding what must work before other features can function.

```
FOUNDATION LAYER (must work first):
├─ Authentication/Multi-tenancy -> Everything depends on this
├─ Business/Location Setup -> Required for scheduling
└─ Service Menu -> Required for bookings

CORE OPERATIONS:
├─ Staff Management -> Required for scheduling
├─ Client Database -> Required for appointments
├─ Calendar/Scheduling -> Core daily workflow
│   ├─ Requires: Services, Staff, Locations
│   └─ Enables: Online Booking, Reminders, Payments
│
├─ Online Booking Widget -> Revenue driver
│   ├─ Requires: Calendar, Services, Staff Availability
│   └─ Enables: Client Self-Service, Reduced Admin
│
└─ Payment Processing -> Revenue collection
    ├─ Requires: Appointments, Clients
    └─ Enables: Commission Calculation

OPERATIONAL EXCELLENCE:
├─ Automated Reminders -> Reduces no-shows
│   ├─ Requires: Appointments, Client Contact Info, SMS/Email Integration
│   └─ Critical for: Revenue Protection
│
├─ No-Show Prevention (Deposits) -> Revenue protection
│   ├─ Requires: Payment Processing, Online Booking
│   └─ Enables: Confident Scheduling
│
└─ Staff Scheduling/Availability -> Prevents booking errors
    ├─ Requires: Staff Management, Locations
    └─ Enables: Accurate Online Booking

GROWTH FEATURES:
├─ Multi-Location -> Scale operations
│   ├─ Requires: All core features working
│   └─ Enables: Enterprise growth
│
├─ Marketing/Loyalty -> Retention
│   ├─ Requires: Client Database, Email/SMS
│   └─ Enables: Revenue growth
│
└─ Advanced Reporting -> Business intelligence
    ├─ Requires: Appointments, Payments, Services
    └─ Enables: Data-driven decisions
```

---

## Sources

### Industry Research
- [9 Best Salon Software 2026: The Ultimate Guide](https://thesalonbusiness.com/best-salon-software/)
- [5 Best Spa Booking Software in 2026](https://connecteam.com/best-spa-booking-software/)
- [Best Spa and Salon Management Software for 2026](https://www.saasworthy.com/list/spa-and-salon-management-software)

### Pain Points and Trust Issues
- [The 4 Biggest Software Pains for Salon and Spa Staff](https://zenoti.com/blogs/the-4-biggest-software-pains-for-salon-and-spa-staff)
- [Stop the Chaos: Why SpaSphere Simplifies Spa Management](https://www.aestheticsunique.com/why-spa-owners-are-tired-of-juggling-systems-and-how-you-can-stop-the-chaos/)
- [Beware of Fake Salon and Spa Software Reviews](https://pairedplus.com/beware-of-fake-salon-and-spa-software-reviews-choose-trustworthy-family-owned-solutions-like-paired-plus-in-2025/)

### Daily Workflows
- [Morning Rituals of Successful Salon Owners](https://getvish.com/morning-rituals-of-salon-owners/)
- [20 Tasks For Your Salon Opening And Closing Checklist](https://salonbizsoftware.com/blog/salon-opening-and-closing-checklist/)
- [A Usual Day of a Salon or Spa Owner](https://www.emly.co/articles/a-day-in-the-life-of-a-salon-owner)

### Feature Requirements
- [10 Must-Have Salon Software Features for 2026](https://www.barbnow.com/blog/10-must-have-salon-software-features-for-2026)
- [7 Best Salon Booking Software Solutions For 2026](https://www.salonbookingsystem.com/salon-booking-system-blog/salon-booking-software/)
- [Features to Look For in Spa Booking Software](https://www.newspressnow.com/stacker-money/2026/01/23/features-to-look-for-in-spa-booking-software/)

### Client Retention and No-Shows
- [The #1 Way to Cut Salon No-Shows by Up to 70%](https://shortcutssoftware.com/the-1-way-to-cut-salon-no-shows-by-up-to-70/)
- [Reserve Appointment Guide: Your Essential 2026 Handbook](https://www.salonbookingsystem.com/salon-booking-system-blog/reserve-appointment/)
- [6 Effective Client Retention Strategies for Medical Spas in 2025](https://www.zenoti.com/thecheckin/client-retention-strategies-for-med-spa-owner)

### Payment and Deposits
- [How to Set Up Your Salon Deposit Policy](https://glossgenius.com/blog/salon-deposit-policy)
- [Complete Guide to Payment Methods in a Salon in 2025](https://zolmi.com/payment-methods-in-a-salon)

### Reminders and Communication
- [45 Free Appointment Reminder Text Templates to Reduce No-Shows](https://www.textmymainnumber.com/blog/45-free-appointment-reminder-text-message-templates-to-reduce-no-shows)
- [Best Practices for SMS Marketing in 2023](https://americanmedspa.org/blog/best-practices-for-sms-marketing-in-2023)
- [Top 10 Spa And Hair Appointment Reminder Templates](https://www.greminders.com/articles/top-10-spa-and-hair-appointment-reminder-templates-for-your-customers/)

### Multi-Location Management
- [Salon & Spa Multi-location Management](https://www.miosalon.com/features/manage-multi-location)
- [Multi-location | Mangomint Salon & Spa Software](https://www.mangomint.com/features/multi-location/)
- [Spa & Salon Multi-Center Management | Zenoti](https://www.zenoti.com/product/multi-center-management)

### Staff Scheduling
- [14 Best Salon Scheduling Apps in 2026](https://www.joinhomebase.com/blog/best-salon-scheduling-app)
- [Salon Staff Schedules That Work](https://sparkprosalon.com/salon-staff-schedules-that-work/)
- [15 Ways To Optimize Salon Scheduling](https://www.omysalon.com/blogs/post/15-ways-to-optimize-salon-scheduling-to-make-your-business-order)
