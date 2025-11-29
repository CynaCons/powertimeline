"""
Context Loader Module

Loads and formats project context files for injection into agent prompts.
This ensures agents always have consistent, curated context without
relying on them to read files themselves.
"""

import re
from pathlib import Path
from typing import Optional


def get_workspace_dir() -> Path:
    """Get the workspace root directory (parent of agents/)."""
    return Path(__file__).parent.parent


def read_file_safe(path: Path, max_lines: Optional[int] = None) -> str:
    """Read a file safely, returning empty string if not found."""
    try:
        content = path.read_text(encoding='utf-8')
        if max_lines:
            lines = content.split('\n')[:max_lines]
            content = '\n'.join(lines)
            if len(lines) == max_lines:
                content += '\n\n[... truncated ...]'
        return content
    except (FileNotFoundError, PermissionError):
        return ""


def extract_current_iteration(plan_content: str) -> str:
    """Extract only the current (first non-completed) iteration from PLAN.md."""
    lines = plan_content.split('\n')
    result = []
    in_iteration = False
    iteration_count = 0

    for line in lines:
        # Detect iteration headers (## v0.5.x or similar)
        if re.match(r'^##\s+v?\d+\.\d+', line):
            if in_iteration:
                # We've finished the first iteration, stop
                break
            in_iteration = True
            iteration_count += 1
            result.append(line)
        elif in_iteration:
            # Check if this iteration is marked complete
            if '[x]' in line.lower() and 'complete' in line.lower():
                # This iteration is done, look for next one
                in_iteration = False
                result = []
                continue
            result.append(line)

    if result:
        return '\n'.join(result)
    return "[No active iteration found]"


def extract_section(content: str, section_name: str, max_lines: int = 50) -> str:
    """Extract a specific section from a markdown file."""
    lines = content.split('\n')
    result = []
    in_section = False
    section_pattern = re.compile(rf'^#+\s+{re.escape(section_name)}', re.IGNORECASE)

    for line in lines:
        if section_pattern.match(line):
            in_section = True
            result.append(line)
        elif in_section:
            # Stop at next heading of same or higher level
            if re.match(r'^#+\s+', line) and not line.startswith('###'):
                break
            result.append(line)
            if len(result) >= max_lines:
                result.append('\n[... truncated ...]')
                break

    return '\n'.join(result) if result else ""


def load_project_context(
    include_prd: bool = True,
    include_plan: bool = True,
    include_architecture: bool = False,
    include_claude_md: bool = True,
    include_agents_context: bool = True,
    max_prd_lines: int = 80,
    max_architecture_lines: int = 60,
) -> str:
    """
    Load and format project context for injection into agent prompts.

    Args:
        include_prd: Include product requirements
        include_plan: Include current iteration from PLAN.md
        include_architecture: Include architecture overview
        include_claude_md: Include coding conventions
        include_agents_context: Include current agent context
        max_prd_lines: Maximum lines to include from PRD
        max_architecture_lines: Maximum lines from architecture

    Returns:
        Formatted context string ready for prompt injection
    """
    workspace = get_workspace_dir()
    sections = []

    sections.append("# Project Context\n")
    sections.append("This context is automatically injected. Use it to understand the project.\n")

    # CLAUDE.md - Coding conventions (always concise)
    if include_claude_md:
        claude_md = read_file_safe(workspace / "CLAUDE.md")
        if claude_md:
            sections.append("## Coding Conventions (CLAUDE.md)\n")
            sections.append(claude_md)
            sections.append("")

    # PRD.md - Product requirements (summarized)
    if include_prd:
        prd = read_file_safe(workspace / "PRD.md", max_lines=max_prd_lines)
        if prd:
            sections.append("## Product Requirements (PRD.md - Summary)\n")
            sections.append(prd)
            sections.append("")

    # PLAN.md - Current iteration only
    if include_plan:
        plan = read_file_safe(workspace / "PLAN.md")
        if plan:
            current = extract_current_iteration(plan)
            sections.append("## Current Development State (PLAN.md)\n")
            sections.append(current)
            sections.append("")

    # ARCHITECTURE.md - Overview only
    if include_architecture:
        arch = read_file_safe(workspace / "ARCHITECTURE.md", max_lines=max_architecture_lines)
        if arch:
            sections.append("## Architecture Overview\n")
            sections.append(arch)
            sections.append("")

    # agents/CONTEXT.md - Current agent state
    if include_agents_context:
        context_md = read_file_safe(Path(__file__).parent / "CONTEXT.md")
        if context_md:
            sections.append("## Current Agent State (agents/CONTEXT.md)\n")
            sections.append(context_md)
            sections.append("")

    return '\n'.join(sections)


def load_minimal_context() -> str:
    """
    Load minimal context for simple/quick tasks.
    Only includes CLAUDE.md conventions.
    """
    workspace = get_workspace_dir()
    claude_md = read_file_safe(workspace / "CLAUDE.md")

    if claude_md:
        return f"# Coding Conventions\n\n{claude_md}\n"
    return ""


def load_full_context() -> str:
    """
    Load full context for complex tasks.
    Includes all available context files.
    """
    return load_project_context(
        include_prd=True,
        include_plan=True,
        include_architecture=True,
        include_claude_md=True,
        include_agents_context=True,
    )


def format_prompt_with_context(
    prompt: str,
    context: Optional[str] = None,
    context_level: str = "standard",
) -> str:
    """
    Format a prompt with injected context.

    Args:
        prompt: The user's original prompt
        context: Pre-loaded context (if None, loads based on level)
        context_level: "none", "minimal", "standard", or "full"

    Returns:
        Formatted prompt with context prepended
    """
    if context_level == "none":
        return prompt

    if context is None:
        if context_level == "minimal":
            context = load_minimal_context()
        elif context_level == "full":
            context = load_full_context()
        else:  # standard
            context = load_project_context()

    if not context:
        return prompt

    return f"""{context}

---

# Your Task

{prompt}"""
