# Admin Panel Test Fixes - Implementation Guide

**Status:** 🔴 Critical - 0/23 admin tests passing
**Created:** 2025-11-24 (v0.5.6)
**Priority:** High (after security fixes)

## Problem Summary

All admin panel tests are failing due to authentication system migration from localStorage demo users to Firebase Auth. Tests still use deprecated `setupMockUser()` which creates localStorage entries, but the app now requires real Firebase authentication.

## Root Cause Analysis

### What Changed (v0.5.x)
1. **v0.5.1** - Firebase Authentication introduced
2. **v0.5.2-0.5.3** - Navigation redesigned (TopNavBar/NavigationRail split)
3. Admin tests NOT updated to use Firebase Auth
4. Tests use localStorage user switching: `localStorage.setItem('powertimeline_current_user', '"alice"')`

### Why Tests Fail
```typescript
// tests/admin/82-admin-panel-access.spec.ts:38
await page.evaluate(() => {
  localStorage.setItem('powertimeline_current_user', '"alice"');
});
// ❌ This no longer sets up authentication state!
// ❌ App now requires Firebase Auth tokens
// ❌ Tests timeout waiting for elements that never render
```

## Affected Test Files

| File | Tests | Status | Priority |
|------|-------|--------|----------|
| `tests/admin/82-admin-panel-access.spec.ts` | 6 | All failing | High |
| `tests/admin/83-user-management.spec.ts` | 4 | All failing | High |
| `tests/admin/84-admin-statistics.spec.ts` | 4 | All failing | Medium |
| `tests/admin/85-admin-bulk-operations.spec.ts` | 4 | All failing | Medium |
| `tests/admin/86-admin-activity-log.spec.ts` | 5 | All failing | Low |
| `tests/admin/01-reset-statistics.spec.ts` | 6 | 4/6 failing | Medium |

**Total:** 23 tests failing across 6 files

## Solution: Migrate to Firebase Auth

### Step 1: Create Admin Test User in Firebase

```bash
# Create admin user with Firebase Admin SDK
npx tsx scripts/create-admin-test-user.ts
```

**Script to create** (`scripts/create-admin-test-user.ts`):
```typescript
import admin from 'firebase-admin';
import { initializeApp } from './init-firebase-admin';

const ADMIN_USER = {
  email: 'admin@powertimeline.com',
  password: process.env.ADMIN_TEST_PASSWORD || 'AdminPassword123!',
  displayName: 'Admin Test User',
  emailVerified: true,
};

async function createAdminUser() {
  await initializeApp();

  // Create user in Firebase Auth
  const userRecord = await admin.auth().createUser({
    email: ADMIN_USER.email,
    password: ADMIN_USER.password,
    displayName: ADMIN_USER.displayName,
    emailVerified: ADMIN_USER.emailVerified,
  });

  // Create user document in Firestore with admin role
  await admin.firestore().collection('users').doc(userRecord.uid).set({
    id: userRecord.uid,
    email: ADMIN_USER.email,
    name: ADMIN_USER.displayName,
    role: 'admin', // ✅ Critical: Set admin role
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✅ Admin user created:', userRecord.uid);
}

createAdminUser();
```

### Step 2: Add Admin Credentials to .env.test

```bash
# .env.test
TEST_USER_EMAIL=test@powertimeline.com
TEST_USER_PASSWORD=TestPassword123!
TEST_USER_UID=iTMZ9n0IuzUSbhWfCaR86WsB2AC3

# Admin test user (for admin panel tests)
ADMIN_TEST_EMAIL=admin@powertimeline.com
ADMIN_TEST_PASSWORD=AdminPassword123!
ADMIN_TEST_UID=<generated_admin_uid>
```

### Step 3: Update Test Utilities

**File:** `tests/utils/timelineTestHelper.ts`

```typescript
export const TEST_USERS = {
  E2E_TEST_USER: {
    uid: process.env.TEST_USER_UID || 'iTMZ9n0IuzUSbhWfCaR86WsB2AC3',
    email: process.env.TEST_USER_EMAIL || 'test@powertimeline.com',
    password: process.env.TEST_USER_PASSWORD || '',
    timelineId: process.env.TEST_USER_TIMELINE_ID || 'zEAJkBfgpYt3YdCLW2tz',
  },
  // ✅ ADD THIS:
  ADMIN_TEST_USER: {
    uid: process.env.ADMIN_TEST_UID || '',
    email: process.env.ADMIN_TEST_EMAIL || 'admin@powertimeline.com',
    password: process.env.ADMIN_TEST_PASSWORD || '',
    role: 'admin' as const,
  },
};

/**
 * Login as admin user for admin panel tests
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = TEST_USERS.ADMIN_TEST_USER;

  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByTestId('sign-in-submit-button').click();
  await page.waitForURL('/');
  await page.waitForTimeout(1000);
}
```

### Step 4: Convert Admin Tests

**Example:** `tests/admin/82-admin-panel-access.spec.ts`

**BEFORE (❌ Broken):**
```typescript
test('T82.1: Admin user can access admin panel', async ({ page }) => {
  // Navigate to home page (cynacons is default admin user)
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Navigate to /admin route
  await page.goto('/admin');
  // ❌ No authentication - test fails here
});
```

**AFTER (✅ Fixed):**
```typescript
import { loginAsAdmin } from '../utils/timelineTestHelper';

test('T82.1: Admin user can access admin panel', async ({ page }) => {
  // ✅ Login as admin user with Firebase Auth
  await loginAsAdmin(page);

  // Navigate to /admin route
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');

  // Verify URL is /admin (not redirected)
  await expect(page).toHaveURL('/admin', { timeout: 5000 });

  // Verify admin panel heading is visible
  await expect(page.locator('h1:has-text("Admin Panel")')).toBeVisible({ timeout: 5000 });
});
```

**For non-admin tests:**
```typescript
test('T82.2: Non-admin user redirected from admin panel', async ({ page }) => {
  // ✅ Use regular (non-admin) test user
  await loginAsTestUser(page);

  // Try to navigate to /admin route
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');

  // Should be redirected to home page
  await expect(page).toHaveURL('/', { timeout: 5000 });
});
```

### Step 5: Update All Admin Tests

**Checklist:**
- [ ] `82-admin-panel-access.spec.ts` - Replace localStorage with `loginAsAdmin()`
- [ ] `83-user-management.spec.ts` - Replace localStorage with `loginAsAdmin()`
- [ ] `84-admin-statistics.spec.ts` - Replace localStorage with `loginAsAdmin()`
- [ ] `85-admin-bulk-operations.spec.ts` - Replace localStorage with `loginAsAdmin()`
- [ ] `86-admin-activity-log.spec.ts` - Replace localStorage with `loginAsAdmin()`
- [ ] `01-reset-statistics.spec.ts` - Replace localStorage with `loginAsAdmin()`

### Step 6: Remove Deprecated Code

After all tests pass:
```typescript
// tests/utils/timelineTestHelper.ts

// ❌ DELETE THIS FUNCTION:
export async function setupMockUser(page: Page, userId: string = 'cynacons'): Promise<void> {
  console.warn('setupMockUser() is deprecated...');
  // ... (100+ lines of deprecated code)
}
```

## Implementation Estimate

| Task | Time | Complexity |
|------|------|------------|
| Create admin test user script | 30 min | Low |
| Update test utilities | 15 min | Low |
| Convert test files (6 files) | 2-3 hours | Medium |
| Debug and fix failures | 1-2 hours | Medium |
| Remove deprecated code | 30 min | Low |
| **Total** | **5-7 hours** | **Medium** |

## Testing Strategy

1. **Fix one test file at a time** (start with 82-admin-panel-access.spec.ts)
2. **Run individual test file** after conversion:
   ```bash
   npx playwright test tests/admin/82-admin-panel-access.spec.ts
   ```
3. **Verify all 6 tests pass** before moving to next file
4. **Run full admin suite** after all conversions:
   ```bash
   npx playwright test tests/admin/
   ```

## Success Criteria

- ✅ All 23 admin tests passing
- ✅ Admin user created in Firebase Auth with `role: 'admin'`
- ✅ `loginAsAdmin()` helper function working
- ✅ No localStorage user manipulation in admin tests
- ✅ Deprecated `setupMockUser()` removed
- ✅ Documentation updated (this file moved to PLAN.md as completed)

## Related Issues

- **Security:** Admin role must be stored in Firestore users collection
- **Firestore Rules:** Verify admin checks work: `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'`
- **Test Data:** Admin test user needs at least 3-4 regular users to test bulk operations

## References

- Working E2E test: `tests/e2e/01-full-user-journey.spec.ts` (uses Firebase Auth correctly)
- Test utilities: `tests/utils/timelineTestHelper.ts`
- Firebase Auth setup: `src/services/auth.ts`
- Admin panel code: `src/pages/AdminPage.tsx`

---

**Next Steps:** Implement this guide in PLAN.md v0.5.6 Phase 3 or v0.5.7
