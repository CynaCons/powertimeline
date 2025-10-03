# PowerTimeline Card Type Color System

This document tracks the left-border color conventions for the three card types that ship today.

## Color Scheme

### Blue - Full Cards
- **Color**: `border-l-blue-500` (#3B82F6)
- **Card Type**: `full`
- **Dimensions**: 260px x 169px
- **Usage**: Up to two events per half-column
- **Description**: Rich narrative cards with full description and metadata

### Green - Compact Cards
- **Color**: `border-l-green-500` (#10B981)
- **Card Type**: `compact`
- **Dimensions**: 260px x 92px
- **Usage**: Three to four events per half-column (first degradation step)
- **Description**: Space-optimized cards that retain the title, trimmed description, and date

### Yellow - Title-Only Cards
- **Color**: `border-l-yellow-500` (#EAB308)
- **Card Type**: `title-only`
- **Dimensions**: 260px x 32px
- **Usage**: High-density regions (more than four visible events)
- **Description**: Minimal presentation with title and date only

## Implementation Notes

All color tokens live in `src/styles/index.css` and are referenced by `CardRenderer.tsx`. The legacy purple/red entries have been removed to reflect the simplified card taxonomy.
