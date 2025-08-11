import React from 'react';
import { OverlayShell } from '../OverlayShell';

interface CreatePanelProps {
  date: string; title: string; description: string;
  setDate: (v: string) => void; setTitle: (v: string) => void; setDescription: (v: string) => void;
  onAdd: (e: React.FormEvent) => void;
  dragging: boolean; onClose: () => void;
}

export const CreatePanel: React.FC<CreatePanelProps> = ({ date, title, description, setDate, setTitle, setDescription, onAdd, dragging, onClose }) => {
  return (
    <OverlayShell id="create" title="Create Event" dragging={dragging} onClose={onClose}>
      <form onSubmit={onAdd} className="flex flex-col gap-2 text-[11px]">
        <label className="flex flex-col"><span className="opacity-80">Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" required /></label>
        <label className="flex flex-col"><span className="opacity-80">Title</span><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" required /></label>
        <label className="flex flex-col"><span className="opacity-80">Description</span><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded border border-gray-700 bg-gray-800/60 text-gray-100 px-2 py-1" placeholder="Optional" /></label>
        <div className="flex gap-2">
          <button type="submit" className="rounded bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-white">Add</button>
          <button type="button" onClick={onClose} className="rounded bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 px-3 py-1">Cancel</button>
        </div>
      </form>
    </OverlayShell>
  );
};
