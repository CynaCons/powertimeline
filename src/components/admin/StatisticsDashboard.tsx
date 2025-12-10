/**
 * StatisticsDashboard - Platform statistics and analytics dashboard
 * Implements CC-REQ-ADMIN-STATS-001 to CC-REQ-ADMIN-STATS-006
 * v0.4.4 - Admin Panel & Site Administration
 */

import { useMemo, useState } from 'react';
import { Paper, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { calculatePlatformStats } from '../../lib/adminStats';
import { resetAllStatistics } from '../../services/firestore';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import EventIcon from '@mui/icons-material/Event';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const COLORS = {
  public: '#4CAF50',
  unlisted: '#FF9800',
  private: '#F44336',
};

export function StatisticsDashboard() {
  const stats = useMemo(() => calculatePlatformStats(), []);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetStatistics = async () => {
    setResetting(true);
    try {
      await resetAllStatistics();
      setResetSuccess(true);
      setTimeout(() => {
        window.location.reload(); // Reload to show updated stats
      }, 1500);
    } catch (error) {
      console.error('Failed to reset statistics:', error);
      alert('Failed to reset statistics. Please try again.');
    } finally {
      setResetting(false);
      setConfirmDialogOpen(false);
    }
  };

  // Prepare data for visibility pie chart
  const visibilityData = [
    { name: 'Public', value: stats.visibilityBreakdown.public },
    { name: 'Unlisted', value: stats.visibilityBreakdown.unlisted },
    { name: 'Private', value: stats.visibilityBreakdown.private },
  ].filter(item => item.value > 0); // Only show non-zero values

  // Prepare data for top creators bar chart
  const creatorsData = stats.topCreators.map(creator => ({
    name: creator.userName,
    timelines: creator.timelineCount,
  }));

  return (
    <div className="space-y-6" data-testid="statistics-dashboard">
      {/* Reset Statistics Section */}
      <Paper
        sx={{ p: 3, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}
        data-testid="reset-statistics-section"
      >
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="h6" gutterBottom color="error.main">
              Reset All Statistics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will reset view counts to zero for all timelines. This action cannot be undone.
            </Typography>
          </div>
          <Button
            variant="contained"
            color="error"
            startIcon={<RestartAltIcon />}
            onClick={() => setConfirmDialogOpen(true)}
            disabled={resetting}
            data-testid="reset-statistics-button"
          >
            Reset Statistics
          </Button>
        </div>
        {resetSuccess && (
          <Alert severity="success" sx={{ mt: 2 }} data-testid="reset-success-alert">
            Statistics reset successfully! Reloading page...
          </Alert>
        )}
      </Paper>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card data-testid="metric-total-users">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4" component="div" data-testid="metric-total-users-value">
                  {stats.totalUsers}
                </Typography>
              </div>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </div>
          </CardContent>
        </Card>

        {/* Total Timelines */}
        <Card data-testid="metric-total-timelines">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Timelines
                </Typography>
                <Typography variant="h4" component="div" data-testid="metric-total-timelines-value">
                  {stats.totalTimelines}
                </Typography>
                <Typography variant="caption" color="text.secondary" data-testid="metric-timelines-last30">
                  {stats.timelinesCreatedLast30Days} in last 30 days
                </Typography>
              </div>
              <TimelineIcon sx={{ fontSize: 40, color: 'success.main' }} />
            </div>
          </CardContent>
        </Card>

        {/* Total Events */}
        <Card data-testid="metric-total-events">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Events
                </Typography>
                <Typography variant="h4" component="div" data-testid="metric-total-events-value">
                  {stats.totalEvents}
                </Typography>
                <Typography variant="caption" color="text.secondary" data-testid="metric-average-events">
                  Avg {stats.averageEventsPerTimeline} per timeline
                </Typography>
              </div>
              <EventIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            </div>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card data-testid="metric-total-views">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Views
                </Typography>
                <Typography variant="h4" component="div" data-testid="metric-total-views-value">
                  {stats.totalViews}
                </Typography>
              </div>
              <VisibilityIcon sx={{ fontSize: 40, color: 'info.main' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Visibility Breakdown */}
        <Paper sx={{ p: 3 }} data-testid="timeline-visibility-section">
          <Typography variant="h6" gutterBottom data-testid="timeline-visibility-heading">
            Timeline Visibility
          </Typography>
          {visibilityData.length > 0 ? (
            <div data-testid="timeline-visibility-chart">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  { }
                  <Pie
                    data={visibilityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: { name?: string; percent?: number }) => `${entry.name || ''}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {visibilityData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64" data-testid="timeline-visibility-empty">
              <Typography variant="body2" color="text.secondary">
                No timeline data available
              </Typography>
            </div>
          )}
        </Paper>

        {/* Top Timeline Creators */}
        <Paper sx={{ p: 3 }} data-testid="top-creators-section">
          <Typography variant="h6" gutterBottom data-testid="top-creators-heading">
            Top Timeline Creators
          </Typography>
          {creatorsData.length > 0 ? (
            <div data-testid="top-creators-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={creatorsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="timelines" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64" data-testid="top-creators-empty">
              <Typography variant="body2" color="text.secondary">
                No creator data available
              </Typography>
            </div>
          )}
        </Paper>
      </div>

      {/* Recent Activity Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom data-testid="recent-activity-heading">
          Recent Timeline Activity
        </Typography>
        <TableContainer>
          <Table size="small" data-testid="recent-activity-table">
            <TableHead>
              <TableRow>
                <TableCell><strong>Timeline</strong></TableCell>
                <TableCell><strong>Owner</strong></TableCell>
                <TableCell><strong>Last Updated</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.recentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No recent activity
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentActivity.map((activity) => (
                  <TableRow key={activity.timelineId} hover>
                    <TableCell>{activity.timelineTitle}</TableCell>
                    <TableCell>{activity.ownerName}</TableCell>
                    <TableCell>
                      {new Date(activity.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Top Creators Table (detailed view) */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom data-testid="top-creators-table-heading">
          Top Creators (Detailed)
        </Typography>
        <TableContainer>
          <Table size="small" data-testid="top-creators-table">
            <TableHead>
              <TableRow>
                <TableCell><strong>Rank</strong></TableCell>
                <TableCell><strong>Creator</strong></TableCell>
                <TableCell align="right"><strong>Timelines</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.topCreators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No creators found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                stats.topCreators.map((creator, index) => (
                  <TableRow key={creator.userId} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{creator.userName}</TableCell>
                    <TableCell align="right">{creator.timelineCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Reset All Statistics?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all view counts to zero? This will affect all timelines
            across the entire platform and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResetStatistics} color="error" variant="contained" disabled={resetting}>
            {resetting ? 'Resetting...' : 'Reset All Statistics'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
