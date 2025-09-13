import React, { useEffect, useRef } from 'react';
import { useFocusTrap } from './hooks/useFocusTrap';

interface OverlayShellProps {
  id: string; // id suffix for aria-labelledby
  title: string;
  dragging: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const OverlayShell: React.FC<OverlayShellProps> = ({ id, title, dragging, children, onClose, className }) => {
  const ref = useRef<HTMLElement | null>(null);
  useFocusTrap(true, ref.current);

  // focus first focusable on mount
  useEffect(() => {
    const root = ref.current; if (!root) return;
    const first = root.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    first?.focus();
  }, []);

  return (
    <aside
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`dialog-title-${id}`}
      className={`fixed left-14 top-0 bottom-0 w-80 max-w-[75vw] p-0 z-20 group overlay panel overlay-shell ${dragging ? 'pointer-events-none' : 'pointer-events-auto'} ${className || ''}`}
      style={{ pointerEvents: dragging ? 'none' : 'auto' }}
    >
      <div
        className="h-full bg-white text-gray-900 border-r border-gray-200 shadow-md flex flex-col transition-opacity"
        style={{ opacity: 0.1 }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.1'; }}
      >
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 id={`dialog-title-${id}`} className="text-xs font-semibold tracking-wide">{title}</h2>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close panel" className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">×</button>
          )}
        </div>
        <div className="p-3 overflow-auto grow" style={{ overscrollBehavior: 'contain' }}>
          {children}
        </div>
      </div>
    </aside>
  );
};
