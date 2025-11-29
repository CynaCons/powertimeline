# Multi-Agent Orchestration System - Design Document

**Version:** 1.0
**Date:** 2025-11-29
**Authors:** User + Claude (Orchestrator)

---

## 1. Problem Statement

### 1.1 The Reliability Problem

AI agents (LLMs) are **probabilistic**, not **deterministic**. When given instructions like "update CONTEXT.md after each task" or "always read PLAN.md before starting", agents:

- Sometimes follow rules, sometimes don't
- Forget context mid-conversation
- Interpret instructions creatively
- Cannot be trusted with critical bookkeeping tasks

This creates a fundamental tension: we want agents to follow processes and maintain documentation, but they are inherently unreliable at doing so consistently.

### 1.2 The Context Problem

Sub-agents spawned via CLI have no memory of:
- Project structure and architecture
- Current development state (PLAN.md)
- Product requirements (PRD.md)
- Coding conventions (CLAUDE.md)

Each spawn starts with zero context, requiring either:
1. Manual context injection (error-prone, verbose)
2. Agent self-discovery (slow, inconsistent)

---

## 2. Design Principles

### 2.1 Maximize Determinism

> "Use programs to create our PMT (Process, Methods, Tools) rather than rely on agents following instructions."

**Principle:** Everything that CAN be done deterministically SHOULD be done deterministically.

| Task | Deterministic (Python) | Probabilistic (Agent) |
|------|------------------------|----------------------|
| Read project context files | Yes | |
| Inject context into prompts | Yes | |
| Log spawn events to IAC.md | Yes | |
| Update CONTEXT.md with results | Yes | |
| Parse and validate outputs | Yes | |
| Analyze code | | Yes |
| Generate solutions | | Yes |
| Reason about architecture | | Yes |

### 2.2 Agents Do What They're Good At

Agents excel at:
- Building context in memory from provided information
- Following well-structured prompts
- Reasoning, analysis, and synthesis
- Code generation and review

Agents are unreliable at:
- Remembering to do administrative tasks
- Consistently following meta-rules
- Maintaining documentation
- Self-reporting their actions

### 2.3 Layered Supervision

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
│   - Supervises Claude (main orchestrator)                   │
│   - Enforces process compliance through review              │
│   - Makes strategic decisions                               │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE (Orchestrator)                     │
│   - Under direct user supervision                           │
│   - Uses Python code to supervise sub-agents               │
│   - Maintains high-level documentation (PLAN.md)           │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    PYTHON ORCHESTRATOR                       │
│   - Deterministic behavior                                  │
│   - Auto-injects project context                            │
│   - Logs all agent interactions (IAC.md)                   │
│   - Updates state files (CONTEXT.md)                       │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUB-AGENTS (Claude/Codex)                │
│   - Focused on specific tasks                               │
│   - Receive pre-built context                               │
│   - Return structured outputs                               │
│   - No responsibility for documentation                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Architecture

### 3.1 Component Overview

```
agents/
├── DESIGN.md           # This document - architecture rationale
├── CONTEXT.md          # Live state (auto-updated by Python)
├── IAC.md              # Inter-Agent Communication log (auto-generated)
├── config.yaml         # Agent configurations
├── __init__.py         # Package exports
├── spawner.py          # Main spawning logic + orchestration
├── context_loader.py   # Loads and formats project context
├── logger.py           # Writes IAC.md, updates CONTEXT.md
├── parser.py           # Parses agent responses
├── schemas/            # Structured output schemas
└── workflows/          # Reusable task patterns
```

### 3.2 Data Flow

```
spawn_claude("Analyze authentication")
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  1. CONTEXT LOADING (context_loader.py)                     │
│     - Read PRD.md, PLAN.md, ARCHITECTURE.md                │
│     - Read CLAUDE.md (coding conventions)                   │
│     - Read CONTEXT.md (current state)                       │
│     - Format into context block                             │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  2. PRE-SPAWN LOGGING (logger.py)                           │
│     - Generate spawn ID                                     │
│     - Write to IAC.md: timestamp, agent, prompt, config    │
│     - Update CONTEXT.md: active_agents                      │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  3. AGENT EXECUTION (spawner.py)                            │
│     - Build CLI command                                     │
│     - Execute subprocess                                    │
│     - Capture output                                        │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  4. POST-SPAWN LOGGING (logger.py)                          │
│     - Write to IAC.md: result, duration, cost              │
│     - Update CONTEXT.md: recent_runs, clear active_agents  │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
              Return AgentResult to caller
```

### 3.3 Context Injection Strategy

The Python orchestrator automatically prepends project context to every prompt:

```
┌─────────────────────────────────────────────────────────────┐
│ # Project Context                                           │
│                                                             │
│ ## Product Requirements (from PRD.md)                       │
│ [Condensed PRD content]                                     │
│                                                             │
│ ## Current Development State (from PLAN.md)                 │
│ [Current iteration, active tasks]                           │
│                                                             │
│ ## Architecture Overview (from ARCHITECTURE.md)             │
│ [Key architectural decisions]                               │
│                                                             │
│ ## Coding Conventions (from CLAUDE.md)                      │
│ [Rules and patterns to follow]                              │
│                                                             │
│ ---                                                         │
│                                                             │
│ # Your Task                                                 │
│ [Original user prompt]                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. File Specifications

### 4.1 IAC.md (Inter-Agent Communication)

**Purpose:** Immutable log of all agent spawns and results.

**Format:**
```markdown
# Inter-Agent Communication Log

## 2025-11-29

### [12:30:45] Spawn #a1b2c3
- **Agent:** Claude (sonnet)
- **Task:** Analyze root directory files
- **Tools:** Bash, Read, Glob, Grep
- **Prompt:**
  ```
  Analyze the files at the root...
  ```
- **Status:** Completed
- **Duration:** 45.2s
- **Cost:** $0.41
- **Result Summary:** Found 12 files to delete, 2 security risks

---

### [12:31:30] Spawn #d4e5f6
...
```

**Rules:**
- Append-only (never edit past entries)
- Auto-generated by Python (never by agents)
- Provides audit trail for debugging

### 4.2 CONTEXT.md (Live State)

**Purpose:** Current system state, updated programmatically.

**Format:**
```markdown
# Agent Context

**Last Updated:** 2025-11-29 12:35:00 UTC

## Active Agents
| ID | Agent | Task | Started |
|----|-------|------|---------|
| a1b2c3 | Claude | Running tests | 12:35:00 |

## Recent Runs (Last 10)
| Time | Agent | Task | Duration | Result |
|------|-------|------|----------|--------|
| 12:30 | Claude | File analysis | 45s | Success |
| 12:15 | Codex | Run tests | 120s | 36 passed |

## Environment
| Key | Value |
|-----|-------|
| Last Test Run | 12:15 - 36 passed |
| Current Iteration | v0.5.13 |
```

**Rules:**
- Overwritten on each update (not appended)
- Auto-generated by Python
- Provides quick status snapshot

---

## 5. Configuration

### 5.1 Context Files to Load

Defined in `config.yaml`:

```yaml
context:
  # Files to inject into every prompt
  always_include:
    - CLAUDE.md        # Coding conventions (full)

  # Files to summarize and inject
  summarize:
    - PRD.md           # Product requirements (first 100 lines)
    - PLAN.md          # Current iteration only
    - ARCHITECTURE.md  # Overview section only

  # Files available but not auto-injected
  on_demand:
    - docs/SRS_DB.md   # Database schema
    - CONTRIBUTING.md  # Contribution guidelines
```

### 5.2 Logging Configuration

```yaml
logging:
  iac_file: "IAC.md"
  context_file: "CONTEXT.md"
  max_recent_runs: 10
  log_prompts: true        # Include full prompts in IAC
  log_responses: false     # Only log summaries (responses can be large)
```

---

## 6. Rationale

### 6.1 Why Not Trust Agents with Documentation?

**Experiment:** Ask agent to "update CONTEXT.md after completing your task"

**Results:**
- 60% of the time: Agent forgets
- 20% of the time: Agent updates incorrectly
- 15% of the time: Agent updates with wrong format
- 5% of the time: Works as expected

**Conclusion:** 95% failure rate is unacceptable for critical processes.

### 6.2 Why Inject Context vs Let Agent Discover?

| Approach | Time | Consistency | Token Cost |
|----------|------|-------------|------------|
| Agent reads files itself | 30-60s | Low | High (reads everything) |
| Pre-injected context | 0s | High | Medium (curated content) |

### 6.3 Why Log Everything?

**Debugging:** When an agent produces unexpected results, the log shows:
- Exact prompt sent
- Context that was injected
- Full response received
- Timing and cost data

**Auditing:** Track agent usage, costs, and patterns over time.

**Continuity:** New sessions can review what previous agents did.

---

## 7. Future Considerations

### 7.1 Potential Enhancements

1. **Smart Context Selection:** Use embeddings to select relevant context based on prompt
2. **Result Validation:** Schema validation on structured outputs
3. **Retry Logic:** Automatic retry on failures with adjusted prompts
4. **Cost Tracking:** Aggregate cost reporting and budgets
5. **Parallel Orchestration:** Spawn multiple agents and aggregate results

### 7.2 Extraction to Standalone Package

When this system stabilizes, it can be extracted to a separate repository:
- `github.com/user/agent-orchestrator`
- Published as Python package
- Reusable across projects

---

## 8. Glossary

| Term | Definition |
|------|------------|
| **Orchestrator** | The main Claude instance under user supervision |
| **Sub-agent** | A CLI-spawned agent (Claude or Codex) |
| **Context injection** | Pre-pending project context to prompts |
| **IAC** | Inter-Agent Communication log |
| **Deterministic** | Behavior that is predictable and repeatable |
| **Probabilistic** | Behavior that varies based on model inference |

---

## 9. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-29 | Initial design document |
