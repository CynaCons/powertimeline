/**
 * ShareMenu - Social share dropdown with Web Share API support on mobile
 */

import { useState, useCallback } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import { useToast } from '../contexts/ToastContext';

interface ShareMenuProps {
  url: string;
  title: string;
  description?: string;
  onEmbedClick?: () => void;
}

export function ShareMenu({ url, title, description, onEmbedClick }: ShareMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { showToast } = useToast();

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    // On mobile, try native Web Share API first
    if (navigator.share) {
      navigator.share({ title, text: description, url }).catch(() => {
        // User cancelled or error — fall back to menu
        setAnchorEl(event.currentTarget);
      });
      return;
    }

    setAnchorEl(event.currentTarget);
  }, [title, description, url]);

  const handleClose = useCallback((event?: React.MouseEvent) => {
    event?.stopPropagation();
    setAnchorEl(null);
  }, []);

  const openPopup = (popupUrl: string) => {
    window.open(popupUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  };

  const handleTwitter = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();
    const text = encodeURIComponent(title);
    const shareUrl = encodeURIComponent(url);
    openPopup(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`);
  };

  const handleFacebook = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();
    const shareUrl = encodeURIComponent(url);
    openPopup(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`);
  };

  const handleReddit = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();
    const text = encodeURIComponent(title);
    const shareUrl = encodeURIComponent(url);
    openPopup(`https://www.reddit.com/submit?title=${text}&url=${shareUrl}`);
  };

  const handleCopyLink = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  };

  const handleEmbed = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleClose();
    onEmbedClick?.();
  };

  return (
    <>
      <Tooltip title="Share" placement="left">
        <IconButton
          onClick={handleClick}
          onMouseDown={(e) => e.stopPropagation()}
          size="small"
          sx={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-primary)',
            backdropFilter: 'blur(8px)',
            width: '44px',
            height: '44px',
            padding: '8px',
            borderRadius: '50%',
            flexShrink: 0,
            '&:hover': {
              backgroundColor: 'var(--color-surface-hover)',
            },
          }}
          aria-label="Share timeline"
          data-testid="btn-share"
        >
          <span className="material-symbols-rounded" aria-hidden="true">share</span>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
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
        <MenuItem onClick={handleTwitter}>
          <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
            <span className="material-symbols-rounded" aria-hidden="true">share</span>
          </ListItemIcon>
          <ListItemText>Twitter / X</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleFacebook}>
          <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
            <span className="material-symbols-rounded" aria-hidden="true">share</span>
          </ListItemIcon>
          <ListItemText>Facebook</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleReddit}>
          <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
            <span className="material-symbols-rounded" aria-hidden="true">share</span>
          </ListItemIcon>
          <ListItemText>Reddit</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
            <span className="material-symbols-rounded" aria-hidden="true">link</span>
          </ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>

        {onEmbedClick && (
          <MenuItem onClick={handleEmbed}>
            <ListItemIcon sx={{ color: 'var(--page-text-secondary)' }}>
              <span className="material-symbols-rounded" aria-hidden="true">code</span>
            </ListItemIcon>
            <ListItemText>Embed</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
