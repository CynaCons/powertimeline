/**
 * UserProfileMenu - Google/Microsoft-style account dropdown menu
 *
 * Features:
 * - User avatar and name display
 * - Dropdown menu with account actions
 * - Switch Account, User Space, Settings, Logout options
 * - Keyboard navigation support
 * - v0.5.1 Phase 2: Firebase Auth integration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { useAuth } from '../contexts/AuthContext';
import { getUser } from '../services/firestore';
import type { User } from '../types';

interface UserProfileMenuProps {
  onLogout?: () => void;  // Callback for logout action
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  onLogout,
}) => {
  const navigate = useNavigate();
  const { user: firebaseUser, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const open = Boolean(anchorEl);

  // Load current user profile from Firestore
  useEffect(() => {
    async function loadUser() {
      if (firebaseUser) {
        const userProfile = await getUser(firebaseUser.uid);
        setCurrentUser(userProfile);
      } else {
        setCurrentUser(null);
      }
    }
    loadUser();
  }, [firebaseUser]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleUserSpace = () => {
    handleClose();
    if (currentUser) {
      // Note: URL pattern is /:username (no @ prefix - React Router v7 bug)
      navigate(`/${currentUser.username}`);
    }
  };

  const handleSettings = () => {
    handleClose();
    navigate('/settings');
  };

  const handleLogout = async () => {
    handleClose();
    await signOut();
    onLogout?.();
  };

  // Don't render if not logged in
  if (!firebaseUser) {
    return null;
  }

  return (
    <>
      <div
        className="inline-flex items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <IconButton
          onClick={(e) => { e.stopPropagation(); handleClick(e); }}
          onMouseDown={(e) => e.stopPropagation()}
          size="small"
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          aria-label="Account menu"
          sx={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-primary)',
            backdropFilter: 'blur(8px)',
            padding: '8px',
            minWidth: '36px',
            height: '36px',
            borderRadius: isHovered ? '18px' : '50%',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'var(--color-surface-hover)',
            },
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
            account_circle
          </span>

          {/* Username and chevron - expand on hover */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              overflow: 'hidden',
              maxWidth: isHovered ? '150px' : '0px',
              opacity: isHovered ? 1 : 0,
              marginLeft: isHovered ? '4px' : '0px',
              transition: 'all 0.2s ease-in-out',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="text-sm font-medium">
              {currentUser?.username || firebaseUser?.email?.split('@')[0]}
            </span>
            <span className="material-symbols-rounded text-sm ml-1">
              expand_more
            </span>
          </span>
        </IconButton>
      </div>

      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 260,
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header with "Logged in as" label */}
        <MenuItem disabled sx={{ opacity: '1 !important', cursor: 'default !important', pb: 2 }}>
          <span className="material-symbols-rounded" style={{ fontSize: '32px', marginRight: '8px', color: '#8b5cf6' }}>
            account_circle
          </span>
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-gray-500">Logged in as</span>
            </div>
            <span className="font-semibold text-sm">{currentUser?.username || firebaseUser?.email?.split('@')[0]}</span>
            <span className="text-xs text-gray-500">
              {firebaseUser?.email}
            </span>
          </div>
        </MenuItem>

        <Divider />

        {/* User Space */}
        <MenuItem onClick={handleUserSpace}>
          <ListItemIcon>
            <span className="material-symbols-rounded">person</span>
          </ListItemIcon>
          <ListItemText>My Timelines</ListItemText>
        </MenuItem>

        {/* Settings */}
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <span className="material-symbols-rounded">settings</span>
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>

        <Divider />

        {/* Sign Out */}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <span className="material-symbols-rounded">logout</span>
          </ListItemIcon>
          <ListItemText>Sign Out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
