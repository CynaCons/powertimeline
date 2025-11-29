"""
Response Parser Module

Provides functions for parsing Claude JSON and Codex JSONL responses.
"""

import json
from typing import Optional, Any

# Import types from spawner (avoiding circular import by using TYPE_CHECKING)
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .spawner import AgentResult, CodexEvent


def parse_claude_response(response_text: str) -> "AgentResult":
    """
    Parse a Claude CLI JSON response.

    Args:
        response_text: Raw JSON response from Claude CLI

    Returns:
        AgentResult with parsed data
    """
    from .spawner import AgentResult

    try:
        data = json.loads(response_text)

        return AgentResult(
            success=data.get("type") == "result" and data.get("subtype") == "success",
            text=data.get("result", ""),
            structured_output=data.get("structured_output"),
            session_id=data.get("session_id"),
            duration_ms=data.get("duration_ms", 0),
            cost_usd=data.get("total_cost_usd", 0.0),
            usage=data.get("usage", {}),
            error=None if data.get("subtype") == "success" else data.get("result"),
            raw_response=data,
        )

    except json.JSONDecodeError as e:
        return AgentResult(
            success=False,
            text="",
            error=f"Failed to parse JSON response: {e}",
        )


def parse_codex_event(line: str) -> Optional["CodexEvent"]:
    """
    Parse a single JSONL line from Codex output.

    Args:
        line: A single line of JSONL output

    Returns:
        CodexEvent if parsing succeeds, None otherwise
    """
    from .spawner import CodexEvent

    try:
        data = json.loads(line)
        event_type = data.get("type", "unknown")
        return CodexEvent(type=event_type, data=data)
    except json.JSONDecodeError:
        return None


def parse_codex_jsonl(jsonl_text: str) -> list["CodexEvent"]:
    """
    Parse complete JSONL output from Codex.

    Args:
        jsonl_text: Complete JSONL output (multiple lines)

    Returns:
        List of CodexEvent objects
    """
    events = []
    for line in jsonl_text.strip().split("\n"):
        line = line.strip()
        if line:
            event = parse_codex_event(line)
            if event:
                events.append(event)
    return events


def extract_final_message(events: list["CodexEvent"]) -> Optional[str]:
    """
    Extract the final agent message from a list of Codex events.

    Args:
        events: List of CodexEvent objects

    Returns:
        The final message text, or None if not found
    """
    for event in reversed(events):
        if event.is_message:
            return event.text
    return None


def extract_command_outputs(events: list["CodexEvent"]) -> list[dict]:
    """
    Extract all command executions from Codex events.

    Args:
        events: List of CodexEvent objects

    Returns:
        List of dicts with command, output, and exit_code
    """
    commands = []
    for event in events:
        if event.is_command and event.type == "item.completed":
            item = event.data.get("item", {})
            commands.append({
                "command": item.get("command"),
                "output": item.get("aggregated_output"),
                "exit_code": item.get("exit_code"),
            })
    return commands


def extract_usage(events: list["CodexEvent"]) -> dict:
    """
    Extract token usage from Codex events.

    Args:
        events: List of CodexEvent objects

    Returns:
        Usage dict with input_tokens, output_tokens, etc.
    """
    for event in events:
        if event.type == "turn.completed":
            return event.data.get("usage", {})
    return {}
