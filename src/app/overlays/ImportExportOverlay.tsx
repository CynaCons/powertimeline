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

import { useState, useCallback, useRef } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import { OverlayShell } from '../OverlayShell';
import {
  exportTimelineToYaml,
  parseYamlForSession,
  YamlSessionParseError,
  type ValidationError,
} from '../../services/timelineImportExport';
import { useImportSessionContext } from '../../contexts/ImportSessionContext';
import type { Event, Timeline } from '../../types';

interface ImportExportOverlayProps {
  timeline: Timeline | null;
  events: Event[];
  dragging: boolean;
  onClose: () => void;
  onImport: (events: Event[]) => void;
  onSessionStarted?: () => void;
}

type TabValue = 'export' | 'import';

export function ImportExportOverlay(props: ImportExportOverlayProps) {
  const { timeline, events, dragging, onClose, onSessionStarted } = props;
  const { startSession } = useImportSessionContext();
  const [activeTab, setActiveTab] = useState<TabValue>('export');
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [generalError, setGeneralError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Process uploaded file
  const processFile = useCallback(async (file: File) => {
    setGeneralError('');
    setValidationErrors([]);

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
      const parsedEvents = parseYamlForSession(content);
      if (parsedEvents.length === 0) {
        setGeneralError('No events found in this YAML file');
        return;
      }
      startSession('yaml', parsedEvents, events);
      onSessionStarted?.();
      onClose();
    } catch (error) {
      if (error instanceof YamlSessionParseError) {
        setValidationErrors(error.errors);
        return;
      }
      setGeneralError(error instanceof Error ? error.message : 'Failed to read file');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [events, onClose, onSessionStarted, startSession]);

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
              Import starts a review session so you can accept changes before saving.
            </Typography>
          </Box>
        )}
      </Box>
    </OverlayShell>
  );
}
