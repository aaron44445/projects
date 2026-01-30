# Phase 24: Technical Debt - Research

**Researched:** 2026-01-29
**Domain:** Code Quality, UI/UX Consistency, Accessibility, Architecture Patterns
**Confidence:** HIGH

## Summary

Phase 24 addresses four distinct technical debt categories that emerged during rapid feature development: booking widget input styling issues, low-contrast text patterns failing WCAG compliance, notification logging gaps for cron reminders, and scattered direct fetch calls bypassing the centralized API client.

The standard approach combines proven patterns already established in this codebase: Tailwind utility classes with accessible color tokens (text-text-primary, text-text-secondary, text-text-muted), the existing NotificationLog architecture, and the centralized ApiClient class in `/apps/web/src/lib/api.ts`. This is not about introducing new patterns but rather ensuring consistency with decisions already made.

All four debt items have clear, bounded scopes with minimal interdependencies. The booking widget is isolated to `/apps/web/src/app/embed/[slug]/page.tsx`. Contrast fixes target the 327 instances identified in planning docs. The cron reminder integration wraps existing notification logic. API client migration affects 19 files using direct fetch calls for internal endpoints.

**Primary recommendation:** Execute in priority order (widget styling → contrast fixes → notification logging → API consolidation), using batch updates where token changes can cascade globally, and verify each fix independently to prevent regression.

## Standard Stack

### Core

This phase uses **existing** tools and patterns already in the codebase:

| Tool/Pattern | Location | Purpose | Why Standard |
|--------------|----------|---------|--------------|
| Tailwind Config | `apps/web/tailwind.config.ts` | Color token definitions with accessible values | Already defines text-text-primary (#1A1A1A), text-text-secondary (#4A4A4A), text-text-muted (#7A7A7A) meeting WCAG 2.1 AA |
| ApiClient class | `apps/web/src/lib/api.ts` | Centralized HTTP client with auth, retry, error handling | Implements token refresh, rate limit retry, timeout handling, user-friendly errors |
| NotificationLog | `apps/api/src/services/notifications.ts` | Unified notification tracking with channel-specific status | Used by webhook-triggered notifications, tracks email/SMS delivery, supports SMS-to-email fallback |
| sendNotification() | `apps/api/src/services/notifications.ts` | Notification facade that logs to NotificationLog | Creates log entry, processes channels, updates status |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| WebAIM Contrast Checker | Online tool | Manual contrast verification | During planning to identify failing combinations |
| Browser DevTools | Native | Inspect computed styles and test focus states | Verify input styling changes in booking widget |
| Prisma Client | 6.x | Type-safe database access | Already used for NotificationLog schema |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind tokens (text-text-*) | Inline hex values (#7A7A7A) | Tokens enable global updates, semantic naming, design system consistency |
| ApiClient wrapper | Direct fetch with manual auth headers | Wrapper provides retry logic, token refresh, error normalization, timeout handling |
| NotificationLog table | Logs only (no database tracking) | Database tracking enables delivery analytics, audit trail, retry logic |
| Batch color token updates | Individual file edits | Token updates cascade globally, reduce manual search-replace, prevent missed instances |

**No installation required** - all patterns and tools already exist in the codebase.

## Architecture Patterns

### Pattern 1: Accessible Input Styling (Booking Widget)

**What:** Apply consistent input styling matching existing app patterns with proper contrast and focus states

**When to use:** All text inputs, textareas, selects in customer-facing booking widget

**Example:**
```tsx
// Source: Existing pattern in apps/web/src/app/embed/[slug]/page.tsx (DetailsStep component)
// Current implementation (lines 719-726):
<input
  type="text"
  value={booking.firstName}
  onChange={(e) => onChange('firstName', e.target.value)}
  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors text-gray-900 bg-white"
  placeholder="Jane"
  required
/>

// Pattern breakdown:
// - text-gray-900: Ensures dark text (#1A1A1A level) for maximum contrast on white
// - bg-white: Explicit white background (not inherited/transparent)
// - border-gray-200: Visible border in default state
// - focus:border-gray-400: Stronger border on focus (visible indicator)
// - focus:ring-0: Remove Tailwind forms plugin default ring
// - outline-none: Remove browser default outline (border handles focus)
```

**Key requirements:**
- Text must be charcoal-level dark (#1A1A1A or #2C2C2C) for 14:1 contrast on white
- Background must be explicitly white (not transparent)
- Focus state must change border color with visible 3:1+ contrast difference
- Avoid opacity-based text colors (e.g., `text-white/50` on light backgrounds)

### Pattern 2: WCAG-Compliant Text Color Tokens

**What:** Replace opacity-based color patterns (charcoal/50, /60, /70) with semantic tokens from Tailwind config

**When to use:** All body text, labels, captions, secondary text throughout the application

**Example:**
```tsx
// Source: apps/web/tailwind.config.ts lines 58-69
// Defined semantic tokens with guaranteed WCAG 2.1 AA compliance:
colors: {
  text: {
    primary: '#1A1A1A',    // ~14:1 contrast - headings, important text
    secondary: '#4A4A4A',  // ~9:1 contrast - secondary content, labels
    muted: '#7A7A7A',      // ~4.6:1 contrast - minimum for body text, captions
    inverse: '#FFFFFF',    // For dark backgrounds
  },
}

// BEFORE (fails WCAG):
<p className="text-charcoal/50">Muted caption text</p>
// Computed: rgba(44, 44, 44, 0.5) = #6E6E6E on white = 3.8:1 ❌

// AFTER (passes WCAG):
<p className="text-text-muted">Muted caption text</p>
// Computed: #7A7A7A on white = 4.6:1 ✅

// Pattern for migration:
// - charcoal/70 or charcoal → text-text-primary (headings, key info)
// - charcoal/60 → text-text-secondary (labels, descriptions)
// - charcoal/50 → text-text-muted (captions, hints, metadata)
```

**WCAG 2.1 AA requirements:**
- Normal text (<18pt): 4.5:1 minimum contrast ratio
- Large text (≥18pt or ≥14pt bold): 3.1 minimum contrast ratio
- UI components (borders, icons): 3:1 minimum contrast ratio

**Sources:**
- [Understanding Success Criterion 1.4.3: Contrast (Minimum) | W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM: Contrast and Color Accessibility](https://webaim.org/articles/contrast/)

### Pattern 3: NotificationLog Integration for Cron Reminders

**What:** Route cron-generated reminder notifications through existing sendNotification() service

**When to use:** All appointment reminders sent by cron jobs (not webhook-triggered notifications)

**Example:**
```typescript
// Source: apps/api/src/services/notifications.ts lines 46-95
// Existing sendNotification() interface:
export interface NotificationPayload {
  salonId: string;
  clientId: string;
  appointmentId?: string;
  type: 'booking_confirmation' | 'reminder_24h' | 'reminder_2h' | 'cancellation';
  channels: ('email' | 'sms')[];
  data: {
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    serviceName: string;
    staffName: string;
    dateTime: string;
    salonName: string;
    salonAddress: string;
  };
}

// BEFORE (cron reminders, no logging):
// apps/api/src/cron/appointmentReminders.ts lines 208-212
result.emailSent = await sendEmail({
  to: client.email,
  subject: emailSubject,
  html: emailHtml,
});

// AFTER (with NotificationLog tracking):
const notificationResult = await sendNotification({
  salonId: salon.id,
  clientId: client.id,
  appointmentId: appointment.id,
  type: 'reminder_24h', // or 'reminder_2h'
  channels: ['email'], // or ['sms'] or ['email', 'sms']
  data: {
    clientName: client.firstName,
    clientEmail: client.email,
    clientPhone: client.phone,
    serviceName: service.name,
    staffName: staffName,
    dateTime: dateTime,
    salonName: salon.name,
    salonAddress: address,
  },
});
result.emailSent = notificationResult.emailSent;
result.smsSent = notificationResult.smsSent;
```

**What gets logged:**
- NotificationLog table: salonId, clientId, appointmentId, type, channels (JSON), status
- Email-specific: emailStatus, emailSentAt, emailError
- SMS-specific: smsStatus, smsSentAt, smsError, twilioMessageSid
- Overall: status ('sent' or 'failed')

**No changes to:**
- Reminder scheduling logic (still uses ReminderLog for deduplication)
- Email/SMS templates
- Cron timing or window calculations
- Communication preference logic

### Pattern 4: Centralized API Client Usage

**What:** Replace direct fetch() calls with api.get/post/put/patch/delete from centralized client

**When to use:** All internal API calls to /api/v1/* endpoints (NOT external APIs like Stripe, SendGrid)

**Example:**
```typescript
// Source: apps/web/src/lib/api.ts lines 53-230
// Centralized ApiClient with built-in features:
class ApiClient {
  async get<T>(endpoint: string): Promise<ApiResponse<T>>
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>>
  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>>
  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>>
  async delete<T>(endpoint: string): Promise<ApiResponse<T>>
}

// BEFORE (direct fetch):
const res = await fetch(`${API_BASE}/api/v1/public/${slug}/salon`);
const data = await res.json();
if (data.success && data.data) {
  return { salon: data.data, errorType: 'none' };
}

// AFTER (using api client):
import { api } from '@/lib/api';

const response = await api.get<Salon>(`/public/${slug}/salon`);
if (response.success && response.data) {
  return { salon: response.data, errorType: 'none' };
}

// Benefits gained:
// ✅ Automatic access token injection (Authorization header)
// ✅ Proactive token refresh (before 5min expiry)
// ✅ 401 retry with refresh token
// ✅ 429 retry with exponential backoff (max 3 retries)
// ✅ 30s timeout protection
// ✅ User-friendly error messages (technical → friendly)
// ✅ Consistent ApiResponse<T> type
```

**Migration pattern for booking widget:**
```typescript
// File: apps/web/src/app/embed/[slug]/page.tsx
// Lines 204-222, 224-232, 234-244, 246-259, 261-278, 280-306

// BEFORE (8 fetch calls):
async function fetchSalon(slug: string): Promise<SalonFetchResult> {
  const res = await fetch(`${API_BASE}/api/v1/public/${slug}/salon`);
  const data = await res.json();
  // ... manual error handling
}

// AFTER (use api client, but handle public endpoints):
// Note: These are public endpoints, so they don't need auth tokens
// Still beneficial for timeout, retry, error normalization
async function fetchSalon(slug: string): Promise<SalonFetchResult> {
  try {
    const response = await api.get<Salon>(`/public/${slug}/salon`);
    if (response.success && response.data) {
      const bookingEnabled = response.data.bookingEnabled !== false;
      if (!bookingEnabled) {
        return { salon: null, errorType: 'booking_disabled' };
      }
      return { salon: response.data, errorType: 'none' };
    }
    return { salon: null, errorType: 'not_found' };
  } catch {
    return { salon: null, errorType: 'network_error' };
  }
}
```

**When NOT to migrate:**
- External API calls (Stripe, SendGrid, Twilio) - keep as-is
- Server-side API routes making outbound calls - keep as-is
- Next.js API routes (apps/api/*) - these ARE the API, not clients

**Sources:**
- [Building a Type-Safe API Client in TypeScript](https://dev.to/limacodes/building-a-type-safe-api-client-in-typescript-beyond-axios-vs-fetch-4a3i)
- [Fetch Wrapper for Next.js: Best Practices](https://dev.to/dmitrevnik/fetch-wrapper-for-nextjs-a-deep-dive-into-best-practices-53dh)

### Anti-Patterns to Avoid

- **Don't use opacity for text colors:** `text-charcoal/50` computes to different values depending on background, making WCAG compliance unpredictable. Use semantic tokens instead.
- **Don't skip NotificationLog for "it's just a cron job":** Delivery tracking is valuable regardless of trigger source. Owner wants to see if reminders actually sent.
- **Don't create new color tokens:** Use existing text-text-primary/secondary/muted. New tokens fragment the design system.
- **Don't wrap external API calls:** Stripe, SendGrid, etc. have their own SDKs with specialized error handling. Only wrap internal /api/v1/* calls.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token refresh logic | Manual fetch interceptor with token expiry checks | Existing ApiClient.ensureValidToken() | Already handles 5min lookahead refresh, deduplicates concurrent refreshes, manages refresh failure |
| Color contrast validation | Manual hex-to-luminance calculations | Semantic tokens + WebAIM Contrast Checker | Tokens pre-validated, eliminates calculation errors, enables global updates |
| Notification delivery tracking | Custom logging per email/SMS call | sendNotification() facade | Already creates NotificationLog, handles email/SMS/both, tracks per-channel status, supports SMS-to-email fallback |
| Rate limit retry | setTimeout loops with manual backoff | ApiClient retry logic (lines 143-153) | Implements exponential backoff, respects Retry-After header, max 3 retries, includes jitter |

**Key insight:** This phase is about **using** existing solutions consistently, not building new ones. Every pattern in this research already exists in the codebase.

## Common Pitfalls

### Pitfall 1: Incomplete Input Field Coverage

**What goes wrong:** Fixing only the obvious inputs (firstName, lastName) while missing selects, textareas, date pickers, or dynamically rendered fields.

**Why it happens:** Booking widget has 1600+ lines with multiple step components. Easy to miss fields in conditional renders or sub-components.

**How to avoid:**
1. Search for all `<input`, `<textarea`, `<select` tags in embed page
2. Verify each has explicit `text-gray-900 bg-white` classes
3. Check computed styles in browser DevTools (not just source code)
4. Test with actual booking flow (all steps, all field types)

**Warning signs:**
- Placeholder text visible but typed text invisible (white on white)
- Focus state has no visible change
- Some inputs styled differently than others

### Pitfall 2: Color Token Migration Breaking Dark Mode

**What goes wrong:** Replacing `text-charcoal/60` with `text-text-secondary` causes text to become invisible on dark backgrounds because token doesn't respect dark mode.

**Why it happens:** Tailwind config defines single hex values, not dark: variants. Assuming tokens automatically adapt.

**How to avoid:**
1. Check if component uses dark mode (`dark:` classes or theme context)
2. If yes, add `dark:text-white/80` alongside `text-text-secondary`
3. If no dark mode, token is safe as-is
4. Verify: This app uses light mode only (no `dark:` in tailwind config)

**Warning signs:**
- Text becomes unreadable after token replacement
- Component previously had `dark:` classes that got removed
- User reports text visibility issues

**Special note for this codebase:** The Tailwind config includes `darkMode: ['class']` but none of the design tokens have dark variants defined. Current implementation is light-mode only. If dark mode is added later, tokens will need `dark:` variants.

### Pitfall 3: Over-Wrapping NotificationLog

**What goes wrong:** Adding NotificationLog wrapper around existing sendNotification() calls creates double-logging (two log entries per notification).

**Why it happens:** Not recognizing that sendNotification() already creates NotificationLog entries.

**How to avoid:**
1. Identify direct sendEmail()/sendSms() calls (apps/api/src/cron/appointmentReminders.ts)
2. Replace with sendNotification() (apps/api/src/services/notifications.ts)
3. Do NOT wrap existing sendNotification() calls (apps/api/src/routes/webhooks.ts already uses it correctly)
4. Search for `import { sendEmail, sendSms }` to find direct usage

**Warning signs:**
- Duplicate NotificationLog entries for same notification
- NotificationLog count doesn't match actual sends
- Testing shows two emails sent instead of one

### Pitfall 4: Breaking Public Endpoints with Auth

**What goes wrong:** Migrating booking widget fetch calls to ApiClient adds Authorization headers to public endpoints, causing 401 errors.

**Why it happens:** ApiClient automatically injects access token if present. Public endpoints reject authenticated requests.

**How to avoid:**
1. Public endpoints (/public/*) are intentionally unauthenticated
2. ApiClient handles this: only adds auth if token exists (line 119-121)
3. Booking widget runs in iframe without auth context = no token = no header
4. Safe to use api.get() for public endpoints

**Warning signs:**
- 401 errors on previously working public endpoints
- Booking widget fails to load salon data
- CORS errors in browser console (auth triggers preflight)

**Special note:** The booking widget is already isolated in an iframe without access to parent window's auth tokens, so this scenario is unlikely. But worth verifying during testing.

## Code Examples

Verified patterns from official sources and existing codebase:

### Booking Widget Input Fix

```tsx
// File: apps/web/src/app/embed/[slug]/page.tsx
// Location: DetailsStep component (lines 708-793)

// BEFORE (current implementation with white-on-white issue):
<input
  type="text"
  value={booking.firstName}
  onChange={(e) => onChange('firstName', e.target.value)}
  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors"
  // ❌ Missing text-gray-900 bg-white
  placeholder="Jane"
  required
/>

// AFTER (explicit text and background colors):
<input
  type="text"
  value={booking.firstName}
  onChange={(e) => onChange('firstName', e.target.value)}
  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors text-gray-900 bg-white"
  // ✅ Added text-gray-900 bg-white
  placeholder="Jane"
  required
/>

// Apply to all inputs in DetailsStep:
// - firstName input (line 719)
// - lastName input (line 730)
// - email input (line 746)
// - phone input (line 759)
// - notes textarea (line 772)
```

### Text Color Token Migration

```tsx
// Example migration across multiple files
// Pattern: Replace opacity-based with semantic tokens

// BEFORE (charcoal/50 - fails contrast):
<p className="text-sm text-charcoal/50">Last login 2 hours ago</p>
// Computed: rgba(44, 44, 44, 0.5) ≈ #6E6E6E = 3.8:1 ❌

// AFTER (text-text-muted - passes contrast):
<p className="text-sm text-text-muted">Last login 2 hours ago</p>
// Computed: #7A7A7A = 4.6:1 ✅

// Migration map for 327 instances:
// - text-charcoal/70 → text-text-primary or text-charcoal (already 7:1+)
// - text-charcoal/60 → text-text-secondary (9:1 contrast)
// - text-charcoal/50 → text-text-muted (4.6:1 contrast)

// Search pattern: text-charcoal/(50|60|70)
// Files to check: 75 files found (grep results)
// Prioritize: User-facing pages > Admin pages > Components
```

### Cron Reminder NotificationLog Integration

```typescript
// File: apps/api/src/cron/appointmentReminders.ts
// Location: sendAppointmentReminder function (lines 156-258)

// BEFORE (direct email/SMS, no NotificationLog):
async function sendAppointmentReminder(
  appointment: AppointmentWithDetails,
  reminderType: ReminderType,
  channelConfig: { email: boolean; sms: boolean }
): Promise<ReminderResult> {
  // ... existing logic ...

  // Direct email send
  if (client.email && channelConfig.email && (preference === 'email' || preference === 'both')) {
    result.emailSent = await sendEmail({
      to: client.email,
      subject: emailSubject,
      html: emailHtml,
    });
  }

  // Direct SMS send
  if (client.phone && channelConfig.sms && (preference === 'sms' || preference === 'both')) {
    const smsResult = await sendSms({
      to: client.phone,
      message: smsMessage,
    });
    result.smsSent = smsResult.success;
  }

  // ... log to ReminderLog only ...
}

// AFTER (using sendNotification for NotificationLog tracking):
import { sendNotification } from '../services/notifications.js';

async function sendAppointmentReminder(
  appointment: AppointmentWithDetails,
  reminderType: ReminderType,
  channelConfig: { email: boolean; sms: boolean }
): Promise<ReminderResult> {
  // ... existing logic ...

  // Determine channels based on config and preference
  const channels: ('email' | 'sms')[] = [];
  if (channelConfig.email && (preference === 'email' || preference === 'both')) {
    channels.push('email');
  }
  if (channelConfig.sms && (preference === 'sms' || preference === 'both')) {
    channels.push('sms');
  }

  // Send through unified notification service
  const notificationResult = await sendNotification({
    salonId: appointment.salon.id,
    clientId: client.id,
    appointmentId: appointment.id,
    type: reminderType === 'REMINDER_24H' ? 'reminder_24h' : 'reminder_2h',
    channels,
    data: {
      clientName: client.firstName,
      clientEmail: client.email || undefined,
      clientPhone: client.phone || undefined,
      serviceName: service.name,
      staffName,
      dateTime,
      salonName: salon.name,
      salonAddress: address,
    },
  });

  result.emailSent = notificationResult.emailSent;
  result.smsSent = notificationResult.smsSent;

  // ... keep existing ReminderLog logging ...
}
```

### API Client Migration

```typescript
// File: apps/web/src/app/embed/[slug]/page.tsx
// Locations: Lines 204-306 (8 fetch helper functions)

// BEFORE (fetchSalon with direct fetch):
async function fetchSalon(slug: string): Promise<SalonFetchResult> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/${slug}/salon`);
    const data = await res.json();

    if (data.success && data.data) {
      const bookingEnabled = data.data.bookingEnabled !== false;
      if (!bookingEnabled) {
        return { salon: null, errorType: 'booking_disabled' };
      }
      return { salon: data.data, errorType: 'none' };
    }

    return { salon: null, errorType: 'not_found' };
  } catch {
    return { salon: null, errorType: 'network_error' };
  }
}

// AFTER (using centralized api client):
import { api } from '@/lib/api';

async function fetchSalon(slug: string): Promise<SalonFetchResult> {
  try {
    const response = await api.get<Salon>(`/public/${slug}/salon`);

    if (response.success && response.data) {
      const bookingEnabled = response.data.bookingEnabled !== false;
      if (!bookingEnabled) {
        return { salon: null, errorType: 'booking_disabled' };
      }
      return { salon: response.data, errorType: 'none' };
    }

    return { salon: null, errorType: 'not_found' };
  } catch {
    return { salon: null, errorType: 'network_error' };
  }
}

// Benefits gained:
// - Automatic 30s timeout (line 124)
// - Consistent error shape
// - Future: Can add retry logic for transient failures
// - Future: Can add request/response logging

// Apply same pattern to:
// - fetchLocations() (lines 224-232)
// - fetchServices() (lines 234-244)
// - fetchStaff() (lines 246-259)
// - fetchAvailability() (lines 261-278)
// - createBooking() (lines 280-306)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Opacity modifiers (text-white/50) | Semantic color tokens (text-text-muted) | Phase 16 (Accessibility Compliance) | Guaranteed WCAG compliance, predictable contrast regardless of background |
| Direct sendEmail()/sendSms() | sendNotification() facade | Phase 5 (Notification System) | Centralized logging, SMS-to-email fallback, delivery analytics, audit trail |
| Scattered fetch() calls | Centralized ApiClient | Phase 9 (Auth & Tenant Isolation) | Token management, retry logic, error normalization, timeout protection |
| Manual focus management | Radix UI Dialog + focus-trap-react | Phase 16 (Accessibility Compliance) | Built-in ARIA, keyboard handling, return focus, screen reader announcements |

**Deprecated/outdated:**
- **text-charcoal/XX opacity modifiers:** Replaced by text-text-primary/secondary/muted semantic tokens in Tailwind config (Phase 16). Opacity modifiers compute to different values on different backgrounds, making WCAG compliance impossible to guarantee.
- **Direct fetch() for internal APIs:** Replaced by api.get/post/put/patch/delete methods. Direct fetch misses token refresh, retry logic, error normalization, and timeout handling.
- **Individual notification sends without logging:** Replaced by sendNotification() which creates NotificationLog entries. Direct sends prevent delivery analytics and audit trail.

**Current as of 2026:**
- WCAG 2.1 Level AA is the legal standard (European Accessibility Act enforced June 28, 2025)
- Centralized API clients with TypeScript are industry standard for medium/large projects
- Notification logging and delivery tracking are table stakes for transactional systems

## Open Questions

**None.** All four debt items have clear implementation paths using existing patterns:

1. **Booking widget inputs:** Apply `text-gray-900 bg-white` classes to all input elements. Pattern exists in same file (DetailsStep).
2. **Contrast fixes:** Replace charcoal/50/60/70 with text-text-muted/secondary/primary. Tokens defined in tailwind.config.ts.
3. **Cron reminders:** Call sendNotification() instead of sendEmail()/sendSms(). Interface exists in notifications.ts.
4. **API client:** Import api from '@/lib/api' and use api.get/post/etc. Client exists with full feature set.

The research confirms these are straightforward cleanup tasks, not architectural decisions.

## Sources

### Primary (HIGH confidence)
- **WCAG 2.1 Contrast Requirements:** [Understanding Success Criterion 1.4.3: Contrast (Minimum) | W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- **WebAIM Contrast Checker:** [WebAIM: Contrast and Color Accessibility](https://webaim.org/articles/contrast/)
- **Accessible Form Design:** [Forms Tutorial | Web Accessibility Initiative (WAI) | W3C](https://www.w3.org/WAI/tutorials/forms/)
- **Form Input Best Practices:** [Accessible forms | ASU IT Accessibility](https://accessibility.asu.edu/articles/forms)
- **Accessible Form Validation:** [A Guide To Accessible Form Validation — Smashing Magazine](https://www.smashingmagazine.com/2023/02/guide-accessible-form-validation/)

### Secondary (MEDIUM confidence)
- **TypeScript API Client Patterns:** [Building a Type-Safe API Client in TypeScript](https://dev.to/limacodes/building-a-type-safe-api-client-in-typescript-beyond-axios-vs-fetch-4a3i)
- **Fetch Wrapper Best Practices:** [Fetch Wrapper for Next.js: Best Practices](https://dev.to/dmitrevnik/fetch-wrapper-for-nextjs-a-deep-dive-into-best-practices-53dh)
- **Type-Safe REST Clients:** [Building Type-Safe REST Clients in TypeScript | toasting code](https://toastingcode.com/posts/building-type-safe-rest-clients-in-typescript-proven-patterns-and-tools-for-enterprise-apis/)
- **WCAG Contrast Ratios Overview:** [Color Contrast Accessibility: Complete WCAG 2025 Guide | AllAccessible](https://www.allaccessible.org/blog/color-contrast-accessibility-wcag-guide-2025)
- **Accessible Forms 2026:** [10 Tips to Create Accessible Forms in 2026](https://woorise.com/blog/accessible-forms)

### Codebase References (HIGH confidence)
- `apps/web/tailwind.config.ts` - Color token definitions (lines 58-69)
- `apps/web/src/lib/api.ts` - ApiClient implementation (lines 53-236)
- `apps/api/src/services/notifications.ts` - sendNotification() facade (lines 46-95)
- `apps/api/src/cron/appointmentReminders.ts` - Current reminder logic (lines 156-258)
- `apps/web/src/app/embed/[slug]/page.tsx` - Booking widget inputs (lines 708-793)

## Metadata

**Confidence breakdown:**
- Booking widget styling: HIGH - Exact pattern exists in same file, just needs to be applied consistently
- Text contrast fixes: HIGH - Tokens pre-defined and validated, straightforward search-replace with semantic mapping
- NotificationLog integration: HIGH - sendNotification() fully implemented, just needs to replace direct sends
- API client consolidation: HIGH - ApiClient complete with all features, migration is import + method swap

**Research date:** 2026-01-29
**Valid until:** 90 days (stable patterns, no fast-moving dependencies)

**Risk assessment:**
- **Low risk:** All patterns exist and are battle-tested in production
- **Low complexity:** No new abstractions, libraries, or architectural decisions
- **High confidence:** Clear scope, bounded changes, existing test coverage
