/**
 * UserProfileMenu - Google/Microsoft-style account dropdown menu
 *
 * Features:
 * - User avatar and name display
 * - Dropdown menu with account actions
 * - Switch Account, User Space, Settings, Logout options
 * - Keyboard navigation support
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import { getCurrentUser } from '../lib/homePageStorage';
import type { User } from '../types';

interface UserProfileMenuProps {
  onSwitchAccount?: () => void;  // Callback to open user switcher modal
  onLogout?: () => void;  // Callback for logout action
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  onSwitchAccount,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const open = Boolean(anchorEl);

  // Load current user
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSwitchAccount = () => {
    handleClose();
    onSwitchAccount?.();
  };

  const handleUserSpace = () => {
    handleClose();
    if (currentUser) {
      navigate(`/user/${currentUser.id}`);
    }
  };

  const handleSettings = () => {
    handleClose();
    // TODO: Navigate to settings page when implemented
    console.log('Settings clicked - to be implemented');
  };

  const handleLogout = () => {
    handleClose();
    onLogout?.();
  };

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label="Account menu"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: '4px 12px',
          borderRadius: '20px',
          '&:hover': {
            bgcolor: 'grey.100',
          },
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            fontSize: '1.2rem',
          }}
        >
          {currentUser.avatar}
        </Avatar>
        <span className="text-sm font-medium hidden md:inline">
          {currentUser.name}
        </span>
        <span className="material-symbols-rounded text-sm">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </IconButton>

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
          <Avatar sx={{ bgcolor: 'primary.main', fontSize: '1.2rem' }}>
            {currentUser.avatar}
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-0.5">Logged in as</span>
            <span className="font-semibold text-sm">{currentUser.name}</span>
            <span className="text-xs text-gray-500">@{currentUser.id}</span>
          </div>
        </MenuItem>

        <Divider />

        {/* Switch Account */}
        <MenuItem onClick={handleSwitchAccount}>
          <ListItemIcon>
            <span className="material-symbols-rounded">swap_horiz</span>
          </ListItemIcon>
          <ListItemText>Switch Account</ListItemText>
        </MenuItem>

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

        {/* Logout */}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <span className="material-symbols-rounded">logout</span>
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
