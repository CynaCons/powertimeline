# User Onboarding & Guided Tours Requirements

This document specifies requirements for the onboarding system, including empty state CTAs, guided tours, and context-sensitive help features. The system helps new users understand PowerTimeline's features through progressive discovery.

## Overview

PowerTimeline's onboarding system provides:
- **Empty State CTAs**: Hero-style prompts when users have no timelines
- **Guided Tours**: Interactive walkthroughs using React Joyride for editor and home page features
- **Help System**: NavRail-integrated help menu for launching context-aware tours
- **Tour Persistence**: localStorage-based tracking to avoid repetition

## Requirement Table

### Empty State CTA

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-ONBOARD-001 | Empty state CTA displays when user has no timelines | • CTA shown in "My Timelines" section when user is authenticated<br>• CTA appears when `userTimelines.length === 0`<br>• CTA hidden when user has one or more timelines<br>• CTA not shown to unauthenticated users (they see landing page) | TBD | TBD |
| CC-REQ-ONBOARD-002 | Empty state uses hero-style design with clear visual hierarchy | • Large heading: "Create Your First Timeline"<br>• Subtext: "Start exploring history with interactive timelines"<br>• Prominent call-to-action button<br>• Purple gradient or accent styling matching brand<br>• Centered in My Timelines section<br>• Responsive layout for tablet/desktop | TBD | TBD |
| CC-REQ-ONBOARD-003 | Empty state CTA provides action to create first timeline | • "Get Started" or "Create Timeline" button<br>• Button launches timeline creation flow<br>• Button styled with primary color (purple)<br>• Button accessible via keyboard (Enter/Space) | TBD | TBD |
| CC-REQ-ONBOARD-004 | Empty state CTA offers option to start guided tour | • Secondary action: "Take a Tour" link/button<br>• Launches Home Page tour<br>• Styled as secondary action (less prominent than Create)<br>• Accessible via keyboard navigation | TBD | TBD |

### Guided Tour System

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-TOUR-001 | Tour system implemented using React Joyride library | • React Joyride dependency added to package.json<br>• Tour component wrapper created<br>• Supports step-by-step navigation<br>• Supports spotlight overlay on target elements<br>• Theming matches PowerTimeline design system | TBD | TBD |
| CC-REQ-TOUR-002 | Tours can be activated from multiple entry points | • NavRail help menu launches tours<br>• Empty state CTA launches Home tour<br>• Tours context-aware (editor vs. home page)<br>• Only one tour active at a time | TBD | TBD |
| CC-REQ-TOUR-003 | Tours provide skip/exit functionality at all times | • "Skip Tour" button visible on every step<br>• Close/X button available on tour tooltip<br>• Escape key dismisses tour<br>• Clicking outside tour overlay dismisses tour (optional)<br>• User never blocked from accessing application | TBD | TBD |
| CC-REQ-TOUR-004 | Tour progress persisted to avoid repetition | • localStorage tracks completed tours<br>• Key format: `tour-completed-{tourId}` → boolean<br>• Tours not auto-launched if previously completed<br>• User can manually re-launch completed tours from Help menu<br>• localStorage gracefully handles unavailability | TBD | TBD |
| CC-REQ-TOUR-005 | Tour tooltips styled to match application theme | • Tooltips use CSS variables (--page-bg, --page-text, etc.)<br>• Dark mode aware<br>• Spotlight overlay uses semi-transparent backdrop<br>• Progress indicator shows "Step X of Y"<br>• Next/Back/Skip buttons clearly labeled<br>• Smooth transitions between steps (300ms) | TBD | TBD |

### Editor Tour

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-TOUR-EDIT-001 | Editor tour welcome step introduces timeline editor | • Step 1: Modal overlay (no specific target)<br>• Title: "Welcome to the Timeline Editor"<br>• Description: "Let's explore the key features that make creating timelines easy"<br>• Button: "Start Tour"<br>• Total steps: 8 | TBD | TBD |
| CC-REQ-TOUR-EDIT-002 | Tour highlights zoom controls with usage instructions | • Step 2: Target zoom controls in top navigation<br>• Spotlight on zoom slider + zoom in/out buttons<br>• Description: "Use these controls to zoom in/out on your timeline. Scroll wheel also works!"<br>• Shows keyboard shortcuts (Ctrl +/-, Ctrl 0 for reset) | TBD | TBD |
| CC-REQ-TOUR-EDIT-003 | Tour explains timeline axis and date range | • Step 3: Target timeline axis component<br>• Spotlight on horizontal axis with date labels<br>• Description: "The timeline axis shows your date range. Labels adapt as you zoom (decades → years → months → days → hours)"<br>• Mentions click-and-drag to pan | TBD | TBD |
| CC-REQ-TOUR-EDIT-004 | Tour demonstrates event cards and card types | • Step 4: Target an event card on timeline<br>• Spotlight on sample event card<br>• Description: "Events appear as cards. They automatically resize (Full → Compact → Title-only) based on zoom level"<br>• Mentions click to select, double-click to edit | TBD | TBD |
| CC-REQ-TOUR-EDIT-005 | Tour showcases minimap navigation | • Step 5: Target minimap component at top of screen<br>• Tooltip placement must be 'bottom' (minimap is at top, so tooltip appears below it)<br>• Spotlight on minimap bar and view window<br>• Description: "The minimap at the top shows your entire timeline. Click or drag the view window to navigate quickly"<br>• Mentions density heatmap visualization | TBD | TBD |
| CC-REQ-TOUR-EDIT-006 | Tour teaches how to add new events | • Step 6: Target "Add Event" button in NavRail<br>• Spotlight on + icon button<br>• Description: "Click here to add a new event to your timeline. You can also right-click on the timeline axis"<br>• Mentions keyboard shortcut (Ctrl N) | TBD | TBD |
| CC-REQ-TOUR-EDIT-007 | Tour explains event editor overlay | • Step 7: (Optional) Opens sample event editor<br>• Spotlight on event editor overlay<br>• Description: "Edit event details here: title, date, description, type. Changes save automatically"<br>• Mentions form validation and date picker | TBD | TBD |
| CC-REQ-TOUR-EDIT-008 | Tour introduces Stream View for event management | • Step 8: Target Stream View icon in NavRail<br>• Spotlight on stream icon button<br>• Description: "Switch to Stream View to see all events as cards. Quickly search, filter, and bulk edit"<br>• Final step with "Finish Tour" button | TBD | TBD |
| CC-REQ-TOUR-EDIT-009 | Tour tooltips must use correct placement to avoid screen clipping | • Elements at top of screen: tooltip placement must be 'bottom'<br>• Elements at bottom of screen: tooltip placement must be 'top'<br>• Left nav rail elements: tooltip placement must be 'right'<br>• Right overlay elements: tooltip placement must be 'left'<br>• Tooltips must never clip off-screen or obscure target element | TBD | TBD |
| CC-REQ-TOUR-EDIT-010 | Tour descriptions must include spatial context and clear action targets | • All tour descriptions must include spatial context ("at the top", "in the left sidebar", "below the timeline")<br>• Movement instructions must clarify the target (e.g., "drag the timeline canvas" not just "drag")<br>• Action descriptions must specify what element to interact with<br>• Descriptions written from user's perspective, not developer's perspective | TBD | TBD |

### Home Page Tour

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-TOUR-HOME-001 | Home tour welcome step introduces Browse and My Timelines | • Step 1: Modal overlay (no specific target)<br>• Title: "Welcome to PowerTimeline"<br>• Description: "Explore public timelines or create your own. Let's take a quick tour!"<br>• Button: "Start Tour"<br>• Total steps: 5 | TBD | TBD |
| CC-REQ-TOUR-HOME-002 | Tour highlights My Timelines section | • Step 2: Target "My Timelines" section<br>• Spotlight on My Timelines header + timeline grid<br>• Description: "Your personal timelines appear here. Create, edit, and manage your work"<br>• Mentions privacy settings (private by default) | TBD | TBD |
| CC-REQ-TOUR-HOME-003 | Tour explains timeline cards and interactions | • Step 3: Target a sample timeline card<br>• Spotlight on card with thumbnail, title, description<br>• Description: "Timeline cards show preview, event count, and metadata. Click to open in editor"<br>• Mentions hover actions (edit, share, delete) | TBD | TBD |
| CC-REQ-TOUR-HOME-004 | Tour introduces Browse Public Timelines section | • Step 4: Target "Browse Public Timelines" section<br>• Spotlight on Browse section with featured/recent timelines<br>• Description: "Discover timelines created by the community. Filter by topic, date range, or popularity"<br>• Mentions user profiles (click author to see their timelines) | TBD | TBD |
| CC-REQ-TOUR-HOME-005 | Tour shows navigation rail and settings access | • Step 5: Target NavRail on left side<br>• Spotlight on NavRail with icons (Home, User, Settings, Help)<br>• Description: "Use this navigation to access settings, your profile, and help. Click Help anytime to replay this tour"<br>• Final step with "Finish Tour" button | TBD | TBD |

### NavRail Help Integration

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-HELP-001 | NavRail displays Help icon with clear affordance | • Help icon (question mark or info icon) always visible<br>• Icon positioned in NavRail (bottom section)<br>• Icon uses consistent styling with other NavRail icons<br>• Tooltip on hover: "Help & Tours"<br>• Accessible via keyboard navigation (Tab order) | TBD | TBD |
| CC-REQ-HELP-002 | Help menu provides tour options for current context | • Click Help icon opens dropdown/menu<br>• Menu shows "Editor Tour" when in editor context<br>• Menu shows "Home Tour" when on home page<br>• Menu shows "Getting Started" link to documentation (optional)<br>• Menu shows tour completion status (checkmarks for completed)<br>• Clicking tour option launches that tour | TBD | TBD |
| CC-REQ-HELP-003 | Tours launch with context-aware starting state | • Editor tour requires timeline to be loaded<br>• Editor tour positions user at default view (full timeline)<br>• Home tour works for both authenticated and unauthenticated users<br>• Tours adapt to user state (e.g., skip "My Timelines" step if user has no timelines) | TBD | TBD |

## UI Specifications

### Empty State CTA (Hero-style)

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│     🎯 Create Your First Timeline       │ <- Large heading (text-3xl)
│                                         │
│   Start exploring history with          │ <- Subtext (text-lg)
│   interactive timelines                 │
│                                         │
│   [   Create Timeline   ]               │ <- Primary button (bg-primary)
│   Take a Tour →                         │ <- Secondary link
│                                         │
└─────────────────────────────────────────┘
```

**Styling:**
- Container: Centered, max-width 600px, padding 3rem
- Heading: font-bold, text-3xl, text-neutral-900 (dark: text-neutral-100)
- Subtext: text-lg, text-neutral-600 (dark: text-neutral-400), mb-6
- Primary button: px-6 py-3, rounded-lg, bg-primary-600 hover:bg-primary-700
- Secondary link: text-primary-600, underline-offset-4, hover:underline
- Optional: Purple gradient background or accent border

### Tour Tooltip Design

**React Joyride Configuration:**
```typescript
{
  styles: {
    options: {
      primaryColor: 'var(--color-primary-600)', // Purple brand
      textColor: 'var(--page-text)',
      backgroundColor: 'var(--page-bg)',
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      arrowColor: 'var(--page-bg)',
      width: 360,
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: 8,
      padding: 20,
    },
    buttonNext: {
      backgroundColor: 'var(--color-primary-600)',
      borderRadius: 6,
    },
    buttonBack: {
      color: 'var(--color-primary-600)',
    },
  },
  floaterProps: {
    disableAnimation: false,
  },
  locale: {
    back: 'Back',
    close: 'Close',
    last: 'Finish',
    next: 'Next',
    skip: 'Skip Tour',
  },
}
```

**Tooltip Elements:**
- Progress indicator: "Step 3 of 8" (top-right corner)
- Title: font-semibold, text-lg
- Description: text-sm, mb-4
- Button group: flex, gap-2
  - Skip: text-neutral-600, hover:text-neutral-900
  - Back: secondary button
  - Next: primary button

**Spotlight:**
- Animated ring around target element
- Semi-transparent overlay (rgba(0,0,0,0.5)) on rest of page
- Smooth transitions (300ms ease-in-out)
- Padding: 8px around target element

### Help Menu UI

**Dropdown Menu:**
```
┌─────────────────────────────┐
│ Help & Tours                │ <- Header
├─────────────────────────────┤
│ ✓ Editor Tour               │ <- Completed (checkmark)
│   Home Tour                 │ <- Not completed
│ ─────────────────────────   │
│   Documentation →           │ <- External link (optional)
└─────────────────────────────┘
```

**Styling:**
- Dropdown: bg-white (dark: bg-neutral-800), rounded-lg, shadow-xl
- Width: 240px
- Items: px-4 py-2, hover:bg-neutral-100 (dark: hover:bg-neutral-700)
- Checkmark: text-green-500 for completed tours
- Divider: border-t border-neutral-200 (dark: border-neutral-700)

## Non-functional Requirements

### Performance
- Tours must not delay application startup
- React Joyride lazy-loaded (dynamic import)
- localStorage reads synchronous but non-blocking
- Tour state changes don't trigger full re-renders

### Usability
- Tours must not block critical user actions
- Skip button always visible and functional
- Tours keyboard accessible (Tab, Enter, Escape)
- Tours work with screen readers (ARIA labels)
- Tours respect user's reduced motion preference

### Persistence & Privacy
- Tour completion state stored in localStorage (client-side only)
- No server-side tracking of tour progress
- localStorage key format: `powerTimeline:tour-completed-{tourId}`
- Graceful degradation if localStorage unavailable

### Responsive Design
- Tours work on desktop (min-width 1024px)
- Tours work on tablet landscape (min-width 768px)
- Tours disabled on mobile (<768px) - alternative onboarding may be needed
- Tooltips reposition to avoid screen edge clipping

### Accessibility
- All tour steps keyboard navigable
- ARIA live regions announce tour step changes
- Focus management: focus moves to tooltip on step change
- Color contrast meets WCAG AA standards
- Skip functionality meets WCAG 2.1 Success Criterion 2.1.1

## Test Requirements

### Unit Tests
- Tour step configuration validation
- localStorage persistence logic
- Tour completion tracking
- Context-aware tour selection

### E2E Tests

| Test ID | Description | Acceptance |
|---------|-------------|------------|
| onboard-01 | Empty state CTA shown when no timelines | CTA visible, Create button functional |
| onboard-02 | Empty state hidden when user has timelines | CTA not in DOM when `timelines.length > 0` |
| tour-01 | Editor tour launches from Help menu | Tour starts at step 1, all 8 steps navigate correctly |
| tour-02 | Home tour launches from Help menu | Tour starts at step 1, all 5 steps navigate correctly |
| tour-03 | Tour can be skipped at any step | Skip button dismisses tour, localStorage updated |
| tour-04 | Tour progress persists across sessions | Completed tour not auto-launched, Help menu shows checkmark |
| tour-05 | Tours keyboard accessible | Tab/Enter/Escape work, focus management correct |
| tour-06 | Tour tooltips match dark mode theme | CSS variables applied correctly in dark mode |
| tour-07 | Multiple tour entry points work | NavRail Help, Empty state CTA both launch tours |
| tour-08 | Tours adapt to context | Editor tour only in editor, Home tour only on home page |

### Manual Testing Checklist
- [ ] Tour tooltips readable at all zoom levels
- [ ] Spotlight doesn't obscure important UI elements
- [ ] Tour steps make sense for first-time users
- [ ] Tour copy is clear, concise, and helpful
- [ ] Tours don't feel intrusive or patronizing
- [ ] Skip functionality obvious and easy to use

## Implementation Notes

### Tour State Management

```typescript
// src/hooks/useTourState.ts
interface TourState {
  activeTour: 'editor' | 'home' | null;
  currentStep: number;
  isRunning: boolean;
}

// localStorage utilities
const TOUR_STORAGE_KEY = 'powerTimeline:tour-completed';

function getTourCompletion(tourId: string): boolean {
  return localStorage.getItem(`${TOUR_STORAGE_KEY}-${tourId}`) === 'true';
}

function setTourCompletion(tourId: string, completed: boolean): void {
  localStorage.setItem(`${TOUR_STORAGE_KEY}-${tourId}`, String(completed));
}
```

### Tour Step Definition

```typescript
// src/config/tours.ts
interface TourStep {
  target: string; // CSS selector or 'body' for modal
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  disableBeacon?: boolean;
  spotlightPadding?: number;
}

export const EDITOR_TOUR_STEPS: TourStep[] = [
  {
    target: 'body',
    title: 'Welcome to the Timeline Editor',
    content: 'Let\'s explore the key features that make creating timelines easy',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.zoom-controls',
    title: 'Zoom Controls',
    content: 'Use these controls to zoom in/out on your timeline. Scroll wheel also works!',
    placement: 'bottom',
  },
  // ... more steps
];
```

### React Joyride Integration

```typescript
// src/components/TourProvider.tsx
import Joyride, { Step, CallBackProps } from 'react-joyride';

function TourProvider({ children }: { children: React.ReactNode }) {
  const [tourState, setTourState] = useState<TourState>({
    activeTour: null,
    currentStep: 0,
    isRunning: false,
  });

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (status === 'finished' || status === 'skipped') {
      // Tour completed or skipped
      setTourState({ activeTour: null, currentStep: 0, isRunning: false });
      if (status === 'finished' && tourState.activeTour) {
        setTourCompletion(tourState.activeTour, true);
      }
    }
  };

  return (
    <>
      {children}
      <Joyride
        steps={getTourSteps(tourState.activeTour)}
        run={tourState.isRunning}
        stepIndex={tourState.currentStep}
        callback={handleJoyrideCallback}
        continuous
        showProgress
        showSkipButton
        styles={TOUR_STYLES}
        locale={TOUR_LOCALE}
      />
    </>
  );
}
```

## Dependencies

- **React Joyride**: ^2.7.0 or later (tour library)
- **localStorage API**: Browser storage for persistence
- **NavRail Component**: For Help icon integration
- **Home Page**: For empty state CTA display
- **Editor State**: For context-aware tour launching

## Known Limitations & Future Work

### Not Yet Implemented
1. Mobile tours (tours disabled on <768px screens)
2. Advanced tour branching (e.g., different paths for different user types)
3. Tour analytics (tracking which steps users skip/struggle with)
4. Video tutorials as alternative to tours
5. Gamification (badges for completing tours)

### Potential Improvements
1. **Interactive Tours**: Allow users to interact with actual UI during tour (not just read-only)
2. **Contextual Help**: Inline tooltips on hover (not just full tours)
3. **Progressive Disclosure**: Show tours only for features user hasn't tried yet
4. **Tour Customization**: Let users choose "quick tour" vs "detailed tour"
5. **Multi-language Support**: Localize tour content
6. **Tour Presets**: Different tours for different user roles (educator, researcher, casual user)

## Notes & Change History

- 2025-12-06 — Initial document creation following SRS_MINIMAP.md format
- 2025-12-06 — Defined 24 requirements across 6 feature areas
- 2025-12-06 — Specified React Joyride integration approach
- 2025-12-06 — Added detailed UI specifications for tooltips and empty state
- 2025-12-06 — Included localStorage persistence strategy
- 2026-01-02 — Added CC-REQ-TOUR-EDIT-009 for tooltip placement rules to prevent screen clipping
- 2026-01-02 — Added CC-REQ-TOUR-EDIT-010 for spatial context and clear action descriptions
- 2026-01-02 — Updated CC-REQ-TOUR-EDIT-005 to specify 'bottom' placement for minimap tooltip (minimap is at top of screen)
