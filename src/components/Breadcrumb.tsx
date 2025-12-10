/**
 * Breadcrumb - Navigation breadcrumbs component
 * Shows current location: Home > User > Timeline
 */

import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;  // If undefined, this is the current page (no link)
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-xs"
      style={{ color: 'var(--page-text-secondary)' }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-1.5">
            {item.href ? (
              <Link
                to={item.href}
                className="transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
                style={{
                  color: 'var(--page-text-secondary)',
                  outlineColor: 'var(--page-accent)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--page-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--page-text-secondary)'}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="font-medium"
                style={{ color: 'var(--page-text-primary)' }}
                aria-current="page"
              >
                {item.label}
              </span>
            )}

            {!isLast && (
              <span
                className="material-symbols-rounded text-sm"
                style={{ color: 'var(--page-text-secondary)', opacity: 0.6 }}
                aria-hidden="true"
              >
                chevron_right
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
