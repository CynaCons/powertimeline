import React from 'react';
import type { Event } from '../../types';
import { OverlayShell } from '../OverlayShell';
// MUI imports
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

interface OutlinePanelProps {
  filtered: Event[];
  selectedId?: string;
  onSelect: (id: string) => void;
  filter: string;
  setFilter: (v: string) => void;
  dragging: boolean;
  onClose: () => void;
}

export const OutlinePanel: React.FC<OutlinePanelProps> = ({ filtered, selectedId, onSelect, filter, setFilter, dragging, onClose }) => {
  return (
    <OverlayShell id="outline" title="Outline" dragging={dragging} onClose={onClose}>
      {/* Filter input */}
      <TextField
        aria-label="Filter outline"
        placeholder="Filter…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        variant="filled"
        size="small"
        fullWidth
      />

      {/* Results list */}
      <List sx={{ mt: 1, maxHeight: '70vh', overflow: 'auto', pr: 1 }}>
        {filtered.map((ev) => (
          <li key={ev.id}>
            <ListItemButton
              selected={ev.id === selectedId}
              onClick={() => onSelect(ev.id)}
            >
              <ListItemText
                primary={ev.title || '(untitled)'}
                secondary={ev.date}
                primaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>
          </li>
        ))}
        {filtered.length === 0 && (
          <li>
            <div className="text-[11px] text-gray-400">No matches</div>
          </li>
        )}
      </List>
    </OverlayShell>
  );
};
