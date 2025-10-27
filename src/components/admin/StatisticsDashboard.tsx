/**
 * StatisticsDashboard - Platform statistics and analytics dashboard
 * Implements CC-REQ-ADMIN-STATS-001 to CC-REQ-ADMIN-STATS-006
 * v0.4.4 - Admin Panel & Site Administration
 */

import { useMemo } from 'react';
import { Paper, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { calculatePlatformStats } from '../../lib/adminStats';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import EventIcon from '@mui/icons-material/Event';
import VisibilityIcon from '@mui/icons-material/Visibility';

const COLORS = {
  public: '#4CAF50',
  unlisted: '#FF9800',
  private: '#F44336',
};

export function StatisticsDashboard() {
  const stats = useMemo(() => calculatePlatformStats(), []);

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
    <div className="space-y-6">
      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalUsers}
                </Typography>
              </div>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </div>
          </CardContent>
        </Card>

        {/* Total Timelines */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Timelines
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalTimelines}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.timelinesCreatedLast30Days} in last 30 days
                </Typography>
              </div>
              <TimelineIcon sx={{ fontSize: 40, color: 'success.main' }} />
            </div>
          </CardContent>
        </Card>

        {/* Total Events */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Events
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalEvents}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg {stats.averageEventsPerTimeline} per timeline
                </Typography>
              </div>
              <EventIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            </div>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Views
                </Typography>
                <Typography variant="h4" component="div">
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
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Timeline Visibility
          </Typography>
          {visibilityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={visibilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={((entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`) as any}
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
          ) : (
            <div className="flex items-center justify-center h-64">
              <Typography variant="body2" color="text.secondary">
                No timeline data available
              </Typography>
            </div>
          )}
        </Paper>

        {/* Top Timeline Creators */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top Timeline Creators
          </Typography>
          {creatorsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={creatorsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="timelines" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <Typography variant="body2" color="text.secondary">
                No creator data available
              </Typography>
            </div>
          )}
        </Paper>
      </div>

      {/* Recent Activity Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Timeline Activity
        </Typography>
        <TableContainer>
          <Table size="small">
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
        <Typography variant="h6" gutterBottom>
          Top Creators (Detailed)
        </Typography>
        <TableContainer>
          <Table size="small">
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
    </div>
  );
}
