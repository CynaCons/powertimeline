import React from 'react';
import type { Event } from '../../types';
import { OverlayShell } from '../OverlayShell';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

interface OutlinePanelProps {
  filtered: Event[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onCreate?: () => void;
  filter: string;
  setFilter: (v: string) => void;
  dragging: boolean;
  onClose: () => void;
  onHover?: (id: string) => void;
  onHoverEnd?: () => void;
  onNavigateToEvent?: (id: string) => void;
}

export const OutlinePanel: React.FC<OutlinePanelProps> = ({ filtered, selectedId, onSelect, onCreate, filter, setFilter, dragging, onClose, onHover, onHoverEnd, onNavigateToEvent }) => {
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
        {filtered.map((ev) => (
          <li key={ev.id} className="group relative">
            <ListItemButton
              selected={ev.id === selectedId}
              onClick={() => onSelect(ev.id)}
              onMouseEnter={() => onHover?.(ev.id)}
              onMouseLeave={() => onHoverEnd?.()}
              sx={{ '&.Mui-selected': { bgcolor: 'action.selected' }, '&:hover': { bgcolor: 'action.hover' } }}
            >
              <ListItemText
                primary={ev.title || '(untitled)'}
                secondary={ev.date}
                primaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>

            {/* Action buttons - show on hover */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
              {onNavigateToEvent && (
                <Tooltip title="View on canvas" placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onNavigateToEvent(ev.id); }}
                    sx={{ padding: '4px', bgcolor: 'background.paper' }}
                  >
                    <span className="material-symbols-rounded text-sm">visibility</span>
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Edit event" placement="top">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onSelect(ev.id); }}
                  sx={{ padding: '4px', bgcolor: 'background.paper' }}
                >
                  <span className="material-symbols-rounded text-sm">edit</span>
                </IconButton>
              </Tooltip>
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
              <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>No matches</div>
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
