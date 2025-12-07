/**
 * useAISession - AI Chat Session Management Hook
 * v0.7.0 - Manages AI chat state and interactions
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  AISession,
  AISessionActions,
  AIMessage,
  AIAction,
  AIContext,
  AIError,
  AIUsageStats,
  CreateEventAction
} from '../types/ai';
import { validateApiKey, sendMessage } from '../services/aiService';

const MAX_HISTORY_TURNS = 5;

interface UseAISessionOptions {
  context: AIContext;
  onApplyActions: (actions: AIAction[]) => Promise<void>;
}

export function useAISession({ context, onApplyActions }: UseAISessionOptions): AISession & AISessionActions {
  // Session state
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<AIAction[]>([]);
  const [usage, setUsage] = useState<AIUsageStats>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    requestCount: 0,
  });

  // Generate unique ID for messages
  const generateId = () => crypto.randomUUID();

  // Set and validate API key
  const setApiKey = useCallback(async (key: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const valid = await validateApiKey(key);
      if (valid) {
        setApiKeyState(key);
        setIsKeyValid(true);
        // Store in sessionStorage for tab persistence
        sessionStorage.setItem('ai_api_key', key);
        return true;
      } else {
        setError('Invalid API key. Please check and try again.');
        setIsKeyValid(false);
        return false;
      }
    } catch {
      setError('Failed to validate API key.');
      setIsKeyValid(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear API key
  const clearApiKey = useCallback(() => {
    setApiKeyState(null);
    setIsKeyValid(false);
    sessionStorage.removeItem('ai_api_key');
    setMessages([]);
    setPendingActions([]);
    setError(null);
  }, []);

  // Build conversation history for context (last N turns)
  const conversationHistory = useMemo(() => {
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    const recentMessages = messages.slice(-MAX_HISTORY_TURNS * 2);

    for (const msg of recentMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        history.push({ role: msg.role, content: msg.content });
      }
    }

    return history;
  }, [messages]);

  // Send message to AI
  const sendUserMessage = useCallback(async (content: string): Promise<void> => {
    if (!apiKey || !isKeyValid) {
      setError('Please enter a valid API key first.');
      return;
    }

    // Add user message
    const userMessage: AIMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Build context with conversation history
      const fullContext: AIContext = {
        ...context,
        conversationHistory
      };

      // Call AI service
      const response = await sendMessage(apiKey, fullContext, content);

      // Add assistant message
      const assistantMessage: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.text || (response.actions.length > 0
          ? `I'll help you with that. Here's what I propose:`
          : 'I understand.'),
        timestamp: new Date(),
        actions: response.actions.length > 0 ? response.actions : undefined
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Set pending actions if any
      if (response.actions.length > 0) {
        setPendingActions(response.actions);
      }

      // Accumulate usage stats
      if (response.usage) {
        setUsage(prev => ({
          promptTokens: prev.promptTokens + response.usage.promptTokens,
          completionTokens: prev.completionTokens + response.usage.completionTokens,
          totalTokens: prev.totalTokens + response.usage.totalTokens,
          estimatedCostUsd: prev.estimatedCostUsd + response.usage.estimatedCostUsd,
          requestCount: prev.requestCount + 1,
        }));
      }

    } catch (err) {
      const aiError = err as AIError;
      const errorMessage = aiError.message || 'Failed to get AI response.';

      // Add error message
      const errorMsg: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        error: errorMessage
      };
      setMessages(prev => [...prev, errorMsg]);
      setError(errorMessage);

      // Handle invalid API key
      if (aiError.code === 'INVALID_API_KEY') {
        setIsKeyValid(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, isKeyValid, context, conversationHistory]);

  // Clear conversation history
  const clearHistory = useCallback(() => {
    setMessages([]);
    setPendingActions([]);
    setError(null);
  }, []);

  // Approve specific actions
  const approveActions = useCallback((actionIds: string[]) => {
    setPendingActions(prev =>
      prev.map(action =>
        actionIds.includes(action.id)
          ? { ...action, status: 'approved' as const }
          : action
      )
    );
  }, []);

  // Reject specific actions
  const rejectActions = useCallback((actionIds: string[]) => {
    setPendingActions(prev =>
      prev.map(action =>
        actionIds.includes(action.id)
          ? { ...action, status: 'rejected' as const }
          : action
      )
    );
  }, []);

  // Restore rejected actions back to pending
  const restoreActions = useCallback((actionIds: string[]) => {
    setPendingActions(prev =>
      prev.map(action =>
        actionIds.includes(action.id) && action.status === 'rejected'
          ? { ...action, status: 'pending' as const }
          : action
      )
    );
  }, []);

  // Apply approved actions
  const applyActions = useCallback(async (): Promise<void> => {
    const approvedActions = pendingActions.filter(a => a.status === 'approved');

    if (approvedActions.length === 0) {
      return;
    }

    setIsLoading(true);

    try {
      await onApplyActions(approvedActions);

      // Mark as applied
      setPendingActions(prev =>
        prev.map(action =>
          action.status === 'approved'
            ? { ...action, status: 'applied' as const }
            : action
        )
      );

      // Add confirmation message
      const confirmMsg: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: `✓ Applied ${approvedActions.length} action${approvedActions.length > 1 ? 's' : ''} successfully.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMsg]);

      // Clear pending actions after short delay
      setTimeout(() => {
        setPendingActions([]);
      }, 1000);

    } catch {
      setError('Failed to apply some actions.');

      // Mark as failed
      setPendingActions(prev =>
        prev.map(action =>
          action.status === 'approved'
            ? { ...action, status: 'failed' as const }
            : action
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [pendingActions, onApplyActions]);

  // Update a pending action's payload (for preview event edits)
  const updateActionPayload = useCallback((actionId: string, payload: Partial<CreateEventAction['payload']>) => {
    setPendingActions(prev =>
      prev.map(action => {
        if (action.id === actionId && action.type === 'CREATE_EVENT') {
          return {
            ...action,
            payload: {
              ...action.payload,
              ...payload
            }
          };
        }
        return action;
      })
    );
  }, []);

  // Initialize from sessionStorage on mount
  useState(() => {
    const storedKey = sessionStorage.getItem('ai_api_key');
    if (storedKey) {
      // Validate stored key asynchronously
      validateApiKey(storedKey).then(valid => {
        if (valid) {
          setApiKeyState(storedKey);
          setIsKeyValid(true);
        } else {
          sessionStorage.removeItem('ai_api_key');
        }
      });
    }
  });

  return {
    // State
    apiKey,
    isKeyValid,
    messages,
    isLoading,
    error,
    pendingActions,
    usage,
    // Actions
    setApiKey,
    clearApiKey,
    sendMessage: sendUserMessage,
    clearHistory,
    approveActions,
    rejectActions,
    restoreActions,
    applyActions,
    updateActionPayload
  };
}
