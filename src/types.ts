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
