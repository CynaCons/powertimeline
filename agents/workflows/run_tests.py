#!/usr/bin/env python3
"""
Run Tests Workflow

Spawns an agent to run Playwright tests and report structured results.

Usage:
    python agents/workflows/run_tests.py --suite production
    python agents/workflows/run_tests.py --suite home --suite admin
    python agents/workflows/run_tests.py --file tests/production/01-smoke.spec.ts
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from agents.spawner import spawn_claude, spawn_codex, append_history, update_context


def run_tests(
    suites: list[str] = None,
    files: list[str] = None,
    agent: str = "codex",
    verbose: bool = False,
) -> dict:
    """
    Run Playwright tests using an agent.

    Args:
        suites: Test suite names (e.g., ["production", "home"])
        files: Specific test files to run
        agent: Agent to use ("codex" or "claude")
        verbose: Print detailed output

    Returns:
        Parsed test results dict
    """
    # Build test command
    if files:
        test_targets = " ".join(files)
    elif suites:
        test_targets = " ".join([f"tests/{s}" for s in suites])
    else:
        test_targets = "tests/"

    prompt = f"""Run the following Playwright tests and report the results:

npx playwright test {test_targets} --reporter=list

After running, provide a summary with:
- Number of tests passed, failed, and skipped
- Details of any failures (test name, file, error message)
- Overall summary

Be concise but complete."""

    if verbose:
        print(f"Running tests: {test_targets}")
        print(f"Using agent: {agent}")

    if agent == "codex":
        result = spawn_codex(prompt, sandbox="read-only")
    else:
        result = spawn_claude(
            prompt,
            model="haiku",  # Cheaper for simple test runs
            tools=["Bash", "Read"],
            schema="test_results",
        )

    if verbose:
        print(f"\nResult: {result.text}")
        if result.structured_output:
            print(f"Structured: {result.structured_output}")

    # Log to history
    suite_str = ", ".join(suites) if suites else ", ".join(files) if files else "all"
    append_history(
        agent=agent.capitalize(),
        task=f"Run {suite_str} tests",
        command=f"npx playwright test {test_targets}",
        result=result.text[:100] + "..." if len(result.text) > 100 else result.text,
    )

    return {
        "success": result.success,
        "text": result.text,
        "structured": result.structured_output,
    }


def main():
    parser = argparse.ArgumentParser(description="Run Playwright tests via agent")
    parser.add_argument(
        "--suite", "-s",
        action="append",
        dest="suites",
        help="Test suite to run (e.g., production, home, admin)",
    )
    parser.add_argument(
        "--file", "-f",
        action="append",
        dest="files",
        help="Specific test file to run",
    )
    parser.add_argument(
        "--agent", "-a",
        choices=["codex", "claude"],
        default="codex",
        help="Agent to use (default: codex)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Verbose output",
    )

    args = parser.parse_args()

    if not args.suites and not args.files:
        args.suites = ["production"]  # Default to production tests

    result = run_tests(
        suites=args.suites,
        files=args.files,
        agent=args.agent,
        verbose=args.verbose,
    )

    # Exit with appropriate code
    if result["success"]:
        print("\n✓ Tests completed successfully")
        sys.exit(0)
    else:
        print("\n✗ Test run failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
