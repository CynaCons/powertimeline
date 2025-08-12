# Development Plan

## Ongoing (sorted by priority, then chronological)

P0 — Milestone 10: Visual + Interaction Refinement (spec & implementation)
- Goal: Apply BF6-inspired dark visual language, improve legibility & density handling, overhaul card rendering & editing UX, and enhance temporal scaffolding (grid/separators) while preserving performance & a11y.
- Acceptance (overall): Maintain 24/24 existing tests; add new tests for grid lines, multi-row lanes, editing controls; keep 120-event performance smoke under prior runtime.

Phase A: Axis / Track / Background
- [x] Dark theme background (tokens): introduce dark-neutral ramp; swap current light gradient for dark gray (#111–#1a1d21 range) with subtle vignette. (Implemented via updated tokens + new gradient)
- [x] Slim axis track line: reduce stroke width & lighten opacity; expose token (--cc-axis-line, --cc-axis-line-width). (Axis line now uses tokens & thinner stroke)
- [ ] Temporal separators: render minor/major grid lines (day/week/month/year) adapting to zoom; light gray lines (different opacity per hierarchy) not exceeding performance budget.
- [x] Label scale & placement: reduce date label font size, adjust vertical alignment & padding so labels sit consistently relative to track; ensure ≤12 primary labels rule preserved. (Font size reduced 1.6→1.2, y adjusted)

Phase B: Event Anchors & Connectors
- [x] Anchor restyle: smaller square variant; dark fill + light outline tokens.
- [x] Connector redesign: light neutral gray, reduced stroke width, shorter endpoint square.
- [ ] Hover/selection states: tokenize glow/focus states (selection still uses legacy blue; needs palette alignment + token usage).

Phase C: Card Rendering & Content Architecture
- [ ] Card surface redesign: material-inspired (dark surface, subtle shadow, 1px border, radius) with tokenized spacing (current: partial tokens, legacy geometry still present).
- [ ] Migrate card body from pure SVG text to HTML layer: evaluate per-card absolutely positioned div overlay vs. foreignObject.
- [ ] Dynamic height expansion: auto-expand selected/editing cards (still fixed collapsed/expanded sizes).
- [ ] Truncation modes: refine to 1–2 title lines + 1 body line for non-selected; currently multi-line clamp present but expansion logic incomplete.
- [ ] Inline edit UX overhaul: add tick/cross icon controls (still using Save/Cancel buttons inside foreignObject).
- [ ] Fix description edit artifact (overlapping rounded rectangle) – pending after card refactor.
- [ ] Component injection support: render prop for rich content.

Phase D: Lanes & Vertical Density
- [ ] Expand lane system: 2 above / 2 below explicit vertical bands (currently capped algorithm but visual separation modest).
- [ ] Collision avoidance: adjust layout on expansion.
- [ ] Lane visualization test: to be added.

Phase E: Tokens & Theming
- [ ] Token expansion: replace residual hardcoded panel/button/anchor colors.
- [ ] Focus ring tokens: unify across SVG + HTML (partial: SVG updated; HTML inputs still custom inline styles).
- [ ] Light/dark theme toggle scaffold – stretch.

Phase F: Accessibility & Interaction Quality
- [ ] Comprehensive a11y audit (overlays / tab order / ARIA roles & labels).
- [ ] Live region refinement: edit mode enter/exit announcements.
- [ ] Keyboard drag alternative enhancements.
- [ ] High-contrast mode check.

Phase G: Testing & Tooling
- [ ] New Playwright tests (grid lines, editing controls, multi-row lanes, expanded card content).
- [ ] Performance regression check @150 events.
- [ ] Visual regression scaffold (stretch).

Phase H: Documentation
- [ ] Update `VISUALS.md` (dark palette, axis/grid, lanes, card states, focus styles, tokens).
- [ ] Architecture note: HTML overlay vs SVG for cards.

P1 — Accessibility (carryover)
- [ ] Broader accessibility audit for overlays and controls (ARIA roles/labels completeness, trap edge cases, tab order review). (Consolidated into Phase F but tracked here until done.)

P2 — Documentation (carryover)
- [ ] Document updated palette, connector spec, and component tokens in `VISUALS.md` with screenshots. (Superseded by Phase H but remains until completed.)

Notes
- Maintain 24/24 existing tests green during incremental changes.
- Prioritize low-risk refactors (tokens) before structural card migration.
- Defer stretch goals if core visual & a11y tasks risk schedule.

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

