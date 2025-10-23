# Home Page & Timeline Discovery Requirements

This document specifies requirements for the landing page and timeline discovery features (v0.4.0). The home page follows a modern, search-first design with the user's personal workspace prioritized, followed by discovery feeds.

## Scope

**In Scope:**
- Search-first home page layout with unified search (timelines + users)
- User personal section ("My Timelines") with create functionality
- Platform statistics dashboard
- Activity feeds (Recently Edited, Popular, Featured)
- User profile pages
- URL routing structure
- Local-first data storage (localStorage)
- Demo user system (no authentication)

**Out of Scope (Deferred):**
- User authentication (v0.5.1)
- Backend/cloud storage (v0.5.0)
- Real-time collaboration (v0.6.x)
- Forking/merging workflows (v0.6.x)
- Advanced analytics/metrics (v0.5.x+)

## Page Layout Hierarchy

The home page sections appear in this order (top to bottom):

1. **Header** - Logo, branding, navigation to user profile
2. **Search Bar** - Central, unified search for timelines and users
3. **My Timelines** - User's personal workspace (top priority)
4. **Statistics** - Platform metrics (timelines, users, events, views)
5. **Recently Edited** - Timelines sorted by last modification
6. **Popular Timelines** - Timelines with most views/engagement
7. **Featured Timelines** - Curated/highlighted timelines

## Requirement Tables

### Search & Discovery

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-SEARCH-001 | Unified search bar searches both timelines and users | • Search input field prominently displayed below header<br>• Search queries match timeline titles, descriptions, AND user names<br>• Real-time search results as user types<br>• Case-insensitive fuzzy matching<br>• Minimum 2 characters before search triggers | TBD | TBD |
| CC-REQ-SEARCH-002 | Search results displayed in dropdown with categorization | • Results dropdown shows "Timelines" and "Users" sections<br>• Up to 5 timelines and 3 users shown<br>• Each result clickable to navigate<br>• "View all results" link if more than max shown<br>• Dropdown dismisses on selection or click outside | TBD | TBD |
| CC-REQ-SEARCH-003 | Search provides helpful feedback for no results | • "No results for '{query}'" message displayed<br>• Suggestions: "Try different keywords" or "Browse featured timelines"<br>• Empty state illustration/icon<br>• Quick action to create new timeline if no matches | TBD | TBD |
| CC-REQ-SEARCH-004 | Search box includes clear/reset functionality | • Clear button (×) appears when text entered<br>• Clicking clear empties search and dismisses dropdown<br>• ESC key also clears search<br>• Placeholder text: "Search timelines and users..." | TBD | TBD |

### My Timelines Section (User Workspace)

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-MYTIMELINES-001 | "My Timelines" section appears directly below search bar | • Section header shows "My Timelines" or current user name<br>• Section displayed before all other content<br>• Collapsed/expanded state persisted to localStorage<br>• Shows timeline count: "3 timelines" | TBD | TBD |
| CC-REQ-MYTIMELINES-002 | Create Timeline button placed within My Timelines section | • "+ Create New" or "+ New Timeline" button in section header (top-right)<br>• Button styled as primary CTA<br>• Clicking opens timeline creation flow<br>• Button always visible in My Timelines section | TBD | TBD |
| CC-REQ-MYTIMELINES-003 | User's timelines displayed as cards in horizontal scrollable row | • Timeline cards show title, event count, last modified date<br>• Horizontal scroll if more than 3-4 timelines<br>• Responsive: 1 column mobile, 2-3 visible desktop<br>• Click card navigates to /user/:userId/timeline/:timelineId | TBD | TBD |
| CC-REQ-MYTIMELINES-004 | Empty state when user has no timelines | • "You haven't created any timelines yet" message<br>• Prominent "+ Create Your First Timeline" button<br>• Helpful description: "Start documenting history"<br>• Optional: Show example/template timelines | TBD | TBD |
| CC-REQ-MYTIMELINES-005 | Quick actions on timeline cards | • Hover shows edit, delete, share icons<br>• Edit opens timeline in editor<br>• Delete shows confirmation dialog<br>• Share copies link to clipboard (future: share dialog) | TBD | TBD |

### Platform Statistics Dashboard

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STATS-001 | Statistics section displays platform-wide metrics | • Section header: "Platform Statistics" or similar<br>• Metrics displayed in card/grid layout<br>• Responsive: 4 columns desktop, 2 columns tablet, 1 column mobile<br>• Icons for each metric for visual clarity | TBD | TBD |
| CC-REQ-STATS-002 | Display total timeline count | • Metric label: "Timelines"<br>• Value: count of all timelines in localStorage<br>• Updates reactively when timelines added/deleted<br>• Icon: 📅 or timeline icon | TBD | TBD |
| CC-REQ-STATS-003 | Display total user count | • Metric label: "Users"<br>• Value: count of all users<br>• Updates when users added (future)<br>• Icon: 👥 or user icon | TBD | TBD |
| CC-REQ-STATS-004 | Display total events across all timelines | • Metric label: "Events Documented"<br>• Value: sum of event counts across all timelines<br>• Updates when events added/removed<br>• Icon: 📌 or event icon | TBD | TBD |
| CC-REQ-STATS-005 | Display total views/engagement metric | • Metric label: "Total Views"<br>• Value: sum of view counts (localStorage counter for now)<br>• Increments when timeline opened<br>• Icon: 👁️ or view icon<br>• Note: Placeholder for v0.5.x analytics | TBD | TBD |
| CC-REQ-STATS-006 | Highlight most active timeline | • Small card highlighting timeline with most recent activity<br>• Shows timeline title, last editor, time since edit<br>• Clickable to navigate to timeline<br>• Refreshes when any timeline edited | TBD | TBD |

### Recently Edited Feed

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-RECENT-001 | Recently Edited section shows timelines sorted by modification date | • Section header: "🔥 Recently Edited" or similar<br>• Timelines sorted by `updatedAt` field (descending)<br>• Shows up to 6 timelines initially<br>• "Load More" or "View All" button if >6 timelines | TBD | TBD |
| CC-REQ-RECENT-002 | Timeline cards show recency indicator | • Relative time displayed: "2 hours ago", "3 days ago"<br>• Exact timestamp on hover<br>• Badge or indicator for "edited today"<br>• Owner name and avatar shown | TBD | TBD |
| CC-REQ-RECENT-003 | Empty state when no recently edited timelines | • "No recent activity" message<br>• Suggestion to create or edit a timeline<br>• Links to Featured or Popular sections | TBD | TBD |

### Popular Timelines Feed

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-POPULAR-001 | Popular section shows timelines sorted by view count | • Section header: "⭐ Popular Timelines" or similar<br>• Timelines sorted by view count (descending)<br>• View count displayed on each card<br>• Shows up to 6 timelines initially | TBD | TBD |
| CC-REQ-POPULAR-002 | View count tracked per timeline | • Each timeline has `viewCount` field in localStorage<br>• Incremented when timeline opened/viewed<br>• Persisted across sessions<br>• Note: Placeholder for v0.5.x server-side analytics | TBD | TBD |
| CC-REQ-POPULAR-003 | Fallback when insufficient view data | • If all timelines have 0 views, sort by event count instead<br>• Show "Most Detailed" instead of "Most Popular"<br>• Clear messaging about sorting criteria | TBD | TBD |

### Featured Timelines Feed

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-FEATURED-001 | Featured section shows curated timelines | • Section header: "✨ Featured" or similar<br>• Timelines with `featured: true` flag displayed<br>• Manual curation (set via Dev Panel for now)<br>• Shows up to 6 featured timelines | TBD | TBD |
| CC-REQ-FEATURED-002 | Featured badge displayed on timeline cards | • Visual indicator (star icon, badge) on featured cards<br>• "Featured" label or tooltip<br>• Distinguishes featured cards from regular ones | TBD | TBD |
| CC-REQ-FEATURED-003 | Empty state when no featured timelines | • "No featured timelines yet" message<br>• Admin note: "Set featured flag in Dev Panel"<br>• Fallback: Show recently edited instead | TBD | TBD |

### User Profile System

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-USER-001 | Demo user profiles include essential metadata | • User object contains: id, name, avatar, bio, createdAt<br>• Three default users: Alice, Bob, Charlie<br>• Avatar can be emoji or image URL<br>• Bio is optional text field (max 280 characters) | TBD | TBD |
| CC-REQ-USER-002 | User profile page displays user info and their timelines | • URL pattern: /user/:userId<br>• Page shows user avatar, name, bio<br>• Timeline list filtered by ownerId<br>• Shows timeline count and creation stats<br>• Same feed structure as home page (but filtered) | TBD | TBD |
| CC-REQ-USER-003 | User data persists in localStorage | • Users stored in localStorage key: 'powertimeline_users'<br>• JSON serialization of user array<br>• Data survives page refresh<br>• Graceful handling of corrupted data | TBD | TBD |
| CC-REQ-USER-004 | User profile accessible from timeline cards | • Clicking owner name/avatar navigates to /user/:userId<br>• Link styled distinctly (underline, color change)<br>• Breadcrumb navigation works (Home > User) | TBD | TBD |

### Routing & Navigation

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-ROUTE-001 | URL routing structure follows RESTful patterns | • `/` - Home/landing page<br>• `/user/:userId` - User profile page<br>• `/user/:userId/timeline/:timelineId` - Timeline editor<br>• `/search?q=query` - Search results page (optional)<br>• Invalid routes show 404 page | TBD | TBD |
| CC-REQ-ROUTE-002 | Browser back/forward buttons work correctly | • Clicking back returns to previous page<br>• Browser history tracks navigation properly<br>• Page state restored on back navigation<br>• No broken navigation loops | TBD | TBD |
| CC-REQ-ROUTE-003 | Breadcrumb navigation shows current location | • Breadcrumbs show: Home > User > Timeline hierarchy<br>• Each breadcrumb segment is clickable<br>• Current page highlighted in breadcrumb<br>• Breadcrumbs responsive on mobile (collapsible) | TBD | TBD |
| CC-REQ-ROUTE-004 | Deep linking to specific timelines works | • Direct URL navigation to /user/:userId/timeline/:timelineId loads correctly<br>• Missing users/timelines show appropriate 404<br>• URL parameters validated and sanitized | TBD | TBD |

### Timeline Card Component

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-CARD-001 | Timeline cards display comprehensive metadata | • Title (bold, prominent)<br>• Description (truncated with ellipsis if >2 lines)<br>• Event count (e.g., "47 events")<br>• Owner name and avatar<br>• Last modified date (relative: "2 days ago")<br>• View count (if available) | TBD | TBD |
| CC-REQ-CARD-002 | Timeline cards provide visual feedback on hover | • Elevation/shadow increases on hover<br>• Border color changes (optional)<br>• Cursor changes to pointer<br>• Smooth transition (200ms) | TBD | TBD |
| CC-REQ-CARD-003 | Timeline cards show minimap preview on hover (optional) | • After 500ms hover delay, show minimap thumbnail<br>• Preview positioned to not obscure card<br>• Preview shows event distribution visualization<br>• Dismisses on mouse leave | TBD | TBD |
| CC-REQ-CARD-004 | Timeline cards responsive design | • Desktop: 3 columns, card width ~300px<br>• Tablet: 2 columns<br>• Mobile: 1 column, full width<br>• Grid gap: 16-24px | TBD | TBD |

### Page Layout & Design

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-LAYOUT-001 | Header contains branding and navigation | • PowerTimeline logo/text on left<br>• User profile link on right ("My Profile" or user avatar)<br>• Sticky header on scroll (optional)<br>• Responsive: hamburger menu on mobile | TBD | TBD |
| CC-REQ-LAYOUT-002 | Main content area has max-width constraint | • Max width: 1200px (centered)<br>• Padding: 16-24px on sides<br>• Responsive scaling for smaller screens<br>• Consistent vertical spacing between sections | TBD | TBD |
| CC-REQ-LAYOUT-003 | Section headers styled consistently | • Typography: H2 or H3, semi-bold<br>• Icon + text combination<br>• Horizontal rule or divider below (optional)<br>• Margin: 32-48px top, 16-24px bottom | TBD | TBD |
| CC-REQ-LAYOUT-004 | Empty states provide clear guidance | • Icon or illustration for visual appeal<br>• Clear message explaining why empty<br>• Call-to-action button when applicable<br>• Friendly, encouraging tone | TBD | TBD |

### Data Management

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-DATA-001 | Timeline objects include ownership and engagement metadata | • Timeline has: id, title, description, events, ownerId<br>• New fields: viewCount (number), featured (boolean)<br>• Timestamps: createdAt, updatedAt (ISO strings)<br>• Existing timelines migrated with default values | TBD | TBD |
| CC-REQ-DATA-002 | localStorage schema supports multi-user timelines and stats | • Timelines: 'powertimeline_timelines'<br>• Users: 'powertimeline_users'<br>• Stats: 'powertimeline_stats' (optional cache)<br>• View preferences: 'powertimeline_prefs' | TBD | TBD |
| CC-REQ-DATA-003 | Demo users pre-populated on first load | • Check if users exist in localStorage<br>• If empty, create Alice, Bob, Charlie with bios/avatars<br>• Assign sample timelines to demo users<br>• Idempotent initialization (safe to run multiple times) | TBD | TBD |
| CC-REQ-DATA-004 | View count increments on timeline access | • When timeline editor opens, increment viewCount<br>• Debounced: max 1 increment per session per timeline<br>• Persist to localStorage immediately<br>• Handle concurrent tab scenarios gracefully | TBD | TBD |

## Implementation Notes

### Updated Timeline Type

```typescript
interface Timeline {
  id: string;
  title: string;
  description?: string;
  events: Event[];
  ownerId: string;           // References User.id
  createdAt: string;         // ISO date
  updatedAt: string;         // ISO date
  viewCount: number;         // NEW: Number of views
  featured: boolean;         // NEW: Featured flag (manual curation)
  visibility?: 'public' | 'private';  // Future: v0.5.x
}
```

### User Type (unchanged)

```typescript
interface User {
  id: string;           // e.g., "alice", "bob", "charlie"
  name: string;         // Display name
  avatar: string;       // Emoji or image URL
  bio?: string;         // Optional biography (max 280 chars)
  createdAt: string;    // ISO date
}
```

### Search Algorithm

```typescript
function searchTimelinesAndUsers(query: string): SearchResults {
  const lowerQuery = query.toLowerCase();

  // Search timelines
  const matchingTimelines = timelines.filter(t =>
    t.title.toLowerCase().includes(lowerQuery) ||
    t.description?.toLowerCase().includes(lowerQuery)
  );

  // Search users
  const matchingUsers = users.filter(u =>
    u.name.toLowerCase().includes(lowerQuery) ||
    u.bio?.toLowerCase().includes(lowerQuery)
  );

  return {
    timelines: matchingTimelines.slice(0, 5),  // Max 5
    users: matchingUsers.slice(0, 3),          // Max 3
    hasMore: matchingTimelines.length > 5 || matchingUsers.length > 3
  };
}
```

### localStorage Keys

```typescript
const STORAGE_KEYS = {
  USERS: 'powertimeline_users',
  TIMELINES: 'powertimeline_timelines',
  CURRENT_USER: 'powertimeline_current_user',
  VIEW_PREFERENCES: 'powertimeline_view_prefs',
  STATS_CACHE: 'powertimeline_stats'  // Optional cache
} as const;
```

### Component Hierarchy

```
App
├── Router
│   ├── HomePage
│   │   ├── Header (logo, user profile link)
│   │   ├── SearchBar (unified search)
│   │   ├── MyTimelinesSection
│   │   │   ├── SectionHeader (+ Create button)
│   │   │   └── TimelineCard[] (horizontal scroll)
│   │   ├── StatisticsSection
│   │   │   └── MetricCard[] (grid)
│   │   ├── RecentlyEditedSection
│   │   │   └── TimelineCard[] (grid)
│   │   ├── PopularTimelinesSection
│   │   │   └── TimelineCard[] (grid)
│   │   └── FeaturedTimelinesSection
│   │       └── TimelineCard[] (grid)
│   ├── UserProfilePage
│   │   ├── Header
│   │   ├── UserProfileHeader (avatar, name, bio)
│   │   ├── UserTimelinesSection
│   │   │   └── TimelineCard[] (grid)
│   │   └── Footer
│   └── TimelineEditorPage (existing)
│       └── DeterministicLayoutComponent
└── Breadcrumbs (global)
```

## Test Coverage Plan

### Priority 1 - Core Functionality
- [ ] v0.4.0/01-home-page-loads.spec.ts - Home page renders without errors
- [ ] v0.4.0/02-search-basic.spec.ts - Search finds timelines and users
- [ ] v0.4.0/03-my-timelines-section.spec.ts - User section displays correctly
- [ ] v0.4.0/04-create-timeline-button.spec.ts - Create button in My Timelines works

### Priority 2 - Feeds & Statistics
- [ ] v0.4.0/05-statistics-dashboard.spec.ts - Stats display correct counts
- [ ] v0.4.0/06-recently-edited-feed.spec.ts - Recently edited shows latest
- [ ] v0.4.0/07-popular-timelines-feed.spec.ts - Popular sorted by views
- [ ] v0.4.0/08-featured-timelines.spec.ts - Featured flag works

### Priority 3 - Navigation & User Profiles
- [ ] v0.4.0/09-routing-structure.spec.ts - All routes work
- [ ] v0.4.0/10-user-profile-page.spec.ts - User profiles display
- [ ] v0.4.0/11-timeline-card-click.spec.ts - Clicking card navigates
- [ ] v0.4.0/12-breadcrumb-navigation.spec.ts - Breadcrumbs work

### Priority 4 - Edge Cases & Polish
- [ ] v0.4.0/13-empty-states.spec.ts - Empty states display properly
- [ ] v0.4.0/14-search-no-results.spec.ts - No results handled gracefully
- [ ] v0.4.0/15-view-count-increment.spec.ts - View counts increment
- [ ] v0.4.0/16-responsive-layout.spec.ts - Mobile/tablet layouts work

## Change History

- **2025-01-XX** — Revised SRS with search-first, user-section-first design
- Unified search for timelines and users
- "My Timelines" section prioritized below search
- Create button nested in user section
- Added Statistics, Recently Edited, Popular, Featured feeds
- Requirements align with modern social platform UX
