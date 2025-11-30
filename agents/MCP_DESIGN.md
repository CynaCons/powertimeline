# MCP Agent Spawner - Design Document

**Version:** 1.3
**Date:** 2025-11-30
**Status:** Implemented

---

## 1. Purpose

Expose agent spawning as MCP tools so the orchestrator (Claude Code) can delegate tasks to sub-agents with:
- Automatic logging (IAC.md, CONTEXT.md)
- Deterministic behavior (no memory required)
- Thread-safe concurrent execution

## 2. Tools

### spawn_claude

Spawn a Claude sub-agent for reasoning tasks.

```
Parameters:
  prompt (required)  - The task to perform
  model (optional)   - haiku | sonnet | opus (default: sonnet)
```

All other settings are hardcoded:
- Tools: Bash, Read, Write, Edit, Glob, Grep
- Timeout: 300s (600s for test tasks)
- Context: Claude CLI auto-loads CLAUDE.md from project root

### spawn_codex

Spawn a Codex (GPT-5.1) sub-agent for any task.

```
Parameters:
  prompt (required)  - The task to perform
```

All settings hardcoded:
- Sandbox: `--dangerously-bypass-approvals-and-sandbox` (required for write access)
- Timeout: 300s
- Context: Codex CLI auto-loads AGENTS.md from project root

**Note:** Codex's `--sandbox workspace-write` mode is broken ([GitHub issue](https://github.com/openai/codex/issues)). We use the bypass flag to enable file writes.

### list

List running and recently completed agents.

```
Parameters: none
```

### result

Get the result of a completed agent.

```
Parameters:
  agent_id (required) - ID returned from spawn
```

## 3. Architecture

```
┌──────────────────────────────────────────────────────┐
│  Claude Code (Orchestrator)                          │
│                                                      │
│  User says: "delegate testing to Codex"              │
│  Claude calls: mcp__agents__spawn_codex(prompt)      │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  MCP Server (agents/mcp_server.py)                   │
│                                                      │
│  1. Log start to IAC.md                              │
│  2. Spawn subprocess (claude/codex CLI)              │
│     - CLI auto-loads context (CLAUDE.md/AGENTS.md)   │
│  3. Log completion to IAC.md                         │
│  4. Return result                                    │
└──────────────────────────────────────────────────────┘
```

## 4. Context Loading

Context is loaded by the respective CLIs, not injected by the MCP server:
- **Claude CLI:** Auto-loads `CLAUDE.md` from project root
- **Codex CLI:** Auto-loads `AGENTS.md` from project root

This avoids duplicate context and ensures each agent gets the appropriate instructions.

The context files contain:
- Project overview (what is PowerTimeline)
- Codebase structure (where things are)
- Commands (how to build, test)
- Role guidelines (what to do and NOT do)

## 5. Logging

**IAC.md** (Inter-Agent Communication) records:
- Spawn ID, agent type, timestamp (UTC)
- Task summary and full input prompt
- Duration, cost (for Claude, estimated for Codex)
- Success/failure status with output

**CONTEXT.md** shows currently active agents only (resets on server restart).

## 6. Why Two Agent Types?

| Agent | Best For | Rate Limit |
|-------|----------|------------|
| Claude | Reasoning, analysis, complex tasks | Limited (Anthropic API) |
| Codex | Any task, alternative quota | Separate (OpenAI API) |

Using both prevents hitting a single provider's rate limit.

## 7. Files

| File | Purpose |
|------|---------|
| `mcp_server.py` | MCP server implementation |
| `spawner.py` | Core spawn functions |
| `context_loader.py` | Loads and formats context |
| `logger.py` | Writes to IAC.md |
| `AGENTS.md` | Universal context for sub-agents |
| `IAC.md` | Inter-agent communication log |
| `CONTEXT.md` | Recent runs summary |

## 8. Configuration

`.mcp.json` in project root:

```json
{
  "mcpServers": {
    "agents": {
      "command": "python",
      "args": ["agents/mcp_server.py"],
      "env": {
        "PYTHONIOENCODING": "utf-8"
      }
    }
  }
}
```

## 9. Usage Examples

**Delegate analysis:**
```json
{
  "tool": "mcp__agents__spawn_claude",
  "prompt": "Find all usages of deprecated User.name field"
}
```

**Delegate testing:**
```json
{
  "tool": "mcp__agents__spawn_codex",
  "prompt": "Run tests/editor/ and report failures"
}
```

**Check status:**
```json
{"tool": "mcp__agents__list"}
```

**Get result:**
```json
{
  "tool": "mcp__agents__result",
  "agent_id": "abc123"
}
```
