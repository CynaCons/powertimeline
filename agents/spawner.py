"""
Agent Spawner Module

Provides functions for spawning Claude and Codex CLI agents programmatically.
Automatically injects project context and logs all interactions.

See DESIGN.md for architecture rationale.
"""

import json
import subprocess
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Iterator, Optional, Any

# Windows compatibility: use shell=True for .cmd files
IS_WINDOWS = sys.platform == "win32"

from .parser import parse_claude_response, parse_codex_event
from .context_loader import format_prompt_with_context, load_project_context
from .logger import log_spawn_start, log_spawn_complete


@dataclass
class AgentResult:
    """Result from a Claude agent invocation."""
    success: bool
    text: str
    structured_output: Optional[dict] = None
    session_id: Optional[str] = None
    spawn_id: Optional[str] = None  # For tracking in logs
    duration_ms: int = 0
    cost_usd: float = 0.0
    usage: dict = field(default_factory=dict)
    error: Optional[str] = None
    raw_response: Optional[dict] = None


@dataclass
class CodexEvent:
    """Event from a Codex agent JSONL stream."""
    type: str
    data: dict = field(default_factory=dict)

    # Convenience properties for common event types
    @property
    def is_message(self) -> bool:
        return self.type == "item.completed" and self.data.get("item", {}).get("type") == "agent_message"

    @property
    def is_command(self) -> bool:
        return self.data.get("item", {}).get("type") == "command_execution"

    @property
    def text(self) -> Optional[str]:
        if self.is_message:
            return self.data.get("item", {}).get("text")
        return None

    @property
    def command_output(self) -> Optional[str]:
        if self.is_command:
            return self.data.get("item", {}).get("aggregated_output")
        return None


def get_agents_dir() -> Path:
    """Get the agents directory path."""
    return Path(__file__).parent


def get_workspace_dir() -> Path:
    """Get the workspace root directory."""
    return get_agents_dir().parent


def load_schema(schema_name: str) -> Optional[str]:
    """Load a JSON schema from the schemas directory."""
    schema_path = get_agents_dir() / "schemas" / f"{schema_name}.json"
    if schema_path.exists():
        return schema_path.read_text(encoding='utf-8')
    return None


def spawn_claude(
    prompt: str,
    *,
    model: str = "sonnet",
    tools: Optional[list[str]] = None,
    schema: Optional[str] = None,
    schema_json: Optional[str] = None,
    working_dir: Optional[str] = None,
    timeout: int = 300,
    dangerously_skip_permissions: bool = False,
    context_level: str = "standard",
    task_summary: Optional[str] = None,
) -> AgentResult:
    """
    Spawn a Claude CLI agent and wait for completion.

    Automatically:
    - Injects project context (PRD, PLAN, CLAUDE.md, etc.)
    - Logs spawn start to IAC.md
    - Logs completion to IAC.md
    - Updates CONTEXT.md

    Args:
        prompt: The task/instruction for the agent
        model: Model to use (opus, sonnet, haiku)
        tools: List of tools to allow (e.g., ["Bash", "Read", "Glob"])
        schema: Name of schema file in schemas/ directory (without .json)
        schema_json: Raw JSON schema string (alternative to schema)
        working_dir: Working directory for the agent
        timeout: Timeout in seconds
        dangerously_skip_permissions: Skip permission checks (use in sandboxed env only)
        context_level: "none", "minimal", "standard", or "full"
        task_summary: Optional short description for logging

    Returns:
        AgentResult with the agent's response
    """
    start_time = time.time()

    # Build the full prompt with context injection
    full_prompt = format_prompt_with_context(prompt, context_level=context_level)

    # Log spawn start
    spawn_id = log_spawn_start(
        agent="Claude",
        model=model,
        prompt=prompt,  # Log original prompt, not the full one with context
        tools=tools or [],
        task_summary=task_summary,
    )

    # Build CLI command
    cmd = ["claude", "-p", "--output-format", "json"]

    # Model selection
    cmd.extend(["--model", model])

    # Tool restrictions
    if tools:
        cmd.extend(["--tools", ",".join(tools)])

    # JSON schema for structured output
    if schema:
        schema_content = load_schema(schema)
        if schema_content:
            cmd.extend(["--json-schema", schema_content])
    elif schema_json:
        cmd.extend(["--json-schema", schema_json])

    # Permission bypass (for sandboxed environments)
    if dangerously_skip_permissions:
        cmd.append("--dangerously-skip-permissions")

    # Set working directory
    cwd = working_dir or str(get_workspace_dir())

    try:
        result = subprocess.run(
            cmd,
            input=full_prompt,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=cwd,
            shell=IS_WINDOWS,
            encoding='utf-8',
            errors='replace',
        )

        duration = time.time() - start_time

        if result.returncode != 0 and not result.stdout:
            error_msg = result.stderr or f"Exit code {result.returncode}"
            log_spawn_complete(
                spawn_id=spawn_id,
                success=False,
                result_text="",
                duration_seconds=duration,
                error=error_msg,
            )
            return AgentResult(
                success=False,
                text="",
                spawn_id=spawn_id,
                error=error_msg,
            )

        agent_result = parse_claude_response(result.stdout)
        agent_result.spawn_id = spawn_id

        # Log completion
        log_spawn_complete(
            spawn_id=spawn_id,
            success=agent_result.success,
            result_text=agent_result.text,
            duration_seconds=duration,
            cost_usd=agent_result.cost_usd,
            error=agent_result.error,
        )

        return agent_result

    except subprocess.TimeoutExpired:
        duration = time.time() - start_time
        error_msg = f"Agent timed out after {timeout} seconds"
        log_spawn_complete(
            spawn_id=spawn_id,
            success=False,
            result_text="",
            duration_seconds=duration,
            error=error_msg,
        )
        return AgentResult(
            success=False,
            text="",
            spawn_id=spawn_id,
            error=error_msg,
        )
    except Exception as e:
        duration = time.time() - start_time
        error_msg = str(e)
        log_spawn_complete(
            spawn_id=spawn_id,
            success=False,
            result_text="",
            duration_seconds=duration,
            error=error_msg,
        )
        return AgentResult(
            success=False,
            text="",
            spawn_id=spawn_id,
            error=error_msg,
        )


def spawn_codex(
    prompt: str,
    *,
    sandbox: str = "read-only",
    working_dir: Optional[str] = None,
    timeout: int = 300,
    full_auto: bool = False,
    context_level: str = "none",
    task_summary: Optional[str] = None,
) -> AgentResult:
    """
    Spawn a Codex CLI agent and wait for completion.

    This collects all JSONL events and returns the final result.
    For streaming, use spawn_codex_stream() instead.

    Note: Codex automatically loads AGENTS.md from the project root,
    so context_level defaults to "none" to avoid duplicate/conflicting context.

    Args:
        prompt: The task/instruction for the agent
        sandbox: Sandbox mode (read-only, workspace-write, danger-full-access)
        working_dir: Working directory for the agent
        timeout: Timeout in seconds
        full_auto: Enable full-auto mode (low-friction sandboxed execution)
        context_level: "none" (default), "minimal", "standard", or "full"
        task_summary: Optional short description for logging

    Returns:
        AgentResult with the agent's final response
    """
    start_time = time.time()

    # Codex loads AGENTS.md automatically, so we default to no additional context.
    # If context_level is not "none", we still inject (for backwards compatibility).
    full_prompt = format_prompt_with_context(prompt, context_level=context_level)

    # Log spawn start
    spawn_id = log_spawn_start(
        agent="Codex",
        model="gpt-5.1-codex-max",
        prompt=prompt,
        tools=[f"sandbox:{sandbox}"],
        task_summary=task_summary,
    )

    events = list(_spawn_codex_stream_internal(
        full_prompt,
        sandbox=sandbox,
        working_dir=working_dir,
        timeout=timeout,
        full_auto=full_auto,
    ))

    duration = time.time() - start_time

    # Extract final message from events
    final_text = ""
    usage = {}
    session_id = None
    error = None

    for event in events:
        if event.type == "thread.started":
            session_id = event.data.get("thread_id")
        elif event.is_message:
            final_text = event.text or ""
        elif event.type == "turn.completed":
            usage = event.data.get("usage", {})
        elif event.type == "error":
            error = event.data.get("message")

    success = error is None and final_text != ""

    # Log completion
    log_spawn_complete(
        spawn_id=spawn_id,
        success=success,
        result_text=final_text,
        duration_seconds=duration,
        error=error,
    )

    return AgentResult(
        success=success,
        text=final_text,
        spawn_id=spawn_id,
        session_id=session_id,
        usage=usage,
        error=error,
    )


def spawn_codex_stream(
    prompt: str,
    *,
    sandbox: str = "read-only",
    working_dir: Optional[str] = None,
    timeout: int = 300,
    full_auto: bool = False,
    context_level: str = "minimal",
) -> Iterator[CodexEvent]:
    """
    Spawn a Codex CLI agent and stream events as they arrive.

    Note: This function does NOT log to IAC.md (use spawn_codex for logged execution).

    Args:
        prompt: The task/instruction for the agent
        sandbox: Sandbox mode (read-only, workspace-write, danger-full-access)
        working_dir: Working directory for the agent
        timeout: Timeout in seconds
        full_auto: Enable full-auto mode
        context_level: "none", "minimal", "standard", or "full"

    Yields:
        CodexEvent objects as they arrive from the agent
    """
    # Build the full prompt with context injection
    full_prompt = format_prompt_with_context(prompt, context_level=context_level)

    yield from _spawn_codex_stream_internal(
        full_prompt,
        sandbox=sandbox,
        working_dir=working_dir,
        timeout=timeout,
        full_auto=full_auto,
    )


def _spawn_codex_stream_internal(
    prompt: str,
    *,
    sandbox: str = "read-only",
    working_dir: Optional[str] = None,
    timeout: int = 300,
    full_auto: bool = False,
) -> Iterator[CodexEvent]:
    """Internal streaming implementation without context injection."""
    cmd = ["codex", "exec", "--json"]

    # Sandbox mode
    cmd.extend(["--sandbox", sandbox])

    # Working directory
    cwd = working_dir or str(get_workspace_dir())
    cmd.extend(["-C", cwd])

    # Full auto mode
    if full_auto:
        cmd.append("--full-auto")

    # Use "-" to read prompt from stdin (more reliable on Windows)
    cmd.append("-")

    try:
        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=cwd,
            shell=IS_WINDOWS,
            encoding='utf-8',
            errors='replace',
        )

        # Send prompt via stdin
        if proc.stdin:
            proc.stdin.write(prompt)
            proc.stdin.close()

        if proc.stdout:
            for line in proc.stdout:
                line = line.strip()
                if line:
                    event = parse_codex_event(line)
                    if event:
                        yield event

        proc.wait(timeout=timeout)

    except subprocess.TimeoutExpired:
        proc.kill()
        yield CodexEvent(type="error", data={"message": f"Timed out after {timeout}s"})
    except Exception as e:
        yield CodexEvent(type="error", data={"message": str(e)})
