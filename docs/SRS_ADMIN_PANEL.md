# Admin Panel & Site Administration Requirements

This document specifies requirements for the admin interface and platform management features (v0.4.4). The admin panel provides authorized users with tools for user management, platform analytics, bulk operations, and activity auditing.

## Scope

**In Scope:**
- Role-based access control (admin vs user roles)
- Admin panel page with tab navigation (/admin route)
- User management (view, role assignment, deletion)
- Platform statistics dashboard with visualizations
- Bulk operations on users and timelines
- Admin activity audit log
- E2E test coverage for all admin features

**Out of Scope (Deferred):**
- User authentication (v0.5.1 - currently demo users only)
- Real-time admin notifications (v0.5.x+)
- Advanced permission granularity (v0.6.x - single admin role for now)
- Data export/backup tools (v0.5.x+)
- Admin API endpoints (v0.5.x - currently localStorage only)

## Admin Panel Structure

The admin panel (/admin) contains these sections:

1. **Users** - User management table with role assignment and deletion
2. **Statistics** - Platform metrics and analytics dashboard
3. **Activity Log** - Audit trail of admin actions

## Requirement Tables

### User Roles & Access Control

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-ADMIN-001 | User type supports role field | • User interface includes optional `role?: 'user' \| 'admin'`<br>• Undefined role defaults to 'user'<br>• Role persisted in localStorage | `src/types.ts:76` | T82.x |
| CC-REQ-ADMIN-002 | Admin identification (v0.5.6: Firebase Auth) | • **DEPRECATED:** Demo users removed in v0.5.6<br>• Admin role now managed via Firebase Auth + Firestore<br>• Role field stored in Firestore user document<br>• See SRS_DB.md for Firestore schema | `src/lib/adminUtils.ts` | T82.x |
| CC-REQ-ADMIN-003 | Access control utilities | • `isAdmin(user)` helper returns boolean<br>• `canAccessAdmin(user)` checks admin status<br>• `requireAdmin(user)` throws if not admin<br>• Functions handle null/undefined gracefully | `src/lib/adminUtils.ts` | T82.x |
| CC-REQ-ADMIN-004 | Non-admin users cannot access admin pages | • /admin route redirects non-admins to home page<br>• Admin navigation item hidden for non-admins<br>• Admin components check permissions on mount<br>• Clear error message if access denied | `src/pages/AdminPage.tsx:48-53` | T82.2 |

### Admin Navigation & Routing

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-ADMIN-NAV-001 | Admin panel accessible via /admin route | • Route /admin renders AdminPage component<br>• URL updates correctly in browser<br>• Breadcrumb shows "Home > Admin"<br>• Accessible via navigation rail | `src/main.tsx` | T82.1 |
| CC-REQ-ADMIN-NAV-002 | Admin navigation item in navigation rail | • Icon: admin_panel_settings (Material Icons)<br>• Label: "Admin"<br>• Only visible to admin users<br>• Highlighted when on /admin route | `src/app/hooks/useNavigationConfig.ts` | T82.3 |
| CC-REQ-ADMIN-NAV-003 | Tab navigation within admin panel | • Tabs: Users, Statistics, Activity Log, Configuration<br>• Tab state persisted to URL hash or query param<br>• Keyboard navigation support (Arrow keys, Tab)<br>• Active tab visually distinct | `src/pages/AdminPage.tsx` | TBD |

### User Management

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-ADMIN-USR-001 | User table displays all users | • Table columns: Avatar, Name, ID, Role, Created Date, Timeline Count<br>• Sortable by name, creation date, timeline count<br>• Responsive layout (mobile-friendly)<br>• Shows loading state while fetching data | `src/components/admin/UserManagementPanel.tsx` | T83.1 |
| CC-REQ-ADMIN-USR-002 | Role assignment functionality | • Dropdown/select per user to change role<br>• Options: User, Admin<br>• Confirmation dialog for role changes<br>• Success toast notification after update<br>• Role change logged to activity log | `src/components/admin/UserManagementPanel.tsx` | T83.2 |
| CC-REQ-ADMIN-USR-003 | User deletion with cascade warning | • Delete button per user row<br>• Confirmation dialog shows: "Delete user X? This will also delete N timelines."<br>• Cascade deletes user's timelines<br>• Deletion logged to activity log<br>• Cannot delete yourself (current admin) | `src/components/admin/UserManagementPanel.tsx` | T83.3 |
| CC-REQ-ADMIN-USR-004 | User search and filtering | • Search input filters by name or ID (case-insensitive)<br>• Filter dropdown: All, Admin, User<br>• Search updates table in real-time<br>• Clear button to reset search | `src/components/admin/UserManagementPanel.tsx` | T83.4 |

### Platform Statistics Dashboard

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-ADMIN-STAT-001 | Display platform-wide metrics | • Total users count<br>• Total timelines count<br>• Total events count<br>• Total views count<br>• Metrics displayed in card/grid layout<br>• Icons for visual clarity | `src/components/admin/StatisticsDashboard.tsx` | T84.1 |
| CC-REQ-ADMIN-STAT-002 | Timeline visibility breakdown | • Pie or bar chart showing: Public, Private, Unlisted counts<br>• Percentages displayed<br>• Clickable segments (future: filter to that type)<br>• Color-coded (green=public, red=private, yellow=unlisted) | `src/components/admin/StatisticsDashboard.tsx` | T84.2 |
| CC-REQ-ADMIN-STAT-003 | Top creators list | • Table showing top 5 timeline creators<br>• Columns: User, Timeline Count, Total Events<br>• Sorted by timeline count descending<br>• Clickable user names navigate to profile | `src/components/admin/StatisticsDashboard.tsx` | T84.3 |
| CC-REQ-ADMIN-STAT-004 | Statistics update reactively | • Stats recalculate when data changes<br>• Dashboard refreshes when navigating back from other tabs<br>• Manual refresh button available<br>• Timestamp of last calculation shown | `src/components/admin/StatisticsDashboard.tsx` | T84.4 |

### Bulk Operations

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-ADMIN-BULK-001 | User table row selection | • Checkbox in first column of each row<br>• "Select All" / "Select None" checkbox in header<br>• Selected count displayed: "3 users selected"<br>• Clear selection button<br>• Selection persists during sort/filter | `src/components/admin/UserManagementPanel.tsx` | T85.1 |
| CC-REQ-ADMIN-BULK-002 | Bulk user deletion | • "Delete Selected" button in toolbar<br>• Confirmation dialog: "Delete N users? This will also delete M timelines."<br>• Progress indicator during deletion<br>• Success/error notifications<br>• All deletions logged to activity log | `src/components/admin/BulkActionsToolbar.tsx` | T85.2 |
| CC-REQ-ADMIN-BULK-003 | Bulk role assignment | • "Assign Role" button in toolbar<br>• Dropdown to select: Admin or User<br>• Confirmation dialog: "Change N users to [role]?"<br>• Batch update in localStorage<br>• All changes logged to activity log | `src/components/admin/BulkActionsToolbar.tsx` | T85.3 |
| CC-REQ-ADMIN-BULK-004 | Bulk timeline operations | • Similar selection system on timeline list (future tab)<br>• Bulk feature/unfeature<br>• Bulk visibility changes<br>• Bulk delete with confirmation<br>• All operations logged | TBD | T85.4 |

### Admin Activity Log

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-ADMIN-LOG-001 | Activity log type system | • AdminActivityLog interface: id, timestamp, adminUserId, action, targetType, targetId, details<br>• Action types: USER_ROLE_CHANGE, USER_DELETE, TIMELINE_DELETE, BULK_OPERATION, CONFIG_CHANGE<br>• Stored in localStorage array | `src/types.ts:92-121` | T86.x |
| CC-REQ-ADMIN-LOG-002 | Log admin actions automatically | • logAdminAction(...) function<br>• Called after every admin operation<br>• Max 1000 entries (auto-prune oldest)<br>• Includes admin username, timestamp, action details<br>• Fails gracefully if logging errors | `src/lib/activityLog.ts` | T86.2 |
| CC-REQ-ADMIN-LOG-003 | Activity log display | • Table shows: Timestamp, Admin User, Action, Target, Details<br>• Sorted by timestamp descending (newest first)<br>• Pagination: 20 entries per page<br>• Expandable rows for full details JSON | `src/components/admin/ActivityLogPanel.tsx` | T86.1 |
| CC-REQ-ADMIN-LOG-004 | Activity log filtering | • Filter by action type dropdown<br>• Filter by admin user dropdown<br>• Date range picker (last 24h, 7 days, 30 days, all time)<br>• Clear filters button<br>• Export to JSON button | `src/components/admin/ActivityLogPanel.tsx` | T86.3, T86.4 |

## E2E Test Coverage

### Test Files
- **tests/v5/82-admin-panel-access.spec.ts** - Admin access control and navigation
- **tests/v5/83-user-management.spec.ts** - User table, role assignment, deletion, search
- **tests/v5/84-admin-statistics.spec.ts** - Statistics dashboard and reactive updates
- **tests/v5/85-admin-bulk-operations.spec.ts** - Bulk selection and operations
- **tests/v5/86-admin-activity-log.spec.ts** - Activity logging and filtering

## Data Model Changes

### User Type (src/types.ts)
```typescript
export interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  createdAt: string;
  role?: 'user' | 'admin';  // NEW: Defaults to 'user' if undefined
}
```

### AdminActivityLog Type (src/types.ts)
```typescript
export type AdminActionType =
  | 'USER_ROLE_CHANGE'
  | 'USER_DELETE'
  | 'TIMELINE_DELETE'
  | 'BULK_OPERATION'
  | 'CONFIG_CHANGE';

export interface AdminActivityLog {
  id: string;
  timestamp: string;         // ISO date
  adminUserId: string;       // Who performed the action
  action: AdminActionType;
  targetType: 'user' | 'timeline' | 'config';
  targetId?: string;         // ID of affected entity (if applicable)
  details: Record<string, unknown>;  // Action-specific metadata
}
```

## localStorage Keys

| Key | Purpose | Data Type |
|---|---|---|
| `powertimeline_admin_logs` | Admin activity audit trail | `AdminActivityLog[]` |

Existing keys remain unchanged (users, timelines, current_user, etc.).

## Security Notes

**Important:** As of v0.5.6, the admin system now uses Firebase Authentication and Firestore for user management:

- **v0.5.6+:** Firebase Auth handles authentication, Firestore stores user data with security rules
- **v0.5.6+:** Demo users removed; all users must authenticate via Firebase Auth (Google Sign-In)
- Role-based access control enforced via Firestore Security Rules (server-side)
- Admin role field stored in Firestore `/users/{userId}` documents
- See SRS_DB.md for complete Firestore schema and security rules

**Pre-v0.5.6 (Deprecated):**
- Role checks were client-side only (easily bypassed via browser dev tools)
- localStorage data was fully accessible and modifiable by any user
- Not suitable for production use

## Change History

- **2025-12-27** — Updated code references and Firebase Auth migration notes
- Updated CC-REQ-ADMIN-002 to reflect demo users removal (v0.5.6)
- Added code references with line numbers to all TBD entries
- Updated Security Notes section to document Firebase Auth transition
- Added references to SRS_DB.md for Firestore schema

- **2025-10-XX** — Initial SRS creation (v0.4.4)
- Defined admin panel structure with 3 main sections
- Created 20+ requirements across 6 categories
- Added E2E test coverage mapping
- Defined AdminActivityLog data model
