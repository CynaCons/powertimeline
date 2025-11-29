# PowerTimeline Database Software Requirements Specification

| Document ID | DB-SRS-001 |
|-------------|------------|
| Version | 1.0 |
| Status | Draft |
| Last Updated | 2024-11-29 |

---

## 1. Overview

This document specifies the database schema requirements for PowerTimeline using Firebase Firestore as the backend database.

### 1.1 Database Type
- **Provider**: Google Firebase Firestore
- **Type**: NoSQL Document Database
- **Environments**: Production (`powertimeline-860f1`), Development (`powertimeline-dev`)

### 1.2 Document Structure
```
/users/{userId}
    /timelines/{timelineId}
        /events/{eventId}
/activityLogs/{logId}
```

---

## 2. Collections

### 2.1 Users Collection

**Path**: `/users/{userId}`

| Req ID | Field | Type | Required | Constraint | Description |
|--------|-------|------|----------|------------|-------------|
| DB-USER-001 | `id` | string | Yes | Firebase Auth UID | Primary identifier. Matches document ID and Firebase Auth UID. |
| DB-USER-002 | `email` | string | Yes | Valid email, Read-only | User's email address from authentication provider. Cannot be modified. |
| DB-USER-003 | `username` | string | Yes | Unique, 3-20 chars, alphanumeric + hyphen, lowercase | URL-friendly identifier. Used in public URLs instead of UID. Must be unique across all users. |
| DB-USER-004 | `createdAt` | string | Yes | ISO 8601 format | Account creation timestamp. Set once on creation. |
| DB-USER-005 | `role` | string | No | Enum: `user`, `admin` | User role for access control. Defaults to `user` if undefined. |

**Indexes Required**:
| Index ID | Fields | Purpose |
|----------|--------|---------|
| DB-IDX-USER-001 | `username` (unique) | Username lookup for URL resolution |
| DB-IDX-USER-002 | `email` | Email lookup for authentication |

**Security Rules**:
- Read: Public (all users)
- Create/Update: Owner only (authenticated user where `request.auth.uid == userId`)
- Delete: Admin only

---

### 2.2 Timelines Collection

**Path**: `/users/{userId}/timelines/{timelineId}`

| Req ID | Field | Type | Required | Constraint | Description |
|--------|-------|------|----------|------------|-------------|
| DB-TL-001 | `id` | string | Yes | URL-friendly slug | Timeline identifier. Used in URLs. |
| DB-TL-002 | `title` | string | Yes | 1-200 chars | Timeline title displayed to users. |
| DB-TL-003 | `description` | string | No | Max 1000 chars | Timeline description/summary. |
| DB-TL-004 | `ownerId` | string | Yes | Valid user ID | Reference to owning user. Must match parent `userId`. |
| DB-TL-005 | `createdAt` | string | Yes | ISO 8601 format | Creation timestamp. |
| DB-TL-006 | `updatedAt` | string | Yes | ISO 8601 format | Last modification timestamp. |
| DB-TL-007 | `viewCount` | number | Yes | Integer >= 0 | View counter for analytics. Publicly incrementable. |
| DB-TL-008 | `featured` | boolean | Yes | Default: false | Admin-set flag for featured timelines. |
| DB-TL-009 | `visibility` | string | Yes | Enum: `public`, `unlisted`, `private` | Access control level. |
| DB-TL-010 | `eventCount` | number | No | Integer >= 0 | Denormalized event count for display. |

**Visibility Levels**:
| Value | Discovery | Direct URL | Owner |
|-------|-----------|------------|-------|
| `public` | Yes | Yes | Yes |
| `unlisted` | No | Yes | Yes |
| `private` | No | No | Yes |

**Security Rules**:
- Read: Public/unlisted by anyone, private by owner only
- Create: Owner only (authenticated, `ownerId == auth.uid == userId`)
- Update: Owner for all fields, anyone for `viewCount` increment only
- Delete: Owner only

---

### 2.3 Events Collection

**Path**: `/users/{userId}/timelines/{timelineId}/events/{eventId}`

| Req ID | Field | Type | Required | Constraint | Description |
|--------|-------|------|----------|------------|-------------|
| DB-EV-001 | `id` | string | Yes | Unique within timeline | Event identifier. Matches document ID. |
| DB-EV-002 | `title` | string | Yes | 1-200 chars | Event title. |
| DB-EV-003 | `description` | string | No | Max 5000 chars | Event description/content. |
| DB-EV-004 | `date` | string | Yes | ISO 8601 date (YYYY-MM-DD) | Event date. Primary sorting field. |
| DB-EV-005 | `endDate` | string | No | ISO 8601 date | End date for date ranges. |
| DB-EV-006 | `time` | string | No | HH:MM format | Optional time for minute-level precision. Secondary sorting field. |
| DB-EV-007 | `timelineId` | string | Yes | Valid timeline ID | Reference to parent timeline. |
| DB-EV-008 | `createdAt` | string | Yes | ISO 8601 format | Creation timestamp. |
| DB-EV-009 | `updatedAt` | string | Yes | ISO 8601 format | Last modification timestamp. |

**Ordering**: Events are sorted by `date` (primary) and `time` (secondary). No manual ordering field needed.

**Security Rules**:
- Read: Based on parent timeline visibility
- Create/Update/Delete: Timeline owner only

---

### 2.4 Activity Logs Collection

**Path**: `/activityLogs/{logId}`

| Req ID | Field | Type | Required | Constraint | Description |
|--------|-------|------|----------|------------|-------------|
| DB-LOG-001 | `id` | string | Yes | Auto-generated | Log entry identifier. |
| DB-LOG-002 | `timestamp` | string | Yes | ISO 8601 format | When action occurred. |
| DB-LOG-003 | `adminUserId` | string | Yes | Valid admin user ID | Admin who performed action. |
| DB-LOG-004 | `adminUserName` | string | Yes | Denormalized | Admin display name (for display). |
| DB-LOG-005 | `action` | string | Yes | Enum: see below | Type of action performed. |
| DB-LOG-006 | `targetType` | string | Yes | Enum: `user`, `timeline`, `system` | Type of affected entity. |
| DB-LOG-007 | `targetId` | string | Yes | - | ID of affected entity. |
| DB-LOG-008 | `targetName` | string | No | Denormalized | Name of affected entity. |
| DB-LOG-009 | `details` | string | Yes | - | Human-readable action description. |
| DB-LOG-010 | `metadata` | object | No | - | Additional action-specific data. |

**Action Types** (DB-LOG-005):
- `USER_ROLE_CHANGE` - User role modification
- `USER_DELETE` - User deletion
- `TIMELINE_DELETE` - Timeline deletion
- `BULK_OPERATION` - Bulk administrative action
- `CONFIG_CHANGE` - System configuration change

**Security Rules**:
- Read: Admin only
- Create: Admin only
- Update/Delete: Never (immutable audit log)

---

## 3. Username Requirements

### 3.1 Username Specification (DB-USER-003)

| Req ID | Requirement | Details |
|--------|-------------|---------|
| DB-USERNAME-001 | Length | 3-20 characters |
| DB-USERNAME-002 | Characters | Lowercase alphanumeric (a-z, 0-9) and hyphens (-) |
| DB-USERNAME-003 | Format | Must start with letter, cannot end with hyphen |
| DB-USERNAME-004 | Uniqueness | Globally unique across all users |
| DB-USERNAME-005 | Immutability | Cannot be changed after initial selection (v1.0) |
| DB-USERNAME-006 | Reserved | Block reserved words (see 3.2) |
| DB-USERNAME-007 | URL Usage | Used in URLs: `/user/{username}/timeline/{timelineId}` |

### 3.2 Reserved Usernames

The following usernames are reserved and cannot be registered:

```
admin, administrator, api, app, auth, browse, config, dashboard,
edit, editor, help, home, login, logout, new, null, profile,
register, search, settings, signup, support, system, test,
timeline, timelines, undefined, user, users, view, www
```

### 3.3 Username Selection Flow

| Req ID | Requirement |
|--------|-------------|
| DB-USERNAME-FLOW-001 | New users (Google sign-in) must select username before accessing app |
| DB-USERNAME-FLOW-002 | Existing users without username prompted on next login |
| DB-USERNAME-FLOW-003 | Username availability checked in real-time during input |
| DB-USERNAME-FLOW-004 | Suggestions provided if desired username is taken |

---

## 4. Data Integrity

### 4.1 Referential Integrity

| Req ID | Relationship | Constraint |
|--------|--------------|------------|
| DB-REF-001 | Timeline.ownerId -> User.id | Must reference existing user |
| DB-REF-002 | Event.timelineId -> Timeline.id | Must reference parent timeline |
| DB-REF-003 | ActivityLog.adminUserId -> User.id | Must reference admin user |

### 4.2 Denormalized Fields

| Field | Source | Purpose | Update Strategy |
|-------|--------|---------|-----------------|
| `Timeline.eventCount` | Count of events subcollection | Display without loading events | Update on event add/delete |
| `ActivityLog.adminUserName` | User.username | Display without join | Set at creation, not updated |
| `ActivityLog.targetName` | Various | Display without join | Set at creation, not updated |

---

## 5. Implementation References

| Requirement Area | Implementation File |
|------------------|---------------------|
| Type Definitions | `src/types.ts` |
| Security Rules | `firestore.rules` |
| User Operations | `src/services/firestore.ts` |
| Auth Flow | `src/services/auth.ts` |

---

## 6. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-11-29 | Claude | Initial specification |
| 1.1 | 2024-11-29 | Claude | Removed deprecated fields: avatar, bio, name (User); order, priority, category, excerpt (Event). Removed Migration Notes section. |
