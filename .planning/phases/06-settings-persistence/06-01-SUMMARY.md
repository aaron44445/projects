---
phase: 06-settings-persistence
plan: 01
subsystem: settings-ui
status: complete
created: 2026-01-27
completed: 2026-01-27
duration: 8min

tags:
  - settings
  - business-hours
  - location-api
  - react-hooks

requires:
  - 02-02: Location context and switching
  - existing: GET/PUT /locations/:id/hours API endpoints

provides:
  - useLocationHours: Hook for fetching and saving location hours
  - Business hours UI persistence: Settings persist across page refreshes

affects:
  - 06-02: Will follow similar pattern for other settings sections

tech-stack:
  added: []
  patterns:
    - "Save button pattern for settings (vs auto-save pattern used in notification settings)"
    - "editingHours local state for in-progress edits, separate from API data"
    - "Display format conversion: API uses dayOfWeek/openTime/closeTime, UI uses day name/open/close/isOpen"

key-files:
  created:
    - apps/web/src/hooks/useLocationHours.ts
  modified:
    - apps/web/src/app/settings/page.tsx

decisions:
  - id: save-button-vs-autosave
    context: Business hours uses Save button, notification settings uses auto-save
    choice: Save button pattern for business hours
    rationale: Business hours are structural changes that owners expect to review before applying, unlike notification toggles which feel more like preferences
    alternatives: [Auto-save on change]
    future: Settings with high impact (hours, pricing) should use Save button; preferences (toggles, dropdowns) can use auto-save

  - id: editing-state-pattern
    context: Need to track in-progress edits separately from API data
    choice: editingHours local state initialized from getDisplayHours()
    rationale: Allows UI updates without API calls, clear separation between editing and saved state, easy to implement Save/Cancel
    alternatives: [Direct mutation of API state, Controlled form with refs]
    future: All settings sections with Save buttons should use this pattern

  - id: display-format-conversion
    context: API uses dayOfWeek (0-6), openTime/closeTime (strings), isClosed (boolean); UI uses day name, open/close (strings), isOpen (boolean)
    choice: Helper functions getDisplayHours() and setDisplayHours() handle conversion
    rationale: Keeps UI code simple, encapsulates format conversion in hook, maintains single source of truth
    alternatives: [UI uses API format directly, Convert at component level]
    future: Display format helpers should live in hooks for reusability
---

# Phase 06 Plan 01: Wire Business Hours to API Summary

**One-liner:** Business hours settings now persist via useLocationHours hook with Save button pattern and location-specific data loading

## What Was Built

### Task 1: Create useLocationHours hook
Created `apps/web/src/hooks/useLocationHours.ts` following the useNotificationSettings pattern:

**Key features:**
- Fetch location hours from GET /locations/:id/hours
- Save hours to PUT /locations/:id/hours with optimistic updates
- Loading, saving, and error states for UI feedback
- `getDisplayHours()`: Converts API format (dayOfWeek/openTime/closeTime) to UI format (day name/open/close/isOpen)
- `setDisplayHours()`: Converts UI format back to API format for saving
- Returns null hours when no location selected (graceful handling)

**Format conversion:**
- **API:** `{ dayOfWeek: 0-6, openTime: "09:00" | null, closeTime: "17:00" | null, isClosed: boolean }`
- **UI:** `{ day: "Monday", dayOfWeek: 1, open: "09:00", close: "17:00", isOpen: boolean }`

### Task 2: Wire business hours UI to hook
Modified `apps/web/src/app/settings/page.tsx`:

**Changes:**
1. Added `useLocationHours(selectedLocationId)` hook call
2. Removed old hardcoded `hours` local state
3. Added `editingHours` local state for in-progress edits
4. Added `hoursSaved` state for success feedback
5. Implemented `handleSaveHours()` function
6. Added useEffect to initialize editingHours from API data
7. Added useEffect to reset editingHours when location changes
8. Added no-location-selected message
9. Added loading state while fetching
10. Updated all onChange handlers to modify editingHours
11. Added Save button with loading/saving/success/error states

**State flow:**
- `hours` (from hook): Raw API data, source of truth
- `editingHours` (local state): User's in-progress edits
- `getDisplayHours()`: Initializes editingHours from API data
- `setDisplayHours()`: Saves editingHours to API

## Deviations from Plan

None - plan executed exactly as written.

## Testing Verification

**Build Verification:**
```bash
✓ TypeScript compiles without errors
✓ Hook exports useLocationHours correctly
✓ Settings page imports and uses hook
✓ Save button present in UI
```

**Manual Testing Required:**
1. Switch locations - hours should reset and load new location's hours
2. Edit hours - changes should stay in editingHours (not saved yet)
3. Click Save - should show loading state, then success message
4. Refresh page - hours should persist
5. No location selected - should show "Select a location" message

## Technical Decisions

### Save Button vs Auto-save Pattern

**Decision:** Business hours use Save button (explicit save), not auto-save on change

**Why:**
- Business hours are structural changes that affect business operations
- Owners expect to review before applying (unlike notification toggles)
- Allows editing multiple days before saving all at once
- Clear feedback on save success/failure

**Comparison to notification settings:**
- Notification settings use auto-save because they're preferences, not structural data
- Toggle changes feel lightweight and reversible
- Hours changes affect scheduling, availability, customer-facing features

### Editing State Pattern

**Pattern:** Separate `editingHours` local state from API data `hours`

**Benefits:**
- UI updates instantly without API calls
- Clear separation between editing and saved state
- Easy to implement Cancel (just reset editingHours from API data)
- Optimistic updates on save with rollback on error

**Alternative considered:**
- Direct mutation of API state: Would require API call on every keystroke, poor UX
- Controlled form with refs: More complex, less React-idiomatic

### Display Format Conversion

**Pattern:** Helper functions in hook convert between API and UI formats

**Why:**
- API uses `dayOfWeek: 0-6` (Sunday = 0), UI needs day names
- API uses `isClosed: true` for closed days, UI uses `isOpen: true` for open days (inverted logic)
- Keeps component code simple (works with UI format)
- Encapsulates conversion logic in one place
- Maintains single source of truth (API data)

**Conversion logic:**
```typescript
// API → UI
getDisplayHours() {
  return DAY_NAMES.map((day, index) => {
    const hourData = hours.find(h => h.dayOfWeek === index);
    return {
      day,                                           // "Monday"
      dayOfWeek: index,                              // 1
      open: hourData?.openTime || '09:00',           // "09:00"
      close: hourData?.closeTime || '17:00',         // "17:00"
      isOpen: hourData ? !hourData.isClosed : true,  // Inverted
    };
  });
}

// UI → API
setDisplayHours(displayHours) {
  const apiHours = displayHours.map(h => ({
    dayOfWeek: h.dayOfWeek,
    openTime: h.isOpen ? h.open : null,
    closeTime: h.isOpen ? h.close : null,
    isClosed: !h.isOpen,  // Inverted
  }));
  return updateHours(apiHours);
}
```

## Architecture Notes

**Hook responsibilities:**
- Fetch hours from API
- Save hours to API
- Manage loading/saving/error states
- Convert between API and UI formats
- Handle optimistic updates with rollback

**Component responsibilities:**
- Manage editing state (editingHours)
- Render UI based on editingHours
- Handle user interactions (onChange, onClick)
- Display feedback (loading, saving, success, error)

**Clear separation:** Hook handles API, component handles UI

## Next Phase Readiness

**Phase 06 continues:**
- 06-02: Wire service pricing settings to API (similar pattern)
- 06-03: Wire tax settings to API (similar pattern)
- 06-04: Verification - test all settings persist across refreshes

**Patterns established:**
- useLocationHours hook pattern can be replicated for other settings
- Save button pattern established for structural changes
- EditingState pattern established for multi-field forms
- Display format conversion pattern established

**Known issues:**
- Missing validation: closeTime > openTime not enforced (client-side)
- Business hours don't affect authenticated availability endpoint yet (see STATE.md minor issues)

## Performance Notes

**Execution time:** 8 minutes
- Task 1 (create hook): 3 minutes
- Task 2 (wire UI): 5 minutes

**Efficiency factors:**
- Clear pattern from useNotificationSettings to follow
- Plan provided exact implementation details
- No ambiguity in requirements
- TypeScript prevented issues during development

## Files Changed

**Created:**
- `apps/web/src/hooks/useLocationHours.ts` (114 lines)

**Modified:**
- `apps/web/src/app/settings/page.tsx` (+102, -12 lines)
  - Added useLocationHours import
  - Added selectedLocationId destructuring
  - Added useLocationHours hook call
  - Added editingHours state and effects
  - Updated hours case section with new logic

**Commits:**
1. `cea2edf` - feat(06-01): create useLocationHours hook
2. `c1565db` - feat(06-01): wire business hours UI to useLocationHours hook

## Success Criteria Met

- [x] useLocationHours hook created with fetch, save, loading, and error states
- [x] Business hours section shows loading state while fetching
- [x] Business hours section shows "Select a location" message if no location selected
- [x] Hours changes update editingHours local state (not auto-save)
- [x] Save button triggers API call with loading state
- [x] Success/error feedback shown after save
- [x] TypeScript compiles without errors

## Handoff Notes

**For verification testing:**
1. Go to Settings → Business Hours
2. Select a location from header
3. Edit hours for Monday (change open time)
4. Click Save Hours button
5. Refresh page - Monday hours should persist
6. Switch to different location - hours should change
7. Deselect location - should show "Select a location" message

**Expected behavior:**
- Hours load from API on location selection
- Changes stay in memory until Save clicked
- Save button shows "Saving..." during API call
- Success message appears for 2 seconds after save
- Error message appears if save fails
- Hours persist across page refreshes
