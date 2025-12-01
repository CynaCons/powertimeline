#!/usr/bin/env python3
"""
MCP Agent Spawner Server v1.4

Exposes agent spawning as MCP tools for Claude Code.
Simplified design with minimal parameters.

Tools:
  spawn_claude(prompt, model?)  - Spawn Claude sub-agent (auto-loads CLAUDE.md)
  spawn_codex(prompt)           - Spawn Codex sub-agent (auto-loads AGENTS.md)
  list()                        - List running agents (compact output)
  result(agent_id)              - Get agent result
  wait_for_agents(timeout?)     - Block until all agents complete, return results

Context is auto-loaded by the respective CLIs:
  - Claude CLI: auto-loads CLAUDE.md
  - Codex CLI: auto-loads AGENTS.md

All logging to IAC.md is automatic via spawner.py.

See MCP_DESIGN.md for architecture documentation.
"""

import asyncio
import json
import subprocess
import sys
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# Ensure UTF-8 encoding on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

IS_WINDOWS = sys.platform == "win32"

# Version (single source of truth)
SERVER_VERSION = "1.4.0"

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

# Add agents directory to path
agents_dir = Path(__file__).parent
sys.path.insert(0, str(agents_dir.parent))

from agents.spawner import spawn_claude as _spawn_claude, spawn_codex as _spawn_codex, AgentResult
# Note: logging and context injection are handled by spawner.py internally

# Initialize MCP server
server = Server("agents")

# Track agents (protected by _agents_lock)
_agents_lock = threading.Lock()
running_agents: dict[str, dict] = {}
completed_agents: dict[str, dict] = {}
background_threads: dict[str, threading.Thread] = {}

# Limit completed_agents to prevent unbounded memory growth
MAX_COMPLETED_AGENTS = 100


def sanitize_for_json(text: str) -> str:
    """Sanitize text for JSON output."""
    if not text:
        return ""
    return text.encode('utf-8', errors='replace').decode('utf-8')


def utc_now_iso() -> str:
    """Get current local timestamp in ISO format (for dev tool convenience)."""
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def _cleanup_completed_agents():
    """Remove oldest entries if over limit (must be called with _agents_lock held)."""
    if len(completed_agents) > MAX_COMPLETED_AGENTS:
        # Remove oldest entries (dict maintains insertion order in Python 3.7+)
        keys_to_remove = list(completed_agents.keys())[:-MAX_COMPLETED_AGENTS]
        for key in keys_to_remove:
            del completed_agents[key]
            background_threads.pop(key, None)  # Also clean up thread reference


def get_workspace_dir() -> Path:
    """Get workspace root directory."""
    return agents_dir.parent


# =============================================================================
# TOOL DEFINITIONS
# =============================================================================

@server.list_tools()
async def list_tools() -> list[Tool]:
    """Advertise available tools."""
    return [
        Tool(
            name="spawn_claude",
            description=(
                "Spawn a Claude sub-agent to perform a task. "
                "Use for: analysis, reasoning, code review, complex tasks. "
                "Context from CLAUDE.md is auto-loaded by Claude CLI."
            ),
            inputSchema={
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
                        "description": "Model: haiku (fast/cheap), sonnet (balanced), opus (best)"
                    },
                    "timeout": {
                        "type": "integer",
                        "default": 600,
                        "description": "Timeout in seconds (default 600 = 10 min). Use 300 for simple tasks, 900 for complex features."
                    }
                }
            }
        ),
        Tool(
            name="spawn_codex",
            description=(
                "Spawn a Codex (GPT-5.1) sub-agent to perform a task. "
                "Use for: any task, especially when Claude rate limit is reached. "
                "Context from AGENTS.md is auto-loaded by Codex CLI."
            ),
            inputSchema={
                "type": "object",
                "required": ["prompt"],
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "The task for the sub-agent to perform"
                    }
                }
            }
        ),
        Tool(
            name="list",
            description="List running and recently completed agents",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="result",
            description="Get the result of a completed agent",
            inputSchema={
                "type": "object",
                "required": ["agent_id"],
                "properties": {
                    "agent_id": {
                        "type": "string",
                        "description": "The agent ID from spawn response"
                    }
                }
            }
        ),
        Tool(
            name="wait_for_agents",
            description=(
                "Block until all running agents complete, then return all results. "
                "Use this instead of polling list(). Saves context window."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "timeout": {
                        "type": "integer",
                        "default": 300,
                        "description": "Max seconds to wait (default 300 = 5 min)"
                    }
                }
            }
        )
    ]


# =============================================================================
# TOOL HANDLERS
# =============================================================================

@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Route tool calls to handlers."""
    try:
        if name == "spawn_claude":
            return await handle_spawn_claude(arguments)
        elif name == "spawn_codex":
            return await handle_spawn_codex(arguments)
        elif name == "list":
            return await handle_list()
        elif name == "result":
            return await handle_result(arguments)
        elif name == "wait_for_agents":
            return await handle_wait_for_agents(arguments)
        else:
            return [TextContent(type="text", text=json.dumps({"error": f"Unknown tool: {name}"}))]
    except Exception as e:
        return [TextContent(type="text", text=json.dumps({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }, indent=2))]


def _run_claude_background(agent_id: str, prompt: str, model: str, timeout: int = 600):
    """Run Claude spawn in background thread."""
    try:
        # Pass task directly - Claude CLI auto-loads CLAUDE.md
        # No extra context injection needed
        result: AgentResult = _spawn_claude(
            prompt=prompt,
            model=model,
            tools=["Bash", "Read", "Write", "Edit", "Glob", "Grep"],
            timeout=timeout,
            context_level="none",  # Claude CLI auto-loads CLAUDE.md
            task_summary=prompt[:50] + "..." if len(prompt) > 50 else prompt,
            dangerously_skip_permissions=True,  # Enable write access (like Codex bypass_sandbox)
        )

        with _agents_lock:
            completed_agents[agent_id] = {
                "agent_id": agent_id,
                "agent_type": "claude",
                "model": model,
                "success": result.success,
                "result": sanitize_for_json(result.text),
                "cost_usd": round(result.cost_usd, 4),
                "completed_at": utc_now_iso(),
                "error": result.error,
            }
            _cleanup_completed_agents()

    except Exception as e:
        with _agents_lock:
            completed_agents[agent_id] = {
                "agent_id": agent_id,
                "agent_type": "claude",
                "model": model,
                "success": False,
                "result": "",
                "cost_usd": 0,
                "completed_at": utc_now_iso(),
                "error": str(e),
            }
    finally:
        with _agents_lock:
            running_agents.pop(agent_id, None)
            background_threads.pop(agent_id, None)  # Clean up thread reference


async def handle_spawn_claude(args: dict) -> list[TextContent]:
    """Handle spawn_claude tool call."""
    prompt = args["prompt"]
    model = args.get("model", "sonnet")
    timeout = args.get("timeout", 600)  # Default 10 minutes

    agent_id = uuid.uuid4().hex[:8]
    started_at = utc_now_iso()

    # Track as running (logging is done by spawner.py)
    with _agents_lock:
        running_agents[agent_id] = {
            "agent_id": agent_id,
            "agent_type": "claude",
            "model": model,
            "started_at": started_at,
            "task": prompt[:100].replace('\n', ' '),  # Sanitize newlines for display
        }

    # Spawn in background (pass original prompt for correct task_summary logging)
    thread = threading.Thread(
        target=_run_claude_background,
        args=(agent_id, prompt, model, timeout),
        daemon=True,
    )
    thread.start()
    with _agents_lock:
        background_threads[agent_id] = thread

    return [TextContent(type="text", text=json.dumps({
        "agent_id": agent_id,
        "agent_type": "claude",
        "model": model,
        "status": "running",
        "message": "Agent spawned. Use 'list' to monitor, 'result' to get output.",
    }, indent=2, ensure_ascii=False))]


def _run_codex_background(agent_id: str, prompt: str):
    """Run Codex spawn in background thread."""
    try:
        # Pass task directly - Codex auto-loads AGENTS.md from project root
        # No extra context injection needed
        result: AgentResult = _spawn_codex(
            prompt=prompt,
            bypass_sandbox=True,  # Use --dangerously-bypass-approvals-and-sandbox for write access
            timeout=300,
            context_level="none",  # Codex auto-loads AGENTS.md
            task_summary=prompt[:50] + "..." if len(prompt) > 50 else prompt,
        )

        with _agents_lock:
            completed_agents[agent_id] = {
                "agent_id": agent_id,
                "agent_type": "codex",
                "success": result.success,
                "result": sanitize_for_json(result.text),
                "cost_usd": 0.005 if result.success else 0,  # Estimate - Codex doesn't report cost
                "completed_at": utc_now_iso(),
                "error": result.error,
            }
            _cleanup_completed_agents()

    except Exception as e:
        with _agents_lock:
            completed_agents[agent_id] = {
                "agent_id": agent_id,
                "agent_type": "codex",
                "success": False,
                "result": "",
                "cost_usd": 0,
                "completed_at": utc_now_iso(),
                "error": str(e),
            }
    finally:
        with _agents_lock:
            running_agents.pop(agent_id, None)
            background_threads.pop(agent_id, None)  # Clean up thread reference


async def handle_spawn_codex(args: dict) -> list[TextContent]:
    """Handle spawn_codex tool call."""
    prompt = args["prompt"]

    agent_id = uuid.uuid4().hex[:8]
    started_at = utc_now_iso()

    # Track as running (logging is done by spawner.py)
    with _agents_lock:
        running_agents[agent_id] = {
            "agent_id": agent_id,
            "agent_type": "codex",
            "started_at": started_at,
            "task": prompt[:100].replace('\n', ' '),  # Sanitize newlines for display
        }

    # Spawn in background (pass original prompt for correct task_summary logging)
    thread = threading.Thread(
        target=_run_codex_background,
        args=(agent_id, prompt),
        daemon=True,
    )
    thread.start()
    with _agents_lock:
        background_threads[agent_id] = thread

    return [TextContent(type="text", text=json.dumps({
        "agent_id": agent_id,
        "agent_type": "codex",
        "status": "running",
        "message": "Agent spawned. Use 'list' to monitor, 'result' to get output.",
    }, indent=2, ensure_ascii=False))]


async def handle_list() -> list[TextContent]:
    """List running agents (compact output to save context window)."""
    now = datetime.now(timezone.utc)

    with _agents_lock:
        running = []
        for agent_id, info in list(running_agents.items()):
            elapsed = 0
            if "started_at" in info:
                try:
                    started = datetime.fromisoformat(info["started_at"].replace("Z", "+00:00"))
                    elapsed = int((now - started).total_seconds())
                except Exception:
                    pass
            # Compact: just ID and elapsed time
            running.append({"id": agent_id, "sec": elapsed})

        # Only last 3 completed IDs (not full details)
        recent_ids = list(completed_agents.keys())[-3:]

    # Minimal output
    return [TextContent(type="text", text=json.dumps({
        "running": running,
        "completed_ids": recent_ids,
        "tip": "Use wait_for_agents() to block until done and get all results"
    }))]


async def handle_result(args: dict) -> list[TextContent]:
    """Get result of a completed agent."""
    agent_id = args["agent_id"]

    with _agents_lock:
        if agent_id in completed_agents:
            return [TextContent(type="text", text=json.dumps(
                completed_agents[agent_id], indent=2, ensure_ascii=False
            ))]

        if agent_id in running_agents:
            info = running_agents[agent_id]
            elapsed = 0
            if "started_at" in info:
                try:
                    started = datetime.fromisoformat(info["started_at"].replace("Z", "+00:00"))
                    elapsed = int((datetime.now(timezone.utc) - started).total_seconds())
                except Exception:
                    pass

            return [TextContent(type="text", text=json.dumps({
                "agent_id": agent_id,
                "status": "running",
                "elapsed_seconds": elapsed,
                "message": "Agent still running. Check back later.",
            }, indent=2, ensure_ascii=False))]

    return [TextContent(type="text", text=json.dumps({
        "agent_id": agent_id,
        "status": "not_found",
        "message": "No agent found with this ID.",
    }, indent=2, ensure_ascii=False))]


async def handle_wait_for_agents(args: dict) -> list[TextContent]:
    """Block until all running agents complete, then return all results.

    This eliminates polling loops and saves context window by returning
    all results in a single response.
    """
    timeout = args.get("timeout", 300)  # Default 5 minutes
    poll_interval = 2  # Check every 2 seconds
    elapsed = 0

    # Track which agents we're waiting for at the start
    with _agents_lock:
        waiting_for = set(running_agents.keys())

    if not waiting_for:
        # No agents running - return any recent results
        with _agents_lock:
            recent = list(completed_agents.items())[-5:]
        return [TextContent(type="text", text=json.dumps({
            "status": "no_agents_running",
            "recent_results": [
                {"id": aid, "success": info.get("success"), "result": info.get("result", "")[:500]}
                for aid, info in recent
            ]
        }, indent=2, ensure_ascii=False))]

    # Wait for all agents to complete
    while elapsed < timeout:
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval

        with _agents_lock:
            still_running = set(running_agents.keys()) & waiting_for
            if not still_running:
                # All done! Gather results
                results = []
                for agent_id in waiting_for:
                    if agent_id in completed_agents:
                        info = completed_agents[agent_id]
                        results.append({
                            "id": agent_id,
                            "type": info.get("agent_type"),
                            "success": info.get("success"),
                            "result": info.get("result", ""),
                            "error": info.get("error"),
                            "cost_usd": info.get("cost_usd", 0),
                        })

                return [TextContent(type="text", text=json.dumps({
                    "status": "all_completed",
                    "elapsed_seconds": elapsed,
                    "results": results
                }, indent=2, ensure_ascii=False))]

    # Timeout - return partial results
    with _agents_lock:
        still_running = list(set(running_agents.keys()) & waiting_for)
        completed_results = []
        for agent_id in waiting_for:
            if agent_id in completed_agents:
                info = completed_agents[agent_id]
                completed_results.append({
                    "id": agent_id,
                    "success": info.get("success"),
                    "result": info.get("result", "")[:500],  # Truncate on timeout
                })

    return [TextContent(type="text", text=json.dumps({
        "status": "timeout",
        "elapsed_seconds": elapsed,
        "still_running": still_running,
        "completed_results": completed_results
    }, indent=2, ensure_ascii=False))]


# =============================================================================
# MAIN
# =============================================================================

async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        init_options = InitializationOptions(
            server_name="agents",
            server_version=SERVER_VERSION,
            capabilities=server.get_capabilities(
                notification_options=NotificationOptions(),
                experimental_capabilities={},
            ),
        )
        await server.run(read_stream, write_stream, init_options)


if __name__ == "__main__":
    asyncio.run(main())
