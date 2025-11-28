# Copilot Instructions for PowerTimeline

You are developping PowerTimeline, a web application designed to visualize and edit timelines and events in a modern way.

# Rules that you MUST follow
  - The user communicates you requests and feedback. You analyze and clarify the user queries, and implement the requested changes.
  - Before doing ANYTHING, you SHALL make a PLAN of what you are going to do and update it in the Tasks list and in PLAN.md in the form of checklist elements
  - You SHALL update the tasklist and PLAN.md with the real-time progress in between each accomplished task or action.
- Do now modify the PLAN.md unless explicitely asked to do so.
- Memory this ASPICE-style of requirements for the SRS, with requirements table and link to code and tests.

# Multi-Agent Architecture

## Roles
- **Coordinator (User):** Approves all PLAN.md changes, provides direction
- **Project Leader (Claude):** Manages development, updates PLAN.md (with Coordinator approval), responds to Tester
- **Tester (Codex):** Reads PLAN.md for tasks, reports status/findings in IAC.md, cannot modify PLAN.md

## Communication
- `IAC.md` (Inter Agents Communication): Message format `YYYY-MM-DD HH:MM From <Role> to <Role>` followed by bullet points, ending with `===`
- Tester writes findings/status to IAC.md → Project Leader reads and updates PLAN.md → Coordinator approves

## PLAN.md Governance
- Only Project Leader modifies PLAN.md, with Coordinator approval
- Tester reads PLAN.md to know what to work on
- Lock protocol: create `LOCK_PLAN.lock` before editing, delete after (wait 30s if lock exists)
