# SRS: AI Integration

## Overview

AI Integration enables users to interact with their timelines using natural language through an AI chat assistant powered by Google Gemini API. Users can create, edit, and delete events, modify sources, update timeline metadata, and ask questions about their timeline through conversational interactions. All AI-proposed changes are reviewed and confirmed by the user before being applied.

**Version:** v0.7.0
**Status:** Implemented
**Last Updated:** 2025-12-27

**Implementation Note:** API key is stored in sessionStorage (persists within the current tab session but not across tabs or after browser closes). This provides a good balance between usability and security.

---

## 1. API Key Management

### 1.1 Storage

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-001 | API key shall be stored in session-only memory (not persisted) | • Key stored in sessionStorage<br>• Cleared when tab closes<br>• Not persisted to disk | `src/hooks/useAISession.ts` | - |
| CC-REQ-AI-002 | API key shall NOT be saved to Firestore | • No Firestore operations for API key<br>• Key never sent to backend | `src/hooks/useAISession.ts` | - |
| CC-REQ-AI-003 | API key shall NOT be saved to localStorage | • localStorage not used for key<br>• Only sessionStorage used | `src/hooks/useAISession.ts` | - |
| CC-REQ-AI-004 | API key shall be cleared when user logs out | • Logout handler clears sessionStorage<br>• No key persists after logout | `src/hooks/useAISession.ts` | - |
| CC-REQ-AI-005 | API key shall be cleared when browser session ends | • sessionStorage auto-clears on tab close<br>• No persistence across sessions | `src/hooks/useAISession.ts` | - |
| CC-REQ-AI-006 | API key shall be stored in sessionStorage or React state | • sessionStorage used for persistence<br>• React state for UI reactivity | `src/hooks/useAISession.ts` | - |

### 1.2 Input & Validation

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-010 | ChatPanel shall display API key input field when key not set | • Input shown when no key present<br>• Clear prompt for user | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-011 | API key input field shall be password-type (obscured) | • Input type="password"<br>• Key characters hidden | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-012 | System shall validate API key format before accepting | • Format validation on input<br>• Prevents obviously invalid keys | `src/services/aiService.ts` | - |
| CC-REQ-AI-013 | System shall test API key with sample call to verify validity | • Test call made on key submission<br>• Validates key actually works | `src/services/aiService.ts` | - |
| CC-REQ-AI-014 | Invalid API key shall show error message to user | • Error displayed on validation failure<br>• Clear message about what went wrong | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-015 | User shall be able to update API key during session | • Key can be changed after initial set<br>• UI provides update mechanism | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-016 | API key input shall display link to ai.google.dev for key creation | • Help link visible<br>• Opens ai.google.dev in new tab | `src/app/panels/ChatPanel.tsx` | - |

---

## 2. Chat Interface

### 2.1 ChatPanel Component

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-020 | ChatPanel shall be accessible from right sidebar | • Panel available in right nav<br>• Clear chat icon/button | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-021 | ChatPanel shall display conversation history (session-only) | • All messages displayed in order<br>• History cleared on tab close | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-022 | ChatPanel shall differentiate user messages from assistant messages | • Visual distinction between roles<br>• Clear who said what | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-023 | User messages shall display with distinct styling (e.g., right-aligned, blue) | • User messages styled differently<br>• Consistent theme colors | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-024 | Assistant messages shall display with distinct styling (e.g., left-aligned, gray) | • Assistant messages styled differently<br>• Consistent theme colors | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-025 | ChatPanel shall scroll to latest message automatically | • Auto-scroll on new message<br>• Smooth scroll behavior | `src/app/panels/ChatPanel.tsx` | - |

### 2.2 Message Input

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-030 | Input field shall be fixed at bottom of ChatPanel | • Input always visible at bottom<br>• Doesn't scroll with messages | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-031 | Input field shall support multiline text entry | • Textarea component used<br>• Text wraps correctly | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-032 | Send button shall be enabled only when input is non-empty | • Button disabled for empty input<br>• Enabled when text present | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-033 | Pressing Enter (without Shift) shall send message | • Enter sends message<br>• Message input cleared after send | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-034 | Shift+Enter shall insert newline in message | • Shift+Enter creates newline<br>• Does not send message | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-035 | Input field shall be disabled while AI is processing | • Input disabled during API call<br>• Re-enabled after response | `src/app/panels/ChatPanel.tsx` | - |

### 2.3 Conversation State

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-040 | System shall display loading indicator while AI generates response | • Loading indicator shown<br>• Clear AI is thinking | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-041 | System shall support streaming responses (display tokens as received) | • Tokens displayed as they arrive<br>• Real-time response rendering | `src/services/aiService.ts` | - |
| CC-REQ-AI-042 | User shall be able to clear conversation history | • Clear button available<br>• History removed on click | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-043 | Clear conversation button shall show confirmation dialog | • Confirmation dialog shown<br>• Prevents accidental clear | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-044 | Conversation history shall be cleared when switching timelines | • History specific to timeline<br>• Auto-clear on timeline change | `src/hooks/useAISession.ts` | - |
| CC-REQ-AI-045 | ChatPanel shall display welcome message when conversation is empty | • Welcome message shown initially<br>• Helpful onboarding text | `src/app/panels/ChatPanel.tsx` | - |

---

## 3. AI Action Protocol

### 3.1 Action Types

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-050 | System shall support CREATE_EVENT action type | • Action type defined<br>• Handler implemented | `src/types/ai.ts` | - |
| CC-REQ-AI-051 | System shall support UPDATE_EVENT action type | • Action type defined<br>• Handler implemented | `src/types/ai.ts` | - |
| CC-REQ-AI-052 | System shall support DELETE_EVENT action type | • Action type defined<br>• Handler implemented | `src/types/ai.ts` | - |
| CC-REQ-AI-053 | System shall support UPDATE_SOURCES action type | • Action type defined<br>• Handler implemented | `src/types/ai.ts` | - |
| CC-REQ-AI-054 | System shall support UPDATE_METADATA action type | • Action type defined<br>• Handler implemented | `src/types/ai.ts` | - |
| CC-REQ-AI-055 | System shall support INFO_RESPONSE action type (no changes) | • Action type defined<br>• No mutations on timeline | `src/types/ai.ts` | - |
| CC-REQ-AI-056 | System shall support batch actions (multiple actions in one response) | • Multiple actions in array<br>• All executed atomically | `src/types/ai.ts` | - |

### 3.2 Function Calling Schema

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-060 | AI shall use Gemini function calling to return structured actions | • Function declarations defined<br>• Gemini API configured | `src/services/aiService.ts` | - |
| CC-REQ-AI-061 | CREATE_EVENT shall include: date, title, description?, endDate?, time?, sources? | • Schema includes all fields<br>• Required fields validated | `src/types/ai.ts` | - |
| CC-REQ-AI-062 | UPDATE_EVENT shall include: eventId, fields to update | • Schema includes eventId<br>• Partial update supported | `src/types/ai.ts` | - |
| CC-REQ-AI-063 | DELETE_EVENT shall include: eventId | • Schema includes eventId<br>• Single field required | `src/types/ai.ts` | - |
| CC-REQ-AI-064 | UPDATE_SOURCES shall include: eventId, sources array | • Schema includes both fields<br>• Array type validated | `src/types/ai.ts` | - |
| CC-REQ-AI-065 | UPDATE_METADATA shall include: fields to update (title, description, tags) | • Schema includes metadata fields<br>• Partial update supported | `src/types/ai.ts` | - |
| CC-REQ-AI-066 | INFO_RESPONSE shall include: text response only (no modifications) | • Schema includes text field<br>• No timeline mutations | `src/types/ai.ts` | - |

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

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-100 | System shall include timeline metadata in AI context | • Metadata passed to AI<br>• Included in every request | `src/services/aiService.ts` | - |
| CC-REQ-AI-101 | Timeline metadata shall include: title, description, tags | • All three fields included<br>• Structured format | `src/services/aiService.ts` | - |
| CC-REQ-AI-102 | System shall include currently visible events in AI context | • Visible events identified<br>• Passed to AI | `src/services/aiService.ts` | - |
| CC-REQ-AI-103 | Visible events shall be determined by current viewport position | • Viewport calculation logic<br>• Events within view included | `src/services/aiService.ts` | - |
| CC-REQ-AI-104 | System shall include selected event details if event is selected | • Selected event detected<br>• Full details included | `src/services/aiService.ts` | - |
| CC-REQ-AI-105 | Selected event shall include: all fields + sources | • All event fields present<br>• Sources array included | `src/services/aiService.ts` | - |

### 4.2 Conversation Context

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-110 | System shall include last 5 conversation turns in AI context | • Last 5 turns tracked<br>• Included in API calls | `src/hooks/useAISession.ts` | - |
| CC-REQ-AI-111 | Conversation turn shall include: user message + assistant response | • Both roles included<br>• Complete conversation flow | `src/hooks/useAISession.ts` | - |
| CC-REQ-AI-112 | Older messages beyond last 5 shall be truncated from context | • Only recent messages sent<br>• Memory management | `src/hooks/useAISession.ts` | - |
| CC-REQ-AI-113 | System shall manage token budget to stay within Gemini limits | • Token counting logic<br>• Stays under API limits | `src/services/aiService.ts` | - |
| CC-REQ-AI-114 | If context exceeds token limit, system shall prioritize: metadata > selected event > visible events > history | • Priority order enforced<br>• Graceful truncation | `src/services/aiService.ts` | - |
| CC-REQ-AI-115 | System shall display warning if context is truncated | • Warning shown to user<br>• Clear message about truncation | `src/app/panels/ChatPanel.tsx` | - |

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

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-120 | System shall display confirmation overlay before applying AI actions | • Overlay shown for all actions<br>• User must confirm | `src/app/overlays/ActionConfirmationOverlay.tsx` | - |
| CC-REQ-AI-121 | Confirmation overlay shall show all proposed changes | • All actions listed<br>• Clear description of changes | `src/app/overlays/ActionConfirmationOverlay.tsx` | - |
| CC-REQ-AI-122 | INFO_RESPONSE actions shall not require confirmation | • Info responses skip overlay<br>• Directly displayed in chat | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-123 | Overlay shall have "Apply" button to execute actions | • Apply button present<br>• Executes on click | `src/app/overlays/ActionConfirmationOverlay.tsx` | - |
| CC-REQ-AI-124 | Overlay shall have "Cancel" button to reject actions | • Cancel button present<br>• Closes overlay, no changes | `src/app/overlays/ActionConfirmationOverlay.tsx` | - |
| CC-REQ-AI-125 | Pressing Escape key shall cancel and close overlay | • Escape key listener active<br>• Same as Cancel button | `src/app/overlays/ActionConfirmationOverlay.tsx` | - |

### 5.2 Change Visualization

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-130 | CREATE_EVENT shall display new event fields in confirmation | • All new event fields shown<br>• Clear "New Event" indicator | `src/app/overlays/ActionConfirmationOverlay.tsx` | - |
| CC-REQ-AI-131 | UPDATE_EVENT shall display before/after values for changed fields | • Before/after comparison shown<br>• Only changed fields highlighted | `src/app/overlays/ActionConfirmationOverlay.tsx` | - |
| CC-REQ-AI-132 | DELETE_EVENT shall display event being deleted with warning | • Event details shown<br>• Warning about deletion | `src/app/overlays/ActionConfirmationOverlay.tsx` | - |
| CC-REQ-AI-133 | UPDATE_SOURCES shall display old/new source lists | • Old and new sources compared<br>• Clear diff visualization | `src/app/overlays/ActionConfirmationOverlay.tsx` | - |
| CC-REQ-AI-134 | UPDATE_METADATA shall display old/new metadata values | • Metadata before/after shown<br>• Clear comparison | `src/app/overlays/ActionConfirmationOverlay.tsx` | - |
| CC-REQ-AI-135 | Batch actions shall display all actions in single confirmation overlay | • All actions listed together<br>• Single confirm for batch | `src/app/overlays/ActionConfirmationOverlay.tsx` | - |

---

## 6. Action Execution

### 6.1 Event Actions

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-140 | CREATE_EVENT shall add new event to timeline | • Event added to timeline array<br>• Displayed in UI | `src/App.tsx` | - |
| CC-REQ-AI-141 | CREATE_EVENT shall validate required fields (date, title) | • Validation before creation<br>• Error if fields missing | `src/App.tsx` | - |
| CC-REQ-AI-142 | UPDATE_EVENT shall modify existing event by ID | • Event found by ID<br>• Fields updated | `src/App.tsx` | - |
| CC-REQ-AI-143 | UPDATE_EVENT shall validate event exists before updating | • Check event exists<br>• Error if not found | `src/App.tsx` | - |
| CC-REQ-AI-144 | DELETE_EVENT shall remove event from timeline | • Event removed from array<br>• UI updated | `src/App.tsx` | - |
| CC-REQ-AI-145 | DELETE_EVENT shall validate event exists before deleting | • Check event exists<br>• Error if not found | `src/App.tsx` | - |
| CC-REQ-AI-146 | UPDATE_SOURCES shall update event sources array | • Sources array updated<br>• Changes persisted | `src/App.tsx` | - |
| CC-REQ-AI-147 | UPDATE_SOURCES shall validate event exists | • Check event exists<br>• Error if not found | `src/App.tsx` | - |

### 6.2 Metadata Actions

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-150 | UPDATE_METADATA shall modify timeline title/description/tags | • Metadata fields updated<br>• Changes saved | `src/App.tsx` | - |
| CC-REQ-AI-151 | UPDATE_METADATA shall validate at least one field is updated | • Validation logic present<br>• Error if no fields | `src/App.tsx` | - |

### 6.3 Validation & Error Handling

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-155 | System shall validate date format before creating/updating events | • Date format validation<br>• Rejects invalid dates | `src/App.tsx` | - |
| CC-REQ-AI-156 | System shall reject actions with invalid data | • Validation for all fields<br>• Clear rejection | `src/App.tsx` | - |
| CC-REQ-AI-157 | System shall display validation error messages to user | • Error messages shown in chat<br>• Clear what went wrong | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-158 | Failed actions shall not modify timeline state | • State unchanged on error<br>• Rollback if needed | `src/App.tsx` | - |
| CC-REQ-AI-159 | System shall save timeline to Firestore after successful actions | • Firestore save called<br>• Changes persisted | `src/services/firestore.ts` | - |
| CC-REQ-AI-160 | System shall add assistant confirmation message after applying actions | • Confirmation message shown<br>• User knows action succeeded | `src/app/panels/ChatPanel.tsx` | - |

---

## 7. Error Handling

### 7.1 API Errors

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-170 | System shall detect invalid API key errors | • API error caught<br>• Error type identified | `src/services/aiService.ts` | - |
| CC-REQ-AI-171 | Invalid API key error shall prompt user to re-enter key | • Key cleared on error<br>• Input shown again | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-172 | System shall detect rate limit exceeded errors | • Rate limit error caught<br>• Specific error type | `src/services/aiService.ts` | - |
| CC-REQ-AI-173 | Rate limit error shall display user-friendly message with retry suggestion | • Clear error message<br>• Suggests waiting/retrying | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-174 | System shall detect network errors | • Network failure caught<br>• Timeout detected | `src/services/aiService.ts` | - |
| CC-REQ-AI-175 | Network error shall display offline/connectivity message | • Clear error message<br>• Suggests checking connection | `src/app/panels/ChatPanel.tsx` | - |

### 7.2 Response Validation

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-180 | System shall validate AI response matches expected schema | • Schema validation logic<br>• Type checking | `src/services/aiService.ts` | - |
| CC-REQ-AI-181 | Invalid response shall display error message without crashing | • Error caught gracefully<br>• App remains functional | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-182 | System shall log invalid responses for debugging | • Console logging<br>• Error details captured | `src/services/aiService.ts` | - |
| CC-REQ-AI-183 | Malformed action shall be rejected with user-friendly error | • Clear error message<br>• Action not executed | `src/app/panels/ChatPanel.tsx` | - |

### 7.3 User Feedback

| ID | Requirement | Acceptance Criteria | Code | Tests |
|----|-------------|---------------------|------|-------|
| CC-REQ-AI-184 | All errors shall display in ChatPanel as error messages | • Errors shown in chat<br>• Consistent styling | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-185 | Error messages shall be clear and actionable | • Plain language<br>• Suggests next steps | `src/app/panels/ChatPanel.tsx` | - |
| CC-REQ-AI-186 | System shall allow user to retry after error | • Retry mechanism available<br>• Can send new message | `src/app/panels/ChatPanel.tsx` | - |

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
