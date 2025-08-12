# Development Plan

## Ongoing (sorted by priority, then chronological)

P0 — Milestone 10: Planning & Specification (draft)
- Goal: Consolidate refactor gains (Milestone 9), finalize visual system, and address remaining a11y + documentation gaps prior to new feature surface.
- Pending Inputs: Await product/UX feedback (you) after current UI review.
- Proposed Focus Areas (to refine after feedback):
  - [ ] A11y comprehensive audit (broader overlay/control review – carries forward open P1 item)
  - [ ] Token expansion: replace remaining hardcoded panel/button/anchor colors with CSS variables; spacing/radius application
  - [ ] Documentation: Update `VISUALS.md` with palette, connector spec, lane system diagrams, multi-line clamp behavior, focus styles
  - [ ] Add tests: lane distribution (dense & very dense), multi-line clamp tooltip presence, focus-visible outline keyboard navigation
  - [ ] Performance profiling pass (120+ events) after lane + multi-line additions; budget validation
  - [ ] Export improvements (filename timestamp, optional import) – stretch
  - [ ] Theming groundwork (light/dark token sets) – stretch
  - [ ] Assess persistence abstraction (potential future sync) – note
- Next Step: Incorporate your review notes, then lock scope & convert to concrete checklist.

P1 — Milestone 8 (remaining polish)
- [x] Multi-line clamp for long titles/descriptions with tooltip on hover and/or expand-on-select; ensure no overflow at any zoom/density.
- [x] Focus-visible outline on cards and anchors for keyboard users; clear visual focus state distinct from selection.
- [x] Clamp keyboard nudge to domain boundaries (min/max of padded domain) to avoid impossible dates.
- [x] Ensure ≥32px effective hit area for keyboard/mouse on anchors/cards (consider invisible hit-targets).
- [x] Density-aware vertical lanes (2–4) reduce cluster overlap with capped lane assignment and alternating above/below stacking.
  - Acceptance: With ≥50 events (dense) at least 2 distinct laneIndex values appear; with ≥90 (very dense) up to 4 laneIndex values appear; visual vertical separation noticeable; tests remain green.

P1 — Milestone 7 (follow-up a11y polish)
- [ ] Broader accessibility audit for overlays and controls (ARIA roles/labels completeness, trap edge cases, tab order review).

P2 — Milestone 8 (secondary)
- [x] Minor ticks (unlabeled) rendered alongside primary labels for context; maintain performance.
- [x] Data-testid / instrumentation for lane index (data-lane-index on nodes) to improve test robustness.
- [ ] Document updated palette, connector spec, and component tokens in `VISUALS.md` with screenshots.

Notes
- Keep performance budget targeting ~120 visible events; recheck after each visual/interaction addition.
- Update `VISUALS.md` as the steel/teal theme and attachment components solidify; ensure contrast ≥ WCAG AA.

---

## Completed (reverse chronological)

### Milestone 9: Architecture Split & Modularization
- Objective: Decompose monolithic `App.tsx` / timeline implementation into modular components, hooks, and utilities without altering external behavior or test selectors.
- Steps Completed:
  - Step 1: Overlays & focus trap (`OverlayShell`, panels, `useFocusTrap`)
  - Step 2: Extract `Node` component (memoized, drag/keyboard parity)
  - Step 3: Extract `SvgDefs` and `Axis`
  - Step 4: Extract `RangeBar` and `CreateAffordance`
  - Step 5: Timeline hooks & utils (`useAxisTicks`, `useLanes`, `time`, `text`)
  - Step 6: App libs & hooks (`storage`, `devSeed`, `useViewWindow`, `useAnnouncer`)
  - Step 7: Style tokens (`tokens.css`, background/focus/axis variable integration)
  - Additional: Minor unlabeled ticks (promoted from P2), persistence write-through during drag, lane instrumentation, multi-line clamp & tooltips, capped lane system (2/4 lanes)
- Guardrails: DOM order + data-testids preserved (`axis-tick`, `axis-label`, `range-bar`, `range-start`, `range-end`, `anchor-date`, `card-description`, `create-plus`, `data-event-id`)
- Result: 24/24 Playwright tests passing post-refactor; improved modularity for future features.

### Milestone 8: Card Polish, Density Layout, and Adaptive Axis
- Visual system update (steel/teal + dark attachment cards)
  - [x] Switch connectors to straight line with square endpoints (attachment style).
  - [x] Apply steel/teal track gradient and harmonized axis/label colors.
  - [x] Dark card surfaces with hairline borders and soft shadow.
- Interaction and a11y
  - [x] Overlay/Panel polish: increased transparency; retains blur; legible against canvas.
  - [x] Overlays do not block drag: pointer-events disabled during drag; body[data-dragging] and inline PE toggling.
  - [x] Keyboard nudging: ±1/±7 days with aria-live announcements.
  - [x] Basic dialogs a11y: aria-labelledby, initial focus, simple focus trap.
- Cards and content
  - [x] Prevent text overflow inside cards; tighter typography scale.
  - [x] Card structure polish: header/body divider, mono title, improved spacing.
- Density
  - [x] Density-aware scaling of cards/fonts with clamps.
- Axis, track, and range
  - [x] Thinner center line; adaptive ticks/labels (≤12) by zoom.
  - [x] Visible range bar and explicit start/end markers.
- Create affordance
  - [x] Smaller inline “+” near center line; opens Create with prefilled date.
- Robust drag lifecycle
  - [x] Commit-on-drop; global pointer handlers; preview date shown during drag; label visible during select/drag.
- Tests (green: 24/24)
  - [x] Overlay pointer-events, connectors presence, label density, keyboard nudge with aria-live, performance, background theme, create-plus, Fit All, editor/outline, left rail.

### Milestone 7: Spatial UI Overhaul (BF6-inspired)
- [x] Full-bleed canvas; permanent left icon rail; overlays never cover the rail.
- [x] Translucent dark overlays with blur; compact outline list.
- [x] Smaller anchors; refined connectors (later superseded by attachment style).
- [x] Material-ish cards; inline editing retained.
- [x] Reduced graph typography; digital mono for titles/date meta.
- [x] Quick-close overlays (Esc and click-outside visual layer).
- [x] “+” hover detection window tuned.
- [x] Fit-All animates smoothly to full domain.

### Milestone 6: UI & UX Overhaul
- [x] Wheel zoom at cursor with clamped bounds; keyboard shortcutsa (+/−, arrows, Home/End).
- [x] Centered timeline; outline/editor panels; left rail toggles.
- [x] Selection styling without heavy focus ring; stems start at node boundary.
- [x] Metallic/modern theme pass (precedes later steel/teal refresh).
- [x] Density management: fade non-selected at high density; labels on hover/selection.

### Milestone 5: Export & Sharing
- [x] Export events as JSON.

### Milestone 4: Timeline Navigation
- [x] Zoom/pan view window; performance with ~100–120 events.
- [x] Commit-on-drop; debounced persistence; memoized sorting and Node component.

### Milestone 3: Event Editing & Deletion
- [x] Select, edit, delete; drag nodes along track to change date; tests added.

### Milestone 2: Event Creation
- [x] Data model; add form; persist to localStorage; render on timeline; tests added.

### Milestone 1: Project Scaffold
- [x] Vite + React + TS + Tailwind; baseline styles; initial SVG timeline; initial smoke test.

