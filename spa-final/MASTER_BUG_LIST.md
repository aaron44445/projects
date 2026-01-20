# MASTER BUG LIST - Peacase Platform Audit

**Generated:** 2026-01-20
**Last Updated:** 2026-01-20
**Audited Directories:** apps/web, apps/api, packages

---

## Summary

| Priority | Count | Fixed |
|----------|-------|-------|
| 🔴 CRITICAL | 0 | 0 |
| 🟠 HIGH | 6 | 6 |
| 🟡 MEDIUM | 15 | 11 |
| 🟢 LOW | 9 | 0 |
| **TOTAL** | **30** | **17** |

---

## ✅ RECENTLY FIXED

### Fixed 2026-01-20: Dead Buttons & Links Sweep

**Issues Fixed:**
- H1. Demo form API - Verified already connected (endpoint at `apps/api/src/routes/demo.ts`)
- H2. Notification bells - Created reusable `NotificationDropdown` component, replaced all 8 instances
- H4. Context menus - Added dropdown menus for clients, dashboard, and marketing pages
- H5. View All Activity - Added modal with activity history on dashboard
- H6. View Client Profile - Added navigation handler on reviews page
- M14. Dashboard Activity - Now has functional "View All" with modal
- M15. Reviews Client Navigation - Now navigates to clients page with filter
- Landing page footer - Fixed 3 social media `href="#"` links

**Files Changed:**
- `apps/web/src/components/NotificationDropdown.tsx` - NEW reusable component
- `apps/web/src/app/dashboard/page.tsx` - NotificationDropdown + context menu + View All modal
- `apps/web/src/app/clients/page.tsx` - NotificationDropdown + context menu
- `apps/web/src/app/marketing/page.tsx` - NotificationDropdown + context menu with delete
- `apps/web/src/app/reviews/page.tsx` - NotificationDropdown + View Client Profile handler
- `apps/web/src/app/services/page.tsx` - NotificationDropdown
- `apps/web/src/app/calendar/page.tsx` - NotificationDropdown
- `apps/web/src/app/packages/page.tsx` - NotificationDropdown
- `apps/web/src/app/gift-cards/page.tsx` - NotificationDropdown
- `apps/web/src/app/reports/page.tsx` - NotificationDropdown
- `apps/web/src/app/settings/page.tsx` - NotificationDropdown
- `apps/web/src/app/page.tsx` - Fixed social media footer links

---

### Fixed 2026-01-20: Calendar & Clients Page Null-Safety

**Issues Fixed:**
- H3. Client Quick Actions - "Book" and "Message" buttons now wired up with onClick handlers
- M2. Unsafe String Destructuring - All `firstName[0]`/`lastName[0]` now use optional chaining
- Calendar page: All `.filter()`, `.map()`, `.find()` wrapped with `(data || [])` guards
- Clients page: All `.filter()`, `.map()` wrapped with `(data || [])` guards

**Files Changed:**
- `apps/web/src/app/calendar/page.tsx` - 15+ null-safety fixes
- `apps/web/src/app/clients/page.tsx` - 8+ null-safety fixes + onClick handlers

---

### Fixed 2026-01-20: Comprehensive Null Safety & Security

**Issues Fixed:**
- M1. Staff page dayNames bounds check - Added `dayNames[a.dayOfWeek % 7] || ''`
- M3. Reports page .slice() null guards - Added optional chaining
- M4. Dashboard nested object access - Added optional chaining on `apt.client`, `apt.service`, `apt.staff`
- M5. Services page category dropdown - Added `categories?.length > 0` check
- M6. Services page specialties display - Added null guard
- M7. Staff page category fallback - Added `s.category?.name || s.name`
- M8. Auth rate limit - Reduced from 50 to 10 requests per 15 minutes

**Files Changed:**
- `apps/web/src/app/staff/page.tsx` - dayNames bounds check, category fallback
- `apps/web/src/app/reports/page.tsx` - optional chaining on slices
- `apps/web/src/app/dashboard/page.tsx` - null checks on nested objects
- `apps/web/src/app/services/page.tsx` - categories length check, specialties guard
- `apps/api/src/middleware/rateLimit.ts` - reduced auth rate limit
- `apps/api/src/routes/reviews.ts` - added client.id to response

---

## 🔴 CRITICAL (Blocks Core Functionality)

*None found - core functionality is intact*

---

## 🟠 HIGH (Feature Doesn't Work)

### ~~H1. Demo Booking Form Not Connected to API~~ ✅ VERIFIED WORKING
- **File:** `apps/web/src/app/demo/page.tsx`
- **Lines:** 83-105
- **Status:** Verified - Form correctly POSTs to `/api/v1/demo`, backend endpoint exists at `apps/api/src/routes/demo.ts:25`

### ~~H2. Notification Bells Non-Functional (8 instances)~~ ✅ FIXED
- **Files:** All 8 pages updated
- **Status:** Fixed - Created reusable `NotificationDropdown` component at `apps/web/src/components/NotificationDropdown.tsx`
- **Implementation:** All bell buttons now open a dropdown showing notifications with mark-as-read functionality

### ~~H3. Client Quick Actions Non-Functional~~ ✅ FIXED
- **File:** `apps/web/src/app/clients/page.tsx`
- **Lines:** 776-789
- **Issue:** ~~"Book" and "Message" buttons in client detail drawer have no onClick handlers~~
- **Status:** Fixed - Buttons now call `handleBookAppointment()` and `handleMessageClient()`

### ~~H4. Context Menu Buttons Non-Functional (3 instances)~~ ✅ FIXED
- **Files:** clients, dashboard, marketing pages
- **Status:** Fixed - Added dropdown menus with View/Edit/Delete actions
- **Implementation:** Each MoreHorizontal button now toggles a dropdown with relevant actions

### ~~H5. "View All Activity" Link Non-Functional~~ ✅ FIXED
- **File:** `apps/web/src/app/dashboard/page.tsx`
- **Status:** Fixed - Added `showAllActivity` state and modal showing full activity history
- **Implementation:** "View All" link opens modal with scrollable activity list

### ~~H6. "View Client Profile" Menu Item Non-Functional~~ ✅ FIXED
- **File:** `apps/web/src/app/reviews/page.tsx`
- **Status:** Fixed - Added `handleViewClientProfile` that navigates to `/clients?client=${clientId}`
- **Implementation:** Menu item now navigates to clients page with client filter

---

## 🟡 MEDIUM (Poor UX / Workaround Exists)

### ~~M1. Unsafe Array Index Access - Staff Page~~ ✅ FIXED
- **File:** `apps/web/src/app/staff/page.tsx`
- **Line:** 278
- **Issue:** ~~`dayNames[a.dayOfWeek]` without bounds checking~~
- **Status:** Fixed - Added bounds checking with `dayNames[a.dayOfWeek % 7] || ''`

### ~~M2. Unsafe String Destructuring - Clients Page (3 instances)~~ ✅ FIXED
- **File:** `apps/web/src/app/clients/page.tsx`
- **Lines:** 588, 702, 729
- **Issue:** ~~`client.firstName[0]` and `client.lastName[0]` without empty check~~
- **Status:** Fixed - Now uses `client.firstName?.[0] || '?'` pattern

### ~~M3. Missing Null Guards - Reports Page~~ ✅ FIXED
- **File:** `apps/web/src/app/reports/page.tsx`
- **Lines:** 152-157, 164
- **Issue:** ~~`.slice()` called on potentially null `servicesReport.categories` and `staffReport.staff`~~
- **Status:** Fixed - Added optional chaining: `servicesReport?.categories?.slice(0, 5)`

### ~~M4. Unsafe Nested Object Access - Dashboard~~ ✅ FIXED
- **File:** `apps/web/src/app/dashboard/page.tsx`
- **Lines:** 418-421
- **Issue:** ~~No null checks on `apt.client`, `apt.service`, `apt.staff` objects~~
- **Status:** Fixed - Added optional chaining on nested properties

### ~~M5. Unsafe Category Access - Services Page~~ ✅ FIXED
- **File:** `apps/web/src/app/services/page.tsx`
- **Line:** 185
- **Issue:** ~~`categories[0]?.id` could still fail if categories array is undefined~~
- **Status:** Fixed - Added `categories?.length > 0 ? categories[0].id : ''`

### ~~M6. Unsafe Staff Display - Services Page~~ ✅ FIXED
- **File:** `apps/web/src/app/services/page.tsx`
- **Line:** 556
- **Issue:** ~~`displayInfo.specialties` could be undefined~~
- **Status:** Fixed - Added null guard for specialties

### ~~M7. Missing Category Property Check - Staff Page~~ ✅ FIXED
- **File:** `apps/web/src/app/staff/page.tsx`
- **Line:** 125
- **Issue:** ~~Accesses `s.category?.name` but doesn't handle case where category object exists without name~~
- **Status:** Fixed - Added fallback: `s.category?.name || s.name`

### ~~M8. Auth Rate Limit Too Permissive~~ ✅ FIXED
- **File:** `apps/api/src/middleware/rateLimit.ts`
- **Line:** 32
- **Issue:** ~~Rate limit was 50 req/15min~~
- **Status:** Fixed - Reduced to 10 requests per 15 minutes (prevents brute force while allowing legitimate retries)

### M9. Onboarding/Setup Redirect Loop Risk
- **Files:** `apps/web/src/app/onboarding/page.tsx`, `apps/web/src/app/setup/page.tsx`
- **Issue:** These pages use `AuthGuard` but not `OnboardingGuard`, which redirects TO them
- **Risk:** Edge case: user could exit onboarding incomplete without being forced back

### M10. Missing Test Suite
- **File:** `.github/workflows/ci.yml`
- **Line:** 183
- **Issue:** Test job is placeholder - `echo "No tests configured yet"`
- **Impact:** No automated testing in CI pipeline

### M11. Staff Services Specialty Display Risk
- **File:** `apps/web/src/app/staff/page.tsx`
- **Line:** 271-278
- **Issue:** `member.staffServices?.map()` - potential null reference in getStaffDisplayInfo
- **Fix:** Ensure staffServices is always an array before mapping

### M12. Missing Array Validation in Hooks
- **Files:** Various hooks in `apps/web/src/hooks/`
- **Issue:** Some API responses not validated as arrays before spreading
- **Fix:** Use `Array.isArray(response.data) ? response.data : []` pattern consistently

### M13. Services Page Category Dropdown
- **File:** `apps/web/src/app/services/page.tsx`
- **Issue:** If categories fail to load, form shows empty dropdown with no feedback
- **Fix:** Add loading/error state for categories

### ~~M14. Dashboard Activity Section~~ ✅ FIXED
- **File:** `apps/web/src/app/dashboard/page.tsx`
- **Status:** Fixed - "View All" now opens modal with scrollable activity history

### ~~M15. Reviews Page Client Navigation~~ ✅ FIXED
- **File:** `apps/web/src/app/reviews/page.tsx`
- **Status:** Fixed - "View client profile" now navigates to clients page with filter

---

## 🟢 LOW (Cosmetic / Polish)

### L1. Missing Documentation Screenshots (7 items)
- **File:** `docs/DEPLOYMENT.md`
- **Lines:** 56-58, 91-93, 123-124
- **Issue:** TODO placeholders for Render, Vercel, and CORS configuration screenshots
- **Impact:** Documentation incomplete for visual learners

### L2. Optional Services Not Configured
- **File:** `apps/api/src/lib/env.ts`
- **Items:**
  - SendGrid email (line 31)
  - Twilio SMS (line 35)
  - Sentry error tracking (line 40)
  - Cloudinary image uploads (line 45)
- **Impact:** Features gracefully disabled - not broken, just unavailable

### L3. Temporary Encryption Key Warning
- **File:** `apps/api/src/lib/env.ts`
- **Line:** 114
- **Issue:** Using temporary key if ENCRYPTION_KEY not set
- **Impact:** Encrypted data won't persist across restarts in dev

### L4. Filter Dropdowns Not Form Elements
- **Files:** `apps/web/src/app/clients/page.tsx`, `apps/web/src/app/staff/page.tsx`
- **Issue:** Filters use Select components without form wrapping
- **Impact:** Minor - accessibility could be improved, but functional

### L5. No Error Boundaries at Page Level
- **Files:** All page components
- **Issue:** Error boundaries exist for API errors but not React render errors
- **Impact:** Unhandled React errors could crash entire page

### L6. Calendar Page Could Use Skeleton
- **File:** `apps/web/src/app/calendar/page.tsx`
- **Issue:** Loading state could be more visually polished
- **Impact:** Minor UX improvement opportunity

### L7. Mobile Responsiveness Not Verified
- **Files:** All pages
- **Issue:** Audit focused on functionality, not responsive design
- **Impact:** Unknown mobile experience quality

### L8. Missing Keyboard Navigation
- **Files:** Various modal and drawer components
- **Issue:** Escape key and tab navigation not verified
- **Impact:** Accessibility for keyboard users

### L9. Console Logging in Production
- **Files:** Various
- **Issue:** Some debug console.log statements may exist
- **Impact:** Minor - clutters browser console

---

## API Route Status

**All 82+ API endpoints verified** - No missing routes found.

Frontend calls correctly map to backend routes for:
- Auth (9 endpoints)
- Users (1 endpoint)
- Staff (7 endpoints)
- Salon (4 endpoints)
- Clients (5 endpoints)
- Appointments (5 endpoints)
- Services (9 endpoints)
- Reviews (3 endpoints)
- Gift Cards (4 endpoints)
- Packages (9 endpoints)
- Marketing (5 endpoints)
- Dashboard (3 endpoints)
- Reports (5 endpoints)
- Uploads (1 endpoint)
- Onboarding (4 endpoints)
- Public booking widget (3 endpoints)

---

## Form Status

**13 of 13 forms properly implemented** ✅

Working forms:
- Signup, Login, Reset Password, Forgot Password
- Clients (Create/Edit)
- Services (Create/Edit)
- Categories (Create)
- Staff (Create/Edit)
- Settings (Business Info, Hours, Widget)
- Demo booking form ✅ (verified working - `POST /api/v1/demo`)

---

## Recommended Fix Priority

### ~~Immediate (Before Next Deploy)~~ ✅ ALL COMPLETE
1. ~~H1 - Connect demo form to API~~ ✅ Verified working
2. ~~M8 - Reduce auth rate limit~~ ✅ Fixed - reduced to 10 req/15min

### ~~This Week~~ ✅ ALL COMPLETE
3. ~~H2 - Implement notification system~~ ✅ Done
4. ~~H3-H6 - Wire up all non-functional buttons~~ ✅ Done
5. ~~M1-M7 - Add null guards to prevent crashes~~ ✅ Done

### This Month
6. M10 - Add test suite
7. L5 - Add page-level error boundaries
8. M9 - Review onboarding flow edge cases

---

## Files Most Affected

| File | Issue Count |
|------|-------------|
| `apps/web/src/app/clients/page.tsx` | 5 |
| `apps/web/src/app/dashboard/page.tsx` | 4 |
| `apps/web/src/app/staff/page.tsx` | 3 |
| `apps/web/src/app/services/page.tsx` | 3 |
| `apps/web/src/app/reports/page.tsx` | 2 |
| `apps/web/src/app/reviews/page.tsx` | 2 |
| `apps/web/src/app/marketing/page.tsx` | 2 |
