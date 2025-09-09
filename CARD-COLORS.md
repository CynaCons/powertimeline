# ChronoChart Card Type Color System

This document defines the visual color coding system for different card types in ChronoChart. Each card type has a distinctive left border color to help users quickly identify the level of detail and space optimization being used.

## Color Scheme

### 🔵 **Blue - Full Cards**
- **Color**: `border-l-blue-500` (#3B82F6)
- **Card Type**: `full`
- **Dimensions**: 260px × 140px
- **Usage**: 1-2 events per half-column
- **Description**: Full detail cards with maximum information display
- **Space Efficiency**: Standard baseline (2 slots per half-column)

### 🟢 **Green - Compact Cards**  
- **Color**: `border-l-green-500` (#10B981)
- **Card Type**: `compact`
- **Dimensions**: 176px × 64px
- **Usage**: 3+ events per half-column (degraded from full)
- **Description**: Space-optimized cards with essential information
- **Space Efficiency**: 2x improvement (4 slots per half-column)
- **Space Saved**: 76px per card vs full cards

### 🟡 **Yellow - Title-Only Cards**
- **Color**: `border-l-yellow-500` (#EAB308)
- **Card Type**: `title-only`
- **Dimensions**: 140px × 32px  
- **Usage**: High-density regions (future implementation)
- **Description**: Minimal cards showing only event titles
- **Space Efficiency**: 4x improvement (4 slots per half-column)
- **Space Saved**: 108px per card vs full cards

### 🟣 **Purple - Multi-Event Cards**
- **Color**: `border-l-purple-500` (#8B5CF6)
- **Card Type**: `multi-event` 
- **Dimensions**: 180px × 80px
- **Usage**: Multiple events aggregated into single card (future implementation)
- **Description**: Aggregated cards showing multiple related events
- **Space Efficiency**: Variable (up to 5 events per card)
- **Max Events**: 5 events per card

### 🔴 **Red - Infinite Cards** (Future)
- **Color**: `border-l-red-500` (#EF4444)
- **Card Type**: `infinite`
- **Dimensions**: 160px × 40px
- **Usage**: Extreme density scenarios (future implementation)
- **Description**: Ultra-compact cards with overflow indicators
- **Space Efficiency**: Maximum density with "+N more" indicators

## Implementation Details

### Current Status (v0.2.0)
- ✅ **Blue (Full)**: Fully implemented and active
- ✅ **Green (Compact)**: Implemented with degradation system
- 🔄 **Yellow (Title-only)**: Color defined, degradation logic pending
- 🔄 **Purple (Multi-event)**: Color defined, aggregation logic pending  
- ⏳ **Red (Infinite)**: Planned for future implementation

### Degradation Cascade
The system automatically degrades cards based on density:

```
Full (Blue) → Compact (Green) → Title-only (Yellow) → Multi-event (Purple) → Infinite (Red)
```

### Visual Hierarchy
Colors are chosen to represent increasing levels of optimization:
- **Cool colors** (Blue, Green) for standard usage
- **Warm colors** (Yellow, Purple, Red) for high-density optimization
- **Intensity increases** with optimization level (lighter to darker)

## Usage Guidelines

### For Developers
1. Card colors are automatically applied based on `card.cardType`
2. Colors are defined in Tailwind CSS classes in `DeterministicLayoutComponent.tsx`
3. Each color has semantic meaning - avoid using them for other purposes
4. Test color accessibility for colorblind users

### For Users
1. **Blue cards**: Standard detail level, optimal readability
2. **Green cards**: Slightly condensed but still detailed
3. **Yellow cards**: Minimal information, scan-friendly
4. **Purple cards**: Aggregated events, click to expand
5. **Red cards**: Maximum density, hover for details

## Accessibility Notes

- Colors are supplemented with different card sizes and layouts
- Card types are also indicated via `data-card-type` attributes
- Screen readers can access card type information
- High contrast mode support planned for future releases

## Technical Implementation

### CSS Classes
```tsx
// Current implementation in DeterministicLayoutComponent.tsx
className={`absolute bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow ${
  card.cardType === 'full' ? 'border-l-4 border-l-blue-500 border-gray-200 p-3' :
  card.cardType === 'compact' ? 'border-l-4 border-l-green-500 border-gray-200 p-2' :
  card.cardType === 'title-only' ? 'border-l-4 border-l-yellow-500 border-gray-200 p-1' :
  card.cardType === 'multi-event' ? 'border-l-4 border-l-purple-500 border-gray-200 p-2' :
  'border-l-4 border-l-red-500 border-gray-200 p-1' // infinite cards
} text-sm`}
```

### Card Type Detection
Cards are automatically assigned types by the `LayoutEngine.determineCardType()` method based on:
- Event count per half-column
- Available space
- Viewport density
- User preferences (future)

---

*This color system ensures consistent visual hierarchy while providing immediate feedback about the timeline's density optimization state.*