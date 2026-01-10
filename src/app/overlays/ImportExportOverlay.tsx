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
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { OverlayShell } from '../OverlayShell';
import {
  exportTimelineToYaml,
  parseYamlForSession,
  YamlSessionParseError,
  type ValidationError,
} from '../../services/timelineImportExport';
import { useImportSessionContext } from '../../contexts/ImportSessionContext';
import type { ImportMode } from '../../types/importSession';
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
  const [pastedYaml, setPastedYaml] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [pendingImportContent, setPendingImportContent] = useState<string | null>(null);
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

  // Execute the import with the current mode
  const executeImport = useCallback((content: string) => {
    try {
      const parsedEvents = parseYamlForSession(content);
      if (parsedEvents.length === 0) {
        setGeneralError('No events found in this YAML content');
        return;
      }
      startSession('yaml', parsedEvents, events, importMode);
      setPastedYaml('');
      setPendingImportContent(null);
      onSessionStarted?.();
      onClose();
    } catch (error) {
      if (error instanceof YamlSessionParseError) {
        setValidationErrors(error.errors);
        return;
      }
      setGeneralError(error instanceof Error ? error.message : 'Failed to parse YAML');
    }
  }, [events, importMode, onClose, onSessionStarted, startSession]);

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

      // In overwrite mode with existing events, show confirmation
      if (importMode === 'overwrite' && events.length > 0) {
        setPendingImportContent(content);
        setShowOverwriteConfirm(true);
        return;
      }

      executeImport(content);
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Failed to read file');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [events, importMode, executeImport]);

  // Dedent: strip common leading whitespace from all lines
  const dedent = (text: string): string => {
    const lines = text.split('\n');
    // Find minimum indentation (ignoring empty lines)
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    if (nonEmptyLines.length === 0) return text;

    const minIndent = Math.min(
      ...nonEmptyLines.map(line => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      })
    );

    if (minIndent === 0) return text;

    // Remove the common indentation from all lines
    return lines.map(line => line.slice(minIndent)).join('\n');
  };

  // Process pasted YAML content
  const processPastedYaml = useCallback(() => {
    setGeneralError('');
    setValidationErrors([]);

    // Dedent and trim to handle copy-paste with extra indentation
    const content = dedent(pastedYaml).trim();
    if (!content) {
      setGeneralError('Please paste YAML content first');
      return;
    }

    // Validate content size (max 1MB)
    if (content.length > 1024 * 1024) {
      setGeneralError('Content too large. Maximum size is 1MB.');
      return;
    }

    // In overwrite mode with existing events, show confirmation
    if (importMode === 'overwrite' && events.length > 0) {
      setPendingImportContent(content);
      setShowOverwriteConfirm(true);
      return;
    }

    executeImport(content);
  }, [pastedYaml, events, importMode, executeImport]);

  // Handle confirmation of overwrite import
  const handleConfirmOverwrite = useCallback(() => {
    setShowOverwriteConfirm(false);
    if (pendingImportContent) {
      executeImport(pendingImportContent);
    }
  }, [pendingImportContent, executeImport]);

  // Handle cancellation of overwrite import
  const handleCancelOverwrite = useCallback(() => {
    setShowOverwriteConfirm(false);
    setPendingImportContent(null);
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
            {/* Import Mode Toggle */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Import Mode
              </Typography>
              <ToggleButtonGroup
                value={importMode}
                exclusive
                onChange={(_, newMode) => newMode && setImportMode(newMode)}
                size="small"
                fullWidth
              >
                <ToggleButton value="merge" data-testid="import-mode-merge">
                  <span className="material-symbols-rounded" style={{ fontSize: 18, marginRight: 4 }}>merge</span>
                  Merge
                </ToggleButton>
                <ToggleButton value="overwrite" data-testid="import-mode-overwrite" color="warning">
                  <span className="material-symbols-rounded" style={{ fontSize: 18, marginRight: 4 }}>sync_alt</span>
                  Overwrite
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {importMode === 'merge'
                  ? 'Add new events, update existing events by ID'
                  : 'Replace all existing events with imported events'}
              </Typography>
            </Box>

            {/* Overwrite warning */}
            {importMode === 'overwrite' && events.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }} data-testid="overwrite-warning">
                <Typography variant="body2">
                  <strong>Warning:</strong> Overwrite mode will delete all {events.length} existing
                  event{events.length !== 1 ? 's' : ''} and replace them with imported events.
                </Typography>
              </Alert>
            )}

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

            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                OR
              </Typography>
            </Divider>

            {/* Paste YAML section */}
            <TextField
              multiline
              rows={6}
              fullWidth
              placeholder={`version: 1\ntimeline:\n  title: "My Timeline"\nevents:\n  - id: "event-1"\n    date: "2024-01-01"\n    title: "Event Title"\n    description: "Event description"`}
              value={pastedYaml}
              onChange={(e) => setPastedYaml(e.target.value)}
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                },
              }}
              inputProps={{ 'data-testid': 'yaml-paste-input' }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={processPastedYaml}
              disabled={!pastedYaml.trim()}
              sx={{ mt: 1, textTransform: 'none' }}
              data-testid="yaml-paste-import"
            >
              Import from Pasted YAML
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Import starts a review session so you can accept changes before saving.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Overwrite Confirmation Dialog */}
      <Dialog
        open={showOverwriteConfirm}
        onClose={handleCancelOverwrite}
        aria-labelledby="overwrite-confirm-title"
        data-testid="overwrite-confirm-dialog"
      >
        <DialogTitle id="overwrite-confirm-title">Confirm Overwrite Import</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will <strong>delete all {events.length} existing event{events.length !== 1 ? 's' : ''}</strong> and
            replace them with the imported events. This action cannot be undone after you commit the import.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelOverwrite} data-testid="overwrite-cancel">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmOverwrite}
            color="warning"
            variant="contained"
            data-testid="overwrite-confirm"
          >
            Proceed with Overwrite
          </Button>
        </DialogActions>
      </Dialog>
    </OverlayShell>
  );
}
