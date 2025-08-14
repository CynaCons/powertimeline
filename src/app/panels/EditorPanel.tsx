import React from 'react';
import type { Event } from '../../types';
import { OverlayShell } from '../OverlayShell';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

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
          <TextField
            label="Date"
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            required
            size="small"
            variant="filled"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Title"
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            size="small"
            variant="filled"
          />
          <TextField
            label="Description"
            type="text"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Optional"
            size="small"
            variant="filled"
          />
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" color="success">Save</Button>
            <Button type="button" variant="contained" color="error" onClick={onDelete}>Delete</Button>
          </Stack>
        </form>
      ) : (
        <p className="text-[11px] text-gray-400">Select an event on the timeline or from the outline to edit.</p>
      )}
    </OverlayShell>
  );
};
