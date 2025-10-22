# Home Page & Timeline Discovery Requirements

This document specifies requirements for the landing page and timeline discovery features (v0.4.0). It provides the foundation for browsing timelines organized by user in a GitHub-style interface.

## Scope

**In Scope:**
- GitHub-style home page layout
- User directory and profile pages
- Timeline browsing and discovery
- URL routing structure
- Local-first data storage (localStorage)
- Demo user system (no authentication)

**Out of Scope (Deferred):**
- User authentication (v0.5.1)
- Backend/cloud storage (v0.5.0)
- Real-time collaboration (v0.6.x)
- Forking/merging workflows (v0.6.x)

## Requirement Tables

### Landing Page Display & Layout

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-HOME-001 | Home page displays at root URL with navigation to user directory | • Root path "/" renders landing page component<br>• Page shows "PowerTimeline" branding/logo<br>• Navigation menu provides access to user directory<br>• Responsive layout adapts to mobile/tablet/desktop | TBD | TBD |
| CC-REQ-HOME-002 | User directory displays all available users in grid/list layout | • Each user shown as card with avatar and name<br>• User cards display timeline count for each user<br>• Grid layout: 3 columns desktop, 2 tablet, 1 mobile<br>• Click on user card navigates to user profile page | TBD | TBD |
| CC-REQ-HOME-003 | Empty state displayed when no users exist | • "No users found" message shown<br>• Helpful text guides user to create content<br>• Empty state has proper styling | TBD | TBD |
| CC-REQ-HOME-004 | Page layout includes header, main content, and footer areas | • Header contains branding and navigation<br>• Main content area responsive with max-width constraints<br>• Footer contains project info and links<br>• Consistent spacing using design tokens | TBD | TBD |

### User Profile System

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-USER-001 | Demo user profiles include essential metadata | • User object contains: id, name, avatar, bio, createdAt<br>• Three default users: Alice, Bob, Charlie<br>• Avatar can be emoji or image URL<br>• Bio is optional text field (max 280 characters) | TBD | TBD |
| CC-REQ-USER-002 | User profile page displays user info and their timelines | • URL pattern: /user/:userId<br>• Page shows user avatar, name, bio<br>• Timeline list filtered by ownerId<br>• Shows timeline count and stats | TBD | TBD |
| CC-REQ-USER-003 | User data persists in localStorage | • Users stored in localStorage key: 'powertimeline_users'<br>• JSON serialization of user array<br>• Data survives page refresh<br>• Graceful handling of corrupted data | TBD | TBD |

### Timeline Discovery & Display

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-TIMELINE-DISC-001 | Timeline cards display essential metadata | • Card shows: title, description, event count, owner name<br>• Card displays creation/modification date<br>• Visual distinction for empty timelines (0 events)<br>• Truncate long descriptions with ellipsis | TBD | TBD |
| CC-REQ-TIMELINE-DISC-002 | Timeline cards are clickable and navigate to editor | • Click on timeline card navigates to /user/:userId/timeline/:timelineId<br>• Hover state provides visual feedback<br>• Cursor changes to pointer on hover | TBD | TBD |
| CC-REQ-TIMELINE-DISC-003 | Timeline preview shown on card hover (optional enhancement) | • Hover displays minimap thumbnail overlay<br>• Preview shows event distribution<br>• Preview appears after 500ms hover delay<br>• Preview dismissed on mouse leave | TBD | TBD |
| CC-REQ-TIMELINE-DISC-004 | Timelines display ownership attribution | • Owner's name shown on each timeline card<br>• Owner's avatar displayed (optional)<br>• Link to owner's profile page | TBD | TBD |
| CC-REQ-TIMELINE-DISC-005 | Timeline list supports multiple view modes | • Grid view: cards in responsive grid (3/2/1 columns)<br>• List view: full-width rows with details<br>• View mode toggle in UI<br>• View preference persisted to localStorage | TBD | TBD |
| CC-REQ-TIMELINE-DISC-006 | Empty state when user has no timelines | • "No timelines yet" message displayed<br>• Call-to-action to create first timeline<br>• Friendly, encouraging copy | TBD | TBD |

### Routing & Navigation

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-ROUTE-001 | URL routing structure follows RESTful patterns | • `/` - Home/landing page<br>• `/users` - User directory<br>• `/user/:userId` - User profile page<br>• `/user/:userId/timeline/:timelineId` - Timeline editor<br>• Invalid routes show 404 page | TBD | TBD |
| CC-REQ-ROUTE-002 | Browser back/forward buttons work correctly | • Clicking back returns to previous page<br>• Browser history tracks navigation properly<br>• Page state restored on back navigation<br>• No broken navigation loops | TBD | TBD |
| CC-REQ-ROUTE-003 | Breadcrumb navigation shows current location | • Breadcrumbs show: Home > User > Timeline hierarchy<br>• Each breadcrumb segment is clickable<br>• Current page highlighted in breadcrumb<br>• Breadcrumbs responsive on mobile (collapsible) | TBD | TBD |
| CC-REQ-ROUTE-004 | Deep linking to specific timelines works | • Direct URL navigation to /user/:userId/timeline/:timelineId loads correctly<br>• Missing users/timelines show appropriate 404<br>• URL parameters validated and sanitized | TBD | TBD |
| CC-REQ-ROUTE-005 | Navigation preserves timeline editor state when returning | • Zoom level preserved when navigating back to timeline<br>• Scroll position restored<br>• Selected event remembered (optional) | TBD | TBD |

### Search & Filter

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-SEARCH-001 | Search box filters timelines by title | • Search input field visible on user profile and home pages<br>• Typing filters timeline list in real-time<br>• Case-insensitive search<br>• Search matches partial titles<br>• Clear button to reset search | TBD | TBD |
| CC-REQ-SEARCH-002 | Search provides feedback for no results | • "No timelines match '{query}'" message<br>• Suggestion to clear search or try different terms<br>• Result count displayed: "Showing X of Y timelines" | TBD | TBD |
| CC-REQ-SEARCH-003 | Filter by user (on home page) | • Dropdown or filter UI to select user<br>• Filter updates timeline list<br>• "All Users" option to clear filter<br>• Filter state preserved in URL query params (optional) | TBD | TBD |

### Data Management

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-DATA-001 | Timeline objects include ownership metadata | • Timeline object has ownerId field (string)<br>• ownerId references user.id<br>• Existing timelines assigned to demo users on migration<br>• orphan timelines (no owner) handled gracefully | TBD | TBD |
| CC-REQ-DATA-002 | localStorage schema supports multi-user timelines | • Timelines stored in 'powertimeline_timelines' key<br>• Array of timeline objects with ownerId<br>• Users stored in 'powertimeline_users' key<br>• Schema versioning for future migrations | TBD | TBD |
| CC-REQ-DATA-003 | Demo users pre-populated on first load | • Check if users exist in localStorage<br>• If empty, create Alice, Bob, Charlie with default data<br>• Assign sample timelines to demo users<br>• Idempotent initialization (safe to run multiple times) | TBD | TBD |
| CC-REQ-DATA-004 | Data persistence survives page refresh | • Navigate away and back, data intact<br>• Browser close/reopen preserves data<br>• Data visible across browser tabs<br>• Handle localStorage quota exceeded errors | TBD | TBD |

## Implementation Notes

### Mock User Data Structure

```typescript
interface User {
  id: string;           // unique identifier (e.g., "alice", "bob", "charlie")
  name: string;         // display name (e.g., "Alice")
  avatar: string;       // emoji or image URL (e.g., "👩‍💻")
  bio?: string;         // optional biography
  createdAt: string;    // ISO date string
}

// Default demo users
const DEMO_USERS: User[] = [
  {
    id: "alice",
    name: "Alice",
    avatar: "👩‍💻",
    bio: "Passionate about documenting historical events and timelines.",
    createdAt: new Date().toISOString()
  },
  {
    id: "bob",
    name: "Bob",
    avatar: "👨‍🔬",
    bio: "Researcher focused on scientific discoveries throughout history.",
    createdAt: new Date().toISOString()
  },
  {
    id: "charlie",
    name: "Charlie",
    avatar: "👨‍🎨",
    bio: "Exploring art history and cultural movements.",
    createdAt: new Date().toISOString()
  }
];
```

### Timeline Data Extension

```typescript
interface Timeline {
  id: string;
  title: string;
  description?: string;
  events: Event[];
  ownerId: string;         // NEW: references User.id
  createdAt: string;
  updatedAt: string;
  visibility?: 'public' | 'private';  // Future: for v0.5.x
}
```

### localStorage Keys

```typescript
const STORAGE_KEYS = {
  USERS: 'powertimeline_users',
  TIMELINES: 'powertimeline_timelines',
  CURRENT_USER: 'powertimeline_current_user',  // For v0.4.2 demo user switcher
  VIEW_PREFERENCES: 'powertimeline_view_prefs'  // Grid vs list view
} as const;
```

### Routing Library

**Recommended:** React Router v6

```typescript
// Route structure
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/users" element={<UserDirectoryPage />} />
  <Route path="/user/:userId" element={<UserProfilePage />} />
  <Route path="/user/:userId/timeline/:timelineId" element={<TimelineEditorPage />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### Component Hierarchy

```
App
├── Router
│   ├── HomePage
│   │   ├── Header
│   │   ├── UserDirectory
│   │   │   └── UserCard (repeated)
│   │   └── Footer
│   ├── UserProfilePage
│   │   ├── Header
│   │   ├── UserProfileHeader (avatar, name, bio)
│   │   ├── TimelineList
│   │   │   ├── SearchBar
│   │   │   ├── ViewModeToggle
│   │   │   └── TimelineCard (repeated)
│   │   └── Footer
│   └── TimelineEditorPage (existing component)
│       └── DeterministicLayoutComponent
└── Breadcrumbs (appears on all pages)
```

## Test Coverage Plan

### Smoke Tests (Priority 1)
- [ ] v0.4.0/01-home-page-loads.spec.ts - Home page renders without errors
- [ ] v0.4.0/02-user-directory-display.spec.ts - User cards display correctly
- [ ] v0.4.0/03-user-profile-navigation.spec.ts - Clicking user navigates to profile

### Navigation Tests (Priority 2)
- [ ] v0.4.0/04-routing-structure.spec.ts - All routes work correctly
- [ ] v0.4.0/05-breadcrumb-navigation.spec.ts - Breadcrumbs show and work
- [ ] v0.4.0/06-deep-linking.spec.ts - Direct URLs to timelines work

### Timeline Discovery Tests (Priority 2)
- [ ] v0.4.0/07-timeline-cards.spec.ts - Timeline cards display metadata
- [ ] v0.4.0/08-timeline-click-navigation.spec.ts - Clicking timeline opens editor
- [ ] v0.4.0/09-empty-states.spec.ts - Empty states display appropriately

### Search & Filter Tests (Priority 3)
- [ ] v0.4.0/10-timeline-search.spec.ts - Search filters timelines by title
- [ ] v0.4.0/11-user-filter.spec.ts - Filter timelines by user

### Data Persistence Tests (Priority 1)
- [ ] v0.4.0/12-demo-users-initialization.spec.ts - Demo users created on first load
- [ ] v0.4.0/13-timeline-ownership.spec.ts - Timelines correctly assigned to owners
- [ ] v0.4.0/14-data-persistence.spec.ts - Data survives page refresh

### Responsive Design Tests (Priority 3)
- [ ] v0.4.0/15-mobile-layout.spec.ts - Layout works on mobile viewport
- [ ] v0.4.0/16-tablet-layout.spec.ts - Layout works on tablet viewport

## Change History

- **2025-01-XX** — Initial SRS creation for v0.4.0 home page implementation
- Requirements align with PLAN.md v0.4.0 goals
- Local-first approach (no backend, no authentication)
- Foundation for future collaborative features (v0.5.x+)
