"""
Multi-Agent Orchestration System

Provides CLI-based spawning and coordination of AI agents (Claude and Codex)
for automated development workflows.

Key features:
- Automatic project context injection (PRD, PLAN, CLAUDE.md)
- Automatic logging to IAC.md (Inter-Agent Communication)
- Automatic CONTEXT.md updates

See DESIGN.md for architecture rationale.

Usage:
    from agents import spawn_claude, spawn_codex, AgentResult

    # Spawn Claude for code tasks (auto-injects context, auto-logs)
    result = spawn_claude(
        "Analyze the authentication flow",
        model="haiku",
        context_level="standard",  # none, minimal, standard, full
    )
    print(result.text)
    print(f"Logged as spawn #{result.spawn_id}")

    # Spawn Codex for testing
    result = spawn_codex("Run the test suite", sandbox="read-only")
    print(result.text)
"""

from .spawner import (
    spawn_claude,
    spawn_codex,
    spawn_codex_stream,
    AgentResult,
    CodexEvent,
)
from .parser import (
    parse_claude_response,
    parse_codex_jsonl,
)
from .context_loader import (
    load_project_context,
    load_minimal_context,
    load_full_context,
    format_prompt_with_context,
)
from .logger import (
    log_spawn_start,
    log_spawn_complete,
    get_logger,
)

__version__ = "0.2.0"
__all__ = [
    # Core spawning
    "spawn_claude",
    "spawn_codex",
    "spawn_codex_stream",
    "AgentResult",
    "CodexEvent",
    # Parsing
    "parse_claude_response",
    "parse_codex_jsonl",
    # Context loading
    "load_project_context",
    "load_minimal_context",
    "load_full_context",
    "format_prompt_with_context",
    # Logging
    "log_spawn_start",
    "log_spawn_complete",
    "get_logger",
]
