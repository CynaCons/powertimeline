# Documentation Consistency Fixes - v0.7.13

**Date:** 2025-12-10
**Scope:** Deduplicate requirements, update metrics, re-audit SRS_INDEX.md

## Analysis Summary

### Requirement Counts
- **Actual unique requirements:** 342 (not 267 or 177)
- **Total requirement mentions:** 531 (includes test traceability tables)
- **True duplicates:** 25 requirement IDs defined in multiple files

### Test Counts
- **Playwright E2E tests:** 320 tests in 112 spec files
- **Vitest unit tests:** 58 tests
- **Total automated tests:** 378 tests

### Issues Found

#### 1. Duplicate Requirement Definitions (25 duplicates)
These requirements are defined in BOTH `SRS.md` and specialized SRS files:

**Foundation & Core (2 duplicates):**
- CC-REQ-FOUND-001: SRS.md:19 + SRS_FOUNDATION.md:9
- CC-REQ-CARDS-001: SRS.md:20 + SRS_FOUNDATION.md:10

**Card System (6 duplicates):**
- CC-REQ-DEGRADATION-001: SRS.md:38 + SRS_CARDS_SYSTEM.md:19
- CC-REQ-SEMICOL-002: SRS.md:37 + SRS_CARDS_SYSTEM.md:20
- CC-REQ-OVERFLOW-001: SRS.md:46 + SRS_CARDS_SYSTEM.md:41
- CC-REQ-OVERFLOW-002: SRS.md:47 + SRS_CARDS_SYSTEM.md:42
- CC-REQ-OVERFLOW-003: SRS.md:48 + SRS_CARDS_SYSTEM.md:43
- CC-REQ-OVERFLOW-004: SRS.md:49 + SRS_CARDS_SYSTEM.md:44
- CC-REQ-CAPACITY-001: SRS.md:50 + SRS_CARDS_SYSTEM.md:50

**Zoom (3 duplicates):**
- CC-REQ-ZOOM-001: SRS.md:67 + SRS_ZOOM.md:9
- CC-REQ-ZOOM-002: SRS.md:68 + SRS_ZOOM.md:10
- CC-REQ-ZOOM-003: SRS.md:69 + SRS_ZOOM.md:11

**Layout (4 duplicates in SRS_HOME_PAGE.md - likely copy/paste error):**
- CC-REQ-LAYOUT-001: SRS_HOME_PAGE.md:123 + SRS_LAYOUT.md:9
- CC-REQ-LAYOUT-002: SRS_HOME_PAGE.md:124 + SRS_LAYOUT.md:11
- CC-REQ-LAYOUT-003: SRS_HOME_PAGE.md:125 + SRS_LAYOUT.md:12
- CC-REQ-LAYOUT-004: SRS_HOME_PAGE.md:126 + SRS_LAYOUT.md:13

**User Profiles (4 duplicates):**
- CC-REQ-USER-001: SRS_HOME_PAGE.md:96 + SRS_USER_PAGE.md:11
- CC-REQ-USER-002: SRS_HOME_PAGE.md:97 + SRS_USER_PAGE.md:12
- CC-REQ-USER-003: SRS_HOME_PAGE.md:98 + SRS_USER_PAGE.md:13
- CC-REQ-USER-004: SRS_HOME_PAGE.md:99 + SRS_USER_PAGE.md:14

**Timeline CRUD (3 duplicates):**
- CC-REQ-CREATE-001: SRS.md:141 + SRS_TIMELINE_CREATION.md:27
- CC-REQ-EDIT-001: SRS.md:143 + SRS_TIMELINE_CREATION.md:42
- CC-REQ-DELETE-001: SRS.md:144 + SRS_TIMELINE_CREATION.md:52

**Data Management (2 duplicates):**
- CC-REQ-DATA-001: SRS.md:105 + SRS_HOME_PAGE.md:132
- CC-REQ-DATA-002: SRS.md:106 + SRS_HOME_PAGE.md:133

#### 2. Incorrect Metrics in README.md
Current:
```markdown
- **Requirements:** ~177 total
- **Tests:** 287 Playwright tests
```

Should be:
```markdown
- **Requirements:** ~342 total (see [SRS Index](docs/SRS_INDEX.md))
- **Tests:** 320 Playwright tests + 58 unit tests = 378 automated tests
```

#### 3. Outdated SRS_INDEX.md
- Version shows v0.6.3 (should be v0.7.13)
- Last Updated shows 2025-12-07 (should be today)
- Requirement counts are underestimated (~267 vs actual ~342)
- Missing new SRS files: SRS_AI_INTEGRATION.md (98 reqs)

## Fix Strategy

### Phase 1: Deduplicate Requirements
**Principle:** Specialized SRS files are authoritative. Remove duplicates from SRS.md.

1. Remove 2 foundation duplicates from SRS.md (keep in SRS_FOUNDATION.md)
2. Remove 6 card system duplicates from SRS.md (keep in SRS_CARDS_SYSTEM.md)
3. Remove 3 zoom duplicates from SRS.md (keep in SRS_ZOOM.md)
4. Remove 4 layout duplicates from SRS_HOME_PAGE.md (keep in SRS_LAYOUT.md)
5. Remove 4 user profile duplicates from SRS_HOME_PAGE.md (keep in SRS_USER_PAGE.md)
6. Remove 3 timeline CRUD duplicates from SRS.md (keep in SRS_TIMELINE_CREATION.md)
7. Remove 2 data management duplicates from SRS.md (keep in SRS_HOME_PAGE.md)

**Result:** Remove 17 duplicates from SRS.md, 8 from SRS_HOME_PAGE.md

### Phase 2: Update Metrics
1. README.md: Update requirement count to ~342, test count to 378
2. PLAN.md: Update test count to 320 Playwright + 58 unit
3. SRS_INDEX.md: Update version, date, requirement counts

### Phase 3: Audit SRS_INDEX.md
1. Add missing feature area: AI Integration (98 requirements)
2. Verify all SRS file links are valid
3. Update requirement counts by feature area
4. Mark any deprecated features

## Files to Modify
- docs/SRS.md (remove 17 duplicates)
- docs/SRS_HOME_PAGE.md (remove 8 duplicates)
- README.md (update metrics)
- PLAN.md (update test counts)
- docs/SRS_INDEX.md (full audit and update)

## Verification Results

### ✅ All Fixes Applied Successfully

**Duplicate Status:**
- Before: 25 duplicate requirement IDs
- After: 0 duplicates

**Build Status:**
- `npm run build` - PASSING ✅

**Final Metrics:**
- Unique Requirements: 340 (was 267)
- Automated Tests: 378 total (320 Playwright E2E + 58 unit)
- Implementation: 59% complete (~200/340)
- Test Coverage: 35% verified (~119/340)

### Files Modified
1. **docs/SRS.md** - Removed 17 duplicate requirement definitions (kept references to specialized files)
2. **docs/SRS_HOME_PAGE.md** - Removed 8 duplicates, renamed 4 to unique IDs (PAGE-LAYOUT-*, HOME-DATA-*)
3. **README.md** - Updated requirement count (177→340) and test count (287→378)
4. **PLAN.md** - Updated metrics dashboard with accurate counts
5. **docs/SRS_INDEX.md** - Updated version (v0.6.3→v0.7.13), date, and feature area table

### Impact Analysis
The requirement count increased from ~267 to ~340 because the documentation was previously underestimating the actual number of unique requirements. New SRS files added in v0.7.x (AI Integration, Stream View, User Pages, Landing Page) were not reflected in the old metrics.

**Percentage Impact:**
- Implementation percentage dropped from 76% to 59% (denominator grew, numerator stayed ~200)
- Coverage percentage dropped from 45% to 35% (denominator grew, numerator stayed ~119)

These percentage drops are NOT regressions - they reflect more accurate accounting. The absolute number of implemented and tested requirements has not changed.
