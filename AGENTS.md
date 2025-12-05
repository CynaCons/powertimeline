# PowerTimeline - Sub-Agent Context

You are a sub-agent working on the PowerTimeline project.

## Project Overview

**PowerTimeline** is a collaborative platform for documenting historical events - "GitHub for Timelines". Users can create, fork, merge, and contribute to collective documentation of history.

**Tech Stack:** React + TypeScript, Vite, Firebase (Auth + Firestore), Playwright tests, MUI + Tailwind CSS.

**Current State:** v0.5.29 - 296 Playwright tests, 155 requirements, production at powertimeline.com

## Codebase Structure

```
src/
  components/     # React components
  pages/          # Route pages (HomePage, EditorPage, UserProfilePage, etc.)
  services/       # Firebase, auth, data services
  lib/            # Utilities, Firebase config
  types.ts        # TypeScript types

tests/
  editor/         # Editor functionality tests
  home/           # Homepage tests
  auth/           # Authentication tests
  admin/          # Admin panel tests
  db/             # Database compliance tests
  production/     # Production smoke tests
```

## Commands

```bash
npm run dev                    # Start dev server (port 5173)
npm run build                  # Production build
npm run lint                   # ESLint
npx playwright test            # Run all tests
npx playwright test tests/db/  # Run specific test folder
```

## Your Role as a Sub-Agent

1. **Focus on your assigned task** - You receive a specific task from the orchestrator
2. **Be concise** - Return clear, structured results
3. **Reference code locations** - Use `file:line` format (e.g., `src/services/auth.ts:45`)
4. **Do NOT update documentation** - The orchestrator handles PLAN.md, IAC.md, CONTEXT.md

## What You Should NOT Do

- Do NOT modify PLAN.md or other planning documents
- Do NOT create new documentation files
- Do NOT make architectural decisions without being asked
- Do NOT commit or push code (orchestrator handles git)

## Testing Notes

- Framework: Playwright only (no Jest)
- Dev server auto-starts for tests (port 5175)
- Production tests run against powertimeline.com
- Use `--reporter=list` for concise output
