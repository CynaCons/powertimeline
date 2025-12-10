/**
 * ImportExportOverlay - Editor overlay for importing and exporting timeline data
 * Implements CC-REQ-IMPORT-xxx and CC-REQ-EXPORT-xxx (v0.5.27, v0.7.10)
 *
 * Features:
 * - Export current timeline to YAML
 * - Import events from YAML file with per-event approval
 * - Preview before import with conflict detection
 * - Individual approve/reject for each event
 * - Bulk approve/reject all events
 * - Conflict warnings for duplicate IDs and same dates
 * - Validation error display
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  Button,
  Alert,
  Box,
  Typography,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import { OverlayShell } from '../OverlayShell';
import {
  exportTimelineToYaml,
  importTimelineFromYaml,
  type ImportResult,
  type ValidationError,
} from '../../services/timelineImportExport';
import type { Event, Timeline } from '../../types';

interface ImportExportOverlayProps {
  timeline: Timeline | null;
  events: Event[];
  dragging: boolean;
  onClose: () => void;
  onImport: (events: Event[]) => void;
}

type TabValue = 'export' | 'import';

type EventStatus = 'pending' | 'approved' | 'rejected';

interface ImportEventStatus {
  eventId: string;
  status: EventStatus;
  hasConflict: boolean;
  conflictType?: 'duplicate_id' | 'same_date';
  conflictDetails?: string;
}

export function ImportExportOverlay({
  timeline,
  events,
  dragging,
  onClose,
  onImport,
}: ImportExportOverlayProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('export');
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [generalError, setGeneralError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [eventStatuses, setEventStatuses] = useState<Map<string, ImportEventStatus>>(new Map());

  // Handle export
  const handleExport = useCallback(() => {
    if (!timeline) {
      setGeneralError('No timeline loaded to export');
      return;
    }

    try {
      const yamlContent = exportTimelineToYaml(timeline);
      const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const sanitizedTitle = timeline.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      const filename = `${sanitizedTitle || 'timeline'}.yaml`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Export failed');
    }
  }, [timeline]);

  // Detect conflicts for imported events
  const detectConflicts = useCallback((importedEvents: Event[]): Map<string, ImportEventStatus> => {
    const statusMap = new Map<string, ImportEventStatus>();

    for (const importedEvent of importedEvents) {
      let hasConflict = false;
      let conflictType: 'duplicate_id' | 'same_date' | undefined;
      let conflictDetails: string | undefined;

      // Check for duplicate ID
      const existingEventById = events.find(e => e.id === importedEvent.id);
      if (existingEventById) {
        hasConflict = true;
        conflictType = 'duplicate_id';
        conflictDetails = `Will overwrite existing event: "${existingEventById.title}"`;
      }

      // Check for same date (warn only)
      const existingEventByDate = events.find(
        e => e.date === importedEvent.date && e.id !== importedEvent.id
      );
      if (existingEventByDate && !conflictType) {
        hasConflict = true;
        conflictType = 'same_date';
        conflictDetails = `Same date as existing event: "${existingEventByDate.title}"`;
      }

      statusMap.set(importedEvent.id, {
        eventId: importedEvent.id,
        status: 'pending',
        hasConflict,
        conflictType,
        conflictDetails,
      });
    }

    return statusMap;
  }, [events]);

  // Process uploaded file
  const processFile = useCallback(async (file: File) => {
    setGeneralError('');
    setValidationErrors([]);
    setImportResult(null);
    setEventStatuses(new Map());

    // Validate file type
    if (!file.name.endsWith('.yaml') && !file.name.endsWith('.yml')) {
      setGeneralError('Please upload a YAML file (.yaml or .yml)');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setGeneralError('File too large. Maximum size is 1MB.');
      return;
    }

    try {
      const content = await file.text();
      const result = importTimelineFromYaml(content);

      if (!result.success || !result.result) {
        setValidationErrors(result.errors || []);
        return;
      }

      setImportResult(result.result);
      // Initialize event statuses with conflict detection
      const statuses = detectConflicts(result.result.events);
      setEventStatuses(statuses);
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Failed to read file');
    }
  }, [detectConflicts]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Update event status
  const updateEventStatus = useCallback((eventId: string, status: EventStatus) => {
    setEventStatuses(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(eventId);
      if (existing) {
        newMap.set(eventId, { ...existing, status });
      }
      return newMap;
    });
  }, []);

  // Bulk approve all events
  const handleApproveAll = useCallback(() => {
    setEventStatuses(prev => {
      const newMap = new Map(prev);
      for (const [eventId, status] of newMap.entries()) {
        newMap.set(eventId, { ...status, status: 'approved' });
      }
      return newMap;
    });
  }, []);

  // Bulk reject all events
  const handleRejectAll = useCallback(() => {
    setEventStatuses(prev => {
      const newMap = new Map(prev);
      for (const [eventId, status] of newMap.entries()) {
        newMap.set(eventId, { ...status, status: 'rejected' });
      }
      return newMap;
    });
  }, []);

  // Count approved events
  const approvedCount = useMemo(() => {
    let count = 0;
    for (const status of eventStatuses.values()) {
      if (status.status === 'approved') count++;
    }
    return count;
  }, [eventStatuses]);

  // Confirm import - only import approved events
  const handleConfirmImport = async () => {
    if (!importResult) return;

    setIsImporting(true);
    try {
      // Get only approved events
      const approvedEvents = importResult.events.filter(
        event => eventStatuses.get(event.id)?.status === 'approved'
      );

      if (approvedEvents.length === 0) {
        setGeneralError('No events approved for import');
        setIsImporting(false);
        return;
      }

      // Merge approved events with existing events
      const newEvents = [...events];

      for (const importedEvent of approvedEvents) {
        const existingIndex = newEvents.findIndex(e => e.id === importedEvent.id);
        if (existingIndex >= 0) {
          // Update existing event
          newEvents[existingIndex] = importedEvent;
        } else {
          // Add new event
          newEvents.push(importedEvent);
        }
      }

      onImport(newEvents);
      setImportResult(null);
      setEventStatuses(new Map());
      setGeneralError('');
      onClose();
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelImport = () => {
    setImportResult(null);
    setValidationErrors([]);
    setGeneralError('');
    setEventStatuses(new Map());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <OverlayShell
      id="import-export"
      title="Import / Export"
      dragging={dragging}
      onClose={onClose}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Export" value="export" data-testid="export-tab" />
          <Tab label="Import" value="import" data-testid="import-tab" />
        </Tabs>

        {generalError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGeneralError('')}>
            {generalError}
          </Alert>
        )}

        {exportSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Timeline exported successfully!
          </Alert>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Export this timeline as a YAML file. The file can be edited externally
              and re-imported, or used as a template for AI-generated timelines.
            </Typography>

            {timeline ? (
              <>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {timeline.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={`${events.length} events`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={timeline.visibility}
                      variant="outlined"
                      color={timeline.visibility === 'public' ? 'success' : 'default'}
                    />
                  </Box>
                </Paper>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleExport}
                  startIcon={<span className="material-symbols-rounded">download</span>}
                  data-testid="export-button"
                >
                  Download YAML
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Event IDs are included in the export for tracking changes.
                </Typography>
              </>
            ) : (
              <Alert severity="info">
                No timeline loaded. Open a timeline first to export it.
              </Alert>
            )}
          </Box>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {!importResult ? (
              <>
                {/* Validation errors */}
                {validationErrors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      YAML validation failed:
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {validationErrors.slice(0, 5).map((err, i) => (
                        <ListItem key={i} sx={{ py: 0, px: 0 }}>
                          <ListItemText
                            primary={`${err.field}: ${err.message}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                      {validationErrors.length > 5 && (
                        <ListItem sx={{ py: 0, px: 0 }}>
                          <ListItemText
                            secondary={`...and ${validationErrors.length - 5} more errors`}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Alert>
                )}

                {/* Drop zone */}
                <Paper
                  variant="outlined"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: isDragging ? 'primary.main' : 'divider',
                    backgroundColor: isDragging ? 'action.hover' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover',
                    },
                  }}
                  data-testid="import-dropzone"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".yaml,.yml"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    data-testid="yaml-file-input"
                  />
                  <span className="material-symbols-rounded text-3xl text-gray-400 mb-2 block">
                    upload_file
                  </span>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Drag and drop a YAML file
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    or click to browse
                  </Typography>
                </Paper>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Import will merge events by ID. Existing events with matching IDs
                  will be updated. New events will be added.
                </Typography>
              </>
            ) : (
              <>
                {/* Import Preview with Per-Event Approval */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">
                    Review {importResult.events.length} events
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleApproveAll}
                      data-testid="approve-all-button"
                    >
                      Approve All
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleRejectAll}
                      data-testid="reject-all-button"
                    >
                      Reject All
                    </Button>
                  </Stack>
                </Box>

                <Paper
                  variant="outlined"
                  sx={{ flex: 1, overflow: 'auto', mb: 2, maxHeight: 350 }}
                >
                  <List dense>
                    {importResult.events.map((event) => {
                      const status = eventStatuses.get(event.id);
                      if (!status) return null;

                      const isApproved = status.status === 'approved';
                      const isRejected = status.status === 'rejected';

                      return (
                        <ListItem
                          key={event.id}
                          sx={{
                            py: 1,
                            borderLeft: status.hasConflict ? '3px solid' : 'none',
                            borderColor: status.conflictType === 'duplicate_id'
                              ? 'warning.main'
                              : 'info.main',
                            backgroundColor: isApproved
                              ? 'success.50'
                              : isRejected
                              ? 'action.disabledBackground'
                              : 'transparent',
                            opacity: isRejected ? 0.5 : 1,
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {status.hasConflict && (
                                  <span className="material-symbols-rounded" style={{ fontSize: '16px', color: 'var(--color-warning)' }}>
                                    warning
                                  </span>
                                )}
                                <Typography variant="body2" noWrap>
                                  {event.title}
                                </Typography>
                                {isApproved && (
                                  <Chip label="Approved" size="small" color="success" sx={{ ml: 'auto' }} />
                                )}
                                {isRejected && (
                                  <Chip label="Rejected" size="small" sx={{ ml: 'auto' }} />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" component="div">
                                  {event.date}
                                  {event.endDate && ` - ${event.endDate}`}
                                </Typography>
                                {status.hasConflict && status.conflictDetails && (
                                  <Typography variant="caption" color="text.secondary" component="div">
                                    {status.conflictDetails}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
                            {!isApproved && (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => updateEventStatus(event.id, 'approved')}
                                data-testid={`approve-event-${event.id}`}
                                title="Approve"
                              >
                                <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
                                  check_circle
                                </span>
                              </IconButton>
                            )}
                            {!isRejected && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => updateEventStatus(event.id, 'rejected')}
                                data-testid={`reject-event-${event.id}`}
                                title="Reject"
                              >
                                <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
                                  cancel
                                </span>
                              </IconButton>
                            )}
                          </Stack>
                        </ListItem>
                      );
                    })}
                  </List>
                </Paper>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancelImport}
                    disabled={isImporting}
                  >
                    Cancel
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    {approvedCount} of {importResult.events.length} approved
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleConfirmImport}
                    disabled={isImporting || approvedCount === 0}
                    startIcon={isImporting ? <CircularProgress size={16} /> : undefined}
                    data-testid="confirm-import-button"
                  >
                    {isImporting ? 'Importing...' : `Import ${approvedCount} Event${approvedCount !== 1 ? 's' : ''}`}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>
    </OverlayShell>
  );
}
