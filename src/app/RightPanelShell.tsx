/**
 * RightPanelShell - Right-side collapsible panel container
 * v0.7.0 - For AI chat and future right-side panels
 */

import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from './hooks/useFocusTrap';

interface RightPanelShellProps {
  id: string;
  title: string;
  dragging: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const RightPanelShell: React.FC<RightPanelShellProps> = ({
  id,
  title,
  dragging,
  children,
  onClose,
  className
}) => {
  const ref = useRef<HTMLElement | null>(null);
  useFocusTrap(true, ref.current);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const first = root.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    first?.focus();
  }, []);

  return (
    <aside
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`dialog-title-${id}`}
      data-testid={`${id}-panel`}
      className={`fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] p-0 z-[100] ${
        dragging ? 'pointer-events-none' : 'pointer-events-auto'
      } ${className || ''}`}
      style={{ pointerEvents: dragging ? 'none' : 'auto' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="h-full flex flex-col shadow-xl border-l"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border-primary)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between border-b"
          style={{ borderColor: 'var(--color-border-primary)' }}
        >
          <h2
            id={`dialog-title-${id}`}
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {title}
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="p-2.5 rounded transition-colors min-w-11 min-h-11"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span className="material-symbols-rounded text-lg" aria-hidden="true">close</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-auto p-3"
          style={{ overscrollBehavior: 'contain' }}
        >
          {children}
        </div>
      </div>
    </aside>
  );
};
