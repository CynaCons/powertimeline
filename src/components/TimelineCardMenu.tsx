/**
 * TimelineCardMenu - Kebab menu for timeline card actions
 * Provides View, Edit, and Delete options for timeline cards
 * Implements improved UX for CC-REQ-MYTIMELINES-005
 */

import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

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
  const { showToast } = useToast();
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

  const handleCopyLink = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();
    const url = `${window.location.origin}/${ownerUsername}/timeline/${timelineId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied to clipboard!', 'success');
    });
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
          color: 'var(--page-text-secondary)',
          '&:hover': {
            backgroundColor: 'var(--page-bg-hover)',
          },
        }}
      >
        <span className="material-symbols-rounded text-base">more_vert</span>
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
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'var(--page-bg-elevated)',
              border: '1px solid var(--page-border)',
              color: 'var(--page-text-primary)',
            }
          }
        }}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
            <span className="material-symbols-rounded">open_in_new</span>
          </ListItemIcon>
          <ListItemText>Open</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
            <span className="material-symbols-rounded">link</span>
          </ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>

        {onExport && (
          <MenuItem onClick={handleExport} data-testid="export-timeline-button">
            <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
              <span className="material-symbols-rounded">download</span>
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
            <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
              <span className="material-symbols-rounded">person</span>
            </ListItemIcon>
            <ListItemText>Go to Owner</ListItemText>
          </MenuItem>
        )}

        {isOwner && onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
              <span className="material-symbols-rounded">edit</span>
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}

        {isOwner && onDelete && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon sx={{ color: 'error.main' }}>
              <span className="material-symbols-rounded">delete</span>
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
