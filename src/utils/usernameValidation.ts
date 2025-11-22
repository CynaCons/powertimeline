/**
 * Username validation utilities
 */

/**
 * Validates username format
 * - 3-20 characters
 * - Alphanumeric and hyphens only
 * - Cannot start or end with hyphen
 * - Cannot have consecutive hyphens
 */
export function isValidUsernameFormat(username: string): boolean {
  // Check length
  if (username.length < 3 || username.length > 20) {
    return false;
  }

  // Check format: alphanumeric and hyphens only
  if (!/^[a-zA-Z0-9-]+$/.test(username)) {
    return false;
  }

  // Cannot start or end with hyphen
  if (username.startsWith('-') || username.endsWith('-')) {
    return false;
  }

  // Cannot have consecutive hyphens
  if (username.includes('--')) {
    return false;
  }

  return true;
}

/**
 * Reserved usernames that cannot be used
 */
const RESERVED_USERNAMES = [
  'admin',
  'api',
  'app',
  'auth',
  'blog',
  'dashboard',
  'editor',
  'help',
  'home',
  'login',
  'logout',
  'me',
  'profile',
  'register',
  'settings',
  'signup',
  'user',
  'users',
];

/**
 * Check if username is reserved
 */
export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.includes(username.toLowerCase());
}

/**
 * Provides feedback on username validation
 */
export function getUsernameValidationFeedback(username: string): string | null {
  if (!username) {
    return 'Username is required';
  }

  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }

  if (username.length > 20) {
    return 'Username must be 20 characters or less';
  }

  if (!/^[a-zA-Z0-9-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and hyphens';
  }

  if (username.startsWith('-') || username.endsWith('-')) {
    return 'Username cannot start or end with a hyphen';
  }

  if (username.includes('--')) {
    return 'Username cannot have consecutive hyphens';
  }

  if (isReservedUsername(username)) {
    return 'This username is reserved';
  }

  return null;
}

/**
 * Suggests an available username based on email
 */
export function suggestUsernameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  // Remove invalid characters and convert to lowercase
  return localPart
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
}
