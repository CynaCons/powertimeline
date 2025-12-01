# PowerSpawn - Universal Multi-Agent MCP Server

> **Spawn Claude AND Codex from one coordinator. Your agents leave a paper trail.**

A lightweight MCP server for cross-model AI agent orchestration. Works with Claude Code, GitHub Copilot, and any MCP-compatible client.

## What Makes This Different?

| Feature | PowerSpawn | AutoGen | CrewAI | LangGraph |
|---------|------------|---------|--------|-----------|
| Cross-model spawning | **Yes** (Claude + Codex) | No | No | No |
| MCP protocol native | **Yes** | No | No | No |
| File-based communication | **Yes** (IAC.md) | No | No | No |
| Zero infrastructure | **Yes** | Partial | Partial | No |
| CLI-native | **Yes** | No | No | No |

## The IAC.md Pattern (Novel)

Traditional multi-agent systems use in-memory message passing or databases. PowerSpawn uses **markdown files** as the communication channel:

```
┌─────────────────────────────────────────────────────────────────┐
│                    COORDINATOR (Claude/Copilot)                 │
│                    Reads IAC.md, writes tasks                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │         IAC.md              │
              │  • Task assignments         │
              │  • Agent results            │
              │  • Human-readable log       │
              │  • Git-trackable            │
              └─────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────────────┐
│   CODEX SUB-AGENT     │       │     CLAUDE SUB-AGENT          │
│   • GPT-5.1 models    │       │     • Claude models           │
│   • Reads CONTEXT.md  │       │     • Reads AGENTS.md         │
│   • Writes to IAC.md  │       │     • Writes to IAC.md        │
└───────────────────────┘       └───────────────────────────────┘
```

**Why this matters:**
- **Auditable**: Every agent interaction is logged in plain markdown
- **Debuggable**: Read IAC.md to see exactly what happened
- **Persistent**: Survives process restarts, session timeouts
- **Version-controllable**: Git tracks your agent history

## Novelty Research (December 2025)

We analyzed 900+ MCP repositories and major frameworks. Findings:

| Claim | Verified | Evidence |
|-------|----------|----------|
| IAC.md pattern is novel | **Yes** | No equivalent found in existing repos |
| Cross-model orchestration is rare | **Yes** | Only 19 repos mention Claude + Codex together |
| MCP for agent spawning is uncommon | **Yes** | Most MCP servers are for external tools |

**Closest competitor**: `claude-flow` (1k stars) - but Claude-only, no cross-model support.

## Quick Start

### With Claude Code

The MCP server is auto-loaded. Use these tools:

```
mcp__agents__spawn_claude   - Spawn Claude sub-agent
mcp__agents__spawn_codex    - Spawn Codex (GPT) sub-agent
mcp__agents__list           - List running/completed agents
mcp__agents__result         - Get agent result by ID
mcp__agents__wait_for_agents - Wait for all agents to complete
```

**Example prompt:**
> "Can you powerspawn a Codex to run the test suite while you review the code?"

### With GitHub Copilot (VS Code)

Add to `.vscode/mcp.json`:
```json
{
  "servers": {
    "powerspawn": {
      "command": "python",
      "args": ["agents/mcp_server.py"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### Standalone Python

```python
from agents.mcp_server import spawn_claude, spawn_codex

# Spawn Claude for code review
result = spawn_claude("Review src/App.tsx for security issues")

# Spawn Codex for testing (preserves Claude rate limit)
result = spawn_codex("Run npm test and report failures")
```

## Architecture

```
agents/
├── mcp_server.py      # MCP server - the core (~500 lines)
├── CONTEXT.md         # Project context injected into all agents
├── IAC.md             # Inter-Agent Communication log
├── AGENTS.md          # Agent instructions (auto-injected)
├── README.md          # This file
├── MCP_DESIGN.md      # Detailed architecture docs
└── DESIGN.md          # Original design document
```

## Key Files

### CONTEXT.md - Project Context Injection
Every spawned agent automatically receives this file's content. Use it for:
- Project structure overview
- Key file locations
- Current sprint/iteration goals
- Environment-specific notes

### IAC.md - Inter-Agent Communication
The coordinator writes task assignments here. Agents read instructions and append results. Format:

```markdown
## Task: Run Production Tests
**Assigned to:** Codex
**Status:** In Progress
**Timestamp:** 2025-12-01T20:30:00

### Instructions
Run `npm run test:production` and report any failures...

### Result
[Agent appends result here when complete]
```

### AGENTS.md - Agent Instructions
Universal instructions injected into every agent. Defines:
- Available tools and restrictions
- Output format expectations
- Project conventions
- Do's and don'ts

## MCP Tools Reference

### spawn_claude
```json
{
  "prompt": "Your task description",
  "model": "sonnet",        // haiku | sonnet | opus
  "timeout": 600            // seconds (default: 600)
}
```

### spawn_codex
```json
{
  "prompt": "Your task description"
}
```

### list
Returns running and completed agent IDs.

### result
```json
{
  "agent_id": "abc123"
}
```
Returns the agent's output, cost, and status.

### wait_for_agents
Blocks until all running agents complete. Returns all results.

## Use Cases

### 1. Parallel Test + Review
```
Coordinator: "Spawn Codex to run tests while I review the PR"
→ Codex runs tests (doesn't consume Claude rate limit)
→ Claude reviews code
→ Both results collected
```

### 2. Research Task
```
Coordinator: "Powerspawn an Opus agent to research multi-agent patterns"
→ Opus agent does deep research with web search
→ Results written to IAC.md
→ Coordinator summarizes findings
```

### 3. Large Refactoring
```
Coordinator: "Spawn 4 agents to migrate different test file groups"
→ Agent 1: tests/editor/01-10
→ Agent 2: tests/editor/11-20
→ Agent 3: tests/editor/21-30
→ Agent 4: tests/editor/31-40
→ All run in parallel, results collected
```

## Configuration

Environment variables:
- `ANTHROPIC_API_KEY` - For Claude agents
- `OPENAI_API_KEY` - For Codex agents

Agent defaults are in the MCP server. Override via tool parameters.

## Comparison with Other Frameworks

### vs AutoGen (Microsoft)
- AutoGen: Heavy SDK, in-memory, single-model focus
- PowerSpawn: Lightweight MCP, file-based, cross-model

### vs CrewAI
- CrewAI: Role-based agents, complex setup
- PowerSpawn: Simple spawn/wait pattern, zero config

### vs LangGraph
- LangGraph: Graph-based workflows, state machines
- PowerSpawn: Imperative spawning, human-readable logs

### vs claude-flow
- claude-flow: Claude-only, swarm intelligence focus
- PowerSpawn: Cross-model, simpler architecture

## Roadmap

- [ ] PyPI package: `pip install powerspawn`
- [ ] Support for Gemini models
- [ ] Web UI for monitoring agents
- [ ] Cost tracking dashboard
- [ ] MCP Registry submission

## License

MIT - Use it, fork it, improve it.

---

**Built with AI, for AI orchestration.**

*Part of the [PowerTimeline](https://github.com/cynako/powertimeline) project.*
