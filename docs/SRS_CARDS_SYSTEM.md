# Card System & Overflow Management Requirements

This fragment expands on Sections 3 and 4 of the primary `SRS.md`. It captures detailed acceptance criteria, implementation references, and linked tests for the card type system, degradation logic, and overflow management.

## Requirement Table

### Card Type Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-CARD-FULL-001 | Full cards are ~169px tall and show multi-line body without clipping | Full cards have width=260px, height=169px<br> Display title (multi-line), full description, and date<br> No text clipping or truncation in description area<br> Used for low-density timelines (<=2 events per half-column) | `src/layout/config.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/03 |
| CC-REQ-CARD-COMPACT-001 | Compact cards have same width as full (260px), ~92px tall, and show 1-2 description lines | Compact cards have width=260px, height=92px<br> Display title (up to 2 lines), partial description (1 line), and date<br> Description truncated with ellipsis if needed<br> Used for medium-density timelines (3-4 events per half-column) | `src/layout/config.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/03, v5/47 |
| CC-REQ-CARD-TITLE-ONLY-001 | Title-only cards appear when cluster density exceeds compact capacity, with no overlaps | Title-only cards have width=260px, height=32px<br> Display only title and icon (no date, no description)<br> Title displayed in single line with ellipsis truncation<br> Used for high-density timelines (>4 events per half-column)<br> No visual overlaps occur even at maximum density | `src/layout/LayoutEngine.ts`, `src/layout/CardRenderer.tsx` | v5/48 |

### Card Degradation Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-DEGRADATION-001 | Cards automatically degrade from full -> compact -> title-only based on density to prevent overlaps | System analyzes event count per half-column<br> Automatically selects appropriate card type to prevent overlaps<br> Degradation sequence: full (<=2 events) -> compact (3-4 events) -> title-only (>4 events)<br> Degradation decisions are deterministic and consistent<br> **Coordination**: Spatial clusters coordinate degradation per CC-REQ-CLUSTER-COORD-001 | `src/layout/engine/DegradationEngine.ts` | v5/36, v5/37, v5/38, v5/39 |
| CC-REQ-SEMICOL-002 | If a semi-column totals 3-4 events, degrade to compact and show them without overflow; overflow only after visible budget is exceeded | Semi-columns with 3-4 events display all as compact cards<br> No overflow badges appear for 3-4 event groups<br> Overflow badges only appear when event count exceeds card type capacity<br> Visual budget fully utilized before triggering overflow | `src/layout/LayoutEngine.ts`, `src/layout/config.ts` | v5/47 |
| CC-REQ-DEGRADATION-METRICS-001 | System tracks degradation metrics for monitoring and debugging | Telemetry includes: totalGroups, fullCardGroups, compactCardGroups, titleOnlyCardGroups<br> Degradation rate calculated as percentage of degraded groups<br> Space reclaimed metrics show vertical space saved by degradation<br> Degradation triggers logged with before/after card types | `src/layout/engine/DegradationEngine.ts` | v5/05 |

### Cluster-Level Coordination Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-CLUSTER-COORD-001 | Spatial clusters coordinate degradation between above/below half-columns | When events in spatial cluster (same X-region) have overflow in ANY half-column, BOTH half-columns must degrade uniformly<br> Prevents bottom showing full cards while top overflows in same X-region<br> Cluster identification uses X-position proximity matching<br> Degradation decisions made at cluster level, not individual half-column level | `src/layout/engine/DegradationEngine.ts` | v5/67 |
| CC-REQ-MIXED-TYPES-001 | Mixed card types only allowed when spatial cluster has NO overflow | Mixed card types (1 full + 2 compact) can be used ONLY when total cluster events fit without overflow<br> If ANY overflow exists in cluster, uniform degradation must be used<br> System checks cluster-wide overflow before allowing mixed types<br> Ensures consistent visual hierarchy within spatial clusters | `src/layout/engine/DegradationEngine.ts` | v5/67 |
| CC-REQ-MIXED-TYPES-002 | Within mixed card type clusters, chronological priority determines card type | Earlier events receive full cards, later events receive compact/title-only cards<br> Card type degradation follows chronological order (earliest = best)<br> Ensures important/early events maintain maximum information density<br> Consistent prioritization across all spatial clusters | `src/layout/engine/DegradationEngine.ts` | v5/67 |

### Visual Layout Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-LAYOUT-XALIGN-001 | Cards within the same half-column must maintain exact X-alignment throughout all layout operations | All cards in a half-column positioned at group.centerX (deterministic)<br> Collision resolution must NOT horizontally displace cards within same half-column<br> Only cards from DIFFERENT half-columns may be nudged horizontally to prevent overlap<br> X-alignment must be deterministic with ZERO tolerance (no approximation)<br> Above and below half-columns do NOT need to align with each other | `src/layout/engine/PositioningEngine.ts` | v5/68, v5/69 |

### Overflow Management Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-OVERFLOW-001 | Navigating to an empty period shows no leftover overflow badges | When navigating to timeline area with no events, no overflow badges render<br> Overflow badges filtered by view window to prevent stale indicators<br> Only anchors with visible cards or in-view overflow events render badges<br> System cleans up overflow state when zooming/panning | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/30 |
| CC-REQ-OVERFLOW-002 | Overflow reduces/disappears appropriately when zooming out | Zooming out increases available space and reduces overflow count<br> Overflow badges update dynamically as zoom level changes<br> Overflow may disappear completely if all events fit after zoom out<br> Overflow count accurately reflects hidden events at current zoom | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/30 |
| CC-REQ-OVERFLOW-003 | When events exceed capacity, overflow badges (+N) appear showing hidden event count | Overflow badges display "+N" format where N is count of hidden events<br> Badge count includes both primary overflow and degraded overflow events<br> Badges positioned relative to anchor points<br> Badge visibility tied to anchor visibility (no orphaned badges) | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/56 |
| CC-REQ-OVERFLOW-004 | Overflow indicators maintain minimum spacing to prevent visual overlap | Nearby overflow badges are merged to prevent visual crowding<br> Merged badges show combined count of all included overflows<br> Merged badge positioned at centroid of component badge positions<br> Minimum spacing threshold prevents badge collision | `src/layout/DeterministicLayoutComponent.tsx` | v5/15 |

### Capacity Management Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-CAPACITY-001 | System reports total/used cells and utilization metrics for monitoring | Capacity model tracks slot usage per half-column and per side<br> Metrics include: total slots, used slots, utilization percentage<br> Separate tracking for above/below timeline sections<br> Real-time capacity reporting for developer tools | `src/layout/LayoutEngine.ts`, `src/layout/CapacityModel.ts` | v5/05 |
| CC-REQ-CAPACITY-SLOTS-001 | Slot allocation follows fixed rules based on card type | Full cards: 2 slots per half-column<br> Compact cards: 4 slots per half-column<br> Title-only cards: 8 slots per half-column<br> Slot counts are deterministic and consistent across all timelines | `src/layout/engine/DegradationEngine.ts` | v5/03, v5/48 |
| CC-REQ-CAPACITY-INDEPENDENT-001 | Above and below timeline sections have independent capacity tracking | Above section capacity calculated independently from below section<br> Different card types can be used simultaneously (above=compact, below=full)<br> Capacity exhaustion in one section doesn't affect the other<br> Each section optimizes space usage independently<br> **Exception**: Degradation decisions coordinate at spatial cluster level per CC-REQ-CLUSTER-COORD-001 | `src/layout/LayoutEngine.ts` | v5/12 |

## Implementation Notes

### Card Type Selection Logic

The degradation engine uses event count to determine card type:

```typescript
// From DegradationEngine.ts
if (eventCount <= 2) {
 return 'full'; // 1-2 events: full cards
} else if (eventCount <= 4) {
 return 'compact'; // 3-4 events: compact cards
} else {
 return 'title-only'; // 5+ events: title-only cards
}
```

### Mixed Card Type Scenarios

**Current Implementation**: Uniform degradation (all cards in a half-column use the same card type)

**Future Enhancement**: Mixed card types within spatial clusters when certain conditions are met

#### When Mixed Types Are Allowed (Future)

Mixed card types can be used ONLY when a spatial cluster meets ALL these conditions:

1. **Zero Overflow**: No overflow in either above OR below half-columns
2. **Space Available**: Sufficient vertical space to accommodate mixed heights
3. **Event Count**: 3-5 events where mixed types provide better information density
4. **Chronological Priority**: Earlier events receive full cards, later events degrade

#### Example Scenarios

| Scenario | Above Events | Below Events | Cluster Overflow? | Card Types | Reasoning |
|----------|--------------|--------------|-------------------|------------|-----------|
| **Scenario 1: No Overflow** | 3 events (2024-01-01, 01-02, 01-03) | 0 events | NO | Above: 1 full + 2 compact | Safe to use mixed types - no overflow in cluster |
| **Scenario 2: Overflow Above** | 5 events (overflows) | 2 events | YES | Above: 5 title-only<br>Below: 2 full | Uniform degradation - overflow forces title-only above |
| **Scenario 3: Overflow Below** | 2 events | 5 events (overflows) | YES | Above: 2 compact<br>Below: 5 title-only | Cluster coordination - overflow below forces degradation |
| **Scenario 4: Both Overflow** | 6 events (overflows) | 7 events (overflows) | YES | Above: title-only<br>Below: title-only | Uniform title-only due to cluster overflow |
| **Scenario 5: Sparse Cluster** | 1 event | 1 event | NO | Above: 1 full<br>Below: 1 full | Full cards when plenty of space available |

#### Critical Rule: Cluster Coordination

> **Spatial clusters must coordinate overflow checking across above/below half-columns.**
>
> If the above half-column has overflow, the below half-column must also consider this when selecting card types, even if the below section has available space. This prevents visual inconsistency where one side shows full cards while the other is overflowing.

**Anti-Pattern (Bug):**
```
X-Region 500px:
  Above: 5 events → overflowing → showing title-only cards (correct)
  Below: 2 events → no overflow → showing full cards (WRONG!)
  ❌ Visual inconsistency - bottom shows luxury while top is cramped
```

**Correct Pattern:**
```
X-Region 500px:
  Above: 5 events → cluster has overflow
  Below: 2 events → cluster has overflow
  ✅ Both degrade uniformly (title-only or compact based on total cluster density)
```

### Overflow Event Management

Overflow events are stored separately from visible events:

- **Primary Events**: Events that fit within card capacity and are displayed
- **Overflow Events**: Events that exceed capacity, stored in `group.overflowEvents` array
- **View Window Filtering**: Overflow events filtered by visible time window to prevent leftover badges

### Badge Merging Strategy

Overflow badges use spatial proximity merging:

1. Identify badges within minimum spacing threshold
2. Group nearby badges into merge candidates
3. Calculate centroid position for merged badge
4. Display single badge with combined count

This prevents visual clutter when multiple half-columns have overflow in close proximity.

## Test Coverage

### Card Degradation Tests
- **v5/36-card-degradation-system.spec.ts**: Core degradation system validation
- **v5/37-degradation-system-validation.spec.ts**: Degradation edge cases
- **v5/38-degradation-with-real-data.spec.ts**: Real-world data degradation
- **v5/39-simple-degradation-test.spec.ts**: Simple degradation scenarios
- **v5/47-jfk-fitall-overflow-semi.spec.ts**: Semi-column degradation thresholds
- **v5/48-title-only-degradation.spec.ts**: Title-only card triggering
- **v5/49-title-only-capacity-and-width.spec.ts**: Title-only capacity validation

### Overflow Management Tests
- **v5/13-overflow-logic.spec.ts**: Overflow calculation logic
- **v5/15-overflow-label-overlap.spec.ts**: Overflow badge spacing
- **v5/30-leftover-overflow-detection.spec.ts**: Leftover overflow prevention
- **v5/31-aggressive-leftover-detection.spec.ts**: Comprehensive leftover detection
- **v5/32-view-window-overflow-bug.spec.ts**: View window overflow filtering
- **v5/56-overflow-indicators-visibility.spec.ts**: Overflow badge visibility

### Capacity Management Tests
- **v5/05-capacity-model.spec.ts**: Capacity tracking and metrics
- **v5/03-non-overlap-fit.spec.ts**: Zero-overlap guarantee validation

## Notes & Change History

- 2025-10-01 Initial extraction from `docs/SRS.md` and consolidation of card-related requirements
- 2025-10-01 Documented current implementation: Compact cards are 92px (updated from 78px in v0.2.5.1)
- 2025-10-01 Added CC-REQ-CAPACITY-SLOTS-001 and CC-REQ-CAPACITY-INDEPENDENT-001 for slot allocation rules
- 2025-10-01 Added CC-REQ-DEGRADATION-METRICS-001 for telemetry tracking
- 2025-10-01 Documented overflow badge merging strategy from DeterministicLayoutComponent.tsx
