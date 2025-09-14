import type { Event } from '../types';

export interface CategoryIcon {
  icon: string;
  description: string;
  color?: string;
}

export const categoryIcons: Record<string, CategoryIcon> = {
  // Default categories
  milestone: {
    icon: 'flag',
    description: 'Milestone event',
    color: 'var(--color-primary-500)'
  },
  meeting: {
    icon: 'group',
    description: 'Meeting or conference',
    color: 'var(--color-secondary-500)'
  },
  deadline: {
    icon: 'schedule',
    description: 'Important deadline',
    color: 'var(--color-error-500)'
  },
  launch: {
    icon: 'rocket_launch',
    description: 'Product or feature launch',
    color: 'var(--color-success-500)'
  },
  announcement: {
    icon: 'campaign',
    description: 'Public announcement',
    color: 'var(--color-warning-500)'
  },

  // Historical events
  battle: {
    icon: 'swords',
    description: 'Military battle or conflict',
    color: 'var(--color-error-600)'
  },
  treaty: {
    icon: 'handshake',
    description: 'Treaty or agreement',
    color: 'var(--color-success-600)'
  },
  discovery: {
    icon: 'science',
    description: 'Scientific discovery',
    color: 'var(--color-primary-600)'
  },
  invention: {
    icon: 'lightbulb',
    description: 'New invention',
    color: 'var(--color-warning-600)'
  },

  // Personal events
  birth: {
    icon: 'cake',
    description: 'Birth or birthday',
    color: 'var(--color-success-400)'
  },
  death: {
    icon: 'sentiment_very_dissatisfied',
    description: 'Death or memorial',
    color: 'var(--color-neutral-600)'
  },
  graduation: {
    icon: 'school',
    description: 'Graduation ceremony',
    color: 'var(--color-primary-400)'
  },
  wedding: {
    icon: 'favorite',
    description: 'Wedding ceremony',
    color: 'var(--color-error-400)'
  },

  // Business events
  funding: {
    icon: 'trending_up',
    description: 'Funding or investment',
    color: 'var(--color-success-500)'
  },
  acquisition: {
    icon: 'business_center',
    description: 'Business acquisition',
    color: 'var(--color-secondary-600)'
  },
  ipo: {
    icon: 'public',
    description: 'Initial public offering',
    color: 'var(--color-primary-600)'
  },

  // Default fallback
  default: {
    icon: 'event',
    description: 'General event',
    color: 'var(--color-neutral-500)'
  }
};

export function getEventIcon(event: Event): CategoryIcon {
  if (!event.category) {
    return categoryIcons.default;
  }

  return categoryIcons[event.category] || categoryIcons.default;
}

export function getEventTypeIcon(cardType: string): CategoryIcon {
  switch (cardType) {
    case 'multi-event':
      return {
        icon: 'layers',
        description: 'Multiple events',
        color: 'var(--color-primary-500)'
      };
    case 'infinite':
      return {
        icon: 'all_inclusive',
        description: 'Many events',
        color: 'var(--color-error-500)'
      };
    default:
      return categoryIcons.default;
  }
}

export const priorityIcons: Record<string, CategoryIcon> = {
  high: {
    icon: 'priority_high',
    description: 'High priority',
    color: 'var(--color-error-500)'
  },
  normal: {
    icon: 'remove',
    description: 'Normal priority',
    color: 'var(--color-neutral-500)'
  },
  low: {
    icon: 'keyboard_arrow_down',
    description: 'Low priority',
    color: 'var(--color-neutral-400)'
  }
};

export function getPriorityIcon(priority?: 'low' | 'normal' | 'high'): CategoryIcon {
  if (!priority) return priorityIcons.normal;
  return priorityIcons[priority] || priorityIcons.normal;
}