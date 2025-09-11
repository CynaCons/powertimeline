# ChronoChart Implementation Plan

## Iteration v0.2.0 — Foundation
- Core layout system (half-columns, overflow badges, minimap, cursor-zoom)
- Adaptive timeline scales; overlap prevention across zoom levels
- View-window filtering; directional anchors; leftover anchor fixes
- Test suite cleanup to 33 tests; leftover detection tests
- Max zoom to 0.1%; card color system (blue/green/yellow/purple/red)
- Visual polish: axis, spacing, overflow badge merging, nav rail, minimap

## Iteration v0.2.1 — Layout Unification & Title-only
- Unify layout path around DeterministicLayoutComponent + LayoutEngine
- Mark legacy `src/components/Timeline.tsx` and update ARCHITECTURE.md
- Gate debug logs; tidy console output by default
- Title-only degradation (thresholded)
  - Align width to 260px; capacity 9 per semi-column
  - Telemetry counters added
- Tests
  - v5/48: title-only appears; no overlaps
  - v5/49: width/capacity checks; no overlaps
- SRS updated (Title-only Verified)
- Overlap hardening: final per-side collision resolution pass (Napoleon)

## Iteration v0.2.2 — Tests & UTF-8
- Fix v5/16 (real viewport) to use existing buttons and pass
- Fix v5/46 (degradation reality check) to use Playwright baseURL and tuned waits
- PLAN arrows cleanup (UTF-8 ? ASCII)

## Iteration v0.2.3 — Plan Doc
- Rework PLAN to iteration-based format and update status

## Upcoming v0.3.0
- Performance optimization for large datasets
- Finish degradation system work items
- Advanced telemetry collection
- Memory usage optimization
- Enhanced error handling

## Upcoming v0.4.0
- Multi-event aggregation cards
- Advanced clustering algorithms
- Interactive anchor behaviors
- Mobile/touch support
- Accessibility compliance

## v1.0.0 Goals
- Production-ready performance
- Complete test coverage
- Full accessibility support
- Comprehensive documentation
- Stable API for external use

## R5 — Card sizing & Semi-columns (polish)
- Update card configs: full=260x169, compact=260x78
- Compact 1–2 body lines; full uses multi-line body
- Reduce margins and inter-card spacing
- One anchor per semi-column; no anchors without cards
- Strengthen half-column spacing; ensure no overlaps at any zoom
- Update tests (non-overlap Fit-All, minimap/anchors)

## Backlog
- Performance & robustness: benchmarks, virtualization, zoom stress tests
- Encoding cleanup (residuals in COMPLETED.md/UI strings); CI encoding check
- Extract repeated magic numbers and spacing thresholds to config
- Advanced features: infinite cards, smart clustering, overflow strategies, hover/click behaviors
- Developer experience: slot visualization, layout explanations, profiling, config UI
- Architecture: component extraction, `useLayoutEngine` hook, error recovery, visual regression tests
