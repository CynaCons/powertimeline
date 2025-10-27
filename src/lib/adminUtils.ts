/**
 * Admin Utility Functions
 * Implements CC-REQ-ADMIN-003: Access control utilities
 * v0.4.4 - Admin Panel & Site Administration
 */

import type { User } from '../types';

/**
 * Check if a user has admin role
 * @param user - User object or null/undefined
 * @returns true if user has 'admin' role, false otherwise
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }
  // Explicitly check for 'admin' role
  // Undefined role defaults to 'user' (non-admin)
  return user.role === 'admin';
}

/**
 * Check if a user can access admin pages
 * Alias for isAdmin for semantic clarity in access control contexts
 * @param user - User object or null/undefined
 * @returns true if user can access admin features, false otherwise
 */
export function canAccessAdmin(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Require admin role or throw error
 * Use this in functions that should only be called by admins
 * @param user - User object or null/undefined
 * @throws Error if user is not an admin
 */
export function requireAdmin(user: User | null | undefined): void {
  if (!isAdmin(user)) {
    throw new Error('Admin access required. This action is restricted to administrators.');
  }
}
