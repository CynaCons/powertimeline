/**
 * Password validation utilities
 * Enforces strong password requirements
 */

export interface PasswordStrength {
  score: number; // 0-4 (weak to strong)
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  requirements: {
    minLength: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
  };
  feedback: string[];
}

const MIN_PASSWORD_LENGTH = 15;

/**
 * Validates password strength and returns detailed feedback
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
  };

  const feedback: string[] = [];
  if (!requirements.minLength) {
    feedback.push(`At least ${MIN_PASSWORD_LENGTH} characters required`);
  }
  if (!requirements.hasNumber) {
    feedback.push('Add at least one number');
  }
  if (!requirements.hasSpecialChar) {
    feedback.push('Add at least one special character (!@#$%^&*...)');
  }
  if (!requirements.hasUpperCase) {
    feedback.push('Add at least one uppercase letter');
  }
  if (!requirements.hasLowerCase) {
    feedback.push('Add at least one lowercase letter');
  }

  // Calculate score based on requirements met
  const requirementsMet = Object.values(requirements).filter(Boolean).length;
  let score = 0;
  let label: PasswordStrength['label'] = 'Very Weak';
  let color = '#dc2626'; // red

  if (requirementsMet === 5) {
    score = 4;
    label = 'Strong';
    color = '#16a34a'; // green
  } else if (requirementsMet === 4) {
    score = 3;
    label = 'Good';
    color = '#84cc16'; // lime
  } else if (requirementsMet === 3) {
    score = 2;
    label = 'Fair';
    color = '#eab308'; // yellow
  } else if (requirementsMet === 2) {
    score = 1;
    label = 'Weak';
    color = '#f97316'; // orange
  }

  return {
    score,
    label,
    color,
    requirements,
    feedback,
  };
}

/**
 * Check if password meets minimum requirements
 */
export function isPasswordValid(password: string): boolean {
  const strength = validatePasswordStrength(password);
  return strength.requirements.minLength &&
         strength.requirements.hasNumber &&
         strength.requirements.hasSpecialChar;
}
