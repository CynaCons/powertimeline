# UI Audit Checklist

This document provides a systematic checklist for auditing the PowerTimeline UI. Use this to identify visual bugs, inconsistencies, overlaps, and unprofessional elements.

## Audit Process

For each area, the auditor should:
1. Open the relevant page/component in the browser
2. Test in both light and dark themes
3. Test at multiple viewport sizes (mobile, tablet, desktop, large desktop)
4. Document any issues found with screenshots if possible
5. Note the file location and suggested fix

## Issue Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| Critical | Broken functionality, major overlap, unusable | Fix immediately |
| High | Visible to most users, looks unprofessional | Fix before launch |
| Medium | Noticeable on inspection, minor visual issue | Fix if time permits |
| Low | Nitpick, subjective preference | Backlog |

---

## 1. Canvas/Editor Audit

### 1.1 Event Cards

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Card borders consistent thickness | | | |
| Card shadows appropriate depth | | | |
| Card hover state visible | | | |
| Card selection state clear (not just color) | | | |
| Card text readable (contrast) | | | |
| Card truncation (ellipsis) working | | | |
| Full/Compact/Title-only transitions smooth | | | |
| Card spacing consistent | | | |

### 1.2 Timeline Axis

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Axis line crisp (no blur) | | | |
| Axis labels readable | | | |
| Tick marks aligned with labels | | | |
| Season colors visible but not distracting | | | |
| Axis extends full width | | | |
| No gaps or visual artifacts | | | |

### 1.3 Anchors and Connectors

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Anchor shape consistent | | | |
| Anchor size appropriate | | | |
| Connector lines visible | | | |
| Connector style (dashed/solid) consistent | | | |
| Anchor hover state if any | | | |

### 1.4 Minimap

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Minimap positioned correctly | | | |
| Minimap NOT overlapping cards | | | |
| Viewport indicator visible | | | |
| Event markers visible | | | |
| Click/drag interaction smooth | | | |
| Labels readable | | | |

### 1.5 Breadcrumbs

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Breadcrumbs NOT overlapping cards | | | |
| Breadcrumbs readable | | | |
| Breadcrumb links clickable | | | |
| Separator styling consistent | | | |
| Truncation for long names | | | |
| Z-index above canvas content | | | |

### 1.6 Panels and Overlays

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Panel edges crisp | | | |
| Panel backdrop blur consistent | | | |
| Panel close button visible | | | |
| Panel focus trap working | | | |
| Panel animation smooth | | | |
| Panel not clipped at edges | | | |

### 1.7 User Profile Button (Top-Right)

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Logged-out state clear | | | |
| Logged-in state shows user info | | | |
| Avatar/initials display correctly | | | |
| Dropdown menu aligned | | | |
| Hover state visible | | | |
| Click target adequate (44px) | | | |
| No visual jumping on state change | | | |

---

## 2. Navigation Audit

### 2.1 NavigationRail (Left Sidebar)

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Icons consistent style | | | |
| Icons proper size | | | |
| Active state clear | | | |
| Hover state visible | | | |
| Tooltips appear correctly | | | |
| Spacing between items consistent | | | |
| Bottom utilities section separated | | | |
| Rail width consistent (56px) | | | |

### 2.2 TopNavBar

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Logo/brand aligned left | | | |
| Navigation items centered or right | | | |
| Search bar (if any) styled | | | |
| User menu aligned right | | | |
| Height consistent | | | |
| Responsive collapse behavior | | | |

### 2.3 User Menu Dropdown

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Dropdown positioned correctly | | | |
| Menu items aligned | | | |
| Hover states visible | | | |
| Icons aligned with text | | | |
| Dividers consistent | | | |
| Click outside closes menu | | | |

---

## 3. Pages Audit

### 3.1 HomePage

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Section headers aligned | | | |
| Card grid consistent gaps | | | |
| Cards same height in row | | | |
| Empty states styled | | | |
| Loading skeletons match content | | | |
| Statistics cards aligned | | | |
| "See all" links visible | | | |

### 3.2 UserProfilePage

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Header/banner proportional | | | |
| Avatar positioned correctly | | | |
| Username/stats readable | | | |
| Tabs (if any) styled consistently | | | |
| Timeline grid matches HomePage | | | |
| Edit profile button visible (owner) | | | |

### 3.3 SettingsPage

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Form labels aligned | | | |
| Input fields consistent width | | | |
| Section headers clear | | | |
| Buttons styled consistently | | | |
| Success/error messages styled | | | |
| Form spacing consistent | | | |

### 3.4 LandingPage

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Hero section impactful | | | |
| CTA buttons prominent | | | |
| Feature cards aligned | | | |
| Roadmap section readable | | | |
| Footer links organized | | | |
| Responsive behavior smooth | | | |

### 3.5 AdminPage

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Tab navigation styled | | | |
| Data tables aligned | | | |
| Action buttons visible | | | |
| Stats dashboard readable | | | |
| Confirmation dialogs styled | | | |

---

## 4. Cross-Cutting Concerns

### 4.1 Theme Consistency

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| All text readable (contrast ratio) | | | |
| All backgrounds use CSS variables | | | |
| No hardcoded colors | | | |
| Borders visible in both themes | | | |
| Icons visible in both themes | | | |
| Shadows appropriate for theme | | | |

### 4.2 Focus States (Accessibility)

| Check | Component | Notes |
|-------|-----------|-------|
| Focus ring visible | Buttons | |
| Focus ring visible | Links | |
| Focus ring visible | Inputs | |
| Focus ring visible | Cards | |
| Tab order logical | All pages | |

### 4.3 Loading States

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Skeleton cards match real cards | | | |
| Loading spinners consistent | | | |
| Skeleton animation smooth | | | |
| No layout shift on load | | | |

### 4.4 Error States

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Error messages readable | | | |
| Error icons consistent | | | |
| Retry actions available | | | |
| Error boundaries styled | | | |

### 4.5 Toast Notifications

| Check | Light | Dark | Notes |
|-------|-------|------|-------|
| Positioned consistently | | | |
| Not overlapping content | | | |
| Dismiss button visible | | | |
| Animation smooth | | | |
| Different types (success/error/info) distinct | | | |

---

## 5. Z-Index Audit

Components should layer correctly:

| Layer | Z-Index Range | Components |
|-------|---------------|------------|
| Base content | 0-10 | Cards, axis, canvas |
| Floating UI | 10-20 | Tooltips, dropdowns |
| Panels | 20-50 | Side panels, overlays |
| Modals | 50-100 | Dialogs, confirmation |
| Toasts | 100+ | Notifications |

Check for:
- [ ] Minimap does not overlap cards incorrectly
- [ ] Breadcrumbs above canvas content
- [ ] Panels above main content
- [ ] Modals above panels
- [ ] Toasts above everything

---

## 6. Viewport-Specific Checks

### Mobile (375px)

- [ ] No horizontal scroll
- [ ] Touch targets 44px minimum
- [ ] Text readable without zoom
- [ ] Navigation accessible
- [ ] Forms usable

### Tablet (768px)

- [ ] Layout adapts appropriately
- [ ] Cards resize or reflow
- [ ] Navigation still usable
- [ ] No awkward whitespace

### Desktop (1920px)

- [ ] Content well-distributed
- [ ] No excessive whitespace
- [ ] All features accessible

### Large Desktop (2560px+)

- [ ] Content scales appropriately
- [ ] Card grids fill space
- [ ] No content feeling "lost"

---

## Issue Template

When documenting an issue, use this format:

```
## [Severity] Issue Title

**Location:** Page/Component name
**File:** src/path/to/file.tsx
**Viewport:** All / Mobile / Desktop / etc.
**Theme:** Light / Dark / Both

**Description:**
What is wrong and why it looks unprofessional.

**Expected:**
What it should look like.

**Screenshot:** (if applicable)

**Suggested Fix:**
CSS change, component restructure, etc.
```

---

## Audit Execution

For subagents performing the audit:

1. Start the dev server: `npm run dev`
2. Open browser at `http://localhost:5173`
3. Use DevTools to switch viewport sizes
4. Use DevTools to toggle dark/light mode
5. Systematically go through each section
6. Document all issues found
7. Prioritize by severity
8. Create fix tasks in PLAN.md or GitHub issues
