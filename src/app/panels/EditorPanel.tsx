import React from 'react';
import type { Event } from '../../types';
import { OverlayShell } from '../OverlayShell';

interface EditorPanelProps {
  selected?: Event;
  editDate: string; editTitle: string; editDescription: string;
  setEditDate: (v: string) => void; setEditTitle: (v: string) => void; setEditDescription: (v: string) => void;
  onSave: (e: React.FormEvent) => void; onDelete: () => void;
  dragging: boolean; onClose: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ selected, editDate, editTitle, editDescription, setEditDate, setEditTitle, setEditDescription, onSave, onDelete, dragging, onClose }) => {
  return (
    <OverlayShell id="editor" title="Edit Event" dragging={dragging} onClose={onClose}>
      {selected ? (
        <form onSubmit={onSave} className="flex flex-col gap-2 text-[11px]">
          <label className="flex flex-col"><span className="opacity-80">Date</span><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" required /></label>
          <label className="flex flex-col"><span className="opacity-80">Title</span><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" required /></label>
          <label className="flex flex-col"><span className="opacity-80">Description</span><input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" placeholder="Optional" /></label>
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-white">Save</button>
            <button type="button" onClick={onDelete} className="rounded bg-rose-600 hover:bg-rose-500 px-3 py-1 text-white">Delete</button>
          </div>
        </form>
      ) : (
        <p className="text-[11px] text-gray-400">Select an event on the timeline or from the outline to edit.</p>
      )}
    </OverlayShell>
  );
};
