/**
 * ChatPanel - AI Chat Interface
 * v0.7.0 - Chat panel for AI assistant integration
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Box,
  Typography,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import type { AIMessage, AIAction, AIUsageStats } from '../../types/ai';

const LOCAL_STORAGE_KEY = 'powertimeline_gemini_api_key';

interface ChatPanelProps {
  // Session state
  apiKey: string | null;
  isKeyValid: boolean;
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  pendingActions: AIAction[];
  usage?: AIUsageStats;
  // Timeline metadata (for showing metadata change preview)
  timelineTitle?: string;
  timelineDescription?: string;
  // Actions
  onSetApiKey: (key: string) => Promise<boolean>;
  onClearApiKey: () => void;
  onSendMessage: (content: string) => Promise<void>;
  onClearHistory: () => void;
  onApproveActions: (actionIds: string[]) => void;
  onRejectActions: (actionIds: string[]) => void;
  onRestoreActions: (actionIds: string[]) => void;
  onApplyActions: () => Promise<void>;
  onPreviewAction?: (action: AIAction) => void;
  // Panel props
  onClose: () => void;
}

export function ChatPanel({
  apiKey,
  isKeyValid,
  messages,
  isLoading,
  error,
  pendingActions,
  usage,
  timelineTitle,
  timelineDescription,
  onSetApiKey,
  onClearApiKey,
  onSendMessage,
  onClearHistory,
  onApproveActions,
  onRejectActions,
  onRestoreActions,
  onApplyActions,
  onPreviewAction,
  onClose,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const storageCheckedRef = useRef(false);

  const persistStoredKey = useCallback((key: string) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, key);
      setStoredKey(key);
    } catch (storageError) {
      console.warn('Failed to persist API key to localStorage:', storageError);
    }
  }, []);

  const clearStoredKey = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (storageError) {
      console.warn('Failed to clear stored API key from localStorage:', storageError);
    }
    setStoredKey(null);
    setRememberKey(false);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isKeyValid) {
      inputRef.current?.focus();
    }
  }, [isKeyValid]);

  // Preload stored key from localStorage
  useEffect(() => {
    if (storageCheckedRef.current) return;
    storageCheckedRef.current = true;

    try {
      const savedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedKey) {
        const trimmedKey = savedKey.trim();
        setRememberKey(true);
        setStoredKey(trimmedKey);
        setKeyInput(trimmedKey);
        if (!isKeyValid) {
          setIsValidatingKey(true);
          onSetApiKey(trimmedKey)
            .then(valid => {
              if (!valid) {
                clearStoredKey();
                setKeyInput('');
              }
            })
            .finally(() => setIsValidatingKey(false));
        }
      }
    } catch (storageError) {
      console.warn('Failed to read stored API key from localStorage:', storageError);
    }
  }, [onSetApiKey, clearStoredKey, isKeyValid]);

  // Handle API key submission
  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = keyInput.trim();
    if (!trimmedKey) return;

    setIsValidatingKey(true);
    const valid = await onSetApiKey(trimmedKey);
    setIsValidatingKey(false);

    if (valid) {
      if (rememberKey) {
        persistStoredKey(trimmedKey);
      } else if (storedKey) {
        clearStoredKey();
      }
      setKeyInput('');
    }
  };

  const handleRememberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const shouldRemember = event.target.checked;
    setRememberKey(shouldRemember);

    if (!shouldRemember) {
      clearStoredKey();
      return;
    }

    const candidateKey = keyInput.trim() || apiKey?.trim() || '';
    if (candidateKey) {
      persistStoredKey(candidateKey);
    }
  };

  const handleClearStoredKey = () => {
    clearStoredKey();
    setKeyInput('');
  };

  // Handle message send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    await onSendMessage(message);
  };

  // Handle approve all pending actions
  const handleApproveAll = () => {
    const pendingIds = pendingActions
      .filter(a => a.status === 'pending')
      .map(a => a.id);
    onApproveActions(pendingIds);
  };

  // Handle reject all pending actions
  const handleRejectAll = () => {
    const pendingIds = pendingActions
      .filter(a => a.status === 'pending')
      .map(a => a.id);
    onRejectActions(pendingIds);
  };

  // Render API key input section
  const renderKeyInput = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="body2" sx={{ mb: 2, color: 'var(--page-text-secondary)' }}>
        Enter your Google AI API key to start chatting. Get one at{' '}
        <a
          href="https://ai.google.dev"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--page-accent)' }}
        >
          ai.google.dev
        </a>
      </Typography>
      <form onSubmit={handleKeySubmit}>
        <TextField
          fullWidth
          size="small"
          type="password"
          placeholder="AIza..."
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          disabled={isValidatingKey}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={rememberKey}
                onChange={handleRememberChange}
                disabled={isValidatingKey}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'var(--page-text-secondary)' }}>
                Remember on this device
              </Typography>
            }
            sx={{ m: 0, flex: 1 }}
          />
          {storedKey && (
            <Button
              size="small"
              variant="text"
              onClick={handleClearStoredKey}
              disabled={isValidatingKey}
              sx={{ textTransform: 'none', whiteSpace: 'nowrap', color: 'var(--page-text-secondary)' }}
            >
              Clear stored key
            </Button>
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'var(--page-text-tertiary)',
            fontSize: '0.75rem',
            mb: 1
          }}
        >
          Your API key will be stored locally on this device. It is never sent to PowerTimeline servers.
        </Typography>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!keyInput.trim() || isValidatingKey}
          sx={{
            bgcolor: 'var(--page-accent)',
            '&:hover': { bgcolor: 'var(--page-accent-hover)' }
          }}
        >
          {isValidatingKey ? <CircularProgress size={20} /> : 'Connect'}
        </Button>
      </form>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );

  // Render a single message
  const renderMessage = (msg: AIMessage) => {
    const isUser = msg.role === 'user';

    return (
      <Box
        key={msg.id}
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 1,
        }}
      >
        <Box
          sx={{
            maxWidth: '85%',
            p: 1.5,
            borderRadius: 2,
            bgcolor: isUser ? 'var(--page-accent)' : 'var(--page-bg-elevated)',
            color: isUser ? 'white' : 'var(--page-text-primary)',
          }}
        >
          {msg.error ? (
            <Typography variant="body2" sx={{ color: 'error.main' }}>
              ⚠ {msg.error}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </Typography>
          )}

          {/* Show actions if any */}
          {msg.actions && msg.actions.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {msg.actions.map(action => (
                <Chip
                  key={action.id}
                  label={action.description}
                  size="small"
                  sx={{
                    mr: 0.5,
                    mb: 0.5,
                    bgcolor: action.status === 'applied' ? 'success.light' :
                             action.status === 'rejected' ? 'error.light' :
                             'var(--page-bg)'
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // Render metadata preview (UPDATE_METADATA actions)
  const renderMetadataPreview = () => {
    const metadataActions = pendingActions.filter(
      (a): a is import('../../types/ai').UpdateMetadataAction =>
        a.type === 'UPDATE_METADATA' && a.status !== 'rejected'
    );

    if (metadataActions.length === 0) return null;

    // Get the latest metadata action (in case there are multiple)
    const latestAction = metadataActions[metadataActions.length - 1];
    const { changes } = latestAction.payload;

    return (
      <Box sx={{ p: 1.5, bgcolor: 'var(--page-bg-elevated)', borderRadius: 1, mb: 1, border: '1px solid var(--page-border)' }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span>📝</span> Metadata Changes
        </Typography>

        {/* Title change */}
        {changes.title !== undefined && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'var(--page-text-secondary)', fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              Title:
            </Typography>
            <Box sx={{ pl: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'var(--page-text-tertiary)', mb: 0.25 }}>
                Current: {timelineTitle || '(untitled)'}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'success.main', fontWeight: 'bold' }}>
                → New: {changes.title}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Description change */}
        {changes.description !== undefined && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'var(--page-text-secondary)', fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              Description:
            </Typography>
            <Box sx={{ pl: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'var(--page-text-tertiary)', mb: 0.25, whiteSpace: 'pre-wrap' }}>
                Current: {timelineDescription || '(no description)'}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'success.main', fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>
                → New: {changes.description}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          {latestAction.status === 'pending' && (
            <>
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={() => onApproveActions([latestAction.id])}
              >
                Approve
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => onRejectActions([latestAction.id])}
              >
                Reject
              </Button>
            </>
          )}
          {latestAction.status === 'approved' && (
            <Chip label="✓ Approved" size="small" color="success" />
          )}
        </Box>
      </Box>
    );
  };

  // Render pending actions confirmation
  const renderPendingActions = () => {
    // Filter out metadata actions (they're shown separately)
    const nonMetadataActions = pendingActions.filter(a => a.type !== 'UPDATE_METADATA');
    const pending = nonMetadataActions.filter(a => a.status === 'pending');
    const approved = nonMetadataActions.filter(a => a.status === 'approved');
    const rejected = nonMetadataActions.filter(a => a.status === 'rejected');
    const activeActions = pending.length + approved.length + rejected.length;

    if (activeActions === 0) return null;

    return (
      <Box sx={{ p: 1, bgcolor: 'var(--page-bg-elevated)', borderRadius: 1, mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
          Proposed Changes ({pending.length + approved.length}{rejected.length > 0 ? `, ${rejected.length} hidden` : ''})
        </Typography>

        {nonMetadataActions.map(action => (
          <Box
            key={action.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 0.5,
              opacity: action.status === 'rejected' ? 0.5 : 1,
              textDecoration: action.status === 'rejected' ? 'line-through' : 'none'
            }}
          >
            <Typography variant="body2" sx={{ flex: 1, fontSize: '0.75rem' }}>
              {action.type === 'CREATE_EVENT' && '➕'}
              {action.type === 'UPDATE_EVENT' && '✏️'}
              {action.type === 'DELETE_EVENT' && '🗑️'}
              {' '}{action.description}
            </Typography>
            {/* Preview button for events with dates - only for pending/approved */}
            {action.type === 'CREATE_EVENT' && onPreviewAction && action.status !== 'rejected' && (
              <IconButton
                size="small"
                onClick={() => onPreviewAction(action)}
                sx={{ color: 'info.main', p: 0.5, minWidth: '44px', minHeight: '44px' }}
                title="Preview on timeline"
                aria-label="Preview on timeline"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }} aria-hidden="true">visibility</span>
              </IconButton>
            )}
            {/* Restore button for rejected actions */}
            {action.status === 'rejected' && (
              <IconButton
                size="small"
                onClick={() => onRestoreActions([action.id])}
                sx={{ color: 'text.secondary', p: 0.5, minWidth: '44px', minHeight: '44px' }}
                title="Restore this suggestion"
                aria-label="Restore this suggestion"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }} aria-hidden="true">visibility_off</span>
              </IconButton>
            )}
            {action.status === 'pending' && (
              <>
                <IconButton
                  size="small"
                  onClick={() => onApproveActions([action.id])}
                  sx={{ color: 'success.main', p: 0.5, minWidth: '44px', minHeight: '44px' }}
                  aria-label="Approve action"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }} aria-hidden="true">check</span>
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onRejectActions([action.id])}
                  sx={{ color: 'error.main', p: 0.5, minWidth: '44px', minHeight: '44px' }}
                  aria-label="Reject action"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }} aria-hidden="true">close</span>
                </IconButton>
              </>
            )}
            {action.status === 'approved' && (
              <Chip label="✓" size="small" color="success" sx={{ height: 20 }} />
            )}
          </Box>
        ))}

        {(pending.length > 0 || approved.length > 0) && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {pending.length > 0 && (
              <>
                <Button size="small" variant="outlined" color="success" onClick={handleApproveAll}>
                  Approve All
                </Button>
                <Button size="small" variant="outlined" color="error" onClick={handleRejectAll}>
                  Reject All
                </Button>
              </>
            )}
            {approved.length > 0 && (
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={onApplyActions}
                disabled={isLoading}
              >
                Apply ({approved.length})
              </Button>
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Render chat interface
  const renderChat = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'var(--page-text-secondary)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            Gemini 2.5 Flash
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>+ Google Search</span>
          </Typography>
          {/* Usage stats */}
          {usage && usage.requestCount > 0 && (
            <Typography variant="caption" sx={{ color: 'var(--page-text-tertiary)', fontSize: '0.65rem', display: 'block' }}>
              {usage.totalTokens.toLocaleString()} tokens · ${usage.estimatedCostUsd.toFixed(4)} · {usage.requestCount} req
            </Typography>
          )}
        </Box>
        <Box>
          <IconButton
            size="small"
            onClick={onClearHistory}
            aria-label="Clear chat history"
            sx={{ minWidth: '44px', minHeight: '44px' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }} aria-hidden="true">delete</span>
          </IconButton>
          <IconButton
            size="small"
            onClick={onClearApiKey}
            aria-label="Disconnect API key"
            sx={{ minWidth: '44px', minHeight: '44px' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }} aria-hidden="true">logout</span>
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {/* Scrollable content area - contains messages, pending actions, and errors */}
      <Box
        sx={{ flex: 1, overflow: 'auto', mb: 1, overscrollBehavior: 'contain' }}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Messages */}
        {messages.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'var(--page-text-secondary)', textAlign: 'center', mt: 4 }}>
            Ask me to research events, create timelines, or answer questions!
            <br />
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              🔍 I can search the web for historical facts
            </span>
          </Typography>
        ) : (
          messages.map(renderMessage)
        )}
        {/* Searching indicator */}
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, opacity: 0.8 }}>
            <CircularProgress size={14} />
            <Typography variant="caption" sx={{ color: 'var(--page-text-secondary)' }}>
              Searching the web...
            </Typography>
          </Box>
        )}

        {/* Metadata preview - shown separately from other actions */}
        {renderMetadataPreview()}

        {/* Pending actions - now inside scrollable area */}
        {renderPendingActions()}

        {/* Error display - now inside scrollable area */}
        {error && !messages.some(m => m.error) && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input area - stays fixed at bottom */}
      <form onSubmit={handleSend}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            size="small"
            placeholder="Ask me anything... (Enter to send, Shift+Enter for newline)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputValue.trim() && !isLoading) {
                  handleSend(e as unknown as React.FormEvent);
                }
              }
            }}
            disabled={isLoading}
            multiline
            maxRows={3}
            sx={{
              '& input': { fontSize: '0.875rem' },
              '& .MuiInputBase-input::placeholder': { fontSize: '0.75rem', opacity: 0.7 }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!inputValue.trim() || isLoading}
            sx={{
              minWidth: 'auto',
              px: 2,
              bgcolor: 'var(--page-accent)',
              '&:hover': { bgcolor: 'var(--page-accent-hover)' }
            }}
          >
            {isLoading ? <CircularProgress size={20} /> : (
              <span className="material-symbols-rounded">send</span>
            )}
          </Button>
        </Box>
      </form>
    </Box>
  );

  return (
    <div
      data-testid="chat-panel"
      className="h-full flex flex-col"
      role="region"
      aria-label="AI Assistant Chat Panel"
      style={{
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-primary)'
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: 'var(--color-border-primary)' }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-rounded text-purple-500">smart_toy</span>
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        {onClose && (
          <IconButton size="small" onClick={onClose} aria-label="Close AI Assistant panel">
            <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">close</span>
          </IconButton>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-3" style={{ overscrollBehavior: 'contain' }}>
        {!isKeyValid ? renderKeyInput() : renderChat()}
      </div>
    </div>
  );
}
