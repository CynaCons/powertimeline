/**
 * UserSwitcherModal - Modal for switching between demo users
 *
 * Features:
 * - List of available users with avatars
 * - Highlight current user
 * - Click to switch to different user
 * - Keyboard navigation support
 * - Refresh page after switching to update all components
 */

import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import { getUsers, getCurrentUser, setCurrentUser } from '../lib/homePageStorage';
import type { User } from '../types';

interface UserSwitcherModalProps {
  open: boolean;
  onClose: () => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({ open, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);

  useEffect(() => {
    if (open) {
      setUsers(getUsers());
      setCurrentUserState(getCurrentUser());
    }
  }, [open]);

  const handleUserClick = (user: User) => {
    if (user.id === currentUser?.id) {
      // Already selected, just close
      onClose();
      return;
    }

    // Switch user
    setCurrentUser(user);

    // Close modal
    onClose();

    // Refresh the page to update all components with the new user
    window.location.href = '/';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <span className="font-semibold">Switch Account</span>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
        >
          <span className="material-symbols-rounded">close</span>
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <List sx={{ p: 0 }}>
          {users.map((user, index) => {
            const isCurrentUser = user.id === currentUser?.id;

            return (
              <React.Fragment key={user.id}>
                {index > 0 && <div className="border-t border-gray-200" />}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleUserClick(user)}
                    selected={isCurrentUser}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.50',
                        '&:hover': {
                          bgcolor: 'primary.100',
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: isCurrentUser ? 'primary.main' : 'grey.400',
                          fontSize: '1.5rem',
                        }}
                      >
                        {user.avatar}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          {isCurrentUser && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="material-symbols-rounded text-xs">check_circle</span>
                              Current Account
                            </span>
                          )}
                        </div>
                      }
                      secondary={
                        <span className="text-sm text-gray-600">
                          @{user.id}
                          {user.bio && ` • ${user.bio.slice(0, 50)}${user.bio.length > 50 ? '...' : ''}`}
                        </span>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <span className="material-symbols-rounded text-sm align-middle">info</span>{' '}
            Switching accounts will refresh the page and update your workspace.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
