# Copilot Instructions for PowerTimeline

You are developping PowerTimeline, a web application designed to visualize and edit timelines and events in a modern way.

# Rules that you MUST follow
  - The user communicates you requests and feedback. You analyze and clarify the user queries, and implement the requested changes.
  - Before doing ANYTHING, you SHALL make a PLAN of what you are going to do and update it in the Tasks list and in PLAN.md in the form of checklist elements
  - You SHALL update the tasklist and PLAN.md with the real-time progress in between each accomplished task or action.
- Do now modify the PLAN.md unless explicitely asked to do so.
- Memory this ASPICE-style of requirements for the SRS, with requirements table and link to code and tests.

# Multi-Agent Orchestration

This project uses a **deterministic orchestration** approach for multi-agent workflows. Python code handles all bookkeeping (logging, context injection, documentation updates) while agents focus on reasoning and coding tasks.

## Key Principle
> "Everything that CAN be done deterministically SHOULD be done deterministically."

Agents are unreliable at following documentation rules. The orchestration system in `agents/` handles this programmatically.

## CRITICAL: Use MCP Tools to Spawn Agents

**BEFORE spawning any sub-agent, STOP and verify you are using the correct tool.**

When the user says "spawn an agent", "run this in background", "delegate to a sub-agent", or similar:

1. **USE:** `mcp__agents__spawn_claude` or `mcp__agents__spawn_codex`
2. **NEVER USE:** The built-in `Task` tool (subagent_type parameter)
3. **NEVER USE:** `Bash` with `python -c "from agents import spawn_claude..."`

Available MCP tools:
```
mcp__agents__spawn_claude   - Spawn a Claude sub-agent (recommended)
mcp__agents__spawn_codex    - Spawn a Codex agent for execution tasks
mcp__agents__list_running   - List currently running agents
mcp__agents__get_result     - Get result of a completed agent
```

The MCP tools ensure: automatic context injection, automatic logging, proper encoding, schema validation.

Example:
```json
{
  "tool": "mcp__agents__spawn_claude",
  "parameters": {
    "prompt": "Analyze the authentication flow and identify security issues",
    "model": "sonnet",
    "tools": ["Read", "Grep", "Glob"],
    "timeout": 300
  }
}
```

## For Spawned Agents
If you are a sub-agent spawned by this system:
- You receive project context automatically (PRD, PLAN, CLAUDE.md)
- Do NOT update IAC.md or CONTEXT.md - the orchestrator handles this
- Focus on your assigned task and return clear, structured results
- See `agents/DESIGN.md` for architecture details

## Key Files
- `agents/mcp_server.py` - MCP server exposing spawn tools
- `agents/MCP_DESIGN.md` - MCP architecture design
- `agents/DESIGN.md` - Architecture rationale
- `agents/CONTEXT.md` - Live agent state (auto-generated)
- `agents/IAC.md` - Interaction log (auto-generated)
- `.mcp.json` - MCP server configuration
