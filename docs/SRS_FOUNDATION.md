# Chronochart SRS — Foundation & Core Rendering

This fragment captures the foundational rendering guarantees from `SRS.md` in a quick-reference format. Each row keeps the canonical requirement ID plus the implementation and validation touchpoints.

## Requirement Table

| ID | Requirement (summary) | Code | Tests |
|---|---|---|---|
| CC-REQ-FOUND-001 | Timeline axis appears within 1s of startup with ticks and accessibility hooks | `src/layout/DeterministicLayoutComponent.tsx`, `src/App.tsx` | v5/01 |
| CC-REQ-CARDS-001 | Default seed renders balanced cards above/below axis with visible content | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/02 |

## Notes & Change History

- 2025-09-29 — Simplified the fragment to the shared table format for consistency with other SRS sections.
- 2025-09-28 — Documented auto-seeded foundation dataset and enhanced axis test identifiers.
- 2025-09-27 — Extracted the section from `docs/SRS.md` and clarified acceptance criteria.
