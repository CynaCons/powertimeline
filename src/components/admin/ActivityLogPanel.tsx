/**
 * ActivityLogPanel - Admin activity log viewer
 * Implements CC-REQ-ADMIN-LOG-001 to CC-REQ-ADMIN-LOG-005
 * v0.4.4 - Admin Panel & Site Administration
 */

import { useState, useMemo, useEffect } from 'react';
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
  Paper,
  Chip,
  TablePagination,
  Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import type { AdminActionType, AdminActionTargetType } from '../../types';
import {
  filterActivityLogs,
  exportActivityLogs,
  type ActivityLogFilters,
} from '../../lib/activityLog';
import { getUsers } from '../../services/firestore';

type ActionFilter = AdminActionType | 'all';
type TargetTypeFilter = AdminActionTargetType | 'all';

export function ActivityLogPanel() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<TargetTypeFilter>('all');
  const [adminUserFilter, setAdminUserFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Load users from Firestore
  useEffect(() => {
    async function loadUsers() {
      const users = await getUsers();
      setAllUsers(users);
    }
    loadUsers();
  }, []);

  const adminUsers = allUsers.filter(u => u.role === 'admin');

  // Apply filters
  const filteredLogs = useMemo(() => {
    const filters: ActivityLogFilters = {};

    if (actionFilter !== 'all') {
      filters.action = actionFilter;
    }

    if (targetTypeFilter !== 'all') {
      filters.targetType = targetTypeFilter;
    }

    if (adminUserFilter !== 'all') {
      filters.adminUserId = adminUserFilter;
    }

    if (searchQuery.trim()) {
      filters.searchTerm = searchQuery.trim();
    }

    return filterActivityLogs(filters);
  }, [actionFilter, targetTypeFilter, adminUserFilter, searchQuery]);

  // Paginate
  const paginatedLogs = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = () => {
    const json = exportActivityLogs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-log-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: AdminActionType): 'default' | 'primary' | 'error' | 'warning' | 'info' => {
    switch (action) {
      case 'USER_DELETE':
      case 'TIMELINE_DELETE':
        return 'error';
      case 'USER_ROLE_CHANGE':
        return 'warning';
      case 'BULK_OPERATION':
        return 'primary';
      case 'CONFIG_CHANGE':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatActionType = (action: AdminActionType): string => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTargetType = (targetType: AdminActionTargetType): string => {
    return targetType.charAt(0).toUpperCase() + targetType.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <TextField
          fullWidth
          size="small"
          label="Search details or target name"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Action Type</InputLabel>
          <Select
            value={actionFilter}
            label="Action Type"
            onChange={(e) => {
              setActionFilter(e.target.value as ActionFilter);
              setPage(0);
            }}
          >
            <MenuItem value="all">All Actions</MenuItem>
            <MenuItem value="USER_ROLE_CHANGE">User Role Change</MenuItem>
            <MenuItem value="USER_DELETE">User Delete</MenuItem>
            <MenuItem value="TIMELINE_DELETE">Timeline Delete</MenuItem>
            <MenuItem value="BULK_OPERATION">Bulk Operation</MenuItem>
            <MenuItem value="CONFIG_CHANGE">Config Change</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Target Type</InputLabel>
          <Select
            value={targetTypeFilter}
            label="Target Type"
            onChange={(e) => {
              setTargetTypeFilter(e.target.value as TargetTypeFilter);
              setPage(0);
            }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="timeline">Timeline</MenuItem>
            <MenuItem value="system">System</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Admin User</InputLabel>
          <Select
            value={adminUserFilter}
            label="Admin User"
            onChange={(e) => {
              setAdminUserFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="all">All Admins</MenuItem>
            {adminUsers.map(user => (
              <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Export
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredLogs.length === 0 ? 0 : page * rowsPerPage + 1}-
        {Math.min((page + 1) * rowsPerPage, filteredLogs.length)} of {filteredLogs.length} log entries
      </div>

      {/* Activity Log Table */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Timestamp</strong></TableCell>
                <TableCell><strong>Admin</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>
                <TableCell><strong>Target Type</strong></TableCell>
                <TableCell><strong>Details</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <div className="py-8 text-gray-500">
                      No activity log entries found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title={new Date(log.timestamp).toLocaleString()}>
                        <span className="text-sm">
                          {new Date(log.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{log.adminUserName}</TableCell>
                    <TableCell>
                      <Chip
                        label={formatActionType(log.action)}
                        color={getActionColor(log.action)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatTargetType(log.targetType)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={log.metadata ? JSON.stringify(log.metadata, null, 2) : ''}>
                        <span>{log.details}</span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </div>
  );
}
