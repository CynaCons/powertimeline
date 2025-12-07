# SRS: AI Integration

## Overview

AI Integration enables users to interact with their timelines using natural language through an AI chat assistant powered by Google Gemini API. Users can create, edit, and delete events, modify sources, update timeline metadata, and ask questions about their timeline through conversational interactions. All AI-proposed changes are reviewed and confirmed by the user before being applied.

**Version:** v0.7.0
**Status:** Planned

---

## 1. API Key Management

### 1.1 Storage

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-001 | API key shall be stored in session-only memory (not persisted) | Must |
| CC-REQ-AI-002 | API key shall NOT be saved to Firestore | Must |
| CC-REQ-AI-003 | API key shall NOT be saved to localStorage | Must |
| CC-REQ-AI-004 | API key shall be cleared when user logs out | Must |
| CC-REQ-AI-005 | API key shall be cleared when browser session ends | Must |
| CC-REQ-AI-006 | API key shall be stored in sessionStorage or React state | Should |

### 1.2 Input & Validation

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-010 | ChatPanel shall display API key input field when key not set | Must |
| CC-REQ-AI-011 | API key input field shall be password-type (obscured) | Must |
| CC-REQ-AI-012 | System shall validate API key format before accepting | Should |
| CC-REQ-AI-013 | System shall test API key with sample call to verify validity | Should |
| CC-REQ-AI-014 | Invalid API key shall show error message to user | Must |
| CC-REQ-AI-015 | User shall be able to update API key during session | Should |
| CC-REQ-AI-016 | API key input shall display link to ai.google.dev for key creation | Should |

---

## 2. Chat Interface

### 2.1 ChatPanel Component

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-020 | ChatPanel shall be accessible from right sidebar | Must |
| CC-REQ-AI-021 | ChatPanel shall display conversation history (session-only) | Must |
| CC-REQ-AI-022 | ChatPanel shall differentiate user messages from assistant messages | Must |
| CC-REQ-AI-023 | User messages shall display with distinct styling (e.g., right-aligned, blue) | Should |
| CC-REQ-AI-024 | Assistant messages shall display with distinct styling (e.g., left-aligned, gray) | Should |
| CC-REQ-AI-025 | ChatPanel shall scroll to latest message automatically | Should |

### 2.2 Message Input

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-030 | Input field shall be fixed at bottom of ChatPanel | Must |
| CC-REQ-AI-031 | Input field shall support multiline text entry | Should |
| CC-REQ-AI-032 | Send button shall be enabled only when input is non-empty | Must |
| CC-REQ-AI-033 | Pressing Enter (without Shift) shall send message | Should |
| CC-REQ-AI-034 | Shift+Enter shall insert newline in message | Should |
| CC-REQ-AI-035 | Input field shall be disabled while AI is processing | Must |

### 2.3 Conversation State

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-040 | System shall display loading indicator while AI generates response | Must |
| CC-REQ-AI-041 | System shall support streaming responses (display tokens as received) | Could |
| CC-REQ-AI-042 | User shall be able to clear conversation history | Should |
| CC-REQ-AI-043 | Clear conversation button shall show confirmation dialog | Should |
| CC-REQ-AI-044 | Conversation history shall be cleared when switching timelines | Must |
| CC-REQ-AI-045 | ChatPanel shall display welcome message when conversation is empty | Should |

---

## 3. AI Action Protocol

### 3.1 Action Types

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-050 | System shall support CREATE_EVENT action type | Must |
| CC-REQ-AI-051 | System shall support UPDATE_EVENT action type | Must |
| CC-REQ-AI-052 | System shall support DELETE_EVENT action type | Must |
| CC-REQ-AI-053 | System shall support UPDATE_SOURCES action type | Must |
| CC-REQ-AI-054 | System shall support UPDATE_METADATA action type | Must |
| CC-REQ-AI-055 | System shall support INFO_RESPONSE action type (no changes) | Must |
| CC-REQ-AI-056 | System shall support batch actions (multiple actions in one response) | Should |

### 3.2 Function Calling Schema

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-060 | AI shall use Gemini function calling to return structured actions | Must |
| CC-REQ-AI-061 | CREATE_EVENT shall include: date, title, description?, endDate?, time?, sources? | Must |
| CC-REQ-AI-062 | UPDATE_EVENT shall include: eventId, fields to update | Must |
| CC-REQ-AI-063 | DELETE_EVENT shall include: eventId | Must |
| CC-REQ-AI-064 | UPDATE_SOURCES shall include: eventId, sources array | Must |
| CC-REQ-AI-065 | UPDATE_METADATA shall include: fields to update (title, description, tags) | Must |
| CC-REQ-AI-066 | INFO_RESPONSE shall include: text response only (no modifications) | Must |

**Type Definitions:**
```typescript
export type AIActionType =
  | 'CREATE_EVENT'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'UPDATE_SOURCES'
  | 'UPDATE_METADATA'
  | 'INFO_RESPONSE';

export interface CreateEventAction {
  type: 'CREATE_EVENT';
  event: {
    date: string;
    title: string;
    description?: string;
    endDate?: string;
    time?: string;
    sources?: string[];
  };
}

export interface UpdateEventAction {
  type: 'UPDATE_EVENT';
  eventId: string;
  updates: Partial<{
    date: string;
    title: string;
    description: string;
    endDate: string;
    time: string;
  }>;
}

export interface DeleteEventAction {
  type: 'DELETE_EVENT';
  eventId: string;
}

export interface UpdateSourcesAction {
  type: 'UPDATE_SOURCES';
  eventId: string;
  sources: string[];
}

export interface UpdateMetadataAction {
  type: 'UPDATE_METADATA';
  updates: Partial<{
    title: string;
    description: string;
    tags: string[];
  }>;
}

export interface InfoResponseAction {
  type: 'INFO_RESPONSE';
  text: string;
}

export type AIAction =
  | CreateEventAction
  | UpdateEventAction
  | DeleteEventAction
  | UpdateSourcesAction
  | UpdateMetadataAction
  | InfoResponseAction;

export interface AIResponse {
  actions: AIAction[];
  message?: string; // Optional explanatory message
}
```

**Gemini Function Schema:**
```typescript
const functionDeclaration = {
  name: "executeTimelineActions",
  description: "Execute one or more actions on the timeline",
  parameters: {
    type: "object",
    properties: {
      actions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["CREATE_EVENT", "UPDATE_EVENT", "DELETE_EVENT",
                     "UPDATE_SOURCES", "UPDATE_METADATA", "INFO_RESPONSE"]
            },
            // ... action-specific fields
          }
        }
      },
      message: {
        type: "string",
        description: "Optional explanation of actions"
      }
    },
    required: ["actions"]
  }
};
```

---

## 4. Context Management

### 4.1 Timeline Context

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-100 | System shall include timeline metadata in AI context | Must |
| CC-REQ-AI-101 | Timeline metadata shall include: title, description, tags | Must |
| CC-REQ-AI-102 | System shall include currently visible events in AI context | Must |
| CC-REQ-AI-103 | Visible events shall be determined by current viewport position | Should |
| CC-REQ-AI-104 | System shall include selected event details if event is selected | Must |
| CC-REQ-AI-105 | Selected event shall include: all fields + sources | Must |

### 4.2 Conversation Context

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-110 | System shall include last 5 conversation turns in AI context | Must |
| CC-REQ-AI-111 | Conversation turn shall include: user message + assistant response | Must |
| CC-REQ-AI-112 | Older messages beyond last 5 shall be truncated from context | Must |
| CC-REQ-AI-113 | System shall manage token budget to stay within Gemini limits | Must |
| CC-REQ-AI-114 | If context exceeds token limit, system shall prioritize: metadata > selected event > visible events > history | Should |
| CC-REQ-AI-115 | System shall display warning if context is truncated | Could |

**Context Structure:**
```typescript
interface AIContext {
  timeline: {
    title: string;
    description?: string;
    tags?: string[];
  };
  visibleEvents: Array<{
    id: string;
    date: string;
    title: string;
    description?: string;
    endDate?: string;
    time?: string;
  }>;
  selectedEvent?: {
    id: string;
    date: string;
    title: string;
    description?: string;
    endDate?: string;
    time?: string;
    sources?: string[];
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

---

## 5. Action Confirmation

### 5.1 ActionConfirmationOverlay

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-120 | System shall display confirmation overlay before applying AI actions | Must |
| CC-REQ-AI-121 | Confirmation overlay shall show all proposed changes | Must |
| CC-REQ-AI-122 | INFO_RESPONSE actions shall not require confirmation | Must |
| CC-REQ-AI-123 | Overlay shall have "Apply" button to execute actions | Must |
| CC-REQ-AI-124 | Overlay shall have "Cancel" button to reject actions | Must |
| CC-REQ-AI-125 | Pressing Escape key shall cancel and close overlay | Should |

### 5.2 Change Visualization

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-130 | CREATE_EVENT shall display new event fields in confirmation | Must |
| CC-REQ-AI-131 | UPDATE_EVENT shall display before/after values for changed fields | Must |
| CC-REQ-AI-132 | DELETE_EVENT shall display event being deleted with warning | Must |
| CC-REQ-AI-133 | UPDATE_SOURCES shall display old/new source lists | Must |
| CC-REQ-AI-134 | UPDATE_METADATA shall display old/new metadata values | Must |
| CC-REQ-AI-135 | Batch actions shall display all actions in single confirmation overlay | Must |

---

## 6. Action Execution

### 6.1 Event Actions

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-140 | CREATE_EVENT shall add new event to timeline | Must |
| CC-REQ-AI-141 | CREATE_EVENT shall validate required fields (date, title) | Must |
| CC-REQ-AI-142 | UPDATE_EVENT shall modify existing event by ID | Must |
| CC-REQ-AI-143 | UPDATE_EVENT shall validate event exists before updating | Must |
| CC-REQ-AI-144 | DELETE_EVENT shall remove event from timeline | Must |
| CC-REQ-AI-145 | DELETE_EVENT shall validate event exists before deleting | Must |
| CC-REQ-AI-146 | UPDATE_SOURCES shall update event sources array | Must |
| CC-REQ-AI-147 | UPDATE_SOURCES shall validate event exists | Must |

### 6.2 Metadata Actions

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-150 | UPDATE_METADATA shall modify timeline title/description/tags | Must |
| CC-REQ-AI-151 | UPDATE_METADATA shall validate at least one field is updated | Must |

### 6.3 Validation & Error Handling

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-155 | System shall validate date format before creating/updating events | Must |
| CC-REQ-AI-156 | System shall reject actions with invalid data | Must |
| CC-REQ-AI-157 | System shall display validation error messages to user | Must |
| CC-REQ-AI-158 | Failed actions shall not modify timeline state | Must |
| CC-REQ-AI-159 | System shall save timeline to Firestore after successful actions | Must |
| CC-REQ-AI-160 | System shall add assistant confirmation message after applying actions | Should |

---

## 7. Error Handling

### 7.1 API Errors

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-170 | System shall detect invalid API key errors | Must |
| CC-REQ-AI-171 | Invalid API key error shall prompt user to re-enter key | Must |
| CC-REQ-AI-172 | System shall detect rate limit exceeded errors | Must |
| CC-REQ-AI-173 | Rate limit error shall display user-friendly message with retry suggestion | Must |
| CC-REQ-AI-174 | System shall detect network errors | Must |
| CC-REQ-AI-175 | Network error shall display offline/connectivity message | Must |

### 7.2 Response Validation

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-180 | System shall validate AI response matches expected schema | Must |
| CC-REQ-AI-181 | Invalid response shall display error message without crashing | Must |
| CC-REQ-AI-182 | System shall log invalid responses for debugging | Should |
| CC-REQ-AI-183 | Malformed action shall be rejected with user-friendly error | Must |

### 7.3 User Feedback

| ID | Requirement | Priority |
|----|-------------|----------|
| CC-REQ-AI-184 | All errors shall display in ChatPanel as error messages | Must |
| CC-REQ-AI-185 | Error messages shall be clear and actionable | Must |
| CC-REQ-AI-186 | System shall allow user to retry after error | Should |

---

## 8. NOT in Scope

The following features are explicitly excluded from v0.7.0:

- Image/file uploads or attachments
- Voice input or speech-to-text
- Multi-provider support (OpenAI, Claude, etc.) - future enhancement
- API key persistence to Firestore or localStorage
- Sharing or exporting conversation history
- AI-generated images or visualizations
- Undo/redo for AI actions (use standard timeline undo)
- Real-time collaborative AI sessions
- Custom AI instructions or system prompts (user-configurable)
- Training or fine-tuning on user data

---

## Requirements Summary

| Category | Count |
|----------|-------|
| API Key Management | 16 |
| Chat Interface | 26 |
| AI Action Protocol | 17 |
| Context Management | 16 |
| Action Confirmation | 16 |
| Action Execution | 17 |
| Error Handling | 17 |
| **Total** | **125** |

---

## Test Coverage

| Requirement Group | Test File | Coverage |
|-------------------|-----------|----------|
| API Key Management | tests/ai/api-key-management.spec.ts | Planned |
| Chat Interface | tests/ai/chat-interface.spec.ts | Planned |
| AI Action Protocol | tests/ai/action-protocol.spec.ts | Planned |
| Context Management | tests/ai/context-management.spec.ts | Planned |
| Action Confirmation | tests/ai/action-confirmation.spec.ts | Planned |
| Action Execution | tests/ai/action-execution.spec.ts | Planned |
| Error Handling | tests/ai/error-handling.spec.ts | Planned |

---

## Implementation Files

| Component | File | Purpose |
|-----------|------|---------|
| AI Types | `src/types/ai.ts` | Type definitions for actions, context, responses |
| AI Service | `src/services/aiService.ts` | Gemini API wrapper and request handling |
| AI Session Hook | `src/hooks/useAISession.ts` | Session management, API key, conversation state |
| Chat Panel | `src/app/panels/ChatPanel.tsx` | Main chat UI component |
| Chat Message | `src/app/components/ChatMessage.tsx` | Individual message bubble component |
| Action Confirmation | `src/app/overlays/ActionConfirmationOverlay.tsx` | Confirmation dialog for AI actions |
| Context Builder | `src/lib/aiContextBuilder.ts` | Build context from timeline + conversation |
| Action Handlers | `src/lib/aiActionHandlers.ts` | Execute AI actions on timeline |
| Action Validators | `src/lib/aiActionValidators.ts` | Validate actions before execution |
| Gemini Config | `src/config/gemini.ts` | Function declarations and API configuration |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-07 | Initial specification |
