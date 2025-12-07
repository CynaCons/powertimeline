/**
 * AI Integration Types
 * v0.7.0 - Type definitions for AI chat feature
 */

// ============================================================================
// Message Types
// ============================================================================

export type AIMessageRole = 'user' | 'assistant' | 'system';

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: Date;
  actions?: AIAction[];  // Actions proposed by assistant
  error?: string;        // Error message if failed
}

// ============================================================================
// Action Types
// ============================================================================

export type AIActionType =
  | 'CREATE_EVENT'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'UPDATE_SOURCES'
  | 'UPDATE_METADATA'
  | 'INFO_RESPONSE';

export type AIActionStatus = 'pending' | 'approved' | 'rejected' | 'applied' | 'failed';

export interface AIActionBase {
  id: string;
  type: AIActionType;
  status: AIActionStatus;
  description: string;  // Human-readable description of what this action does
}

export interface CreateEventAction extends AIActionBase {
  type: 'CREATE_EVENT';
  payload: {
    title: string;
    date: string;        // ISO date string
    description?: string;
    endDate?: string;
    time?: string;
    sources?: string[];
  };
}

export interface UpdateEventAction extends AIActionBase {
  type: 'UPDATE_EVENT';
  payload: {
    eventId: string;
    changes: {
      title?: string;
      date?: string;
      description?: string;
      endDate?: string;
      time?: string;
      sources?: string[];
    };
  };
}

export interface DeleteEventAction extends AIActionBase {
  type: 'DELETE_EVENT';
  payload: {
    eventId: string;
    eventTitle: string;  // For confirmation display
  };
}

export interface UpdateSourcesAction extends AIActionBase {
  type: 'UPDATE_SOURCES';
  payload: {
    eventId: string;
    sources: string[];   // Full replacement
  };
}

export interface UpdateMetadataAction extends AIActionBase {
  type: 'UPDATE_METADATA';
  payload: {
    changes: {
      title?: string;
      description?: string;
    };
  };
}

export interface InfoResponseAction extends AIActionBase {
  type: 'INFO_RESPONSE';
  payload: {
    message: string;  // Just informational, no changes
  };
}

export type AIAction =
  | CreateEventAction
  | UpdateEventAction
  | DeleteEventAction
  | UpdateSourcesAction
  | UpdateMetadataAction
  | InfoResponseAction;

// ============================================================================
// Session Types
// ============================================================================

export interface AIUsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  requestCount: number;
}

export interface AISession {
  apiKey: string | null;
  isKeyValid: boolean;
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  pendingActions: AIAction[];
  usage: AIUsageStats;
}

export interface AISessionActions {
  setApiKey: (key: string) => Promise<boolean>;  // Returns true if valid
  clearApiKey: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  approveActions: (actionIds: string[]) => void;
  rejectActions: (actionIds: string[]) => void;
  restoreActions: (actionIds: string[]) => void;
  applyActions: () => Promise<void>;
  updateActionPayload: (actionId: string, payload: Partial<CreateEventAction['payload']>) => void;
}

// ============================================================================
// Context Types (what we send to AI)
// ============================================================================

export interface AIContext {
  timeline: {
    id: string;
    title: string;
    description?: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  visibleEvents: Array<{
    id: string;
    title: string;
    date: string;
    description?: string;
    sources?: string[];
  }>;
  selectedEvent?: {
    id: string;
    title: string;
    date: string;
    description?: string;
    sources?: string[];
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// ============================================================================
// Gemini API Types
// ============================================================================

export interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

// Grounding metadata from Google Search
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  webSearchQueries?: string[];
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        functionCall?: GeminiFunctionCall;
      }>;
    };
    finishReason: string;
    groundingMetadata?: GroundingMetadata;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required?: string[];
  };
}

// ============================================================================
// Error Types
// ============================================================================

export type AIErrorCode =
  | 'INVALID_API_KEY'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'ACTION_FAILED'
  | 'CONTEXT_TOO_LARGE';

export interface AIError {
  code: AIErrorCode;
  message: string;
  details?: string;
  retryable: boolean;
}
