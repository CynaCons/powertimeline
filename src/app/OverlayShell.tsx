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
      ref={ref as any}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`dialog-title-${id}`}
      className={`absolute left-14 top-0 bottom-0 w-72 max-w-[75vw] text-gray-50 p-3 space-y-3 z-20 ${dragging ? 'pointer-events-none' : 'pointer-events-auto'} ${className || ''}`}
      style={{ background: 'rgba(17,24,39,0.55)', backdropFilter: 'blur(4px)', borderRight: '1px solid rgba(75,85,99,0.6)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)', pointerEvents: dragging ? 'none' : 'auto' }}
    >
      <div className="flex items-center justify-between">
        <h2 id={`dialog-title-${id}`} className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-300">{title}</h2>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close panel" className="text-[11px] px-2 py-1 rounded bg-gray-800/60 border border-gray-700 hover:bg-gray-700">×</button>
        )}
      </div>
      {children}
    </aside>
  );
};
