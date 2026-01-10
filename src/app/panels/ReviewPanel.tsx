/**
 * ReviewPanel - Import Session Review Interface
 * v0.9.1 - Review and commit import session events
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Alert,
} from '@mui/material';
import { useImportSessionContext } from '../../contexts/ImportSessionContext';

interface ReviewPanelProps {
  onClose: () => void;
  onEventClick?: (eventId: string) => void; // Open in AuthoringOverlay
  onCommit?: () => void; // Called after successful commit to refresh events
  onFocusEvent?: (eventId: string) => void; // Scroll to event on timeline
}

export function ReviewPanel({ onClose, onEventClick, onCommit, onFocusEvent }: ReviewPanelProps) {
  const {
    session,
    updateDecision,
    commitSession,
    discardSession,
    getStats,
  } = useImportSessionContext();

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  if (!session) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center"
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--page-text-secondary)',
        }}
      >
        <Typography variant="body2">No active import session</Typography>
      </div>
    );
  }

  const stats = getStats();
  const reviewedCount = stats.accepted + stats.rejected;
  const progressPercent = stats.total > 0 ? (reviewedCount / stats.total) * 100 : 0;

  const handleAccept = (eventId: string) => {
    updateDecision(eventId, 'accepted');
  };

  const handleReject = (eventId: string) => {
    updateDecision(eventId, 'rejected');
  };

  const handleEdit = (eventId: string) => {
    if (onEventClick) {
      onEventClick(eventId);
    }
  };

  const handleUndo = (eventId: string) => {
    updateDecision(eventId, 'pending');
  };

  const handleAcceptAllRemaining = () => {
    session.events.forEach((event) => {
      if (event.decision === 'pending') {
        updateDecision(event.id, 'accepted');
      }
    });
  };

  const handleCommit = async () => {
    if (stats.accepted === 0) return;

    setIsCommitting(true);
    let didCommit = false;
    try {
      await commitSession();
      didCommit = true;
    } catch (error) {
      console.error('Failed to commit session:', error);
    } finally {
      setIsCommitting(false);
    }

    if (didCommit) {
      onCommit?.(); // Refresh timeline events from Firebase
      onClose();
    }
  };

  const handleDiscardConfirm = () => {
    discardSession();
    setShowDiscardDialog(false);
    onClose();
  };

  const getSourceLabel = () => {
    switch (session.source) {
      case 'yaml':
        return 'YAML Import';
      case 'ai-chat':
        return 'AI Chat';
      case 'pr':
        return 'Pull Request';
      default:
        return 'Import';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'accepted':
        return '✓';
      case 'rejected':
        return '✗';
      default:
        return '○';
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'accepted':
        return '#1f883d'; // green
      case 'rejected':
        return '#dc2626'; // red
      default:
        return '#f97316'; // orange
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Unknown date';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const truncateDescription = (desc: string | undefined, maxLength = 50) => {
    if (!desc) return '';
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength) + '...';
  };

  return (
    <div
      data-testid="review-panel"
      className="h-full flex flex-col"
      role="region"
      aria-label="Import Session Review Panel"
      style={{
        backgroundColor: 'var(--color-surface)',
        color: 'var(--page-text-primary)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: 'var(--page-border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-rounded text-purple-500">fact_check</span>
          <span className="text-sm font-semibold">Review Import Session</span>
        </div>
        <IconButton size="small" onClick={onClose} aria-label="Close review panel">
          <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">
            close
          </span>
        </IconButton>
      </div>

      {/* Session Info */}
      <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--page-border)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: 'var(--page-text-secondary)' }}>
            Source: {getSourceLabel()} • {stats.total} events
          </Typography>
          {session.importMode === 'overwrite' && (
            <Chip
              label="Overwrite Mode"
              size="small"
              color="warning"
              sx={{ height: 18, fontSize: '0.65rem' }}
              data-testid="overwrite-mode-indicator"
            />
          )}
        </Box>
      </div>

      {/* Overwrite deletion warning */}
      {session.importMode === 'overwrite' && session.eventsToDelete && session.eventsToDelete.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mx: 2, mt: 2, py: 0.5 }}
          data-testid="overwrite-delete-warning"
        >
          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
            <strong>{session.eventsToDelete.length} existing event{session.eventsToDelete.length !== 1 ? 's' : ''} will be deleted</strong> when you commit this import.
          </Typography>
        </Alert>
      )}

      {/* Progress Bar */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--page-border)' }}>
        <Typography
          variant="caption"
          sx={{ color: 'var(--page-text-secondary)', mb: 1, display: 'block' }}
        >
          Progress: {reviewedCount} of {stats.total} reviewed
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: 'var(--page-bg-elevated)',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'var(--page-accent)',
            },
          }}
        />
      </div>

      {/* Event List */}
      <div
        className="flex-1 overflow-auto px-4 py-2"
        style={{ overscrollBehavior: 'contain' }}
        onWheel={(e) => e.stopPropagation()}
      >
        {session.events.map((event) => {
          const decision = event.decision;
          const decisionColor = getDecisionColor(decision);
          const isRejected = decision === 'rejected';
          const isPending = decision === 'pending';

          return (
            <Box
              key={event.id}
              data-testid="review-event-item"
              data-event-id={event.id}
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: decisionColor,
                bgcolor: isRejected ? 'var(--page-bg)' : 'var(--page-bg-elevated)',
                opacity: isRejected ? 0.6 : 1,
              }}
            >
              {/* Event Header */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    flex: 1,
                    color: decisionColor,
                  }}
                >
                  {getDecisionIcon(decision)} {event.eventData.title || 'Untitled Event'}
                </Typography>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {isPending && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleAccept(event.id)}
                        sx={{
                          color: 'var(--color-success)',
                          p: 0.5,
                          minWidth: '36px',
                          minHeight: '36px',
                        }}
                        title="Accept"
                        aria-label="Accept event"
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                          check
                        </span>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleReject(event.id)}
                        sx={{
                          color: 'var(--color-danger)',
                          p: 0.5,
                          minWidth: '36px',
                          minHeight: '36px',
                        }}
                        title="Reject"
                        aria-label="Reject event"
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                          close
                        </span>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(event.id)}
                        data-testid="review-event-edit"
                        sx={{
                          color: 'var(--page-text-secondary)',
                          p: 0.5,
                          minWidth: '36px',
                          minHeight: '36px',
                        }}
                        title="Edit"
                        aria-label="Edit event"
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                          edit
                        </span>
                      </IconButton>
                      {onFocusEvent && (
                        <IconButton
                          size="small"
                          onClick={() => onFocusEvent(event.eventData.id || event.id)}
                          sx={{
                            color: 'var(--page-text-secondary)',
                            p: 0.5,
                            minWidth: '36px',
                            minHeight: '36px',
                          }}
                          title="Focus on timeline"
                          aria-label="Focus event on timeline"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                            visibility
                          </span>
                        </IconButton>
                      )}
                    </>
                  )}
                  {!isPending && (
                    <>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleUndo(event.id)}
                        sx={{
                          textTransform: 'none',
                          minWidth: 'auto',
                          px: 1,
                          color: 'var(--page-text-secondary)',
                        }}
                      >
                        Undo
                      </Button>
                      {onFocusEvent && (
                        <IconButton
                          size="small"
                          onClick={() => onFocusEvent(event.eventData.id || event.id)}
                          sx={{
                            color: 'var(--page-text-secondary)',
                            p: 0.5,
                            minWidth: '36px',
                            minHeight: '36px',
                          }}
                          title="Focus on timeline"
                          aria-label="Focus event on timeline"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                            visibility
                          </span>
                        </IconButton>
                      )}
                    </>
                  )}
                </Box>
              </Box>

              {/* Event Details */}
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--page-text-secondary)',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                {formatDate(event.eventData.date)} • {event.action.toUpperCase()}
                {event.action === 'update' && ' (differs from existing)'}
              </Typography>

              {/* Event Description */}
              {event.eventData.description && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--page-text-secondary)',
                    fontSize: '0.75rem',
                    mb: 0.5,
                  }}
                >
                  {truncateDescription(event.eventData.description)}
                </Typography>
              )}

              {/* Sources display */}
              {event.eventData.sources && event.eventData.sources.length > 0 && (
                <Box sx={{ mt: 1, mb: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 500,
                      color: 'var(--page-text-secondary)',
                      display: 'block',
                      mb: 0.5,
                      fontSize: '0.7rem',
                    }}
                  >
                    Sources:
                  </Typography>
                  <Box
                    component="ul"
                    sx={{
                      m: 0,
                      pl: 2,
                      fontSize: '0.7rem',
                      color: 'var(--page-text-secondary)',
                      '& li': { mb: 0.25 },
                    }}
                  >
                    {event.eventData.sources.map((source, idx) => {
                      const existingSources = new Set(event.existingEvent?.sources || []);
                      const isNew = event.action === 'update' && !existingSources.has(source);
                      return (
                        <li key={idx}>
                          {isNew && (
                            <span
                              style={{
                                background: 'var(--color-success, #22c55e)',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '0 4px',
                                fontSize: '9px',
                                marginRight: '4px',
                                fontWeight: 600,
                              }}
                            >
                              NEW
                            </span>
                          )}
                          {source.startsWith('http') ? (
                            <a
                              href={source}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--page-accent)',
                                textDecoration: 'none',
                                wordBreak: 'break-all',
                              }}
                            >
                              {source.length > 50 ? `${source.substring(0, 50)}...` : source}
                            </a>
                          ) : (
                            source
                          )}
                        </li>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* View Diff button for UPDATE actions */}
              {event.action === 'update' && (
                <Button
                  size="small"
                  variant="outlined"
                  sx={{
                    textTransform: 'none',
                    mt: 0.5,
                    fontSize: '0.75rem',
                    color: 'var(--page-text-secondary)',
                    borderColor: 'var(--page-border)',
                  }}
                  disabled
                >
                  View Diff (Coming Soon)
                </Button>
              )}
            </Box>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div
        className="px-4 py-3 border-t flex gap-2"
        style={{ borderColor: 'var(--page-border)' }}
      >
        <Button
          size="small"
          variant="outlined"
          onClick={handleAcceptAllRemaining}
          disabled={stats.pending === 0}
          sx={{
            textTransform: 'none',
            flex: 1,
            borderColor: 'var(--page-border)',
            color: 'var(--page-text-primary)',
          }}
        >
          Accept All Remaining
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleCommit}
          disabled={stats.accepted === 0 || isCommitting}
          sx={{
            textTransform: 'none',
            flex: 1,
            bgcolor: 'var(--page-accent)',
            '&:hover': { bgcolor: 'var(--page-accent-hover)' },
          }}
        >
          {isCommitting ? 'Committing...' : `Commit (${stats.accepted})`}
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setShowDiscardDialog(true)}
          sx={{
            textTransform: 'none',
            flex: 1,
            borderColor: 'var(--color-danger)',
            color: 'var(--color-danger)',
          }}
        >
          Discard All
        </Button>
      </div>

      {/* Discard Confirmation Dialog */}
      <Dialog
        open={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        aria-labelledby="discard-dialog-title"
      >
        <DialogTitle id="discard-dialog-title">Discard Import Session?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will discard all {stats.total} events from this import session. This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDiscardDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDiscardConfirm}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Discard All
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
