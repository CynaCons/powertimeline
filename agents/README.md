# Multi-Agent Orchestration System

This module provides CLI-based spawning and coordination of AI agents (Claude and Codex) for automated development workflows.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Claude)                        │
│                 Reads context, spawns agents                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────────────┐
│   CODEX SUB-AGENT     │       │     CLAUDE SUB-AGENT          │
│   codex exec          │       │     claude -p                 │
│   • OpenAI models     │       │     • Claude models           │
│   • JSONL streaming   │       │     • JSON output             │
│   • Strong sandboxing │       │     • Tool restrictions       │
│   • Best for: testing │       │     • Best for: code tasks    │
└───────────────────────┘       └───────────────────────────────┘
```

## Quick Start

### Spawn a Claude sub-agent
```python
from agents.spawner import spawn_claude

result = spawn_claude(
    prompt="Run the production tests and report results",
    tools=["Bash", "Read", "Glob"],
    model="haiku",  # cheaper for simple tasks
    schema="schemas/test_results.json"
)
print(result.structured_output)
```

### Spawn a Codex sub-agent
```python
from agents.spawner import spawn_codex

for event in spawn_codex(
    prompt="Count TypeScript files in src/",
    sandbox="read-only"
):
    if event.type == "agent_message":
        print(event.text)
```

### Run a predefined workflow
```bash
python agents/workflows/run_tests.py --suite production
python agents/workflows/code_review.py --files src/services/*.ts
```

## Available Agents

| Agent | CLI Command | Model | Output Format | Best For |
|-------|-------------|-------|---------------|----------|
| Codex | `codex exec` | gpt-5.1-codex-max | JSONL streaming | Testing, verification, CI/CD |
| Claude | `claude -p` | claude-opus/sonnet/haiku | JSON | Code tasks, analysis, consistency |

## Directory Structure

```
agents/
├── README.md           # This file - system overview
├── CONTEXT.md          # Live state: active tasks, recent runs
├── HISTORY.md          # Log of all agent runs
├── config.yaml         # Agent defaults and settings
├── __init__.py         # Package exports
├── spawner.py          # Core spawning functions
├── parser.py           # JSONL/JSON response parsing
├── schemas/            # Structured output schemas
│   ├── test_results.json
│   ├── code_review.json
│   └── file_analysis.json
├── workflows/          # Reusable task patterns
│   ├── run_tests.py
│   └── code_review.py
└── examples/           # Usage examples
    └── basic_spawn.py
```

## Schemas

Schemas define structured output formats for agent responses:

### test_results.json
```json
{
  "passed": 42,
  "failed": 3,
  "skipped": 5,
  "failures": [{"test": "...", "error": "...", "file": "..."}],
  "summary": "42 passed, 3 failed"
}
```

### code_review.json
```json
{
  "issues": [{"severity": "high", "file": "...", "line": 42, "message": "..."}],
  "suggestions": ["..."],
  "approved": false
}
```

## Context Files

### CONTEXT.md
Updated by agents after each run. Contains:
- Currently active agents
- Recent run results
- Pending tasks for sub-agents

### HISTORY.md
Append-only log of all agent runs with timestamps, useful for debugging and auditing.

## Configuration

See `config.yaml` for:
- Default models per agent type
- Sandbox settings
- Timeout values
- Working directory defaults

## Integration with Project

This agent system integrates with:
- `PLAN.md` - Tasks and iteration tracking
- `IAC.md` - Inter-agent communication log
- `CLAUDE.md` - Project instructions (references this README)

## CLI Reference

### Claude CLI
```bash
claude -p \                           # Print mode (non-interactive)
  --output-format json \              # JSON output
  --model haiku \                     # Model selection
  --tools "Bash,Read,Glob" \          # Limit available tools
  --json-schema '{"type":...}' \      # Structured output
  "Your prompt here"
```

### Codex CLI
```bash
codex exec \                          # Non-interactive execution
  --json \                            # JSONL streaming output
  --sandbox read-only \               # Sandbox mode
  -C /path/to/project \               # Working directory
  "Your prompt here"
```
