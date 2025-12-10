import { describe, it, expect } from 'vitest';
import { isValidEmailFormat, getEmailValidationFeedback } from './emailValidation';

describe('emailValidation', () => {
  describe('isValidEmailFormat', () => {
    it('validates correct email format', () => {
      expect(isValidEmailFormat('test@example.com')).toBe(true);
      expect(isValidEmailFormat('user.name@example.co.uk')).toBe(true);
      expect(isValidEmailFormat('user+tag@example.com')).toBe(true);
    });

    it('rejects invalid email format', () => {
      expect(isValidEmailFormat('invalid')).toBe(false);
      expect(isValidEmailFormat('invalid@')).toBe(false);
      expect(isValidEmailFormat('@example.com')).toBe(false);
      expect(isValidEmailFormat('user@')).toBe(false);
    });

    it('handles empty string', () => {
      expect(isValidEmailFormat('')).toBe(false);
    });
  });

  describe('getEmailValidationFeedback', () => {
    it('returns null for valid email', () => {
      expect(getEmailValidationFeedback('test@example.com')).toBeNull();
    });

    it('returns error for empty email', () => {
      expect(getEmailValidationFeedback('')).toBe('Email is required');
    });

    it('returns error for email without @', () => {
      expect(getEmailValidationFeedback('invalid')).toBe('Email must contain @');
    });

    it('returns error for invalid email format', () => {
      expect(getEmailValidationFeedback('invalid@')).toBe('Please enter a valid email address');
    });
  });
});
