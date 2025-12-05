# PowerTimeline - Claude Instructions

## Part 1: General Context (All Agents)

You are developing **PowerTimeline**, a web application for visualizing and editing historical timelines with events.

### Project Overview
- **Stack:** React 18, TypeScript, Vite, Firebase (Auth + Firestore), Tailwind CSS, MUI
- **Architecture:** SPA with timeline editor, home/browse pages, user profiles, admin panel
- **Testing:** Playwright E2E tests (~320 tests)
- **Documentation:** ASPICE-style SRS with requirements traceability

### Key Directories
```
src/
├── app/           # Timeline editor (App.tsx, overlays/, panels/)
├── components/    # Shared UI components
├── layout/        # Layout engine (LayoutEngine.ts, PositioningEngine.ts)
├── pages/         # Route pages (HomePage, LandingPage, UserProfilePage, AdminPage)
├── services/      # Firebase services (firestore.ts, auth.ts)
├── styles/        # CSS tokens and global styles
├── timeline/      # Timeline rendering (DeterministicLayoutComponent.tsx)
tests/             # Playwright tests organized by feature
docs/              # SRS documentation
powerspawn/        # PowerSpawn MCP server (git submodule)
```

### Key Commands
```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run all Playwright tests
npm run test:prod    # Run production smoke tests only
```

### Rules for All Agents
1. **Read before edit** - Always read files before modifying them
2. **Build verification** - Run `npm run build` after significant changes
3. **No over-engineering** - Keep changes minimal and focused
4. **Use CSS variables** - Use `var(--page-*)` for theme-aware colors
5. **Update PLAN.md** - Mark tasks complete when done (if instructed)

---

## Part 2: Coordinator Agent Instructions

> **IMPORTANT:** This section applies ONLY to the **Coordinator Agent** - the Claude instance that receives direct instructions from the user and orchestrates sub-agents. Worker agents spawned via MCP should IGNORE this section.

### How to Identify if You're the Coordinator
You are the coordinator if:
- The user is directly talking to you in the conversation
- You have access to `mcp__agents__spawn_*` tools
- The user gives you high-level tasks to delegate or coordinate

### Coordinator Responsibilities

#### 1. Task Planning & Tracking
- Use **TodoWrite** to track all tasks, including delegated ones
- Format: `{"content": "Task name (agent ID)", "status": "in_progress", "activeForm": "Agent working"}`
- Update status immediately when agents complete
- Clean up stale todos when context changes

#### 2. Agent Delegation Patterns

**When to spawn agents:**
- Complex multi-file changes (dark theme fixes, feature implementations)
- Independent tasks that can run in parallel
- Investigation/audit tasks (read-only analysis)
- Tasks while you focus on something else

**When NOT to spawn agents:**
- Simple single-file edits you can do quickly
- Tasks requiring back-and-forth with user
- When you need the result immediately for next step

**Spawn with good prompts:**
```
## Task: [Clear Title]

[Problem description]

### Requirements:
- [Specific requirement 1]
- [Specific requirement 2]

### Files to Modify:
- `path/to/file.tsx` - What to change

### Verification:
- Run `npm run build` to ensure no errors
```

#### 3. Parallel Coordination
- Spawn multiple agents for independent tasks
- Use `mcp__agents__list` to monitor progress
- Use `mcp__agents__wait_for_agents` for batch completion
- Get results with `mcp__agents__result` when done
- Report summaries to user in table format

#### 4. PLAN.md Management
- Update header version when iterations complete
- Mark deferred tasks as done when completed
- Add new iterations with clear goals and task lists
- Keep "Recent Achievements" section current
- Note incomplete tasks from earlier iterations for discussion

#### 5. User Communication Style
- Provide status tables for multi-task updates
- Summarize agent results concisely
- Flag issues that need user decision
- Ask clarifying questions before large changes
- Don't overwhelm with details - be concise

#### 6. Debugging Agent Issues
- If agent times out: Check if work was partially done (read PLAN.md)
- If agent fails: Review error, consider re-spawning or doing manually
- If results seem wrong: Verify by reading modified files

### Example Coordination Session

```
User: "Fix dark theme issues and add scrollbar styling"

Coordinator thinks:
1. These are independent tasks → spawn in parallel
2. Update TodoWrite with both tasks
3. Monitor with list()
4. Get results and report

Coordinator actions:
1. TodoWrite([{task1, in_progress}, {task2, in_progress}])
2. spawn_claude("Fix dark theme...") → agent_id: abc123
3. spawn_claude("Add scrollbar...") → agent_id: def456
4. wait_for_agents()
5. result("abc123"), result("def456")
6. TodoWrite([{task1, completed}, {task2, completed}])
7. Report summary table to user
8. Update PLAN.md if requested
```

### Anti-Patterns to Avoid
- ❌ Spawning agents for trivial single-line fixes
- ❌ Forgetting to update TodoWrite when agents complete
- ❌ Not verifying agent work when user reports issues
- ❌ Leaving PLAN.md version header stale
- ❌ Spawning dependent tasks in parallel (they need sequential execution)

---

## Part 3: Multi-Agent Orchestration Reference

### Available MCP Tools
```
mcp__agents__spawn_claude   - Spawn Claude sub-agent
  prompt (required)         - The task to perform
  model (optional)          - haiku | sonnet | opus (default: sonnet)
  timeout (optional)        - Seconds (default: 600, use 900 for complex tasks)

mcp__agents__spawn_codex    - Spawn Codex (GPT-5.1) sub-agent
  prompt (required)         - The task to perform

mcp__agents__spawn_copilot  - Spawn Copilot sub-agent (GPT/Claude/Gemini)
  prompt (required)         - The task to perform
  model (optional)          - gpt-5.1 | gpt-5 | claude-sonnet | gemini (default: gpt-5.1)

mcp__agents__list           - List running/completed agents

mcp__agents__result         - Get agent result by ID
  agent_id (required)

mcp__agents__wait_for_agents - Block until all agents complete
  timeout (optional)        - Max seconds to wait (default: 300)
```

### When to Use Which Agent
| Agent | Best For | Notes |
|-------|----------|-------|
| Claude (haiku) | Quick searches, simple analysis | Fast, cheap |
| Claude (sonnet) | Feature implementation, fixes | Balanced |
| Claude (opus) | Complex reasoning, architecture | Expensive |
| Codex | Any task, rate limit relief | Separate quota |
| Copilot | Any task, multi-model | GitHub subscription |

### Key Files
- `powerspawn/mcp_server.py` - MCP server implementation
- `powerspawn/MCP_DESIGN.md` - Architecture documentation
- `AGENTS.md` - Context loaded by sub-agents
