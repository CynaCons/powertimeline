# Visual Design Spec (Chronochart)

Inspiration: node–link layout like Battlefield-style weapon attachments — small, neutral tiles anchored to a central object with thin connectors. Adapted here for a timeline: events are small squares on a track, linked via subtle lines to detail cards.

## 1. Theme
- Color scheme (dark):
  - Background: gray-950 (Tailwind)
  - Text: gray-100 / gray-400 for secondary
  - Accents: gradient from nebula-purple (#6d28d9) to star-blue (#0ea5e9)
- Typography: system sans (Tailwind default). Title size: text-3xl; body: base/sm.
- Elevation: soft shadows on cards; no harsh borders; use subtle 1px separators.

## 2. Layout Structure
- Central timeline track:
  - Horizontal by default (md+). Vertical on narrow screens (<640px).
  - Thickness: 2–3px; gradient stroke (left→right) using accent gradient.
  - Optional tick marks at scale intervals (minor 1px, major 2px).
- Event nodes (the “small squares”):
  - Size: 12×12px (Tailwind: size-3 with device scaling) with 2px ring on hover/active.
  - Shape: square with 2px radius; neutral fill gray-800; border gray-600 at rest.
  - Placement: on the track; z-index above the track.
- Connectors:
  - 1px lines in gray-600 with ~60% opacity; accent glow on hover/selection.
  - Prefer orthogonal (elbow) connectors that route out from the node then to the card edge.
  - Avoid crossing where possible; alternate card sides (top/bottom) to reduce overlap.
- Detail cards (event info):
  - Width: 280–360px; max-w-sm.
  - Background: gray-900; text gray-100; 8px radius; 12–16px padding; shadow-lg/20.
  - Content: title (date + short label), description, optional metadata chips.
  - Anchor nub/arrow (8–10px) pointing toward the connector.

## 3. States and Interactions
- Node states:
  - Rest: gray-800 fill; gray-600 border; 90% opacity.
  - Hover/focus: ring-2 with accent gradient; scale 1.05; cursor-pointer.
  - Selected (pinned): accent border; inner dot (white/gray-200) at 6px.
- Connector behavior:
  - Rest: 1px gray-600/60.
  - Hover (node or card): transition to accent color; faint outer glow; 150ms ease-out.
- Card behavior:
  - Hover preview (desktop): fades in at 95% scale to 100% (120ms); closes on mouseleave unless pinned.
  - Click/Enter to pin; Esc to close.
- Keyboard & a11y:
  - Tab focuses nodes in chronological order; arrow keys navigate prev/next.
  - Enter opens card (aria-expanded=true). Esc closes.
  - Focus ring visible (outline-offset-2) and 3:1 contrast minimum around nodes.
  - Cards have role="dialog" with aria-labelledby and aria-describedby.

## 4. Responsiveness
- <640px (mobile vertical):
  - Track vertical; nodes on the center line.
  - Cards appear right-aligned (LTR) with connectors; if space tight, overlay modal with backdrop.
- ≥640px (desktop horizontal):
  - Cards alternate above/below the track to distribute density.
  - Collision rule: if two cards would overlap, nudge the later card outward by 16–24px and bend connector.

## 5. Motion
- Micro-interactions: 120–200ms ease-out for hover/preview; 200–300ms for pin/unpin.
- Connected transitions: when a card opens from a node, scale/opacity originates at the node position.
- Respect reduced motion (prefers-reduced-motion: reduce) → disable scale/opacity animations.

## 6. Color and Tokens
- Tailwind design tokens:
  - Background: bg-gray-950
  - Track: gradient from #6d28d9 to #0ea5e9 (via SVG linearGradient)
  - Node (default): bg-gray-800 border-gray-600
  - Node (hover/active): ring via from-#6d28d9 to-#0ea5e9 shadow
  - Card: bg-gray-900 text-gray-100 border-gray-800
  - Connector: text-gray-600/60 → accent on hover

## 7. Component Anatomy (ASCII)

Horizontal layout (md+):

  [Card A]
     ┌────────────┐
     │  Title     │
     │  Details…  │
     └──────┬─────┘
            │ connector (1px)
────────────┼──────────────────────── track (2–3px gradient) ─────────────
           [■] node (12×12)
                          │
                       ┌──┴────────────┐
                       │   Card B      │
                       └───────────────┘

Vertical layout (sm):

  [Card]
    │
    │
    ■ node
    │
    │ track
    │

## 8. Density & Readability
- Maximum simultaneous visible pinned cards: 5 (desktop), 2 (mobile) before collapsing into preview mode.
- Truncate long titles to one line with ellipsis; show full in card body.
- Maintain 16–24px gutters between cards; at high density, stack cards with subtle separators.

## 9. Accessibility & Contrast
- Minimum contrast ratios: text 4.5:1; UI strokes 3:1.
- Keyboard flow order is chronological; screen reader labels include date first, then title.
- All interactivity reachable by keyboard; no hover-only functionality.

## 10. Implementation Hints (Tailwind/SVG)
- Track: <svg><line stroke="url(#timelineGradient)" strokeWidth="3"/></svg>
- Node: <button class="size-3 rounded-[2px] bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-offset-2 focus:ring-transparent"/>
- Connector: SVG path with stroke-gray-600/60; on hover, transition stroke to gradient; optional faint drop-shadow.
- Card: div.max-w-sm.rounded-lg.bg-gray-900.shadow-lg/20.p-4; use ::before as pointer nub.
- Z-index: card 30, connector 20, nodes 10, track 0.

## 11. Testable Acceptance Criteria
- Smoke
  - Page has a dark background and visible track.
  - At least N nodes render for loaded events.
- Interaction
  - Hover/focus on a node reveals a connector and a preview card within 200ms.
  - Enter key on a focused node pins the card (aria-expanded=true) and Esc closes it.
- A11y
  - Each node has role="button" with aria-label="Event: <date> – <title>".
  - Cards have role="dialog" with labelledby/ describedby.
- Responsive
  - Below 640px, the layout changes to vertical; cards align to the right and remain within viewport.

## 12. Non-goals (for now)
- Freeform bezier connectors, minimap, and 3D parallax. Keep 2D, minimal, performant.

This spec should guide Milestone 2–4 visuals while remaining feasible with Tailwind v4, React, and simple SVG primitives.
