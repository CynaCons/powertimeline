/**
 * UserManagementPanel - Admin user management interface
 * Implements CC-REQ-ADMIN-USR-001 to CC-REQ-ADMIN-USR-004
 * Phase 5: Added bulk operations (selection, bulk delete, bulk role assignment)
 * v0.4.4 - Admin Panel & Site Administration
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  Checkbox,
  Toolbar,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import type { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getUsers, getTimelines, updateUser as updateUserFirestore, deleteUser as deleteUserFirestore, deleteTimeline } from '../../services/firestore';
import { UserAvatar } from '../UserAvatar';
import { logAdminAction } from '../../lib/activityLog';

type SortField = 'name' | 'createdAt' | 'timelineCount';
type SortDirection = 'asc' | 'desc';
type RoleFilter = 'all' | 'admin' | 'user';

interface UserWithTimelines extends User {
  timelineCount: number;
}

export function UserManagementPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [timelineCounts, setTimelineCounts] = useState<Map<string, number>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Selection state for bulk operations
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

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

  // Bulk delete confirmation dialog
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{
    open: boolean;
    userCount: number;
    totalTimelines: number;
  } | null>(null);

  // Bulk role assignment dialog
  const [bulkRoleDialog, setBulkRoleDialog] = useState<{
    open: boolean;
    userCount: number;
    newRole: 'user' | 'admin';
  } | null>(null);

  // Use Firebase Auth instead of deprecated localStorage getCurrentUser()
  const { user } = useAuth();
  const currentUserId = user?.uid;

  // Helper function to refresh data from Firestore
  const refreshData = useCallback(async () => {
    const loadedUsers = await getUsers();
    setUsers(loadedUsers);

    // Load all timelines to count per user
    const allTimelines = await getTimelines();
    const counts = new Map<string, number>();
    allTimelines.forEach(timeline => {
      counts.set(timeline.ownerId, (counts.get(timeline.ownerId) || 0) + 1);
    });
    setTimelineCounts(counts);
  }, []);

  // Load users and timeline counts from Firestore
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Enrich users with timeline count
  const usersWithTimelines: UserWithTimelines[] = useMemo(() => {
    return users.map(user => ({
      ...user,
      timelineCount: timelineCounts.get(user.id) || 0,
    }));
  }, [users, timelineCounts]);

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

  const confirmRoleChange = async () => {
    if (!roleChangeDialog) return;

    try {
      await updateUserFirestore(roleChangeDialog.userId, { role: roleChangeDialog.newRole });
      await refreshData();
      logAdminAction(
        currentUserId || '',
        user?.displayName || 'Admin',
        'USER_ROLE_CHANGE',
        'user',
        roleChangeDialog.userId,
        `Changed user "${roleChangeDialog.userName}" role to ${roleChangeDialog.newRole}`,
        roleChangeDialog.userName,
        { oldRole: users.find(u => u.id === roleChangeDialog.userId)?.role || 'user', newRole: roleChangeDialog.newRole }
      );
    } catch (error) {
      console.error('Failed to update user role:', error);
    }

    setRoleChangeDialog(null);
  };

  const handleDeleteClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const timelineCount = timelineCounts.get(userId) || 0;

    setDeleteDialog({
      open: true,
      userId,
      userName: user.name,
      timelineCount,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;

    try {
      // Get user's timelines to delete them first (cascade)
      const userTimelines = await getTimelines({ ownerId: deleteDialog.userId });

      // Delete all user's timelines
      for (const timeline of userTimelines) {
        await deleteTimeline(timeline.id);
      }

      // Delete the user
      await deleteUserFirestore(deleteDialog.userId);

      console.log(`Deleted user ${deleteDialog.userId}, cascade deleted ${userTimelines.length} timelines`);
      await refreshData();

      logAdminAction(
        currentUserId || '',
        user?.displayName || 'Admin',
        'USER_DELETE',
        'user',
        deleteDialog.userId,
        `Deleted user "${deleteDialog.userName}" and ${userTimelines.length} associated timeline${userTimelines.length !== 1 ? 's' : ''}`,
        deleteDialog.userName,
        { timelinesDeleted: userTimelines.length }
      );
    } catch (error) {
      console.error('Failed to delete user:', error);
    }

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

  // Selection handlers
  const toggleSelectUser = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredAndSortedUsers.length) {
      // Deselect all
      setSelectedUserIds(new Set());
    } else {
      // Select all (except current user)
      const allIds = new Set(
        filteredAndSortedUsers
          .filter(u => u.id !== currentUserId)
          .map(u => u.id)
      );
      setSelectedUserIds(allIds);
    }
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  // Bulk operations
  const handleBulkDelete = () => {
    const totalTimelines = Array.from(selectedUserIds).reduce((sum, userId) => {
      return sum + (timelineCounts.get(userId) || 0);
    }, 0);

    setBulkDeleteDialog({
      open: true,
      userCount: selectedUserIds.size,
      totalTimelines,
    });
  };

  const confirmBulkDelete = async () => {
    if (!bulkDeleteDialog) return;

    try {
      let totalDeleted = 0;
      const userIds = Array.from(selectedUserIds);

      for (const userId of userIds) {
        // Get user's timelines to delete them first (cascade)
        const userTimelines = await getTimelines({ ownerId: userId });

        // Delete all user's timelines
        for (const timeline of userTimelines) {
          await deleteTimeline(timeline.id);
        }
        totalDeleted += userTimelines.length;

        // Delete the user
        await deleteUserFirestore(userId);
      }

      console.log(`Bulk deleted ${selectedUserIds.size} users, cascade deleted ${totalDeleted} timelines`);
      await refreshData();
      clearSelection();
      setBulkDeleteDialog(null);
      logAdminAction(
        currentUserId || '',
        user?.displayName || 'Admin',
        'BULK_OPERATION',
        'user',
        'bulk',
        `Bulk deleted ${userIds.length} user${userIds.length !== 1 ? 's' : ''} and ${totalDeleted} associated timeline${totalDeleted !== 1 ? 's' : ''}`,
        undefined,
        { operation: 'delete', userCount: userIds.length, timelinesDeleted: totalDeleted, userIds }
      );
    } catch (error) {
      console.error('Failed to bulk delete users:', error);
      clearSelection();
      setBulkDeleteDialog(null);
    }
  };

  const handleBulkRoleAssignment = (newRole: 'user' | 'admin') => {
    setBulkRoleDialog({
      open: true,
      userCount: selectedUserIds.size,
      newRole,
    });
  };

  const confirmBulkRoleAssignment = async () => {
    if (!bulkRoleDialog) return;

    try {
      const userIds = Array.from(selectedUserIds);

      for (const userId of userIds) {
        await updateUserFirestore(userId, { role: bulkRoleDialog.newRole });
      }

      console.log(`Bulk assigned ${selectedUserIds.size} users to role: ${bulkRoleDialog.newRole}`);
      await refreshData();
      clearSelection();
      setBulkRoleDialog(null);
      logAdminAction(
        currentUserId || '',
        user?.displayName || 'Admin',
        'BULK_OPERATION',
        'user',
        'bulk',
        `Bulk assigned ${userIds.length} user${userIds.length !== 1 ? 's' : ''} to role: ${bulkRoleDialog.newRole}`,
        undefined,
        { operation: 'role_assignment', userCount: userIds.length, newRole: bulkRoleDialog.newRole, userIds }
      );
    } catch (error) {
      console.error('Failed to bulk assign roles:', error);
      clearSelection();
      setBulkRoleDialog(null);
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

      {/* Bulk Actions Toolbar */}
      {selectedUserIds.size > 0 && (
        <Toolbar sx={{ bgcolor: 'primary.light', borderRadius: 1, px: 2 }}>
          <Typography variant="subtitle1" component="div" sx={{ flex: '1 1 100%' }}>
            {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
            <InputLabel>Assign Role</InputLabel>
            <Select
              value=""
              label="Assign Role"
              onChange={(e) => handleBulkRoleAssignment(e.target.value as 'user' | 'admin')}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleBulkDelete}
            sx={{ mr: 2 }}
          >
            Delete Selected
          </Button>
          <Button
            variant="outlined"
            onClick={clearSelection}
          >
            Clear Selection
          </Button>
        </Toolbar>
      )}

      {/* User Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedUserIds.size > 0 && selectedUserIds.size < filteredAndSortedUsers.filter(u => u.id !== currentUserId).length}
                  checked={filteredAndSortedUsers.filter(u => u.id !== currentUserId).length > 0 && selectedUserIds.size === filteredAndSortedUsers.filter(u => u.id !== currentUserId).length}
                  onChange={toggleSelectAll}
                />
              </TableCell>
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
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <p className="text-gray-500">No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUserIds.has(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      disabled={currentUserId === user.id}
                    />
                  </TableCell>
                  <TableCell>
                    <UserAvatar user={user} size="medium" />
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
                        disabled={currentUserId === user.id} // Can't change own role
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
                    <Tooltip title={currentUserId === user.id ? 'Cannot delete yourself' : 'Delete user'}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(user.id)}
                          disabled={currentUserId === user.id} // Can't delete yourself
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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialog?.open || false} onClose={() => setBulkDeleteDialog(null)}>
        <DialogTitle>Confirm Bulk User Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{bulkDeleteDialog?.userCount} user{bulkDeleteDialog?.userCount !== 1 ? 's' : ''}</strong>?
            {bulkDeleteDialog && bulkDeleteDialog.totalTimelines > 0 && (
              <>
                <br />
                <br />
                <span className="text-red-600 font-semibold">
                  This will also delete {bulkDeleteDialog.totalTimelines} timeline{bulkDeleteDialog.totalTimelines !== 1 ? 's' : ''}.
                </span>
              </>
            )}
            <br />
            <br />
            <strong>This action cannot be undone.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialog(null)}>Cancel</Button>
          <Button onClick={confirmBulkDelete} variant="contained" color="error">
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Role Assignment Dialog */}
      <Dialog open={bulkRoleDialog?.open || false} onClose={() => setBulkRoleDialog(null)}>
        <DialogTitle>Confirm Bulk Role Assignment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to assign the <strong>{bulkRoleDialog?.newRole}</strong> role to{' '}
            <strong>{bulkRoleDialog?.userCount} user{bulkRoleDialog?.userCount !== 1 ? 's' : ''}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkRoleDialog(null)}>Cancel</Button>
          <Button onClick={confirmBulkRoleAssignment} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
