import React, { useEffect } from 'react';
import { OverlayShell } from '../OverlayShell';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

interface CreatePanelProps {
  date: string; title: string; description: string;
  setDate: (v: string) => void; setTitle: (v: string) => void; setDescription: (v: string) => void;
  onAdd: (e: React.FormEvent) => void;
  dragging: boolean; onClose: () => void;
}

export const CreatePanel: React.FC<CreatePanelProps> = ({ date, title, description, setDate, setTitle, setDescription, onAdd, dragging, onClose }) => {
  useEffect(() => {
    if (!date) {
      try { setDate(new Date().toISOString().slice(0,10)); } catch {}
    }
  }, [date, setDate]);
  return (
    <OverlayShell id="create" title="Create Event" dragging={dragging} onClose={onClose}>
      <form onSubmit={onAdd} className="flex flex-col gap-2 text-[11px]">
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          size="small"
          variant="filled"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          size="small"
          variant="filled"
        />
        <TextField
          label="Description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          size="small"
          variant="filled"
        />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" color="primary">Add</Button>
          <Button type="button" variant="outlined" onClick={onClose}>Cancel</Button>
        </Stack>
      </form>
    </OverlayShell>
  );
};
