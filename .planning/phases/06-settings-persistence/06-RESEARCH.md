# Phase 6: Settings Persistence - Research

**Researched:** 2026-01-27
**Domain:** React state management, settings persistence, optimistic updates
**Confidence:** HIGH

## Summary

Settings persistence in this application follows a stateless API architecture where the database is the single source of truth. The existing `useNotificationSettings` hook demonstrates a working optimistic update pattern that should be extended to other settings sections. The codebase uses React 18.2 with useState/useEffect patterns, but has TanStack Query 5.17 installed (currently unused).

The standard approach for 2026 is optimistic updates with manual save buttons for complex forms, Zod schema validation shared between frontend and backend, and immediate data refresh on next user interaction (no TTL caching). The architecture is already correct—stateless Vercel serverless frontend, single-instance Render API, PostgreSQL as source of truth—which eliminates distributed system complexity.

Key finding: React Query migration is optional (marked as user's discretion). The existing useState/useEffect pattern works but requires careful state management to avoid stale data. The notification settings implementation from Phase 5 provides a proven template.

**Primary recommendation:** Extend the existing optimistic update pattern from `useNotificationSettings` to all settings sections, ensure Zod validation mirrors on frontend, and verify public widget endpoints serve fresh data without caching.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zod | 3.22+ | Schema validation | TypeScript-first validation, shared schemas between client/server, automatic type inference |
| React Hook Form | 7.49+ | Form state management | Minimal re-renders, built-in validation integration, excellent DX |
| TanStack Query | 5.17+ | Server state management | Declarative data fetching, automatic cache invalidation, built-in optimistic updates |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form/resolvers | Latest | Zod + RHF integration | Connect Zod schemas to React Hook Form validation |
| date-fns | 3.2+ | Date formatting | Already in project, used for timezone handling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Query | useState/useEffect | TanStack eliminates 50% boilerplate but adds learning curve. Current useState pattern works if managed carefully. |
| React Hook Form | Manual form state | RHF reduces re-renders significantly but existing manual pattern functional for simple forms. |

**Installation:**
```bash
# Already installed in project
# No new packages required for MVP approach
# Optional: pnpm add @hookform/resolvers (if adding RHF to complex forms)
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
├── hooks/                    # Data fetching hooks
│   ├── useSalon.ts          # General salon settings (existing)
│   ├── useNotificationSettings.ts  # Template pattern (Phase 5)
│   └── useSettings*.ts      # Specific settings domains
├── lib/
│   └── validations/         # Shared Zod schemas
│       ├── salonSettings.ts # Mirror backend schemas
│       └── index.ts
└── contexts/
    └── SalonSettingsContext.tsx  # Global settings access (existing)
```

### Pattern 1: Optimistic Update with Manual Save
**What:** Update UI immediately, save to API, rollback on failure
**When to use:** Complex forms where users expect explicit save action
**Example:**
```typescript
// Source: Existing useNotificationSettings.ts (Phase 5)
const updateSettings = useCallback(async (newSettings: Partial<Settings>): Promise<void> => {
  // Merge new with existing
  const mergedSettings: Settings = {
    ...currentSettings,
    ...newSettings,
  };

  // Optimistic update - update UI immediately
  setSettings(mergedSettings);
  setSaving(true);
  setError(null);

  try {
    const response = await api.put<Settings>('/salon/settings', mergedSettings);
    if (response.success && response.data) {
      setSettings(response.data); // Sync with server response
    } else {
      // Revert on failure
      await fetchSettings();
    }
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to save';
    setError(message);
    // Revert optimistic update by refetching
    await fetchSettings();
  } finally {
    setSaving(false);
  }
}, [currentSettings, fetchSettings]);
```

### Pattern 2: Shared Zod Validation Schema
**What:** Define validation rules once, use on both client and server
**When to use:** All settings forms to ensure frontend mirrors backend validation
**Example:**
```typescript
// Source: Backend apps/api/src/routes/salon.ts pattern
// lib/validations/salonSettings.ts (create this)
import { z } from 'zod';

export const salonUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF', 'SEK']).optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  dateFormat: z.enum(['DMY', 'MDY', 'YMD']).optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional().nullable(),
  taxName: z.string().min(1).max(50).optional(),
});

export type SalonUpdateInput = z.infer<typeof salonUpdateSchema>;

// Frontend usage - validate before sending
const handleSave = async (formData: unknown) => {
  try {
    const validated = salonUpdateSchema.parse(formData);
    await updateSalon(validated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Display inline errors
      setErrors(err.flatten().fieldErrors);
    }
  }
};
```

### Pattern 3: Database as Source of Truth (No Application Cache)
**What:** API serves fresh data from database on every request
**When to use:** Current stateless architecture (single API instance, serverless frontend)
**Example:**
```typescript
// Source: Existing apps/api/src/routes/salon.ts
// Public widget endpoint - no caching
router.get('/:slug/salon', asyncHandler(async (req, res) => {
  const salon = await prisma.salon.findUnique({
    where: { slug: req.params.slug },
    select: {
      bookingEnabled: true,
      bookingMinNoticeHours: true,
      // ... other settings that affect widget
    },
  });
  res.json({ success: true, data: salon });
}));

// Changes apply immediately:
// 1. Dashboard saves settings → database updated
// 2. Widget user selects date → fresh fetch gets new values
// No TTL cache, no invalidation needed
```

### Pattern 4: Context Provider State Updates
**What:** Update React Context on successful API save to propagate changes
**When to use:** Settings used across multiple components
**Example:**
```typescript
// Source: Existing SalonSettingsContext.tsx pattern
export function SalonSettingsProvider({ children }: { children: ReactNode }) {
  const { salon, loading, error, updateSalon, fetchSalon } = useSalon();

  const handleUpdateSalon = async (data: Partial<Salon>) => {
    const updated = await updateSalon(data); // API call
    // Context automatically updates via setSalon in useSalon hook
    return updated;
  };

  return (
    <SalonSettingsContext.Provider value={{ salon, updateSalon: handleUpdateSalon, refetch: fetchSalon }}>
      {children}
    </SalonSettingsContext.Provider>
  );
}
```

### Anti-Patterns to Avoid
- **Caching without invalidation:** Don't add Redis/memory cache without proper invalidation strategy (not needed at current scale)
- **Assuming success:** Never skip rollback logic on optimistic updates—network failures happen
- **Duplicate validation logic:** Don't write different validation rules on client vs server—share Zod schemas
- **Cross-tab sync complexity:** Don't implement BroadcastChannel/WebSocket for settings—manual refresh acceptable per user decision
- **Expensive optimistic updates:** Don't perform complex calculations in optimistic updater—keep it fast and pure

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation functions | Zod schemas | Handles edge cases (null vs undefined), type inference, composability, consistent errors |
| Optimistic updates | Manual state tracking | React 19 useOptimistic or TanStack Query | Handles concurrent mutations, automatic rollback, race conditions |
| Form state management | useState per field | React Hook Form | Manages touched/dirty/errors, prevents unnecessary re-renders, built-in field registration |
| API error handling | Try-catch everywhere | Centralized ApiError class | Consistent error format, type-safe error codes, reusable error display |
| Date/time formatting | Intl API directly | Existing i18n utility functions | Already handles timezone, locale, user preferences from settings |

**Key insight:** Settings persistence looks simple but involves optimistic UI, rollback logic, validation sync, and cache coherence. The existing `useNotificationSettings` hook already solves these problems—reuse that pattern rather than inventing variations.

## Common Pitfalls

### Pitfall 1: Stale Data from Race Conditions
**What goes wrong:** User changes setting A, then setting B quickly. Request B completes before request A, leaving UI with stale value.
**Why it happens:** Async requests complete in unpredictable order. Optimistic update from request A overwrites response from request B.
**How to avoid:**
- Return server response as source of truth, not optimistic value
- Use request IDs or timestamps to ignore stale responses
- TanStack Query handles this automatically with query keys
**Warning signs:** Settings "flicker" or revert after saving, inconsistent state between tabs

### Pitfall 2: Double Submit on Fast Clicking
**What goes wrong:** User clicks save button twice, sends duplicate API requests, causes race conditions or double-billing
**Why it happens:** No button disable during in-flight request, no visual feedback for save state
**How to avoid:**
- Disable save button while `saving === true`
- Show loading spinner on button
- Use `isSubmitting` from React Hook Form
**Warning signs:** Network tab shows duplicate POST/PUT requests, user confusion about save state

### Pitfall 3: Validation Mismatch Between Client and Server
**What goes wrong:** Frontend validates successfully, backend rejects with validation error, user sees confusing error message
**Why it happens:** Frontend and backend use different validation rules (frontend more permissive or outdated)
**How to avoid:**
- Share Zod schemas between frontend and backend (monorepo advantage)
- Import schema from `@peacase/types` or create shared validation package
- Mirror backend validation on frontend for immediate feedback
**Warning signs:** Users see "Field is required" after form submission, errors only appear after API call

### Pitfall 4: Missing Rollback Logic
**What goes wrong:** Optimistic update succeeds, API call fails, UI shows incorrect state, user thinks save succeeded
**Why it happens:** Developer implements optimistic update but forgets error handling and rollback
**How to avoid:**
- Always implement try-catch around API calls
- Refetch current state on error (guaranteed correct)
- Show error toast/message to user
- Existing `useNotificationSettings` demonstrates correct pattern
**Warning signs:** UI shows saved state but data not in database, no error feedback to user

### Pitfall 5: Cache Invalidation Complexity
**What goes wrong:** Settings change in dashboard but widget/other components show old values
**Why it happens:** Multiple caches (browser, CDN, application) not invalidated properly
**How to avoid:**
- Current architecture already correct—no application cache to invalidate
- Database is source of truth, API serves fresh data
- Widget fetches on user interaction (date/service selection)
- Only invalidate React state via context providers
**Warning signs:** Settings not applying to booking widget, users report seeing old values

### Pitfall 6: Business Hours Not Affecting Availability
**What goes wrong:** Owner changes business hours, booking widget still shows old available times
**Why it happens:** Availability calculation doesn't refetch business hours from database, or caching prevents fresh data
**How to avoid:**
- Ensure `calculateAvailableSlots` service fetches current LocationHours from database
- No caching on availability endpoints (stateless)
- Frontend refetches availability after date/service selection
**Warning signs:** SET-02 requirement failing, availability not respecting new hours

## Code Examples

Verified patterns from official sources:

### Loading State UI Pattern
```typescript
// Source: React best practices 2026
const SettingsSection = () => {
  const { saving, error, updateSettings } = useSettings();

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className="btn-primary"
    >
      {saving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </>
      ) : (
        'Save Changes'
      )}
    </button>
  );
};
```

### Inline Validation Error Display
```typescript
// Source: React Hook Form + Zod pattern
const BusinessSettingsForm = () => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSave = async () => {
    try {
      const validated = businessSettingsSchema.parse(formData);
      await updateSalon(validated);
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors(err.flatten().fieldErrors);
      }
    }
  };

  return (
    <div>
      <input type="text" name="name" />
      {errors.name && <p className="text-red-500 text-sm">{errors.name[0]}</p>}
    </div>
  );
};
```

### TanStack Query Optimistic Update (Optional)
```typescript
// Source: TanStack Query v5 official docs
// If migrating to React Query
const { mutate } = useMutation({
  mutationFn: (newSettings: Partial<Salon>) => api.patch('/salon', newSettings),
  onMutate: async (newSettings) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['salon'] });
    // Snapshot previous value
    const previous = queryClient.getQueryData(['salon']);
    // Optimistically update
    queryClient.setQueryData(['salon'], (old) => ({ ...old, ...newSettings }));
    // Return context for rollback
    return { previous };
  },
  onError: (err, newSettings, context) => {
    // Rollback on error
    queryClient.setQueryData(['salon'], context.previous);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['salon'] });
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for all state | TanStack Query for server state, useState for local | 2022-2023 | 50% less boilerplate, automatic cache management |
| Manual try-catch rollback | React 19 useOptimistic hook | React 19 (2024) | Automatic rollback, simpler code, handles concurrent updates |
| Separate frontend/backend validation | Shared Zod schemas | 2023-2026 | Single source of truth, no validation drift |
| Real-time sync (WebSocket) for settings | Manual refresh acceptable | 2025-2026 consensus | Simpler architecture, settings change infrequently |
| Application-level caching (Redis) | Database as source of truth | Stateless/serverless era | Eliminates cache invalidation complexity at small scale |

**Deprecated/outdated:**
- **class components with componentDidUpdate:** React Hooks (useState/useEffect) standard since React 16.8
- **Redux for server state:** TanStack Query purpose-built for async server data
- **redux-persist for settings:** Over-engineering for single-user settings, database persistence sufficient
- **Moment.js for date formatting:** date-fns tree-shakeable, smaller bundle, already in project

## Open Questions

Things that couldn't be fully resolved:

1. **React Query migration timing**
   - What we know: TanStack Query 5.17 installed but unused, useState/useEffect pattern working
   - What's unclear: Whether to migrate now or after stabilization (marked as "Claude's discretion")
   - Recommendation: Keep current useState pattern for consistency with existing code, note migration path for future. Notification settings demonstrates pattern works.

2. **Form validation timing (on blur vs on change vs on submit)**
   - What we know: Marked as "Claude's discretion", Zod validation must mirror backend
   - What's unclear: User preference for validation feedback timing
   - Recommendation: Validate on submit (prevent API errors), show inline errors immediately. Match existing notification settings UX.

3. **Business hours data structure**
   - What we know: Salon.business_hours is JSON string "[]", LocationHours table exists with proper structure
   - What's unclear: Whether business hours should use JSON field or LocationHours table
   - Recommendation: Use LocationHours table for location-specific hours (proper relational data), verify Salon.business_hours is deprecated/unused field.

4. **Service pricing cache in widget**
   - What we know: Widget fetches services from `/api/v1/public/:slug/services` which queries database directly
   - What's unclear: Whether widget should cache service data or refetch on every interaction
   - Recommendation: Refetch on service selection (user action triggers fresh data), acceptable latency per requirements.

## Sources

### Primary (HIGH confidence)
- React official documentation - useOptimistic hook: https://react.dev/reference/react/useOptimistic
- TanStack Query v5 documentation - Optimistic updates: https://tanstack.com/query/v4/docs/react/guides/optimistic-updates
- Zod GitHub repository and documentation: https://zod.dev/ and https://github.com/colinhacks/zod
- Existing codebase patterns:
  - `apps/web/src/hooks/useNotificationSettings.ts` (Phase 5 implementation)
  - `apps/web/src/hooks/useSalon.ts` (current pattern)
  - `apps/api/src/routes/salon.ts` (backend validation with Zod)
  - Database schema: `packages/database/prisma/schema.prisma`

### Secondary (MEDIUM confidence)
- [React Query best practices 2026](https://tkdodo.eu/blog/react-query-the-bad-parts) - TkDodo's blog on cache invalidation
- [Type-Safe Form Validation in Next.js 15](https://www.abstractapi.com/guides/email-validation/type-safe-form-validation-in-next-js-15-with-zod-and-react-hook-form) - Zod + RHF patterns
- [End-to-end Typesafe APIs with shared Zod schemas](https://dev.to/jussinevavuori/end-to-end-typesafe-apis-with-typescript-and-shared-zod-schemas-4jmo) - Client/server validation sync
- [Managing Query Keys for Cache Invalidation](https://www.wisp.blog/blog/managing-query-keys-for-cache-invalidation-in-react-query) - React Query invalidation strategies
- [State Management in 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - Current state management patterns

### Tertiary (LOW confidence)
- WebSearch results on settings persistence patterns - general guidance, not project-specific
- Real-time database sync articles - overkill for current requirements, noted for future scale

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zod, React Hook Form, TanStack Query are industry-standard 2026 tools, verified from official docs
- Architecture: HIGH - Existing codebase demonstrates working patterns, database schema verified, API routes examined
- Pitfalls: HIGH - Based on verified patterns in existing code, official React/TanStack docs, known 2026 best practices
- Code examples: HIGH - Sourced from existing codebase (useNotificationSettings) and official documentation

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - stable domain, React/TypeScript patterns slow-changing)

**Key architectural decisions validated:**
- Stateless API architecture (single Render instance) eliminates distributed cache concerns ✓
- Database as source of truth with no application-level caching ✓
- Optimistic updates with manual save pattern (existing in notification settings) ✓
- Public widget endpoints serve fresh data without TTL caching ✓
- Vercel serverless frontend is stateless, no cross-instance sync needed ✓

**Phase 5 learnings applied:**
- Notification settings optimistic update pattern works and should be template ✓
- API returns detailed Zod validation errors for inline display ✓
- Merge with defaults pattern handles empty JSON "{}" correctly ✓
- Console.log fallback acceptable if no toast library ✓
