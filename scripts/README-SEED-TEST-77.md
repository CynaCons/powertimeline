# Test 77 Data Seeding Script

## Overview

The `seed-test-77-data.ts` script ensures all required test data exists in the DEV Firestore database for running test 77 (Search Functionality tests).

## Test Requirements

Test 77 (`tests/home/77-search-functionality.spec.ts`) requires the following data to exist:

1. **Timeline: "French Revolution"**
   - Must be searchable by title
   - Must have a public visibility
   - Owned by cynacons user

2. **Timeline: "Napoleon Bonaparte"**
   - Must be searchable by title
   - Description must contain the word "exile" (for description search test T77.11)
   - Must have a public visibility
   - Owned by cynacons user

3. **User: "cynacons"**
   - Username: `cynacons`
   - Email: `cynacons@powertimeline.dev`
   - Must be searchable by username

4. **Additional Users with @powertimeline.dev email**
   - Required for email search test (T77.12)
   - At least 3-4 users with `@powertimeline.dev` domain emails

## Running the Script

```bash
# Seed test 77 data to DEV database
npx tsx scripts/seed-test-77-data.ts
```

## Features

- **Idempotent**: Safe to run multiple times without creating duplicates
- **Merge strategy**: Updates existing documents rather than overwriting
- **Batch operations**: Efficiently handles event subcollections
- **Verification**: Confirms all expected data exists after seeding

## What Gets Seeded

### Users

1. **cynacons** (admin)
   - ID: `cynacons`
   - Email: `cynacons@powertimeline.dev`
   - Username: `cynacons`
   - Role: `admin`

2. **alice_timeline** (user)
   - ID: `test-user-1`
   - Email: `alice@powertimeline.dev`
   - Username: `alice_timeline`
   - Role: `user`

3. **bob_history** (user)
   - ID: `test-user-2`
   - Email: `bob@powertimeline.dev`
   - Username: `bob_history`
   - Role: `user`

4. **charlie_events** (user)
   - ID: `test-user-3`
   - Email: `charlie@powertimeline.dev`
   - Username: `charlie_events`
   - Role: `user`

### Timelines

1. **French Revolution**
   - ID: `timeline-french-revolution`
   - Owner: `cynacons`
   - Description: "Complete chronicle of revolutionary France 1789-1799"
   - Events: Full event set from `seedFrenchRevolutionTimeline()`

2. **Napoleon Bonaparte**
   - ID: `timeline-napoleon`
   - Owner: `cynacons`
   - Description: "Rise, **exile**, and fall of Napoleon from Corsica to Saint Helena"
   - Events: Full event set from `seedNapoleonTimeline()`

## Database Structure

```
users/
  cynacons/
    timelines/
      timeline-french-revolution/
        events/
          <event-id-1>
          <event-id-2>
          ...
      timeline-napoleon/
        events/
          <event-id-1>
          <event-id-2>
          ...
  test-user-1/
  test-user-2/
  test-user-3/
```

## After Seeding

Once the script completes, you can run test 77:

```bash
# Run all search functionality tests
npx playwright test tests/home/77-search-functionality.spec.ts --headed

# Run specific test
npx playwright test tests/home/77-search-functionality.spec.ts:44 --headed
```

## Troubleshooting

### Service Account Not Found

If you see:
```
❌ Service account key not found: powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json
```

**Solution**: Ensure the DEV service account JSON file is in the repository root directory.

### Import Errors

If you encounter module import errors, ensure you're using `npx tsx` to run the script, which handles TypeScript compilation on-the-fly.

### Firestore Permission Errors

Make sure the service account has the necessary permissions:
- `datastore.entities.create`
- `datastore.entities.update`
- `datastore.entities.get`

## Related Files

- `scripts/seed-test-data.ts` - Main test data seeding script (also updated to include "exile" in Napoleon description)
- `src/lib/devSeed.ts` - Timeline event data generators
- `tests/home/77-search-functionality.spec.ts` - The test file that requires this data
- `tests/utils/timelineSeedUtils.ts` - Utility functions for seeding timelines in tests

## Notes

- This script targets the **DEV environment only**
- The main `seed-test-data.ts` script has also been updated to ensure consistency
- All timeline events are sourced from the central `devSeed.ts` file to maintain consistency
