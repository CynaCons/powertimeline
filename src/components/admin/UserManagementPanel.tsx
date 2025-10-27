/**
 * UserManagementPanel - Admin user management interface
 * Implements CC-REQ-ADMIN-USR-001 to CC-REQ-ADMIN-USR-004
 * v0.4.4 - Admin Panel & Site Administration
 */

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import type { User } from '../../types';
import { getUsers, getTimelinesByOwner, updateUser, deleteUser, getCurrentUser } from '../../lib/homePageStorage';

type SortField = 'name' | 'createdAt' | 'timelineCount';
type SortDirection = 'asc' | 'desc';
type RoleFilter = 'all' | 'admin' | 'user';

interface UserWithTimelines extends User {
  timelineCount: number;
}

export function UserManagementPanel() {
  const [users, setUsers] = useState<User[]>(getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Role change confirmation dialog
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    newRole: 'user' | 'admin';
  } | null>(null);

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    timelineCount: number;
  } | null>(null);

  const currentUser = getCurrentUser();

  // Enrich users with timeline count
  const usersWithTimelines: UserWithTimelines[] = useMemo(() => {
    return users.map(user => ({
      ...user,
      timelineCount: getTimelinesByOwner(user.id).length,
    }));
  }, [users]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = usersWithTimelines;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(query) ||
          user.id.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => (user.role || 'user') === roleFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'timelineCount':
          comparison = a.timelineCount - b.timelineCount;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [usersWithTimelines, searchQuery, roleFilter, sortField, sortDirection]);

  const handleRoleChange = (userId: string, newRole: 'user' | 'admin') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setRoleChangeDialog({
      open: true,
      userId,
      userName: user.name,
      newRole,
    });
  };

  const confirmRoleChange = () => {
    if (!roleChangeDialog) return;

    const success = updateUser(roleChangeDialog.userId, { role: roleChangeDialog.newRole });
    if (success) {
      setUsers(getUsers());
      // TODO: Log to activity log when Phase 6 is implemented
    }

    setRoleChangeDialog(null);
  };

  const handleDeleteClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const timelineCount = getTimelinesByOwner(userId).length;

    setDeleteDialog({
      open: true,
      userId,
      userName: user.name,
      timelineCount,
    });
  };

  const confirmDelete = () => {
    if (!deleteDialog) return;

    const timelinesDeleted = deleteUser(deleteDialog.userId, true);
    console.log(`Deleted user ${deleteDialog.userId}, cascade deleted ${timelinesDeleted} timelines`);
    setUsers(getUsers());
    // TODO: Log to activity log when Phase 6 is implemented

    setDeleteDialog(null);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon className="mr-2 text-gray-400" />,
          }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Role Filter</InputLabel>
          <Select
            value={roleFilter}
            label="Role Filter"
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </Select>
        </FormControl>

        {searchQuery && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setSearchQuery('')}
          >
            Clear Search
          </Button>
        )}
      </div>

      {/* User Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Avatar</TableCell>
              <TableCell>
                <Button
                  onClick={() => toggleSort('name')}
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </Button>
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>
                <Button
                  onClick={() => toggleSort('createdAt')}
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => toggleSort('timelineCount')}
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  Timelines {sortField === 'timelineCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </Button>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <p className="text-gray-500">No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <span className="text-2xl">{user.avatar}</span>
                  </TableCell>
                  <TableCell>
                    <strong>{user.name}</strong>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-gray-600">{user.id}</code>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                        disabled={currentUser?.id === user.id} // Can't change own role
                      >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user.timelineCount}</span>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={currentUser?.id === user.id ? 'Cannot delete yourself' : 'Delete user'}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(user.id)}
                          disabled={currentUser?.id === user.id} // Can't delete yourself
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedUsers.length} of {users.length} users
      </div>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={roleChangeDialog?.open || false} onClose={() => setRoleChangeDialog(null)}>
        <DialogTitle>Confirm Role Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to change <strong>{roleChangeDialog?.userName}</strong>'s role to{' '}
            <strong>{roleChangeDialog?.newRole}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleChangeDialog(null)}>Cancel</Button>
          <Button onClick={confirmRoleChange} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog?.open || false} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteDialog?.userName}</strong>?
            {deleteDialog && deleteDialog.timelineCount > 0 && (
              <>
                <br />
                <br />
                <span className="text-red-600 font-semibold">
                  This will also delete {deleteDialog.timelineCount} timeline{deleteDialog.timelineCount !== 1 ? 's' : ''}.
                </span>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
