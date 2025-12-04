/**
 * TimelineCardMenu - Kebab menu for timeline card actions
 * Provides View, Edit, and Delete options for timeline cards
 * Implements improved UX for CC-REQ-MYTIMELINES-005
 */

import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface TimelineCardMenuProps {
  timelineId: string;
  ownerId: string;
  ownerUsername: string;  // v0.5.14: Required for username-based URLs
  currentUserId?: string | null;
  onEdit?: (timelineId: string) => void;
  onDelete?: (timelineId: string) => void;
  onExport?: (timelineId: string) => void;  // v0.5.27: Export to YAML
}

export function TimelineCardMenu({
  timelineId,
  ownerId,
  ownerUsername,
  currentUserId,
  onEdit,
  onDelete,
  onExport,
}: TimelineCardMenuProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // User owns this timeline if their ID matches the owner ID
  const isOwner = currentUserId && currentUserId === ownerId;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevent card click
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent card click
    }
    setAnchorEl(null);
  };

  const handleView = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();
    // v0.5.14: Use username-based URL (no @ prefix - React Router v7 bug)
    navigate(`/${ownerUsername}/timeline/${timelineId}`);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();
    if (onEdit) {
      onEdit(timelineId);
    }
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();
    if (onDelete) {
      onDelete(timelineId);
    }
  };

  const handleExport = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();
    if (onExport) {
      onExport(timelineId);
    }
  };

  return (
    <>
      <IconButton
        aria-label="timeline actions"
        aria-controls={open ? 'timeline-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        size="small"
        className="timeline-menu-button"
        sx={{
          padding: '4px',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <span className="material-symbols-rounded text-base text-gray-700">more_vert</span>
      </IconButton>

      <Menu
        id="timeline-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
        MenuListProps={{
          'aria-labelledby': 'timeline-menu-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <span className="material-symbols-rounded text-gray-700">open_in_new</span>
          </ListItemIcon>
          <ListItemText>Open</ListItemText>
        </MenuItem>

        {onExport && (
          <MenuItem onClick={handleExport} data-testid="export-timeline-button">
            <ListItemIcon>
              <span className="material-symbols-rounded text-gray-700">download</span>
            </ListItemIcon>
            <ListItemText>Export YAML</ListItemText>
          </MenuItem>
        )}

        {!isOwner && ownerUsername && (
          <MenuItem onClick={(e) => {
            e.stopPropagation();
            handleClose();
            navigate(`/${ownerUsername}`);
          }}>
            <ListItemIcon>
              <span className="material-symbols-rounded text-gray-700">person</span>
            </ListItemIcon>
            <ListItemText>Go to Owner</ListItemText>
          </MenuItem>
        )}

        {isOwner && onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <span className="material-symbols-rounded text-gray-700">edit</span>
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}

        {isOwner && onDelete && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <span className="material-symbols-rounded text-red-600">delete</span>
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
