# Repository Guidelines

## Project Structure & Modules
- Frontend source: `src/` (React + TypeScript, MUI/Tailwind). Entry: `src/main.tsx`, routes/pages in `src/pages/`, shared UI in `src/components/`, data services in `src/services/`.
- Tests: Playwright suites in `tests/` (feature folders like `editor/`, `auth/`, `admin/`, `e2e/`, `production/`). Test artifacts in `test-results/`.
- Config: Vite (`vite.config.ts`), Firebase (`src/lib/firebase.ts`, `firestore.rules`), environment flags (`.env.*`, `src/config/environment.ts`).

## Build, Test, Dev Commands
- `npm install` — install dependencies.
- `npm run dev -- --port=5175 --strictPort` — start Vite dev server (used by Playwright).
- `npm run build` — production build.
- `npx playwright test` — run full Playwright suite locally (uses `playwright.config.ts`).
- `npx playwright test tests/production` — run production smoke/navigation/auth checks against https://powertimeline.com.

## Coding Style & Naming
- Language: TypeScript/React; prefer functional components and hooks.
- Formatting: keep ASCII; ESLint config in `eslint.config.js`; follow existing patterns (2-space/consistent Prettier defaults).
- File naming: scream-case for root docs (PLAN.md, PRD.md), snake/slug for tests (`tests/feature/NN-name.spec.ts`), TypeScript camelCase for vars/functions, PascalCase for components.

## Testing Guidelines
- Framework: Playwright only; no Jest/unit in repo.
- Test naming: numbered scenarios in `tests/editor/0x-*.spec.ts`, area-based folders; production tests live in `tests/production/`.
- Run locally with dev server (auto-start from config). For targeted runs, point to specific files or folders. Keep data-testid selectors stable.
- Treat console Firebase/permission errors as failures in production tests.

## Commit & PR Guidelines
- Commit messages: short, imperative (`fix: adjust auth banner`; `chore: update playwright configs`).
- PRs: include summary of changes, impacted areas, and test evidence (`npx playwright test ...` output). Link issues when applicable; add screenshots for UI changes.

## Security & Configuration Tips
- Do not store secrets in repo; use `.env.local`/`.env.test` (already gitignored). Validate `VITE_*` vars before running tests.
- Firestore rules must allow public read of public/unlisted timelines while blocking writes for unauth users; keep admin operations restricted.

## Multi-Agent Architecture

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

### Agents
- **User:** Approves all PLAN.md changes, provides direction to both agents
- **Claude:** Manages development, updates PLAN.md (with User approval), implements code, responds to Codex
- **Codex (You):** Reads PLAN.md for tasks, runs tests, reports status/findings in IAC.md

### Your Role as Codex
- You are **Codex**
- **Read** `PLAN.md` to understand current tasks and priorities
- **Write** your findings, status updates, and test results to `IAC.md`
- **Do NOT modify** `PLAN.md` - only Claude can update it
- Always follow the rules in `CLAUDE.md`

### IAC.md Communication Format
```
YYYY-MM-DD HH:MM From Codex to Claude
- Finding or status update here
- Use compact bullet format
===
```

### Workflow
1. Read `PLAN.md` to know what to test
2. Execute tests and analysis
3. Write findings to `IAC.md`
4. Claude reads IAC.md and updates PLAN.md (with User approval)
