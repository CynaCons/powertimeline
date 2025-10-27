export interface Event {
  id: string;
  date: string;
  title: string;
  description?: string;
  // Optional extensions for richer layout & semantics
  endDate?: string; // for ranges
  time?: string; // optional time component in HH:MM format for minute-level precision
  priority?: 'low' | 'normal' | 'high';
  category?: string; // e.g., 'milestone', 'speech', 'battle'
  flags?: {
    showAnchorLabel?: boolean;
    showConnector?: boolean;
  };
  excerpt?: string; // precomputed short description
}

/**
 * Timeline visibility levels
 * - public: Visible to everyone, appears in discovery feeds
 * - unlisted: Accessible via URL but not shown in discovery feeds
 * - private: Only visible to the owner
 */
export type TimelineVisibility = 'public' | 'unlisted' | 'private';

/**
 * Timeline represents a collection of events with ownership and engagement metadata
 * Added for v0.4.0 - Home Page & Timeline Discovery
 */
export interface Timeline {
  id: string;
  title: string;
  description?: string;
  events: Event[];
  ownerId: string;           // References User.id
  createdAt: string;         // ISO date
  updatedAt: string;         // ISO date
  viewCount: number;         // Number of views
  featured: boolean;         // Featured flag (manual curation)
  visibility: TimelineVisibility;  // v0.4.2: Privacy controls
}

/**
 * User represents a demo user profile
 * Added for v0.4.0 - Home Page & Timeline Discovery
 */
export interface User {
  id: string;           // e.g., "alice", "bob", "charlie"
  name: string;         // Display name
  avatar: string;       // Emoji or image URL
  bio?: string;         // Optional biography (max 280 chars)
  createdAt: string;    // ISO date
  role?: 'user' | 'admin';  // User role (defaults to 'user' if undefined) - v0.4.4
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
