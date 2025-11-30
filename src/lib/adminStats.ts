/**
 * adminStats.ts - Platform statistics calculation utilities
 * v0.4.4 - Admin Panel & Site Administration
 */

import { getUsers, getTimelines } from './homePageStorage';
import type { TimelineVisibility } from '../types';

export interface PlatformStats {
  totalUsers: number;
  totalTimelines: number;
  totalEvents: number;
  totalViews: number;
  visibilityBreakdown: {
    public: number;
    unlisted: number;
    private: number;
  };
  topCreators: {
    userId: string;
    userName: string;
    timelineCount: number;
  }[];
  recentActivity: {
    timelineId: string;
    timelineTitle: string;
    ownerName: string;
    updatedAt: string;
  }[];
  averageEventsPerTimeline: number;
  timelinesCreatedLast30Days: number;
}

/**
 * Calculate comprehensive platform statistics from localStorage
 */
export function calculatePlatformStats(): PlatformStats {
  const users = getUsers();
  const timelines = getTimelines();

  // Total counts
  const totalUsers = users.length;
  const totalTimelines = timelines.length;
  const totalEvents = timelines.reduce((sum, t) => sum + (t.events?.length || 0), 0);
  const totalViews = timelines.reduce((sum, t) => sum + (t.viewCount || 0), 0);

  // Visibility breakdown
  const visibilityBreakdown = timelines.reduce(
    (acc, timeline) => {
      const visibility = timeline.visibility || 'public';
      acc[visibility]++;
      return acc;
    },
    { public: 0, unlisted: 0, private: 0 } as Record<TimelineVisibility, number>
  );

  // Top creators (sorted by timeline count, top 5)
  const creatorMap = new Map<string, { userName: string; count: number }>();
  timelines.forEach(timeline => {
    const user = users.find(u => u.id === timeline.ownerId);
    if (user) {
      const existing = creatorMap.get(user.id);
      if (existing) {
        existing.count++;
      } else {
        creatorMap.set(user.id, { userName: user.username, count: 1 });
      }
    }
  });

  const topCreators = Array.from(creatorMap.entries())
    .map(([userId, data]) => ({
      userId,
      userName: data.userName,
      timelineCount: data.count,
    }))
    .sort((a, b) => b.timelineCount - a.timelineCount)
    .slice(0, 5);

  // Recent activity (last 5 updated timelines)
  const recentActivity = timelines
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map(timeline => {
      const owner = users.find(u => u.id === timeline.ownerId);
      return {
        timelineId: timeline.id,
        timelineTitle: timeline.title,
        ownerName: owner?.username || 'Unknown',
        updatedAt: timeline.updatedAt,
      };
    });

  // Average events per timeline
  const averageEventsPerTimeline =
    totalTimelines > 0 ? parseFloat((totalEvents / totalTimelines).toFixed(1)) : 0;

  // Timelines created in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const timelinesCreatedLast30Days = timelines.filter(
    t => new Date(t.createdAt) >= thirtyDaysAgo
  ).length;

  return {
    totalUsers,
    totalTimelines,
    totalEvents,
    totalViews,
    visibilityBreakdown,
    topCreators,
    recentActivity,
    averageEventsPerTimeline,
    timelinesCreatedLast30Days,
  };
}
