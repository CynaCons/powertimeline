import React from 'react';
import type { Event } from '../../types';
import { OverlayShell } from '../OverlayShell';

interface OutlinePanelProps {
  events: Event[];
  filtered: Event[];
  selectedId?: string;
  onSelect: (id: string) => void;
  filter: string;
  setFilter: (v: string) => void;
  dragging: boolean;
  onClose: () => void;
}

export const OutlinePanel: React.FC<OutlinePanelProps> = ({ events, filtered, selectedId, onSelect, filter, setFilter, dragging, onClose }) => {
  return (
    <OverlayShell id="outline" title="Outline" dragging={dragging} onClose={onClose}>
      <input aria-label="Filter outline" placeholder="Filter…" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full rounded border border-gray-700 bg-gray-800/60 text-gray-100 placeholder-gray-400 px-2 py-1 text-[11px]" />
      <ul className="mt-2 space-y-1 max-h-[70vh] overflow-auto pr-1">
        {filtered.map((ev) => (
          <li key={ev.id}>
            <button onClick={() => onSelect(ev.id)} className={`w-full text-left rounded px-2 py-1 border text-[11px] ${ev.id === selectedId ? 'bg-blue-500/20 border-blue-500 text-blue-100' : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800 text-gray-100'}`}>
              <div className="font-medium truncate">{ev.title || '(untitled)'}</div>
              <div className="opacity-70">{ev.date}</div>
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-[11px] text-gray-400">No matches</li>
        )}
      </ul>
    </OverlayShell>
  );
};
