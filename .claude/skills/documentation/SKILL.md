---
name: documentation
description: Document an iteration after final approval, and write/maintain all project docs as structured Markdown with Mermaid diagrams. Use after a feature/iteration is approved or merged, when updating docs, or when the user asks to document something. Writes to docs/ only.
---
# Documentation

Produce structured Markdown docs (with Mermaid where helpful) and record every
approved iteration. This is the project's memory.

## When to use
- After an iteration/feature is **approved or merged** (mandatory).
- When creating/updating EPICs, stories, tasks, specs, ADRs, or architecture docs.

## Iteration logging (mandatory after approval)
1. Create `docs/iterations/ITER-<YYYY-MM-DD>-<slug>.md` using
   `.claude/templates/iteration.md`.
2. Record: what was built, which spec/story/task IDs it satisfies, key decisions,
   tests added, files changed (summary), and follow-ups.
3. Update the status of the related spec/story/task to `done` and cross-link.
4. If an architectural decision was made, also write an ADR
   (`docs/adr/ADR-<id>-<slug>.md`, template provided).

## Structured Markdown rules
- One H1 title; logical H2/H3 sections; tables for structured data; fenced code
  for code/commands. Keep prose tight and skimmable.
- Front-matter block at top of every doc: `id`, `title`, `status`, `created`,
  `updated`, and cross-links (`epic`, `story`, `task`, `spec` as relevant).

## Mermaid - use whenever a diagram clarifies more than prose
Pick the right type and fence it as ```mermaid:
- **flowchart** - processes/decision flows
- **sequenceDiagram** - request/response and interactions over time
- **classDiagram** / **erDiagram** - data models and relationships
- **stateDiagram-v2** - component/feature states
- **gantt** - iteration/release timelines
Keep diagrams small and labelled; prefer several focused diagrams over one giant one.

## Boundaries
- Write only under `docs/`. Don't modify source code. Don't invent results -
  document what was actually built and approved.
