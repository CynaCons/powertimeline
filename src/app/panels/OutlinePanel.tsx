import React from 'react';
import type { Event } from '../../types';
import { OverlayShell } from '../OverlayShell';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';

interface OutlinePanelProps {
  filtered: Event[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onCreate?: () => void;
  filter: string;
  setFilter: (v: string) => void;
  dragging: boolean;
  onClose: () => void;
}

export const OutlinePanel: React.FC<OutlinePanelProps> = ({ filtered, selectedId, onSelect, onCreate, filter, setFilter, dragging, onClose }) => {
  return (
    <OverlayShell id="events" title="Events" dragging={dragging} onClose={onClose}>
      <TextField
        aria-label="Filter events"
        placeholder="Filter..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        variant="filled"
        size="small"
        fullWidth
      />
      {onCreate && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            data-testid="events-add-top"
            onClick={onCreate}
            className="rounded bg-indigo-600 text-white hover:bg-indigo-500 px-3 py-1 text-xs font-medium"
          >
            + Add Event
          </button>
        </div>
      )}
      <List sx={{ mt: 1, maxHeight: '70vh', overflow: 'auto', pr: 1 }}>
        {filtered.map((ev, idx) => (
          <li key={ev.id}>
            <div className="group">
              <ListItemButton
                selected={ev.id === selectedId}
                onClick={() => onSelect(ev.id)}
                sx={{ '&.Mui-selected': { bgcolor: 'action.selected' }, '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ListItemText
                  primary={ev.title || '(untitled)'}
                  secondary={ev.date}
                  primaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
              {onCreate && (
                <div className="flex items-center justify-center py-1">
                  <button
                    type="button"
                    data-testid={`events-inline-add-${idx}`}
                    onClick={onCreate}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 px-2 py-0.5 text-[11px]"
                    aria-label="Add event here"
                    title="Add event"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
        {onCreate && (
          <li>
            <div className="flex items-center justify-center py-2">
              <button
                type="button"
                data-testid="events-add-bottom"
                onClick={onCreate}
                className="rounded border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 px-3 py-1 text-xs"
                aria-label="Add event"
              >
                + Add Event
              </button>
            </div>
          </li>
        )}
        {filtered.length === 0 && (
          <li>
            {filter ? (
              <div className="text-[11px] text-gray-400">No matches</div>
            ) : (
              <div className="space-y-2 pr-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col">
                    <Skeleton variant="rectangular" height={18} sx={{ borderRadius: 1 }} />
                    <Skeleton variant="text" width={120} height={14} />
                  </div>
                ))}
              </div>
            )}
          </li>
        )}
      </List>
    </OverlayShell>
  );
};
