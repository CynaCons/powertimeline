# MCP Agent Spawner - Design Document

**Version:** 1.1
**Date:** 2025-11-30
**Status:** Implemented

---

## 1. Purpose

Expose agent spawning as MCP tools so the orchestrator (Claude Code) can delegate tasks to sub-agents with:
- Automatic context injection (AGENTS.md)
- Automatic logging (IAC.md)
- Deterministic behavior (no memory required)

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
- Context: AGENTS.md injected automatically

### spawn_codex

Spawn a Codex (GPT-5.1) sub-agent for any task.

```
Parameters:
  prompt (required)  - The task to perform
```

All settings hardcoded:
- Sandbox: workspace-write
- Timeout: 300s
- Context: AGENTS.md injected automatically

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
│  1. Inject AGENTS.md context                         │
│  2. Log start to IAC.md                              │
│  3. Spawn subprocess (claude/codex CLI)              │
│  4. Log completion to IAC.md                         │
│  5. Return result                                    │
└──────────────────────────────────────────────────────┘
```

## 4. Context Injection

All sub-agents receive AGENTS.md content, which contains:
- Project overview (what is PowerTimeline)
- Codebase structure (where things are)
- Commands (how to build, test)
- Role guidelines (what to do and NOT do)

This is model-agnostic - works for Claude and Codex.

## 5. Logging

IAC.md automatically records:
- Spawn ID, agent type, timestamp
- Task summary
- Duration, cost (for Claude)
- Success/failure status

CONTEXT.md tracks recent runs for quick reference.

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
