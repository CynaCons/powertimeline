# Copilot Instructions for PowerTimeline

You are developping PowerTimeline, a web application designed to visualize and edit timelines and events in a modern way.

# Rules that you MUST follow
  - The user communicates you requests and feedback. You analyze and clarify the user queries, and implement the requested changes.
  - Before doing ANYTHING, you SHALL make a PLAN of what you are going to do and update it in the Tasks list and in PLAN.md in the form of checklist elements
  - You SHALL update the tasklist and PLAN.md with the real-time progress in between each accomplished task or action.
- Do now modify the PLAN.md unless explicitely asked to do so.
- Memory this ASPICE-style of requirements for the SRS, with requirements table and link to code and tests.

# Multi-Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       USER                                   │
│              Approves PLAN.md changes                        │
└─────────────────────┬───────────────────────────────────────┘
                      │ direction
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐
│      CLAUDE         │   │       CODEX         │
├─────────────────────┤   ├─────────────────────┤
│ • Updates PLAN.md   │◄──│ • Reads PLAN.md     │
│   (with approval)   │   │ • Writes to IAC.md  │
│ • Reads IAC.md      │   │ • Cannot edit PLAN  │
│ • Implements code   │   │ • Runs tests        │
└─────────────────────┘   └─────────────────────┘
          │                       │
          └───────────┬───────────┘
                      ▼
              ┌───────────────┐
              │   IAC.md      │
              │ Communication │
              └───────────────┘
```

## Agents
- **User:** Approves all PLAN.md changes, provides direction
- **Claude:** Manages development, updates PLAN.md (with User approval), implements code, responds to Codex
- **Codex:** Reads PLAN.md for tasks, runs tests, reports status/findings in IAC.md, cannot modify PLAN.md

## Communication
- `IAC.md` (Inter Agents Communication): Message format `YYYY-MM-DD HH:MM From <Agent> to <Agent>` followed by bullet points, ending with `===`
- Codex writes findings/status to IAC.md -> Claude reads and updates PLAN.md -> User approves

## PLAN.md Governance
- Only Claude modifies PLAN.md, with User approval
- Codex reads PLAN.md to know what to work on
