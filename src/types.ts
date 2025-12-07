/**
 * Event represents a single event in a timeline
 * SRS_DB.md compliant - v0.5.14
 */
export interface Event {
  id: string;
  date: string;                    // ISO 8601 date (YYYY-MM-DD)
  title: string;
  description?: string;
  endDate?: string;                // Optional end date for ranges
  time?: string;                   // Optional time in HH:MM format
  sources?: string[];              // Array of source references (text or URLs)
  // Layout flags (client-side only, not stored in Firestore)
  flags?: {
    showAnchorLabel?: boolean;
    showConnector?: boolean;
  };
  // AI preview flag (client-side only)
  isPreview?: boolean;
}

/**
 * Timeline visibility levels
 * - public: Visible to everyone, appears in discovery feeds
 * - unlisted: Accessible via URL but not shown in discovery feeds
 * - private: Only visible to the owner
 */
export type TimelineVisibility = 'public' | 'unlisted' | 'private';

/**
 * Timeline metadata (without events array)
 * Used for listing timelines without loading all events
 * v0.5.0.1 - Event Persistence Optimization
 */
export interface TimelineMetadata {
  id: string;
  title: string;
  description?: string;
  ownerId: string;           // References User.id
  createdAt: string;         // ISO date
  updatedAt: string;         // ISO date
  viewCount: number;         // Number of views
  featured: boolean;         // Featured flag (manual curation)
  visibility: TimelineVisibility;  // v0.4.2: Privacy controls
  eventCount: number;        // Total number of events (for display)
}

/**
 * Timeline with events (full data)
 * Used when displaying/editing a specific timeline
 * v0.5.0.1 - Event Persistence Optimization
 */
export interface Timeline extends TimelineMetadata {
  events: Event[];
}

/**
 * Event document as stored in Firestore subcollection
 * SRS_DB.md compliant - v0.5.14
 */
export interface EventDocument extends Event {
  timelineId: string;        // Reference to parent timeline
  createdAt: string;         // ISO date
  updatedAt: string;         // ISO date
}

/**
 * User represents a user profile
 * SRS_DB.md compliant - v0.5.14
 */
export interface User {
  id: string;                      // Firebase Auth UID
  email: string;                   // User's email address (read-only from auth provider)
  username: string;                // Unique username for URLs (3-20 chars, lowercase alphanumeric + hyphen)
  createdAt: string;               // ISO date
  role?: 'user' | 'admin';         // User role (defaults to 'user' if undefined)
}

/**
 * Search results containing both timelines and users
 */
export interface SearchResults {
  timelines: Timeline[];
  users: User[];
  hasMore: boolean;
}

/**
 * Admin action types for activity logging
 * v0.4.4 - Admin Panel & Site Administration
 */
export type AdminActionType =
  | 'USER_ROLE_CHANGE'
  | 'USER_DELETE'
  | 'TIMELINE_DELETE'
  | 'BULK_OPERATION'
  | 'CONFIG_CHANGE';

/**
 * Target types for admin actions
 * v0.4.4 - Admin Panel & Site Administration
 */
export type AdminActionTargetType = 'user' | 'timeline' | 'system';

/**
 * Admin activity log entry
 * Tracks all administrative actions for audit purposes
 * v0.4.4 - Admin Panel & Site Administration
 */
export interface AdminActivityLog {
  id: string;                           // Unique identifier for the log entry
  timestamp: string;                    // ISO date when action occurred
  adminUserId: string;                  // ID of admin who performed the action
  adminUserName: string;                // Name of admin (denormalized for display)
  action: AdminActionType;              // Type of action performed
  targetType: AdminActionTargetType;    // Type of entity affected
  targetId: string;                     // ID of the affected entity
  targetName?: string;                  // Name of affected entity (denormalized)
  details: string;                      // Human-readable description of the action
  metadata?: Record<string, any>;       // Additional action-specific data
}
