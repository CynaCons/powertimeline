# Development Plan

## Milestone 1: Project Scaffold
- [x] Initialize React + TypeScript + Tailwind project using Vite.
- [x] Configure Tailwind and basic styles.
- [x] Add placeholder timeline component rendered with SVG.
- [x] Set up Playwright smoke test verifying the app loads and displays.

## Milestone 2: Event Creation
- [x] Define event data model (date and description).
- [x] Build form to add new events.
- [x] Persist events in browser local storage.
- [x] Render saved events on the timeline.
- [x] Add Playwright test covering event creation and persistence.

## Milestone 3: Event Editing & Deletion
- [x] Select an event to modify its text or date.
- [x] Remove events from the timeline.
- [x] Reorder events via drag and drop (drag node along track → snaps to day).
- [x] Add Playwright tests for edit/delete/reorder.

## Milestone 4: Timeline Navigation
- [x] Implement basic zoom (in/out) and pan of view window.
- [x] Ensure smooth performance with around 100 events displayed.
  - [x] Commit-on-drop: during drag, preview position only; update state on mouseup.
  - [x] Label density control: hide non-selected labels when count > 40; show on hover/selection.
  - [x] Debounced persistence: debounce localStorage writes (e.g., 300ms) and only write on drop for drag.
  - [x] Avoid unnecessary resorting/renders: compute sorted list via useMemo; don’t change event array during drag.
  - [x] Optional: extract memoized Node component to minimize re-renders.
  - [x] Add perf smoke test: render 120 events and ensure interactions don’t time out.

## Milestone 5: Export & Sharing
- [ ] Export timeline data for sharing or embedding.

## Milestone 6: UI & UX Overhaul (prioritized)
Order reflects priority (top = highest). Items are grouped by theme; each has an explicit priority label.

### Interaction & Controls
- [ ] (P0) Mouse wheel zoom: zoom in/out with wheel at cursor focus; smooth scaling; trackpad-friendly; with a11y-safe defaults and no accidental zooming.
- [ ] (P0) Keyboard shortcuts: +/- to zoom; arrow keys to pan; Home/End to jump to extremes; provide tooltip hints.
- [ ] (P0) Auto-zoom (Fit all): one-click control to fit all events into view; also trigger after seeding dev data.
- [ ] (P1) Maintain center-on-cursor while zooming; clamp to domain; preserve min/max zoom.

### Layout & Panels
- [ ] (P0) Center the timeline in the viewport container (both horizontally and vertically at typical heights).
- [ ] (P1) Outline/Minimap panel (right side): chronological list of events; title emphasized, date subdued; click selects; sync selection both ways; optional filter field.
- [ ] (P1) Editor drawer (right side): slide-out panel containing current form; toggle visibility to minimize main UI impact.
- [ ] (P1) Left rail (icon toolbar): toggles for Outline, Editor, Developer Options; tooltips and aria-labels for a11y.

### Visual Design
- [ ] (P0) Selection styling: remove heavy focus ring; indicate selection via color/stroke/shadow without harming keyboard focus (use :focus-visible for outlines).
- [ ] (P0) Stem rendering: stems start at the node boundary, not inside the square; visually align join precisely.
- [ ] (P1) Metallic/modern theme pass: refined gray palette, subtle gradients/shadows/borders to evoke BF/Detroit/Bond UI vibe; update VISUALS.md with the style system.
- [ ] (P2) Connector aesthetics: experiment with chevrons/anchors, soft shadows, and anti-aliasing to improve legibility at high density.

### Cards & Inline Editing
- [ ] (P1) Card UI for events on the timeline: collapsed card shows summary; selected card expands.
- [ ] (P1) Editable card: allow editing directly in the expanded card; keep drawer editor as secondary path.
- [ ] (P2) Density management: only expand on selection/hover; consider virtualization or fading for large counts.

### Dev Tools
- [ ] (P1) Move Developer Options into a panel toggled from the left rail.
- [ ] (P2) Add more seed presets (e.g., clustered dates, long-range timelines) for stress testing.

### QA & Tests
- [ ] (P0) Wheel zoom smoke test: verify zoom at cursor and bounds clamping.
- [ ] (P0) Auto-fit test: clicking Fit All shows all events (no nodes off-screen).
- [ ] (P1) Outline panel test: selecting a list item selects the corresponding timeline node, and vice versa.
- [ ] (P1) Editor drawer test: toggle drawer, edit an event, changes persist.
- [ ] (P1) Left rail toggles test: buttons show/hide panels; app remains responsive.
- [ ] (P2) Card expand/collapse test: summary vs expanded content; inline edit works.

Notes
- Keep performance budget for ~120 visible events; re-check after each visual/interaction addition.
- Update VISUALS.md as the metallic theme and components solidify; ensure contrast ratios meet WCAG AA.

