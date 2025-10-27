/**
 * activityLog.ts - Admin activity logging utilities
 * Implements CC-REQ-ADMIN-LOG-001 to CC-REQ-ADMIN-LOG-003
 * v0.4.4 - Admin Panel & Site Administration
 */

import type {
  AdminActivityLog,
  AdminActionType,
  AdminActionTargetType,
} from '../types';
import { getCurrentUser } from './homePageStorage';

const ACTIVITY_LOG_KEY = 'powertimeline_activity_log';
const MAX_LOG_ENTRIES = 1000;

/**
 * Get all activity log entries from localStorage
 */
export function getActivityLogs(): AdminActivityLog[] {
  try {
    const data = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (!data) return [];
    return JSON.parse(data) as AdminActivityLog[];
  } catch (error) {
    console.error('Failed to load activity logs:', error);
    return [];
  }
}

/**
 * Save activity logs to localStorage with auto-pruning
 */
function saveActivityLogs(logs: AdminActivityLog[]): void {
  try {
    // Auto-prune: keep only the most recent MAX_LOG_ENTRIES
    const pruned = logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, MAX_LOG_ENTRIES);

    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(pruned));
  } catch (error) {
    console.error('Failed to save activity logs:', error);
  }
}

/**
 * Log an admin action to the activity log
 *
 * @param action - Type of admin action performed
 * @param targetType - Type of entity affected (user, timeline, system)
 * @param targetId - ID of the affected entity
 * @param details - Human-readable description of the action
 * @param targetName - Optional name of the affected entity
 * @param metadata - Optional additional action-specific data
 */
export function logAdminAction(
  action: AdminActionType,
  targetType: AdminActionTargetType,
  targetId: string,
  details: string,
  targetName?: string,
  metadata?: Record<string, any>
): void {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.warn('Cannot log admin action: No current user');
    return;
  }

  const logEntry: AdminActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    adminUserId: currentUser.id,
    adminUserName: currentUser.name,
    action,
    targetType,
    targetId,
    targetName,
    details,
    metadata,
  };

  const logs = getActivityLogs();
  logs.push(logEntry);
  saveActivityLogs(logs);

  console.log(`[ADMIN ACTION] ${currentUser.name}: ${details}`, metadata);
}

/**
 * Clear all activity logs (admin function)
 * This should only be used by system administrators
 */
export function clearActivityLogs(): void {
  localStorage.removeItem(ACTIVITY_LOG_KEY);
  console.log('[ADMIN] Activity log cleared');
}

/**
 * Export activity logs as JSON
 */
export function exportActivityLogs(): string {
  const logs = getActivityLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * Filter activity logs by various criteria
 */
export interface ActivityLogFilters {
  action?: AdminActionType;
  targetType?: AdminActionTargetType;
  adminUserId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;  // Search in details and targetName
}

export function filterActivityLogs(filters: ActivityLogFilters): AdminActivityLog[] {
  let logs = getActivityLogs();

  if (filters.action) {
    logs = logs.filter(log => log.action === filters.action);
  }

  if (filters.targetType) {
    logs = logs.filter(log => log.targetType === filters.targetType);
  }

  if (filters.adminUserId) {
    logs = logs.filter(log => log.adminUserId === filters.adminUserId);
  }

  if (filters.startDate) {
    logs = logs.filter(log => new Date(log.timestamp) >= filters.startDate!);
  }

  if (filters.endDate) {
    logs = logs.filter(log => new Date(log.timestamp) <= filters.endDate!);
  }

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    logs = logs.filter(log =>
      log.details.toLowerCase().includes(term) ||
      (log.targetName && log.targetName.toLowerCase().includes(term))
    );
  }

  return logs;
}
