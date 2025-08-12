# Development Plan

## Ongoing (sorted by priority, then chronological)

P0 — Milestone 9: Architecture Split & Modularization
- Context: `Timeline.tsx` and `App.tsx` have grown large. Split along natural seams without changing behavior, DOM order, or selectors.
- Checklist
  - [x] Step 1: Extract overlays and focus trap
    - [x] Create `src/app/OverlayShell.tsx` (role=dialog, pointer-events logic)
    - [x] Create panels in `src/app/panels/`: `OutlinePanel.tsx`, `EditorPanel.tsx`, `CreatePanel.tsx`, `DevPanel.tsx`
    - [x] Add `src/app/hooks/useFocusTrap.ts` and wire into OverlayShell
  - [x] Step 2: Extract Node from Timeline
    - [x] Move memoized Node to `src/timeline/Node/Node.tsx` (keep clipPath/foreignObject)
    - [x] Preserve `data-event-id` and drag/keyboard handlers
  - [x] Step 3: Extract SvgDefs and Axis
    - [x] `src/timeline/SvgDefs.tsx` (gradient, filters) rendered inside same SVG
    - [x] `src/timeline/Axis.tsx` (render ticks/labels only; keep tick math in Timeline)
  - [x] Step 4: Extract RangeBar and CreateAffordance
    - [x] `src/timeline/RangeBar.tsx`
    - [x] `src/timeline/CreateAffordance.tsx`
  - [x] Step 5: Extract hooks and utils
    - [x] `src/timeline/hooks/useAxisTicks.ts` (with fallback ticks)
    - [x] `src/timeline/hooks/useLanes.ts`
    - [x] `src/lib/time.ts`
    - [x] `src/lib/text.ts`
  - [x] Step 6: App libs and hooks
    - [x] `src/lib/storage.ts` (debounced save; drag guard)
    - [x] `src/lib/devSeed.ts`
    - [x] `src/app/hooks/useViewWindow.ts`
    - [x] `src/app/hooks/useAnnouncer.ts`
    - [x] Integrate storage + hooks into `App` (replace inline impl)
    - [x] Manual verification + Playwright pass after integration
  - [x] Step 7: Introduce style tokens
    - [x] `src/styles/tokens.css` (CSS variables for palette/sizes)
    - [x] Replace hardcoded background gradient + focus/axis colors with variables
    - [x] Begin replacing remaining hardcoded colors (panels/buttons/anchors staged for later refinement)
    - [x] Establish spacing/radius token scaffold
    - [x] Add follow-up documentation task to VISUALS.md (will expand in Milestone 10)
- Test guardrails
  - [x] Preserve DOM order and all `data-testid` values: `axis-tick`, `axis-label`, `range-bar`, `range-start`, `range-end`, `anchor-date`, `card-description`, `create-plus`
  - [x] Keep `data-event-id` on anchors; maintain `body[data-dragging]` and overlay pointer-events behavior
  - [x] Run Playwright after each step; commit per step (current: 24/24 passing post-Step6 integration)
- Status: Milestone 9 complete (Steps 1–7). All tests green (24/24). Minor ticks enhancement from P2 implemented.

P1 — Milestone 8 (remaining polish)
- [ ] Multi-line clamp for long titles/descriptions with tooltip on hover and/or expand-on-select; ensure no overflow at any zoom/density.
- [x] Focus-visible outline on cards and anchors for keyboard users; clear visual focus state distinct from selection.
- [x] Clamp keyboard nudge to domain boundaries (min/max of padded domain) to avoid impossible dates.
- [x] Ensure ≥32px effective hit area for keyboard/mouse on anchors/cards (consider invisible hit-targets).

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

### Milestone 3: Event Editing & Deletion
- [x] Select, edit, delete; drag nodes along track to change date; tests added.

### Milestone 2: Event Creation
- [x] Data model; add form; persist to localStorage; render on timeline; tests added.

### Milestone 1: Project Scaffold
- [x] Vite + React + TS + Tailwind; baseline styles; initial SVG timeline; initial smoke test.

