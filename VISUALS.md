# Visual Design Spec (Chronochart)

Inspiration: modern industrial/metallic UI with subtle gradients and precise strokes; readable at density.

## 1. Theme (Light, metallic)
- Background: gray-50
- Text: slate-900; secondary slate-600
- Accents: neutral steel gradient (#94a3b8 → #cbd5e1 → #94a3b8)
- Card background: gradient url(#cardMetal) with soft drop shadow cardShadow
- Track: url(#timelineGradient) using metallic gradient

## 2. Nodes
- Default: fill slate-100, stroke slate-400
- Selected: white fill, stroke blue-600, subtle glow selGlow
- Focus-visible: stroke blue-600, strokeWidth 0.6

## 3. Connectors
- Stroke: slate-400, 1px; geometricPrecision; arrowHead marker for anchor aesthetic
- On hover/selection: may increase opacity slightly; optional glow future

## 4. Cards
- Collapsed: 18×4.2 (viewBox units), gradient fill cardMetal, stroke slate-300, shadow cardShadow
- Expanded: 28×8.5; shows date and description; inline edit field via foreignObject

## 5. Accessibility
- aria-label “Event: <date> — <title>” on node group
- Inline editor buttons reachable; stopPropagation on click to avoid closing

## 6. Future polish
- Dark theme variant (from original spec) behind a toggle
- Connector curves/chevrons and nub pointers; card pointer nub
