/**
 * EventDiffView - Modal for comparing existing vs imported event data
 * v0.9.4 - Word-level diff view for UPDATE actions in ReviewPanel
 */

import { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { diffArrays } from 'diff';
import type { SessionEvent } from '../../types/importSession';
import { useTheme } from '../../contexts/ThemeContext';

interface EventDiffViewProps {
  open: boolean;
  sessionEvent: SessionEvent;
  onClose: () => void;
  onKeepExisting: () => void;  // Sets decision to 'rejected'
  onTakeImported: () => void;  // Sets decision to 'accepted'
}

/**
 * Custom styles for react-diff-viewer - defined outside component to avoid recreation
 */
const DIFF_STYLES = {
  variables: {
    dark: {
      diffViewerBackground: 'var(--page-bg-elevated)',
      gutterBackground: 'var(--page-bg)',
      addedBackground: 'rgba(34, 197, 94, 0.15)',
      addedGutterBackground: 'rgba(34, 197, 94, 0.25)',
      removedBackground: 'rgba(239, 68, 68, 0.15)',
      removedGutterBackground: 'rgba(239, 68, 68, 0.25)',
      wordAddedBackground: 'rgba(34, 197, 94, 0.4)',
      wordRemovedBackground: 'rgba(239, 68, 68, 0.4)',
      addedGutterColor: '#22c55e',
      removedGutterColor: '#ef4444',
      gutterColor: 'var(--page-text-secondary)',
      addedColor: '#22c55e',
      removedColor: '#ef4444',
      emptyLineBackground: 'transparent',
      codeFoldBackground: 'var(--page-bg)',
      codeFoldGutterBackground: 'var(--page-bg)',
    },
    light: {
      diffViewerBackground: '#fafafa',
      gutterBackground: '#f0f0f0',
      addedBackground: 'rgba(34, 197, 94, 0.1)',
      addedGutterBackground: 'rgba(34, 197, 94, 0.2)',
      removedBackground: 'rgba(239, 68, 68, 0.1)',
      removedGutterBackground: 'rgba(239, 68, 68, 0.2)',
      wordAddedBackground: 'rgba(34, 197, 94, 0.35)',
      wordRemovedBackground: 'rgba(239, 68, 68, 0.35)',
      addedGutterColor: '#16a34a',
      removedGutterColor: '#dc2626',
      gutterColor: '#666',
      addedColor: '#16a34a',
      removedColor: '#dc2626',
      emptyLineBackground: 'transparent',
      codeFoldBackground: '#f0f0f0',
      codeFoldGutterBackground: '#f0f0f0',
    },
  },
  contentText: {
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    lineHeight: '1.5',
  },
};

/**
 * Computes which fields have changed between existing and imported event
 */
function getChangedFields(sessionEvent: SessionEvent) {
  const existing = sessionEvent.existingEvent;
  const imported = sessionEvent.eventData;

  if (!existing) return [];

  const fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'date' | 'array';
    oldValue: string | string[];
    newValue: string | string[];
  }> = [];

  // Title
  if (existing.title !== imported.title && imported.title !== undefined) {
    fields.push({
      name: 'title',
      label: 'Title',
      type: 'text',
      oldValue: existing.title || '',
      newValue: imported.title || '',
    });
  }

  // Date
  if (existing.date !== imported.date && imported.date !== undefined) {
    fields.push({
      name: 'date',
      label: 'Date',
      type: 'date',
      oldValue: existing.date || '',
      newValue: imported.date || '',
    });
  }

  // End Date
  if (existing.endDate !== imported.endDate && imported.endDate !== undefined) {
    fields.push({
      name: 'endDate',
      label: 'End Date',
      type: 'date',
      oldValue: existing.endDate || '',
      newValue: imported.endDate || '',
    });
  }

  // Time
  if (existing.time !== imported.time && imported.time !== undefined) {
    fields.push({
      name: 'time',
      label: 'Time',
      type: 'date',
      oldValue: existing.time || '',
      newValue: imported.time || '',
    });
  }

  // Description
  if (existing.description !== imported.description && imported.description !== undefined) {
    fields.push({
      name: 'description',
      label: 'Description',
      type: 'text',
      oldValue: existing.description || '',
      newValue: imported.description || '',
    });
  }

  // Sources (array comparison)
  const existingSources = existing.sources || [];
  const importedSources = imported.sources || [];
  const sourcesChanged = JSON.stringify(existingSources) !== JSON.stringify(importedSources);

  if (sourcesChanged && imported.sources !== undefined) {
    fields.push({
      name: 'sources',
      label: 'Sources',
      type: 'array',
      oldValue: existingSources,
      newValue: importedSources,
    });
  }

  return fields;
}

/**
 * Renders array diff with +/- indicators and semantic HTML for accessibility
 */
function ArrayDiff({ oldValue, newValue }: { oldValue: string[]; newValue: string[] }) {
  const diff = useMemo(() => diffArrays(oldValue, newValue), [oldValue, newValue]);

  return (
    <Box
      component="ul"
      role="list"
      aria-label="Source changes"
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        p: 1.5,
        m: 0,
        borderRadius: 1,
        bgcolor: 'var(--page-bg-elevated)',
        border: '1px solid var(--page-border)',
        listStyle: 'none',
      }}
    >
      {diff.map((part, idx) => (
        <Box component="li" key={idx} sx={{ display: 'contents' }}>
          {part.value.map((item, itemIdx) => {
            if (part.added) {
              return (
                <Box
                  component="ins"
                  key={`${idx}-${itemIdx}`}
                  sx={{
                    display: 'block',
                    color: '#22c55e',
                    bgcolor: 'rgba(34, 197, 94, 0.1)',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    wordBreak: 'break-all',
                    textDecoration: 'none',
                  }}
                >
                  <span aria-hidden="true">+ </span>
                  <span className="sr-only">Added: </span>
                  {item}
                </Box>
              );
            } else if (part.removed) {
              return (
                <Box
                  component="del"
                  key={`${idx}-${itemIdx}`}
                  sx={{
                    display: 'block',
                    color: '#ef4444',
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    wordBreak: 'break-all',
                    textDecoration: 'none',
                  }}
                >
                  <span aria-hidden="true">- </span>
                  <span className="sr-only">Removed: </span>
                  {item}
                </Box>
              );
            } else {
              return (
                <Box
                  key={`${idx}-${itemIdx}`}
                  sx={{
                    display: 'block',
                    color: 'var(--page-text-secondary)',
                    bgcolor: 'transparent',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    wordBreak: 'break-all',
                  }}
                >
                  <span aria-hidden="true">{'  '}</span>
                  {item}
                </Box>
              );
            }
          })}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Renders simple date/time diff with semantic HTML for accessibility
 * Uses <del> and <ins> tags so screen readers announce changes properly
 */
function DateDiff({ oldValue, newValue }: { oldValue: string; newValue: string }) {
  return (
    <Box
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'var(--page-bg-elevated)',
        border: '1px solid var(--page-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
      }}
    >
      <Box
        component="del"
        sx={{
          color: '#ef4444',
          bgcolor: 'rgba(239, 68, 68, 0.1)',
          px: 1,
          py: 0.25,
          borderRadius: 0.5,
          textDecoration: 'line-through',
        }}
      >
        {oldValue || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>(empty)</span>}
      </Box>
      <span aria-hidden="true" style={{ color: 'var(--page-text-secondary)' }}>→</span>
      <span className="sr-only">changed to</span>
      <Box
        component="ins"
        sx={{
          color: '#22c55e',
          bgcolor: 'rgba(34, 197, 94, 0.1)',
          px: 1,
          py: 0.25,
          borderRadius: 0.5,
          textDecoration: 'none',
        }}
      >
        {newValue || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>(empty)</span>}
      </Box>
    </Box>
  );
}

export function EventDiffView({
  open,
  sessionEvent,
  onClose,
  onKeepExisting,
  onTakeImported,
}: EventDiffViewProps) {
  const { isDarkMode } = useTheme();
  const changedFields = useMemo(() => getChangedFields(sessionEvent), [sessionEvent]);

  const eventTitle = sessionEvent.eventData.title || sessionEvent.existingEvent?.title || 'Untitled Event';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      data-testid="event-diff-dialog"
      aria-labelledby="diff-dialog-title"
      PaperProps={{
        sx: {
          bgcolor: 'var(--color-surface)',
          color: 'var(--page-text-primary)',
          maxHeight: '85vh',
        },
      }}
    >
      <DialogTitle
        id="diff-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--page-border)',
          pb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span className="material-symbols-rounded" style={{ color: 'var(--page-accent)' }} aria-hidden="true">
            compare
          </span>
          <Typography variant="h6" component="span" sx={{ fontSize: '1rem' }}>
            Event Diff: {eventTitle}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close diff view"
          data-testid="diff-close-button"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }} aria-hidden="true">
            close
          </span>
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 2 }}>
        {changedFields.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: 'var(--page-text-secondary)', textAlign: 'center', py: 4 }}
            data-testid="diff-no-changes"
          >
            No differences detected between existing and imported event.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {changedFields.map((field) => (
              <Box key={field.name} data-testid={`diff-field-${field.name}`}>
                <Typography
                  variant="subtitle2"
                  component="h3"
                  sx={{
                    color: 'var(--page-text-primary)',
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  {field.label}
                </Typography>

                {field.type === 'text' && (
                  <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
                    <ReactDiffViewer
                      oldValue={field.oldValue as string}
                      newValue={field.newValue as string}
                      splitView={false}
                      compareMethod={DiffMethod.WORDS}
                      useDarkTheme={isDarkMode}
                      hideLineNumbers={true}
                      styles={DIFF_STYLES}
                    />
                  </Box>
                )}

                {field.type === 'date' && (
                  <DateDiff
                    oldValue={field.oldValue as string}
                    newValue={field.newValue as string}
                  />
                )}

                {field.type === 'array' && (
                  <ArrayDiff
                    oldValue={field.oldValue as string[]}
                    newValue={field.newValue as string[]}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: '1px solid var(--page-border)',
          px: 3,
          py: 2,
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={onKeepExisting}
          variant="outlined"
          data-testid="diff-keep-existing-button"
          sx={{
            textTransform: 'none',
            borderColor: 'var(--page-border)',
            color: 'var(--page-text-primary)',
            '&:hover': {
              borderColor: 'var(--color-danger)',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
            },
          }}
        >
          Keep Existing
        </Button>
        <Button
          onClick={onTakeImported}
          variant="contained"
          data-testid="diff-take-imported-button"
          sx={{
            textTransform: 'none',
            bgcolor: 'var(--page-accent)',
            '&:hover': {
              bgcolor: 'var(--page-accent-hover)',
            },
          }}
        >
          Take Imported
        </Button>
      </DialogActions>
    </Dialog>
  );
}
