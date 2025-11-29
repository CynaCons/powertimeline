#!/usr/bin/env python3
"""
Code Review Workflow

Spawns a Claude agent to review code changes and report findings.

Usage:
    python agents/workflows/code_review.py --files src/services/*.ts
    python agents/workflows/code_review.py --staged  # Review staged git changes
    python agents/workflows/code_review.py --diff HEAD~1  # Review last commit
"""

import argparse
import subprocess
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from agents.spawner import spawn_claude


def get_staged_diff() -> str:
    """Get git diff of staged changes."""
    result = subprocess.run(
        ["git", "diff", "--cached"],
        capture_output=True,
        text=True,
    )
    return result.stdout


def get_commit_diff(ref: str) -> str:
    """Get git diff for a specific commit or range."""
    result = subprocess.run(
        ["git", "diff", ref],
        capture_output=True,
        text=True,
    )
    return result.stdout


def review_code(
    files: list[str] = None,
    diff: str = None,
    focus: str = None,
    verbose: bool = False,
) -> dict:
    """
    Review code using Claude agent.

    Args:
        files: List of file patterns to review
        diff: Git diff to review
        focus: Specific focus area (security, performance, style)
        verbose: Print detailed output

    Returns:
        Review results dict
    """
    if diff:
        prompt = f"""Review the following code changes:

```diff
{diff[:10000]}  # Truncate very large diffs
```

Provide a code review with:
- Any bugs or issues found
- Security concerns
- Performance considerations
- Style/maintainability suggestions
- Whether you approve the changes

Be thorough but concise."""

    elif files:
        file_list = " ".join(files)
        prompt = f"""Review the code in the following files: {file_list}

Read each file and provide a code review with:
- Any bugs or issues found
- Security concerns
- Performance considerations
- Style/maintainability suggestions
- Overall assessment

Focus on actionable feedback."""

    else:
        prompt = """Review any recent code changes in this repository.

Use git diff HEAD~1 to see recent changes, then provide a review."""

    if focus:
        prompt += f"\n\nFocus especially on: {focus}"

    if verbose:
        print("Starting code review...")
        print(f"Files/diff provided: {'Yes' if (files or diff) else 'No'}")

    result = spawn_claude(
        prompt,
        model="sonnet",  # Use sonnet for better analysis
        tools=["Read", "Glob", "Grep", "Bash"],
        schema="code_review",
    )

    if verbose:
        print(f"\nReview complete:")
        print(result.text)
        if result.structured_output:
            approved = result.structured_output.get("approved", False)
            issues = result.structured_output.get("issues", [])
            print(f"\nApproved: {approved}")
            print(f"Issues found: {len(issues)}")

    # Note: Logging is handled automatically by spawn_claude
    # No manual logging needed here

    return {
        "success": result.success,
        "text": result.text,
        "structured": result.structured_output,
        "approved": result.structured_output.get("approved", False) if result.structured_output else None,
    }


def main():
    parser = argparse.ArgumentParser(description="Run code review via Claude agent")
    parser.add_argument(
        "--files", "-f",
        nargs="+",
        help="Files or patterns to review",
    )
    parser.add_argument(
        "--staged",
        action="store_true",
        help="Review staged git changes",
    )
    parser.add_argument(
        "--diff",
        help="Git ref to diff against (e.g., HEAD~1, main)",
    )
    parser.add_argument(
        "--focus",
        choices=["security", "performance", "style", "bugs"],
        help="Focus area for review",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Verbose output",
    )

    args = parser.parse_args()

    diff_content = None
    if args.staged:
        diff_content = get_staged_diff()
        if not diff_content:
            print("No staged changes to review")
            sys.exit(0)
    elif args.diff:
        diff_content = get_commit_diff(args.diff)

    result = review_code(
        files=args.files,
        diff=diff_content,
        focus=args.focus,
        verbose=args.verbose,
    )

    # Print summary
    if result["structured"]:
        approved = result["structured"].get("approved", False)
        issues = result["structured"].get("issues", [])

        print(f"\n{'✓' if approved else '✗'} Review {'approved' if approved else 'not approved'}")

        if issues:
            print(f"\nIssues ({len(issues)}):")
            for issue in issues[:5]:  # Show first 5
                severity = issue.get("severity", "unknown")
                message = issue.get("message", "")
                file = issue.get("file", "")
                print(f"  [{severity}] {file}: {message}")
            if len(issues) > 5:
                print(f"  ... and {len(issues) - 5} more")
    else:
        print("\n" + result["text"])

    sys.exit(0 if result.get("approved", True) else 1)


if __name__ == "__main__":
    main()
