# Test 77 Data Mapping

Quick reference showing how the seeded data satisfies each test requirement.

## Test Constants → Seeded Data

| Test Constant | Value | Seeded Data | Location |
|--------------|-------|-------------|----------|
| `KNOWN_TIMELINE_TITLE` | `'French Revolution'` | Timeline: "French Revolution" | `users/cynacons/timelines/timeline-french-revolution` |
| `SECONDARY_TIMELINE_TITLE` | `'Napoleon Bonaparte'` | Timeline: "Napoleon Bonaparte" | `users/cynacons/timelines/timeline-napoleon` |
| `KNOWN_USERNAME` | `'cynacons'` | User: cynacons | `users/cynacons` |
| `EMAIL_FRAGMENT` | `'powertimeline.dev'` | Multiple users with @powertimeline.dev | `users/*` |
| `DESCRIPTION_QUERY` | `'exile'` | Napoleon description contains "exile" | See description below |

## Napoleon Timeline Description

**Required**: Must contain the word "exile"

**Seeded**: `"Rise, exile, and fall of Napoleon from Corsica to Saint Helena"`

✅ Contains "exile" - satisfies test T77.11

## Users with @powertimeline.dev Email

Required for test T77.12 (Search matches user emails)

| User ID | Username | Email |
|---------|----------|-------|
| cynacons | cynacons | cynacons@powertimeline.dev |
| test-user-1 | alice_timeline | alice@powertimeline.dev |
| test-user-2 | bob_history | bob@powertimeline.dev |
| test-user-3 | charlie_events | charlie@powertimeline.dev |

## Test Coverage

| Test ID | Test Name | Required Data | Status |
|---------|-----------|---------------|--------|
| T77.1 | Search finds timelines by title | French Revolution timeline | ✅ Seeded |
| T77.2 | Search finds users by username | User "cynacons" | ✅ Seeded |
| T77.3 | Case-insensitive search | French Revolution timeline | ✅ Seeded |
| T77.4 | Minimum 2 characters validation | Any data (validation test) | ✅ N/A |
| T77.5 | Results categorized | Timelines + Users | ✅ Seeded |
| T77.6 | Clicking result navigates | French Revolution timeline | ✅ Seeded |
| T77.7 | No results message | Any data (negative test) | ✅ N/A |
| T77.8 | Clear button works | Any data (UI test) | ✅ N/A |
| T77.9 | Keyboard shortcut "/" | Any data (UI test) | ✅ N/A |
| T77.10 | Works with/without auth | French Revolution timeline | ✅ Seeded |
| T77.11 | Search matches descriptions | Napoleon with "exile" | ✅ Seeded |
| T77.12 | Search matches emails | Users with @powertimeline.dev | ✅ Seeded |
| T77.13 | Result limits enforced | Multiple results | ✅ Seeded |
| T77.14 | Dropdown show/hide behavior | Any data (UI test) | ✅ N/A |

## Running the Seed Script

```bash
npx tsx scripts/seed-test-77-data.ts
```

## Running the Tests

```bash
# Run all test 77 tests
npx playwright test tests/home/77-search-functionality.spec.ts

# Run specific test
npx playwright test tests/home/77-search-functionality.spec.ts:190 --headed
```
