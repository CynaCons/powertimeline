/**
 * UserAvatar - Display user avatar with initials and consistent color
 * v0.5.0.2 - Initials Avatar System
 */

import { getInitials, getUserColor, getContrastColor } from '../lib/avatarUtils';
import type { User } from '../types';

interface UserAvatarProps {
  user: User;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
}

const sizeMap = {
  small: {
    container: 'w-8 h-8 text-xs',
    text: 'text-xs',
  },
  medium: {
    container: 'w-12 h-12 text-base',
    text: 'text-base',
  },
  large: {
    container: 'w-16 h-16 text-2xl',
    text: 'text-2xl',
  },
  xlarge: {
    container: 'w-24 h-24 text-4xl',
    text: 'text-4xl',
  },
};

export function UserAvatar({ user, size = 'medium', className = '' }: UserAvatarProps) {
  // Use username for initials and display (SRS_DB.md compliant - v0.5.14)
  const initials = getInitials(user.username);
  const bgColor = getUserColor(user.id);
  const textColor = getContrastColor(bgColor);
  const sizeClasses = sizeMap[size];

  return (
    <div
      className={`${sizeClasses.container} rounded-full flex items-center justify-center font-semibold ${className}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      title={user.username}
    >
      <span className={sizeClasses.text}>{initials}</span>
    </div>
  );
}
