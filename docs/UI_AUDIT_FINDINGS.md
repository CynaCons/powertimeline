# UI Audit Findings - v0.8.1

**Audit Date:** 2025-12-27
**Status:** Ready for Fixes
**Target Iteration:** v0.8.2

This document contains all UI issues identified during the v0.8.1 audit. Subagents implementing fixes should reference the specific batch sections below.

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 7 | Pending |
| High | 13 | Pending |
| Medium | 24 | Pending |
| Low | 15 | Pending |
| **Total** | **59** | - |

---

## Batch A: Node/Card Theme System

**Files:** `src/timeline/Node/Node.tsx`, `src/timeline/TimelineMarkers.tsx`, `src/components/TimelineMinimap.tsx`

### A1. [Critical] Node Component Not Using Theme System

**File:** `src/timeline/Node/Node.tsx:48-95`
**Theme:** Both

**Problem:** Event cards use hardcoded Tailwind classes (`bg-white`, `text-gray-900`, `text-gray-600`, `border-gray-100`, `shadow-md`) that don't respect the theme system.

**Fix:** Replace Tailwind color classes with inline styles using CSS variables:
```tsx
// Replace:
className="bg-white text-gray-900 border-gray-100"

// With:
style={{
  backgroundColor: 'var(--cc-color-card-bg)',
  color: 'var(--cc-color-card-title)',
  borderColor: 'var(--cc-color-card-border)',
}}
```

Variables to use (from `tokens.css`):
- `--cc-color-card-bg` for background
- `--cc-color-card-title` for title text
- `--cc-color-card-description` for description text
- `--cc-color-card-date` for date text
- `--cc-color-card-border` for borders

### A2. [High] TimelineMarkers Dark Mode Broken

**File:** `src/timeline/TimelineMarkers.tsx:108-154`
**Theme:** Dark

**Problem:** Marker labels use undefined Tailwind classes (`bg-surface`, `border-primary`, `text-primary`) that don't map to actual CSS variables.

**Fix:** Replace with actual CSS variables:
```tsx
// Replace:
className="bg-surface border-primary text-primary"

// With:
style={{
  backgroundColor: 'var(--page-bg-elevated)',
  borderColor: 'var(--page-border)',
  color: 'var(--page-text-primary)',
}}
```

### A3. [Medium] TimelineMinimap Theme Inconsistency

**File:** `src/components/TimelineMinimap.tsx:172-189`
**Theme:** Both

**Problem:** Uses generic Tailwind classes that don't map to CSS variables.

**Fix:** Same approach as A2 - replace with `var(--page-*)` variables.

### A4. [Medium] CreateAffordance Hardcoded Color

**File:** `src/timeline/CreateAffordance.tsx:15-18`
**Theme:** Both

**Problem:** Uses hardcoded `fill="#021f29"` for text.

**Fix:** Replace with `fill="var(--cc-color-axis-label)"` or use `currentColor`.

---

## Batch B: Badge Dark Mode

**Files:** `src/pages/HomePage.tsx`, `src/pages/UserProfilePage.tsx`

### B1. [Critical] Owner Badges Dark Theme Failure

**File:** `src/pages/HomePage.tsx:785, 875, 942, 507`; `src/pages/UserProfilePage.tsx:508`
**Theme:** Dark

**Problem:** Owner badges use `bg-gray-100 text-gray-700` which is invisible in dark mode.

**Fix:** Add dark mode variants:
```tsx
// Replace:
<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">

// With:
<span
  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
  style={{
    backgroundColor: 'var(--card-bg)',
    color: 'var(--page-text-secondary)',
    border: '1px solid var(--card-border)',
  }}
>
```

### B2. [Critical] Visibility Badges Dark Theme Failure

**File:** `src/pages/HomePage.tsx:724-733, 793-802, 883-892, 950-959`; `src/pages/UserProfilePage.tsx:516-525`
**Theme:** Dark

**Problem:** Visibility badges use hardcoded light theme colors without `dark:` variants.

**Fix:** Add dark mode classes:
```tsx
// Public badge:
className="... bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"

// Private badge:
className="... bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"

// Unlisted badge:
className="... bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
```

### B3. [Critical] Statistics Cards Color-Blind Inaccessibility

**File:** `src/pages/HomePage.tsx:813-830`
**Theme:** Both

**Problem:** Statistics rely only on color to distinguish metrics. Color-blind users can't differentiate.

**Fix:** Add icon indicators:
```tsx
<div className="flex items-center gap-2 mb-1">
  <span className="material-symbols-rounded text-lg" style={{ color: '#06b6d4' }}>timeline</span>
  <div className="text-2xl md:text-3xl font-bold" style={{ color: '#06b6d4' }}>{stats.timelineCount}</div>
</div>
```

Icons to use:
- Timelines: `timeline`
- Events: `event`
- Users: `group`
- Views: `visibility`

---

## Batch C: Navigation Theme

**Files:** `src/components/TopNavBar.tsx`, `src/components/UserProfileMenu.tsx`, `src/components/NavigationRail.tsx`

### C1. [Critical] TopNavBar Hardcoded Colors (No Light Theme)

**File:** `src/components/TopNavBar.tsx:25-31, 56-57, 64, 68, 78, 99-100, 103-105, 140-147`
**Theme:** Dark only

**Problem:** Uses hardcoded hex colors that only work in dark mode:
- `#0d1117` (background)
- `#21262d` (border)
- `#8b5cf6` (accent)
- `#e6edf3` (text)
- `#8d96a0` (secondary text)

**Fix:** Replace all hardcoded colors with CSS variables:
```tsx
// Replace:
bgcolor: '#0d1117'        → bgcolor: 'var(--page-bg)'
borderBottom: '#21262d'   → borderColor: 'var(--page-border)'
color: '#8b5cf6'          → color: 'var(--page-accent)'
color: '#e6edf3'          → color: 'var(--page-text-primary)'
color: '#8d96a0'          → color: 'var(--page-text-secondary)'
borderColor: '#30363d'    → borderColor: 'var(--card-border)'
```

### C2. [High] UserProfileMenu Hardcoded Colors

**File:** `src/components/UserProfileMenu.tsx:102-103, 166, 171, 174-175`
**Theme:** Both

**Problem:** Uses undefined CSS variables (`--color-surface`, `--color-border-primary`) and hardcoded colors.

**Fix:**
```tsx
// Line 102-103: Replace with actual variables
backgroundColor: 'var(--page-bg-elevated)',
border: '1px solid var(--page-border)',

// Line 166: Replace hardcoded purple
color: '#8b5cf6' → color: 'var(--page-accent)'

// Lines 171, 174-175: Replace Tailwind gray
className: "text-gray-500" → style={{ color: 'var(--page-text-secondary)' }}
```

### C3. [Medium] NavigationRail Separator Not Theme-Aware

**File:** `src/components/NavigationRail.tsx:212-216`
**Theme:** Both

**Problem:** Separator uses `bg-gray-300` without dark variant.

**Fix:**
```tsx
// Replace:
className="w-8 h-px bg-gray-300 my-2"

// With:
className="w-8 h-px my-2"
style={{ backgroundColor: 'var(--page-border)' }}
```

### C4. [Medium] MUI Button Hover States Not Theme-Aware

**File:** `src/components/NavigationRail.tsx:161-163`
**Theme:** Light only

**Problem:** Uses `grey.100` for hover which is a light mode color.

**Fix:**
```tsx
'&:hover': {
  bgcolor: 'action.hover', // MUI theme-aware
}
```

### C5. [Medium] ThemeToggleButton Hardcoded Hover

**File:** `src/components/NavigationRail.tsx:309-310, 313-314`
**Theme:** Both

**Problem:** Hardcoded white text on hover (`#ffffff`).

**Fix:** Use a CSS variable for guaranteed contrast:
```tsx
e.currentTarget.style.color = 'var(--page-accent-contrast-text, #ffffff)';
```

---

## Batch D: App.tsx Theme Fixes

**File:** `src/app/App.tsx`

### D1. [Critical] AI Preview Glow Hardcoded Blue

**File:** `src/app/App.tsx:1198-1201`
**Theme:** Both

**Problem:** AI panel glow uses hardcoded blue `rgb(59, 130, 246)` instead of theme accent (purple).

**Fix:**
```tsx
style={{
  background: 'linear-gradient(180deg, color-mix(in srgb, var(--page-accent) 25%, transparent) 0%, color-mix(in srgb, var(--page-accent) 15%, transparent) 100%)',
  border: '2px solid var(--page-accent)',
  borderRadius: '12px',
  boxShadow: '0 0 15px color-mix(in srgb, var(--page-accent) 50%, transparent)',
}}
```

### D2. [Critical] Chat FAB Hardcoded Purple

**File:** `src/app/App.tsx:1358-1362`
**Theme:** Both

**Problem:** Chat button uses hardcoded `#8b5cf6`, `#7c3aed`.

**Fix:**
```tsx
bgcolor: chatPanelOpen ? 'var(--page-bg-elevated)' : 'var(--page-accent)',
color: chatPanelOpen ? 'var(--page-text-primary)' : '#ffffff',
boxShadow: '0 4px 20px color-mix(in srgb, var(--page-accent) 40%, transparent)',
'&:hover': {
  bgcolor: chatPanelOpen ? 'var(--page-bg)' : 'var(--page-accent-hover, #7c3aed)',
}
```

---

## Batch E: Error/Offline States

**Files:** `src/pages/EditorPage.tsx`, `src/components/ErrorState.tsx`, `src/components/OfflineIndicator.tsx`

### E1. [High] EditorPage Modal Hardcoded Dark Colors

**File:** `src/pages/EditorPage.tsx:25-53`
**Theme:** Light (broken)

**Problem:** "No timeline selected" modal uses hardcoded dark theme colors.

**Fix:**
```tsx
// Replace:
className="bg-[#161b22] border border-[#30363d]"
// With:
style={{ backgroundColor: 'var(--page-bg-elevated)', borderColor: 'var(--page-border)' }}

// Replace:
className="text-[#8b5cf6]"
// With:
style={{ color: 'var(--page-accent)' }}

// Replace:
className="text-[#e6edf3]"
// With:
style={{ color: 'var(--page-text-primary)' }}
```

### E2. [High] ErrorState Hardcoded Colors

**File:** `src/components/ErrorState.tsx:28-32, 56, 67`
**Theme:** Both

**Problem:** Error icon, link, and button use hardcoded colors.

**Fix:**
```tsx
// Line 28-32: Error icon
style={{
  backgroundColor: 'var(--color-error-50, rgba(239, 68, 68, 0.08))',
  color: 'var(--color-error-500, #ef4444)',
  border: '2px solid var(--color-error-200, rgba(239, 68, 68, 0.3))',
}}

// Line 56: GitHub link
style={{ color: 'var(--page-accent)' }}

// Line 67: Retry button
style={{
  backgroundColor: 'var(--page-accent)',
  color: '#fff',
}}
```

### E3. [High] OfflineIndicator Hardcoded Amber

**File:** `src/components/OfflineIndicator.tsx:22`
**Theme:** Both

**Problem:** Uses hardcoded `bg-amber-500`.

**Fix:**
```tsx
className="fixed bottom-4 left-4 z-50 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
style={{ backgroundColor: 'var(--color-warning-500, #f59e0b)' }}
```

---

## Batch F: Z-Index Standardization

**File:** `src/styles/tokens.css` + multiple component files

### F1. [Medium] Z-Index Values Inconsistent

**Current scattered values:**
- Toast container: 1400
- Stream edit panel: 1500
- Minimap (stream open): 1400
- Minimap (normal): 90
- AuthoringOverlay: 60
- RightPanelShell: 100
- FAB buttons: 200
- Navigation rail: 50
- Offline indicator: 50
- Modal backdrop: 200

**Fix:** Add standardized z-index variables to `tokens.css`:
```css
/* Z-Index Layer System */
--z-canvas: 0;
--z-cards: 10;
--z-anchors: 20;
--z-minimap: 50;
--z-navigation: 60;
--z-panels: 100;
--z-overlays: 500;
--z-modals: 1000;
--z-toasts: 1400;
--z-stream-panel: 1500;
```

Then update components to use these variables.

---

## Batch G: Settings & Danger Zone

**File:** `src/pages/SettingsPage.tsx`

### G1. [High] Danger Zone Hardcoded Red

**File:** `src/pages/SettingsPage.tsx:237-267`
**Theme:** Both

**Problem:** Uses hardcoded `#dc2626`, `#b91c1c`.

**Fix:** Add semantic variables:
```css
/* In tokens.css */
--color-danger: #dc2626;
--color-danger-hover: #b91c1c;
```

Then use in component:
```tsx
style={{
  backgroundColor: 'var(--card-bg)',
  borderColor: 'var(--color-danger)'
}}
```

---

## Batch H: Card Layout Consistency

**Files:** `src/pages/HomePage.tsx`, `src/pages/UserProfilePage.tsx`

### H1. [High] Timeline Card Height Inconsistency

**File:** `src/pages/HomePage.tsx:696, 754, 844, 908`; `src/pages/UserProfilePage.tsx:475`
**Theme:** Both

**Problem:** Cards use `min-h-[140px]` with absolute positioned badges, causing uneven layouts.

**Fix:** Use flexbox for consistent card structure:
```tsx
<div className="cursor-pointer relative flex flex-col h-full pb-10">
  <h3>...</h3>
  <p className="flex-grow line-clamp-2">...</p>
  <div className="mt-auto">...</div> {/* Stats pushed to bottom */}
</div>
```

### H2. [High] Scrollbar Styling Webkit Missing

**File:** `src/pages/UserProfilePage.tsx:463-470`
**Theme:** Both

**Problem:** Firefox scrollbar styled but Webkit (Chrome/Safari/Edge) shows default.

**Fix:** Add to global CSS:
```css
.timeline-grid::-webkit-scrollbar {
  width: 8px;
}
.timeline-grid::-webkit-scrollbar-track {
  background: transparent;
}
.timeline-grid::-webkit-scrollbar-thumb {
  background: var(--page-border);
  border-radius: 4px;
}
```

---

## Batch I: LoginPage Dark Mode

**File:** `src/pages/LoginPage.tsx`

### I1. [Medium] LoginPage Missing Dark Mode

**File:** `src/pages/LoginPage.tsx:291-575`
**Theme:** Light only

**Problem:** Entire page hardcoded to light theme.

**Fix:** Replace all hardcoded colors:
```tsx
bgcolor: '#f6f8fa' → bgcolor: 'var(--page-bg)'
bgcolor: 'white' → bgcolor: 'var(--card-bg)'
border: '1px solid #d0d7de' → border: '1px solid var(--card-border)'
color: '#24292f' → color: 'var(--page-text-primary)'
color: '#656d76' → color: 'var(--page-text-secondary)'
```

---

## Batch J: SVG and Shadow Hardcoded Colors

**Multiple files**

### J1. [Medium] SVG Hardcoded Colors

**Files:**
- `SlotGridVisualizer`: `stroke="#00ff00"` (debug)
- `SvgDefs`: `floodColor="#000"`
- `AnchorBadge`: `fill="#374151"`, `stroke="#f3f4f6"`, `fill="#ef4444"`
- `CardRenderer`: `stroke="#9ca3af"`

**Fix:** Replace with CSS variables or `currentColor`:
```tsx
stroke="var(--cc-color-grid-major)"
```

### J2. [Medium] Shadow Hardcoded Colors

**Files:**
- `ErrorState.tsx:23`: `rgba(0, 0, 0, 0.25)`
- `TimelineMarkers.tsx:127-128`: `rgba(0,0,0,0.15)`
- `DeterministicLayoutComponent.tsx:678-691`: multiple rgba shadows

**Fix:** Use shadow CSS variables from `tokens.css`:
```tsx
boxShadow: 'var(--shadow-lg)'
```

---

## Batch K: Focus States & Accessibility

**Multiple files**

### K1. [Low] Missing Focus States

**Components missing `focus-visible` styles:**
- `EventPreviewList.tsx:84` - Only `focus:outline-none`
- Most MUI IconButton components
- Timeline cards
- Stream event cards

**Fix:** Add global focus style or apply `.timeline-focus-ring` class:
```css
button:focus-visible,
[role="button"]:focus-visible {
  outline: 2px solid var(--page-accent);
  outline-offset: 2px;
}
```

---

## Batch L: Minor Polish

### L1. [Low] Breadcrumb Truncation Missing

**File:** `src/components/Breadcrumb.tsx:40`

**Fix:** Add truncation:
```tsx
className="... max-w-32 truncate"
```

### L2. [Low] Icon Sizing Inconsistent

**File:** `src/components/NavigationRail.tsx:199-200, 262-263`

**Fix:** Add explicit `fontSize: '24px'` to all nav icons.

### L3. [Low] Admin/Profile TimelineIcon Hardcoded

**Files:** `AdminPage.tsx:74,100`, `UserProfilePage.tsx:271,296`, `App.tsx:995`

**Fix:**
```tsx
<TimelineIcon sx={{ fontSize: 28, color: 'var(--page-accent)' }} />
```

### L4. [Low] LandingPage Roadmap Line Visibility

**File:** `src/pages/LandingPage.tsx:534-543`

**Fix:** Slightly lighter color:
```tsx
bgcolor: '#3d4450' // Instead of #30363d
```

---

## Verification Checklist

After fixes, verify:
- [ ] All pages render correctly in light mode
- [ ] All pages render correctly in dark mode
- [ ] No hardcoded hex colors remain in changed files
- [ ] Z-index layering works (toasts > modals > panels > content)
- [ ] Focus states visible for keyboard navigation
- [ ] `npm run build` passes with no errors
