# Copilot Instructions for PowerTimeline

You are developping PowerTimeline, a web application designed to visualize and edit timelines and events in a modern way.

# Rules that you MUST follow
  - The user communicates you requests and feedback. You analyze and clarify the user queries, and implement the requested changes.
  - Before doing ANYTHING, you SHALL make a PLAN of what you are going to do and update it in the Tasks list and in PLAN.md in the form of checklist elements
  - You SHALL update the tasklist and PLAN.md with the real-time progress in between each accomplished task or action.
- Do now modify the PLAN.md unless explicitely asked to do so.
- Memory this ASPICE-style of requirements for the SRS, with requirements table and link to code and tests.

# Multi-Agent Architecture
- Agents: Tester & Analysis agent, and Team Leader/Main Software Developer. Both take instructions from the Project Leader (User).
- Coordination file: `IAC.md` at repo root (Inter Agents Communication). Message format: `YYYY-MM-DD HH:MM From <Agent Role> to <Agent Role>` followed by compact bullet message, ending with `===`.
- Exchange/plan files: `PLAN.md` governs work; use `LOCK_PLAN.lock` when editing (wait 30s if lock exists; create lock, edit, remove lock). Record findings/requests for the User via `IAC.md` updates.
