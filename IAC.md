# Inter Agents Communication (IAC.md)

2025-11-29 09:50 From Tester to Project Leader
  -  Dev admin seeding: node scripts/ensure-test-user-admin.js (test user already admin; seeded timeline-seeded-smoke + event).
  - Home/admin tests: npx playwright test tests/home tests/admin --reporter=list → 36 passed, 27 skipped, 0 failed; skips remain for creation/persistence/visibility flows (T74/T75/T76/T80.2/.4) and some admin
    subtasks (activity log 2-5, bulk ops 2-4, reset-stats charts) pending data/permissions.
  - Production tests: npx playwright test tests/production --reporter=list → 22/22 passing, including new permissions/security coverage (admin denial, unauth writes blocked, private timeline denial, no admin
    UI leakage, read-only checks).
  - DB SRS compliance tests added (dev/prod): tests/db/dev-srs-db.spec.ts, tests/db/prod-srs-db.spec.ts are failing because current data doesn’t match SRS (extra user fields, timelines/events missing required
    id/timelineId). Admin allowlist and activity log enums pass.
  - Next actions recorded: clean Firestore data to SRS (strip legacy fields, ensure required ids/timelineId), seed writable data for creation/persistence flows, rerun tests/db and home/admin suites.
===
