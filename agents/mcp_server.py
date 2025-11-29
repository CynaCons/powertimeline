#!/usr/bin/env python3
"""
MCP Agent Spawner Server

Exposes agent spawning as MCP tools for Claude Code.
Handles context injection, logging, and result processing deterministically.

This eliminates the failure mode where the orchestrator uses the wrong
spawning mechanism (e.g., Claude Code's built-in Task tool instead of
the project's agents/ module).

Usage:
    python agents/mcp_server.py

Configuration:
    Add to .mcp.json or claude_desktop_config.json

See MCP_DESIGN.md for architecture documentation.
"""

import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

# Ensure UTF-8 encoding on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# MCP SDK imports
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    print("ERROR: MCP SDK not installed. Run: pip install mcp", file=sys.stderr)
    sys.exit(1)

# Add agents directory to path for local imports
agents_dir = Path(__file__).parent
sys.path.insert(0, str(agents_dir.parent))

# Local imports (reuse existing modules)
from agents.spawner import spawn_claude as _spawn_claude, spawn_codex as _spawn_codex, AgentResult
from agents.context_loader import load_project_context, format_prompt_with_context
from agents.logger import get_logger

# Initialize MCP server
server = Server("agents")

# Track running agents (for list_running tool)
running_agents: dict[str, dict] = {}
completed_agents: dict[str, dict] = {}


def sanitize_for_json(text: str) -> str:
    """Sanitize text for JSON output, handling encoding issues."""
    if not text:
        return ""
    # Replace problematic characters
    return text.encode('utf-8', errors='replace').decode('utf-8')


@server.list_tools()
async def list_tools() -> list[Tool]:
    """Advertise available tools to Claude Code."""
    return [
        Tool(
            name="spawn_claude",
            description=(
                "Spawn a Claude sub-agent to perform a task. "
                "Context from PRD.md, PLAN.md, and CLAUDE.md is automatically injected. "
                "Use this for code analysis, research, test running, or complex tasks requiring reasoning. "
                "This is the CORRECT way to spawn sub-agents in this project - do NOT use the built-in Task tool."
            ),
            inputSchema={
                "type": "object",
                "required": ["prompt"],
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "The task for the sub-agent to perform. Be specific and detailed."
                    },
                    "model": {
                        "type": "string",
                        "enum": ["haiku", "sonnet", "opus"],
                        "default": "sonnet",
                        "description": "Model to use. haiku=fast/cheap ($0.01-0.05), sonnet=balanced ($0.10-0.30), opus=best ($0.50-2.00)"
                    },
                    "tools": {
                        "type": "array",
                        "items": {"type": "string"},
                        "default": ["Bash", "Read", "Glob", "Grep"],
                        "description": "Tools available to the sub-agent. Common: Bash, Read, Write, Edit, Glob, Grep"
                    },
                    "timeout": {
                        "type": "integer",
                        "default": 300,
                        "minimum": 30,
                        "maximum": 1800,
                        "description": "Timeout in seconds (default 5 min, max 30 min)"
                    },
                    "task_summary": {
                        "type": "string",
                        "description": "Short description for logging (auto-generated if not provided)"
                    },
                    "context_level": {
                        "type": "string",
                        "enum": ["none", "minimal", "standard", "full"],
                        "default": "standard",
                        "description": "Context injection level. standard=PRD+PLAN+CLAUDE.md, full=+ARCHITECTURE"
                    }
                }
            }
        ),
        Tool(
            name="spawn_codex",
            description=(
                "Spawn a Codex agent for code execution tasks. "
                "Best for running tests, builds, and scripts. "
                "Faster but less reasoning capability than Claude."
            ),
            inputSchema={
                "type": "object",
                "required": ["prompt"],
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "The task for Codex to perform"
                    },
                    "sandbox": {
                        "type": "string",
                        "enum": ["read-only", "workspace-write", "danger-full-access"],
                        "default": "read-only",
                        "description": "Sandbox mode for file system access"
                    },
                    "timeout": {
                        "type": "integer",
                        "default": 120,
                        "description": "Timeout in seconds"
                    },
                    "context_level": {
                        "type": "string",
                        "enum": ["none", "minimal", "standard"],
                        "default": "minimal",
                        "description": "Context injection level (minimal recommended for Codex)"
                    }
                }
            }
        ),
        Tool(
            name="list_running",
            description="List all currently running sub-agents spawned by this server",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="get_result",
            description="Get the result of a previously completed agent by spawn ID",
            inputSchema={
                "type": "object",
                "required": ["spawn_id"],
                "properties": {
                    "spawn_id": {
                        "type": "string",
                        "description": "The spawn ID returned from spawn_claude/spawn_codex"
                    }
                }
            }
        ),
        Tool(
            name="get_context",
            description="Preview the project context that would be injected into agent prompts",
            inputSchema={
                "type": "object",
                "properties": {
                    "level": {
                        "type": "string",
                        "enum": ["minimal", "standard", "full"],
                        "default": "standard",
                        "description": "Context level to preview"
                    }
                }
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Handle tool calls from Claude Code."""
    try:
        if name == "spawn_claude":
            return await handle_spawn_claude(arguments)
        elif name == "spawn_codex":
            return await handle_spawn_codex(arguments)
        elif name == "list_running":
            return await handle_list_running()
        elif name == "get_result":
            return await handle_get_result(arguments)
        elif name == "get_context":
            return await handle_get_context(arguments)
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    except Exception as e:
        error_response = {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }
        return [TextContent(type="text", text=json.dumps(error_response, indent=2))]


async def handle_spawn_claude(args: dict) -> list[TextContent]:
    """Handle spawn_claude tool call."""
    prompt = args["prompt"]
    model = args.get("model", "sonnet")
    tools = args.get("tools", ["Bash", "Read", "Glob", "Grep"])
    timeout = args.get("timeout", 300)
    task_summary = args.get("task_summary")
    context_level = args.get("context_level", "standard")

    # Track as running
    started_at = datetime.utcnow().isoformat() + "Z"

    # Run spawn in thread pool to avoid blocking
    loop = asyncio.get_event_loop()
    result: AgentResult = await loop.run_in_executor(
        None,
        lambda: _spawn_claude(
            prompt=prompt,
            model=model,
            tools=tools,
            timeout=timeout,
            task_summary=task_summary,
            context_level=context_level,
        )
    )

    # Store completed result
    if result.spawn_id:
        completed_agents[result.spawn_id] = {
            "success": result.success,
            "result": sanitize_for_json(result.text),
            "cost_usd": result.cost_usd,
            "model": model,
            "completed_at": datetime.utcnow().isoformat() + "Z"
        }

    # Build response
    response = {
        "spawn_id": result.spawn_id,
        "success": result.success,
        "model": model,
        "cost_usd": round(result.cost_usd, 4),
        "result": sanitize_for_json(result.text),
    }

    if result.error:
        response["error"] = result.error

    return [TextContent(type="text", text=json.dumps(response, indent=2, ensure_ascii=False))]


async def handle_spawn_codex(args: dict) -> list[TextContent]:
    """Handle spawn_codex tool call."""
    prompt = args["prompt"]
    sandbox = args.get("sandbox", "read-only")
    timeout = args.get("timeout", 120)
    context_level = args.get("context_level", "minimal")

    # Run spawn in thread pool
    loop = asyncio.get_event_loop()
    result: AgentResult = await loop.run_in_executor(
        None,
        lambda: _spawn_codex(
            prompt=prompt,
            sandbox=sandbox,
            timeout=timeout,
            context_level=context_level,
        )
    )

    # Store completed result
    if result.spawn_id:
        completed_agents[result.spawn_id] = {
            "success": result.success,
            "result": sanitize_for_json(result.text),
            "model": "codex",
            "completed_at": datetime.utcnow().isoformat() + "Z"
        }

    response = {
        "spawn_id": result.spawn_id,
        "success": result.success,
        "model": "codex",
        "result": sanitize_for_json(result.text),
    }

    if result.error:
        response["error"] = result.error

    return [TextContent(type="text", text=json.dumps(response, indent=2, ensure_ascii=False))]


async def handle_list_running() -> list[TextContent]:
    """Return list of running agents."""
    # Get active spawns from logger
    logger = get_logger()
    agents = []

    now = datetime.utcnow()
    for spawn_id, record in logger.active_spawns.items():
        agents.append({
            "spawn_id": spawn_id,
            "agent": record.agent,
            "model": record.model,
            "task_summary": record.task_summary,
            "started_at": record.started_at,
        })

    response = {
        "running_agents": agents,
        "count": len(agents),
        "recent_completed": list(completed_agents.keys())[-5:]  # Last 5 completed
    }

    return [TextContent(type="text", text=json.dumps(response, indent=2))]


async def handle_get_result(args: dict) -> list[TextContent]:
    """Get result of a completed agent."""
    spawn_id = args["spawn_id"]

    if spawn_id in completed_agents:
        return [TextContent(type="text", text=json.dumps(completed_agents[spawn_id], indent=2, ensure_ascii=False))]

    # Check if still running
    logger = get_logger()
    if spawn_id in logger.active_spawns:
        return [TextContent(type="text", text=json.dumps({
            "spawn_id": spawn_id,
            "status": "running",
            "message": "Agent is still running. Check back later."
        }, indent=2))]

    return [TextContent(type="text", text=json.dumps({
        "spawn_id": spawn_id,
        "status": "not_found",
        "message": "No agent found with this spawn_id. It may have completed before server started."
    }, indent=2))]


async def handle_get_context(args: dict) -> list[TextContent]:
    """Preview project context that would be injected."""
    level = args.get("level", "standard")

    context = load_project_context(
        include_prd=(level in ["standard", "full"]),
        include_plan=(level in ["standard", "full"]),
        include_architecture=(level == "full"),
        include_claude_md=True,
        include_agents_context=True,
    )

    # Truncate for preview
    max_preview = 3000
    if len(context) > max_preview:
        context = context[:max_preview] + f"\n\n... [truncated, {len(context)} total chars]"

    response = {
        "level": level,
        "context_preview": context,
        "total_chars": len(context)
    }

    return [TextContent(type="text", text=json.dumps(response, indent=2, ensure_ascii=False))]


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream)


if __name__ == "__main__":
    asyncio.run(main())
