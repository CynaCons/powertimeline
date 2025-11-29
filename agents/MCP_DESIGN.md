# MCP Agent Spawner - Design Document

**Version:** 1.0 (Draft)
**Date:** 2025-11-29
**Authors:** Claude (Orchestrator) + User
**Status:** Proposal

---

## 1. Executive Summary

This document proposes an MCP (Model Context Protocol) server that exposes agent spawning as a **tool** rather than relying on the orchestrator to remember to use the correct Python module. By making `spawn_agent` a first-class tool in Claude's tool list, we eliminate the failure mode where the orchestrator uses the wrong spawning mechanism.

### The Problem We're Solving

```
Current State (Probabilistic):
┌─────────────────────────────────────────────────────────────┐
│  Claude sees: Task tool, Bash tool, Read tool, etc.         │
│                                                             │
│  Claude must REMEMBER:                                      │
│  - "Don't use Task tool for sub-agents"                     │
│  - "Use Bash + Python + agents/ module instead"             │
│  - "Include UTF-8 encoding workaround"                      │
│                                                             │
│  Failure rate: HIGH (as demonstrated today)                 │
└─────────────────────────────────────────────────────────────┘

Proposed State (Deterministic):
┌─────────────────────────────────────────────────────────────┐
│  Claude sees: mcp__agents__spawn_claude tool                │
│                                                             │
│  Claude simply USES the tool:                               │
│  - Tool interface enforces correct parameters               │
│  - MCP server handles all bookkeeping                       │
│  - No ambiguity, no memory required                         │
│                                                             │
│  Failure rate: NEAR ZERO                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. MCP Protocol Overview

### 2.1 What is MCP?

MCP (Model Context Protocol) is a standard for connecting AI assistants to external tools and data sources. It defines:

1. **Servers** - Programs that expose tools, resources, and prompts
2. **Clients** - AI assistants (like Claude Code) that consume these capabilities
3. **Transport** - Communication layer (stdio, HTTP, WebSocket)

### 2.2 MCP Server Capabilities

An MCP server can expose:

| Capability | Description | Our Use Case |
|------------|-------------|--------------|
| **Tools** | Functions the AI can call | `spawn_claude`, `spawn_codex`, `list_agents` |
| **Resources** | Data the AI can read | `agents://context`, `agents://iac-log` |
| **Prompts** | Pre-built prompt templates | `analyze-code`, `run-tests` |

### 2.3 How Claude Code Discovers MCP Tools

```
1. User configures MCP server in claude_desktop_config.json or .mcp.json
2. Claude Code starts and connects to MCP server via stdio
3. MCP server advertises available tools via tools/list
4. Tools appear in Claude's tool list as mcp__<server>__<tool>
5. When Claude calls a tool, MCP server executes and returns result
```

---

## 3. Architecture

### 3.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLAUDE CODE (Client)                         │
│                                                                      │
│  Available Tools:                                                    │
│  ├── Bash, Read, Write, Glob, Grep, Edit (built-in)                │
│  ├── Task (built-in - but now HIDDEN/DISABLED for sub-agents)       │
│  └── mcp__agents__spawn_claude    ◄── NEW: From MCP Server          │
│      mcp__agents__spawn_codex                                        │
│      mcp__agents__list_running                                       │
│      mcp__agents__get_result                                         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ stdio (JSON-RPC)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MCP AGENT SERVER (Python)                       │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Tool Handler   │  │ Context Loader  │  │    Logger       │     │
│  │                 │  │                 │  │                 │     │
│  │ - Validate args │  │ - Read PRD.md   │  │ - Write IAC.md  │     │
│  │ - Build prompt  │  │ - Read PLAN.md  │  │ - Update        │     │
│  │ - Spawn agent   │  │ - Read CLAUDE.md│  │   CONTEXT.md    │     │
│  │ - Return result │  │ - Format context│  │ - Track costs   │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│           └────────────────────┴────────────────────┘               │
│                                │                                     │
│                                ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Agent Subprocess                          │   │
│  │                                                              │   │
│  │  claude --print --prompt "..." --tools Bash,Read,Glob       │   │
│  │  codex --print --prompt "..." --tools Bash,Read             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 File Structure

```
agents/
├── DESIGN.md              # Existing - orchestration rationale
├── MCP_DESIGN.md          # This document
├── mcp_server.py          # NEW: MCP server implementation
├── mcp_config.json        # NEW: Server configuration
├── spawner.py             # Existing - reused by MCP server
├── context_loader.py      # Existing - reused by MCP server
├── logger.py              # Existing - reused by MCP server
├── __init__.py            # Update exports
├── IAC.md                 # Auto-generated log
└── CONTEXT.md             # Auto-generated state
```

### 3.3 Data Flow

```
Claude decides to spawn a sub-agent
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. TOOL CALL                                                │
│                                                              │
│  Claude calls: mcp__agents__spawn_claude                     │
│  Parameters: {                                               │
│    "prompt": "Analyze test impact of schema changes",        │
│    "model": "sonnet",                                        │
│    "tools": ["Bash", "Read", "Glob", "Grep"],               │
│    "timeout": 300,                                           │
│    "task_summary": "Test impact analysis"                    │
│  }                                                           │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  2. MCP SERVER RECEIVES CALL                                 │
│                                                              │
│  - Validates parameters against schema                       │
│  - Generates spawn ID (e.g., "sp_a1b2c3d4")                 │
│  - Logs to IAC.md: "Spawn started..."                       │
│  - Updates CONTEXT.md: active_agents += 1                   │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  3. CONTEXT INJECTION                                        │
│                                                              │
│  MCP server automatically prepends:                          │
│  - PRD.md (summary)                                          │
│  - PLAN.md (current iteration)                               │
│  - CLAUDE.md (full)                                          │
│  - ARCHITECTURE.md (overview)                                │
│                                                              │
│  Final prompt = context + original prompt                    │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  4. SUBPROCESS EXECUTION                                     │
│                                                              │
│  MCP server runs:                                            │
│  $ claude --print --model sonnet \                           │
│      --tools Bash,Read,Glob,Grep \                          │
│      --timeout 300 \                                         │
│      --prompt "<context + prompt>"                           │
│                                                              │
│  Captures: stdout, stderr, exit code, duration               │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  5. POST-PROCESSING                                          │
│                                                              │
│  - Parse agent response                                      │
│  - Calculate cost (from token counts)                        │
│  - Log to IAC.md: result summary, duration, cost            │
│  - Update CONTEXT.md: recent_runs, clear active             │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  6. RETURN TO CLAUDE                                         │
│                                                              │
│  MCP server returns:                                         │
│  {                                                           │
│    "spawn_id": "sp_a1b2c3d4",                               │
│    "success": true,                                          │
│    "result": "Agent's full response text...",               │
│    "duration_seconds": 45.2,                                 │
│    "cost_usd": 0.32,                                         │
│    "model": "sonnet",                                        │
│    "tokens": { "input": 12000, "output": 3500 }             │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Tool Specifications

### 4.1 spawn_claude

Spawns a Claude sub-agent with automatic context injection.

```json
{
  "name": "spawn_claude",
  "description": "Spawn a Claude sub-agent to perform a task. Context from PRD.md, PLAN.md, and CLAUDE.md is automatically injected. Use this for code analysis, research, or complex tasks requiring reasoning.",
  "inputSchema": {
    "type": "object",
    "required": ["prompt"],
    "properties": {
      "prompt": {
        "type": "string",
        "description": "The task for the sub-agent to perform"
      },
      "model": {
        "type": "string",
        "enum": ["haiku", "sonnet", "opus"],
        "default": "sonnet",
        "description": "Model to use. haiku=fast/cheap, sonnet=balanced, opus=best"
      },
      "tools": {
        "type": "array",
        "items": { "type": "string" },
        "default": ["Bash", "Read", "Glob", "Grep"],
        "description": "Tools available to the sub-agent"
      },
      "timeout": {
        "type": "integer",
        "default": 300,
        "minimum": 30,
        "maximum": 1800,
        "description": "Timeout in seconds (max 30 minutes)"
      },
      "task_summary": {
        "type": "string",
        "description": "Short description for logging (optional)"
      },
      "include_context": {
        "type": "boolean",
        "default": true,
        "description": "Whether to inject project context"
      },
      "structured_output": {
        "type": "string",
        "description": "Path to JSON schema for structured output (optional)"
      }
    }
  }
}
```

**Example Call:**
```json
{
  "tool": "mcp__agents__spawn_claude",
  "parameters": {
    "prompt": "Analyze all test files and identify which ones reference User.name or User.displayName fields that were removed in v0.5.14",
    "model": "sonnet",
    "tools": ["Bash", "Read", "Glob", "Grep"],
    "timeout": 300,
    "task_summary": "Test impact analysis for schema refactor"
  }
}
```

**Example Response:**
```json
{
  "spawn_id": "sp_a1b2c3d4",
  "success": true,
  "result": "## Test Impact Analysis\n\nFound 3 test files with references to removed fields:\n1. tests/user/profile.spec.ts:45 - User.name\n2. ...",
  "duration_seconds": 67.3,
  "cost_usd": 0.28,
  "model": "claude-sonnet-4-20250514",
  "tokens": {
    "input": 15234,
    "output": 2847
  }
}
```

### 4.2 spawn_codex

Spawns a Codex agent optimized for code execution tasks.

```json
{
  "name": "spawn_codex",
  "description": "Spawn a Codex agent for code execution tasks. Best for running tests, builds, and scripts. Faster but less reasoning capability than Claude.",
  "inputSchema": {
    "type": "object",
    "required": ["prompt"],
    "properties": {
      "prompt": {
        "type": "string",
        "description": "The task for Codex to perform"
      },
      "tools": {
        "type": "array",
        "items": { "type": "string" },
        "default": ["Bash", "Read"],
        "description": "Tools available (Codex typically needs fewer)"
      },
      "timeout": {
        "type": "integer",
        "default": 120,
        "description": "Timeout in seconds"
      },
      "working_directory": {
        "type": "string",
        "description": "Directory to run in (defaults to project root)"
      }
    }
  }
}
```

### 4.3 list_running

Lists currently running agent processes.

```json
{
  "name": "list_running",
  "description": "List all currently running sub-agents",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

**Example Response:**
```json
{
  "agents": [
    {
      "spawn_id": "sp_a1b2c3d4",
      "model": "sonnet",
      "started_at": "2025-11-29T15:30:00Z",
      "elapsed_seconds": 45,
      "task_summary": "Test impact analysis"
    }
  ],
  "count": 1
}
```

### 4.4 get_result

Retrieves the result of a completed agent (useful for async workflows).

```json
{
  "name": "get_result",
  "description": "Get the result of a previously spawned agent by ID",
  "inputSchema": {
    "type": "object",
    "required": ["spawn_id"],
    "properties": {
      "spawn_id": {
        "type": "string",
        "description": "The spawn ID returned from spawn_claude/spawn_codex"
      }
    }
  }
}
```

---

## 5. MCP Server Implementation

### 5.1 Server Skeleton (Python)

```python
#!/usr/bin/env python3
"""
MCP Agent Spawner Server

Exposes agent spawning as MCP tools for Claude Code.
Handles context injection, logging, and result processing.
"""

import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

# MCP SDK imports
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Local imports (reuse existing modules)
from spawner import spawn_claude as _spawn_claude, spawn_codex as _spawn_codex
from context_loader import load_project_context
from logger import log_spawn_start, log_spawn_complete

# Initialize MCP server
server = Server("agents")

# Track running agents
running_agents: dict[str, dict] = {}
completed_agents: dict[str, dict] = {}


@server.list_tools()
async def list_tools() -> list[Tool]:
    """Advertise available tools to Claude Code."""
    return [
        Tool(
            name="spawn_claude",
            description="Spawn a Claude sub-agent with automatic context injection",
            inputSchema={
                "type": "object",
                "required": ["prompt"],
                "properties": {
                    "prompt": {"type": "string"},
                    "model": {"type": "string", "enum": ["haiku", "sonnet", "opus"], "default": "sonnet"},
                    "tools": {"type": "array", "items": {"type": "string"}, "default": ["Bash", "Read", "Glob", "Grep"]},
                    "timeout": {"type": "integer", "default": 300},
                    "task_summary": {"type": "string"},
                    "include_context": {"type": "boolean", "default": True}
                }
            }
        ),
        Tool(
            name="spawn_codex",
            description="Spawn a Codex agent for code execution tasks",
            inputSchema={
                "type": "object",
                "required": ["prompt"],
                "properties": {
                    "prompt": {"type": "string"},
                    "tools": {"type": "array", "default": ["Bash", "Read"]},
                    "timeout": {"type": "integer", "default": 120}
                }
            }
        ),
        Tool(
            name="list_running",
            description="List currently running sub-agents",
            inputSchema={"type": "object", "properties": {}}
        ),
        Tool(
            name="get_result",
            description="Get result of a completed agent",
            inputSchema={
                "type": "object",
                "required": ["spawn_id"],
                "properties": {"spawn_id": {"type": "string"}}
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Handle tool calls from Claude Code."""

    if name == "spawn_claude":
        return await handle_spawn_claude(arguments)
    elif name == "spawn_codex":
        return await handle_spawn_codex(arguments)
    elif name == "list_running":
        return await handle_list_running()
    elif name == "get_result":
        return await handle_get_result(arguments)
    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def handle_spawn_claude(args: dict) -> list[TextContent]:
    """Handle spawn_claude tool call."""
    import uuid

    spawn_id = f"sp_{uuid.uuid4().hex[:8]}"
    prompt = args["prompt"]
    model = args.get("model", "sonnet")
    tools = args.get("tools", ["Bash", "Read", "Glob", "Grep"])
    timeout = args.get("timeout", 300)
    task_summary = args.get("task_summary", prompt[:50] + "...")
    include_context = args.get("include_context", True)

    # Log spawn start
    log_spawn_start(spawn_id, "claude", model, task_summary)
    running_agents[spawn_id] = {
        "model": model,
        "started_at": datetime.utcnow().isoformat(),
        "task_summary": task_summary
    }

    try:
        # Inject context if requested
        if include_context:
            context = load_project_context()
            full_prompt = f"{context}\n\n---\n\n# Your Task\n\n{prompt}"
        else:
            full_prompt = prompt

        # Call existing spawner (runs subprocess)
        start_time = datetime.utcnow()
        result = _spawn_claude(
            prompt=full_prompt,
            model=model,
            tools=tools,
            timeout=timeout
        )
        duration = (datetime.utcnow() - start_time).total_seconds()

        # Log completion
        log_spawn_complete(spawn_id, result.success, duration, result.cost_usd)

        # Store result
        completed_agents[spawn_id] = {
            "success": result.success,
            "result": result.text,
            "duration_seconds": duration,
            "cost_usd": result.cost_usd,
            "model": model
        }

        # Return to Claude
        response = {
            "spawn_id": spawn_id,
            "success": result.success,
            "result": result.text,
            "duration_seconds": round(duration, 1),
            "cost_usd": round(result.cost_usd, 4),
            "model": model
        }

        return [TextContent(type="text", text=json.dumps(response, indent=2))]

    except Exception as e:
        log_spawn_complete(spawn_id, False, 0, 0, error=str(e))
        return [TextContent(type="text", text=json.dumps({
            "spawn_id": spawn_id,
            "success": False,
            "error": str(e)
        }))]
    finally:
        running_agents.pop(spawn_id, None)


async def handle_list_running() -> list[TextContent]:
    """Return list of running agents."""
    agents = []
    now = datetime.utcnow()

    for spawn_id, info in running_agents.items():
        started = datetime.fromisoformat(info["started_at"])
        elapsed = (now - started).total_seconds()
        agents.append({
            "spawn_id": spawn_id,
            "model": info["model"],
            "started_at": info["started_at"],
            "elapsed_seconds": round(elapsed),
            "task_summary": info["task_summary"]
        })

    return [TextContent(type="text", text=json.dumps({
        "agents": agents,
        "count": len(agents)
    }, indent=2))]


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)


if __name__ == "__main__":
    asyncio.run(main())
```

### 5.2 Configuration

**claude_desktop_config.json** (or `.mcp.json` in project root):

```json
{
  "mcpServers": {
    "agents": {
      "command": "python",
      "args": ["agents/mcp_server.py"],
      "cwd": "C:/dev/public-repo/powertimelines",
      "env": {
        "PYTHONIOENCODING": "utf-8"
      }
    }
  }
}
```

---

## 6. Benefits Analysis

### 6.1 Comparison: Before vs After

| Aspect | Before (Python module) | After (MCP Tool) |
|--------|----------------------|------------------|
| **Discovery** | Must read docs to know it exists | Shows in tool list automatically |
| **Invocation** | Remember: Bash + Python + encoding | Just call `mcp__agents__spawn_claude` |
| **Validation** | None until runtime error | Schema validation before execution |
| **Context injection** | Must remember to include | Automatic (include_context=true default) |
| **Logging** | Must remember to check IAC.md | Server logs automatically |
| **Error handling** | Manual UTF-8 workarounds | Server handles encoding |
| **Competing tools** | Task tool looks similar | No ambiguity - one tool for agents |

### 6.2 Failure Mode Analysis

| Failure Mode | Before (Probability) | After (Probability) |
|--------------|---------------------|---------------------|
| Use wrong tool (Task vs agents/) | HIGH (demonstrated) | ZERO (only one option) |
| Forget to inject context | MEDIUM | ZERO (automatic) |
| Forget to log to IAC.md | HIGH | ZERO (automatic) |
| UTF-8 encoding errors | MEDIUM | ZERO (server handles) |
| Wrong parameter format | MEDIUM | ZERO (schema validation) |
| Forget available options | MEDIUM | LOW (schema shows options) |

### 6.3 Cost-Benefit Summary

**Costs:**
- ~200 lines of Python to implement MCP server
- Configuration in claude_desktop_config.json
- MCP SDK dependency

**Benefits:**
- Near-zero failure rate for agent spawning
- Automatic context injection
- Automatic logging
- Schema validation
- No encoding issues
- Clear tool interface

---

## 7. Migration Path

### Phase 1: Implement MCP Server (1-2 hours)
1. Create `mcp_server.py` using skeleton above
2. Add MCP SDK dependency: `pip install mcp`
3. Test locally with `python agents/mcp_server.py`

### Phase 2: Configure Claude Code (5 minutes)
1. Create `.mcp.json` in project root
2. Restart Claude Code
3. Verify `mcp__agents__spawn_claude` appears in tools

### Phase 3: Update Documentation (30 minutes)
1. Update AGENTS.md to reference MCP tool
2. Update CLAUDE.md with new instructions
3. Add migration notes to DESIGN.md

### Phase 4: Deprecate Old Method (optional)
1. Keep Python module for direct scripting use
2. Remove Bash + Python instructions from docs
3. Add warning to `spawn_claude()` when called directly

---

## 8. Future Enhancements

### 8.1 Async/Background Agents

```json
{
  "tool": "mcp__agents__spawn_claude",
  "parameters": {
    "prompt": "Run full test suite",
    "async": true,
    "notify_on_complete": true
  }
}
```

Returns immediately with spawn_id, notifies when complete.

### 8.2 Agent Templates

Pre-defined workflows as tools:

```
mcp__agents__run_tests      - Run test suite with analysis
mcp__agents__review_code    - Code review with checklist
mcp__agents__analyze_deps   - Dependency analysis
```

### 8.3 Cost Budgets

```json
{
  "parameters": {
    "max_cost_usd": 0.50,
    "abort_on_budget_exceeded": true
  }
}
```

### 8.4 Parallel Spawning

```json
{
  "tool": "mcp__agents__spawn_parallel",
  "parameters": {
    "agents": [
      {"prompt": "Analyze auth code", "model": "haiku"},
      {"prompt": "Analyze database code", "model": "haiku"},
      {"prompt": "Analyze API code", "model": "haiku"}
    ],
    "aggregate_results": true
  }
}
```

---

## 9. Conclusion

The MCP Agent Spawner transforms agent orchestration from a **memory-dependent process** to a **tool-driven interface**. This aligns perfectly with the design principle from DESIGN.md:

> "Use programs to create our PMT (Process, Methods, Tools) rather than rely on agents following instructions."

By exposing `spawn_claude` as an MCP tool:
- Claude **cannot** use the wrong spawning mechanism
- Context injection **cannot** be forgotten
- Logging **cannot** be skipped
- Parameters **cannot** be malformed

The result is a deterministic, reliable agent orchestration system.

---

## 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-29 | Initial draft |
