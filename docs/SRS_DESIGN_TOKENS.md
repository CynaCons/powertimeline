# SRS Design Tokens

**Version:** 1.1
**Date:** 2026-01-05

## Overview
PowerTimeline uses a centralized design token system defined in `src/styles/tokens.css`.
Tokens provide consistent typography, spacing, elevation, transitions, and brand styles across
the app while supporting both dark (default) and light themes.

## Token Categories

### Typography Scale
Font size and line-height pairs for consistent text hierarchy:

| Token | Value | Line Height | Usage |
|-------|-------|-------------|-------|
| `--text-xs` | 0.75rem (12px) | 1rem (16px) | Small labels, metadata |
| `--text-sm` | 0.875rem (14px) | 1.25rem (20px) | Secondary text |
| `--text-base` | 1rem (16px) | 1.5rem (24px) | Body text (default) |
| `--text-lg` | 1.125rem (18px) | 1.75rem (28px) | Large body text |
| `--text-xl` | 1.25rem (20px) | 1.75rem (28px) | H4 headings |
| `--text-2xl` | 1.5rem (24px) | 2rem (32px) | H3 headings |
| `--text-3xl` | 1.875rem (30px) | 2.25rem (36px) | H2 headings |

**Font Weights:**
- `--font-weight-normal`: 400
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700

### Spacing Scale
Scale-based spacing tokens for layout and component padding:

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--space-1` | 0.25rem | 4px | Tight spacing |
| `--space-2` | 0.5rem | 8px | Small gaps |
| `--space-3` | 0.75rem | 12px | Default padding |
| `--space-4` | 1rem | 16px | Standard spacing |
| `--space-6` | 1.5rem | 24px | Medium gaps |
| `--space-8` | 2rem | 32px | Large gaps |
| `--space-12` | 3rem | 48px | Section spacing |
| `--space-16` | 4rem | 64px | Large sections |
| `--space-20` | 5rem | 80px | Extra-large sections |

### Shadows (Elevation Scale)
Elevation tokens for consistent depth and hover states:

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | Minimal depth |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` | Card resting state |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` | Elevated panels |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Dropdowns, modals |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)` | High elevation |
| `--shadow-card-hover` | `0 10px 30px -10px rgba(0,0,0,0.15)` | Card hover state |
| `--shadow-accent-glow` | `0 4px 12px rgba(139,92,246,0.3)` | Accent glow effect |

### Transitions
Duration and easing tokens for consistent animations:

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Quick interactions |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Slower animations |
| `--easing-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Exit animations |
| `--easing-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Smooth transitions |

### Brand Colors
Brand accent colors and gradients:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-beta-orange` | #f97316 | Beta badge |
| `--gradient-brand` | `linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)` | Brand gradient |

## Requirements

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-TOKENS-001 | All design tokens SHALL be defined in `tokens.css` | • Single source of truth for all tokens<br>• No duplicate token definitions in component files<br>• Theme overrides in `tokens.css` only | src/styles/tokens.css | — |
| CC-REQ-TOKENS-002 | Components SHALL reference tokens via CSS variables | • Use `var(--token-name)` instead of hard-coded values<br>• No hard-coded colors, sizes, or shadows in components<br>• Exceptions allowed for one-off calculations only | src/components/*, src/pages/* | — |
| CC-REQ-TOKENS-003 | Typography scale SHALL be used consistently | • Section headings use `--text-2xl` or `--text-3xl`<br>• Body text uses `--text-base`<br>• Secondary text uses `--text-sm`<br>• Line-heights paired with font-sizes | src/styles/tokens.css | — |
| CC-REQ-TOKENS-004 | Spacing scale SHALL be used for layout | • Section gaps use `--space-16` or `--space-20`<br>• Card gaps use `--space-6`<br>• Padding uses `--space-4` through `--space-8`<br>• No arbitrary spacing values | src/styles/tokens.css | — |
| CC-REQ-TOKENS-005 | Elevation scale SHALL be used for shadows | • Cards use `--shadow-sm` for resting state<br>• Cards use `--shadow-card-hover` for hover state<br>• Modals/overlays use `--shadow-lg` or `--shadow-xl`<br>• No hard-coded shadow values | src/styles/tokens.css | — |
| CC-REQ-TOKENS-006 | Theme support SHALL use CSS variable overrides | • Light theme overrides defined in `:root[data-theme="light"]`<br>• Dark theme uses default values<br>• No JavaScript theme switching except for preference storage | src/styles/tokens.css | — |

## Usage Guidelines
- **Reference tokens** via `var(--token-name)` instead of hard-coded values
- **Prefer shared scale tokens** (`--text-*`, `--space-*`, `--shadow-*`) before introducing new ones
- **Use theme-aware variables** from `tokens.css`; avoid duplicating tokens in component files
- **Keep overrides in `tokens.css`** if light theme needs variant values
- **Document new tokens** in this SRS when adding to the system

## Source of Truth
- Design tokens live in `src/styles/tokens.css`
- This SRS documents the token system and requirements
- See `VISUAL_AUDIT_REPORT.md` for token recommendations from visual audit

## Change History
- **2026-01-05** - Expanded SRS with detailed token tables and requirements
  - Added complete typography scale with usage guidance
  - Added spacing scale with pixel values
  - Added shadow elevation scale
  - Added transitions and brand color documentation
  - Added CC-REQ-TOKENS-001 to 006 requirements
  - References VISUAL_AUDIT_REPORT.md Part 9 (CSS Token Additions)
