# Development Plan

## Completed (reverse chronological)

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
  - [x] Density-aware vertical lanes (2–4) reduce cluster overlap.
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
- [x] Perf smoke test added.

### Milestone 3: Event Editing & Deletion
- [x] Select, edit, delete; drag nodes along track to change date; tests added.

### Milestone 2: Event Creation
- [x] Data model; add form; persist to localStorage; render on timeline; tests added.

### Milestone 1: Project Scaffold
- [x] Vite + React + TS + Tailwind; baseline styles; initial SVG timeline; initial smoke test.

---

## Ongoing (sorted by priority, then chronological)

P1 — Milestone 8
- [ ] Multi-line clamp for long titles/descriptions with tooltip on hover and/or expand-on-select; ensure no overflow at any zoom/density.
- [ ] Focus-visible outline on cards and anchors for keyboard users; clear visual focus state distinct from selection.
- [ ] Clamp keyboard nudge to domain boundaries (min/max of padded domain) to avoid impossible dates.
- [ ] Ensure ≥32px effective hit area for keyboard/mouse on anchors/cards (consider invisible hit-targets).

P1 — Milestone 7 (follow-up a11y polish)
- [ ] Broader accessibility audit for overlays and controls (ARIA roles/labels completeness, trap edge cases, tab order review).

P2 — Milestone 8
- [ ] Minor ticks (unlabeled) rendered alongside primary labels for context; maintain performance.
- [ ] Data-testid instrumentation for lane groups/index to improve test robustness.
- [ ] Document updated palette, connector spec, and component tokens in VISUALS.md with screenshots.

Notes
- Keep performance budget targeting ~120 visible events; recheck after each visual/interaction addition.
- Update VISUALS.md as the steel/teal theme and attachment components solidify; ensure contrast ≥ WCAG AA.

