/**
 * Email validation utilities
 */

/**
 * Validates email format using comprehensive regex
 */
export function isValidEmailFormat(email: string): boolean {
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Provides feedback on email validation
 */
export function getEmailValidationFeedback(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }

  if (!email.includes('@')) {
    return 'Email must contain @';
  }

  if (!isValidEmailFormat(email)) {
    return 'Please enter a valid email address';
  }

  return null;
}
