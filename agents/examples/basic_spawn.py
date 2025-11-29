#!/usr/bin/env python3
"""
Basic Agent Spawning Examples

Demonstrates how to use the agent spawner module.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from agents.spawner import spawn_claude, spawn_codex, spawn_codex_stream


def example_claude_basic():
    """Basic Claude invocation."""
    print("=" * 50)
    print("Example 1: Basic Claude invocation")
    print("=" * 50)

    result = spawn_claude(
        "List the main directories in this project",
        model="haiku",  # Use haiku for simple tasks
        tools=["Bash", "Glob"],
    )

    print(f"Success: {result.success}")
    print(f"Response:\n{result.text}")
    print(f"Cost: ${result.cost_usd:.4f}")
    print()


def example_claude_structured():
    """Claude with structured output."""
    print("=" * 50)
    print("Example 2: Claude with structured output")
    print("=" * 50)

    result = spawn_claude(
        "Analyze the test files in tests/production/",
        model="haiku",
        tools=["Glob", "Read"],
        schema="file_analysis",
    )

    print(f"Success: {result.success}")
    if result.structured_output:
        print(f"Files analyzed: {result.structured_output.get('files_analyzed')}")
        print(f"Summary: {result.structured_output.get('summary')}")
    else:
        print(f"Response:\n{result.text}")
    print()


def example_codex_basic():
    """Basic Codex invocation (waits for completion)."""
    print("=" * 50)
    print("Example 3: Basic Codex invocation")
    print("=" * 50)

    result = spawn_codex(
        "How many TypeScript files are in src/?",
        sandbox="read-only",
    )

    print(f"Success: {result.success}")
    print(f"Response:\n{result.text}")
    print()


def example_codex_streaming():
    """Codex with streaming events."""
    print("=" * 50)
    print("Example 4: Codex streaming events")
    print("=" * 50)

    print("Events:")
    for event in spawn_codex_stream(
        "Count the number of .spec.ts files in tests/",
        sandbox="read-only",
    ):
        if event.type == "item.completed":
            if event.is_message:
                print(f"  [MESSAGE] {event.text}")
            elif event.is_command:
                print(f"  [COMMAND] Output: {event.command_output[:50]}...")
        elif event.type == "turn.completed":
            usage = event.data.get("usage", {})
            print(f"  [USAGE] Input: {usage.get('input_tokens', 0)}, Output: {usage.get('output_tokens', 0)}")
    print()


def example_error_handling():
    """Demonstrating error handling."""
    print("=" * 50)
    print("Example 5: Error handling")
    print("=" * 50)

    # Try with a very short timeout
    result = spawn_claude(
        "This should timeout",
        timeout=1,  # 1 second timeout
    )

    if not result.success:
        print(f"Error (expected): {result.error}")
    else:
        print(f"Response: {result.text}")
    print()


if __name__ == "__main__":
    print("\n🤖 Multi-Agent Spawner Examples\n")

    # Run examples
    example_claude_basic()
    example_claude_structured()
    example_codex_basic()
    example_codex_streaming()
    example_error_handling()

    print("Done!")
