---
name: spec-authoring
description: Author a formal specification for a feature before any code. Use when starting a new feature, capturing requirements, or when the user mentions a spec, EPIC, user story, requirement, or "what should we build". Produces structured Markdown in docs/ with Mermaid where useful.
---
# Spec Authoring (Spec-Driven Development)

Turn a request into a complete, testable specification. **No code is written by
this skill.** Output structured Markdown only.

## When to use
A new feature, change, or capability is requested and no approved spec exists.

## Procedure
1. Clarify the **problem and the business outcome** first (Fit-for-Purpose). If
   the goal is unclear, ask exactly one focused question; otherwise proceed.
2. Decide the level: **EPIC** (large initiative), **User Story** (one user-facing
   capability), or **Task** (a unit of work under a story). Large requests
   decompose top-down: EPIC → Stories → Tasks.
3. Write the document(s) using the matching template in `.claude/templates/`:
   - EPIC → `docs/epics/EPIC-<id>-<slug>.md`
   - Story → `docs/stories/US-<id>-<slug>.md`
   - Task → `docs/tasks/TASK-<id>-<slug>.md`
   - Detailed technical spec → `docs/specs/SPEC-<id>-<slug>.md`
4. Every spec MUST contain: context/problem, goal & business value, **acceptance
   criteria in Given/When/Then**, scope, **explicit non-goals (YAGNI)**,
   dependencies, and `status: draft`.
5. Add a **Mermaid** diagram when a flow, state, sequence, or data model is
   clearer visually (use the `documentation` skill's diagram guidance).
6. Apply KISS/YAGNI: cut anything not required by the stated outcome; list cut
   items under Non-Goals so the decision is visible.
7. Cross-link: stories reference their EPIC; tasks reference their story.
8. End by asking the user to review and approve. **Do not change `status` to
   `approved` yourself** - approval is the user's gate.

## IDs
Use zero-padded sequential IDs per type (EPIC-001, US-001, TASK-001, SPEC-001).
Check the relevant `docs/` folder for the highest existing number first.

## Boundaries
- Do NOT write implementation code, tests, or config.
- Do NOT mark anything approved.
- Keep each acceptance criterion independently testable.
