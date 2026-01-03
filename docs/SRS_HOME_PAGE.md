# Home Page & Timeline Discovery Requirements

This document specifies requirements for the landing page and timeline discovery features (v0.5.29). The home page follows a modern, search-first design with the authenticated user's personal workspace prioritized, followed by discovery feeds backed by Firestore.

## Scope

**In Scope:**
- Search-first home page layout with unified search (timelines + users)
- User personal section ("My Timelines") with create functionality and pagination
- Platform statistics dashboard backed by platform stats documents
- Activity feeds (Recently Edited, Popular, Featured)
- User profile pages
- URL routing structure
- Firebase-authenticated user experience (My Timelines only when signed in)

**Out of Scope (Deferred):**
- Guest/demo user workflows
- Real-time collaboration (v0.6.x)
- Forking/merging workflows (v0.6.x)
- Advanced analytics/metrics beyond platform aggregates

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
| CC-REQ-SEARCH-001 | Unified search bar searches both timelines and users | • Search input field prominently displayed below header<br>• Search queries match timeline titles, descriptions, AND user names<br>• Real-time search results as user types<br>• Case-insensitive fuzzy matching<br>• Minimum 2 characters before search triggers | `src/pages/HomePage.tsx:344-376` | TBD |
| CC-REQ-SEARCH-002 | Search results displayed in dropdown with categorization | • Results dropdown shows "Timelines" and "Users" sections<br>• Up to 5 timelines and 3 users shown<br>• Each result clickable to navigate<br>• "View all results" link if more than max shown<br>• Dropdown dismisses on selection or click outside | `src/pages/HomePage.tsx:344-376` | TBD |
| CC-REQ-SEARCH-003 | Search provides helpful feedback for no results | • "No results for '{query}'" message displayed<br>• Suggestions: "Try different keywords" or "Browse featured timelines"<br>• Empty state illustration/icon<br>• Quick action to create new timeline if no matches | `src/pages/HomePage.tsx:344-376` | TBD |
| CC-REQ-SEARCH-004 | Search box includes clear/reset functionality | • Clear button (×) appears when text entered<br>• Clicking clear empties search and dismisses dropdown<br>• ESC key also clears search<br>• Placeholder text: "Search timelines and users..." | `src/pages/HomePage.tsx:344-376` | TBD |

### My Timelines Section (User Workspace)

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-MYTIMELINES-001 | "My Timelines" section appears directly below search bar | - Section header shows "My Timelines" with total count<br>- Section displayed before all other content<br>- Hidden when user is signed out; loads authenticated user's timelines<br>- Timeline count reflects loaded results | `src/pages/HomePage.tsx:38-262`, `src/pages/HomePage.tsx:667-759` | TBD |
| CC-REQ-MYTIMELINES-002 | Create Timeline button placed within My Timelines section | - "+ Create New" or "+ New Timeline" button in section header (top-right)<br>- Button styled as primary CTA<br>- Clicking opens timeline creation flow<br>- Button always visible in My Timelines section | `src/pages/HomePage.tsx:667-707` | TBD |
| CC-REQ-MYTIMELINES-003 | User's timelines displayed as cards in horizontal scrollable row | - Timeline cards show title, event count, last modified date<br>- Horizontal scroll if more than 3-4 timelines<br>- Responsive: 1 column mobile, 2-3 visible desktop<br>- Click card navigates to /user/:userId/timeline/:timelineId | `src/pages/HomePage.tsx:684-759` | TBD |
| CC-REQ-MYTIMELINES-004 | Empty state when user has no timelines | - "You haven't created any timelines yet" message<br>- Prominent "+ Create Your First Timeline" button<br>- Helpful description: "Start documenting history"<br>- Optional: Show example/template timelines | `src/pages/HomePage.tsx:684-759` | TBD |
| CC-REQ-MYTIMELINES-005 | Quick actions on timeline cards via kebab menu | - Always-visible kebab menu button in top-right of each card<br>- Menu shows: View, Edit (owner only), Delete (owner only)<br>- View navigates to timeline<br>- Edit opens timeline metadata editor<br>- Delete shows confirmation dialog<br>- Works on desktop and touch devices<br>- Keyboard accessible (Tab, Enter, Escape) | `src/components/TimelineCardMenu.tsx`, `src/pages/HomePage.tsx:684-759` | TBD |
| CC-REQ-MYTIMELINES-006 | Paginated My Timelines list uses configurable page size | - Page size controlled by `MY_TIMELINES_PAGE_SIZE` constant for initial and subsequent queries<br>- Queries ordered by `updatedAt` descending for consistent pagination<br>- Changing page size updates both initial load and "Load More" queries<br>- Pagination uses Firestore cursor (`startAfter`) to avoid duplicates | `src/pages/HomePage.tsx:38-262`, `src/services/firestore.ts:235-280` | TBD |
| CC-REQ-MYTIMELINES-007 | "Load More" button fetches additional timeline pages | - Button renders only when `myTimelinesHasMore` is true<br>- Clicking calls `handleLoadMoreMyTimelines` and appends the next page<br>- Button disables during fetch to prevent duplicate requests<br>- Cursor updates after each page to continue pagination | `src/pages/HomePage.tsx:234-262`, `src/pages/HomePage.tsx:801-833` | TBD |
| CC-REQ-MYTIMELINES-008 | Loading states shown during pagination | - "Load More" button text switches to "Loading..." while fetching<br>- Additional skeleton cards render while loading more pages<br>- `loadingMoreMyTimelines` guard blocks concurrent pagination calls | `src/pages/HomePage.tsx:211-262`, `src/pages/HomePage.tsx:787-834` | TBD |

### Platform Statistics Dashboard

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-STATS-001 | Statistics section displays platform-wide metrics | - Section header: "Platform Statistics" or similar<br>- Metrics displayed in card/grid layout<br>- Responsive: 4 columns desktop, 2 columns tablet, 1 column mobile<br>- Icons for each metric for visual clarity | `src/pages/HomePage.tsx:904-944` | TBD |
| CC-REQ-STATS-002 | Display total timeline count | - Metric label: "Timelines"<br>- Value: count of all timelines from platform stats document<br>- Updates when Cloud Functions refresh stats<br>- Icon: timeline icon | `src/pages/HomePage.tsx:904-944`, `src/services/firestore.ts:1068-1150` | TBD |
| CC-REQ-STATS-003 | Display total user count | - Metric label: "Users"<br>- Value: count of all users from platform stats document<br>- Updates when Cloud Functions refresh stats<br>- Icon: user icon | `src/pages/HomePage.tsx:904-944`, `src/services/firestore.ts:1068-1150` | TBD |
| CC-REQ-STATS-004 | Display total events across all timelines | - Metric label: "Events Documented"<br>- Value: sum of event counts across all timelines<br>- Updates when events added/removed<br>- Icon: event icon | `src/pages/HomePage.tsx:904-944`, `src/services/firestore.ts:1068-1150` | TBD |
| CC-REQ-STATS-005 | Display total views/engagement metric | - Metric label: "Total Views"<br>- Value: sum of view counts from platform stats document<br>- Increments when timelines are opened (tracked in Firestore)<br>- Icon: view icon | `src/pages/HomePage.tsx:904-944`, `src/services/firestore.ts:1068-1150` | TBD |
| CC-REQ-STATS-006 | Highlight most active timeline (deferred) | - Highlight card deferred to discovery refresh; not rendered in v0.5.29<br>- When implemented, shows title, last editor, time since edit<br>- Clickable to navigate to timeline<br>- Refreshes when any timeline edited | `src/pages/HomePage.tsx:904-944`, `src/services/firestore.ts:1068-1150` | TBD |

### Recently Edited Feed

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-RECENT-001 | Recently Edited section shows timelines sorted by modification date | - Section header: "Recently Edited" or similar<br>- Timelines sorted by `updatedAt` field (descending)<br>- Shows up to 6 timelines initially<br>- "Load More" or "View All" button if >6 timelines | `src/pages/HomePage.tsx:110-150`, `src/pages/HomePage.tsx:954-1038`, `src/services/firestore.ts:103-200` | TBD |
| CC-REQ-RECENT-002 | Timeline cards show recency indicator | - Relative time displayed: "2 hours ago", "3 days ago"<br>- Exact timestamp on hover<br>- Badge or indicator for "edited today"<br>- Owner name and avatar shown | `src/pages/HomePage.tsx:954-1038`, `src/services/firestore.ts:103-200` | TBD |
| CC-REQ-RECENT-003 | Empty state when no recently edited timelines | - "No recent activity" message<br>- Suggestion to create or edit a timeline<br>- Links to Featured or Popular sections | `src/pages/HomePage.tsx:954-1038` | TBD |

### Popular Timelines Feed

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-POPULAR-001 | Popular section shows timelines sorted by view count | - Section header: "Popular Timelines" or similar<br>- Timelines sorted by view count (descending)<br>- View count displayed on each card<br>- Shows up to 6 timelines initially | `src/pages/HomePage.tsx:110-150`, `src/pages/HomePage.tsx:744-808`, `src/services/firestore.ts:103-200` | TBD |
| CC-REQ-POPULAR-002 | View count tracked per timeline | - Each timeline has `viewCount` field stored in Firestore<br>- Incremented when timeline opened/viewed<br>- Persisted across sessions via backend storage<br>- Supports analytics using backend persistence only | `src/services/firestore.ts:465-580`, `src/pages/HomePage.tsx:744-808` | TBD |
| CC-REQ-POPULAR-003 | Fallback when insufficient view data (deferred) | - Fallback sorting strategy deferred; current implementation relies on `viewCount`<br>- Future: if all timelines have 0 views, sort by alternate metric (event count)<br>- Clear messaging about sorting criteria once implemented | `src/pages/HomePage.tsx:744-808` | TBD |

### Featured Timelines Feed

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-FEATURED-001 | Featured section shows curated timelines | - Section header: "Featured" or similar<br>- Timelines with `featured: true` flag displayed<br>- Manual curation (set via Dev Panel/admin tools)<br>- Shows up to 6 featured timelines<br>- Section may be hidden when no featured timelines are available | `src/pages/HomePage.tsx:966-1038` | TBD |
| CC-REQ-FEATURED-002 | Featured badge displayed on timeline cards | - Visual indicator (star icon, badge) on featured cards<br>- "Featured" label or tooltip<br>- Distinguishes featured cards from regular ones | `src/pages/HomePage.tsx:966-1038` | TBD |
| CC-REQ-FEATURED-003 | Empty state when no featured timelines | - "No featured timelines yet" message<br>- Admin note: "Set featured flag in Dev Panel"<br>- Fallback: Show recently edited instead | `src/pages/HomePage.tsx:966-1038` | TBD |

### User Profile System

➡️ See [`SRS_USER_PAGE.md`](SRS_USER_PAGE.md) for detailed user profile requirements.

### Routing & Navigation

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-ROUTE-001 | URL routing structure follows RESTful patterns | • `/` - Home/landing page<br>• `/user/:userId` - User profile page<br>• `/user/:userId/timeline/:timelineId` - Timeline editor<br>• `/search?q=query` - Search results page (optional)<br>• Invalid routes show 404 page | `src/main.tsx` | TBD |
| CC-REQ-ROUTE-002 | Browser back/forward buttons work correctly | • Clicking back returns to previous page<br>• Browser history tracks navigation properly<br>• Page state restored on back navigation<br>• No broken navigation loops | `src/main.tsx` | TBD |
| CC-REQ-ROUTE-003 | Breadcrumb navigation shows current location | • Breadcrumbs show: Home > User > Timeline hierarchy<br>• Each breadcrumb segment is clickable<br>• Current page highlighted in breadcrumb<br>• Breadcrumbs responsive on mobile (collapsible) | `src/main.tsx` | TBD |
| CC-REQ-ROUTE-004 | Deep linking to specific timelines works | • Direct URL navigation to /user/:userId/timeline/:timelineId loads correctly<br>• Missing users/timelines show appropriate 404<br>• URL parameters validated and sanitized | `src/main.tsx` | TBD |

### Timeline Card Component

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-CARD-001 | Timeline cards display comprehensive metadata | • Title (bold, prominent)<br>• Description (truncated with ellipsis if >2 lines)<br>• Event count (e.g., "47 events")<br>• Owner name and avatar<br>• Last modified date (relative: "2 days ago")<br>• View count (if available) | `src/pages/HomePage.tsx:599-966` | TBD |
| CC-REQ-CARD-002 | Timeline cards provide visual feedback on hover | • Elevation/shadow increases on hover<br>• Border color changes (optional)<br>• Cursor changes to pointer<br>• Smooth transition (200ms) | `src/pages/HomePage.tsx:599-966` | TBD |
| CC-REQ-CARD-003 | Timeline cards show minimap preview on hover (optional) | • After 500ms hover delay, show minimap thumbnail<br>• Preview positioned to not obscure card<br>• Preview shows event distribution visualization<br>• Dismisses on mouse leave | `src/pages/HomePage.tsx:599-966` | TBD |
| CC-REQ-CARD-004 | Timeline cards responsive design | • Desktop: 3 columns, card width ~300px<br>• Tablet: 2 columns<br>• Mobile: 1 column, full width<br>• Grid gap: 16-24px | `src/pages/HomePage.tsx:599-966` | TBD |

### Page Layout & Design

➡️ See [`SRS_LAYOUT.md`](SRS_LAYOUT.md) for detailed layout requirements.

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-PAGE-LAYOUT-001 | Header contains branding and navigation | • PowerTimeline logo/text on left<br>• User profile link on right ("My Profile" or user avatar)<br>• Sticky header on scroll (optional)<br>• Responsive: hamburger menu on mobile | `src/pages/HomePage.tsx:1-150` | TBD |
| CC-REQ-PAGE-LAYOUT-002 | Main content area has max-width constraint | • Max width: 1200px (centered)<br>• Padding: 16-24px on sides<br>• Responsive scaling for smaller screens<br>• Consistent vertical spacing between sections | `src/pages/HomePage.tsx:1-150` | TBD |
| CC-REQ-PAGE-LAYOUT-003 | Section headers styled consistently | • Typography: H2 or H3, semi-bold<br>• Icon + text combination<br>• Horizontal rule or divider below (optional)<br>• Margin: 32-48px top, 16-24px bottom | `src/pages/HomePage.tsx:1-150` | TBD |
| CC-REQ-PAGE-LAYOUT-004 | Empty states provide clear guidance | • Icon or illustration for visual appeal<br>• Clear message explaining why empty<br>• Call-to-action button when applicable<br>• Friendly, encouraging tone | `src/pages/HomePage.tsx:1-150` | TBD |

### Data Management

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-HOME-DATA-001 | Timeline objects include ownership and engagement metadata | - Timeline metadata has: id, title, description, ownerId, createdAt, updatedAt, viewCount, featured, visibility, eventCount<br>- Event collections stored separately from metadata<br>- Defaults applied for missing fields when created | `src/types.ts:24-71`, `src/services/firestore.ts:235-310` | TBD |
| CC-REQ-HOME-DATA-002 | Firestore schema supports multi-user timelines and stats | - Timelines stored under `/users/{userId}/timelines` with collection group queries for discovery<br>- Pagination uses `startAfter` cursor to fetch additional pages<br>- Platform stats read from `stats/platform` document with Cloud Functions upkeep | `src/services/firestore.ts:103-320`, `src/services/firestore.ts:1068-1150` | TBD |
| CC-REQ-HOME-DATA-003 | Authenticated user data drives My Timelines | - Current user fetched from Firebase Auth and Firestore profile<br>- My Timelines clears when signed out and reloads when signed in<br>- No reliance on client-side seeds or demo users for workspace data | `src/pages/HomePage.tsx:24-210`, `src/services/firestore.ts:103-190` | TBD |
| CC-REQ-HOME-DATA-004 | View count persists in Firestore | - Timelines include `viewCount` field persisted in Firestore<br>- View increments handled server-side or via Firestore updates<br>- Popular feed sorts by stored `viewCount` values | `src/services/firestore.ts:465-580`, `src/pages/HomePage.tsx:110-150`, `src/pages/HomePage.tsx:744-808` | TBD |

## Implementation Notes

### Timeline Types

```typescript
interface TimelineMetadata {
  id: string;
  title: string;
  description?: string;
  ownerId: string;           // Firebase Auth UID
  createdAt: string;         // ISO date
  updatedAt: string;         // ISO date
  viewCount: number;         // Number of views
  featured: boolean;         // Featured flag (manual curation)
  visibility: 'public' | 'unlisted' | 'private';
  eventCount: number;        // Stored event count for cards
}

interface Timeline extends TimelineMetadata {
  events: Event[];
}
```

### User Type

```typescript
interface User {
  id: string;           // Firebase Auth UID
  email: string;        // User's email address
  username: string;     // URL-safe username
  createdAt: string;    // ISO date
  role?: 'user' | 'admin';
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

### Component Hierarchy

```
App
- Router
  - HomePage
    - Header (logo, user profile link)
    - SearchBar (unified search)
    - MyTimelinesSection
      - SectionHeader (+ Create button)
      - TimelineCard[] (horizontal scroll)
    - StatisticsSection
      - MetricCard[] (grid)
    - RecentlyEditedSection
      - TimelineCard[] (grid)
    - PopularTimelinesSection
      - TimelineCard[] (grid)
    - FeaturedTimelinesSection
      - TimelineCard[] (grid)
  - UserProfilePage
    - Header
    - UserProfileHeader (avatar, name, bio)
    - UserTimelinesSection
      - TimelineCard[] (grid)
    - Footer
  - TimelineEditorPage (existing)
    - DeterministicLayoutComponent
- Breadcrumbs (global)
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

- **2026-01-02** - Added My Timelines pagination requirements (configurable page size, Load More button, pagination loading states) and removed legacy demo-only references; refreshed code pointers to Firestore-backed flows.
- **2025-12-27** - Updated code references from audit findings (pre-Firestore migration)
- **2025-10-26** - Updated Timeline data model with visibility controls (v0.4.2)
- Added 'unlisted' visibility level to Timeline interface
- Updated visibility from optional to required field
- See SRS_TIMELINE_CREATION.md for detailed visibility requirements

- **2025-01-XX** - Revised SRS with search-first, user-section-first design
- Unified search for timelines and users
- "My Timelines" section prioritized below search
- Create button nested in user section
- Added Statistics, Recently Edited, Popular, Featured feeds
- Requirements align with modern social platform UX
