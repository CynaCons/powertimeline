# API Key Storage Requirements

**Status:** Proposed (Not Yet Implemented)
**Version:** v0.8.x
**Last Updated:** 2025-12-27

This document specifies requirements for storing and managing user-provided API keys for AI integration features. The system prioritizes user security and transparency while providing convenience options.

## Overview

**NOTE: This is a DESIGN PROPOSAL for future implementation. Current implementation (v0.8.x) uses sessionStorage only with no persistence options.**

PowerTimeline's AI features require API keys from external providers (currently Gemini). The proposed storage system provides:
- **Session-only storage**: Default secure mode where keys are never persisted (CURRENTLY IMPLEMENTED)
- **Optional local storage**: User opt-in to remember keys on their device (PROPOSED, not yet implemented)
- **Transparency**: Clear communication about where keys are stored
- **Settings integration**: Key management in the Settings page (PROPOSED, not yet implemented)

## Design Principles

1. **User controls their key** - Never store on PowerTimeline servers without explicit consent
2. **Transparency** - Make it clear where the key is stored and how it's used
3. **Verifiable** - Users can inspect Network tab to confirm direct API calls
4. **Progressive trust** - Default to safest option, allow opt-in to convenience features

## Requirement Table

### Storage Modes

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-APIKEY-001 | Default storage mode is session-only | - API key stored in React state only by default<br>- Key cleared when browser tab/window closes<br>- No localStorage or Firestore persistence without user consent<br>- Works immediately after user enters key | TBD | TBD |
| CC-REQ-APIKEY-002 | User can opt-in to persistent local storage | - "Remember on this device" checkbox below API key input<br>- Checkbox unchecked by default<br>- When checked, key stored in localStorage<br>- Key persists across browser sessions | TBD | TBD |
| CC-REQ-APIKEY-003 | Persistent key loaded on session start | - On component mount, check localStorage for saved key<br>- If found, populate API key field and enable AI features<br>- Checkbox reflects current storage state<br>- User can still change or clear the key | TBD | TBD |

### Security and Trust

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-APIKEY-010 | API key never sent to PowerTimeline servers | - All AI API calls go directly from browser to provider (e.g., generativelanguage.googleapis.com)<br>- No proxy through PowerTimeline backend<br>- Key not included in any analytics or logging<br>- Verifiable via browser Network tab | TBD | TBD |
| CC-REQ-APIKEY-011 | Trust disclaimer displayed to user | - Text displayed below API key input explaining storage model<br>- Text states: "Your API key is stored locally in your browser only"<br>- Text states: "It is never sent to PowerTimeline servers"<br>- Text states: "API calls go directly from your browser to Google" | TBD | TBD |
| CC-REQ-APIKEY-012 | localStorage key uses namespaced identifier | - Key stored as `powertimeline_gemini_api_key`<br>- Namespace prevents collisions with other apps<br>- Key name does not reveal sensitive information | TBD | TBD |

### ChatPanel Integration

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-APIKEY-020 | ChatPanel displays API key input with checkbox | - Text input for API key (type="password")<br>- "Remember on this device" checkbox below input<br>- Trust disclaimer text below checkbox<br>- Input and checkbox styled consistently with app theme | TBD | TBD |
| CC-REQ-APIKEY-021 | Checkbox state syncs with storage mode | - If key exists in localStorage, checkbox is checked on load<br>- Checking box saves current key to localStorage<br>- Unchecking box removes key from localStorage (keeps in session)<br>- State changes take effect immediately | TBD | TBD |
| CC-REQ-APIKEY-022 | Key input shows masked value for saved keys | - Saved keys displayed as masked (dots/asterisks)<br>- User can reveal key with show/hide toggle<br>- User can clear and enter new key<br>- Empty state shows placeholder text | TBD | TBD |

### Settings Page Integration

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-APIKEY-030 | Settings page has AI Integration section | - Section titled "AI Integration"<br>- Appears in Settings page below existing sections<br>- Visible to all authenticated users | TBD | TBD |
| CC-REQ-APIKEY-031 | Settings displays current API key status | - Shows "Connected" if key is present (session or stored)<br>- Shows "Not configured" if no key<br>- Shows storage location: "Stored locally on this device" or "Session only"<br>- Does not display actual key value | TBD | TBD |
| CC-REQ-APIKEY-032 | Settings provides clear stored key action | - "Clear stored key" button when key exists in localStorage<br>- Button removes key from localStorage<br>- Button clears current session key<br>- Confirmation not required (reversible action)<br>- Toast notification confirms key cleared | TBD | TBD |
| CC-REQ-APIKEY-033 | Settings allows entering new API key | - Input field to enter/update API key<br>- Same checkbox and disclaimer as ChatPanel<br>- Save button to confirm changes<br>- Validates key format before saving | TBD | TBD |

## UI Specifications

### ChatPanel API Key Input

```
+------------------------------------------+
| Gemini API Key                           |
| [********************************] [Show]|
|                                          |
| [ ] Remember on this device              |
|                                          |
| Your API key is stored locally in your   |
| browser only. It is never sent to        |
| PowerTimeline servers. API calls go      |
| directly from your browser to Google.    |
+------------------------------------------+
```

### Settings Page AI Integration Section

```
AI Integration
--------------
Status: Connected
Storage: Locally on this device

API Key: [••••••••••••••••••••] [Show]

[ ] Remember on this device

[Clear stored key]

---
Your API key is stored locally in your browser
only. It is never sent to PowerTimeline servers.
```

## Future Considerations

### Premium Tier: Managed API (Not in Scope)

For future premium subscription model:
- User subscribes to PowerTimeline premium
- PowerTimeline provides API access using pooled keys
- Usage metered and limited per subscription tier
- No API key entry required from user
- Requires Cloud Function proxy for AI requests

This is documented for future reference but not part of v0.8.x implementation.

## Security Considerations

### Why Not Firestore Storage

Storing API keys in Firestore (even encrypted) creates trust issues:
- Key exists on PowerTimeline-controlled infrastructure
- Users must trust we don't access/misuse their keys
- Encryption key management adds complexity
- Security breach could expose all user keys

### Why localStorage is Acceptable

- Key never leaves user's device
- Same security model as browser password managers
- User has full control (can clear anytime)
- No server-side exposure risk
- Standard practice for BYOK (Bring Your Own Key) apps

### Trust Verification Steps

Users can verify the security model:
1. Open browser DevTools > Network tab
2. Use AI chat feature
3. Observe requests go to `generativelanguage.googleapis.com`
4. Confirm no requests to PowerTimeline domains contain the API key

## Related Files

- `src/app/panels/ChatPanel.tsx` - API key input UI
- `src/hooks/useAISession.ts` - Session management
- `src/services/aiService.ts` - Gemini API calls
- `src/pages/SettingsPage.tsx` - Key management UI
