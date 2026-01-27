---
status: resolved
trigger: "Client name not updating when returning client books with different name"
created: 2026-01-26T00:00:00Z
updated: 2026-01-26T00:10:00Z
---

## Current Focus

hypothesis: The bug was real but has already been fixed in commit d89b7e9
test: Compare current code with git history
expecting: Find evidence of prior bug and subsequent fix
next_action: Document findings

## Symptoms

expected: When user enters "jeff" as firstName during booking, confirmation shows "jeff"
actual: Confirmation email shows "a" (previous test name for same email)
errors: None - code runs without error, just wrong data
reproduction: Book with existing client email but different name
started: Unknown - likely since original implementation

## Eliminated

- hypothesis: Current code has the bug
  evidence: Git history shows the fix was applied in commit d89b7e9 and current code includes firstName/lastName updates
  timestamp: 2026-01-26T00:09:00Z

## Evidence

- timestamp: 2026-01-26T00:01:00Z
  checked: apps/api/src/routes/public.ts - booking endpoint lines 748-765
  found: Code correctly updates firstName and lastName for existing clients
  implication: Current code should work correctly

- timestamp: 2026-01-26T00:05:00Z
  checked: Git history for public.ts
  found: Commit d89b7e9 "fix: update client name on re-booking" was applied today (Jan 26, 2026)
  implication: The bug existed and was fixed

- timestamp: 2026-01-26T00:06:00Z
  checked: Git diff for commit d89b7e9
  found: |
    BEFORE FIX (line 746-755):
    ```javascript
    } else {
      // Update client info if they provided new phone
      if (phone && phone !== client.phone) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: { phone },
        });
      }
    }
    ```

    AFTER FIX (current code):
    ```javascript
    } else {
      const updates: { firstName?: string; lastName?: string; phone?: string; optedInReminders?: boolean } = {};
      if (firstName && firstName !== client.firstName) updates.firstName = firstName;
      if (lastName && lastName !== client.lastName) updates.lastName = lastName;
      if (phone && phone !== client.phone) updates.phone = phone;
      // ... rest of update logic
    }
    ```
  implication: The original bug was that ONLY phone was being updated, firstName/lastName were ignored

- timestamp: 2026-01-26T00:08:00Z
  checked: Current code in public.ts lines 750-764
  found: Fix is present - firstName and lastName are now included in the updates object
  implication: Bug is fixed in codebase

## Resolution

root_cause: |
  **File:** apps/api/src/routes/public.ts
  **Lines:** 748-765 (originally 746-755 before fix)

  **Root Cause:** When an existing client was found by email during booking, the code only updated the phone number, not firstName/lastName.

  **Original Buggy Code (lines 746-755):**
  ```javascript
  } else {
    // Update client info if they provided new phone
    if (phone && phone !== client.phone) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: { phone },
      });
    }
  }
  ```

  **The Problem:**
  - The else block (for existing clients) only checked and updated the phone field
  - firstName and lastName from the booking form were completely ignored
  - When the client variable was used later for the confirmation email (line 875: `clientName: client.firstName`), it contained the OLD name from the database, not the newly-entered name

fix: |
  Already applied in commit d89b7e9 (2026-01-26)

  The fix:
  1. Added firstName and lastName to the updates object
  2. Uses same pattern as phone: `if (firstName && firstName !== client.firstName) updates.firstName = firstName`
  3. The client variable is now reassigned with the updated record

verification: |
  - Current code at lines 750-753 includes firstName and lastName in updates
  - Git history confirms fix was committed
  - If user still experiences issue, they may be running old code or the fix hasn't been deployed

files_changed:
  - apps/api/src/routes/public.ts (lines 748-765)
