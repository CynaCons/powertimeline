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

## Multi-Agent Orchestration

This project uses **deterministic orchestration** for multi-agent workflows. The `agents/` module handles all bookkeeping programmatically.

### IMPORTANT: Use MCP Tools to Spawn Agents

When you need to spawn a sub-agent, use the **MCP tools** provided by this project:

```
mcp__agents__spawn_claude   - Spawn a Claude sub-agent (recommended)
mcp__agents__spawn_codex    - Spawn a Codex agent for execution tasks
mcp__agents__list_running   - List currently running agents
mcp__agents__get_result     - Get result of a completed agent
mcp__agents__get_context    - Preview injected context
```

**DO NOT use Claude Code's built-in `Task` tool for sub-agents.** The MCP tools ensure:
- Automatic context injection (PRD, PLAN, CLAUDE.md)
- Automatic logging to IAC.md
- Proper encoding handling
- Schema validation of parameters

### If You Are a Spawned Agent
- Project context is **automatically injected** into your prompt
- Do **NOT** update documentation files (IAC.md, CONTEXT.md) - the orchestrator handles this
- Focus on your task and return clear results
- See `agents/DESIGN.md` for architecture details

### Architecture
```
┌─────────────────┐
│  Claude Code    │  Calls MCP tools
│  (Orchestrator) │
└────────┬────────┘
         │ mcp__agents__spawn_claude
         ▼
┌─────────────────┐
│  MCP Server     │  Python (deterministic)
│  agents/        │  - Context injection
│  mcp_server.py  │  - Logging to IAC.md
│                 │  - State in CONTEXT.md
└────────┬────────┘
         │ spawns subprocess
         ▼
┌─────────────────┐
│  Sub-Agents     │  Claude CLI / Codex CLI
│                 │  - Reasoning & coding
│                 │  - Return structured results
└─────────────────┘
```

### Key Files
| File | Purpose |
|------|---------|
| `agents/mcp_server.py` | MCP server exposing spawn tools |
| `agents/MCP_DESIGN.md` | MCP architecture design |
| `agents/DESIGN.md` | Orchestration rationale |
| `agents/CONTEXT.md` | Live state (auto-generated) |
| `agents/IAC.md` | Interaction log (auto-generated) |
| `agents/spawner.py` | Core spawn functions |
| `.mcp.json` | MCP server configuration |

### Setup

1. Install MCP SDK: `pip install -r agents/requirements.txt`
2. Restart Claude Code to load MCP tools
3. Use `mcp__agents__spawn_claude` to spawn sub-agents
