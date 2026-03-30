# Agent Workflow

How we use Claude Code agents to implement features efficiently.

---

## Process

### 1. Design phase (interactive)
- User and Claude discuss requirements conversationally
- Claude asks clarifying questions on product/UX/permission decisions
- Finalized designs are persisted to `designFiles/` as the source of truth
- No implementation until design is approved

### 2. Implementation phase (delegated)
- Break implementation order into batches of parallel agents
- **Batch by file overlap, not by logical step** — agents that touch the same file go in the same agent to avoid repeated reads and merge conflicts
- Each agent gets a focused prompt referencing the design doc
- Agents run in background; Claude reports status at batch boundaries

### 3. Review phase (automated + user loop)
- After each batch, launch 2 review agents (backend + frontend)
- Claude fixes straightforward issues (bugs, security hardening, code style) without asking
- Claude comes back to user with questions that involve:
  - Product/UX decisions
  - Permission/scope decisions
  - Architecture trade-offs
  - Feature scope (include now vs. defer)
  - Limit/cap choices
- User does NOT need to be in the loop for: obvious bug fixes, naming, type annotations, accessibility fixes

### 4. Commit + next batch
- Commit at batch boundaries with one-line messages referencing the design doc phase
- Proceed to next batch

---

## Token efficiency tips

- **Fewer agents with more work each** — reduces repeated file reads (the biggest token cost)
- **Short agent prompts** — say "read the design doc, implement step X" instead of pasting code snippets
- **Self-review in implementation agents** — tell agents to verify against the design doc before finishing
- **One review pass, not two** — review after implementation, not review + fix + re-review

---

## What the user stays in the loop for

Based on our Phase 4 experience, the user wants to decide:
- Where features live in the UI (e.g. tags in users tab vs. separate page)
- Who can see/do what (permissions, visibility)
- Whether to use existing tools vs. new libraries (e.g. DataTable vs. custom table)
- Numeric limits (max tags, max per user)
- What to include in scope vs. defer
- UX behavior (e.g. what happens on delete, confirmation flows)

The user does NOT want to be asked about:
- Code structure, naming, file organization
- Obvious security fixes
- Performance optimizations
- Accessibility improvements
- TypeScript type issues
