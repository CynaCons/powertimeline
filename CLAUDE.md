# Copilot Instructions for PowerTimeline

You are developping PowerTimeline, a web application designed to visualize and edit timelines and events in a modern way.

# Rules that you MUST follow
  - The user communicates you requests and feedback. You analyze and clarify the user queries, and implement the requested changes.
  - Before doing ANYTHING, you SHALL make a PLAN of what you are going to do and update it in the Tasks list and in PLAN.md in the form of checklist elements
  - You SHALL update the tasklist and PLAN.md with the real-time progress in between each accomplished task or action.
- Do now modify the PLAN.md unless explicitely asked to do so.
- Memory this ASPICE-style of requirements for the SRS, with requirements table and link to code and tests.

# Multi-Agent Orchestration (v1.1)

Delegate tasks to sub-agents using MCP tools. Context from AGENTS.md is automatically injected.

## Available Tools

```
mcp__agents__spawn_claude   - Spawn Claude sub-agent
  prompt (required)         - The task to perform
  model (optional)          - haiku | sonnet | opus (default: sonnet)

mcp__agents__spawn_codex    - Spawn Codex (GPT-5.1) sub-agent
  prompt (required)         - The task to perform

mcp__agents__list           - List running/completed agents

mcp__agents__result         - Get agent result by ID
  agent_id (required)
```

## Examples

Delegate analysis to Claude:
```json
{"tool": "mcp__agents__spawn_claude", "prompt": "Find all usages of deprecated User.name field"}
```

Delegate testing to Codex (preserves Claude rate limit):
```json
{"tool": "mcp__agents__spawn_codex", "prompt": "Run tests/editor/ and report failures"}
```

## Key Files
- `agents/mcp_server.py` - MCP server
- `agents/MCP_DESIGN.md` - Architecture design
- `AGENTS.md` - Universal context for sub-agents