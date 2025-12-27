# Timeline Creation & Management Requirements (v0.4.1)

This document specifies requirements for timeline CRUD operations enabling users to create, edit, and delete timelines through the UI.

## Scope

**In Scope:**
- Timeline creation with title, description, and auto-generated ID
- Timeline metadata editing (title, description, ID)
- Timeline deletion with confirmation
- Form validation and error handling
- localStorage persistence

**Out of Scope:**
- Timeline duplication (deferred)
- First event creation during timeline creation (deferred)
- Advanced metadata (tags, categories) (v0.4.3)
- Cloud storage/sync (v0.5.0)
- Version history (v0.6.0)

## Requirements Table

### Timeline Creation

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-CREATE-001 | The software shall provide a dialog to create new timelines | Dialog opens when user clicks "+ Create New" button | `src/components/CreateTimelineDialog.tsx` | v5/74 |
| CC-REQ-CREATE-002 | The software shall require a timeline title between 3-100 characters | Save button disabled until title is valid | `src/components/CreateTimelineDialog.tsx` | v5/74 |
| CC-REQ-CREATE-003 | The software shall accept an optional timeline description up to 500 characters | Description field accepts text, validation only for max length | `src/components/CreateTimelineDialog.tsx` | v5/74 |
| CC-REQ-CREATE-ID-001 | The software shall generate a unique timeline ID from the title | ID auto-generated as slug (e.g., "My Timeline" → "my-timeline") | `src/lib/homePageStorage.ts:255-263` | v5/75 |
| CC-REQ-CREATE-ID-002 | The software shall display the generated ID in an editable field | User can view and modify ID before saving | `src/components/CreateTimelineDialog.tsx` | v5/75 |
| CC-REQ-CREATE-ID-003 | The software shall enforce ID uniqueness per user account | Duplicate ID shows error: "ID already exists" | `src/lib/homePageStorage.ts:295-298` | v5/75 |
| CC-REQ-CREATE-ID-004 | The software shall use timeline ID in URLs | Timeline accessible at /user/:userId/timeline/:timelineId | `src/main.tsx` | v5/75 |
| CC-REQ-CREATE-005 | The software shall save timeline to localStorage on Create | Timeline persisted with createdAt and updatedAt timestamps | `src/lib/homePageStorage.ts:470-504` | v5/74 |
| CC-REQ-CREATE-006 | The software shall redirect to timeline editor after creation | User navigated to /user/:userId/timeline/:timelineId | `src/components/CreateTimelineDialog.tsx` | v5/74 |
| CC-REQ-CREATE-007 | The software shall allow canceling creation | Cancel button closes dialog without saving | `src/components/CreateTimelineDialog.tsx` | v5/74 |

### Timeline Editing

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-EDIT-001 | The software shall provide access to edit timeline metadata from timeline card | Settings icon on timeline card opens edit dialog | `src/components/EditTimelineDialog.tsx` | v5/76 |
| CC-REQ-EDIT-002 | The software shall allow editing timeline title and description | Edit dialog pre-populated with current values | `src/components/EditTimelineDialog.tsx` | v5/76 |
| CC-REQ-EDIT-003 | The software shall allow editing timeline ID | ID field editable with uniqueness validation | `src/components/EditTimelineDialog.tsx` | v5/76 |
| CC-REQ-EDIT-004 | The software shall update timeline metadata in localStorage | Changes saved on Save button, updatedAt timestamp refreshed | `src/lib/homePageStorage.ts:509-521` | v5/76 |
| CC-REQ-EDIT-005 | The software shall reflect changes immediately in UI | Timeline card shows updated title/description without refresh | `src/components/EditTimelineDialog.tsx` | v5/76 |

### Timeline Deletion

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-DELETE-001 | The software shall provide delete action in timeline card menu | Delete option accessible from context menu | `src/components/DeleteTimelineDialog.tsx` | v5/77 |
| CC-REQ-DELETE-002 | The software shall require confirmation before deletion | Confirmation dialog shows timeline title and event count | `src/components/DeleteTimelineDialog.tsx` | v5/77 |
| CC-REQ-DELETE-003 | The software shall remove timeline from localStorage on confirmation | Timeline and all events deleted permanently | `src/lib/homePageStorage.ts:526-530` | v5/77 |
| CC-REQ-DELETE-004 | The software shall redirect to home page after deletion | User navigated to / after successful deletion | `src/components/DeleteTimelineDialog.tsx` | v5/77 |

### Timeline Visibility Controls (v0.4.2)

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-VISIBILITY-001 | The software shall support three visibility levels | Timeline visibility set to: 'public', 'unlisted', or 'private' | `src/types.ts:28,44` | TBD |
| CC-REQ-VISIBILITY-002 | The software shall provide visibility selector in timeline creation dialog | Dropdown with: Public (visible to everyone), Unlisted (accessible via URL), Private (only owner) | `src/components/CreateTimelineDialog.tsx` | TBD |
| CC-REQ-VISIBILITY-003 | The software shall provide visibility selector in timeline edit dialog | Dropdown pre-populated with current visibility, allows changing | `src/components/EditTimelineDialog.tsx` | TBD |
| CC-REQ-VISIBILITY-004 | The software shall default new timelines to 'public' visibility | Create dialog initializes with 'public' selected | `src/lib/homePageStorage.ts:476` | TBD |
| CC-REQ-VISIBILITY-005 | The software shall filter private timelines from discovery feeds | Recently Edited, Popular, Featured feeds exclude private timelines not owned by current user | `src/lib/homePageStorage.ts:537-543,573-579,586-603,609-614` | TBD |
| CC-REQ-VISIBILITY-006 | The software shall display visibility indicators on timeline cards | All timeline cards show badge: 🌍 Public (green), 🔗 Unlisted (yellow), or 🔒 Private (red) | `src/pages/HomePage.tsx:723-734` | TBD |
| CC-REQ-VISIBILITY-007 | The software shall position visibility badges consistently | Badges appear at bottom right of timeline cards across all pages | `src/pages/HomePage.tsx:723-734` | TBD |

### Form Validation

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-VALID-001 | The software shall validate title length (3-100 characters) | Error message shown if title too short or too long | `src/components/CreateTimelineDialog.tsx` | v5/78 |
| CC-REQ-VALID-002 | The software shall validate description length (max 500 characters) | Character counter shown, error if exceeds limit | `src/components/CreateTimelineDialog.tsx` | v5/78 |
| CC-REQ-VALID-003 | The software shall validate ID format (lowercase, hyphens, alphanumeric) | Error message if ID contains invalid characters | `src/components/CreateTimelineDialog.tsx` | v5/78 |
| CC-REQ-VALID-004 | The software shall display validation errors inline | Error messages appear below respective fields | `src/components/CreateTimelineDialog.tsx` | v5/78 |

### Data Persistence

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-PERSIST-001 | The software shall store timelines in localStorage under 'powertimeline_timelines' | Data persists across browser sessions | `src/lib/homePageStorage.ts:12-20,443-448` | v5/79 |
| CC-REQ-PERSIST-002 | The software shall set createdAt timestamp on creation | ISO 8601 format timestamp | `src/lib/homePageStorage.ts:478,492` | v5/79 |
| CC-REQ-PERSIST-003 | The software shall update updatedAt timestamp on modification | ISO 8601 format timestamp refreshed on edit | `src/lib/homePageStorage.ts:517` | v5/79 |
| CC-REQ-PERSIST-004 | The software shall handle localStorage quota exceeded errors | User-friendly error message displayed | `src/lib/homePageStorage.ts:447` | v5/79 |

### User Feedback

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-UX-001 | The software shall display success notification after timeline creation | Toast message: "Timeline created successfully" | `src/components/CreateTimelineDialog.tsx` | v5/74 |
| CC-REQ-UX-002 | The software shall display success notification after timeline edit | Toast message: "Changes saved successfully" | `src/components/EditTimelineDialog.tsx` | v5/76 |
| CC-REQ-UX-003 | The software shall display success notification after timeline deletion | Toast message: "Timeline deleted successfully" | `src/components/DeleteTimelineDialog.tsx` | v5/77 |
| CC-REQ-UX-004 | The software shall support keyboard shortcut ESC to close dialogs | ESC key closes dialog without saving | `src/components/CreateTimelineDialog.tsx` | v5/78 |

## Timeline Data Model

```typescript
interface Timeline {
  id: string;           // Unique slug (e.g., "french-revolution")
  title: string;        // Display name (e.g., "French Revolution")
  description?: string; // Optional description
  events: Event[];
  ownerId: string;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
  viewCount: number;
  featured: boolean;
  visibility: 'public' | 'unlisted' | 'private';  // v0.4.2
}
```

## Test Coverage

| Test ID | Description | Requirements Covered |
|---|---|---|
| v5/74 | Timeline creation flow | CREATE-001 to 007, UX-001 |
| v5/75 | Timeline ID generation and uniqueness | CREATE-ID-001 to 004 |
| v5/76 | Timeline metadata editing | EDIT-001 to 005, UX-002 |
| v5/77 | Timeline deletion with confirmation | DELETE-001 to 004, UX-003 |
| v5/78 | Form validation (title, description, ID) | VALID-001 to 004, UX-004 |
| v5/79 | Data persistence and localStorage | PERSIST-001 to 004 |
| v5/80 | Timeline visibility controls (v0.4.2) | VISIBILITY-001 to 007 |

## Change History

- **2025-12-27** — Updated code references for all requirements
- Added specific file paths and line numbers to Code column
- All TBD code references now point to actual implementation

- **2025-10-26** — Added Timeline Visibility Controls (v0.4.2)
- Added 7 visibility requirements (VISIBILITY-001 to 007)
- Updated Timeline data model with three visibility levels
- Added test coverage entry for visibility controls (v5/80)

- **2025-10-24** — Initial SRS creation (simplified ASPICE-style)
- Focused on core CRUD operations (Create, Edit, Delete)
- Removed duplication and first event creation features
- Added ID vs Title distinction with uniqueness validation
- Reduced from 40+ to 28 focused requirements
- Reduced from 16 to 6 essential test scenarios
