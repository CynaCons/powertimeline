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
import threading
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, Callable

# Ensure UTF-8 encoding on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# MCP SDK imports
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
    from mcp.server.models import InitializationOptions
    from mcp.server.lowlevel import NotificationOptions
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

# Background thread management for async spawns
background_threads: dict[str, threading.Thread] = {}
background_results: dict[str, dict] = {}


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
                        "description": "Model to use. Typical costs per task: haiku=$0.01-0.05 (fast, simple tasks), sonnet=$0.10-0.50 (balanced, most tasks), opus=$0.50-3.00 (complex reasoning). Actual cost returned in result."
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
                "Spawn a Codex agent for code analysis and documentation tasks. "
                "NOTE: Codex does NOT reliably execute shell commands - use Claude with Bash tool for test execution. "
                "Codex is best for: code review, documentation queries, file analysis. "
                "Estimated cost: ~$0.005 per request."
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


def _run_spawn_claude_background(
    spawn_id: str,
    prompt: str,
    model: str,
    tools: list[str],
    timeout: int,
    task_summary: Optional[str],
    context_level: str,
):
    """Run Claude spawn in background thread."""
    try:
        result: AgentResult = _spawn_claude(
            prompt=prompt,
            model=model,
            tools=tools,
            timeout=timeout,
            task_summary=task_summary,
            context_level=context_level,
        )

        # Store result for later retrieval
        background_results[spawn_id] = {
            "spawn_id": spawn_id,
            "success": result.success,
            "result": sanitize_for_json(result.text),
            "cost_usd": round(result.cost_usd, 4),
            "model": model,
            "completed_at": datetime.utcnow().isoformat() + "Z",
            "status": "completed",
            "error": result.error,
        }

        # Also store in completed_agents for get_result
        completed_agents[spawn_id] = background_results[spawn_id]

    except Exception as e:
        background_results[spawn_id] = {
            "spawn_id": spawn_id,
            "success": False,
            "result": "",
            "cost_usd": 0,
            "model": model,
            "completed_at": datetime.utcnow().isoformat() + "Z",
            "status": "failed",
            "error": str(e),
        }
        completed_agents[spawn_id] = background_results[spawn_id]
    finally:
        # Remove from running agents
        if spawn_id in running_agents:
            del running_agents[spawn_id]


async def handle_spawn_claude(args: dict) -> list[TextContent]:
    """Handle spawn_claude tool call. Always runs async - returns immediately."""
    prompt = args["prompt"]
    model = args.get("model", "sonnet")
    tools = args.get("tools", ["Bash", "Read", "Glob", "Grep"])
    task_summary = args.get("task_summary")
    context_level = args.get("context_level", "standard")

    # Determine timeout: 600 seconds for test tasks, 300 seconds default
    task_label = (task_summary or prompt).lower()
    if "test" in task_label:
        timeout = args.get("timeout", 600)
    else:
        timeout = args.get("timeout", 300)

    # Generate spawn_id
    spawn_id = uuid.uuid4().hex[:8]
    started_at = datetime.utcnow().isoformat() + "Z"

    # Track as running
    running_agents[spawn_id] = {
        "spawn_id": spawn_id,
        "model": model,
        "started_at": started_at,
        "task_summary": task_summary or prompt[:50] + "...",
        "status": "running",
    }

    # Always spawn in background thread and return immediately
    thread = threading.Thread(
        target=_run_spawn_claude_background,
        args=(spawn_id, prompt, model, tools, timeout, task_summary, context_level),
        daemon=True,
    )
    thread.start()
    background_threads[spawn_id] = thread

    response = {
        "spawn_id": spawn_id,
        "status": "running",
        "message": "Agent spawned in background. Use list_running to monitor, get_result to retrieve output.",
        "model": model,
        "started_at": started_at,
        "task_summary": task_summary or prompt[:50] + "...",
    }
    return [TextContent(type="text", text=json.dumps(response, indent=2, ensure_ascii=False))]


def _run_spawn_codex_background(
    spawn_id: str,
    prompt: str,
    sandbox: str,
    timeout: int,
    context_level: str,
):
    """Run Codex spawn in background thread."""
    try:
        result: AgentResult = _spawn_codex(
            prompt=prompt,
            sandbox=sandbox,
            timeout=timeout,
            context_level=context_level,
        )

        # Codex cost estimation: ~$0.005 per request (varies by complexity)
        # Note: Codex doesn't return actual cost, so we estimate
        estimated_cost = 0.005 if result.success else 0.0

        background_results[spawn_id] = {
            "spawn_id": spawn_id,
            "success": result.success,
            "result": sanitize_for_json(result.text),
            "model": "codex",
            "cost_usd": estimated_cost,
            "completed_at": datetime.utcnow().isoformat() + "Z",
            "status": "completed",
            "error": result.error,
        }
        completed_agents[spawn_id] = background_results[spawn_id]

    except Exception as e:
        background_results[spawn_id] = {
            "spawn_id": spawn_id,
            "success": False,
            "result": "",
            "model": "codex",
            "cost_usd": 0.0,
            "completed_at": datetime.utcnow().isoformat() + "Z",
            "status": "failed",
            "error": str(e),
        }
        completed_agents[spawn_id] = background_results[spawn_id]
    finally:
        if spawn_id in running_agents:
            del running_agents[spawn_id]


async def handle_spawn_codex(args: dict) -> list[TextContent]:
    """Handle spawn_codex tool call. Always runs async - returns immediately."""
    prompt = args["prompt"]
    sandbox = args.get("sandbox", "read-only")
    context_level = args.get("context_level", "minimal")

    # Determine timeout: 300 seconds for test tasks, 120 seconds default
    task_label = prompt.lower()
    if "test" in task_label:
        timeout = args.get("timeout", 300)
    else:
        timeout = args.get("timeout", 120)

    spawn_id = uuid.uuid4().hex[:8]
    started_at = datetime.utcnow().isoformat() + "Z"

    running_agents[spawn_id] = {
        "spawn_id": spawn_id,
        "model": "codex",
        "started_at": started_at,
        "task_summary": prompt[:50] + "...",
        "status": "running",
    }

    # Always spawn in background thread and return immediately
    thread = threading.Thread(
        target=_run_spawn_codex_background,
        args=(spawn_id, prompt, sandbox, timeout, context_level),
        daemon=True,
    )
    thread.start()
    background_threads[spawn_id] = thread

    response = {
        "spawn_id": spawn_id,
        "status": "running",
        "message": "Codex agent spawned in background. Use list_running to monitor, get_result to retrieve output.",
        "model": "codex",
        "started_at": started_at,
        "task_summary": prompt[:50] + "...",
    }
    return [TextContent(type="text", text=json.dumps(response, indent=2, ensure_ascii=False))]


async def handle_list_running() -> list[TextContent]:
    """Return list of running agents."""
    agents = []
    now = datetime.utcnow()

    # Get running agents from our in-memory tracking
    for spawn_id, info in running_agents.items():
        started_str = info.get("started_at", "")
        elapsed = 0
        if started_str:
            try:
                started = datetime.fromisoformat(started_str.replace("Z", "+00:00"))
                elapsed = (now - started.replace(tzinfo=None)).total_seconds()
            except:
                pass

        agents.append({
            "spawn_id": spawn_id,
            "model": info.get("model", "unknown"),
            "task_summary": info.get("task_summary", "Unknown task"),
            "started_at": started_str,
            "elapsed_seconds": round(elapsed),
            "status": info.get("status", "running"),
        })

    # Get recent completed agents (last 100 for history)
    recent = list(completed_agents.keys())[-100:]
    recent_details = []
    for sid in recent:
        result = completed_agents.get(sid, {})
        recent_details.append({
            "spawn_id": sid,
            "success": result.get("success"),
            "model": result.get("model"),
            "completed_at": result.get("completed_at"),
            "cost_usd": result.get("cost_usd", 0),
        })

    response = {
        "running_agents": agents,
        "running_count": len(agents),
        "recent_completed": recent_details,
    }

    return [TextContent(type="text", text=json.dumps(response, indent=2, ensure_ascii=False))]


async def handle_get_result(args: dict) -> list[TextContent]:
    """Get result of a completed agent."""
    spawn_id = args["spawn_id"]

    # Check completed agents first (includes background results)
    if spawn_id in completed_agents:
        return [TextContent(type="text", text=json.dumps(completed_agents[spawn_id], indent=2, ensure_ascii=False))]

    # Check if still running in memory
    if spawn_id in running_agents:
        info = running_agents[spawn_id]
        now = datetime.utcnow()
        elapsed = 0
        started_str = info.get("started_at", "")
        if started_str:
            try:
                started = datetime.fromisoformat(started_str.replace("Z", "+00:00"))
                elapsed = (now - started.replace(tzinfo=None)).total_seconds()
            except:
                pass

        return [TextContent(type="text", text=json.dumps({
            "spawn_id": spawn_id,
            "status": "running",
            "message": "Agent is still running. Check back later.",
            "model": info.get("model"),
            "task_summary": info.get("task_summary"),
            "elapsed_seconds": round(elapsed),
        }, indent=2, ensure_ascii=False))]

    # Also check logger for spawns started before this MCP session
    logger = get_logger()
    if spawn_id in logger.active_spawns:
        return [TextContent(type="text", text=json.dumps({
            "spawn_id": spawn_id,
            "status": "running",
            "message": "Agent is still running (from logger). Check back later."
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
        init_options = InitializationOptions(
            server_name="agents",
            server_version="1.0.0",
            capabilities=server.get_capabilities(
                notification_options=NotificationOptions(),
                experimental_capabilities={},
            ),
        )
        await server.run(read_stream, write_stream, init_options)


if __name__ == "__main__":
    asyncio.run(main())
