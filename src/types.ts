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
}

/**
 * Search results containing both timelines and users
 */
export interface SearchResults {
  timelines: Timeline[];
  users: User[];
  hasMore: boolean;
}
