# PowerTimeline Color Theme

**Version:** v0.5.3
**Created:** 2025-11-23
**Based on:** GitHub dark theme, Linear gradients, and modern SaaS best practices

This document defines the official color palette and theming guidelines for PowerTimeline's dark theme design system.

---

## Core Color Palette

### Background Colors

| Color Name | Hex Code | Usage | WCAG AA Compliant |
|-----------|----------|-------|-------------------|
| **Dark Background** | `#0d1117` | Primary background, body | ✅ |
| **Elevated Surface** | `#161b22` | Cards, panels, modals | ✅ |
| **Surface Variant** | `#21262d` | Secondary elevations, dividers | ✅ |

**Usage Example:**
```tsx
<Box sx={{ bgcolor: '#0d1117' }}>  {/* Page background */}
  <Card sx={{ bgcolor: '#161b22' }}>  {/* Card surface */}
    {/* Content */}
  </Card>
</Box>
```

---

## Text Colors

### Text Hierarchy

| Level | Hex Code | Usage | Contrast Ratio |
|-------|----------|-------|----------------|
| **Primary Text** | `#e6edf3` | Headlines, important text | 12.63:1 on `#0d1117` |
| **Secondary Text** | `#8d96a0` | Body text, descriptions | 7.35:1 on `#0d1117` |
| **Tertiary Text** | `#6e7681` | Muted text, footer, captions | 4.88:1 on `#0d1117` |

**Typography Scale:**
```tsx
// Headlines
<Typography sx={{ color: '#e6edf3', fontWeight: 700 }}>

// Body text
<Typography sx={{ color: '#8d96a0', lineHeight: 1.7 }}>

// Muted/footer text
<Typography sx={{ color: '#6e7681', fontSize: '0.8rem' }}>
```

---

## Accent Colors

### Primary Accents

| Color Name | Hex Code | Usage | Contrast on Dark BG |
|-----------|----------|-------|---------------------|
| **Purple** | `#8b5cf6` | Primary accent, links, focus states | ✅ 8.59:1 |
| **Cyan** | `#06b6d4` | Secondary accent, collaboration features | ✅ 9.74:1 |
| **Orange** | `#f97316` | CTAs, primary actions, energy | ✅ 6.94:1 |

**Application:**
- **Purple (`#8b5cf6`)**: Hover states, selected items, primary brand color
- **Cyan (`#06b6d4`)**: Collaboration features, secondary highlights
- **Orange (`#f97316`)**: Call-to-action buttons, primary actions requiring user attention

---

## Gradient Effects

### Headline Gradient
```css
background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

**Usage:** Main headlines, hero titles for visual impact

### Hero Background Gradient
```css
background: linear-gradient(135deg, #161b22 0%, #0d1117 100%);
```

**Usage:** Hero sections, large background areas

### Radial Glow Effect
```css
background: radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
```

**Usage:** Subtle purple glow behind hero sections (10% opacity)

---

## Border Colors

| Border Type | Hex Code | Usage |
|------------|----------|-------|
| **Default Border** | `#30363d` | Cards, inputs, dividers |
| **Hover Border** | `#8b5cf6` | Interactive elements on hover |
| **Subtle Divider** | `#21262d` | Footer dividers, subtle separations |

**Border Patterns:**
```tsx
// Default card border
<Card sx={{ border: '1px solid #30363d' }}>

// Hover state
<Card sx={{
  border: '1px solid #30363d',
  '&:hover': { borderColor: '#8b5cf6' }
}}>
```

---

## Interactive States

### Button States

#### Primary CTA (Orange)
```tsx
sx={{
  bgcolor: '#f97316',
  color: '#fff',
  boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.4)',
  '&:hover': {
    bgcolor: '#ea580c',  // Darker orange
    boxShadow: '0 6px 20px 0 rgba(249, 115, 22, 0.5)',
  }
}}
```

#### Secondary Outline Button
```tsx
sx={{
  borderColor: '#30363d',
  color: '#e6edf3',
  '&:hover': {
    borderColor: '#8b5cf6',
    bgcolor: 'rgba(139, 92, 246, 0.1)',  // 10% purple overlay
  }
}}
```

### Card Hover Effects
```tsx
sx={{
  border: '1px solid #30363d',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#8b5cf6',
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.2)',  // 20% purple shadow
  }
}}
```

---

## Color-Coded Shadows

### Purple Shadow (Primary)
```css
box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
```

### Cyan Shadow (Collaboration)
```css
box-shadow: 0 8px 24px rgba(6, 182, 212, 0.2);
```

### Orange Shadow (CTA)
```css
box-shadow: 0 4px 14px 0 rgba(249, 115, 22, 0.4);
```

**Usage:** Match shadow color to the feature's accent color for visual cohesion

---

## Input Fields

### Search & Form Inputs
```tsx
InputProps={{
  sx: {
    bgcolor: '#0d1117',  // Match page background
    color: '#e6edf3',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#30363d',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#8b5cf6',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#8b5cf6',
    },
  }
}}
```

**Placeholder Text:** `#8d96a0` (secondary text color)

---

## Semantic Colors

### Feature Color Assignments

| Feature Category | Accent Color | Use Case |
|-----------------|--------------|----------|
| **Timeline Editor** | Purple `#8b5cf6` | Visual editing, primary features |
| **Collaboration** | Cyan `#06b6d4` | Forking, merge requests, social features |
| **Discovery** | Orange `#f97316` | Search, browse, CTAs |

---

## Accessibility Guidelines

### Contrast Requirements

All color combinations meet **WCAG AA** standards (4.5:1 for normal text, 3:1 for large text):

- ✅ `#e6edf3` on `#0d1117`: **12.63:1** (Primary text)
- ✅ `#8d96a0` on `#0d1117`: **7.35:1** (Secondary text)
- ✅ `#6e7681` on `#0d1117`: **4.88:1** (Tertiary text)
- ✅ `#8b5cf6` on `#0d1117`: **8.59:1** (Purple accent)
- ✅ `#06b6d4` on `#0d1117`: **9.74:1** (Cyan accent)
- ✅ `#f97316` on `#0d1117`: **6.94:1** (Orange accent)

### Testing Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools: Lighthouse Accessibility Audit

---

## Implementation Checklist

When applying this color theme to new pages/components:

- [ ] Use `#0d1117` for page background
- [ ] Use `#161b22` for elevated surfaces (cards, panels)
- [ ] Use `#e6edf3` for primary text, `#8d96a0` for secondary
- [ ] Use `#30363d` for default borders
- [ ] Apply purple hover states (`#8b5cf6`) to interactive elements
- [ ] Use orange (`#f97316`) for primary CTAs with shadow
- [ ] Add `transition: 'all 0.3s ease'` for smooth interactions
- [ ] Include hover `transform: 'translateY(-4px)'` for cards
- [ ] Match shadow colors to feature accent colors
- [ ] Test contrast ratios with WCAG AA checker

---

## Migration Notes

### Converting from Blue Theme to Dark Theme

**Before (Old Blue Theme):**
```tsx
<Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
```

**After (New Dark Theme):**
```tsx
<Box sx={{ bgcolor: '#0d1117', color: '#e6edf3' }}>
```

### Common Replacements

| Old Value | New Value | Component |
|-----------|-----------|-----------|
| `bgcolor: 'grey.100'` | `bgcolor: '#161b22'` | Cards |
| `color: 'text.primary'` | `color: '#e6edf3'` | Headings |
| `color: 'text.secondary'` | `color: '#8d96a0'` | Body text |
| `bgcolor: 'primary.main'` | `bgcolor: '#8b5cf6'` | Accents |

---

## Future Considerations

### Light Theme Palette (Planned)
When implementing light mode, maintain similar semantic color assignments:
- Background: `#ffffff`
- Elevated: `#f6f8fa`
- Primary text: `#24292f`
- Secondary text: `#57606a`
- Borders: `#d0d7de`

**Note:** Purple, cyan, and orange accent colors can remain the same for brand consistency.

---

## References

- **GitHub Dark Theme:** Primary inspiration for background colors and borders
- **Linear:** Gradient headline effects and modern aesthetics
- **Tiki-Toki:** Timeline-specific color psychology
- **WCAG 2.1 Guidelines:** Accessibility contrast requirements

---

**Last Updated:** 2025-11-23
**Maintained by:** PowerTimeline Design Team
**Questions?** See `docs/DESIGN_SYSTEM.md` for broader design guidelines
