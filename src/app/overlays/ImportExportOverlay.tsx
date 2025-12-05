/**
 * ImportExportOverlay - Editor overlay for importing and exporting timeline data
 * Implements CC-REQ-IMPORT-xxx and CC-REQ-EXPORT-xxx (v0.5.27)
 *
 * Features:
 * - Export current timeline to YAML
 * - Import events from YAML file
 * - Preview before import with event list
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
  Divider,
  Tabs,
  Tab,
  CircularProgress,
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
    setImportResult(null);

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
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Failed to read file');
    }
  }, []);

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

  // Confirm import
  const handleConfirmImport = async () => {
    if (!importResult) return;

    setIsImporting(true);
    try {
      // Merge imported events with existing events
      // Events with same ID will be updated, new IDs will be added
      const newEvents = [...events];

      for (const importedEvent of importResult.events) {
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
                {/* Import Preview */}
                <Typography variant="subtitle2" gutterBottom>
                  Preview: {importResult.events.length} events to import
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{ flex: 1, overflow: 'auto', mb: 2, maxHeight: 300 }}
                >
                  <List dense>
                    {importResult.events.slice(0, 20).map((event, i) => (
                      <ListItem key={i} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={event.title}
                          secondary={
                            <>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                {event.id}
                              </span>
                              {' • '}
                              {event.date}
                              {event.endDate && ` - ${event.endDate}`}
                            </>
                          }
                          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                    {importResult.events.length > 20 && (
                      <ListItem>
                        <ListItemText
                          secondary={`...and ${importResult.events.length - 20} more events`}
                          secondaryTypographyProps={{ variant: 'caption', fontStyle: 'italic' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancelImport}
                    disabled={isImporting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleConfirmImport}
                    disabled={isImporting}
                    startIcon={isImporting ? <CircularProgress size={16} /> : undefined}
                    data-testid="confirm-import-button"
                  >
                    {isImporting ? 'Importing...' : 'Import Events'}
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
