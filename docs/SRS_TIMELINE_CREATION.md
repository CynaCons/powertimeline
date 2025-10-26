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
- Advanced metadata (tags, categories) (v0.4.2)
- Cloud storage/sync (v0.5.0)
- Version history (v0.6.0)

## Requirements Table

### Timeline Creation

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-CREATE-001 | The software shall provide a dialog to create new timelines | Dialog opens when user clicks "+ Create New" button | TBD | v5/74 |
| CC-REQ-CREATE-002 | The software shall require a timeline title between 3-100 characters | Save button disabled until title is valid | TBD | v5/74 |
| CC-REQ-CREATE-003 | The software shall accept an optional timeline description up to 500 characters | Description field accepts text, validation only for max length | TBD | v5/74 |
| CC-REQ-CREATE-ID-001 | The software shall generate a unique timeline ID from the title | ID auto-generated as slug (e.g., "My Timeline" → "my-timeline") | TBD | v5/75 |
| CC-REQ-CREATE-ID-002 | The software shall display the generated ID in an editable field | User can view and modify ID before saving | TBD | v5/75 |
| CC-REQ-CREATE-ID-003 | The software shall enforce ID uniqueness per user account | Duplicate ID shows error: "ID already exists" | TBD | v5/75 |
| CC-REQ-CREATE-ID-004 | The software shall use timeline ID in URLs | Timeline accessible at /user/:userId/timeline/:timelineId | TBD | v5/75 |
| CC-REQ-CREATE-005 | The software shall save timeline to localStorage on Create | Timeline persisted with createdAt and updatedAt timestamps | TBD | v5/74 |
| CC-REQ-CREATE-006 | The software shall redirect to timeline editor after creation | User navigated to /user/:userId/timeline/:timelineId | TBD | v5/74 |
| CC-REQ-CREATE-007 | The software shall allow canceling creation | Cancel button closes dialog without saving | TBD | v5/74 |

### Timeline Editing

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-EDIT-001 | The software shall provide access to edit timeline metadata from timeline card | Settings icon on timeline card opens edit dialog | TBD | v5/76 |
| CC-REQ-EDIT-002 | The software shall allow editing timeline title and description | Edit dialog pre-populated with current values | TBD | v5/76 |
| CC-REQ-EDIT-003 | The software shall allow editing timeline ID | ID field editable with uniqueness validation | TBD | v5/76 |
| CC-REQ-EDIT-004 | The software shall update timeline metadata in localStorage | Changes saved on Save button, updatedAt timestamp refreshed | TBD | v5/76 |
| CC-REQ-EDIT-005 | The software shall reflect changes immediately in UI | Timeline card shows updated title/description without refresh | TBD | v5/76 |

### Timeline Deletion

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-DELETE-001 | The software shall provide delete action in timeline card menu | Delete option accessible from context menu | TBD | v5/77 |
| CC-REQ-DELETE-002 | The software shall require confirmation before deletion | Confirmation dialog shows timeline title and event count | TBD | v5/77 |
| CC-REQ-DELETE-003 | The software shall remove timeline from localStorage on confirmation | Timeline and all events deleted permanently | TBD | v5/77 |
| CC-REQ-DELETE-004 | The software shall redirect to home page after deletion | User navigated to / after successful deletion | TBD | v5/77 |

### Form Validation

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-VALID-001 | The software shall validate title length (3-100 characters) | Error message shown if title too short or too long | TBD | v5/78 |
| CC-REQ-VALID-002 | The software shall validate description length (max 500 characters) | Character counter shown, error if exceeds limit | TBD | v5/78 |
| CC-REQ-VALID-003 | The software shall validate ID format (lowercase, hyphens, alphanumeric) | Error message if ID contains invalid characters | TBD | v5/78 |
| CC-REQ-VALID-004 | The software shall display validation errors inline | Error messages appear below respective fields | TBD | v5/78 |

### Data Persistence

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-PERSIST-001 | The software shall store timelines in localStorage under 'powertimeline_timelines' | Data persists across browser sessions | TBD | v5/79 |
| CC-REQ-PERSIST-002 | The software shall set createdAt timestamp on creation | ISO 8601 format timestamp | TBD | v5/79 |
| CC-REQ-PERSIST-003 | The software shall update updatedAt timestamp on modification | ISO 8601 format timestamp refreshed on edit | TBD | v5/79 |
| CC-REQ-PERSIST-004 | The software shall handle localStorage quota exceeded errors | User-friendly error message displayed | TBD | v5/79 |

### User Feedback

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-UX-001 | The software shall display success notification after timeline creation | Toast message: "Timeline created successfully" | TBD | v5/74 |
| CC-REQ-UX-002 | The software shall display success notification after timeline edit | Toast message: "Changes saved successfully" | TBD | v5/76 |
| CC-REQ-UX-003 | The software shall display success notification after timeline deletion | Toast message: "Timeline deleted successfully" | TBD | v5/77 |
| CC-REQ-UX-004 | The software shall support keyboard shortcut ESC to close dialogs | ESC key closes dialog without saving | TBD | v5/78 |

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
  visibility: 'public' | 'private';
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

## Change History

- **2025-10-24** — Initial SRS creation (simplified ASPICE-style)
- Focused on core CRUD operations (Create, Edit, Delete)
- Removed duplication and first event creation features
- Added ID vs Title distinction with uniqueness validation
- Reduced from 40+ to 28 focused requirements
- Reduced from 16 to 6 essential test scenarios
