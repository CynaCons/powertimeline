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
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-600">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-1.5">
            {item.href ? (
              <Link
                to={item.href}
                className="hover:text-blue-600 transition-colors hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{item.label}</span>
            )}

            {!isLast && (
              <span className="material-symbols-rounded text-gray-400 text-sm">
                chevron_right
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
